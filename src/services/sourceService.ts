import { MusicSource, Track, TrackCapabilities, MusicSourceType } from '../types';

export const FULL_DSP_CAPABILITIES: TrackCapabilities = {
  basicPlayback: true,
  seek: true,
  volume: true,
  eq: true,
  effects: true,
  spatial: true,
  pitch: true,
  tempo: true,
  loop: true,
  trim: true,
  export: true,
  advancedProcessing: true,
};

export const WEB_STREAM_CAPABILITIES: TrackCapabilities = {
  basicPlayback: true,
  seek: true,
  volume: true,
  eq: true,
  effects: true,
  spatial: true,
  pitch: true,
  tempo: true,
  loop: true,
  trim: false, // Stream buffer trimming is disabled
  export: false, // Remote stream master export disabled
  advancedProcessing: true, // Real-time analyser supported
};

export const YOUTUBE_EMBED_CAPABILITIES: TrackCapabilities = {
  basicPlayback: true,
  seek: true,
  volume: true,
  eq: false,
  effects: false,
  spatial: false,
  pitch: false,
  tempo: true,
  loop: true,
  trim: false,
  export: false,
  advancedProcessing: false,
};

export const AUDIUS_STREAM_CAPABILITIES: TrackCapabilities = {
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
  advancedProcessing: true, // Real-time analyser supported via Web Audio
};

export const DEFAULT_MUSIC_SOURCES: MusicSource[] = [
  {
    id: 'source-local',
    type: 'local',
    name: 'Local Device Library',
    description: 'High-resolution offline storage on your local browser & disk. 100% private.',
    icon: 'HardDrive',
    isConnected: true,
    isOfficial: true,
    capabilities: FULL_DSP_CAPABILITIES,
    category: 'local',
    badge: 'UNLOCKED DSP',
  },
  {
    id: 'source-audius',
    type: 'audius',
    name: 'Audius Decentralized Catalog',
    description: 'Public, read-only streaming from independent artists worldwide via decentralized Web3 nodes.',
    icon: 'Radio',
    isConnected: true,
    isOfficial: true,
    capabilities: AUDIUS_STREAM_CAPABILITIES,
    category: 'stream',
    badge: 'OPEN AUDIO',
  },
  {
    id: 'source-youtube',
    type: 'youtube',
    name: 'YouTube Web Embed Player',
    description: 'Official embedded YouTube playback player. Search or paste video URLs to listen directly.',
    icon: 'Youtube',
    isConnected: true,
    isOfficial: true,
    capabilities: YOUTUBE_EMBED_CAPABILITIES,
    category: 'embed',
    badge: 'EMBEDDED',
  },
  {
    id: 'source-curated',
    type: 'curated_stream',
    name: 'AURA Open Sound Catalog',
    description: 'Royalty-free & Creative Commons high-fidelity audio streams with real-time Web Audio DSP.',
    icon: 'Sparkles',
    isConnected: true,
    isOfficial: true,
    capabilities: WEB_STREAM_CAPABILITIES,
    category: 'stream',
    badge: 'LOSSLESS DSP',
  },
  {
    id: 'source-radio',
    type: 'radio',
    name: 'Web Audio & Radio Streams',
    description: 'Direct MP3/AAC internet radio and ambient streams with live spectral analysis.',
    icon: 'Radio',
    isConnected: true,
    isOfficial: true,
    capabilities: WEB_STREAM_CAPABILITIES,
    category: 'radio',
    badge: 'LIVE DSP',
  },
];

export function getTrackCapabilities(track: Track | null): TrackCapabilities {
  if (!track) return FULL_DSP_CAPABILITIES;
  if (track.playbackCapability) return track.playbackCapability;
  
  const source = track.source || 'local';
  switch (source) {
    case 'local':
      return FULL_DSP_CAPABILITIES;
    case 'audius':
      return AUDIUS_STREAM_CAPABILITIES;
    case 'curated_stream':
    case 'web_stream':
    case 'radio':
      return WEB_STREAM_CAPABILITIES;
    case 'youtube':
      return YOUTUBE_EMBED_CAPABILITIES;
    default:
      return FULL_DSP_CAPABILITIES;
  }
}

export function canApplyDSP(track: Track | null): boolean {
  if (!track) return true;
  const caps = getTrackCapabilities(track);
  return caps.eq && caps.effects && caps.spatial;
}

export function canTrimOrExport(track: Track | null): boolean {
  if (!track) return true;
  const caps = getTrackCapabilities(track);
  return caps.trim && caps.export;
}

export function getCapabilityNotice(capabilityName: keyof TrackCapabilities, track: Track | null): string | null {
  if (!track) return null;
  const caps = getTrackCapabilities(track);
  if (caps[capabilityName]) return null;

  if (track.source === 'youtube') {
    return `This feature is optimized for direct audio streams and local library files. YouTube embedded playback supports standard controls.`;
  }

  if (!caps.export && capabilityName === 'export') {
    return `Lossless WAV export is available for locally stored audio files.`;
  }

  return `Audio processing is limited for this source.`;
}
