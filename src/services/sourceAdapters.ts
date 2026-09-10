import { Track, Playlist, MusicSourceType } from '../types';
import { youtubeService } from './youtubeService';
import { audiusService } from './audiusService';
import { CURATED_DISCOVERY_TRACKS } from './discoveryService';

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
 * Universal Search Coordinator orchestrates all adapters cleanly
 */
export class UniversalSearchCoordinator {
  private localAdapter = new LocalSourceAdapter();
  private youtubeAdapter = new YouTubeSourceAdapter();
  private audiusAdapter = new AudiusSourceAdapter();
  private openCatalogAdapter = new OpenCatalogSourceAdapter();

  async search(
    query: string,
    context: { tracks: Track[]; playlists: Playlist[] },
    options: { includeYouTube?: boolean; includeAudius?: boolean } = { includeYouTube: true, includeAudius: true }
  ): Promise<UniversalSearchResults> {
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

    // 3. Run YouTube search if requested and not just local
    let ytSongs: Track[] = [];
    let ytStatus: 'ready' | 'not_configured' | 'searching' | 'error' | 'disabled' = 'disabled';
    let ytError: string | undefined;

    if (options.includeYouTube && cleanQuery.length > 1) {
      if (detectedDirectTrack) {
        ytSongs = [detectedDirectTrack];
        ytStatus = 'ready';
      } else {
        const ytRes = await this.youtubeAdapter.search(cleanQuery, context);
        ytSongs = ytRes.songs;
        ytStatus = ytRes.status as any;
        ytError = ytRes.error;
      }
    } else if (!youtubeService.isConfigured()) {
      ytStatus = 'not_configured';
    } else {
      ytStatus = 'ready';
    }

    // 4. Run Audius search in parallel if requested
    let audiusSongs: Track[] = [];
    let audiusStatus: 'ready' | 'searching' | 'error' | 'disabled' = 'disabled';
    let audiusError: string | undefined;

    if (options.includeAudius && cleanQuery.length > 1) {
      try {
        const audiusRes = await this.audiusAdapter.search(cleanQuery, context);
        audiusSongs = audiusRes.songs;
        audiusStatus = audiusRes.status as any;
        audiusError = audiusRes.error;
      } catch (err: any) {
        audiusStatus = 'error';
        audiusError = err?.message || 'Audius search failed';
      }
    } else {
      audiusStatus = 'ready';
    }

    // Deduplicate songs by ID
    const songMap = new Map<string, Track>();
    localResult.songs.forEach((s) => songMap.set(s.id, s));
    audiusSongs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });
    ytSongs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });
    openCatalogResult.songs.forEach((s) => {
      if (!songMap.has(s.id)) songMap.set(s.id, s);
    });

    return {
      query: cleanQuery,
      songs: Array.from(songMap.values()),
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
      },
    };
  }
}

export const universalSearchCoordinator = new UniversalSearchCoordinator();
