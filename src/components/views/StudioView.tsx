import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { QuickSoundControls } from '../sound-lab/QuickSoundControls';
import { LoopABController } from '../sound-lab/LoopABController';
import { StereoPhaseController } from '../sound-lab/StereoPhaseController';
import { WaveformMarkersOverlay } from '../sound-lab/WaveformMarkersOverlay';
import { AuraMomentsPanel } from '../sound-lab/AuraMomentsPanel';
import { Equalizer10Band } from '../audio-controls/Equalizer10Band';
import { DynamicsPanel } from '../audio-controls/DynamicsPanel';
import { SpatialAudioPanel } from '../audio-controls/SpatialAudioPanel';
import { EffectsRackPanel } from '../audio-controls/EffectsRackPanel';
import { ChannelMatrixPanel } from '../audio-controls/ChannelMatrixPanel';
import { AudioAnalysisPanel } from '../audio-controls/AudioAnalysisPanel';
import { PresetsProfilesPanel } from '../audio-controls/PresetsProfilesPanel';
import { StemsPlaceholderPanel } from '../audio-controls/StemsPlaceholderPanel';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { WaveformScrubber } from '../waveform/WaveformScrubber';
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { SharedIndicator } from '../common/motion/MotionInteractive';
import { 
  Sparkles, 
  SlidersHorizontal, 
  Compass, 
  Repeat, 
  BarChart3, 
  Activity, 
  Scissors, 
  Radio, 
  Zap, 
  RefreshCw, 
  Maximize2, 
  Music,
  Bookmark,
  Flag,
  Wand2,
  Split,
  Layers
} from 'lucide-react';

export type StudioCategory = 
  | 'tuning' 
  | 'eq_dynamics' 
  | 'spatial_fx' 
  | 'time_cues' 
  | 'mastering_analysis';

export type StudioSubModule = 
  | 'soundlab'
  | 'eq'
  | 'dynamics'
  | 'spatial'
  | 'effects'
  | 'channels'
  | 'loop'
  | 'stereo'
  | 'markers'
  | 'moments'
  | 'analysis'
  | 'presets'
  | 'stems';

interface CategoryConfig {
  id: StudioCategory;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
  defaultSubModule: StudioSubModule;
  subModules?: {
    id: StudioSubModule;
    label: string;
    icon: React.ReactNode;
  }[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'tuning',
    label: 'Tuning & Tone',
    shortLabel: 'Tuning',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    description: 'Aura Sound Lab macro acoustic shapers & one-click mood profiles',
    defaultSubModule: 'soundlab',
  },
  {
    id: 'eq_dynamics',
    label: 'EQ & Dynamics',
    shortLabel: 'EQ & Dyn',
    icon: <SlidersHorizontal className="w-4 h-4 text-indigo-400" />,
    description: '10-band studio parametric EQ and precision dynamic range control',
    defaultSubModule: 'eq',
    subModules: [
      { id: 'eq', label: '10-Band EQ', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
      { id: 'dynamics', label: 'Dynamics & Limiter', icon: <Activity className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: 'spatial_fx',
    label: 'Spatial & FX',
    shortLabel: 'Spatial & FX',
    icon: <Compass className="w-4 h-4 text-emerald-400" />,
    description: '3D soundstage immersion, hardware effects rack & channel routing',
    defaultSubModule: 'spatial',
    subModules: [
      { id: 'spatial', label: 'Spatial 3D Audio', icon: <Compass className="w-3.5 h-3.5" /> },
      { id: 'effects', label: 'Effects Rack', icon: <Wand2 className="w-3.5 h-3.5" /> },
      { id: 'channels', label: 'Pitch & Channels', icon: <Split className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: 'time_cues',
    label: 'Time & Cues',
    shortLabel: 'Time & Cues',
    icon: <Repeat className="w-4 h-4 text-purple-400" />,
    description: 'Zero-gap A/B looping, cue markers, phase correlation & Aura moments',
    defaultSubModule: 'loop',
    subModules: [
      { id: 'loop', label: 'Loop A/B', icon: <Repeat className="w-3.5 h-3.5" /> },
      { id: 'stereo', label: 'Stereo & Phase', icon: <Compass className="w-3.5 h-3.5" /> },
      { id: 'markers', label: 'Cue Markers', icon: <Flag className="w-3.5 h-3.5" /> },
      { id: 'moments', label: 'Aura Moments', icon: <Bookmark className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: 'mastering_analysis',
    label: 'Mastering & Analysis',
    shortLabel: 'Analysis',
    icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
    description: 'High-resolution telemetry meters, hardware calibration & stem separation',
    defaultSubModule: 'analysis',
    subModules: [
      { id: 'analysis', label: 'Meters & Analysis', icon: <BarChart3 className="w-3.5 h-3.5" /> },
      { id: 'presets', label: 'Hardware Presets', icon: <Bookmark className="w-3.5 h-3.5" /> },
      { id: 'stems', label: 'Stem Separation (Lab)', icon: <Layers className="w-3.5 h-3.5" /> },
    ],
  },
];

export const StudioView: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    seek,
    setIsSeeking,
    visualizerMode,
    setVisualizerMode,
    resetAllAudioProcessing,
    isABBypassed,
    toggleABBypass,
    isAdvancedMode,
    toggleAdvancedMode,
    hasSongProfile,
    setIsExpandedPlayerOpen,
    loopAB,
    markers,
    jumpToMarker,
    setIsTrimExportModalOpen,
  } = useMusic();

  const [activeCategory, setActiveCategory] = useState<StudioCategory>('tuning');
  const [subModuleState, setSubModuleState] = useState<Record<StudioCategory, StudioSubModule>>({
    tuning: 'soundlab',
    eq_dynamics: 'eq',
    spatial_fx: 'spatial',
    time_cues: 'loop',
    mastering_analysis: 'analysis',
  });

  const currentCategoryConfig = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const activeSubModule = subModuleState[activeCategory] || currentCategoryConfig.defaultSubModule;

  const handleSelectCategory = (catId: StudioCategory) => {
    setActiveCategory(catId);
  };

  const handleSelectSubModule = (subId: StudioSubModule) => {
    setSubModuleState((prev) => ({
      ...prev,
      [activeCategory]: subId,
    }));
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto select-none">
      
      {/* ======================================================== */}
      {/* ZONE 1: MASTER SIGNAL & TIMELINE HEADER                  */}
      {/* ======================================================== */}
      <section 
        aria-label="Master Signal and Timeline"
        className="rounded-3xl bg-[#0a0d18]/80 backdrop-blur-2xl p-4 sm:p-5 shadow-xl border border-white/[0.08] flex flex-col gap-4"
      >
        {/* Top Bar: Track Info & Quick Master Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
          {/* Active Track Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              {currentTrack?.artwork ? (
                <img 
                  src={currentTrack.artwork} 
                  alt={currentTrack.title} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<svg class="w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
                    }
                  }}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Music className="w-5 h-5 text-zinc-500" />
              )}
            </div>

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-md">
                  {currentTrack ? currentTrack.title : 'No Audio Track Loaded'}
                </span>
                {hasSongProfile && (
                  <span className="text-[11px] font-mono text-cyan-400 font-medium shrink-0">
                    · Profile Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
                <span>{currentTrack ? currentTrack.artist : 'Select a track to apply DSP processing'}</span>
                {currentTrack?.fileFormat && (
                  <>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="font-mono text-[11px] text-zinc-500 uppercase">{currentTrack.fileFormat}</span>
                  </>
                )}
                {currentTrack?.source && (
                  <>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-[11px] text-zinc-500 capitalize">{currentTrack.source}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Master Signal Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* A/B Compare Button */}
            <button
              onClick={toggleABBypass}
              title="A/B Comparison: Toggle between original unprocessed audio (A: RAW) and studio DSP (B: DSP)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors border cursor-pointer aura-pressable ${
                isABBypassed
                  ? 'bg-zinc-900 text-amber-300 border-amber-500/30 shadow-sm'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10 shadow-sm'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${!isABBypassed ? 'text-cyan-400' : 'text-amber-400'}`} />
              <span>{isABBypassed ? 'A: RAW' : 'B: DSP'}</span>
            </button>

            {/* Lossless Export / Trim Modal Launcher */}
            <button
              onClick={() => setIsTrimExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer aura-pressable"
              title="Open Lossless Audio Trimmer & WAV Master Export"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Trim & Export</span>
            </button>

            {/* Pro / Simple Mode Toggle */}
            <button
              onClick={toggleAdvancedMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer aura-pressable ${
                isAdvancedMode 
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
              title="Toggle between Pro engineering controls and simplified macro view"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAdvancedMode ? 'Pro Mode' : 'Simple'}</span>
            </button>

            {/* Master Reset All */}
            <button
              onClick={resetAllAudioProcessing}
              title="Reset all studio audio processing, filters, and effects to flat defaults"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl transition-colors cursor-pointer aura-pressable"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset All</span>
            </button>

            {/* Full Screen Expanded Player */}
            <button
              onClick={() => setIsExpandedPlayerOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl transition-colors cursor-pointer aura-pressable"
              title="Open Fullscreen Visual Player"
              aria-label="Open Fullscreen Visual Player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Spectrum Visualizer (Restrained compact height) */}
        <div className="w-full">
          <AudioVisualizer
            mode={visualizerMode}
            onModeChange={setVisualizerMode}
            height={100}
            showControls={true}
          />
        </div>

        {/* Compact Waveform Scrubber with Cue & Loop Indicators */}
        {currentTrack && (
          <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
            <WaveformScrubber
              peaks={currentTrack.waveformPeaks}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              onSeekingChange={setIsSeeking}
              height={30}
              barWidth={2.5}
              barGap={1.5}
              activeColor="#22d3ee"
              inactiveColor="rgba(255, 255, 255, 0.12)"
              markers={markers}
              onMarkerClick={jumpToMarker}
              loopRegion={{
                pointA: loopAB.pointA,
                pointB: loopAB.pointB,
                enabled: loopAB.enabled,
              }}
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              {loopAB.enabled && loopAB.pointA !== null && loopAB.pointB !== null ? (
                <span className="text-purple-400 font-medium">
                  Loop: {formatTime(loopAB.pointA)} - {formatTime(loopAB.pointB)}
                </span>
              ) : (
                <span className="text-zinc-600 text-[10px]">64-BIT DSP TIMELINE</span>
              )}
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* ZONE 2: 5-CATEGORY STUDIO NAVIGATION                     */}
      {/* ======================================================== */}
      <nav aria-label="Studio Categories" className="flex flex-col gap-3">
        {/* Primary 5-Category Tabs Bar */}
        <LayoutGroup id="studio-categories">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 rounded-2xl aura-glass-ambient">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer aura-pressable ${
                    isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <SharedIndicator
                      layoutId="studio-category-pill"
                      className="absolute inset-0 rounded-xl bg-zinc-800 border border-white/15 shadow-sm"
                    />
                  )}
                  <div className="relative z-10 shrink-0">{cat.icon}</div>
                  <div className="relative z-10 truncate">
                    <span className="block truncate">{cat.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Sub-Navigation if category has multiple modules */}
        {currentCategoryConfig.subModules && currentCategoryConfig.subModules.length > 1 && (
          <LayoutGroup id={`studio-submodules-${activeCategory}`}>
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none">
              {currentCategoryConfig.subModules.map((sub) => {
                const isSubActive = activeSubModule === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubModule(sub.id)}
                    className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer aura-pressable ${
                      isSubActive
                        ? 'text-cyan-300'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-white/5'
                    }`}
                  >
                    {isSubActive && (
                      <SharedIndicator
                        layoutId="studio-submodule-pill"
                        className="absolute inset-0 rounded-lg bg-zinc-800 border border-cyan-500/30 shadow-sm"
                      />
                    )}
                    <span className={`relative z-10 ${isSubActive ? 'text-cyan-400' : 'text-zinc-500'}`}>{sub.icon}</span>
                    <span className="relative z-10">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        )}
      </nav>

      {/* ======================================================== */}
      {/* ZONE 3: CONTEXTUAL CONTROL SURFACE                       */}
      {/* ======================================================== */}
      <main aria-label="Studio Workspace" className="w-full">
        <AnimatePresence mode="wait" initial={false}>
          <MotionFadeSlide
            key={`${activeCategory}:${activeSubModule}`}
            direction="up"
            distance={6}
            duration="micro"
          >
            {/* Category 1: Tuning & Tone */}
            {activeCategory === 'tuning' && <QuickSoundControls />}

            {/* Category 2: EQ & Dynamics */}
            {activeCategory === 'eq_dynamics' && (
              <>
                {activeSubModule === 'eq' && <Equalizer10Band />}
                {activeSubModule === 'dynamics' && <DynamicsPanel />}
              </>
            )}

            {/* Category 3: Spatial & FX */}
            {activeCategory === 'spatial_fx' && (
              <>
                {activeSubModule === 'spatial' && <SpatialAudioPanel />}
                {activeSubModule === 'effects' && <EffectsRackPanel />}
                {activeSubModule === 'channels' && <ChannelMatrixPanel />}
              </>
            )}

            {/* Category 4: Time & Cues */}
            {activeCategory === 'time_cues' && (
              <>
                {activeSubModule === 'loop' && <LoopABController />}
                {activeSubModule === 'stereo' && <StereoPhaseController />}
                {activeSubModule === 'markers' && <WaveformMarkersOverlay />}
                {activeSubModule === 'moments' && <AuraMomentsPanel />}
              </>
            )}

            {/* Category 5: Mastering & Analysis */}
            {activeCategory === 'mastering_analysis' && (
              <>
                {activeSubModule === 'analysis' && <AudioAnalysisPanel />}
                {activeSubModule === 'presets' && <PresetsProfilesPanel />}
                {activeSubModule === 'stems' && <StemsPlaceholderPanel />}
              </>
            )}
          </MotionFadeSlide>
        </AnimatePresence>
      </main>

    </div>
  );
};
