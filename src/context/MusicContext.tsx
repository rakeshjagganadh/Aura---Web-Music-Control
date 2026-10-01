import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  Track, 
  Playlist, 
  RepeatMode, 
  EqualizerPreset, 
  AudioEffects, 
  StemState, 
  AppSettings, 
  NavView,
  VisualizerMode,
  CompressorSettings,
  LimiterSettings,
  LoudnessSettings,
  SpatialSettings,
  ImmersiveSettings,
  ChannelSettings,
  PlaybackPitchTempo,
  AudioDspSnapshot,
  UserPreset,
  DeviceProfile,
  SongAudioProfile,
  OfflineTrackAnalysis,
  ListeningDeviceType,
  SoundLabPreset,
  QuickSoundSettings,
  LoopABState,
  LoopABMode,
  StereoControlState,
  ChannelMonitorMode,
  TrimFadeState,
  ExportAudioOptions,
  WaveformMarker,
  AuraMoment,
  MarkerType
} from '../types';
import { audioEngine, SYSTEM_EQ_PRESETS, EQ_10_BANDS } from '../services/audioEngine';
import { storageService } from '../services/storage';
import { generateDemoTracks } from '../services/demoTracks';
import { MetadataParser } from '../services/metadataParser';
import { AudioAnalysisService } from '../services/audioAnalysis';
import { SOUND_LAB_PRESETS } from '../services/soundLabPresets';
import { formatSeconds } from '../utils/formatTime';
import { youtubePlayerBridge } from '../services/youtubePlayerBridge';
import { backgroundAudioKeepAlive } from '../services/backgroundAudioKeepAlive';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type AudioControlTab = 
  | 'overview' 
  | 'eq' 
  | 'dynamics' 
  | 'spatial' 
  | 'effects' 
  | 'channels' 
  | 'analysis' 
  | 'presets';

export type PlaybackSource = 'local' | 'youtube' | 'audius' | 'none';

export interface MusicContextType {
  // Navigation & View
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeSearchIndex: number;
  setActiveSearchIndex: (idx: number) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;

  // Library & Data
  tracks: Track[];
  playlists: Playlist[];
  favoriteIds: Set<string>;
  storageUsage: { trackCount: number; approxBytes: number };
  isLoadingLibrary: boolean;

  // Playback State
  currentTrack: Track | null;
  activeSource: PlaybackSource;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isSeeking: boolean;
  setIsSeeking: (seeking: boolean) => void;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
  queueIndex: number;
  history: Track[];

  // Basic Audio & Tone
  bass: number;
  treble: number;
  balance: number;
  setBass: (db: number) => void;
  setTreble: (db: number) => void;
  setBalance: (pan: number) => void;

  // Equalizer (10-Band)
  eqPreset: EqualizerPreset;
  eqGains: number[];
  setEQGain: (bandIndex: number, gain: number) => void;
  setEQBandQ: (bandIndex: number, q: number) => void;
  setEQPreset: (preset: EqualizerPreset) => void;
  resetEQ: () => void;

  // Dynamics (Compressor, Limiter, Loudness)
  compressor: CompressorSettings;
  updateCompressor: (settings: Partial<CompressorSettings>) => void;
  resetCompressor: () => void;
  limiter: LimiterSettings;
  updateLimiter: (settings: Partial<LimiterSettings>) => void;
  resetLimiter: () => void;
  loudness: LoudnessSettings;
  updateLoudness: (settings: Partial<LoudnessSettings>) => void;

  // Spatial Audio & Immersive
  spatial: SpatialSettings;
  updateSpatial: (settings: Partial<SpatialSettings>) => void;
  resetSpatial: () => void;
  immersive: ImmersiveSettings;
  updateImmersive: (settings: Partial<ImmersiveSettings>) => void;

  // Channel & Pitch/Tempo
  channel: ChannelSettings;
  updateChannels: (settings: Partial<ChannelSettings>) => void;
  pitchTempo: PlaybackPitchTempo;
  updatePitchTempo: (settings: Partial<PlaybackPitchTempo>) => void;
  resetPitchTempo: () => void;

  // Effects Rack
  effects: AudioEffects;
  updateEffects: (fx: Partial<AudioEffects>) => void;
  resetEffects: () => void;

  // A/B Comparison & Bypass
  isABBypassed: boolean;
  toggleABBypass: () => void;
  setABBypass: (bypass: boolean) => void;
  resetAllAudioProcessing: () => void;

  // Presets & Profiles System
  userPresets: UserPreset[];
  saveCurrentAsPreset: (name: string, category?: 'custom' | 'device') => Promise<void>;
  applyPresetSnapshot: (snapshot: AudioDspSnapshot, presetName?: string) => void;
  deleteUserPreset: (presetId: string) => Promise<void>;
  
  // Per-Song Profiles
  useSongProfiles: boolean;
  toggleUseSongProfiles: () => void;
  hasSongProfile: boolean;
  saveCurrentAsSongProfile: () => Promise<void>;
  clearSongProfile: () => Promise<void>;

  // Device Profiles
  deviceProfiles: DeviceProfile[];
  activeDeviceId: string | null;
  setActiveDeviceId: (id: string | null) => void;
  saveCurrentAsDeviceProfile: (name: string, deviceType: ListeningDeviceType) => Promise<void>;

  // Copy & Paste Settings Buffer
  hasCopiedSettings: boolean;
  copyCurrentSettings: () => void;
  pasteSettings: () => void;

  // Track Analysis & Info Modal
  currentTrackAnalysis: OfflineTrackAnalysis | null;
  isAnalyzingTrack: boolean;
  analyzeCurrentTrack: () => Promise<void>;
  isTrackInfoOpen: boolean;
  selectedInfoTrack: Track | null;
  openTrackInfo: (track: Track) => void;
  closeTrackInfo: () => void;

  // Visualizer & Stems
  visualizerMode: VisualizerMode;
  setVisualizerMode: (mode: VisualizerMode) => void;
  stemState: StemState;
  updateStemState: (stems: Partial<StemState>) => void;

  // Settings & Progressive Disclosure
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isAdvancedMode: boolean;
  toggleAdvancedMode: () => void;

  // Sleep Timer
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSecs: number | null;
  isSleepTimerActive: boolean;
  isSleepTimerModalOpen: boolean;
  setIsSleepTimerModalOpen: (open: boolean) => void;
  startSleepTimer: (minutes: number) => void;
  setSleepTimerAtTrackEnd: () => void;
  cancelSleepTimer: () => void;

  // Sound Lab Phase 2 Features
  abMode: 'A' | 'B';
  setABMode: (mode: 'A' | 'B') => void;
  isMasterBypass: boolean;
  toggleMasterBypass: () => void;

  // Quick Sound Controls (Macro Sliders)
  quickSound: QuickSoundSettings;
  updateQuickSound: (settings: Partial<QuickSoundSettings>) => void;
  resetQuickSound: () => void;

  // Sound Lab Presets
  soundLabPresets: SoundLabPreset[];
  activeSoundLabPreset: string;
  applySoundLabPreset: (presetId: string) => void;
  saveCustomSoundLabPreset: (name: string, description?: string) => Promise<void>;
  deleteCustomSoundLabPreset: (id: string) => Promise<void>;
  duplicateCustomSoundLabPreset: (id: string) => Promise<void>;

  // Loop A/B Precision Controller
  loopAB: LoopABState;
  setLoopPointA: (time?: number) => void;
  setLoopPointB: (time?: number) => void;
  clearLoopAB: () => void;
  toggleLoopAB: (enabled?: boolean) => void;
  setLoopABMode: (mode: LoopABMode) => void;
  updateLoopAB: (settings: Partial<LoopABState>) => void;

  // Stereo Control & Phase Correlation
  stereoControl: StereoControlState;
  setStereoWidth: (width: number) => void;
  setStereoBalance: (balance: number) => void;
  toggleMono: (isMono?: boolean) => void;
  setChannelMonitor: (mode: ChannelMonitorMode) => void;
  getStereoCorrelation: () => { correlation: number; leftEnergy: number; rightEnergy: number; widthPct: number };

  // Pitch & Tempo
  pitchSemitones: number;
  setPitchSemitones: (semitones: number) => void;
  setTempoRate: (rate: number) => void;
  setPreservePitchLock: (preserve: boolean) => void;

  // Waveform Markers
  markers: WaveformMarker[];
  addMarker: (time?: number, label?: string, type?: MarkerType, color?: string) => Promise<WaveformMarker>;
  jumpToMarker: (marker: WaveformMarker) => void;
  updateMarker: (id: string, label: string, color?: string) => Promise<void>;
  deleteMarker: (id: string) => Promise<void>;

  // Aura Moments (Saved Timestamps + Notes)
  moments: AuraMoment[];
  saveMoment: (note?: string, track?: Track, timestamp?: number) => Promise<AuraMoment>;
  jumpToMoment: (moment: AuraMoment) => void;
  deleteMoment: (id: string) => Promise<void>;

  // Trim, Fade & High-Res Audio Export
  trimFade: TrimFadeState;
  updateTrimFade: (settings: Partial<TrimFadeState>) => void;
  previewTrimmedSection: () => void;
  stopTrimPreview: () => void;
  saveTrimmedClip: (newTitle?: string) => Promise<Track | null>;
  exportTrack: (options: ExportAudioOptions) => Promise<{ blob: Blob; filename: string }>;

  // UI Panels & Modals
  activeAudioTab: AudioControlTab;
  setActiveAudioTab: (tab: AudioControlTab) => void;
  isExpandedPlayerOpen: boolean;
  setIsExpandedPlayerOpen: (open: boolean) => void;
  isQueueDrawerOpen: boolean;
  setIsQueueDrawerOpen: (open: boolean) => void;
  isAudioControlsOpen: boolean;
  setIsAudioControlsOpen: (open: boolean) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isPlaylistModalOpen: boolean;
  setIsPlaylistModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isTrimExportModalOpen: boolean;
  setIsTrimExportModalOpen: (open: boolean) => void;
  isMomentsModalOpen: boolean;
  setIsMomentsModalOpen: (open: boolean) => void;
  isPresetsModalOpen: boolean;
  setIsPresetsModalOpen: (open: boolean) => void;
  isDraggingFile: boolean;
  setIsDraggingFile: (dragging: boolean) => void;

  // Player Actions
  switchToTrack: (track: Track | null, options?: { autoplay?: boolean; newQueue?: Track[]; index?: number; startTime?: number }) => Promise<void>;
  playTrack: (track: Track, fromQueue?: Track[]) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  seekRelative: (delta: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  registerTrackEndedHandler: (handler: () => boolean) => () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // Queue Actions
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;

  // Library Actions
  toggleFavorite: (trackId: string) => Promise<void>;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  loadDemoPack: () => Promise<void>;
  clearLibrary: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // Playlist Actions
  createPlaylist: (title: string, description?: string, coverGradient?: string) => Promise<Playlist>;
  updatePlaylist: (playlist: Playlist) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
}

// -------------------------------------------------------------
// DEFAULTS
// -------------------------------------------------------------

const DEFAULT_EFFECTS: AudioEffects = {
  bassBoost: 0,
  trebleBoost: 0,
  reverb: { enabled: false, roomSize: 0.5, decay: 1.5, wet: 0.35 },
  echo: { enabled: false, delayTime: 0.25, feedback: 0.35, wet: 0.3 },
  chorus: { enabled: false, rate: 1.5, depth: 0.5, wet: 0.35 },
  flanger: { enabled: false, speed: 0.8, depth: 0.5, feedback: 0.4 },
  phaser: { enabled: false, rate: 1.0, depth: 0.6, baseFreq: 800 },
  saturation: { enabled: false, drive: 0.3, type: 'tape' },
  stereoWidth: 1.0,
  balance: 0,
  exciter: { enabled: false, frequency: 4500, amount: 0.4 },
  noiseGate: { enabled: false, threshold: -60 },
};

const DEFAULT_COMPRESSOR: CompressorSettings = {
  enabled: false,
  threshold: -20,
  ratio: 4,
  attack: 0.005,
  release: 0.2,
  knee: 20,
  makeupGain: 0,
  simpleIntensity: 40,
};

const DEFAULT_LIMITER: LimiterSettings = {
  enabled: true,
  ceiling: -0.2,
  threshold: -1.0,
  release: 0.12,
};

const DEFAULT_LOUDNESS: LoudnessSettings = {
  enabled: false,
  mode: 'track',
  targetLufs: -14,
};

const DEFAULT_SPATIAL: SpatialSettings = {
  enabled: false,
  mode: 'off',
  width: 1.0,
  depth: 0.4,
  room: 0,
  positionX: 0,
  positionY: 0,
  angle: 0,
};

const DEFAULT_IMMERSIVE: ImmersiveSettings = {
  clarity: 0,
  bassEnhancement: 0,
  stereoEnhancement: 0,
  dynamicRange: 'balanced',
  volumeNormalization: false,
};

const DEFAULT_CHANNELS: ChannelSettings = {
  mode: 'stereo',
  balance: 0,
};

const DEFAULT_PITCH_TEMPO: PlaybackPitchTempo = {
  playbackRate: 1.0,
  pitchSemitones: 0,
  pitchCents: 0,
  preservePitch: true,
};

const DEFAULT_STEMS: StemState = {
  vocals: 100,
  drums: 100,
  bass: 100,
  instruments: 100,
  muted: { vocals: false, drums: false, bass: false, instruments: false },
  solo: null,
};

const DEFAULT_QUICK_SOUND: QuickSoundSettings = {
  bass: 50,
  clarity: 50,
  warmth: 50,
  spatial: 50,
  reverb: 30,
  loudness: 50,
};

const DEFAULT_LOOP_AB: LoopABState = {
  enabled: false,
  pointA: null,
  pointB: null,
  mode: 'forever',
  currentCount: 0,
};

const DEFAULT_STEREO_CONTROL: StereoControlState = {
  width: 1.0,
  balance: 0,
  isMono: false,
  monitorMode: 'stereo',
};

const DEFAULT_TRIM_FADE: TrimFadeState = {
  trimStart: 0,
  trimEnd: 0,
  fadeIn: 0,
  fadeOut: 0,
  isPlayingPreview: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoplay: true,
  crossfade: 0,
  gapless: true,
  rememberPosition: true,
  defaultVolume: 0.85,
  defaultSpeed: 1.0,
  defaultEQPreset: 'flat',
  visualizerSensitivity: 1.0,
  defaultVisualizer: 'waveform',
  advancedMode: false,
  qualityDsp: 'high',
  autoNormalize: false,
  useSongProfiles: true,
};

const pathToNavView = (pathname: string, search: string, hash: string): NavView => {
  const p = pathname.toLowerCase();
  const params = new URLSearchParams(search);
  const h = hash.toLowerCase();

  if (params.get('room') || p.startsWith('/listen') || h.includes('/listen')) {
    return 'listen-together';
  }
  if (p === '/songs' || h === '#songs') return 'songs';
  if (p === '/studio' || h === '#studio') return 'studio';
  if (p === '/sources' || h === '#sources') return 'sources';
  if (p === '/albums' || h === '#albums') return 'albums';
  if (p === '/artists' || h === '#artists') return 'artists';
  if (p === '/playlists' || h === '#playlists') return 'playlists';
  if (p === '/favorites' || h === '#favorites') return 'favorites';
  if (p === '/settings' || h === '#settings') return 'settings';
  if (p === '/playlist-detail') return 'playlist-detail';
  return 'home';
};

const navViewToPath = (view: NavView): string => {
  switch (view) {
    case 'home': return '/';
    case 'songs': return '/songs';
    case 'studio': return '/studio';
    case 'sources': return '/sources';
    case 'albums': return '/albums';
    case 'artists': return '/artists';
    case 'playlists': return '/playlists';
    case 'favorites': return '/favorites';
    case 'settings': return '/settings';
    case 'listen-together': return '/listen';
    default: return '/';
  }
};

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & View
  const [currentView, setCurrentViewState] = useState<NavView>(() => {
    if (typeof window !== 'undefined') {
      return pathToNavView(window.location.pathname, window.location.search, window.location.hash);
    }
    return 'home';
  });

  const setCurrentView = useCallback((view: NavView) => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Preserve active room invite URLs like /listen/ABC123
      if (view === 'listen-together' && (currentPath.startsWith('/listen/') || window.location.search.includes('room='))) {
        return;
      }
      const targetPath = navViewToPath(view);
      if (currentPath !== targetPath && !(currentPath === '/' && targetPath === '/')) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, []);

  // Keep navigation in sync with browser forward/back buttons and hash navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const detected = pathToNavView(window.location.pathname, window.location.search, window.location.hash);
      setCurrentViewState(detected);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(0);

  // Library
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [storageUsage, setStorageUsage] = useState({ trackCount: 0, approxBytes: 0 });
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    setActiveSearchIndex(0);
  }, []);

  const nextSearchResult = useCallback(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const matching = tracks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.fileFormat.toLowerCase().includes(q)
    );
    if (matching.length === 0) return;
    setActiveSearchIndex((prev) => (prev + 1) % matching.length);
  }, [searchQuery, tracks]);

  const prevSearchResult = useCallback(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const matching = tracks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.fileFormat.toLowerCase().includes(q)
    );
    if (matching.length === 0) return;
    setActiveSearchIndex((prev) => (prev - 1 + matching.length) % matching.length);
  }, [searchQuery, tracks]);

  // Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [activeSource, setActiveSource] = useState<PlaybackSource>('none');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [history, setHistory] = useState<Track[]>([]);

  // Toasts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Internal Stable References for Event Subscriptions & Race Prevention
  const activeSourceRef = useRef<PlaybackSource>('none');
  activeSourceRef.current = activeSource;

  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;

  const queueRef = useRef<Track[]>([]);
  queueRef.current = queue;

  const queueIndexRef = useRef<number>(-1);
  queueIndexRef.current = queueIndex;

  const isShuffleRef = useRef<boolean>(false);
  isShuffleRef.current = isShuffle;

  const repeatModeRef = useRef<RepeatMode>('off');
  repeatModeRef.current = repeatMode;

  const playbackRequestIdRef = useRef<number>(0);
  const handleTrackEndedRef = useRef<() => void>(() => {});

  // Basic Tone & Controls
  const [bass, setBassState] = useState(0);
  const [treble, setTrebleState] = useState(0);
  const [balance, setBalanceState] = useState(0);

  // Equalizer
  const [eqPreset, setEqPresetState] = useState<EqualizerPreset>('flat');
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Dynamics & Spatial
  const [compressor, setCompressorState] = useState<CompressorSettings>(DEFAULT_COMPRESSOR);
  const [limiter, setLimiterState] = useState<LimiterSettings>(DEFAULT_LIMITER);
  const [loudness, setLoudnessState] = useState<LoudnessSettings>(DEFAULT_LOUDNESS);
  const [spatial, setSpatialState] = useState<SpatialSettings>(DEFAULT_SPATIAL);
  const [immersive, setImmersiveState] = useState<ImmersiveSettings>(DEFAULT_IMMERSIVE);

  // Channels & Pitch/Tempo
  const [channel, setChannelState] = useState<ChannelSettings>(DEFAULT_CHANNELS);
  const [pitchTempo, setPitchTempoState] = useState<PlaybackPitchTempo>(DEFAULT_PITCH_TEMPO);

  // Effects Rack
  const [effects, setEffects] = useState<AudioEffects>(DEFAULT_EFFECTS);
  const [stemState, setStemState] = useState<StemState>(DEFAULT_STEMS);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('waveform');

  // A/B Matrix & Master Bypass
  const [isABBypassed, setIsABBypassed] = useState(false);
  const [abMode, setABModeState] = useState<'A' | 'B'>('B');
  const [isMasterBypass, setIsMasterBypassState] = useState(false);

  // Sound Lab Phase 2 States
  const [quickSound, setQuickSoundState] = useState<QuickSoundSettings>(DEFAULT_QUICK_SOUND);
  const [soundLabPresets, setSoundLabPresets] = useState<SoundLabPreset[]>(SOUND_LAB_PRESETS);
  const [activeSoundLabPreset, setActiveSoundLabPreset] = useState<string>('flat');
  const [loopAB, setLoopABState] = useState<LoopABState>(DEFAULT_LOOP_AB);
  const [stereoControl, setStereoControlState] = useState<StereoControlState>(DEFAULT_STEREO_CONTROL);
  const [trimFade, setTrimFadeState] = useState<TrimFadeState>(DEFAULT_TRIM_FADE);
  const [markers, setMarkers] = useState<WaveformMarker[]>([]);
  const [moments, setMoments] = useState<AuraMoment[]>([]);

  // Presets & Profiles
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [useSongProfiles, setUseSongProfiles] = useState(true);
  const [hasSongProfile, setHasSongProfile] = useState(false);
  const [copiedSettings, setCopiedSettings] = useState<AudioDspSnapshot | null>(null);

  // Track Analysis & Info Modal
  const [currentTrackAnalysis, setCurrentTrackAnalysis] = useState<OfflineTrackAnalysis | null>(null);
  const [isAnalyzingTrack, setIsAnalyzingTrack] = useState(false);
  const [isTrackInfoOpen, setIsTrackInfoOpen] = useState(false);
  const [selectedInfoTrack, setSelectedInfoTrack] = useState<Track | null>(null);

  // Settings & Progressive Disclosure
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeAudioTab, setActiveAudioTab] = useState<AudioControlTab>('overview');

  // Modals & Panels
  const [isExpandedPlayerOpen, setIsExpandedPlayerOpen] = useState(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const [isAudioControlsOpen, setIsAudioControlsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);
  const [isTrimExportModalOpen, setIsTrimExportModalOpen] = useState(false);
  const [isMomentsModalOpen, setIsMomentsModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Sleep Timer State
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemainingSecs, setSleepTimerRemainingSecs] = useState<number | null>(null);
  const sleepTimerMinutesRef = useRef<number | null>(null);
  sleepTimerMinutesRef.current = sleepTimerMinutes;

  // External track ended interceptor (e.g. Listen Together room queue advancement)
  const externalTrackEndedHandlerRef = useRef<(() => boolean) | null>(null);

  const registerTrackEndedHandler = useCallback((handler: () => boolean) => {
    externalTrackEndedHandlerRef.current = handler;
    return () => {
      if (externalTrackEndedHandlerRef.current === handler) {
        externalTrackEndedHandlerRef.current = null;
      }
    };
  }, []);

  // Memory cache of audio blobs
  const audioBlobCache = useRef<Map<string, Blob>>(new Map());

  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await storageService.getStorageUsage();
      setStorageUsage(stats);
    } catch {
      // ignore
    }
  }, []);

  // Current Snapshot Helper
  const getCurrentSnapshot = useCallback((name = 'Current Session'): AudioDspSnapshot => {
    return {
      name,
      createdAt: Date.now(),
      eqGains,
      eqPreset,
      bass,
      treble,
      balance,
      compressor,
      limiter,
      loudness,
      spatial,
      immersive,
      channel,
      effects,
      effectOrder: ['eq', 'compressor', 'reverb', 'delay', 'chorus', 'saturation', 'stereo_width', 'limiter'],
      pitchTempo,
    };
  }, [eqGains, eqPreset, bass, treble, balance, compressor, limiter, loudness, spatial, immersive, channel, effects, pitchTempo]);

  // Apply Full DSP Snapshot
  const applyPresetSnapshot = useCallback((snapshot: AudioDspSnapshot, presetName?: string) => {
    // 1. EQ
    setEqGains(snapshot.eqGains || [0,0,0,0,0,0,0,0,0,0]);
    setEqPresetState(snapshot.eqPreset || 'custom');
    snapshot.eqGains?.forEach((g, idx) => audioEngine.setEQBandGain(idx, g));

    // 2. Tone
    const b = snapshot.bass ?? 0;
    const t = snapshot.treble ?? 0;
    setBassState(b);
    setTrebleState(t);
    audioEngine.setToneBassTreble(b, t);

    // 3. Balance
    const bal = snapshot.balance ?? 0;
    setBalanceState(bal);
    audioEngine.setBalance(bal);

    // 4. Dynamics
    if (snapshot.compressor) {
      setCompressorState(snapshot.compressor);
      audioEngine.setCompressor(snapshot.compressor);
    }
    if (snapshot.limiter) {
      setLimiterState(snapshot.limiter);
      audioEngine.setLimiter(snapshot.limiter);
    }
    if (snapshot.loudness) {
      setLoudnessState(snapshot.loudness);
      audioEngine.setLoudnessNormalization(snapshot.loudness);
    }

    // 5. Spatial
    if (snapshot.spatial) {
      setSpatialState(snapshot.spatial);
      audioEngine.setSpatialAudio(snapshot.spatial, snapshot.immersive);
    }
    if (snapshot.immersive) {
      setImmersiveState(snapshot.immersive);
    }

    // 6. Channel
    if (snapshot.channel) {
      setChannelState(snapshot.channel);
      audioEngine.setChannelSettings(snapshot.channel);
    }

    // 7. Effects
    if (snapshot.effects) {
      setEffects(snapshot.effects);
      audioEngine.setEffects(snapshot.effects);
    }

    // 8. Pitch & Tempo
    if (snapshot.pitchTempo) {
      setPitchTempoState(snapshot.pitchTempo);
      audioEngine.setPlaybackRate(snapshot.pitchTempo.playbackRate || 1.0);
      audioEngine.setPreservePitch(snapshot.pitchTempo.preservePitch ?? true);
      audioEngine.setPitchSemitones(snapshot.pitchTempo.pitchSemitones || 0, snapshot.pitchTempo.preservePitch);
    }

    if (presetName) {
      showToast(`Applied preset: ${presetName}`, 'success');
    }
  }, [showToast]);

  // Load Saved Presets & Library on Startup
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        setIsLoadingLibrary(true);
        const [
          savedTracks, 
          savedPlaylists, 
          savedFavs, 
          savedSettings,
          savedPresets,
          savedDevices
        ] = await Promise.all([
          storageService.getAllTracks(),
          storageService.getAllPlaylists(),
          storageService.getFavorites(),
          storageService.getSettings(),
          storageService.getAllUserPresets(),
          storageService.getAllDeviceProfiles(),
        ]);

        if (!isMounted) return;

        if (savedSettings) {
          setSettings(savedSettings);
          setVolumeState(savedSettings.defaultVolume ?? 0.85);
          setPlaybackRateState(savedSettings.defaultSpeed ?? 1.0);
          setVisualizerMode(savedSettings.defaultVisualizer || 'waveform');
          setUseSongProfiles(savedSettings.useSongProfiles ?? true);
          if (savedSettings.defaultEQPreset) {
            setEqPresetState(savedSettings.defaultEQPreset);
            const gains = SYSTEM_EQ_PRESETS[savedSettings.defaultEQPreset] || SYSTEM_EQ_PRESETS.flat;
            setEqGains(gains);
          }
        }

        setPlaylists(savedPlaylists);
        setFavoriteIds(new Set(savedFavs));
        setUserPresets(savedPresets);
        setDeviceProfiles(savedDevices);

        // Load moments
        try {
          const savedMoments = await storageService.getAllMoments();
          setMoments(savedMoments);
        } catch {
          // ignore
        }

        const favSet = new Set(savedFavs);
        const tracksWithFav = savedTracks.map(t => ({
          ...t,
          isFavorite: favSet.has(t.id),
        }));

        setTracks(tracksWithFav);
        await refreshStorageStats();

      } catch (err) {
        console.error('Failed to initialize local music storage:', err);
      } finally {
        if (isMounted) setIsLoadingLibrary(false);
      }
    }

    initData();

    // Hook audio engine event subscriptions (Local Audio Engine & Audius Streams)
    const unsubAudioTime = audioEngine.onTimeUpdate((time, dur) => {
      if (activeSourceRef.current === 'local' || activeSourceRef.current === 'audius') {
        setCurrentTime(time);
        if (dur > 0) setDuration(dur);
      }
    });

    const unsubAudioState = audioEngine.onStateChange((playing) => {
      if (activeSourceRef.current === 'local' || activeSourceRef.current === 'audius') {
        setIsPlaying(playing);
      }
    });

    const unsubAudioEnded = audioEngine.onEnded(() => {
      if (activeSourceRef.current === 'local' || activeSourceRef.current === 'audius') {
        handleTrackEndedRef.current();
      }
    });

    // Hook YouTube player bridge subscriptions (YouTube Streams)
    const unsubYTTime = youtubePlayerBridge.onTimeUpdate((time, dur) => {
      if (activeSourceRef.current === 'youtube') {
        setCurrentTime(time);
        if (dur > 0) setDuration(dur);
      }
    });

    const unsubYTState = youtubePlayerBridge.subscribe((state) => {
      if (activeSourceRef.current === 'youtube') {
        setIsPlaying(state.isPlaying);
        if (state.duration > 0) setDuration(state.duration);
      }
    });

    const unsubYTEnded = youtubePlayerBridge.onEnded(() => {
      if (activeSourceRef.current === 'youtube') {
        handleTrackEndedRef.current();
      }
    });

    const unsubYTError = youtubePlayerBridge.onError((code, msg) => {
      if (activeSourceRef.current === 'youtube') {
        setIsPlaying(false);
        showToast(msg, 'warning');
      }
    });

    return () => {
      isMounted = false;
      unsubAudioTime();
      unsubAudioState();
      unsubAudioEnded();
      unsubYTTime();
      unsubYTState();
      unsubYTEnded();
      unsubYTError();
    };
  }, [refreshStorageStats, showToast]);

  // Unified Single-Pipeline Track Switcher
  const switchToTrack = useCallback(async (
    track: Track | null,
    options?: { autoplay?: boolean; newQueue?: Track[]; index?: number; startTime?: number }
  ) => {
    const requestId = ++playbackRequestIdRef.current;
    const shouldAutoplay = options?.autoplay ?? true;
    const initialStartTime = (typeof options?.startTime === 'number' && options.startTime > 0)
      ? Math.max(0, options.startTime)
      : 0;

    // STEP 1: Handle null track (stop everything)
    if (!track) {
      audioEngine.pause();
      youtubePlayerBridge.pause();
      youtubePlayerBridge.stop();
      activeSourceRef.current = 'none';
      setActiveSource('none');
      setCurrentTrack(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const targetSource: PlaybackSource = 
      (track.source === 'youtube' && !!track.sourceId)
        ? 'youtube'
        : (track.source === 'audius')
        ? 'audius'
        : 'local';

    // STEP 2: Stop all other engines to eliminate sound bleed or overlap
    if (targetSource === 'youtube') {
      audioEngine.pause();
    } else {
      youtubePlayerBridge.pause();
      youtubePlayerBridge.stop();
    }

    // STEP 3: Reset source-specific playback state & UI counters
    setCurrentTime(initialStartTime);
    setDuration(track.duration || 0);
    setIsPlaying(false); // Only confirmed when engine starts playing
    setTrimFadeState({
      trimStart: 0,
      trimEnd: track.duration || 0,
      fadeIn: 0,
      fadeOut: 0,
      isPlayingPreview: false,
    });

    // STEP 4: Set new currentTrack and activeSource
    setCurrentTrack(track);
    activeSourceRef.current = targetSource;
    setActiveSource(targetSource);

    if (shouldAutoplay) {
      if (targetSource === 'youtube') {
        backgroundAudioKeepAlive.startYouTubeKeepAlive();
      } else {
        backgroundAudioKeepAlive.startKeepAlive();
      }
    }

    // STEP 5: Update Queue
    if (options?.newQueue && options.newQueue.length > 0) {
      setQueue(options.newQueue);
      const idx = options.index ?? options.newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else if (typeof options?.index === 'number') {
      setQueueIndex(options.index);
    } else {
      setQueue((prevQueue) => {
        const idx = prevQueue.findIndex((t) => t.id === track.id);
        if (idx >= 0) {
          setQueueIndex(idx);
          return prevQueue;
        } else {
          setQueueIndex(prevQueue.length);
          return [...prevQueue, track];
        }
      });
    }

    // STEP 6: History
    setHistory((prev) => [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 30));

    // STEP 7: Initialize & Load target playback engine
    if (targetSource === 'youtube') {
      setMarkers([]);
      setHasSongProfile(false);

      youtubePlayerBridge.loadAndPlay(track.sourceId!, {
        autoplay: shouldAutoplay,
        volume: isMuted ? 0 : Math.round(volume * 100),
        isMuted,
        playbackRate,
        requestId,
        startTime: initialStartTime,
      });
    } else {
      // Local source: retrieve blob or URL
      let blob = audioBlobCache.current.get(track.id);
      if (!blob) {
        try {
          const storedBlob = await storageService.getAudioBlob(track.id);
          if (storedBlob) {
            blob = storedBlob;
            audioBlobCache.current.set(track.id, storedBlob);
          }
        } catch {
          // ignore
        }
      }

      // Discard stale request if a newer track was selected during async fetch
      if (requestId !== playbackRequestIdRef.current) {
        return;
      }

      if (!blob && !track.audioUrl) {
        showToast(`Could not load audio for "${track.title}".`, 'error');
        setIsPlaying(false);
        return;
      }

      // Waveform markers
      try {
        const trackMarkers = await storageService.getMarkersForTrack(track.id);
        if (requestId === playbackRequestIdRef.current) {
          setMarkers(trackMarkers.sort((a, b) => a.time - b.time));
        }
      } catch {
        if (requestId === playbackRequestIdRef.current) setMarkers([]);
      }

      // Per-song EQ / DSP profile
      if (useSongProfiles) {
        try {
          const songProfile = await storageService.getSongProfile(track.id);
          if (requestId === playbackRequestIdRef.current) {
            if (songProfile && songProfile.useSongSettings) {
              setHasSongProfile(true);
              applyPresetSnapshot(songProfile.settings);
            } else {
              setHasSongProfile(false);
            }
          }
        } catch {
          if (requestId === playbackRequestIdRef.current) setHasSongProfile(false);
        }
      }

      // Load into local audio engine
      try {
        if (blob) {
          await audioEngine.loadTrack(track, blob, shouldAutoplay, initialStartTime);
        } else if (track.audioUrl) {
          await audioEngine.loadTrack(track, track.audioUrl, shouldAutoplay, initialStartTime);
        }
      } catch (err) {
        if (requestId === playbackRequestIdRef.current) {
          console.error('Error loading audio track:', err);
          const errorMsg = track.source === 'audius'
            ? `Unable to stream Audius track "${track.title}".`
            : `Error playing "${track.title}".`;
          showToast(errorMsg, 'error');
          setIsPlaying(false);
        }
      }
    }
  }, [volume, isMuted, playbackRate, useSongProfiles, applyPresetSnapshot, showToast]);

  // Handle Play Track
  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (track.source !== 'youtube') {
      backgroundAudioKeepAlive.startKeepAlive();
    }
    await switchToTrack(track, { autoplay: true, newQueue });
  }, [switchToTrack]);

  const togglePlay = useCallback(() => {
    if (!currentTrackRef.current) {
      if (tracks.length > 0) {
        if (tracks[0].source !== 'youtube') {
          backgroundAudioKeepAlive.startKeepAlive();
        }
        switchToTrack(tracks[0], { autoplay: true, newQueue: tracks });
      } else {
        showToast('No tracks in your library. Upload music or try the demo pack!', 'info');
      }
      return;
    }

    if (activeSourceRef.current === 'youtube') {
      if (isPlaying) {
        backgroundAudioKeepAlive.stopKeepAlive();
        youtubePlayerBridge.pause();
      } else {
        backgroundAudioKeepAlive.startYouTubeKeepAlive();
        youtubePlayerBridge.play();
      }
    } else {
      if (isPlaying) {
        console.log('[AURA BG DEBUG] EXPLICIT PAUSE FROM AURA: togglePlay pausing audio', {
          visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
          documentHidden: typeof document !== 'undefined' ? document.hidden : false,
          activeSource: activeSourceRef.current,
        });
        backgroundAudioKeepAlive.stopKeepAlive();
        audioEngine.pause();
      } else {
        backgroundAudioKeepAlive.startKeepAlive();
        audioEngine.play();
      }
    }
  }, [tracks, isPlaying, switchToTrack, showToast]);

  const [isSeeking, setIsSeekingState] = useState(false);

  const setIsSeeking = useCallback((seeking: boolean) => {
    setIsSeekingState(seeking);
    youtubePlayerBridge.setSeeking(seeking);
  }, []);

  const seek = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, isNaN(seconds) ? 0 : seconds);
    if (activeSourceRef.current === 'youtube') {
      youtubePlayerBridge.seekTo(safeSeconds);
      setCurrentTime(safeSeconds);
    } else {
      audioEngine.seek(safeSeconds);
      setCurrentTime(safeSeconds);
    }
  }, []);

  const seekRelative = useCallback((delta: number) => {
    if (activeSourceRef.current === 'youtube') {
      const targetTime = Math.max(0, Math.min(duration || 999999, currentTime + delta));
      youtubePlayerBridge.seekTo(targetTime);
      setCurrentTime(targetTime);
    } else {
      audioEngine.seekRelative(delta);
    }
  }, [currentTime, duration]);

  const handleTrackEnded = useCallback(() => {
    // 0. Check external interceptor (e.g. ListenTogether room shared queue)
    if (externalTrackEndedHandlerRef.current && externalTrackEndedHandlerRef.current()) {
      return;
    }

    // 1. Sleep timer reached
    if (sleepTimerMinutesRef.current === -1) {
      if (activeSourceRef.current === 'youtube') {
        youtubePlayerBridge.pause();
      } else {
        audioEngine.pause();
      }
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      setSleepTimerRemainingSecs(null);
      showToast('Sleep timer reached end of track. Playback paused.', 'info');
      return;
    }

    // 2. Repeat one
    if (repeatModeRef.current === 'one') {
      if (activeSourceRef.current === 'youtube') {
        youtubePlayerBridge.seekTo(0);
        youtubePlayerBridge.play();
      } else {
        audioEngine.seek(0);
        audioEngine.play();
      }
      return;
    }

    // 3. Queue advancement
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    if (currentQ.length === 0) return;

    let nextIdx = currentIdx + 1;
    if (isShuffleRef.current && currentQ.length > 1) {
      nextIdx = Math.floor(Math.random() * currentQ.length);
      while (nextIdx === currentIdx && currentQ.length > 1) {
        nextIdx = Math.floor(Math.random() * currentQ.length);
      }
    }

    if (nextIdx >= currentQ.length) {
      if (repeatModeRef.current === 'all') {
        nextIdx = 0;
      } else {
        if (activeSourceRef.current === 'youtube') {
          youtubePlayerBridge.pause();
        } else {
          audioEngine.pause();
        }
        setIsPlaying(false);
        return;
      }
    }

    const nextTrackItem = currentQ[nextIdx];
    if (nextTrackItem) {
      switchToTrack(nextTrackItem, { autoplay: true, index: nextIdx });
    }
  }, [switchToTrack, showToast]);

  handleTrackEndedRef.current = handleTrackEnded;

  const nextTrack = useCallback(() => {
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    if (currentQ.length === 0) return;

    let nextIdx = currentIdx + 1;
    if (isShuffleRef.current && currentQ.length > 1) {
      nextIdx = Math.floor(Math.random() * currentQ.length);
      while (nextIdx === currentIdx && currentQ.length > 1) {
        nextIdx = Math.floor(Math.random() * currentQ.length);
      }
    }

    if (nextIdx >= currentQ.length) {
      if (repeatModeRef.current === 'all') {
        nextIdx = 0;
      } else {
        if (activeSourceRef.current === 'youtube') {
          youtubePlayerBridge.pause();
        } else {
          audioEngine.pause();
        }
        setIsPlaying(false);
        return;
      }
    }

    const nextTrackItem = currentQ[nextIdx];
    if (nextTrackItem) {
      switchToTrack(nextTrackItem, { autoplay: true, index: nextIdx });
    }
  }, [switchToTrack]);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    if (currentQ.length === 0) return;

    let prevIdx = currentIdx - 1;
    if (prevIdx < 0) {
      prevIdx = repeatModeRef.current === 'all' ? currentQ.length - 1 : 0;
    }

    const prevTrackItem = currentQ[prevIdx];
    if (prevTrackItem) {
      switchToTrack(prevTrackItem, { autoplay: true, index: prevIdx });
    }
  }, [currentTime, seek, switchToTrack]);

  // MediaSession API Integration for Mobile / Lock-Screen / Headphones
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Aura Studio',
        artwork: currentTrack.coverUrl
          ? [
              { src: currentTrack.coverUrl, sizes: '96x96', type: 'image/jpeg' },
              { src: currentTrack.coverUrl, sizes: '256x256', type: 'image/jpeg' },
              { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (activeSourceRef.current === 'youtube') {
          backgroundAudioKeepAlive.startYouTubeKeepAlive();
          youtubePlayerBridge.play();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        } else {
          backgroundAudioKeepAlive.startKeepAlive();
          audioEngine.play();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (activeSourceRef.current === 'youtube') {
          backgroundAudioKeepAlive.stopKeepAlive();
          youtubePlayerBridge.pause();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        } else {
          backgroundAudioKeepAlive.stopKeepAlive();
          audioEngine.pause();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        seekRelative(-(details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        seekRelative(details.seekOffset || 10);
      });
    } catch (e) {
      console.debug('MediaSession registration error:', e);
    }
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

    if (isPlaying) {
      backgroundAudioKeepAlive.startKeepAlive();
    } else {
      backgroundAudioKeepAlive.stopKeepAlive();
    }
  }, [isPlaying]);

  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: playbackRate || 1.0,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      } catch {
        // Handled silently
      }
    }
  }, [currentTime, duration, playbackRate]);

  // Keep MediaSession strictly synchronized when document visibility changes
  // to prevent OS MediaSession termination or desynchronization upon backgrounding/minimization
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilitySync = () => {
      if (!('mediaSession' in navigator) || !currentTrack) return;

      if (activeSourceRef.current === 'youtube') {
        const ytState = youtubePlayerBridge.getState();
        navigator.mediaSession.playbackState = ytState.isPlaying ? 'playing' : 'paused';

        if ('setPositionState' in navigator.mediaSession && ytState.duration > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: Math.max(0, ytState.duration),
              playbackRate: ytState.playbackRate || 1.0,
              position: Math.min(Math.max(0, ytState.currentTime), ytState.duration),
            });
          } catch (err) {
            console.debug('MediaSession setPositionState sync error on visibilitychange:', err);
          }
        }
      } else {
        const engPlaying = audioEngine.isPlaying();
        navigator.mediaSession.playbackState = engPlaying ? 'playing' : 'paused';

        if ('setPositionState' in navigator.mediaSession && duration > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: Math.max(0, duration),
              playbackRate: playbackRate || 1.0,
              position: Math.min(Math.max(0, currentTime), duration),
            });
          } catch (err) {
            console.debug('MediaSession setPositionState sync error on visibilitychange:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySync);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [currentTrack, duration, playbackRate, currentTime]);

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    audioEngine.setVolume(clamped);
    youtubePlayerBridge.setVolume(Math.round(clamped * 100));
    if (isMuted && clamped > 0) {
      setIsMuted(false);
      audioEngine.setMute(false);
      youtubePlayerBridge.setMute(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioEngine.setMute(newMuted);
    youtubePlayerBridge.setMute(newMuted);
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    audioEngine.setPlaybackRate(rate);
    setPitchTempoState(prev => ({ ...prev, playbackRate: rate }));
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    showToast(!isShuffle ? 'Shuffle on' : 'Shuffle off', 'info');
  };

  const cycleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  // Sleep Timer Countdown & Fadeout Effect
  useEffect(() => {
    if (sleepTimerRemainingSecs === null || sleepTimerMinutes === null || sleepTimerMinutes <= 0) return;

    const timer = setInterval(() => {
      setSleepTimerRemainingSecs((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          audioEngine.pause();
          setIsPlaying(false);
          setSleepTimerMinutes(null);
          showToast('Sleep timer finished. Playback paused.', 'info');
          return null;
        }
        if (prev <= 3) {
          const fadeRatio = (prev - 1) / 3;
          audioEngine.setVolume(Math.max(0, volume * fadeRatio));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerMinutes, sleepTimerRemainingSecs, volume, showToast]);

  const startSleepTimer = (minutes: number) => {
    setSleepTimerMinutes(minutes);
    setSleepTimerRemainingSecs(minutes * 60);
    showToast(`Sleep timer set for ${minutes} minutes`, 'success');
  };

  const setSleepTimerAtTrackEnd = () => {
    setSleepTimerMinutes(-1);
    setSleepTimerRemainingSecs(null);
    showToast('Sleep timer will pause playback at the end of this track', 'success');
  };

  const cancelSleepTimer = () => {
    setSleepTimerMinutes(null);
    setSleepTimerRemainingSecs(null);
    audioEngine.setVolume(volume);
    showToast('Sleep timer cancelled', 'info');
  };

  // Tone Controls
  const setBass = (db: number) => {
    setBassState(db);
    audioEngine.setToneBassTreble(db, treble);
  };

  const setTreble = (db: number) => {
    setTrebleState(db);
    audioEngine.setToneBassTreble(bass, db);
  };

  const setBalance = (pan: number) => {
    setBalanceState(pan);
    audioEngine.setBalance(pan);
    setChannelState(prev => ({ ...prev, balance: pan }));
  };

  // 10-Band EQ Handlers
  const setEQGain = (bandIndex: number, gain: number) => {
    const newGains = [...eqGains];
    newGains[bandIndex] = gain;
    setEqGains(newGains);
    setEqPresetState('custom');
    audioEngine.setEQBandGain(bandIndex, gain);
  };

  const setEQBandQ = (bandIndex: number, q: number) => {
    audioEngine.setEQBandQ(bandIndex, q);
  };

  const setEQPreset = (preset: EqualizerPreset) => {
    setEqPresetState(preset);
    const gains = audioEngine.applyEQPreset(preset);
    setEqGains(gains);
  };

  const resetEQ = () => {
    setEQPreset('flat');
    showToast('Equalizer reset to Flat', 'info');
  };

  // Dynamics Handlers
  const updateCompressor = (newSettings: Partial<CompressorSettings>) => {
    setCompressorState((prev) => {
      const merged = { ...prev, ...newSettings };
      audioEngine.setCompressor(merged);
      return merged;
    });
  };

  const resetCompressor = () => {
    setCompressorState(DEFAULT_COMPRESSOR);
    audioEngine.setCompressor(DEFAULT_COMPRESSOR);
    showToast('Compressor reset', 'info');
  };

  const updateLimiter = (newSettings: Partial<LimiterSettings>) => {
    setLimiterState((prev) => {
      const merged = { ...prev, ...newSettings };
      audioEngine.setLimiter(merged);
      return merged;
    });
  };

  const resetLimiter = () => {
    setLimiterState(DEFAULT_LIMITER);
    audioEngine.setLimiter(DEFAULT_LIMITER);
  };

  const updateLoudness = (newSettings: Partial<LoudnessSettings>) => {
    setLoudnessState((prev) => {
      const merged = { ...prev, ...newSettings };
      audioEngine.setLoudnessNormalization(merged, currentTrackAnalysis?.integratedLufs);
      return merged;
    });
  };

  // Spatial Audio Handlers
  const updateSpatial = (newSettings: Partial<SpatialSettings>) => {
    setSpatialState((prev) => {
      const merged = { ...prev, ...newSettings };
      audioEngine.setSpatialAudio(merged, immersive);
      return merged;
    });
  };

  const resetSpatial = () => {
    setSpatialState(DEFAULT_SPATIAL);
    audioEngine.setSpatialAudio(DEFAULT_SPATIAL, immersive);
    showToast('Spatial Audio reset', 'info');
  };

  const updateImmersive = (newSettings: Partial<ImmersiveSettings>) => {
    setImmersiveState((prev) => {
      const merged = { ...prev, ...newSettings };
      audioEngine.setSpatialAudio(spatial, merged);
      return merged;
    });
  };

  // Channel & Pitch/Tempo Handlers
  const updateChannels = (newSettings: Partial<ChannelSettings>) => {
    setChannelState((prev) => {
      const merged = { ...prev, ...newSettings };
      audioEngine.setChannelSettings(merged);
      return merged;
    });
  };

  const updatePitchTempo = (newSettings: Partial<PlaybackPitchTempo>) => {
    setPitchTempoState((prev) => {
      const merged = { ...prev, ...newSettings };
      if (merged.playbackRate !== undefined) {
        audioEngine.setPlaybackRate(merged.playbackRate);
        setPlaybackRateState(merged.playbackRate);
      }
      if (merged.preservePitch !== undefined) {
        audioEngine.setPreservePitch(merged.preservePitch);
      }
      if (merged.pitchSemitones !== undefined) {
        audioEngine.setPitchSemitones(merged.pitchSemitones, merged.preservePitch);
      }
      return merged;
    });
  };

  const resetPitchTempo = () => {
    updatePitchTempo(DEFAULT_PITCH_TEMPO);
    showToast('Pitch & Tempo reset to 1.0x', 'info');
  };

  // Effects Handlers
  const updateEffects = (newEffects: Partial<AudioEffects>) => {
    setEffects((prev) => {
      const merged: AudioEffects = {
        ...prev,
        ...newEffects,
        reverb: newEffects.reverb ? { ...prev.reverb, ...newEffects.reverb } : prev.reverb,
        echo: newEffects.echo ? { ...prev.echo, ...newEffects.echo } : prev.echo,
        chorus: newEffects.chorus ? { ...prev.chorus, ...newEffects.chorus } : prev.chorus,
        flanger: newEffects.flanger ? { ...prev.flanger, ...newEffects.flanger } : prev.flanger,
        phaser: newEffects.phaser ? { ...prev.phaser, ...newEffects.phaser } : prev.phaser,
        saturation: newEffects.saturation ? { ...prev.saturation, ...newEffects.saturation } : prev.saturation,
        exciter: newEffects.exciter ? { ...prev.exciter, ...newEffects.exciter } : prev.exciter,
        noiseGate: newEffects.noiseGate ? { ...prev.noiseGate, ...newEffects.noiseGate } : prev.noiseGate,
      };
      audioEngine.setEffects(merged);
      return merged;
    });
  };

  const resetEffects = () => {
    setEffects(DEFAULT_EFFECTS);
    audioEngine.setEffects(DEFAULT_EFFECTS);
    showToast('Effects rack reset', 'info');
  };

  // A/B Comparison
  const toggleABBypass = () => {
    const nextBypass = !isABBypassed;
    setIsABBypassed(nextBypass);
    audioEngine.setAB_Bypass(nextBypass);
    showToast(nextBypass ? 'Listening to A (Original Audio)' : 'Listening to B (Processed Studio Audio)', 'info');
  };

  const setABBypass = (bypass: boolean) => {
    setIsABBypassed(bypass);
    audioEngine.setAB_Bypass(bypass);
  };

  // Quick Reset All Processing
  const resetAllAudioProcessing = () => {
    resetEQ();
    setBass(0);
    setTreble(0);
    setBalance(0);
    resetCompressor();
    resetLimiter();
    resetSpatial();
    resetEffects();
    resetPitchTempo();
    setChannelState(DEFAULT_CHANNELS);
    audioEngine.setChannelSettings(DEFAULT_CHANNELS);
    setABBypass(false);
    showToast('All audio processing reset to natural defaults', 'success');
  };

  // Custom User Presets System
  const saveCurrentAsPreset = async (name: string, category: 'custom' | 'device' = 'custom') => {
    const snapshot = getCurrentSnapshot(name);
    const newPreset: UserPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: snapshot,
    };
    await storageService.saveUserPreset(newPreset);
    setUserPresets((prev) => [newPreset, ...prev.filter(p => p.name !== name)]);
    showToast(`Preset "${name}" saved!`, 'success');
  };

  const deleteUserPreset = async (presetId: string) => {
    await storageService.deleteUserPreset(presetId);
    setUserPresets((prev) => prev.filter((p) => p.id !== presetId));
    showToast('Preset deleted', 'info');
  };

  // Per-Song Profile Overrides
  const toggleUseSongProfiles = () => {
    setUseSongProfiles(!useSongProfiles);
    updateSettings({ useSongProfiles: !useSongProfiles });
    showToast(!useSongProfiles ? 'Per-song audio profiles enabled' : 'Using global settings for all songs', 'info');
  };

  const saveCurrentAsSongProfile = async () => {
    if (!currentTrack) return;
    const snapshot = getCurrentSnapshot(`Profile for ${currentTrack.title}`);
    const songProfile: SongAudioProfile = {
      trackId: currentTrack.id,
      trackTitle: currentTrack.title,
      useSongSettings: true,
      settings: snapshot,
    };
    await storageService.saveSongProfile(songProfile);
    setHasSongProfile(true);
    showToast(`Saved custom audio profile for "${currentTrack.title}"`, 'success');
  };

  const clearSongProfile = async () => {
    if (!currentTrack) return;
    await storageService.deleteSongProfile(currentTrack.id);
    setHasSongProfile(false);
    showToast(`Removed custom profile for "${currentTrack.title}". Using global settings.`, 'info');
  };

  // Device Profiles
  const saveCurrentAsDeviceProfile = async (name: string, deviceType: ListeningDeviceType) => {
    const snapshot = getCurrentSnapshot(name);
    const newDevice: DeviceProfile = {
      id: `device-${Date.now()}`,
      name,
      deviceType,
      settings: snapshot,
    };
    await storageService.saveDeviceProfile(newDevice);
    setDeviceProfiles((prev) => [newDevice, ...prev]);
    showToast(`Device profile "${name}" saved`, 'success');
  };

  // Copy & Paste Settings Buffer
  const copyCurrentSettings = () => {
    const snapshot = getCurrentSnapshot('Copied Profile');
    setCopiedSettings(snapshot);
    showToast('Audio settings copied to clipboard', 'info');
  };

  const pasteSettings = () => {
    if (!copiedSettings) {
      showToast('No audio settings copied yet.', 'warning');
      return;
    }
    applyPresetSnapshot(copiedSettings, copiedSettings.name);
  };

  // -------------------------------------------------------------
  // SOUND LAB PHASE 2 METHODS
  // -------------------------------------------------------------

  // A/B Comparison & Master Bypass
  const setABMode = (mode: 'A' | 'B') => {
    setABModeState(mode);
    const bypass = mode === 'A' || isMasterBypass;
    setIsABBypassed(bypass);
    audioEngine.setAB_Bypass(bypass);
    showToast(mode === 'A' ? 'Mode A: Original Raw Audio' : 'Mode B: Processed Aura Sound Lab DSP', 'info');
  };

  const toggleMasterBypass = () => {
    const next = !isMasterBypass;
    setIsMasterBypassState(next);
    const bypass = next || abMode === 'A';
    setIsABBypassed(bypass);
    audioEngine.setAB_Bypass(bypass);
    showToast(next ? 'Master Bypass: DSP Deactivated' : 'Master Bypass: DSP Active', 'info');
  };

  // Quick Sound Controls (Macro Sliders)
  const updateQuickSound = useCallback((partial: Partial<QuickSoundSettings>) => {
    setQuickSoundState((prev) => {
      const next = { ...prev, ...partial };

      // 1. Bass Macro -> Tone & Low EQ
      if (partial.bass !== undefined) {
        const db = ((next.bass - 50) / 50) * 6; // -6dB to +6dB
        setBassState(db);
        audioEngine.setToneBassTreble(db, treble);
      }

      // 2. Clarity Macro -> Tone & High Shelf
      if (partial.clarity !== undefined) {
        const db = ((next.clarity - 50) / 50) * 6; // -6dB to +6dB
        setTrebleState(db);
        audioEngine.setToneBassTreble(bass, db);
      }

      // 3. Warmth Macro -> Saturation Drive & Tape Emulation
      if (partial.warmth !== undefined) {
        const drive = next.warmth > 50 ? ((next.warmth - 50) / 50) * 0.6 : 0;
        setEffects((prevFx) => {
          const updated = {
            ...prevFx,
            saturation: {
              enabled: next.warmth > 50,
              drive: Math.max(0.1, drive),
              type: 'tape' as const,
            },
          };
          audioEngine.setEffects(updated);
          return updated;
        });
      }

      // 4. Spatial Macro -> Stereo Width Matrix
      if (partial.spatial !== undefined) {
        const width = 0.5 + (next.spatial / 100) * 1.3; // 0.5 to 1.8
        setSpatialState((prevSp) => {
          const updated = { ...prevSp, enabled: true, width };
          audioEngine.setSpatialAudio(updated, immersive);
          return updated;
        });
        setStereoControlState((prevSc) => ({ ...prevSc, width }));
      }

      // 5. Reverb Macro -> Subtle Acoustic Space
      if (partial.reverb !== undefined) {
        const wet = (next.reverb / 100) * 0.45;
        setEffects((prevFx) => {
          const updated = {
            ...prevFx,
            reverb: {
              ...prevFx.reverb,
              enabled: next.reverb > 5,
              wet,
              roomSize: 0.5,
              decay: 1.5,
            },
          };
          audioEngine.setEffects(updated);
          return updated;
        });
      }

      // 6. Loudness Macro -> Dynamics Makeup & Limiting
      if (partial.loudness !== undefined) {
        const makeup = ((next.loudness - 50) / 50) * 6;
        setCompressorState((prevComp) => {
          const updated = {
            ...prevComp,
            enabled: true,
            makeupGain: Math.max(0, makeup),
            threshold: -18,
            ratio: 3.5,
          };
          audioEngine.setCompressor(updated);
          return updated;
        });
      }

      return next;
    });
  }, [bass, treble, immersive]);

  const resetQuickSound = () => {
    setQuickSoundState(DEFAULT_QUICK_SOUND);
    audioEngine.setToneBassTreble(0, 0);
    setBassState(0);
    setTrebleState(0);
    setStereoWidth(1.0);
    setEffects(DEFAULT_EFFECTS);
    audioEngine.setEffects(DEFAULT_EFFECTS);
    showToast('Quick Sound reset to neutral', 'info');
  };

  // Sound Lab Presets (Built-in + Custom)
  const applySoundLabPreset = (presetId: string) => {
    const preset = soundLabPresets.find((p) => p.id === presetId) || SOUND_LAB_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActiveSoundLabPreset(preset.id);
    setQuickSoundState(preset.quickSound);
    applyPresetSnapshot(preset.snapshot, preset.name);
  };

  const saveCustomSoundLabPreset = async (name: string, description?: string) => {
    const snapshot = getCurrentSnapshot(name);
    const newPreset: SoundLabPreset = {
      id: `custom-lab-${Date.now()}`,
      name,
      description: description || 'Custom Sound Lab tuning',
      category: 'custom',
      quickSound: { ...quickSound },
      snapshot,
      isBuiltIn: false,
    };
    setSoundLabPresets((prev) => [newPreset, ...prev]);
    setActiveSoundLabPreset(newPreset.id);
    await storageService.saveUserPreset({
      id: newPreset.id,
      name: newPreset.name,
      category: 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: snapshot,
    });
    showToast(`Preset "${name}" saved to Sound Lab`, 'success');
  };

  const deleteCustomSoundLabPreset = async (id: string) => {
    setSoundLabPresets((prev) => prev.filter((p) => p.id !== id));
    await storageService.deleteUserPreset(id);
    showToast('Preset deleted', 'info');
  };

  const duplicateCustomSoundLabPreset = async (id: string) => {
    const source = soundLabPresets.find((p) => p.id === id);
    if (!source) return;
    await saveCustomSoundLabPreset(`${source.name} (Copy)`, source.description);
  };

  // Loop A/B Precision Controller
  const setLoopPointA = (time?: number) => {
    const t = time !== undefined ? time : currentTime;
    setLoopABState((prev) => {
      const next = { ...prev, pointA: t, enabled: prev.pointB !== null && prev.pointB > t };
      audioEngine.setLoopAB(next);
      return next;
    });
    showToast(`Loop Point A set at ${formatSeconds(t)}`, 'info');
  };

  const setLoopPointB = (time?: number) => {
    const t = time !== undefined ? time : currentTime;
    setLoopABState((prev) => {
      const pointA = prev.pointA ?? 0;
      const valid = t > pointA;
      const next = { ...prev, pointB: valid ? t : pointA + 2, enabled: true };
      audioEngine.setLoopAB(next);
      return next;
    });
    showToast(`Loop Point B set at ${formatSeconds(t)}`, 'info');
  };

  const clearLoopAB = () => {
    const next = { ...DEFAULT_LOOP_AB };
    setLoopABState(next);
    audioEngine.setLoopAB(next);
    showToast('Loop A/B cleared', 'info');
  };

  const toggleLoopAB = (enabled?: boolean) => {
    setLoopABState((prev) => {
      const nextEnabled = enabled !== undefined ? enabled : !prev.enabled;
      const next = { ...prev, enabled: nextEnabled };
      audioEngine.setLoopAB(next);
      return next;
    });
  };

  const setLoopABMode = (mode: LoopABMode) => {
    setLoopABState((prev) => {
      const next = { ...prev, mode, currentCount: 0 };
      audioEngine.setLoopAB(next);
      return next;
    });
  };

  const updateLoopAB = (settings: Partial<LoopABState>) => {
    setLoopABState((prev) => {
      const next = { ...prev, ...settings };
      audioEngine.setLoopAB(next);
      return next;
    });
  };

  // Stereo Control & Phase Correlation
  const setStereoWidth = (width: number) => {
    const clamped = Math.max(0, Math.min(2.0, width));
    setStereoControlState((prev) => ({ ...prev, width: clamped }));
    setSpatialState((prev) => {
      const updated = { ...prev, enabled: true, width: clamped };
      audioEngine.setSpatialAudio(updated, immersive);
      return updated;
    });
  };

  const setStereoBalance = (bal: number) => {
    const clamped = Math.max(-1, Math.min(1, bal));
    setStereoControlState((prev) => ({ ...prev, balance: clamped }));
    setBalanceState(clamped);
    audioEngine.setBalance(clamped);
  };

  const toggleMono = (mono?: boolean) => {
    setStereoControlState((prev) => {
      const isMono = mono !== undefined ? mono : !prev.isMono;
      const monitorMode: ChannelMonitorMode = isMono ? 'mono' : 'stereo';
      audioEngine.setChannelMonitor(monitorMode, prev.balance);
      return { ...prev, isMono, monitorMode };
    });
  };

  const setChannelMonitor = (mode: ChannelMonitorMode) => {
    setStereoControlState((prev) => {
      const isMono = mode === 'mono';
      audioEngine.setChannelMonitor(mode, prev.balance);
      return { ...prev, monitorMode: mode, isMono };
    });
  };

  const getStereoCorrelation = useCallback(() => {
    return audioEngine.getStereoCorrelation();
  }, []);

  // Pitch & Tempo Direct Controls
  const setPitchSemitones = (semitones: number) => {
    const clamped = Math.max(-12, Math.min(12, semitones));
    setPitchTempoState((prev) => {
      const next = { ...prev, pitchSemitones: clamped };
      audioEngine.setPitchSemitones(clamped, prev.preservePitch);
      return next;
    });
  };

  const setTempoRate = (rate: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    setPlaybackRateState(clamped);
    setPitchTempoState((prev) => {
      const next = { ...prev, playbackRate: clamped };
      audioEngine.setPlaybackRate(clamped);
      return next;
    });
  };

  const setPreservePitchLock = (preserve: boolean) => {
    setPitchTempoState((prev) => {
      const next = { ...prev, preservePitch: preserve };
      audioEngine.setPreservePitch(preserve);
      return next;
    });
  };

  // Waveform Markers
  const addMarker = async (time?: number, label?: string, type: MarkerType = 'custom', color = '#06b6d4'): Promise<WaveformMarker> => {
    if (!currentTrack) throw new Error('No active track');
    const timestamp = time !== undefined ? time : currentTime;
    const marker: WaveformMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trackId: currentTrack.id,
      time: timestamp,
      label: label || `Marker at ${formatSeconds(timestamp)}`,
      type,
      color,
      createdAt: Date.now(),
    };
    await storageService.saveMarker(marker);
    setMarkers((prev) => [...prev.filter((m) => m.id !== marker.id), marker].sort((a, b) => a.time - b.time));
    showToast(`Marker "${marker.label}" saved`, 'success');
    return marker;
  };

  const jumpToMarker = (marker: WaveformMarker) => {
    audioEngine.seek(marker.time);
    setCurrentTime(marker.time);
    if (!isPlaying) {
      audioEngine.play();
      setIsPlaying(true);
    }
    showToast(`Jumped to marker: ${marker.label}`, 'info');
  };

  const updateMarker = async (id: string, label: string, color?: string) => {
    const marker = markers.find((m) => m.id === id);
    if (!marker) return;
    const updated = { ...marker, label, ...(color ? { color } : {}) };
    await storageService.saveMarker(updated);
    setMarkers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    showToast('Marker updated', 'success');
  };

  const deleteMarker = async (id: string) => {
    await storageService.deleteMarker(id);
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    showToast('Marker deleted', 'info');
  };

  // Aura Moments (Saved Timestamps + Personal Notes)
  const saveMoment = async (note = '', track?: Track, timestamp?: number): Promise<AuraMoment> => {
    const targetTrack = track || currentTrack;
    if (!targetTrack) throw new Error('No track selected');
    const t = timestamp !== undefined ? timestamp : currentTime;
    const moment: AuraMoment = {
      id: `moment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trackId: targetTrack.id,
      trackTitle: targetTrack.title,
      artist: targetTrack.artist,
      coverUrl: targetTrack.coverUrl,
      timestamp: t,
      note,
      createdAt: Date.now(),
      color: '#8b5cf6',
    };
    await storageService.saveMoment(moment);
    setMoments((prev) => [moment, ...prev]);
    showToast(`Moment captured at ${formatSeconds(t)}!`, 'success');
    return moment;
  };

  const jumpToMoment = (moment: AuraMoment) => {
    const tr = tracks.find((t) => t.id === moment.trackId);
    if (tr && (!currentTrack || currentTrack.id !== tr.id)) {
      playTrack(tr).then(() => {
        setTimeout(() => {
          audioEngine.seek(moment.timestamp);
          setCurrentTime(moment.timestamp);
        }, 200);
      });
    } else {
      audioEngine.seek(moment.timestamp);
      setCurrentTime(moment.timestamp);
      if (!isPlaying) {
        audioEngine.play();
        setIsPlaying(true);
      }
    }
    showToast(`Playing Moment: ${moment.note || moment.trackTitle}`, 'info');
  };

  const deleteMoment = async (id: string) => {
    await storageService.deleteMoment(id);
    setMoments((prev) => prev.filter((m) => m.id !== id));
    showToast('Moment removed', 'info');
  };

  // Trim, Fade & High-Res Audio Export
  const updateTrimFade = (settings: Partial<TrimFadeState>) => {
    setTrimFadeState((prev) => ({ ...prev, ...settings }));
  };

  const previewTrimmedSection = () => {
    const start = trimFade.trimStart || 0;
    audioEngine.seek(start);
    audioEngine.play();
    setIsPlaying(true);
    setTrimFadeState((prev) => ({ ...prev, isPlayingPreview: true }));
  };

  const stopTrimPreview = () => {
    audioEngine.pause();
    setIsPlaying(false);
    setTrimFadeState((prev) => ({ ...prev, isPlayingPreview: false }));
  };

  const exportTrack = async (options: ExportAudioOptions): Promise<{ blob: Blob; filename: string }> => {
    if (!currentTrack) throw new Error('No track selected for export');
    let blob = audioBlobCache.current.get(currentTrack.id);
    if (!blob) {
      const stored = await storageService.getAudioBlob(currentTrack.id);
      if (stored) blob = stored;
    }
    if (!blob && currentTrack.audioUrl) {
      const res = await fetch(currentTrack.audioUrl);
      blob = await res.blob();
    }
    if (!blob) throw new Error('Audio data not available for export');

    showToast('Rendering high-fidelity audio...', 'info');
    const snapshot = getCurrentSnapshot('Export Snapshot');
    const renderedBlob = await audioEngine.exportTrackAudio(blob, options, snapshot);
    const ext = 'wav';
    const baseName = (options.filename || `${currentTrack.artist} - ${currentTrack.title}`).replace(/[/\\?%*:|"<>]/g, '-');
    const filename = `${baseName}.${ext}`;
    showToast(`Rendered ${filename} successfully!`, 'success');
    return { blob: renderedBlob, filename };
  };

  const saveTrimmedClip = async (newTitle?: string): Promise<Track | null> => {
    if (!currentTrack) return null;
    try {
      const options: ExportAudioOptions = {
        format: 'wav',
        bitDepth: 24,
        sampleRate: 44100,
        applyDsp: true,
        applyTrim: true,
        trimStart: trimFade.trimStart,
        trimEnd: trimFade.trimEnd,
        fadeIn: trimFade.fadeIn,
        fadeOut: trimFade.fadeOut,
      };
      const { blob } = await exportTrack(options);
      const title = newTitle || `${currentTrack.title} (Trimmed)`;
      const newTrack: Track = {
        id: `trimmed-${Date.now()}`,
        title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        duration: Math.max(1, trimFade.trimEnd - trimFade.trimStart),
        fileFormat: 'WAV',
        bitrate: 1411,
        sampleRate: 44100,
        channels: 2,
        fileSize: blob.size,
        dateAdded: Date.now(),
        coverUrl: currentTrack.coverUrl,
        coverColor: currentTrack.coverColor,
      };
      await storageService.saveTrack(newTrack, blob);
      audioBlobCache.current.set(newTrack.id, blob);
      setTracks((prev) => [newTrack, ...prev]);
      await refreshStorageStats();
      showToast(`Saved "${newTrack.title}" to Library!`, 'success');
      return newTrack;
    } catch (err) {
      console.error('Error saving trimmed clip:', err);
      showToast('Failed to save trimmed clip', 'error');
      return null;
    }
  };

  // Track Offline Analysis
  const analyzeCurrentTrack = async () => {
    if (!currentTrack) {
      showToast('Please play or select a track to analyze.', 'info');
      return;
    }
    try {
      setIsAnalyzingTrack(true);
      showToast(`Analyzing frequency & dynamic profile of "${currentTrack.title}"...`, 'info');
      const analysis = await AudioAnalysisService.analyzeTrack(currentTrack);
      setCurrentTrackAnalysis(analysis);
      showToast(`Analysis complete: ${analysis.estimatedBpm} BPM • ${analysis.integratedLufs} LUFS`, 'success');
    } catch (err) {
      console.error('Track analysis error:', err);
      showToast('Failed to complete deep track analysis.', 'error');
    } finally {
      setIsAnalyzingTrack(false);
    }
  };

  const openTrackInfo = (track: Track) => {
    setSelectedInfoTrack(track);
    setIsTrackInfoOpen(true);
  };

  const closeTrackInfo = () => {
    setIsTrackInfoOpen(false);
    setSelectedInfoTrack(null);
  };

  // Stems & Settings
  const updateStemState = (newStems: Partial<StemState>) => {
    setStemState((prev) => ({
      ...prev,
      ...newStems,
      muted: newStems.muted ? { ...prev.muted, ...newStems.muted } : prev.muted,
    }));
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      await storageService.saveSettings(merged);
    } catch {
      // ignore
    }
  };

  const toggleAdvancedMode = () => {
    const next = !settings.advancedMode;
    updateSettings({ advancedMode: next });
    showToast(next ? 'Pro Studio Controls enabled' : 'Simplified Audio Mode active', 'info');
  };

  // Queue Operations
  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    showToast(`Added "${track.title}" to queue`, 'info');
  };

  const playNext = (track: Track) => {
    setQueue((prev) => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, track);
      return copy;
    });
    showToast(`"${track.title}" will play next`, 'info');
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    } else if (index === queueIndex && queue.length > 1) {
      const nextIdx = Math.min(index, queue.length - 2);
      setQueueIndex(nextIdx);
    }
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
    showToast('Queue cleared', 'info');
  };

  // Favorites
  const toggleFavorite = async (trackId: string) => {
    const isFav = favoriteIds.has(trackId);
    const newFavs = new Set(favoriteIds);
    if (isFav) {
      newFavs.delete(trackId);
    } else {
      newFavs.add(trackId);
    }
    setFavoriteIds(newFavs);

    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !isFav } : t))
    );

    if (currentTrack && currentTrack.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !isFav } : null));
    }

    try {
      await storageService.setFavorite(trackId, !isFav);
    } catch (e) {
      console.error('Failed to save favorite state:', e);
    }
  };

  // Upload Files
  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg|opus|webm)$/i.test(f.name)
    );

    if (files.length === 0) {
      showToast('No supported audio files found. (Supports MP3, WAV, FLAC, M4A, AAC, OGG)', 'warning');
      return;
    }

    showToast(`Processing ${files.length} audio ${files.length === 1 ? 'file' : 'files'}...`, 'info');

    const addedTracks: Track[] = [];

    for (const file of files) {
      try {
        const { track, blob } = await MetadataParser.parseFile(file);
        audioBlobCache.current.set(track.id, blob);
        await storageService.saveTrack(track, blob);
        addedTracks.push(track);
      } catch (err) {
        console.error('Failed to parse audio file:', file.name, err);
        showToast(`Failed to parse "${file.name}"`, 'error');
      }
    }

    if (addedTracks.length > 0) {
      setTracks((prev) => [...addedTracks, ...prev]);
      await refreshStorageStats();
      showToast(`Added ${addedTracks.length} ${addedTracks.length === 1 ? 'song' : 'songs'} to your library!`, 'success');
      
      if (!currentTrack) {
        playTrack(addedTracks[0], addedTracks);
      }
    }
  };

  const deleteTrack = async (trackId: string) => {
    try {
      await storageService.deleteTrack(trackId);
      audioBlobCache.current.delete(trackId);

      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setQueue((prev) => prev.filter((t) => t.id !== trackId));
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });

      setPlaylists((prev) =>
        prev.map((pl) => ({
          ...pl,
          trackIds: pl.trackIds.filter((id) => id !== trackId),
        }))
      );

      if (currentTrack?.id === trackId) {
        audioEngine.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }

      await refreshStorageStats();
      showToast('Track removed from library', 'info');
    } catch (e) {
      console.error('Failed to delete track:', e);
      showToast('Could not delete track', 'error');
    }
  };

  // Demo Pack
  const loadDemoPack = async () => {
    try {
      showToast('Synthesizing studio demo pack...', 'info');
      const demoItems = await generateDemoTracks();

      for (const { track, blob } of demoItems) {
        audioBlobCache.current.set(track.id, blob);
        await storageService.saveTrack(track, blob);
      }

      const demoTracks = demoItems.map((i) => i.track);
      
      demoTracks.forEach(t => {
        if (t.isFavorite) {
          storageService.setFavorite(t.id, true);
        }
      });

      setTracks((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = demoTracks.filter((d) => !existingIds.has(d.id));
        return [...filteredNew, ...prev];
      });

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        demoTracks.filter(d => d.isFavorite).forEach(d => next.add(d.id));
        return next;
      });

      await refreshStorageStats();
      showToast('Demo pack loaded! Enjoy studio quality synthwave & lo-fi.', 'success');

      if (!currentTrack && demoTracks.length > 0) {
        playTrack(demoTracks[0], demoTracks);
      }
    } catch (e) {
      console.error('Error generating demo tracks:', e);
      showToast('Failed to generate demo tracks.', 'error');
    }
  };

  const clearLibrary = async () => {
    try {
      audioEngine.pause();
      await storageService.clearAllData();
      audioBlobCache.current.clear();
      setTracks([]);
      setPlaylists([]);
      setFavoriteIds(new Set());
      setCurrentTrack(null);
      setQueue([]);
      setQueueIndex(-1);
      setHistory([]);
      setUserPresets([]);
      setDeviceProfiles([]);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setHasSongProfile(false);
      setCurrentTrackAnalysis(null);
      setSearchQueryState('');
      setActiveSearchIndex(0);
      setSelectedPlaylistId(null);
      await refreshStorageStats();
      showToast('All local music, playlists, and cached audio cleared.', 'info');
    } catch (e) {
      console.error('Failed to clear library:', e);
      showToast('Failed to clear library', 'error');
    }
  };

  // Playlists
  const createPlaylist = async (title: string, description = '', coverGradient = 'from-violet-600 to-indigo-800') => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      title,
      description,
      coverGradient,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storageService.savePlaylist(newPlaylist);
    setPlaylists((prev) => [newPlaylist, ...prev]);
    showToast(`Created playlist "${title}"`, 'success');
    return newPlaylist;
  };

  const updatePlaylist = async (playlist: Playlist) => {
    const updated = { ...playlist, updatedAt: Date.now() };
    await storageService.savePlaylist(updated);
    setPlaylists((prev) => prev.map((p) => (p.id === playlist.id ? updated : p)));
    showToast(`Updated "${playlist.title}"`, 'info');
  };

  const deletePlaylist = async (playlistId: string) => {
    await storageService.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
      setCurrentView('playlists');
    }
    showToast('Playlist deleted', 'info');
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    if (playlist.trackIds.includes(trackId)) {
      showToast('Track already in this playlist', 'info');
      return;
    }
    const updated = {
      ...playlist,
      trackIds: [...playlist.trackIds, trackId],
      updatedAt: Date.now(),
    };
    await updatePlaylist(updated);
    showToast(`Added to "${playlist.title}"`, 'success');
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const updated = {
      ...playlist,
      trackIds: playlist.trackIds.filter((id) => id !== trackId),
      updatedAt: Date.now(),
    };
    await updatePlaylist(updated);
    showToast(`Removed from "${playlist.title}"`, 'info');
  };

  return (
    <MusicContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedPlaylistId,
        setSelectedPlaylistId,
        searchQuery,
        setSearchQuery,
        activeSearchIndex,
        setActiveSearchIndex,
        nextSearchResult,
        prevSearchResult,
        tracks,
        playlists,
        favoriteIds,
        storageUsage,
        isLoadingLibrary,
        currentTrack,
        activeSource,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isShuffle,
        repeatMode,
        queue,
        setQueue,
        queueIndex,
        history,
        bass,
        treble,
        balance,
        setBass,
        setTreble,
        setBalance,
        eqPreset,
        eqGains,
        setEQGain,
        setEQBandQ,
        setEQPreset,
        resetEQ,
        compressor,
        updateCompressor,
        resetCompressor,
        limiter,
        updateLimiter,
        resetLimiter,
        loudness,
        updateLoudness,
        spatial,
        updateSpatial,
        resetSpatial,
        immersive,
        updateImmersive,
        channel,
        updateChannels,
        pitchTempo,
        updatePitchTempo,
        resetPitchTempo,
        effects,
        updateEffects,
        resetEffects,
        isABBypassed,
        toggleABBypass,
        setABBypass,
        resetAllAudioProcessing,

        // Sound Lab Phase 2
        abMode,
        setABMode,
        isMasterBypass,
        toggleMasterBypass,
        quickSound,
        updateQuickSound,
        resetQuickSound,
        soundLabPresets,
        activeSoundLabPreset,
        applySoundLabPreset,
        saveCustomSoundLabPreset,
        deleteCustomSoundLabPreset,
        duplicateCustomSoundLabPreset,
        loopAB,
        setLoopPointA,
        setLoopPointB,
        clearLoopAB,
        toggleLoopAB,
        setLoopABMode,
        updateLoopAB,
        stereoControl,
        setStereoWidth,
        setStereoBalance,
        toggleMono,
        setChannelMonitor,
        getStereoCorrelation,
        setPitchSemitones,
        setTempoRate,
        setPreservePitchLock,
        markers,
        addMarker,
        jumpToMarker,
        updateMarker,
        deleteMarker,
        moments,
        saveMoment,
        jumpToMoment,
        deleteMoment,
        trimFade,
        updateTrimFade,
        previewTrimmedSection,
        stopTrimPreview,
        saveTrimmedClip,
        exportTrack,
        isTrimExportModalOpen,
        setIsTrimExportModalOpen,
        isMomentsModalOpen,
        setIsMomentsModalOpen,
        isPresetsModalOpen,
        setIsPresetsModalOpen,

        userPresets,
        saveCurrentAsPreset,
        applyPresetSnapshot,
        deleteUserPreset,
        useSongProfiles,
        toggleUseSongProfiles,
        hasSongProfile,
        saveCurrentAsSongProfile,
        clearSongProfile,
        deviceProfiles,
        activeDeviceId,
        setActiveDeviceId,
        saveCurrentAsDeviceProfile,
        hasCopiedSettings: !!copiedSettings,
        copyCurrentSettings,
        pasteSettings,
        currentTrackAnalysis,
        isAnalyzingTrack,
        analyzeCurrentTrack,
        isTrackInfoOpen,
        selectedInfoTrack,
        openTrackInfo,
        closeTrackInfo,
        visualizerMode,
        setVisualizerMode,
        stemState,
        updateStemState,
        settings,
        updateSettings,
        isAdvancedMode: settings.advancedMode,
        toggleAdvancedMode,
        sleepTimerMinutes,
        sleepTimerRemainingSecs,
        isSleepTimerActive: sleepTimerMinutes !== null,
        isSleepTimerModalOpen,
        setIsSleepTimerModalOpen,
        startSleepTimer,
        setSleepTimerAtTrackEnd,
        cancelSleepTimer,
        activeAudioTab,
        setActiveAudioTab,
        isExpandedPlayerOpen,
        setIsExpandedPlayerOpen,
        isQueueDrawerOpen,
        setIsQueueDrawerOpen,
        isAudioControlsOpen,
        setIsAudioControlsOpen,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isPlaylistModalOpen,
        setIsPlaylistModalOpen,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
        isDraggingFile,
        setIsDraggingFile,

        // Player Actions
        switchToTrack,
        playTrack,
        togglePlay,
        seek,
        seekRelative,
        isSeeking,
        setIsSeeking,
        nextTrack,
        prevTrack,
        registerTrackEndedHandler,
        setVolume,
        toggleMute,
        setPlaybackRate,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        playNext,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        toggleFavorite,
        uploadFiles,
        deleteTrack,
        loadDemoPack,
        clearLibrary,
        clearAllData: clearLibrary,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
