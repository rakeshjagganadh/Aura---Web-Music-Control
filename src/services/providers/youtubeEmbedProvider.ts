/**
 * AURA 2.0 - Universal Source Engine
 * YouTube Official Embedded Player Provider
 * Strictly uses the Official YouTube IFrame Player API & Permitted Metadata APIs.
 * Direct extraction or reverse-engineered scraping is explicitly prohibited.
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
import { youtubeService, YouTubeSearchResult } from '../youtubeService';

export class YouTubeEmbedProvider implements IMusicProvider {
  readonly id: ProviderId = 'youtube';
  readonly name = 'YouTube Embed';
  readonly type: ProviderType = 'embed_player';

  readonly capabilities: ProviderCapabilities = {
    canSearch: true,
    canStreamDirect: false, // Direct audio extraction is NOT permitted
    canEmbed: true,         // Plays strictly via official YouTube IFrame Player
    canSeek: true,          // Seeking supported via YouTube IFrame API bridge
    canApplyWebAudioDsp: false, // Protected IFrame cannot route through Web Audio AudioContext
    canPlayInBackground: false, // Subject to browser/YouTube background restrictions
    canCacheOffline: false,
    isLiveStream: false,
    supportsPlaylists: false,
  };

  readonly attribution: ProviderAttribution = {
    providerName: 'YouTube',
    providerUrl: 'https://www.youtube.com',
    licenseName: 'YouTube Standard Terms of Service',
    licenseUrl: 'https://www.youtube.com/t/terms',
    notice: 'Playback provided via the official embedded YouTube IFrame Player.',
  };

  public async isAvailable(): Promise<boolean> {
    // Available if API key is present or direct URL parsing is used
    return youtubeService.isConfigured();
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

    // Direct YouTube URL or video ID detection
    const directVideoId = youtubeService.parseVideoId(cleanQuery);
    if (directVideoId) {
      const mockTrack: UnifiedTrack = {
        id: `yt-${directVideoId}`,
        providerId: this.id,
        title: `YouTube Video (${directVideoId})`,
        artist: 'YouTube Creator',
        album: 'YouTube Embed',
        duration: 0,
        fileFormat: 'YOUTUBE EMBED',
        streamType: 'embed_iframe',
        artworkUrl: `https://img.youtube.com/vi/${directVideoId}/hqdefault.jpg`,
        capabilities: { ...this.capabilities },
        attribution: this.attribution,
        sourceUrl: `https://www.youtube.com/watch?v=${directVideoId}`,
      };

      return {
        providerId: this.id,
        providerName: this.name,
        tracks: [mockTrack],
        status: 'success',
        latencyMs: Math.round(performance.now() - start),
      };
    }

    if (!youtubeService.isConfigured()) {
      return {
        providerId: this.id,
        providerName: this.name,
        tracks: [],
        status: 'not_configured',
        error: 'YouTube API key not configured for search. Paste video URL directly to play.',
        latencyMs: 0,
      };
    }

    try {
      const searchRes: YouTubeSearchResult = await youtubeService.search(cleanQuery, limit);
      const latencyMs = Math.round(performance.now() - start);

      const tracks: UnifiedTrack[] = (searchRes.items || []).map((t) => {
        return {
          id: t.id.startsWith('yt-') ? t.id : `yt-${t.sourceId || t.id}`,
          providerId: this.id,
          title: t.title,
          artist: t.artist,
          album: 'YouTube Embed',
          duration: t.duration || 0,
          fileFormat: 'YOUTUBE EMBED',
          streamType: 'embed_iframe',
          artworkUrl: t.coverUrl,
          capabilities: { ...this.capabilities },
          attribution: {
            ...this.attribution,
            artistUrl: t.artist ? `https://www.youtube.com/results?search_query=${encodeURIComponent(t.artist)}` : undefined,
          },
          sourceUrl: t.sourceUrl || (t.sourceId ? `https://www.youtube.com/watch?v=${t.sourceId}` : undefined),
        };
      });

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
        error: err?.message || 'YouTube search query failed',
        latencyMs: Math.round(performance.now() - start),
      };
    }
  }

  public async resolvePlayback(track: UnifiedTrack): Promise<PlaybackDescriptor> {
    const videoId = track.id.replace(/^yt-/, '');
    return {
      trackId: track.id,
      providerId: this.id,
      resolvedUrl: videoId, // videoId for YouTube IFrame player
      streamType: 'embed_iframe',
      capabilities: { ...this.capabilities },
      attribution: track.attribution,
    };
  }
}

export const youtubeEmbedProvider = new YouTubeEmbedProvider();
