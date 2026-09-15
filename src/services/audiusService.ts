import { Track, TrackCapabilities } from '../types';

export const AUDIUS_CAPABILITIES: TrackCapabilities = {
  basicPlayback: true,
  seek: true,
  volume: true,
  eq: true,
  effects: true,
  spatial: true,
  pitch: true,
  tempo: true,
  loop: true,
  trim: false,
  export: false,
  advancedProcessing: false,
};

export interface AudiusRawTrack {
  id: string;
  title: string;
  duration?: number;
  genre?: string;
  mood?: string;
  release_date?: string;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
    mirrors?: string[];
  };
  user?: {
    id?: string;
    name?: string;
    handle?: string;
  };
  play_count?: number;
  favorite_count?: number;
  repost_count?: number;
}

class AudiusService {
  private defaultHost = 'https://api.audius.co';
  private appName = 'AURA_STUDIO';
  private resolvedHost: string | null = null;
  private isResolvingHost = false;

  constructor() {
    const envAppName = (import.meta as any).env?.VITE_AUDIUS_APP_NAME;
    if (envAppName) {
      this.appName = envAppName;
    }
  }

  /**
   * Get public gateway host.
   * Auto-resolves from https://api.audius.co or uses fallback.
   */
  public async getHost(): Promise<string> {
    if (this.resolvedHost) return this.resolvedHost;
    if (this.isResolvingHost) return this.defaultHost;

    try {
      this.isResolvingHost = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(this.defaultHost, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          this.resolvedHost = json.data[0];
          return this.resolvedHost!;
        }
      }
    } catch {
      // Fallback silently to defaultHost
    } finally {
      this.isResolvingHost = false;
    }

    this.resolvedHost = this.defaultHost;
    return this.resolvedHost;
  }

  /**
   * Generates public stream URL for an Audius track.
   * Redirects via HTTP 302 to high-speed CORS-enabled decentralized audio node.
   */
  public getStreamUrl(trackId: string | number, host = this.resolvedHost || this.defaultHost): string {
    const cleanHost = host.replace(/\/$/, '');
    const rawClean = String(trackId).replace(/^audius-/, '').trim();
    const cleanId = encodeURIComponent(rawClean);
    return `${cleanHost}/v1/tracks/${cleanId}/stream?app_name=${encodeURIComponent(this.appName)}`;
  }

  /**
   * Convert public Audius API track to standard AURA Track model
   */
  public createTrack(raw: AudiusRawTrack, host?: string): Track {
    const activeHost = host || this.resolvedHost || this.defaultHost;
    const coverUrl =
      raw.artwork?.['480x480'] ||
      raw.artwork?.['1000x1000'] ||
      raw.artwork?.['150x150'];

    const streamUrl = this.getStreamUrl(raw.id, activeHost);
    const cleanSourceId = String(raw.id).replace(/^audius-/, '');

    return {
      id: `audius-${cleanSourceId}`,
      title: raw.title ? raw.title.trim() : `Audius Track (${cleanSourceId})`,
      artist: raw.user?.name ? raw.user.name.trim() : raw.user?.handle || 'Audius Creator',
      album: raw.genre ? `${raw.genre} • Audius` : 'Audius Open Stream',
      duration: raw.duration || 0,
      fileFormat: 'AUDIUS / MP3',
      fileSize: 0,
      dateAdded: Date.now(),
      coverUrl,
      coverColor: 'from-fuchsia-600 via-purple-800 to-zinc-950',
      genre: raw.genre,
      source: 'audius',
      sourceId: cleanSourceId,
      sourceName: 'Audius',
      sourceUrl: `https://audius.co/tracks/${cleanSourceId}`,
      audioUrl: streamUrl,
      externalStreamUrl: streamUrl,
      isAvailable: true,
      playbackCapability: AUDIUS_CAPABILITIES,
    };
  }

  /**
   * Search tracks on Audius by title, artist, or keywords
   */
  public async search(query: string, limit = 12): Promise<{ items: Track[]; error?: string }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return { items: [] };

    try {
      const host = await this.getHost();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const endpoint = `${host}/v1/tracks/search?query=${encodeURIComponent(cleanQuery)}&limit=${limit}&app_name=${encodeURIComponent(this.appName)}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          items: [],
          error: `Audius search HTTP ${res.status}`,
        };
      }

      const json = await res.json();
      if (!json || !Array.isArray(json.data)) {
        return { items: [] };
      }

      const tracks: Track[] = json.data.map((item: AudiusRawTrack) =>
        this.createTrack(item, host)
      );

      return { items: tracks };
    } catch (err: any) {
      console.warn('Audius search error (non-fatal):', err?.message || err);
      return {
        items: [],
        error: err?.name === 'AbortError' ? 'Audius search timed out' : 'Audius search unavailable',
      };
    }
  }

  /**
   * Fetch Trending Tracks from Audius
   */
  public async getTrending(limit = 10, genre?: string): Promise<{ items: Track[]; error?: string }> {
    try {
      const host = await this.getHost();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      let endpoint = `${host}/v1/tracks/trending?limit=${limit}&app_name=${encodeURIComponent(this.appName)}`;
      if (genre) {
        endpoint += `&genre=${encodeURIComponent(genre)}`;
      }

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        return { items: [], error: `Audius trending HTTP ${res.status}` };
      }

      const json = await res.json();
      if (!json || !Array.isArray(json.data)) {
        return { items: [] };
      }

      const tracks: Track[] = json.data.map((item: AudiusRawTrack) =>
        this.createTrack(item, host)
      );

      return { items: tracks };
    } catch (err: any) {
      console.warn('Audius trending error (non-fatal):', err?.message || err);
      return {
        items: [],
        error: err?.name === 'AbortError' ? 'Audius trending timed out' : 'Audius trending unavailable',
      };
    }
  }

  /**
   * Fetch Single Track Metadata
   */
  public async getTrack(trackId: string): Promise<Track | null> {
    try {
      const host = await this.getHost();
      const cleanId = encodeURIComponent(trackId);
      const res = await fetch(
        `${host}/v1/tracks/${cleanId}?app_name=${encodeURIComponent(this.appName)}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.data) return null;
      return this.createTrack(json.data, host);
    } catch {
      return null;
    }
  }
}

export const audiusService = new AudiusService();
