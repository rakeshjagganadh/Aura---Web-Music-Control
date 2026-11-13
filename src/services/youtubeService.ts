import { Track } from '../types';
import { YOUTUBE_EMBED_CAPABILITIES } from './sourceService';

export interface YouTubeSearchResult {
  items: Track[];
  isConfigured: boolean;
  error?: string;
}

export interface YouTubeOEmbedInfo {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
}

const LOCAL_STORAGE_KEY_YT_API = 'aura_custom_youtube_api_key';

export const youtubeService = {
  /**
   * Get YouTube Data API key from env or user storage
   */
  getApiKey(): string {
    // 1. Check Vite env variables
    const envKey = (import.meta as any).env?.VITE_YOUTUBE_DATA_API_KEY || (import.meta as any).env?.YOUTUBE_DATA_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
      return envKey.trim();
    }
    // 2. Check localStorage for user-provided key
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_YT_API);
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    } catch {
      // ignore
    }
    // 3. Built-in default key provided by user
    return 'AIzaSyAHWH5BxyEjggLoe_UMCtN_loplgnWCQPg';
  },

  /**
   * Set custom API key in browser storage
   */
  setCustomApiKey(key: string): void {
    try {
      if (key && key.trim()) {
        localStorage.setItem(LOCAL_STORAGE_KEY_YT_API, key.trim());
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_YT_API);
      }
    } catch {
      // ignore
    }
  },

  /**
   * Check if YouTube API search is configured (always true via official key or backend bridge)
   */
  isConfigured(): boolean {
    return true;
  },

  /**
   * Client-side search via public Invidious / Piped instances for high reliability
   */
  async searchViaPublicInstances(query: string, maxResults = 12): Promise<Track[]> {
    const q = encodeURIComponent(query.trim());
    const instances = [
      `https://inv.tux.pizza/api/v1/search?q=${q}&type=video`,
      `https://invidious.nerdvpn.de/api/v1/search?q=${q}&type=video`,
      `https://api.piped.video/search?q=${q}&filter=music_songs`,
    ];

    for (const url of instances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) continue;
        const data = await res.json();

        let items: any[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.items)) {
          items = data.items;
        }

        if (items.length > 0) {
          const tracks: Track[] = items
            .slice(0, maxResults)
            .map((item: any) => {
              const videoId =
                item.videoId ||
                (typeof item.url === 'string'
                  ? item.url.replace('/watch?v=', '')
                  : null);
              if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                return null;
              }
              const title = this.decodeHtmlEntities(item.title || 'YouTube Audio');
              const artist = this.decodeHtmlEntities(
                item.author || item.uploaderName || 'YouTube Artist'
              );
              const duration =
                typeof item.lengthSeconds === 'number'
                  ? item.lengthSeconds
                  : typeof item.duration === 'number'
                  ? item.duration
                  : 0;
              const coverUrl =
                item.videoThumbnails?.[0]?.url ||
                item.thumbnail ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

              return {
                id: `yt-${videoId}`,
                title,
                artist,
                album: 'YouTube Stream',
                duration,
                fileFormat: 'YOUTUBE',
                fileSize: 0,
                dateAdded: Date.now(),
                coverUrl,
                coverColor: 'from-red-700 via-zinc-900 to-black',
                source: 'youtube' as const,
                sourceId: videoId,
                sourceName: 'YouTube Embed',
                sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
                isAvailable: true,
                playbackCapability: YOUTUBE_EMBED_CAPABILITIES,
              };
            })
            .filter(Boolean) as Track[];

          if (tracks.length > 0) {
            return tracks;
          }
        }
      } catch {
        // try next instance
      }
    }
    return [];
  },

  /**
   * Parse any YouTube URL or raw Video ID and extract the 11-char video ID.
   */
  parseVideoId(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    try {
      const youtuBeMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed|v|shorts)\/)([a-zA-Z0-9_-]{11})/i);
      if (youtuBeMatch && youtuBeMatch[1]) {
        return youtuBeMatch[1];
      }

      const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
      if (watchMatch && watchMatch[1]) {
        return watchMatch[1];
      }

      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const url = new URL(clean);
        const vParam = url.searchParams.get('v');
        if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
          return vParam;
        }
      }
    } catch {
      // Not a valid URL
    }

    return null;
  },

  /**
   * Parse any YouTube or YouTube Music playlist URL or raw Playlist ID.
   * Handles:
   * - https://www.youtube.com/playlist?list=PL...
   * - https://music.youtube.com/playlist?list=PL...
   * - https://www.youtube.com/watch?v=...&list=PL...
   * - https://music.youtube.com/watch?v=...&list=PL...
   * - Raw playlist IDs: PL..., RD..., OLAK..., etc. (length >= 12)
   */
  parsePlaylistId(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim();

    // Check if raw playlist ID format (alphanumeric length 12-64, no dots or slashes)
    if (/^[a-zA-Z0-9_-]{12,64}$/.test(clean) && !clean.includes('.') && !clean.includes('/')) {
      return clean;
    }

    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const url = new URL(clean);
        const listParam = url.searchParams.get('list');
        if (listParam && /^[a-zA-Z0-9_-]{12,64}$/.test(listParam)) {
          return listParam;
        }
      }
    } catch {
      // not a full URL
    }

    const match = clean.match(/[?&]list=([a-zA-Z0-9_-]{12,64})/i);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  },

  /**
   * Fetches official oEmbed metadata for a YouTube playlist or video-linked playlist
   */
  async fetchPlaylistOEmbed(playlistId: string, fullInput?: string): Promise<{ title: string; author: string; thumbnail: string } | null> {
    try {
      // 1. If full input has a video ID (e.g. watch?v=...&list=...), query oEmbed on the video
      if (fullInput) {
        const videoMatch = fullInput.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
        if (videoMatch && videoMatch[1]) {
          const videoId = videoMatch[1];
          const videoOEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
          const vRes = await fetch(videoOEmbedUrl);
          if (vRes.ok) {
            const vData = await vRes.json();
            return {
              title: this.decodeHtmlEntities(vData.title || `YouTube Playlist`),
              author: this.decodeHtmlEntities(vData.author_name || 'YouTube Creator'),
              thumbnail: vData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            };
          }
        }
      }

      // 2. Query oEmbed directly for playlist
      const url = `https://www.youtube.com/playlist?list=${playlistId}`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          title: this.decodeHtmlEntities(data.title || `YouTube Playlist`),
          author: this.decodeHtmlEntities(data.author_name || 'YouTube Playlist'),
          thumbnail: data.thumbnail_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        };
      }

      // 3. Fallback with verified AURA music asset
      return {
        title: `YouTube Playlist (${playlistId.slice(0, 10)})`,
        author: 'YouTube Public Stream',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      };
    } catch {
      return {
        title: `YouTube Playlist (${playlistId.slice(0, 10)})`,
        author: 'YouTube Public Stream',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      };
    }
  },

  /**
   * Fetches official oEmbed data (title, author, thumbnail) without needing an API key.
   */
  async fetchOEmbed(videoId: string): Promise<YouTubeOEmbedInfo | null> {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (!res.ok) return null;
      const data: YouTubeOEmbedInfo = await res.json();
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Decode HTML entities in strings returned by YouTube API (e.g. &amp;, &#39;, &quot;)
   */
  decodeHtmlEntities(text: string): string {
    if (!text) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  },

  /**
   * Search YouTube: attempts official Google YouTube Data API v3 first,
   * then public instances fallback, and finally AURA backend search (/api/yt/search).
   */
  async search(query: string, maxResults = 12): Promise<YouTubeSearchResult> {
    const q = query.trim();
    if (!q) {
      return { items: [], isConfigured: true };
    }

    const apiKey = this.getApiKey();

    // 1. Try Google YouTube Data API v3 if API key is present
    if (apiKey) {
      try {
        const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}&q=${encodeURIComponent(q)}&key=${apiKey}`;
        const response = await fetch(endpoint);

        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            const tracks: Track[] = data.items
              .filter((item: any) => item.id?.videoId)
              .map((item: any) => {
                const videoId = item.id.videoId;
                const snippet = item.snippet || {};
                const title = this.decodeHtmlEntities(snippet.title || `YouTube Audio`);
                const channelTitle = this.decodeHtmlEntities(snippet.channelTitle || 'YouTube Creator');
                const coverUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;

                return {
                  id: `yt-${videoId}`,
                  title,
                  artist: channelTitle,
                  album: 'YouTube Stream',
                  duration: 0,
                  fileFormat: 'YOUTUBE',
                  fileSize: 0,
                  dateAdded: Date.now(),
                  coverUrl,
                  coverColor: 'from-red-700 via-zinc-900 to-black',
                  source: 'youtube' as const,
                  sourceId: videoId,
                  sourceName: 'YouTube Embed',
                  sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
                  isAvailable: true,
                  playbackCapability: YOUTUBE_EMBED_CAPABILITIES,
                };
              });

            if (tracks.length > 0) {
              return { items: tracks, isConfigured: true };
            }
          }
        }
      } catch {
        // Fall back
      }
    }

    // 2. Public Invidious / Piped API search fallback (resilient to browser CORS and serverless)
    try {
      const publicTracks = await this.searchViaPublicInstances(q, maxResults);
      if (publicTracks.length > 0) {
        return { items: publicTracks, isConfigured: true };
      }
    } catch {
      // Fall back
    }

    // 3. High-resilience fallback: query AURA's backend search (/api/yt/search)
    try {
      const backendBase = (
        (import.meta as any).env?.VITE_BACKEND_URL ||
        (import.meta as any).env?.VITE_API_URL ||
        ''
      ).trim().replace(/\/+$/, '');

      const searchUrl = `${backendBase}/api/yt/search?q=${encodeURIComponent(q)}&limit=${maxResults}`;
      const backendRes = await fetch(searchUrl);
      const contentType = backendRes.headers.get('content-type') || '';

      if (backendRes.ok && contentType.includes('application/json')) {
        const backendData = await backendRes.json();
        if (backendData.items && Array.isArray(backendData.items) && backendData.items.length > 0) {
          const tracks: Track[] = backendData.items
            .filter((item: any) => item.id)
            .map((item: any) => {
              const videoId = item.id;
              const title = this.decodeHtmlEntities(item.title || `YouTube Audio`);
              const channelTitle = this.decodeHtmlEntities(item.artist || 'YouTube Creator');
              const coverUrl = item.thumbnail;
              const duration = typeof item.duration === 'number' ? item.duration : 0;

              return {
                id: `yt-${videoId}`,
                title,
                artist: channelTitle,
                album: 'YouTube Stream',
                duration,
                fileFormat: 'YOUTUBE',
                fileSize: 0,
                dateAdded: Date.now(),
                coverUrl,
                coverColor: 'from-red-700 via-zinc-900 to-black',
                source: 'youtube' as const,
                sourceId: videoId,
                sourceName: 'YouTube Embed',
                sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
                isAvailable: true,
                playbackCapability: YOUTUBE_EMBED_CAPABILITIES,
              };
            });

          return {
            items: tracks,
            isConfigured: true,
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      items: [],
      isConfigured: true,
      error: 'No YouTube tracks found for this search.',
    };
  },

  /**
   * Helper to build a Track object from a videoId and optional metadata
   */
  createTrack(videoId: string, title?: string, artist?: string, coverUrl?: string): Track {
    return {
      id: `yt-${videoId}`,
      title: title || `YouTube Track (${videoId})`,
      artist: artist || 'YouTube Embed',
      album: 'YouTube Stream',
      duration: 0,
      fileFormat: 'YOUTUBE',
      fileSize: 0,
      dateAdded: Date.now(),
      coverUrl,
      coverColor: 'from-red-700 via-zinc-900 to-black',
      source: 'youtube',
      sourceId: videoId,
      sourceName: 'YouTube Embed',
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      isAvailable: true,
      playbackCapability: YOUTUBE_EMBED_CAPABILITIES,
    };
  },

  /**
   * Map official YouTube IFrame Player error codes to human-readable explanations
   */
  getErrorMessage(code: number): string {
    switch (code) {
      case 2:
        return 'Invalid YouTube video ID or request parameters.';
      case 5:
        return 'HTML5 playback error occurred in YouTube player.';
      case 100:
        return 'This YouTube video is unavailable, deleted, or marked private.';
      case 101:
      case 150:
        return 'The owner of this video does not allow embedded playback.';
      default:
        return `YouTube player error (code ${code}).`;
    }
  }
};
