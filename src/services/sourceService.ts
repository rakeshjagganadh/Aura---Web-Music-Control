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

export const JAMENDO_STREAM_CAPABILITIES: TrackCapabilities = {
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
  advancedProcessing: true, // Full Web Audio DSP & visualizer supported via open CORS
};

export const RADIO_BROWSER_CAPABILITIES: TrackCapabilities = {
  basicPlayback: true,
  seek: false, // Live continuous stream
  volume: true,
  eq: true,
  effects: true,
  spatial: true,
  pitch: false,
  tempo: false,
  loop: false,
  trim: false,
  export: false,
  advancedProcessing: true, // Real-time audio analyser supported
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
    id: 'source-jamendo',
    type: 'jamendo',
    name: 'Jamendo Music Catalog',
    description: 'Free independent artists & Creative Commons music with 100% open CORS and full Web Audio DSP.',
    icon: 'Music',
    isConnected: true,
    isOfficial: true,
    capabilities: JAMENDO_STREAM_CAPABILITIES,
    category: 'stream',
    badge: 'CREATIVE COMMONS',
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
    id: 'source-radiobrowser',
    type: 'radiobrowser',
    name: 'Radio Browser Directory',
    description: 'Global community directory with 30,000+ live internet radio stations, genres, and countries.',
    icon: 'Radio',
    isConnected: true,
    isOfficial: true,
    capabilities: RADIO_BROWSER_CAPABILITIES,
    category: 'radio',
    badge: '30,000+ STATIONS',
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
];

export function getTrackCapabilities(track: Track | null): TrackCapabilities {
  if (!track) return FULL_DSP_CAPABILITIES;
  if (track.playbackCapability) return track.playbackCapability;
  
  const source = track.source || 'local';
  switch (source) {
    case 'local':
      return FULL_DSP_CAPABILITIES;
    case 'jamendo':
      return JAMENDO_STREAM_CAPABILITIES;
    case 'audius':
      return AUDIUS_STREAM_CAPABILITIES;
    case 'radiobrowser':
    case 'radio':
      return RADIO_BROWSER_CAPABILITIES;
    case 'curated_stream':
    case 'web_stream':
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
