export type NavView = 
  | 'home'
  | 'library'
  | 'songs'
  | 'albums'
  | 'artists'
  | 'playlists'
  | 'playlist-detail'
  | 'favorites'
  | 'studio'
  | 'settings';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  fileFormat: string; // e.g. 'MP3', 'WAV', 'FLAC', 'AAC', 'OGG'
  fileSize: number; // in bytes
  dateAdded: number; // timestamp
  coverUrl?: string; // image data URL or blob URL
  coverColor?: string; // fallback gradient color
  waveformPeaks?: number[]; // normalized 0-1 peak heights (e.g. 100-200 values)
  isFavorite?: boolean;
  isDemo?: boolean;
  audioBlob?: Blob; // stored in IndexedDB
  audioUrl?: string; // object URL for current session
  genre?: string;
  year?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverGradient: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerBand {
  frequency: number; // Hz (31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000)
  gain: number; // dB (-15 to +15)
  type: BiquadFilterType;
  label: string;
  description: string;
  q?: number;
}

export type EqualizerPreset = 
  | 'flat' 
  | 'bass_boost'
  | 'deep_bass'
  | 'treble_boost' 
  | 'vocal' 
  | 'podcast'
  | 'acoustic' 
  | 'rock'
  | 'pop'
  | 'classical'
  | 'electronic' 
  | 'hip_hop'
  | 'cinematic'
  | 'night'
  | 'focus'
  | 'workout'
  | 'chill'
  | 'party'
  | 'gaming'
  | 'study'
  | 'travel'
  | 'custom';

// -------------------------------------------------------------
// DYNAMICS & PROCESSING TYPES
// -------------------------------------------------------------

export interface CompressorSettings {
  enabled: boolean;
  threshold: number; // -60 to 0 dB
  ratio: number; // 1 to 20
  attack: number; // 0.001 to 1.0 seconds
  release: number; // 0.01 to 1.0 seconds
  knee: number; // 0 to 40 dB
  makeupGain: number; // 0 to 24 dB
  simpleIntensity: number; // 0 to 100% for simple mode
}

export interface LimiterSettings {
  enabled: boolean;
  ceiling: number; // -12 to 0 dB
  threshold: number; // -24 to 0 dB
  release: number; // 0.01 to 0.5 s
}

export type NormalizationMode = 'off' | 'track' | 'album' | 'smart';

export interface LoudnessSettings {
  enabled: boolean;
  mode: NormalizationMode;
  targetLufs: number; // e.g. -14 LUFS
}

// -------------------------------------------------------------
// SPATIAL AUDIO TYPES
// -------------------------------------------------------------

export type SpatialMode = 'off' | 'stereo_wide' | 'spatial' | '3d' | 'cinema' | 'headphones';

export interface SpatialSettings {
  enabled: boolean;
  mode: SpatialMode;
  width: number; // 0 to 200% (1.0 = normal)
  depth: number; // 0 to 100%
  room: number; // 0 to 100% (dry to large hall)
  positionX: number; // -1 to +1
  positionY: number; // -1 to +1
  angle: number; // 0 to 360 degrees
}

export interface ImmersiveSettings {
  clarity: number; // 0 to 100%
  bassEnhancement: number; // 0 to 100%
  stereoEnhancement: number; // 0 to 100%
  dynamicRange: 'natural' | 'balanced' | 'powerful';
  volumeNormalization: boolean;
}

// -------------------------------------------------------------
// CHANNEL & PLAYBACK DSP TYPES
// -------------------------------------------------------------

export type ChannelMode = 'stereo' | 'mono' | 'swap' | 'invertL' | 'invertR';

export interface ChannelSettings {
  mode: ChannelMode;
  balance: number; // -1 (L) to +1 (R)
}

export interface PlaybackPitchTempo {
  playbackRate: number; // 0.5 to 2.0
  pitchSemitones: number; // -12 to +12
  pitchCents: number; // -50 to +50
  preservePitch: boolean; // true = time stretch without pitch change
}

// -------------------------------------------------------------
// MODULAR EFFECTS RACK
// -------------------------------------------------------------

export type EffectType = 
  | 'eq'
  | 'compressor'
  | 'limiter'
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'distortion'
  | 'saturation'
  | 'stereo_width'
  | 'bass_boost'
  | 'exciter'
  | 'noise_gate';

export interface EffectModule {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  params: Record<string, number | boolean | string>;
}

export interface AudioEffects {
  bassBoost: number; // 0 to 12 dB
  trebleBoost: number; // 0 to 12 dB
  reverb: {
    enabled: boolean;
    roomSize: number; // 0.1 to 1.0
    decay: number; // 0.5 to 5.0 seconds
    wet: number; // 0 to 1
  };
  echo: {
    enabled: boolean;
    delayTime: number; // 0.05 to 1.0 seconds
    feedback: number; // 0 to 0.8
    wet: number; // 0 to 1
  };
  chorus: {
    enabled: boolean;
    rate: number; // 0.1 to 8 Hz
    depth: number; // 0 to 1
    wet: number; // 0 to 1
  };
  flanger: {
    enabled: boolean;
    speed: number; // 0.1 to 5 Hz
    depth: number; // 0 to 1
    feedback: number; // 0 to 0.9
  };
  phaser: {
    enabled: boolean;
    rate: number; // 0.1 to 10 Hz
    depth: number; // 0 to 1
    baseFreq: number; // 200 to 2000 Hz
  };
  saturation: {
    enabled: boolean;
    drive: number; // 0 to 1
    type: 'tape' | 'tube' | 'transistor';
  };
  stereoWidth: number; // 0 to 2 (1 = normal)
  balance: number; // -1 (left) to +1 (right)
  exciter: {
    enabled: boolean;
    frequency: number; // 3000 to 10000 Hz
    amount: number; // 0 to 1
  };
  noiseGate: {
    enabled: boolean;
    threshold: number; // -80 to -20 dB
  };
}

// -------------------------------------------------------------
// PRESETS, PROFILES & SNAPSHOTS
// -------------------------------------------------------------

export interface AudioDspSnapshot {
  id?: string;
  name: string;
  createdAt?: number;
  eqGains: number[];
  eqPreset: EqualizerPreset;
  bass: number;
  treble: number;
  balance: number;
  compressor: CompressorSettings;
  limiter: LimiterSettings;
  loudness: LoudnessSettings;
  spatial: SpatialSettings;
  immersive: ImmersiveSettings;
  channel: ChannelSettings;
  effects: AudioEffects;
  effectOrder: EffectType[];
  pitchTempo: PlaybackPitchTempo;
}

export interface UserPreset {
  id: string;
  name: string;
  category: 'custom' | 'device' | 'song';
  createdAt: number;
  updatedAt: number;
  settings: AudioDspSnapshot;
}

export type ListeningDeviceType = 'speakers' | 'headphones' | 'earbuds' | 'bluetooth' | 'car' | 'custom';

export interface DeviceProfile {
  id: string;
  name: string;
  deviceType: ListeningDeviceType;
  settings: Partial<AudioDspSnapshot>;
}

export interface SongAudioProfile {
  trackId: string;
  trackTitle: string;
  useSongSettings: boolean;
  settings: AudioDspSnapshot;
}

// -------------------------------------------------------------
// ANALYSIS & METERS
// -------------------------------------------------------------

export interface RealtimeMeterData {
  peakL: number; // dB (-60 to +6)
  peakR: number; // dB
  peakLNorm: number; // 0 to 1
  peakRNorm: number; // 0 to 1
  vuL: number; // -20 to +3 dB
  vuR: number;
  approxLufs: number; // e.g. -14.2 LUFS
  dynamicRangeDb: number;
  isClipping: boolean;
  gainReductionDb: number; // from compressor
}

export interface OfflineTrackAnalysis {
  analyzedAt: number;
  duration: number;
  sampleRate: number;
  channels: number;
  fileFormat: string;
  fileSize: number;
  peakDb: number;
  truePeakEstimateDb: number;
  integratedLufs: number;
  dynamicRangeDb: number;
  estimatedBpm: number;
  spectralCentroidHz: number;
  subBassEnergy: number; // 0-1
  midEnergy: number; // 0-1
  highEnergy: number; // 0-1
}

// -------------------------------------------------------------
// MISC & APPLICATION SETTINGS
// -------------------------------------------------------------

export type VisualizerMode = 'spectrum' | 'waveform' | 'minimal' | 'bars' | 'circular' | 'wave' | 'radial';

export interface StemState {
  vocals: number; // 0 - 100%
  drums: number;
  bass: number;
  instruments: number;
  muted: {
    vocals: boolean;
    drums: boolean;
    bass: boolean;
    instruments: boolean;
  };
  solo: string | null;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  autoplay: boolean;
  crossfade: number; // seconds (0 = off, 1-12s)
  gapless: boolean;
  rememberPosition: boolean;
  defaultVolume: number; // 0 - 1
  defaultSpeed: number; // 0.5 - 2
  defaultEQPreset: EqualizerPreset;
  visualizerSensitivity: number;
  defaultVisualizer: VisualizerMode;
  advancedMode: boolean; // Simple vs Pro Audio Studio
  qualityDsp: 'standard' | 'high' | 'ultra';
  autoNormalize: boolean;
  activeDeviceId?: string;
  useSongProfiles: boolean;
}

// -------------------------------------------------------------
// PHASE 2: AURA SOUND LAB TYPES
// -------------------------------------------------------------

export type ABMode = 'A' | 'B'; // A = Original (Unprocessed), B = Processed

export interface QuickSoundSettings {
  bass: number; // 0 to 100 (50 is neutral)
  clarity: number; // 0 to 100 (50 is neutral)
  warmth: number; // 0 to 100 (50 is neutral)
  spatial: number; // 0 to 100 (0 is off/stereo, 100 is ultra wide)
  reverb: number; // 0 to 100 (0 is dry, 100 is deep atmosphere)
  loudness: number; // 0 to 100 (50 is standard output)
}

export type LoopABMode = 'forever' | 1 | 2 | 4;

export interface LoopABState {
  enabled: boolean;
  pointA: number | null; // start time in seconds
  pointB: number | null; // end time in seconds
  mode: LoopABMode; // loop count limit
  currentCount: number;
}

export type ChannelMonitorMode = 'stereo' | 'left' | 'right' | 'mono';

export interface StereoControlState {
  width: number; // 0.0 (Mono) to 2.0 (Ultra-wide), 1.0 = Normal Stereo
  balance: number; // -1.0 (Left) to +1.0 (Right), 0 = Center
  isMono: boolean;
  monitorMode: ChannelMonitorMode;
}

export interface TrimFadeState {
  trimStart: number; // seconds
  trimEnd: number; // seconds
  fadeIn: number; // seconds (0 to 10)
  fadeOut: number; // seconds (0 to 10)
  isPlayingPreview: boolean;
}

export interface ExportAudioOptions {
  filename?: string;
  format: 'wav'; // Browser-standard high fidelity lossless rendering
  bitDepth: 16 | 24 | 32; // 16-bit CD, 24-bit Studio Master, 32-bit Float
  sampleRate: 44100 | 48000 | 96000;
  applyDsp: boolean;
  applyTrim: boolean;
  trimStart?: number;
  trimEnd?: number;
  fadeIn?: number;
  fadeOut?: number;
  normalizeLufs?: boolean;
}

export type MarkerType = 'custom' | 'chorus' | 'drop' | 'solo' | 'intro' | 'favorite';

export interface WaveformMarker {
  id: string;
  trackId: string;
  time: number; // in seconds
  label: string; // e.g. "Chorus", "Drop", "Favorite", "Solo", "Intro"
  type?: MarkerType;
  color?: string;
  createdAt: number;
}

export interface AuraMoment {
  id: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  coverUrl?: string;
  timestamp: number; // in seconds
  note: string;
  createdAt: number;
  color?: string;
}

export type SoundLabPresetId = 
  | 'flat'
  | 'deep_bass'
  | 'vocal_focus'
  | 'warm'
  | 'clear'
  | 'wide'
  | 'night'
  | 'studio'
  | 'cinema'
  | 'acoustic';

export interface SoundLabPreset {
  id: SoundLabPresetId | string;
  name: string;
  description: string;
  category?: 'built-in' | 'custom';
  isBuiltIn: boolean;
  quickSound: QuickSoundSettings;
  snapshot: AudioDspSnapshot;
}
