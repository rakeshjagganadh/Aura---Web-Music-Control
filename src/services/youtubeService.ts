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

let serverSearchConfigured: boolean | null = null;

export const youtubeService = {
  /**
   * Indicates whether YouTube playback/embed features are available.
   * Search relies strictly on the server-side /api/yt/search proxy (using YOUTUBE_API_KEY on the backend),
   * while direct YouTube URL/playlist embeds work via official oEmbed and IFrame API without a key.
   */
  isConfigured(): boolean {
    return serverSearchConfigured !== false;
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
   */
  parsePlaylistId(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim();

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
  async fetchPlaylistOEmbed(
    playlistId: string,
    fullInput?: string
  ): Promise<{ title: string; author: string; thumbnail: string } | null> {
    try {
      if (fullInput) {
        const videoMatch = fullInput.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
        if (videoMatch && videoMatch[1]) {
          const videoId = videoMatch[1];
          const videoOEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
          const vRes = await fetch(videoOEmbedUrl);
          if (vRes.ok) {
            const vData = await vRes.json();
            return {
              title: this.decodeHtmlEntities(vData.title || 'YouTube Playlist'),
              author: this.decodeHtmlEntities(vData.author_name || 'YouTube Creator'),
              thumbnail: vData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            };
          }
        }
      }

      const url = `https://www.youtube.com/playlist?list=${playlistId}`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          title: this.decodeHtmlEntities(data.title || 'YouTube Playlist'),
          author: this.decodeHtmlEntities(data.author_name || 'YouTube Playlist'),
          thumbnail: data.thumbnail_url || '',
        };
      }

      return {
        title: `YouTube Playlist (${playlistId.slice(0, 10)})`,
        author: 'YouTube Public Stream',
        thumbnail: '',
      };
    } catch {
      return {
        title: `YouTube Playlist (${playlistId.slice(0, 10)})`,
        author: 'YouTube Public Stream',
        thumbnail: '',
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
   * Search YouTube strictly via AURA's server-side official YouTube Data API v3 proxy (/api/yt/search).
   * Never stores credentials in the browser bundle and never queries unofficial scrapers.
   */
  async search(query: string, maxResults = 12): Promise<YouTubeSearchResult> {
    const q = query.trim();
    if (!q) {
      return { items: [], isConfigured: this.isConfigured() };
    }

    try {
      const backendBase = (
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_URL ||
        ''
      )
        .trim()
        .replace(/\/+$/, '');

      const searchUrl = `${backendBase}/api/yt/search?q=${encodeURIComponent(q)}&limit=${maxResults}`;
      const backendRes = await fetch(searchUrl);
      const contentType = backendRes.headers.get('content-type') || '';

      if (backendRes.ok && contentType.includes('application/json')) {
        const backendData = await backendRes.json();
        if (typeof backendData.configured === 'boolean') {
          serverSearchConfigured = backendData.configured;
        }

        if (backendData.configured === false) {
          return {
            items: [],
            isConfigured: false,
            error:
              backendData.warning ||
              'YouTube search requires a server-side YOUTUBE_API_KEY. Paste a YouTube URL directly to play.',
          };
        }

        if (backendData.items && Array.isArray(backendData.items) && backendData.items.length > 0) {
          const tracks: Track[] = backendData.items
            .filter((item: any) => Boolean(item.id))
            .map((item: any) => {
              const videoId = String(item.id);
              const title = this.decodeHtmlEntities(item.title || 'YouTube Video');
              const channelTitle = this.decodeHtmlEntities(item.artist || 'YouTube Creator');
              const coverUrl = item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              const duration = typeof item.duration === 'number' ? item.duration : 0;

              return {
                id: `yt-${videoId}`,
                title,
                artist: channelTitle,
                album: 'YouTube Embed',
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
      // Network or server unavailable
    }

    return {
      items: [],
      isConfigured: this.isConfigured(),
      error: this.isConfigured()
        ? 'No YouTube tracks found for this search.'
        : 'YouTube search is unavailable without a server YOUTUBE_API_KEY. Paste any YouTube URL to play.',
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
      album: 'YouTube Embed',
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
  },
};
