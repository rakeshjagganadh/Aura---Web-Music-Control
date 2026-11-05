/**
 * AURA 2.0 - Universal Source Engine
 * Radio Browser Community Provider (Global Live Internet Radio)
 */

import {
  IMusicProvider,
  ProviderId,
  ProviderType,
  ProviderCapabilities,
  ProviderAttribution,
  UnifiedTrack,
  RadioStation,
  PlaybackDescriptor,
  SearchFilter,
  ProviderSearchResult,
  DiscoveryOptions,
  radioStationToAuraTrack
} from './types';

export interface RadioBrowserStationRaw {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  languagecodes: string;
  votes: number;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  clickcount: number;
}

export class RadioBrowserProvider implements IMusicProvider {
  readonly id: ProviderId = 'radiobrowser';
  readonly name = 'Radio Browser';
  readonly type: ProviderType = 'live_radio';

  // Radio Browser uses dynamic mirror rotation. de1, nl1, at1 are standard stable servers.
  private apiHosts = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
  ];
  private currentHostIndex = 0;

  readonly capabilities: ProviderCapabilities = {
    canSearch: true,
    canStreamDirect: true,
    canEmbed: false,
    canSeek: false, // Live continuous stream: seeking is not supported
    canApplyWebAudioDsp: true, // AudioContext / MediaElementSource supported for live visualization & EQ
    canPlayInBackground: true,
    canCacheOffline: false,
    isLiveStream: true,
    supportsPlaylists: false,
  };

  readonly attribution: ProviderAttribution = {
    providerName: 'Radio Browser Community',
    providerUrl: 'https://www.radio-browser.info',
    licenseName: 'Community Open Database',
    licenseUrl: 'https://www.radio-browser.info',
    notice: 'Free open global radio station directory provided by the community.',
  };

  private getActiveHost(): string {
    return this.apiHosts[this.currentHostIndex];
  }

  private rotateHost() {
    this.currentHostIndex = (this.currentHostIndex + 1) % this.apiHosts.length;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const host = this.getActiveHost();
      const res = await fetch(`${host}/json/stats`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      this.rotateHost();
      return false;
    }
  }

  private mapRawStation(raw: RadioBrowserStationRaw): RadioStation {
    const streamUrl = raw.url_resolved || raw.url;
    const tagList = (raw.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length < 24);

    return {
      id: `radio-${raw.stationuuid}`,
      providerId: this.id,
      name: raw.name ? raw.name.trim() : 'Live Radio Broadcast',
      streamUrl,
      favicon: raw.favicon || undefined,
      country: raw.country || undefined,
      countryCode: raw.countrycode || undefined,
      language: raw.language || undefined,
      tags: tagList,
      bitrate: raw.bitrate > 0 ? raw.bitrate : undefined,
      codec: raw.codec || 'MP3',
      homepage: raw.homepage || undefined,
      votes: raw.votes,
      clickCount: raw.clickcount,
      capabilities: { ...this.capabilities },
      attribution: {
        ...this.attribution,
        notice: `Live broadcast station "${raw.name}" via Radio Browser open database.`,
      },
    };
  }

  private stationToUnifiedTrack(station: RadioStation): UnifiedTrack {
    return {
      id: station.id,
      providerId: this.id,
      title: station.name,
      artist: station.country ? `${station.country} • Live Radio` : 'Live Broadcast',
      album: station.tags.slice(0, 3).join(', ') || 'Global Internet Radio',
      duration: 0,
      fileFormat: station.codec ? `${station.codec.toUpperCase()} LIVE` : 'RADIO STREAM',
      artworkUrl: station.favicon,
      streamUrl: station.streamUrl,
      streamType: 'live_radio',
      genre: station.tags[0] || 'Radio',
      capabilities: { ...this.capabilities },
      attribution: station.attribution,
      sourceUrl: station.homepage,
      rawMetadata: station as unknown as Record<string, unknown>,
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
        stations: [],
        status: 'empty',
        latencyMs: 0,
      };
    }

    try {
      const host = this.getActiveHost();
      const url = new URL(`${host}/json/stations/search`);
      url.searchParams.set('name', cleanQuery);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('hidebroken', 'true');
      url.searchParams.set('order', 'clickcount');
      url.searchParams.set('reverse', 'true');

      if (options?.country) {
        url.searchParams.set('countrycode', options.country);
      }
      if (options?.genre) {
        url.searchParams.set('tag', options.genre);
      }

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'AURA_Music_Engine/2.0 (Universal Source Engine)',
        },
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        this.rotateHost();
        return {
          providerId: this.id,
          providerName: this.name,
          tracks: [],
          stations: [],
          status: 'error',
          error: `Radio Browser returned HTTP ${res.status}`,
          latencyMs,
        };
      }

      const rawStations: RadioBrowserStationRaw[] = await res.json();
      const stations: RadioStation[] = rawStations.map((r) => this.mapRawStation(r));
      const tracks: UnifiedTrack[] = stations.map((s) => this.stationToUnifiedTrack(s));

      return {
        providerId: this.id,
        providerName: this.name,
        tracks,
        stations,
        status: 'success',
        latencyMs,
      };
    } catch (err: any) {
      this.rotateHost();
      return {
        providerId: this.id,
        providerName: this.name,
        tracks: [],
        stations: [],
        status: 'error',
        error: err?.message || 'Radio Browser network query failed',
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  public async getFeaturedStations(options?: DiscoveryOptions): Promise<RadioStation[]> {
    const limit = options?.limit || 12;
    try {
      const host = this.getActiveHost();
      const url = `${host}/json/stations/topclick?limit=${limit}&hidebroken=true`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: {
          'User-Agent': 'AURA_Music_Engine/2.0',
        },
      });

      if (!res.ok) return [];
      const rawStations: RadioBrowserStationRaw[] = await res.json();
      return rawStations.map((r) => this.mapRawStation(r));
    } catch (err) {
      console.warn('[RadioBrowserProvider] Failed to fetch top stations:', err);
      return [];
    }
  }

  public async getTopVotedStations(limit = 12): Promise<RadioStation[]> {
    try {
      const host = this.getActiveHost();
      const url = `${host}/json/stations/topvote?limit=${limit}&hidebroken=true`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'AURA_Music_Engine/2.0' },
      });
      if (!res.ok) return [];
      const rawStations: RadioBrowserStationRaw[] = await res.json();
      return rawStations.map((r) => this.mapRawStation(r));
    } catch {
      return [];
    }
  }

  public async getStationsByTag(tag: string, limit = 12): Promise<RadioStation[]> {
    try {
      const host = this.getActiveHost();
      const url = `${host}/json/stations/bytag/${encodeURIComponent(tag.trim())}?limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'AURA_Music_Engine/2.0' },
      });
      if (!res.ok) return [];
      const rawStations: RadioBrowserStationRaw[] = await res.json();
      return rawStations.map((r) => this.mapRawStation(r));
    } catch {
      return [];
    }
  }

  public async getStationsByCountry(countryCode: string, limit = 12): Promise<RadioStation[]> {
    try {
      const host = this.getActiveHost();
      const url = `${host}/json/stations/bycountrycodeexact/${encodeURIComponent(countryCode.trim())}?limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'AURA_Music_Engine/2.0' },
      });
      if (!res.ok) return [];
      const rawStations: RadioBrowserStationRaw[] = await res.json();
      return rawStations.map((r) => this.mapRawStation(r));
    } catch {
      return [];
    }
  }

  public async getStationsByLanguage(language: string, limit = 12): Promise<RadioStation[]> {
    try {
      const host = this.getActiveHost();
      const url = `${host}/json/stations/bylanguage/${encodeURIComponent(language.trim())}?limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'AURA_Music_Engine/2.0' },
      });
      if (!res.ok) return [];
      const rawStations: RadioBrowserStationRaw[] = await res.json();
      return rawStations.map((r) => this.mapRawStation(r));
    } catch {
      return [];
    }
  }

  public async resolvePlayback(track: UnifiedTrack): Promise<PlaybackDescriptor> {
    const streamUrl = track.streamUrl || '';
    return {
      trackId: track.id,
      providerId: this.id,
      resolvedUrl: streamUrl,
      streamType: 'live_radio',
      mimeType: 'audio/mpeg',
      capabilities: { ...this.capabilities },
      attribution: track.attribution,
    };
  }
}

export const radioBrowserProvider = new RadioBrowserProvider();
