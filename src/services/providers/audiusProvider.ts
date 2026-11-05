/**
 * AURA 2.0 - Universal Source Engine
 * Audius Decentralized Catalog Provider
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
import { audiusService, AudiusRawTrack } from '../audiusService';

export class AudiusProvider implements IMusicProvider {
  readonly id: ProviderId = 'audius';
  readonly name = 'Audius';
  readonly type: ProviderType = 'direct_stream';

  readonly capabilities: ProviderCapabilities = {
    canSearch: true,
    canStreamDirect: true,
    canEmbed: false,
    canSeek: true,
    canApplyWebAudioDsp: true,
    canPlayInBackground: true,
    canCacheOffline: false,
    isLiveStream: false,
    supportsPlaylists: true,
  };

  readonly attribution: ProviderAttribution = {
    providerName: 'Audius',
    providerUrl: 'https://audius.co',
    licenseName: 'Audius Independent Artists',
    notice: 'Decentralized audio streaming powered by Audius Web3 community nodes.',
  };

  public async isAvailable(): Promise<boolean> {
    try {
      const host = await audiusService.getHost();
      return Boolean(host && host.startsWith('http'));
    } catch {
      return false;
    }
  }

  public async search(query: string, options?: SearchFilter): Promise<ProviderSearchResult> {
    const start = performance.now();
    const limit = options?.limit || 12;

    try {
      const result = await audiusService.search(query, limit);
      const latencyMs = Math.round(performance.now() - start);

      if (result.error && (!result.items || result.items.length === 0)) {
        return {
          providerId: this.id,
          providerName: this.name,
          tracks: [],
          status: 'error',
          error: result.error,
          latencyMs,
        };
      }

      const tracks: UnifiedTrack[] = (result.items || []).map((t) => ({
        id: t.id.startsWith('audius-') ? t.id : `audius-${t.id}`,
        providerId: this.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration || 0,
        fileFormat: 'AUDIUS / MP3',
        artworkUrl: t.coverUrl,
        streamUrl: t.audioUrl || t.externalStreamUrl,
        streamType: 'direct_audio',
        genre: t.genre,
        year: t.year,
        capabilities: { ...this.capabilities },
        attribution: {
          ...this.attribution,
          notice: `Audio provided by creator ${t.artist} via Audius network.`,
        },
        sourceUrl: t.sourceUrl,
      }));

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
        error: err?.message || 'Audius network timeout or search failure',
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  public async resolvePlayback(track: UnifiedTrack): Promise<PlaybackDescriptor> {
    const rawId = track.id.replace(/^audius-/, '');
    const host = await audiusService.getHost();
    const resolvedUrl = track.streamUrl || audiusService.getStreamUrl(rawId, host);

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
    const limit = options?.limit || 10;
    try {
      const host = await audiusService.getHost();
      const res = await fetch(`${host}/v1/tracks/trending?app_name=AURA_STUDIO&limit=${limit}`, {
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return [];
      const json = await res.json();
      const data: AudiusRawTrack[] = json.data || [];

      return data.map((raw) => {
        const auraTrack = audiusService.createTrack(raw, host);
        return {
          id: auraTrack.id,
          providerId: this.id,
          title: auraTrack.title,
          artist: auraTrack.artist,
          album: auraTrack.album,
          duration: auraTrack.duration,
          fileFormat: 'AUDIUS / MP3',
          artworkUrl: auraTrack.coverUrl,
          streamUrl: auraTrack.audioUrl,
          streamType: 'direct_audio',
          genre: auraTrack.genre,
          capabilities: { ...this.capabilities },
          attribution: {
            ...this.attribution,
            notice: `Trending track by ${auraTrack.artist} on Audius.`,
          },
          sourceUrl: auraTrack.sourceUrl,
        };
      });
    } catch (err) {
      console.warn('[AudiusProvider] Failed to fetch trending:', err);
      return [];
    }
  }
}

export const audiusProvider = new AudiusProvider();
