/**
 * AURA 2.0 - Universal Source Engine
 * Local Device & IndexedDB Storage Provider
 * 100% private, offline, full Web Audio DSP support.
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
  ProviderSearchResult
} from './types';
import { storageService } from '../storage';
import { Track } from '../../types';

export class LocalProvider implements IMusicProvider {
  readonly id: ProviderId = 'local';
  readonly name = 'Local Library';
  readonly type: ProviderType = 'local_storage';

  readonly capabilities: ProviderCapabilities = {
    canSearch: true,
    canStreamDirect: true,
    canEmbed: false,
    canSeek: true,
    canApplyWebAudioDsp: true,
    canPlayInBackground: true,
    canCacheOffline: true,
    isLiveStream: false,
    supportsPlaylists: true,
  };

  readonly attribution: ProviderAttribution = {
    providerName: 'Local Device',
    licenseName: 'User Owned Media',
    notice: 'Stored locally in your browser IndexedDB offline vault.',
  };

  public async isAvailable(): Promise<boolean> {
    return typeof indexedDB !== 'undefined';
  }

  private auraTrackToUnified(t: Track): UnifiedTrack {
    return {
      id: t.id,
      providerId: this.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      fileFormat: t.fileFormat || 'LOCAL AUDIO',
      artworkUrl: t.coverUrl,
      streamUrl: t.audioUrl,
      streamType: 'blob_url',
      genre: t.genre,
      releaseYear: t.year,
      capabilities: { ...this.capabilities },
      attribution: this.attribution,
      rawMetadata: {
        bitrate: t.bitrate,
        sampleRate: t.sampleRate,
        channels: t.channels,
        fileSize: t.fileSize,
      },
    };
  }

  public async search(query: string, options?: SearchFilter): Promise<ProviderSearchResult> {
    const start = performance.now();
    const cleanQuery = query.trim().toLowerCase();

    try {
      const allTracks = await storageService.getAllTracks();
      const localOnly = allTracks.filter((t) => !t.source || t.source === 'local');

      const matches = cleanQuery
        ? localOnly.filter(
            (t) =>
              t.title.toLowerCase().includes(cleanQuery) ||
              t.artist.toLowerCase().includes(cleanQuery) ||
              t.album.toLowerCase().includes(cleanQuery) ||
              (t.genre && t.genre.toLowerCase().includes(cleanQuery))
          )
        : localOnly;

      const limit = options?.limit || 20;
      const sliced = matches.slice(0, limit);
      const tracks = sliced.map((t) => this.auraTrackToUnified(t));

      return {
        providerId: this.id,
        providerName: this.name,
        tracks,
        status: 'success',
        latencyMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        providerId: this.id,
        providerName: this.name,
        tracks: [],
        status: 'error',
        error: err?.message || 'Failed reading local IndexedDB storage',
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  public async getTrackById(id: string): Promise<UnifiedTrack | null> {
    try {
      const allTracks = await storageService.getAllTracks();
      const found = allTracks.find((t) => t.id === id);
      return found ? this.auraTrackToUnified(found) : null;
    } catch {
      return null;
    }
  }

  public async resolvePlayback(track: UnifiedTrack): Promise<PlaybackDescriptor> {
    let resolvedUrl = track.streamUrl || '';

    if (!resolvedUrl) {
      const blob = await storageService.getAudioBlob(track.id);
      if (blob) {
        resolvedUrl = URL.createObjectURL(blob);
      }
    }

    return {
      trackId: track.id,
      providerId: this.id,
      resolvedUrl,
      streamType: 'blob_url',
      capabilities: { ...this.capabilities },
      attribution: track.attribution,
    };
  }
}

export const localProvider = new LocalProvider();
