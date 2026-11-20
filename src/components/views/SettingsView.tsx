import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../pwa/PWAInstallModal';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { SharedIndicator } from '../common/motion/MotionInteractive';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { AuraIcon } from '../ui/AuraIcon';

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
    setCurrentView,
    showToast,
  } = useMusic();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const confirmModalRef = useDialogAccessibility<HTMLDivElement>({
    isOpen: isConfirmOpen,
    onClose: () => {
      if (!isClearing) setIsConfirmOpen(false);
    },
  });

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
    <div className="flex flex-col gap-4 sm:gap-8 p-3 sm:p-8 pb-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Settings & Audio Preferences</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Configure playback behaviors, DSP engine parameters, sleep timer, and storage</p>
      </div>

      {/* Playback Behaviors & Experience Section */}
      <section className="flex flex-col gap-4 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex items-start gap-3">
          <AuraIcon name="playCircle" size={20} className="text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Playback Behaviors</h3>
            <p className="text-xs text-zinc-400">Control queue progression, transitions, and automated playback</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Continuous Autoplay</span>
              <p className="text-[11px] text-zinc-400">Automatically advance to next queue item</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoplay}
              aria-label="Continuous Autoplay"
              onClick={() => updateSettings({ autoplay: !settings.autoplay })}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer aura-pressable-subtle aura-focus-ring ${
                settings.autoplay ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 ease-[var(--motion-ease-standard)] motion-reduce:transition-none absolute top-1 left-1 ${
                  settings.autoplay ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Gapless Playback */}
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Gapless Audio Playback</span>
              <p className="text-[11px] text-zinc-400">Eliminate dead silence between consecutive tracks</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.gapless}
              aria-label="Gapless Audio Playback"
              onClick={() => updateSettings({ gapless: !settings.gapless })}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer aura-pressable-subtle aura-focus-ring ${
                settings.gapless ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 ease-[var(--motion-ease-standard)] motion-reduce:transition-none absolute top-1 left-1 ${
                  settings.gapless ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Crossfade Duration Slider */}
          <div className="pt-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Track Crossfade</span>
                <p className="text-[11px] text-zinc-400">Smoothly blend outgoing and incoming audio streams</p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-indigo-300">
                {settings.crossfade === 0 ? 'Off · 0s' : `${settings.crossfade}s`}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={settings.crossfade}
              aria-label="Track Crossfade Seconds"
              onChange={(e) => updateSettings({ crossfade: parseInt(e.target.value, 10) })}
              className="w-full cursor-pointer accent-indigo-500"
            />

            <div className="flex justify-between text-[10px] font-mono tabular-nums text-zinc-500">
              <span>Off</span>
              <span>2s</span>
              <span>4s</span>
              <span>6s</span>
              <span>8s</span>
              <span>12s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Audio Engine & DSP Dynamics Section */}
      <section className="flex flex-col gap-4 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex items-start gap-3">
          <AuraIcon name="zap" size={20} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">DSP Dynamics & Loudness Engine</h3>
            <p className="text-xs text-zinc-400">Loudness normalization, anti-clipping limiter, and buffer quality</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {/* Prevent Clipping (Limiter) */}
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Prevent Audio Clipping</span>
              <p className="text-[11px] text-zinc-400">Fast peak limiter ceiling at -0.2 dB</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={limiter.enabled}
              aria-label="Prevent Audio Clipping"
              onClick={() => updateLimiter({ enabled: !limiter.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer aura-pressable-subtle aura-focus-ring ${
                limiter.enabled ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 ease-[var(--motion-ease-standard)] motion-reduce:transition-none absolute top-1 left-1 ${
                  limiter.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Loudness Auto-Normalization */}
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Auto Loudness Normalization</span>
              <p className="text-[11px] text-zinc-400">Equalize track volumes to standard -14 LUFS</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoNormalize}
              aria-label="Auto Loudness Normalization"
              onClick={() => updateSettings({ autoNormalize: !settings.autoNormalize })}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer aura-pressable-subtle aura-focus-ring ${
                settings.autoNormalize ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 ease-[var(--motion-ease-standard)] motion-reduce:transition-none absolute top-1 left-1 ${
                  settings.autoNormalize ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* DSP Quality Mode */}
          <div className="pt-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Audio Processing Precision</span>
              <p className="text-[11px] text-zinc-400">Internal floating-point math and filter resolution</p>
            </div>

            <LayoutGroup id="settings-dsp-quality">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950/90 border border-white/[0.07]">
                {(['standard', 'high', 'ultra'] as const).map((mode) => {
                  const isActive = settings.qualityDsp === mode;
                  return (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => updateSettings({ qualityDsp: mode })}
                      className={`relative px-3 py-1.5 min-h-[30px] text-xs font-sans capitalize rounded-lg transition-colors cursor-pointer aura-pressable aura-focus-ring ${
                        isActive
                          ? 'text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 font-medium'
                      }`}
                    >
                      {isActive && (
                        <SharedIndicator
                          layoutId="settings-dsp-quality-pill"
                          className="absolute inset-0 rounded-lg bg-indigo-600 shadow-sm"
                        />
                      )}
                      <span className="relative z-10">{mode}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        </div>
      </section>

      {/* Sleep Timer Section */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex items-start gap-3">
          <AuraIcon name="moon" size={20} className="text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Sleep Timer</h3>
            <p className="text-xs text-zinc-400 tabular-nums">
              {isSleepTimerActive
                ? sleepTimerMinutes === -1
                  ? 'Active · Pausing at end of current track'
                  : `Active · ${sleepTimerRemainingSecs ? formatTimerRemaining(sleepTimerRemainingSecs) : ''} remaining`
                : 'Automatically fade out and pause music after a set duration'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSleepTimerActive && (
            <button
              type="button"
              onClick={cancelSleepTimer}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSleepTimerModalOpen(true)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-xs font-medium text-zinc-200 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            {isSleepTimerActive ? 'Change Timer' : 'Set Sleep Timer'}
          </button>
        </div>
      </section>

      {/* Storage Section */}
      <section className="flex flex-col gap-4 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex items-start gap-3">
          <AuraIcon name="hardDrive" size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Local-First Storage (IndexedDB)</h3>
            <p className="text-xs text-zinc-400">All audio files and metadata remain securely on your device</p>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/[0.06] py-2 border-y border-white/[0.06]">
          <div className="pr-3">
            <span className="text-[11px] font-sans font-medium text-zinc-400">Tracks</span>
            <p className="text-base sm:text-lg font-bold text-zinc-100 mt-0.5 font-mono tabular-nums">{tracks.length}</p>
          </div>
          <div className="px-3">
            <span className="text-[11px] font-sans font-medium text-zinc-400">Playlists</span>
            <p className="text-base sm:text-lg font-bold text-zinc-100 mt-0.5 font-mono tabular-nums">{playlists.length}</p>
          </div>
          <div className="pl-3">
            <span className="text-[11px] font-sans font-medium text-zinc-400">Storage</span>
            <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 font-mono tabular-nums truncate">{formatStorageMB(storageUsage.approxBytes)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-1">
          <button
            type="button"
            onClick={loadDemoPack}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-indigo-300 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <AuraIcon name="sparkles" size={14} className="text-indigo-400" />
            Reload Demo Tracks
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <AuraIcon name="trash" size={14} />
            Clear All Stored Data
          </button>
        </div>
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <MotionBackdrop
            onClick={() => !isClearing && setIsConfirmOpen(false)}
            style={{ pointerEvents: isConfirmOpen ? 'auto' : 'none' }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <MotionModal
              ref={confirmModalRef}
              variant="center"
              role="dialog"
              aria-modal="true"
              aria-label="Clear All Stored Library Data"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-zinc-950 border border-rose-500/30 shadow-2xl p-4 sm:p-6 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 flex items-center justify-center">
                  <AuraIcon name="alertTriangle" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">Clear All Stored Library Data?</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    This will permanently delete all imported tracks, cached audio blobs, custom playlists, favorites, and per-song DSP presets from your browser storage.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close confirmation dialog"
                  onClick={() => !isClearing && setIsConfirmOpen(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 cursor-pointer aura-pressable aura-focus-ring"
                >
                  <AuraIcon name="close" size={16} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400">
                <div className="flex justify-between py-0.5">
                  <span>Tracks to delete:</span>
                  <span className="font-mono tabular-nums text-zinc-200">{tracks.length}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Playlists to delete:</span>
                  <span className="font-mono tabular-nums text-zinc-200">{playlists.length}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Storage to reclaim:</span>
                  <span className="font-mono tabular-nums text-emerald-400">{formatStorageMB(storageUsage.approxBytes)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isClearing}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 transition-colors cursor-pointer aura-pressable"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClear}
                  disabled={isClearing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 transition-colors disabled:opacity-50 cursor-pointer aura-pressable"
                >
                  <AuraIcon name="trash" size={14} />
                  {isClearing ? 'Clearing Storage...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </MotionModal>
          </MotionBackdrop>
        )}
      </AnimatePresence>

      {/* Audio Engine Specs */}
      <section className="flex flex-col gap-3 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex items-start gap-3">
          <AuraIcon name="sliders" size={20} className="text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Web Audio API Engine Pipeline</h3>
            <p className="text-xs text-zinc-400">High precision browser-native DSP architecture</p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.06] border-t border-white/[0.06] text-xs text-zinc-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-3">
            <span className="shrink-0 font-medium text-zinc-200">Audio Graph Path</span>
            <span className="font-mono tabular-nums text-zinc-400 break-words sm:text-right">Source → EQ(10) → Comp → Limiter → Spatial(3D) → FX → Pan → Analyser</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-3">
            <span className="shrink-0 font-medium text-zinc-200">Sample Rate Support</span>
            <span className="font-mono tabular-nums text-zinc-400">44.1 kHz – 96 kHz Native Float32</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pt-3">
            <span className="shrink-0 font-medium text-zinc-200">FFT Analyser Resolution</span>
            <span className="font-mono tabular-nums text-zinc-400">2048 Points (Smoothing 0.82)</span>
          </div>
        </div>
      </section>

      {/* Shortcuts Sheet Button */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex items-start gap-3">
          <AuraIcon name="keyboard" size={20} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Keyboard Shortcuts</h3>
            <p className="text-xs text-zinc-400">Full keyboard accessibility, transport controls, and shortcuts sheet</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsShortcutsModalOpen(true)}
          className="min-h-[40px] shrink-0 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-xs font-medium text-zinc-200 transition-colors cursor-pointer aura-pressable aura-focus-ring"
        >
          View Shortcuts (?)
        </button>
      </section>

      {/* Optical Glass Lab (Dev only) */}
      {import.meta.env.DEV && (
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-indigo-500/20">
          <div className="flex items-start gap-3 min-w-0">
            <AuraIcon name="sparkles" size={20} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-zinc-100">Optical Glass Lab (Dev)</h3>
                <span className="text-[11px] font-mono text-indigo-300/90">
                  · CSS · Canvas · SVG · WebGL
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Isolated 4-way optical material comparison over a shared pixel-aligned backdrop
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('optical-lab')}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-medium border border-indigo-500/25 transition-colors cursor-pointer shrink-0 aura-pressable aura-focus-ring"
          >
            Open Optical Lab
          </button>
        </section>
      )}

      {/* PWA Application & Install Status */}
      <section className="flex flex-col gap-3 p-4 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AuraIcon name="smartphone" size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Progressive Web App (PWA)</h3>
              <p className="text-xs text-zinc-400">Standalone installability, shell caching, and local storage</p>
            </div>
          </div>

          {isInstalled ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-sans font-medium shrink-0">
              <AuraIcon name="checkCircle" size={14} />
              Standalone Mode
            </span>
          ) : canInstall ? (
            <button
              type="button"
              onClick={promptInstall}
              className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0 aura-pressable"
            >
              <AuraIcon name="download" size={14} />
              <span>Install AURA</span>
            </button>
          ) : (
            <span className="self-start sm:self-auto text-zinc-400 text-xs font-sans font-medium shrink-0">
              Browser Web Mode
            </span>
          )}
        </div>

        <div className="flex flex-col divide-y divide-white/[0.06] border-t border-white/[0.06] text-xs text-zinc-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5">
            <span>App Shell Cache & Service Worker</span>
            <span className="font-sans font-medium text-emerald-400">Active (v2 shell precached)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5">
            <span>Local Music Storage</span>
            <span className="font-sans font-medium text-zinc-400">Local Browser IndexedDB (Private)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2.5">
            <span>Display Environment</span>
            <span className="font-sans font-medium text-zinc-400">
              {isInstalled ? 'Standalone Window (Zero URL bar)' : 'Standard Browser View'}
            </span>
          </div>
        </div>
      </section>

      {/* PWA iOS / Browser Instructions Modal */}
      <PWAInstallModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        isIOS={isIOS}
      />

    </div>
  );
};
