import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  Sparkles, 
  RotateCcw, 
  Flame, 
  Sun, 
  Compass, 
  Waves, 
  Volume2, 
  Power, 
  Info,
  Radio,
  Bookmark,
  Check,
  Disc3,
  Moon,
  Headphones,
  Film,
  Mic2,
  Guitar
} from 'lucide-react';
import { canApplyDSP, getCapabilityNotice } from '../../services/sourceService';

interface MoodProfileCard {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

const CURATED_MOOD_PROFILES: MoodProfileCard[] = [
  {
    id: 'flat',
    label: 'Studio Neutral',
    subtitle: 'Flat reference curve, 0 dB uncolored response',
    icon: <Disc3 className="w-4 h-4 text-zinc-300" />,
  },
  {
    id: 'warm',
    label: 'Warm & Intimate',
    subtitle: 'Rich low-mids, smooth analog tape harmonics',
    icon: <Sparkles className="w-4 h-4 text-orange-400" />,
  },
  {
    id: 'clear',
    label: 'Crisp & Airy',
    subtitle: 'High-frequency brilliance & open soundstage',
    icon: <Sun className="w-4 h-4 text-amber-300" />,
  },
  {
    id: 'deep_bass',
    label: 'Heavy Club Bass',
    subtitle: 'Sub-bass extension, punchy 808 kick weight',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'vocal_focus',
    label: 'Vocal Forward',
    subtitle: 'Elevated 1-3 kHz vocal clarity & intelligibility',
    icon: <Mic2 className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'night',
    label: 'Late Night Soft',
    subtitle: 'Tamed dynamic peaks for relaxed night listening',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
  },
  {
    id: 'acoustic',
    label: 'Acoustic Presence',
    subtitle: 'Natural strings, wooden resonance & room air',
    icon: <Guitar className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'cinema',
    label: 'Cinema Immersion',
    subtitle: 'Expanded width, cinematic low-end & ambient room',
    icon: <Film className="w-4 h-4 text-purple-400" />,
  },
];

export const QuickSoundControls: React.FC = () => {
  const {
    currentTrack,
    quickSound,
    updateQuickSound,
    resetQuickSound,
    soundLabPresets,
    activeSoundLabPreset,
    applySoundLabPreset,
    abMode,
    setABMode,
    isMasterBypass,
    toggleMasterBypass,
    saveCustomSoundLabPreset,
  } = useMusic();

  const isDSPAllowed = canApplyDSP(currentTrack);
  const dspNotice = getCapabilityNotice('eq', currentTrack);

  const [presetPromptOpen, setPresetPromptOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    saveCustomSoundLabPreset(customName.trim());
    setCustomName('');
    setPresetPromptOpen(false);
  };

  const macroControls = [
    {
      key: 'bass' as const,
      label: 'Bass Boost & Weight',
      desc: 'Sub-bass energy, 808 depth and low-end impact',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      val: quickSound.bass,
      neutralVal: 50,
      minLabel: '0 (Cut)',
      centerLabel: '50 (Flat)',
      maxLabel: '100 (Max)',
    },
    {
      key: 'clarity' as const,
      label: 'Clarity & Presence',
      desc: 'Vocal projection, speech articulation and high-end air',
      icon: <Sun className="w-4 h-4 text-amber-300" />,
      val: quickSound.clarity,
      neutralVal: 50,
      minLabel: '0 (Warm)',
      centerLabel: '50 (Flat)',
      maxLabel: '100 (Bright)',
    },
    {
      key: 'warmth' as const,
      label: 'Warmth / Analog Drive',
      desc: 'Second-order harmonic tape drive and tube saturation',
      icon: <Sparkles className="w-4 h-4 text-orange-400" />,
      val: quickSound.warmth,
      neutralVal: 50,
      minLabel: '0 (Clean)',
      centerLabel: '50 (Neutral)',
      maxLabel: '100 (Saturated)',
    },
    {
      key: 'spatial' as const,
      label: 'Spatial Width',
      desc: 'Stereo soundstage expansion and binaural depth',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      val: quickSound.spatial,
      neutralVal: 0,
      minLabel: '0 (Mono)',
      centerLabel: '50 (Standard)',
      maxLabel: '100 (Wide 3D)',
    },
    {
      key: 'reverb' as const,
      label: 'Atmosphere & Reverb',
      desc: 'Acoustic room simulation and ambient spatial decay',
      icon: <Waves className="w-4 h-4 text-indigo-400" />,
      val: quickSound.reverb,
      neutralVal: 0,
      minLabel: '0 (Dry)',
      centerLabel: '50 (Room)',
      maxLabel: '100 (Hall)',
    },
    {
      key: 'loudness' as const,
      label: 'Loudness & Impact',
      desc: 'Transparent multiband punch and dynamic body',
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      val: quickSound.loudness,
      neutralVal: 50,
      minLabel: '0 (Low)',
      centerLabel: '50 (Standard)',
      maxLabel: '100 (Maximum)',
    },
  ];

  // Custom presets saved by the user
  const customPresets = soundLabPresets.filter((p) => !p.isBuiltIn);

  return (
    <div id="quick-sound-controls" className="flex flex-col gap-6 p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Capability Notice for streams that do not permit Web Audio DSP */}
      {!isDSPAllowed && dspNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{dspNotice}</span>
        </div>
      )}

      {/* Header & Primary Action Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Sound Lab Macro Workspace</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/10">
              64-BIT DSP
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Intuitive macro acoustic shapers mapped to the 64-bit Aura DSP audio processing pipeline.
          </p>
        </div>

        {/* Master Control Matrix */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* A/B Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-900 border border-white/10">
            <button
              id="ab-mode-a-btn"
              onClick={() => setABMode('A')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                abMode === 'A'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="A: Raw Audio without DSP processing"
            >
              A: RAW
            </button>
            <button
              id="ab-mode-b-btn"
              onClick={() => setABMode('B')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                abMode === 'B'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="B: Processed Aura Sound Lab DSP"
            >
              B: DSP
            </button>
          </div>

          {/* Master DSP Bypass */}
          <button
            id="master-bypass-btn"
            onClick={toggleMasterBypass}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isMasterBypass
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800'
            }`}
            title="Toggle Master DSP Bypass"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isMasterBypass ? 'DSP Bypassed' : 'DSP Active'}</span>
          </button>

          {/* Reset All Macros to Neutral */}
          <button
            id="reset-quick-sound-btn"
            onClick={resetQuickSound}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/5 transition-all"
            title="Reset macro sliders to neutral default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Neutral</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8 ONE-CLICK MOOD PROFILES GRID                           */}
      {/* ======================================================== */}
      <section aria-label="One-Click Mood Profiles" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Acoustic Mood Profiles</span>
            <span className="text-[11px] text-zinc-500">· One-click DSP tuning</span>
          </div>

          <button
            onClick={() => setPresetPromptOpen(!presetPromptOpen)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>+ Save As Custom Preset</span>
          </button>
        </div>

        {/* Custom Preset Save Inline Form */}
        {presetPromptOpen && (
          <form onSubmit={handleSavePreset} className="flex gap-2 p-3 rounded-xl bg-zinc-900 border border-cyan-500/30 animate-in fade-in duration-150">
            <input
              type="text"
              placeholder="Preset Name (e.g. Midnight Chill, Vinyl Warmth)..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-sans"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
            >
              Save Preset
            </button>
            <button
              type="button"
              onClick={() => setPresetPromptOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Curated 8 Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {CURATED_MOOD_PROFILES.map((profile) => {
            const isActive = activeSoundLabPreset === profile.id;
            return (
              <button
                key={profile.id}
                id={`preset-pill-${profile.id}`}
                onClick={() => applySoundLabPreset(profile.id)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="shrink-0">{profile.icon}</div>
                  {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <span className="text-xs font-bold leading-tight line-clamp-1">{profile.label}</span>
                <span className="text-[10px] text-zinc-500 leading-tight line-clamp-2">{profile.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* User Saved Presets if any exist */}
        {customPresets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
            <span className="text-[11px] font-mono text-zinc-500 uppercase shrink-0">Custom:</span>
            {customPresets.map((preset) => {
              const isActive = activeSoundLabPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applySoundLabPreset(preset.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                      : 'bg-zinc-900/80 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Bookmark className="w-3 h-3 text-indigo-400" />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 6 MACRO SLIDERS GRID                                     */}
      {/* ======================================================== */}
      <section aria-label="Acoustic Macro Controls" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {macroControls.map((macro) => {
          const isAtNeutral = macro.val === macro.neutralVal;

          return (
            <div
              key={macro.key}
              className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all"
            >
              {/* Macro Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 shrink-0">
                    {macro.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{macro.label}</h3>
                    <p className="text-[10px] text-zinc-400 leading-tight">{macro.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono font-bold text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-white/5 tabular-nums">
                    {macro.val}%
                  </span>
                </div>
              </div>

              {/* Slider Track */}
              <div className="flex flex-col gap-1.5 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={macro.val}
                  onChange={(e) => updateQuickSound({ [macro.key]: parseInt(e.target.value, 10) })}
                  className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
                  aria-label={`${macro.label} intensity`}
                />

                {/* Calibration labels */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono tabular-nums">
                  <span>{macro.minLabel}</span>
                  <button
                    type="button"
                    onClick={() => updateQuickSound({ [macro.key]: macro.neutralVal })}
                    className={`hover:underline ${isAtNeutral ? 'text-cyan-400 font-semibold' : 'text-zinc-500'}`}
                    title="Click to reset to neutral baseline"
                  >
                    {macro.centerLabel}
                  </button>
                  <span>{macro.maxLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
