import React from 'react';
import { useMusic, AudioControlTab } from '../../context/MusicContext';
import { Equalizer10Band } from './Equalizer10Band';
import { DynamicsPanel } from './DynamicsPanel';
import { SpatialAudioPanel } from './SpatialAudioPanel';
import { EffectsRackPanel } from './EffectsRackPanel';
import { ChannelMatrixPanel } from './ChannelMatrixPanel';
import { AudioAnalysisPanel } from './AudioAnalysisPanel';
import { PresetsProfilesPanel } from './PresetsProfilesPanel';
import { 
  SlidersHorizontal, 
  Activity, 
  Compass, 
  Sparkles, 
  Split, 
  BarChart3, 
  Bookmark, 
  Layers, 
  RotateCcw, 
  X, 
  Copy, 
  Check, 
  Radio, 
  Zap,
  Volume2,
  Maximize2
} from 'lucide-react';
import { MobileAudioControlSheet } from '../mobile/MobileAudioControlSheet';

export const AudioControlCenter: React.FC = () => {
  const {
    isAudioControlsOpen,
    setIsAudioControlsOpen,
    activeAudioTab,
    setActiveAudioTab,
    isABBypassed,
    toggleABBypass,
    resetAllAudioProcessing,
    isAdvancedMode,
    toggleAdvancedMode,
    currentTrack,
    hasSongProfile,
    hasCopiedSettings,
    copyCurrentSettings,
    pasteSettings,
    bass,
    setBass,
    treble,
    setTreble,
    balance,
    setBalance,
    applyPresetSnapshot
  } = useMusic();

  if (!isAudioControlsOpen) return null;

  const TABS: { id: AudioControlTab; label: string; icon: React.ReactNode; proOnly?: boolean }[] = [
    { id: 'overview', label: 'Quick Tone', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'eq', label: '10-Band EQ', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'dynamics', label: 'Dynamics & Limiter', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'spatial', label: 'Spatial 3D', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'effects', label: 'Effects Rack', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'channels', label: 'Channels & Pitch', icon: <Split className="w-3.5 h-3.5" /> },
    { id: 'analysis', label: 'Analysis & Meters', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'presets', label: 'Presets & Hardware', icon: <Bookmark className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Mobile Touch-Optimized Sheet */}
      <MobileAudioControlSheet />

      {/* Desktop Audio Control Center Drawer (100% preserved) */}
      <div className="hidden lg:flex fixed inset-0 z-50 justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
        
        {/* Backdrop click to close */}
        <div 
          className="absolute inset-0" 
          onClick={() => setIsAudioControlsOpen(false)} 
        />

      {/* Main Drawer Container */}
      <div className="relative w-full max-w-4xl h-full bg-[#0d0e12] border-l border-white/10 shadow-2xl flex flex-col z-10 overflow-hidden">
        
        {/* Top Studio Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col gap-3 bg-zinc-950/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between gap-3">
            
            {/* Title & Status */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Audio Control Studio
                  </h2>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isAdvancedMode 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {isAdvancedMode ? 'PRO DSP' : 'SIMPLE'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md">
                  {currentTrack ? (
                    <>
                      Target: <span className="text-zinc-200 font-medium">{currentTrack.title}</span>
                      {hasSongProfile && <span className="ml-1.5 text-violet-400 font-semibold">• Custom Song Profile</span>}
                    </>
                  ) : (
                    'Configure master output DSP'
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2">
              
              {/* A/B Comparison Toggle Switch */}
              <button
                onClick={toggleABBypass}
                title="A/B Comparison: Toggle between original unprocessed audio and studio DSP"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border shadow-sm ${
                  isABBypassed
                    ? 'bg-zinc-800 text-zinc-300 border-white/20'
                    : 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${!isABBypassed ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                <span>{isABBypassed ? 'A: ORIGINAL' : 'B: STUDIO DSP'}</span>
              </button>

              {/* Mode Toggle (Simple vs Pro) */}
              <button
                onClick={toggleAdvancedMode}
                title="Toggle between Simple Controls and Professional Audio Engineering Modules"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/10 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {isAdvancedMode ? 'Simple Mode' : 'Pro Studio'}
              </button>

              {/* Reset All */}
              <button
                onClick={resetAllAudioProcessing}
                title="Reset all audio EQ, dynamics, spatial, and effects to flat defaults"
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsAudioControlsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation Scrollable Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => {
              const isActive = activeAudioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAudioTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 select-none">
          {currentTrack?.source === 'youtube' && (
            <div className="mb-4 p-3 rounded-2xl bg-zinc-900/80 border border-red-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] border border-red-500/30 font-semibold">
                  YOUTUBE SOURCE
                </span>
                <span className="text-zinc-300 text-xs">
                  Basic playback (Speed, Volume, Seek, Queue) is fully integrated. Web Audio DSP & EQ filters apply to local files.
                </span>
              </div>
            </div>
          )}
          
          {/* Quick Tone & Simple Overview Pane */}
          {activeAudioTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-150">
              
              {/* Simple Tone Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Bass */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Low-End Bass</span>
                    <span className={`text-xs font-mono font-bold ${bass > 0 ? 'text-indigo-400' : bass < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                      {bass > 0 ? `+${bass.toFixed(1)}` : bass.toFixed(1)} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={bass}
                    onChange={(e) => setBass(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Tamed (-12dB)</span>
                    <span>Flat</span>
                    <span>Deep Punch (+12dB)</span>
                  </div>
                </div>

                {/* Treble */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">High-End Air (Treble)</span>
                    <span className={`text-xs font-mono font-bold ${treble > 0 ? 'text-cyan-400' : treble < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                      {treble > 0 ? `+${treble.toFixed(1)}` : treble.toFixed(1)} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={treble}
                    onChange={(e) => setTreble(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Dark (-12dB)</span>
                    <span>Flat</span>
                    <span>Bright Sparkle (+12dB)</span>
                  </div>
                </div>

                {/* Balance */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Stereo Balance</span>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      {balance === 0
                        ? 'Center'
                        : balance < 0
                        ? `L ${Math.round(Math.abs(balance) * 100)}%`
                        : `R ${Math.round(balance * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Left 100%</span>
                    <span>Center</span>
                    <span>Right 100%</span>
                  </div>
                </div>

              </div>

              {/* Instant Sound Profiles Grid */}
              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 flex flex-col gap-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Instant Sound Moods
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Warm & Intimate', gains: [4, 3, 2, 1, 0, 0, 1, 1, 0, -1], b: 3, t: 0 },
                    { label: 'Crisp & Airy', gains: [0, 0, 0, 1, 2, 3, 4, 5, 5, 4], b: 0, t: 4 },
                    { label: 'Heavy Club Bass', gains: [6, 5, 4, 2, 0, 1, 2, 3, 3, 2], b: 6, t: 2 },
                    { label: 'Vocal Forward', gains: [-2, -1, 0, 1, 3, 4, 4, 3, 2, 1], b: -1, t: 3 },
                    { label: 'Late Night Soft', gains: [1, 2, 1, 0, 0, 0, -1, -2, -3, -4], b: 1, t: -3 },
                    { label: 'Studio Neutral', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], b: 0, t: 0 },
                    { label: 'Acoustic Presence', gains: [2, 2, 1, 1, 2, 3, 3, 3, 2, 2], b: 1, t: 2 },
                    { label: 'Cinema Immersion', gains: [5, 4, 2, 0, 0, 1, 3, 4, 5, 4], b: 4, t: 3 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        applyPresetSnapshot({
                          name: preset.label,
                          eqGains: preset.gains,
                          bass: preset.b,
                          treble: preset.t,
                        }, preset.label);
                      }}
                      className="p-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-900 border border-white/5 hover:border-indigo-500/40 text-left transition-all group"
                    >
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white block truncate">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                        Tap to apply
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 10-Band Parametric Equalizer */}
          {activeAudioTab === 'eq' && (
            <Equalizer10Band className="animate-in fade-in duration-150" />
          )}

          {/* Dynamics & Limiter */}
          {activeAudioTab === 'dynamics' && (
            <DynamicsPanel className="animate-in fade-in duration-150" />
          )}

          {/* Spatial 3D Audio */}
          {activeAudioTab === 'spatial' && (
            <SpatialAudioPanel className="animate-in fade-in duration-150" />
          )}

          {/* Effects Rack */}
          {activeAudioTab === 'effects' && (
            <EffectsRackPanel className="animate-in fade-in duration-150" />
          )}

          {/* Channel Matrix & Pitch */}
          {activeAudioTab === 'channels' && (
            <ChannelMatrixPanel className="animate-in fade-in duration-150" />
          )}

          {/* Analysis & Meters */}
          {activeAudioTab === 'analysis' && (
            <AudioAnalysisPanel className="animate-in fade-in duration-150" />
          )}

          {/* Presets & Hardware Calibration */}
          {activeAudioTab === 'presets' && (
            <PresetsProfilesPanel className="animate-in fade-in duration-150" />
          )}

        </div>

      </div>

    </div>
    </>
  );
};
