/**
 * AURA 2.0 - Universal Source Engine
 * Jamendo Official API Provider (Creative Commons & Free Independent Music)
 */

import {
  IMusicProvider,
  ProviderId,
  ProviderType,
  ProviderCapabilities,
  ProviderAttribution,
  UnifiedTrack,
  PlaybackDescriptor,
  SearchFilter,
  ProviderSearchResult,
  DiscoveryOptions
} from './types';

export interface JamendoTrackRaw {
  id: string;
  name: string;
  duration: number; // seconds
  artist_id: string;
  artist_name: string;
  artist_idstr?: string;
  album_name?: string;
  album_id?: string;
  license_cc?: string;
  position?: number;
  releasedate?: string;
  album_image?: string;
  image?: string;
  audio?: string;
  audiodownload?: string;
  prourl?: string;
  shorturl?: string;
  shareurl?: string;
  musicinfo?: {
    vocalinstrumental?: string;
    lang?: string;
    gender?: string;
    acousticelectric?: string;
    speed?: string;
    tags?: {
      genres?: string[];
      instruments?: string[];
      vartags?: string[];
    };
  };
}

export class JamendoProvider implements IMusicProvider {
  readonly id: ProviderId = 'jamendo';
  readonly name = 'Jamendo';
  readonly type: ProviderType = 'direct_stream';

  private baseUrl = 'https://api.jamendo.com/v3.0';
  private defaultClientId = 'b6747d04';
  private fallbackClientIds = ['b6747d04', 'c6c39f04', '56b40f48', '35064c1f', '709fa152', 'a9a8ecf2', '00a4d0f5'];

  readonly capabilities: ProviderCapabilities = {
    canSearch: true,
    canStreamDirect: true,
    canEmbed: false,
    canSeek: true,
    canApplyWebAudioDsp: true, // Jamendo direct MP3 streams support open CORS!
    canPlayInBackground: true,
    canCacheOffline: false,
    isLiveStream: false,
    supportsPlaylists: true,
  };

  readonly attribution: ProviderAttribution = {
    providerName: 'Jamendo Music',
    providerUrl: 'https://www.jamendo.com',
    licenseName: 'Creative Commons',
    licenseUrl: 'https://creativecommons.org/licenses/',
    notice: 'Free music provided by independent artists via Jamendo API under Creative Commons licenses.',
  };

  private getClientIdsToTry(): string[] {
    const envKey = import.meta.env.VITE_JAMENDO_CLIENT_ID;
    if (envKey && envKey.trim()) {
      return [envKey.trim(), ...this.fallbackClientIds];
    }
    return this.fallbackClientIds;
  }

  private async fetchJamendoApi(
    endpoint: string,
    params: Record<string, string>,
    timeoutMs = 5000
  ): Promise<{ json: any; usedClientId: string } | null> {
    const clientIds = this.getClientIdsToTry();

    for (const cid of clientIds) {
      try {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.set('client_id', cid);
        url.searchParams.set('format', 'json');
        
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            url.searchParams.set(k, v);
          }
        });

        const res = await fetch(url.toString(), {
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) continue;

        const json = await res.json();
        
        if (json.headers?.status === 'failed') continue;
        if (json.headers?.warnings?.includes('exceeded') && (!json.results || json.results.length === 0)) continue;

        if (Array.isArray(json.results)) {
          return { json, usedClientId: cid };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  public async isAvailable(): Promise<boolean> {
    const res = await this.fetchJamendoApi('/tracks/', { limit: '1' }, 3000);
    return res !== null;
  }

  private mapJamendoTrack(raw: JamendoTrackRaw): UnifiedTrack {
    const rawId = String(raw.id);
    const artwork = raw.image || raw.album_image || '';
    const genres = raw.musicinfo?.tags?.genres || [];
    const genreStr = genres.length > 0 ? genres[0] : undefined;
    const year = raw.releasedate ? parseInt(raw.releasedate.slice(0, 4), 10) : undefined;
    const audioStream = raw.audio || raw.audiodownload || '';

    return {
      id: `jamendo-${rawId}`,
      providerId: this.id,
      title: raw.name ? raw.name.trim() : `Jamendo Track ${rawId}`,
      artist: raw.artist_name ? raw.artist_name.trim() : 'Jamendo Artist',
      album: raw.album_name ? raw.album_name.trim() : 'Jamendo Catalog',
      duration: raw.duration || 0,
      fileFormat: 'JAMENDO / MP3',
      artworkUrl: artwork,
      streamUrl: audioStream,
      streamType: 'direct_audio',
      genre: genreStr,
      releaseYear: isNaN(year!) ? undefined : year,
      capabilities: { ...this.capabilities },
      attribution: {
        ...this.attribution,
        licenseName: raw.license_cc ? `Creative Commons (${raw.license_cc})` : 'Creative Commons',
        licenseUrl: raw.license_cc || 'https://creativecommons.org/',
        artistUrl: raw.shorturl || raw.shareurl || `https://www.jamendo.com/artist/${raw.artist_id}`,
        notice: `Licensed under Creative Commons by ${raw.artist_name} on Jamendo.`,
      },
      sourceUrl: raw.shareurl || raw.shorturl || `https://www.jamendo.com/track/${rawId}`,
      rawMetadata: raw as unknown as Record<string, unknown>,
    };
  }

  public async search(query: string, options?: SearchFilter): Promise<ProviderSearchResult> {
    const start = performance.now();
    const cleanQuery = query.trim();
    const limit = options?.limit || 12;

    if (!cleanQuery) {
      return {
        providerId: this.id,
        providerName: this.name,
        tracks: [],
        status: 'empty',
        latencyMs: 0,
      };
    }

    try {
      // 1. Primary search using namesearch
      let apiResult = await this.fetchJamendoApi('/tracks/', {
        limit: String(limit),
        namesearch: cleanQuery,
        include: 'musicinfo',
        audioformat: 'mp32',
      });

      // 2. Fallback search using general search parameter if namesearch yields 0 results
      if (!apiResult || !apiResult.json.results || apiResult.json.results.length === 0) {
        apiResult = await this.fetchJamendoApi('/tracks/', {
          limit: String(limit),
          search: cleanQuery,
          include: 'musicinfo',
          audioformat: 'mp32',
        });
      }

      // 3. Fallback search using fuzzytags for genre/tag queries (e.g., rock, chill, synthwave)
      if (!apiResult || !apiResult.json.results || apiResult.json.results.length === 0) {
        apiResult = await this.fetchJamendoApi('/tracks/', {
          limit: String(limit),
          fuzzytags: cleanQuery,
          include: 'musicinfo',
          audioformat: 'mp32',
        });
      }

      const latencyMs = Math.round(performance.now() - start);

      if (!apiResult) {
        return {
          providerId: this.id,
          providerName: this.name,
          tracks: [],
          status: 'error',
          error: 'Jamendo API rate limit reached across client key pool.',
          latencyMs,
        };
      }

      const results: JamendoTrackRaw[] = apiResult.json.results || [];
      const tracks: UnifiedTrack[] = results.map((r) => this.mapJamendoTrack(r));

      return {
        providerId: this.id,
        providerName: this.name,
        tracks,
        status: 'success',
        latencyMs,
      };
    } catch (err: any) {
      return {
        providerId: this.id,
        providerName: this.name,
        tracks: [],
        status: 'error',
        error: err?.message || 'Jamendo search request failed',
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  public async getTrackById(id: string): Promise<UnifiedTrack | null> {
    const cleanId = id.replace(/^jamendo-/, '');
    const apiResult = await this.fetchJamendoApi('/tracks/', {
      id: cleanId,
      include: 'musicinfo',
      audioformat: 'mp32',
    }, 4000);

    if (apiResult && Array.isArray(apiResult.json.results) && apiResult.json.results.length > 0) {
      return this.mapJamendoTrack(apiResult.json.results[0]);
    }
    return null;
  }

  public async resolvePlayback(track: UnifiedTrack): Promise<PlaybackDescriptor> {
    if (track.streamUrl) {
      return {
        trackId: track.id,
        providerId: this.id,
        resolvedUrl: track.streamUrl,
        streamType: 'direct_audio',
        mimeType: 'audio/mpeg',
        capabilities: { ...this.capabilities },
        attribution: track.attribution,
      };
    }

    const fetched = await this.getTrackById(track.id);
    const resolvedUrl = fetched?.streamUrl || '';

    return {
      trackId: track.id,
      providerId: this.id,
      resolvedUrl,
      streamType: 'direct_audio',
      mimeType: 'audio/mpeg',
      capabilities: { ...this.capabilities },
      attribution: track.attribution,
    };
  }

  public async getTrending(options?: DiscoveryOptions): Promise<UnifiedTrack[]> {
    const limit = options?.limit || 12;
    const params: Record<string, string> = {
      limit: String(limit),
      boost: 'popularity_month',
      include: 'musicinfo',
      audioformat: 'mp32',
    };

    if (options?.genre) {
      params.tags = options.genre;
    }

    const apiResult = await this.fetchJamendoApi('/tracks/', params, 5000);
    if (!apiResult) return [];

    const results: JamendoTrackRaw[] = apiResult.json.results || [];
    return results.map((r) => this.mapJamendoTrack(r));
  }
}

export const jamendoProvider = new JamendoProvider();
