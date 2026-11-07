import { Track, Playlist, MusicSourceType } from '../types';
import { youtubeService } from './youtubeService';
import { audiusService } from './audiusService';
import { CURATED_DISCOVERY_TRACKS } from './discoveryService';
import { jamendoProvider } from './providers/jamendoProvider';
import { radioBrowserProvider } from './providers/radioBrowserProvider';
import { unifiedTrackToAuraTrack, radioStationToAuraTrack } from './providers/types';

export interface SearchMatchArtist {
  name: string;
  trackCount: number;
  sampleCover?: string;
  source: MusicSourceType;
}

export interface SearchMatchAlbum {
  name: string;
  artist: string;
  trackCount: number;
  coverUrl?: string;
  coverGradient?: string;
  source: MusicSourceType;
}

export interface SearchMatchPlaylist {
  id: string;
  title: string;
  trackCount: number;
  coverGradient: string;
  description?: string;
}

export interface UniversalSearchResults {
  query: string;
  songs: Track[];
  artists: SearchMatchArtist[];
  albums: SearchMatchAlbum[];
  playlists: SearchMatchPlaylist[];
  
  // Direct URL detection state
  detectedDirectTrack?: Track | null;
  
  // Source provider statuses
  sourceStatus: {
    local: 'ready' | 'empty';
    youtube: 'ready' | 'not_configured' | 'searching' | 'error' | 'disabled';
    youtubeError?: string;
    audius: 'ready' | 'searching' | 'error' | 'disabled';
    audiusError?: string;
    jamendo?: 'ready' | 'searching' | 'error' | 'disabled';
    jamendoError?: string;
    radiobrowser?: 'ready' | 'searching' | 'error' | 'disabled';
    radiobrowserError?: string;
  };
}

export interface ISourceSearchAdapter {
  sourceId: MusicSourceType;
  name: string;
  search(query: string, context: { tracks: Track[]; playlists: Playlist[] }): Promise<{
    songs: Track[];
    artists?: SearchMatchArtist[];
    albums?: SearchMatchAlbum[];
    playlists?: SearchMatchPlaylist[];
    status: string;
    error?: string;
  }>;
}

/**
 * Local Source Adapter: Searches user's IndexedDB library instant and offline
 */
export class LocalSourceAdapter implements ISourceSearchAdapter {
  sourceId: MusicSourceType = 'local';
  name = 'Local Library';

  async search(query: string, context: { tracks: Track[]; playlists: Playlist[] }) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        status: 'ready',
      };
    }

    const localTracks = context.tracks.filter((t) => !t.source || t.source === 'local');

    // 1. Match Songs
    const matchingSongs = localTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.fileFormat && t.fileFormat.toLowerCase().includes(q))
    );

    // 2. Match Artists
    const artistMap = new Map<string, { count: number; sampleCover?: string }>();
    localTracks.forEach((t) => {
      const art = t.artist.trim();
      if (art && art.toLowerCase().includes(q)) {
        const existing = artistMap.get(art) || { count: 0, sampleCover: t.coverUrl };
        existing.count += 1;
        if (!existing.sampleCover && t.coverUrl) existing.sampleCover = t.coverUrl;
        artistMap.set(art, existing);
      }
    });

    const matchingArtists: SearchMatchArtist[] = Array.from(artistMap.entries()).map(
      ([name, data]) => ({
        name,
        trackCount: data.count,
        sampleCover: data.sampleCover,
        source: 'local',
      })
    );

    // 3. Match Albums
    const albumMap = new Map<string, { artist: string; count: number; coverUrl?: string; coverGradient?: string }>();
    localTracks.forEach((t) => {
      const alb = t.album.trim();
      if (alb && alb.toLowerCase().includes(q)) {
        const key = `${alb}___${t.artist}`;
        const existing = albumMap.get(key) || {
          artist: t.artist,
          count: 0,
          coverUrl: t.coverUrl,
          coverGradient: t.coverColor,
        };
        existing.count += 1;
        albumMap.set(key, existing);
      }
    });

    const matchingAlbums: SearchMatchAlbum[] = Array.from(albumMap.entries()).map(
      ([key, data]) => {
        const albName = key.split('___')[0];
        return {
          name: albName,
          artist: data.artist,
          trackCount: data.count,
          coverUrl: data.coverUrl,
          coverGradient: data.coverGradient,
          source: 'local',
        };
      }
    );

    // 4. Match Playlists
    const matchingPlaylists: SearchMatchPlaylist[] = context.playlists
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
      .map((p) => ({
        id: p.id,
        title: p.title,
        trackCount: p.trackIds.length,
        coverGradient: p.coverGradient,
        description: p.description,
      }));

    return {
      songs: matchingSongs,
      artists: matchingArtists,
      albums: matchingAlbums,
      playlists: matchingPlaylists,
      status: matchingSongs.length > 0 ? 'ready' : 'empty',
    };
  }
}

/**
 * YouTube Source Adapter: Queries YouTube Data API v3 and detects direct video URLs
 */
export class YouTubeSourceAdapter implements ISourceSearchAdapter {
  sourceId: MusicSourceType = 'youtube';
  name = 'YouTube';

  async search(query: string, _context: { tracks: Track[]; playlists: Playlist[] }) {
    const q = query.trim();
    if (!q) {
      return { songs: [], status: youtubeService.isConfigured() ? 'ready' : 'not_configured' };
    }

    // Check if query is a direct video ID or YouTube URL
    const parsedId = youtubeService.parseVideoId(q);
    if (parsedId) {
      // Attempt oEmbed resolution to get authentic title and author
      const oembed = await youtubeService.fetchOEmbed(parsedId);
      const directTrack = youtubeService.createTrack(
        parsedId,
        oembed?.title || `YouTube Video (${parsedId})`,
        oembed?.author_name || 'YouTube Channel',
        oembed?.thumbnail_url
      );
      return {
        songs: [directTrack],
        status: 'ready',
      };
    }

    // If query is standard text, check if API key is present
    if (!youtubeService.isConfigured()) {
      return {
        songs: [],
        status: 'not_configured',
        error: 'YouTube API is not connected. Configure YOUTUBE_DATA_API_KEY in environment or settings for live YouTube search.',
      };
    }

    const result = await youtubeService.search(q, 10);
    return {
      songs: result.items,
      status: result.error ? 'error' : 'ready',
      error: result.error,
    };
  }
}

/**
 * Open Streams & Curated Catalog Adapter
 */
export class OpenCatalogSourceAdapter implements ISourceSearchAdapter {
  sourceId: MusicSourceType = 'curated_stream';
  name = 'Aura Open Audio';

  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { songs: CURATED_DISCOVERY_TRACKS.slice(0, 4), status: 'ready' };
    }

    const matched = CURATED_DISCOVERY_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
    );

    return {
      songs: matched,
      status: 'ready',
    };
  }
}

/**
 * Audius Source Adapter: Queries public decentralized Audius music catalog
 */
export class AudiusSourceAdapter implements ISourceSearchAdapter {
  sourceId: MusicSourceType = 'audius';
  name = 'Audius';

  async search(query: string, _context: { tracks: Track[]; playlists: Playlist[] }) {
    const q = query.trim();
    if (!q) {
      return { songs: [], status: 'ready' };
    }

    try {
      const result = await audiusService.search(q, 10);
      return {
        songs: result.items,
        status: result.error ? 'error' : 'ready',
        error: result.error,
      };
    } catch (err: any) {
      return {
        songs: [],
        status: 'error',
        error: err?.message || 'Audius search failed',
      };
    }
  }
}

/**
 * Jamendo Source Adapter: Queries free Creative Commons tracks via Jamendo API
 */
export class JamendoSourceAdapter implements ISourceSearchAdapter {
  sourceId: MusicSourceType = 'jamendo';
  name = 'Jamendo';

  async search(query: string, _context: { tracks: Track[]; playlists: Playlist[] }) {
    const q = query.trim();
    if (!q) {
      return { songs: [], status: 'ready' };
    }

    try {
      const res = await jamendoProvider.search(q, { limit: 12 });
      const auraTracks = res.tracks.map((u) => unifiedTrackToAuraTrack(u));
      return {
        songs: auraTracks,
        status: res.status === 'success' ? 'ready' : res.status,
        error: res.error,
      };
    } catch (err: any) {
      return {
        songs: [],
        status: 'error',
        error: err?.message || 'Jamendo search failed',
      };
    }
  }
}

/**
 * Radio Browser Source Adapter: Queries global internet radio stations
 */
export class RadioBrowserSourceAdapter implements ISourceSearchAdapter {
  sourceId: MusicSourceType = 'radiobrowser';
  name = 'Radio Browser';

  async search(query: string, _context: { tracks: Track[]; playlists: Playlist[] }) {
    const q = query.trim();
    if (!q) {
      return { songs: [], status: 'ready' };
    }

    try {
      const res = await radioBrowserProvider.search(q, { limit: 12 });
      const auraTracks = res.tracks.map((u) => unifiedTrackToAuraTrack(u));
      return {
        songs: auraTracks,
        status: res.status === 'success' ? 'ready' : res.status,
        error: res.error,
      };
    } catch (err: any) {
      return {
        songs: [],
        status: 'error',
        error: err?.message || 'Radio Browser search failed',
      };
    }
  }
}

/**
 * Universal Search Coordinator orchestrates all adapters cleanly
 */
export class UniversalSearchCoordinator {
  private localAdapter = new LocalSourceAdapter();
  private youtubeAdapter = new YouTubeSourceAdapter();
  private audiusAdapter = new AudiusSourceAdapter();
  private jamendoAdapter = new JamendoSourceAdapter();
  private radioBrowserAdapter = new RadioBrowserSourceAdapter();
  private openCatalogAdapter = new OpenCatalogSourceAdapter();

  private activeSearchSequence = 0;

  async search(
    query: string,
    context: { tracks: Track[]; playlists: Playlist[] },
    options: { 
      includeYouTube?: boolean; 
      includeAudius?: boolean;
      includeJamendo?: boolean;
      includeRadio?: boolean;
    } = { 
      includeYouTube: true, 
      includeAudius: true,
      includeJamendo: true,
      includeRadio: true,
    }
  ): Promise<UniversalSearchResults> {
    const sequenceId = ++this.activeSearchSequence;
    const cleanQuery = query.trim();

    // Check direct YouTube URL or raw video ID first
    let detectedDirectTrack: Track | null = null;
    const directVideoId = youtubeService.parseVideoId(cleanQuery);
    if (directVideoId) {
      try {
        const oembed = await youtubeService.fetchOEmbed(directVideoId);
        detectedDirectTrack = youtubeService.createTrack(
          directVideoId,
          oembed?.title || `YouTube Video (${directVideoId})`,
          oembed?.author_name || 'YouTube Channel',
          oembed?.thumbnail_url
        );
      } catch {
        detectedDirectTrack = youtubeService.createTrack(directVideoId);
      }
    }

    // 1. Run local search immediately
    const localResult = await this.localAdapter.search(cleanQuery, context);

    // 2. Run open catalog search
    const openCatalogResult = await this.openCatalogAdapter.search(cleanQuery);

    // 3. Parallel federated remote queries with complete error isolation
    const shouldSearchExternal = cleanQuery.length > 1;

    let ytSongs: Track[] = [];
    let ytStatus: 'ready' | 'not_configured' | 'searching' | 'error' | 'disabled' = 'disabled';
    let ytError: string | undefined;

    let audiusSongs: Track[] = [];
    let audiusStatus: 'ready' | 'searching' | 'error' | 'disabled' = 'disabled';
    let audiusError: string | undefined;

    let jamendoSongs: Track[] = [];
    let jamendoStatus: 'ready' | 'searching' | 'error' | 'disabled' = 'disabled';
    let jamendoError: string | undefined;

    let radioSongs: Track[] = [];
    let radioStatus: 'ready' | 'searching' | 'error' | 'disabled' = 'disabled';
    let radioError: string | undefined;

    if (shouldSearchExternal) {
      const tasks: Promise<void>[] = [];

      // YouTube
      if (options.includeYouTube !== false) {
        if (detectedDirectTrack) {
          ytSongs = [detectedDirectTrack];
          ytStatus = 'ready';
        } else if (youtubeService.isConfigured()) {
          tasks.push(
            (async () => {
              try {
                const ytRes = await this.youtubeAdapter.search(cleanQuery, context);
                ytSongs = ytRes.songs;
                ytStatus = ytRes.status as any;
                ytError = ytRes.error;
              } catch (e: any) {
                ytStatus = 'error';
                ytError = e?.message;
              }
            })()
          );
        } else {
          ytStatus = 'not_configured';
        }
      }

      // Audius
      if (options.includeAudius !== false) {
        tasks.push(
          (async () => {
            try {
              const res = await this.audiusAdapter.search(cleanQuery, context);
              audiusSongs = res.songs;
              audiusStatus = res.status as any;
              audiusError = res.error;
            } catch (e: any) {
              audiusStatus = 'error';
              audiusError = e?.message;
            }
          })()
        );
      }

      // Jamendo
      if (options.includeJamendo !== false) {
        tasks.push(
          (async () => {
            try {
              const res = await this.jamendoAdapter.search(cleanQuery, context);
              jamendoSongs = res.songs;
              jamendoStatus = res.status as any;
              jamendoError = res.error;
            } catch (e: any) {
              jamendoStatus = 'error';
              jamendoError = e?.message;
            }
          })()
        );
      }

      // Radio Browser
      if (options.includeRadio !== false) {
        tasks.push(
          (async () => {
            try {
              const res = await this.radioBrowserAdapter.search(cleanQuery, context);
              radioSongs = res.songs;
              radioStatus = res.status as any;
              radioError = res.error;
            } catch (e: any) {
              radioStatus = 'error';
              radioError = e?.message;
            }
          })()
        );
      }

      await Promise.allSettled(tasks);
    } else {
      ytStatus = youtubeService.isConfigured() ? 'ready' : 'not_configured';
      audiusStatus = 'ready';
      jamendoStatus = 'ready';
      radioStatus = 'ready';
    }

    // Deduplicate songs by ID
    const songMap = new Map<string, Track>();
    localResult.songs.forEach((s) => songMap.set(s.id, s));
    jamendoSongs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });
    audiusSongs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });
    radioSongs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });
    ytSongs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });
    openCatalogResult.songs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });

    const allSongs = Array.from(songMap.values());

    // Provider-aware relevance ranking (Exact Match > Title Prefix > Artist Match > Partial)
    const qLower = cleanQuery.toLowerCase();
    const rankedSongs = allSongs.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      const artistA = a.artist.toLowerCase();
      const artistB = b.artist.toLowerCase();

      const getScore = (t: string, art: string) => {
        if (t === qLower) return 100;
        if (art === qLower) return 90;
        if (t.startsWith(qLower)) return 80;
        if (art.startsWith(qLower)) return 70;
        if (t.includes(qLower)) return 50;
        if (art.includes(qLower)) return 40;
        return 10;
      };

      return getScore(titleB, artistB) - getScore(titleA, artistA);
    });

    return {
      query: cleanQuery,
      songs: rankedSongs,
      artists: localResult.artists || [],
      albums: localResult.albums || [],
      playlists: localResult.playlists || [],
      detectedDirectTrack,
      sourceStatus: {
        local: localResult.songs.length > 0 ? 'ready' : 'empty',
        youtube: ytStatus,
        youtubeError: ytError,
        audius: audiusStatus,
        audiusError: audiusError,
        jamendo: jamendoStatus,
        jamendoError: jamendoError,
        radiobrowser: radioStatus,
        radiobrowserError: radioError,
      },
    };
  }
}

export const universalSearchCoordinator = new UniversalSearchCoordinator();
