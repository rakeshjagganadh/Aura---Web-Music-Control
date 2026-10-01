import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../pwa/PWAInstallModal';
import { YouTubeStreamTesterModal } from '../dev/YouTubeStreamTesterModal';
import { 
  Settings, 
  HardDrive, 
  Trash2, 
  Sparkles, 
  Keyboard, 
  ShieldCheck, 
  Volume2, 
  Sliders,
  CheckCircle,
  AlertTriangle,
  X,
  PlayCircle,
  Radio,
  Moon,
  Zap,
  Gauge,
  Smartphone,
  Download,
  Cpu
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    storageUsage,
    clearAllData,
    clearLibrary,
    loadDemoPack,
    setIsShortcutsModalOpen,
    tracks,
    playlists,
    settings,
    updateSettings,
    isSleepTimerActive,
    sleepTimerMinutes,
    sleepTimerRemainingSecs,
    setIsSleepTimerModalOpen,
    cancelSleepTimer,
    limiter,
    updateLimiter,
  } = useMusic();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isStreamTesterOpen, setIsStreamTesterOpen] = useState(false);

  // Check URL query param or hash for instant diagnostic launch (?dev_yt_test=true or #yt-stream-test)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev_yt_test') === 'true' || window.location.hash === '#yt-stream-test') {
        setIsStreamTesterOpen(true);
      }
    }
  }, []);

  const formatStorageMB = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleConfirmClear = async () => {
    try {
      setIsClearing(true);
      const clearFn = clearAllData || clearLibrary;
      await clearFn();
      setIsConfirmOpen(false);
    } finally {
      setIsClearing(false);
    }
  };

  const formatTimerRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const {
    isInstalled,
    canInstall,
    isIOS,
    promptInstall,
    isInstructionsOpen,
    setIsInstructionsOpen
  } = usePWAInstall();

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings & Audio Engine Preferences</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Configure playback behaviors, DSP engine parameters, sleep timer, and storage</p>
      </div>

      {/* Playback Behaviors & Experience Section */}
      <div className="flex flex-col gap-5 p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Playback Behaviors</h3>
            <p className="text-xs text-zinc-400">Control queue progression, transitions, and automated playback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Continuous Autoplay</span>
              <p className="text-[11px] text-zinc-400">Automatically advance to next queue item</p>
            </div>
            <button
              onClick={() => updateSettings({ autoplay: !settings.autoplay })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.autoplay ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.autoplay ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Gapless Playback */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Gapless Audio Playback</span>
              <p className="text-[11px] text-zinc-400">Eliminate dead silence between consecutive tracks</p>
            </div>
            <button
              onClick={() => updateSettings({ gapless: !settings.gapless })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.gapless ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.gapless ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Crossfade Duration Slider */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Track Crossfade</span>
              <p className="text-[11px] text-zinc-400">Smoothly blend outgoing and incoming audio streams</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              {settings.crossfade === 0 ? 'Off (0s)' : `${settings.crossfade} seconds`}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={settings.crossfade}
            onChange={(e) => updateSettings({ crossfade: parseInt(e.target.value, 10) })}
            className="w-full cursor-pointer accent-indigo-500"
          />

          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Off</span>
            <span>2s</span>
            <span>4s</span>
            <span>6s</span>
            <span>8s</span>
            <span>12s</span>
          </div>
        </div>
      </div>

      {/* Audio Engine & DSP Dynamics Section */}
      <div className="flex flex-col gap-5 p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">DSP Dynamics & Loudness Engine</h3>
            <p className="text-xs text-zinc-400">Loudness normalization, anti-clipping limiter, and buffer quality</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prevent Clipping (Limiter) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Prevent Audio Clipping</span>
              <p className="text-[11px] text-zinc-400">Fast peak limiter ceiling at -0.2 dB</p>
            </div>
            <button
              onClick={() => updateLimiter({ enabled: !limiter.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                limiter.enabled ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  limiter.enabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Loudness Auto-Normalization */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Auto Loudness Normalization</span>
              <p className="text-[11px] text-zinc-400">Equalize track volumes to standard -14 LUFS</p>
            </div>
            <button
              onClick={() => updateSettings({ autoNormalize: !settings.autoNormalize })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.autoNormalize ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.autoNormalize ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* DSP Quality Mode */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-zinc-200">Audio Processing Precision</span>
            <p className="text-[11px] text-zinc-400">Internal floating-point math and filter resolution</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-white/5">
            {(['standard', 'high', 'ultra'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateSettings({ qualityDsp: mode })}
                className={`px-3 py-1 text-xs font-mono capitalize rounded-lg transition-colors cursor-pointer ${
                  settings.qualityDsp === mode
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sleep Timer Section */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Sleep Timer</h3>
            <p className="text-xs text-zinc-400">
              {isSleepTimerActive
                ? sleepTimerMinutes === -1
                  ? 'Active • Pausing at end of current track'
                  : `Active • ${sleepTimerRemainingSecs ? formatTimerRemaining(sleepTimerRemainingSecs) : ''} remaining`
                : 'Automatically fade out and pause music after a set duration'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSleepTimerActive && (
            <button
              onClick={cancelSleepTimer}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => setIsSleepTimerModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            {isSleepTimerActive ? 'Change Timer' : 'Set Sleep Timer'}
          </button>
        </div>
      </div>

      {/* Storage Section */}
      <div className="flex flex-col gap-4 p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Local-First Storage (IndexedDB)</h3>
            <p className="text-xs text-zinc-400">All audio files and metadata remain securely on your device</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500">Tracks Stored</span>
            <p className="text-lg font-bold text-zinc-100 mt-0.5">{tracks.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500">Playlists</span>
            <p className="text-lg font-bold text-zinc-100 mt-0.5">{playlists.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500">Storage Used</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatStorageMB(storageUsage.approxBytes)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <button
            onClick={loadDemoPack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-indigo-300 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Reload Demo Tracks
          </button>

          <button
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Stored Library Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-rose-500/30 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Clear All Stored Library Data?</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  This will permanently delete all imported tracks, cached audio blobs, custom playlists, favorites, and per-song DSP presets from your browser storage.
                </p>
              </div>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400">
              <div className="flex justify-between py-0.5">
                <span>Tracks to delete:</span>
                <span className="font-mono text-zinc-200">{tracks.length}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Playlists to delete:</span>
                <span className="font-mono text-zinc-200">{playlists.length}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Storage to reclaim:</span>
                <span className="font-mono text-emerald-400">{formatStorageMB(storageUsage.approxBytes)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isClearing ? 'Clearing Storage...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Engine Specs */}
      <div className="flex flex-col gap-4 p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Web Audio API Engine Pipeline</h3>
            <p className="text-xs text-zinc-400">High precision browser-native DSP architecture</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-zinc-300">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60">
            <span>Audio Graph Path</span>
            <span className="font-mono text-zinc-400">Source → EQ(10) → Comp → Limiter → Spatial(3D) → FX → Pan → Analyser</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60">
            <span>Sample Rate Support</span>
            <span className="font-mono text-zinc-400">44.1 kHz - 96 kHz Native Float32</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60">
            <span>FFT Analyser Resolution</span>
            <span className="font-mono text-zinc-400">2048 Points (Smoothing 0.82)</span>
          </div>
        </div>
      </div>

      {/* Shortcuts Sheet Button */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Keyboard Shortcuts</h3>
            <p className="text-xs text-zinc-400">Full keyboard accessibility, transport controls, and shortcuts sheet</p>
          </div>
        </div>

        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
        >
          View Shortcuts (?)
        </button>
      </div>

      {/* Stream Architecture Diagnostic Lab (Phase 1) */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-900/40 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">YouTube Stream Lab (Phase 1)</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                HTMLAudioElement Tester
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Inspect backend stream resolution (/api/yt/audio), HTTP Range 206 headers, and native audio element playback
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsStreamTesterOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors cursor-pointer"
        >
          Open Stream Lab
        </button>
      </div>

      {/* PWA Application & Install Status */}
      <div className="flex flex-col gap-4 p-6 rounded-3xl bg-zinc-900/40 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Progressive Web App (PWA)</h3>
              <p className="text-xs text-zinc-400">Standalone installability, shell caching, and local storage</p>
            </div>
          </div>

          {isInstalled ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium font-mono">
              <CheckCircle className="w-3.5 h-3.5" />
              Standalone Mode
            </span>
          ) : canInstall ? (
            <button
              type="button"
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install AURA</span>
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 text-xs font-mono">
              Browser Web Mode
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs text-zinc-300 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60">
            <span>App Shell Cache & Service Worker</span>
            <span className="font-mono text-emerald-400">Active (v1 shell precached)</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60">
            <span>Local Music Storage</span>
            <span className="font-mono text-zinc-400">Local Browser IndexedDB (Private)</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60">
            <span>Display Environment</span>
            <span className="font-mono text-zinc-400">
              {isInstalled ? 'Standalone Window (Zero URL bar)' : 'Standard Browser View'}
            </span>
          </div>
        </div>
      </div>

      {/* PWA iOS / Browser Instructions Modal */}
      <PWAInstallModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        isIOS={isIOS}
      />

      {/* Phase 1 YouTube Stream Architecture Diagnostics Modal */}
      <YouTubeStreamTesterModal
        isOpen={isStreamTesterOpen}
        onClose={() => setIsStreamTesterOpen(false)}
      />

    </div>
  );
};
