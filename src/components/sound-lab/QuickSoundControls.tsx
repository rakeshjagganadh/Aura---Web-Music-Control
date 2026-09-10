import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  Sparkles, 
  RotateCcw, 
  Radio, 
  Zap, 
  Sliders, 
  Volume2, 
  Waves, 
  Sun, 
  Flame, 
  Compass, 
  ShieldCheck,
  Power,
  Info
} from 'lucide-react';
import { canApplyDSP, getCapabilityNotice } from '../../services/sourceService';

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

  const [presetPromptOpen, setPresetPromptOpen] = React.useState(false);
  const [customName, setCustomName] = React.useState('');

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
      label: 'Bass & Weight',
      desc: 'Punchy low-end sub energy & warmth',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      color: 'from-rose-500 to-orange-500',
      val: quickSound.bass,
    },
    {
      key: 'clarity' as const,
      label: 'Clarity & Air',
      desc: 'Crisp vocal definition & shimmering highs',
      icon: <Sun className="w-4 h-4 text-amber-300" />,
      color: 'from-amber-400 to-yellow-400',
      val: quickSound.clarity,
    },
    {
      key: 'warmth' as const,
      label: 'Analog Warmth',
      desc: 'Harmonic saturation & vintage tape drive',
      icon: <Sparkles className="w-4 h-4 text-orange-400" />,
      color: 'from-orange-500 to-amber-500',
      val: quickSound.warmth,
    },
    {
      key: 'spatial' as const,
      label: 'Spatial Width',
      desc: 'Immersive soundstage & stereo dimension',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      color: 'from-cyan-500 to-blue-500',
      val: quickSound.spatial,
    },
    {
      key: 'reverb' as const,
      label: 'Acoustic Room',
      desc: 'Natural acoustic depth & ambient tail',
      icon: <Waves className="w-4 h-4 text-indigo-400" />,
      color: 'from-indigo-500 to-purple-500',
      val: quickSound.reverb,
    },
    {
      key: 'loudness' as const,
      label: 'Dynamic Impact',
      desc: 'Transparent punch, compression & body',
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      color: 'from-emerald-500 to-teal-500',
      val: quickSound.loudness,
    },
  ];

  return (
    <div id="quick-sound-controls" className="flex flex-col gap-6 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Capability Notice if playing restricted stream */}
      {!isDSPAllowed && dspNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{dspNotice}</span>
        </div>
      )}

      {/* Header & Mode Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Aura Quick Sound Playground</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Intuitive macro acoustic shapers mapped to the 64-bit Aura DSP audio processing pipeline.
          </p>
        </div>

        {/* Action matrix: A/B Compare & Master Bypass & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* A/B Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-white/10">
            <button
              id="ab-mode-a-btn"
              onClick={() => setABMode('A')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                abMode === 'A'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="A: Raw Audio without DSP processing"
            >
              A: Original
            </button>
            <button
              id="ab-mode-b-btn"
              onClick={() => setABMode('B')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                abMode === 'B'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="B: Processed Aura Sound Lab DSP"
            >
              B: Sound Lab
            </button>
          </div>

          {/* Master Bypass */}
          <button
            id="master-bypass-btn"
            onClick={toggleMasterBypass}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isMasterBypass
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700'
            }`}
            title="Toggle Master DSP Bypass"
          >
            <Power className="w-3.5 h-3.5" />
            {isMasterBypass ? 'Bypassed' : 'Active DSP'}
          </button>

          {/* Reset neutral */}
          <button
            id="reset-quick-sound-btn"
            onClick={resetQuickSound}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 transition-all"
            title="Reset macro sliders to neutral default"
          >
            <RotateCcw className="w-3 h-3" />
            Neutral
          </button>
        </div>
      </div>

      {/* Preset Pills Carousel */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">One-Click Sound Profiles</span>
          <button
            onClick={() => setPresetPromptOpen(!presetPromptOpen)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            + Save current as preset
          </button>
        </div>

        {presetPromptOpen && (
          <form onSubmit={handleSavePreset} className="flex gap-2 p-3 rounded-2xl bg-zinc-950 border border-cyan-500/30">
            <input
              type="text"
              placeholder="Preset Name (e.g. Midnight Chill)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setPresetPromptOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
          {soundLabPresets.map((preset) => {
            const isActive = activeSoundLabPreset === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-pill-${preset.id}`}
                onClick={() => applySoundLabPreset(preset.id)}
                className={`flex-shrink-0 flex flex-col items-start gap-0.5 px-3.5 py-2 rounded-2xl text-left transition-all border ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border-cyan-500/40 text-cyan-200 shadow-lg shadow-cyan-500/10'
                    : 'bg-zinc-950/60 border-white/5 text-zinc-300 hover:bg-zinc-800/80 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold whitespace-nowrap">{preset.name}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                </div>
                <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 Macro Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {macroControls.map((macro) => {
          return (
            <div
              key={macro.key}
              className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/50 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-white/5 group-hover:scale-105 transition-transform">
                    {macro.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{macro.label}</h4>
                    <p className="text-[10px] text-zinc-400">{macro.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-white/5">
                  {macro.val}%
                </span>
              </div>

              {/* Slider track */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={macro.val}
                  onChange={(e) => updateQuickSound({ [macro.key]: parseInt(e.target.value, 10) })}
                  className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Slider footer indicators */}
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span>0 (Dry/Cut)</span>
                <span className={macro.val === 50 ? 'text-cyan-400 font-bold' : ''}>50 (Neutral)</span>
                <span>100 (Boost)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
