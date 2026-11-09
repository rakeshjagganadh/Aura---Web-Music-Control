/**
 * AURA 2.0 - Universal Source Engine
 * Unified Provider Types & Capability Contracts
 */

import { Track, TrackCapabilities, MusicSourceType } from '../../types';

export type ProviderId = 
  | 'local'
  | 'audius'
  | 'jamendo'
  | 'radiobrowser'
  | 'youtube'
  | 'curated_stream'
  | string;

export type ProviderType = 
  | 'local_storage'
  | 'direct_stream'
  | 'embed_player'
  | 'live_radio';

export interface ProviderCapabilities {
  /** Can perform keyword or filter search */
  canSearch: boolean;
  /** Can deliver direct audio stream URL (MP3/AAC/FLAC/Ogg) */
  canStreamDirect: boolean;
  /** Operates via official embedded iframe/widget player */
  canEmbed: boolean;
  /** Supports arbitrary position seeking */
  canSeek: boolean;
  /** Compatible with Web Audio API DSP (10-Band EQ, Spatial Audio, Compressor) */
  canApplyWebAudioDsp: boolean;
  /** Capable of playing in background on mobile/PWA via AudioContext/HTML5 Audio */
  canPlayInBackground: boolean;
  /** User/app has license permission to cache audio offline */
  canCacheOffline: boolean;
  /** Is a continuous live radio / ICY / HLS broadcast */
  isLiveStream: boolean;
  /** Provider supports playlist browsing or curation */
  supportsPlaylists: boolean;
}

export interface ProviderAttribution {
  providerName: string;
  providerUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  notice?: string;
  artistUrl?: string;
}

export interface UnifiedTrack {
  id: string;
  providerId: ProviderId;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds (0 for live radio)
  fileFormat: string;
  artworkUrl?: string;
  streamUrl?: string;
  streamType: 'direct_audio' | 'embed_iframe' | 'live_radio' | 'blob_url';
  genre?: string;
  releaseYear?: number;
  capabilities: ProviderCapabilities;
  attribution: ProviderAttribution;
  sourceUrl?: string;
  rawMetadata?: Record<string, unknown>;
}

export interface RadioStation {
  id: string;
  providerId: ProviderId;
  name: string;
  streamUrl: string;
  favicon?: string;
  country?: string;
  countryCode?: string;
  language?: string;
  tags: string[];
  bitrate?: number;
  codec?: string;
  homepage?: string;
  votes?: number;
  clickCount?: number;
  capabilities: ProviderCapabilities;
  attribution: ProviderAttribution;
}

export interface PlaybackDescriptor {
  trackId: string;
  providerId: ProviderId;
  resolvedUrl: string;
  streamType: 'direct_audio' | 'embed_iframe' | 'live_radio' | 'blob_url';
  mimeType?: string;
  capabilities: ProviderCapabilities;
  attribution: ProviderAttribution;
  headers?: Record<string, string>;
  requiresCorsProxy?: boolean;
}

export interface SearchFilter {
  providerIds?: ProviderId[];
  limit?: number;
  genre?: string;
  country?: string;
  language?: string;
}

export interface ProviderSearchResult {
  providerId: ProviderId;
  providerName: string;
  tracks: UnifiedTrack[];
  stations?: RadioStation[];
  status: 'success' | 'error' | 'timeout' | 'not_configured' | 'empty';
  error?: string;
  latencyMs: number;
}

export interface AggregatedSearchResult {
  query: string;
  tracks: UnifiedTrack[];
  stations: RadioStation[];
  resultsByProvider: Record<string, ProviderSearchResult>;
  totalCount: number;
  tookMs: number;
}

export interface DiscoveryOptions {
  limit?: number;
  genre?: string;
  tag?: string;
  countryCode?: string;
}

/**
 * Universal Music Provider Interface
 * All music providers (Audius, Jamendo, Radio Browser, YouTube, Local) must conform to this contract.
 */
export interface IMusicProvider {
  readonly id: ProviderId;
  readonly name: string;
  readonly type: ProviderType;
  readonly capabilities: ProviderCapabilities;
  readonly attribution: ProviderAttribution;

  /** Health and availability check */
  isAvailable(): Promise<boolean>;

  /** Keyword search */
  search(query: string, options?: SearchFilter): Promise<ProviderSearchResult>;

  /** Fetch track by provider ID */
  getTrackById?(id: string): Promise<UnifiedTrack | null>;

  /** Resolve final audio stream or embed parameters */
  resolvePlayback(track: UnifiedTrack): Promise<PlaybackDescriptor>;

  /** Trending or discovery tracks if supported */
  getTrending?(options?: DiscoveryOptions): Promise<UnifiedTrack[]>;

  /** Curated or popular radio stations if supported */
  getFeaturedStations?(options?: DiscoveryOptions): Promise<RadioStation[]>;
}

// ==========================================
// Mappers: UnifiedTrack <-> AURA Track
// ==========================================

export function unifiedTrackToAuraTrack(u: UnifiedTrack): Track {
  const dspCaps: TrackCapabilities = {
    basicPlayback: true,
    seek: u.capabilities.canSeek,
    volume: true,
    eq: u.capabilities.canApplyWebAudioDsp,
    effects: u.capabilities.canApplyWebAudioDsp,
    spatial: u.capabilities.canApplyWebAudioDsp,
    pitch: u.capabilities.canApplyWebAudioDsp,
    tempo: u.capabilities.canApplyWebAudioDsp || u.capabilities.canEmbed,
    loop: u.capabilities.canSeek,
    trim: u.capabilities.canCacheOffline,
    export: u.capabilities.canCacheOffline,
    advancedProcessing: u.capabilities.canApplyWebAudioDsp,
  };

  const sourceType = (u.providerId === 'audius' 
    ? 'audius' 
    : u.providerId === 'jamendo' 
    ? 'jamendo' 
    : u.providerId === 'radiobrowser' 
    ? 'radio' 
    : u.providerId === 'youtube' 
    ? 'youtube' 
    : 'local') as MusicSourceType;

  return {
    id: u.id,
    title: u.title,
    artist: u.artist,
    album: u.album || `${u.attribution.providerName} Catalog`,
    duration: u.duration,
    fileFormat: u.fileFormat,
    fileSize: 0,
    dateAdded: Date.now(),
    coverUrl: u.artworkUrl ? u.artworkUrl.replace(/^http:\/\//i, 'https://') : '',
    genre: u.genre,
    year: u.releaseYear,
    source: sourceType,
    sourceId: u.id.replace(new RegExp(`^${u.providerId}-`), ''),
    sourceName: u.attribution.providerName,
    sourceUrl: u.sourceUrl,
    audioUrl: u.streamUrl,
    externalStreamUrl: u.streamUrl,
    isAvailable: true,
    playbackCapability: dspCaps,
  };
}

export function radioStationToAuraTrack(station: RadioStation): Track {
  const dspCaps: TrackCapabilities = {
    basicPlayback: true,
    seek: false,
    volume: true,
    eq: station.capabilities.canApplyWebAudioDsp,
    effects: station.capabilities.canApplyWebAudioDsp,
    spatial: station.capabilities.canApplyWebAudioDsp,
    pitch: false,
    tempo: false,
    loop: false,
    trim: false,
    export: false,
    advancedProcessing: station.capabilities.canApplyWebAudioDsp,
  };

  return {
    id: station.id,
    title: station.name,
    artist: station.country ? `${station.country} • Live Radio` : 'Live Broadcast',
    album: station.tags.slice(0, 3).join(', ') || 'Global Internet Radio',
    duration: 0,
    fileFormat: station.codec ? `${station.codec.toUpperCase()} LIVE` : 'RADIO STREAM',
    fileSize: 0,
    dateAdded: Date.now(),
    coverUrl: station.favicon,
    genre: station.tags[0] || 'Radio',
    source: 'radio',
    sourceId: station.id.replace(/^radio-/, ''),
    sourceName: 'Radio Browser',
    sourceUrl: station.homepage,
    audioUrl: station.streamUrl,
    externalStreamUrl: station.streamUrl,
    isAvailable: true,
    playbackCapability: dspCaps,
  };
}
