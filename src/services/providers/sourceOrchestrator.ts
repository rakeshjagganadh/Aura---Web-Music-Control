/**
 * AURA 2.0 - Universal Source Engine
 * Source Orchestrator
 * High-performance coordinator executing federated searches, strict error isolation,
 * stream resolution, deduplication, and capability enforcement.
 */

import {
  IMusicProvider,
  ProviderId,
  UnifiedTrack,
  RadioStation,
  PlaybackDescriptor,
  SearchFilter,
  ProviderSearchResult,
  AggregatedSearchResult,
  unifiedTrackToAuraTrack
} from './types';
import { providerRegistry } from './providerRegistry';
import { Track } from '../../types';

export interface FederatedSearchOptions extends SearchFilter {
  timeoutMs?: number;
  deduplicate?: boolean;
}

export class SourceOrchestrator {
  private defaultTimeoutMs = 5000;

  /**
   * Execute federated search across all active or specified providers.
   * Completely isolated: any provider throwing, timing out, or returning non-200
   * will NOT disrupt results from other providers.
   */
  public async search(
    query: string,
    options?: FederatedSearchOptions
  ): Promise<AggregatedSearchResult> {
    const start = performance.now();
    const cleanQuery = query.trim();
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const requestedProviders = options?.providerIds;

    const allProviders = providerRegistry.getAll();
    const activeProviders = requestedProviders && requestedProviders.length > 0
      ? allProviders.filter((p) => requestedProviders.includes(p.id))
      : allProviders;

    if (!cleanQuery) {
      return {
        query: '',
        tracks: [],
        stations: [],
        resultsByProvider: {},
        totalCount: 0,
        tookMs: 0,
      };
    }

    // Run searches in parallel with strict per-provider timeout
    const searchPromises = activeProviders.map(async (provider) => {
      const pStart = performance.now();
      try {
        const timeoutPromise = new Promise<ProviderSearchResult>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        );

        const searchPromise = provider.search(cleanQuery, options);
        const result = await Promise.race([searchPromise, timeoutPromise]);
        return result;
      } catch (err: any) {
        return {
          providerId: provider.id,
          providerName: provider.name,
          tracks: [],
          stations: [],
          status: 'error' as const,
          error: err?.message || 'Search execution failed',
          latencyMs: Math.round(performance.now() - pStart),
        };
      }
    });

    const settled = await Promise.allSettled(searchPromises);

    const resultsByProvider: Record<string, ProviderSearchResult> = {};
    const rawTracks: UnifiedTrack[] = [];
    const allStations: RadioStation[] = [];

    settled.forEach((outcome, idx) => {
      const provider = activeProviders[idx];
      if (outcome.status === 'fulfilled') {
        const res = outcome.value;
        resultsByProvider[provider.id] = res;
        if (res.tracks && res.tracks.length > 0) {
          rawTracks.push(...res.tracks);
        }
        if (res.stations && res.stations.length > 0) {
          allStations.push(...res.stations);
        }
      } else {
        resultsByProvider[provider.id] = {
          providerId: provider.id,
          providerName: provider.name,
          tracks: [],
          status: 'error',
          error: outcome.reason?.message || 'Unknown search execution failure',
          latencyMs: Math.round(performance.now() - start),
        };
      }
    });

    // Deduplication (if requested, default: true)
    const shouldDeduplicate = options?.deduplicate !== false;
    const finalTracks = shouldDeduplicate
      ? this.deduplicateTracks(rawTracks)
      : rawTracks;

    const tookMs = Math.round(performance.now() - start);

    return {
      query: cleanQuery,
      tracks: finalTracks,
      stations: allStations,
      resultsByProvider,
      totalCount: finalTracks.length + allStations.length,
      tookMs,
    };
  }

  /**
   * Deduplicate tracks based on normalized (title + artist) signature.
   * If duplicates exist, prioritizes direct streaming lossless/MP3 sources
   * over embedded iframe sources.
   */
  private deduplicateTracks(tracks: UnifiedTrack[]): UnifiedTrack[] {
    const seen = new Map<string, UnifiedTrack>();

    for (const track of tracks) {
      const normTitle = track.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normArtist = track.artist.toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `${normTitle}:::${normArtist}`;

      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, track);
      } else {
        // Source priority: local > direct_audio (Jamendo / Audius) > embed_iframe (YouTube)
        const priorityOrder: Record<string, number> = {
          blob_url: 4,
          direct_audio: 3,
          live_radio: 2,
          embed_iframe: 1,
        };

        const existingPriority = priorityOrder[existing.streamType] || 0;
        const newPriority = priorityOrder[track.streamType] || 0;

        if (newPriority > existingPriority) {
          seen.set(key, track);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Resolve audio playback for a given track or legacy AURA Track.
   * Determines stream URL, MIME type, and capability descriptor.
   */
  public async resolvePlayback(track: UnifiedTrack | Track): Promise<PlaybackDescriptor> {
    const providerId = (track as any).providerId || (track as Track).source || 'local';
    const provider = providerRegistry.get(providerId);

    if (provider) {
      const uTrack: UnifiedTrack = ('providerId' in track)
        ? track
        : {
            id: track.id,
            providerId,
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            fileFormat: track.fileFormat,
            artworkUrl: track.coverUrl,
            streamUrl: track.audioUrl || track.externalStreamUrl,
            streamType: providerId === 'youtube'
              ? 'embed_iframe'
              : providerId === 'radio' || providerId === 'radiobrowser'
              ? 'live_radio'
              : providerId === 'local'
              ? 'blob_url'
              : 'direct_audio',
            capabilities: { ...provider.capabilities },
            attribution: provider.attribution,
            sourceUrl: track.sourceUrl,
          };

      return provider.resolvePlayback(uTrack);
    }

    // Generic fallback descriptor
    return {
      trackId: track.id,
      providerId: 'local',
      resolvedUrl: (track as any).streamUrl || (track as Track).audioUrl || '',
      streamType: 'direct_audio',
      capabilities: {
        canSearch: true,
        canStreamDirect: true,
        canEmbed: false,
        canSeek: true,
        canApplyWebAudioDsp: true,
        canPlayInBackground: true,
        canCacheOffline: false,
        isLiveStream: false,
        supportsPlaylists: true,
      },
      attribution: {
        providerName: 'Direct Web Stream',
      },
    };
  }

  /**
   * Helper to perform a federated search and return AURA-compatible Track objects.
   */
  public async searchAsAuraTracks(
    query: string,
    options?: FederatedSearchOptions
  ): Promise<{ tracks: Track[]; resultsByProvider: Record<string, ProviderSearchResult>; tookMs: number }> {
    const res = await this.search(query, options);
    const auraTracks = res.tracks.map((u) => unifiedTrackToAuraTrack(u));
    return {
      tracks: auraTracks,
      resultsByProvider: res.resultsByProvider,
      tookMs: res.tookMs,
    };
  }
}

export const sourceOrchestrator = new SourceOrchestrator();
