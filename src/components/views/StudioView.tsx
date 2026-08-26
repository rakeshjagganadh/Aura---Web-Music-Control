import React, { useState } from 'react';
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
import { 
  SlidersHorizontal, 
  Sparkles, 
  Layers, 
  Activity, 
  Compass,
  Split,
  BarChart3,
  Bookmark,
  Play, 
  Pause, 
  Volume2, 
  Music, 
  Maximize2,
  RefreshCw,
  Radio,
  Zap,
  Repeat,
  Scissors,
  Flag,
  Wand2,
  Download
} from 'lucide-react';

type StudioTab = 
  | 'soundlab'
  | 'loop'
  | 'stereo'
  | 'markers'
  | 'moments'
  | 'eq' 
  | 'dynamics' 
  | 'spatial' 
  | 'effects' 
  | 'channels' 
  | 'analysis' 
  | 'presets' 
  | 'stems';

export const StudioView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    seek,
    togglePlay,
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

  const [activeTab, setActiveTab] = useState<StudioTab>('soundlab');

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const STUDIO_TABS: { id: StudioTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'soundlab', label: 'Sound Lab', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, badge: 'NEW' },
    { id: 'loop', label: 'Loop A/B', icon: <Repeat className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'stereo', label: 'Stereo & Phase', icon: <Compass className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'markers', label: 'Cue Markers', icon: <Flag className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'moments', label: 'Aura Moments', icon: <Bookmark className="w-3.5 h-3.5 text-violet-400" /> },
    { id: 'eq', label: '10-Band EQ', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'dynamics', label: 'Dynamics & Limiter', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'spatial', label: 'Spatial 3D', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'effects', label: 'Effects Rack', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: 'channels', label: 'Pitch & Channels', icon: <Split className="w-3.5 h-3.5" /> },
    { id: 'analysis', label: 'Meters & Analysis', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'presets', label: 'Hardware Presets', icon: <Bookmark className="w-3.5 h-3.5" /> },
    { id: 'stems', label: 'Stems (Lab)', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none pb-28">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">AURA SOUND LAB & Audio Studio</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PHASE 2
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personal audio playground: Macro tuning, zero-gap A/B looping, cue markers, phase correlation, and lossless WAV master export.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export / Trim modal launcher */}
          <button
            onClick={() => setIsTrimExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
            title="Open Audio Trimmer & Lossless WAV Master Export"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Trim & Export</span>
          </button>

          {/* A/B comparison button */}
          <button
            onClick={toggleABBypass}
            title="A/B Comparison: Toggle between original audio and studio DSP"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border shadow-sm ${
              isABBypassed
                ? 'bg-zinc-800 text-zinc-300 border-white/20'
                : 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${!isABBypassed ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <span>{isABBypassed ? 'A: RAW' : 'B: DSP'}</span>
          </button>

          {/* Pro Mode toggle */}
          <button
            onClick={toggleAdvancedMode}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {isAdvancedMode ? 'Simple View' : 'Pro Controls'}
          </button>

          {/* Reset button */}
          <button
            onClick={resetAllAudioProcessing}
            title="Reset all audio DSP to flat defaults"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-white/5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reset All
          </button>

          {/* Full Screen */}
          <button
            onClick={() => setIsExpandedPlayerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Full Screen
          </button>
        </div>
      </div>

      {/* Top Section: Live Visualizer & Interactive Waveform with Markers & Loops */}
      <div className="p-5 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Live Output Spectrum & Cue Timeline</span>
          </div>

          <div className="flex items-center gap-2">
            {currentTrack ? (
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-semibold truncate max-w-[180px] sm:max-w-xs">{currentTrack.title}</span>
                <span className="text-zinc-500 text-[11px] font-mono">({currentTrack.fileFormat})</span>
                {hasSongProfile && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    SONG PROFILE
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-zinc-500">No active track playing</span>
            )}
          </div>
        </div>

        {/* Audio Visualizer */}
        <AudioVisualizer
          mode={visualizerMode}
          onModeChange={setVisualizerMode}
          height={150}
          showControls={true}
        />

        {/* Waveform Scrubber in Studio with Markers & Loop Region */}
        {currentTrack && (
          <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
            <WaveformScrubber
              peaks={currentTrack.waveformPeaks}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              height={36}
              barWidth={2.5}
              barGap={1.5}
              activeColor="#22d3ee"
              inactiveColor="rgba(255, 255, 255, 0.15)"
              markers={markers}
              onMarkerClick={jumpToMarker}
              loopRegion={{
                pointA: loopAB.pointA,
                pointB: loopAB.pointB,
                enabled: loopAB.enabled,
              }}
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              {loopAB.enabled && loopAB.pointA !== null && loopAB.pointB !== null && (
                <span className="text-purple-400 font-semibold">
                  Loop: {formatTime(loopAB.pointA)} - {formatTime(loopAB.pointB)}
                </span>
              )}
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Studio Tabs & Control Surface */}
      <div className="flex flex-col gap-4">
        
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none">
          {STUDIO_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-600/25 text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="p-1 sm:p-2">
          {activeTab === 'soundlab' && (
            <QuickSoundControls />
          )}

          {activeTab === 'loop' && (
            <LoopABController />
          )}

          {activeTab === 'stereo' && (
            <StereoPhaseController />
          )}

          {activeTab === 'markers' && (
            <WaveformMarkersOverlay />
          )}

          {activeTab === 'moments' && (
            <AuraMomentsPanel />
          )}

          {activeTab === 'eq' && (
            <Equalizer10Band className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'dynamics' && (
            <DynamicsPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'spatial' && (
            <SpatialAudioPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'effects' && (
            <EffectsRackPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'channels' && (
            <ChannelMatrixPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'analysis' && (
            <AudioAnalysisPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'presets' && (
            <PresetsProfilesPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'stems' && (
            <StemsPlaceholderPanel className="animate-in fade-in duration-150" />
          )}
        </div>

      </div>

    </div>
  );
};
