import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { WaveformScrubber } from '../waveform/WaveformScrubber';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { EqualizerPanel } from '../audio-controls/EqualizerPanel';
import { EffectsPanel } from '../audio-controls/EffectsPanel';
import { StemsPlaceholderPanel } from '../audio-controls/StemsPlaceholderPanel';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  SlidersHorizontal, 
  Sparkles, 
  Layers, 
  Activity, 
  Music,
  Share2,
  Info,
  Moon
} from 'lucide-react';

import { MobileExpandedPlayer } from '../mobile/MobileExpandedPlayer';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isShuffle,
    repeatMode,
    isExpandedPlayerOpen,
    setIsExpandedPlayerOpen,
    isSleepTimerActive,
    sleepTimerRemainingSecs,
    setIsSleepTimerModalOpen,
    openTrackInfo,
    togglePlay,
    seek,
    seekRelative,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    visualizerMode,
    setVisualizerMode,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'visualizer' | 'eq' | 'effects' | 'stems'>('visualizer');

  if (!isExpandedPlayerOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Mobile Dedicated Expanded Player */}
      <MobileExpandedPlayer />

      {/* Desktop Expanded Studio Player (100% preserved) */}
      <div
        id="expanded-player-modal"
        className="hidden lg:flex fixed inset-0 z-50 bg-[#090a0d]/95 backdrop-blur-3xl overflow-y-auto flex-col justify-between p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
      >
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#818cf8]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Aura Audio Studio
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 font-mono">
            {currentTrack.fileFormat} • {formatBytes(currentTrack.fileSize)}
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/5">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'visualizer'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Visualizer
          </button>
          <button
            onClick={() => setActiveTab('eq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'eq'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Equalizer
          </button>
          <button
            onClick={() => setActiveTab('effects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'effects'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Effects
          </button>
          <button
            onClick={() => setActiveTab('stems')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'stems'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Stems
          </button>
        </div>

        {/* Top Right Action Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => currentTrack && openTrackInfo(currentTrack)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 transition-colors cursor-pointer"
            title="Track Info & Metadata (I)"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSleepTimerModalOpen(true)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isSleepTimerActive
                ? 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border-white/5'
            }`}
            title={isSleepTimerActive ? `Sleep Timer Active (${sleepTimerRemainingSecs ? Math.ceil(sleepTimerRemainingSecs/60) + 'm left' : 'End of track'})` : 'Set Sleep Timer'}
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={() => setIsExpandedPlayerOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 transition-colors cursor-pointer"
            title="Minimize Player (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Artwork & Core Metadata */}
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          <div className="relative group w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 flex items-center justify-center">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-indigo-600 to-zinc-900'} flex flex-col items-center justify-center p-6 text-white`}>
                <Music className="w-20 h-20 opacity-40 mb-3" />
                <span className="text-xs font-mono tracking-wider opacity-60">AURA AUDIO</span>
              </div>
            )}

            {/* Glowing active ambient ring */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500/30 animate-pulse pointer-events-none" />
            )}
          </div>

          <div className="mt-6 flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {currentTrack.title}
            </h2>
            <p className="text-sm font-medium text-zinc-400 mt-1">
              {currentTrack.artist} • <span className="text-zinc-500">{currentTrack.album}</span>
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Tab Content (Visualizer / EQ / FX / Stems) */}
        <div className="lg:col-span-7 flex flex-col justify-center min-h-[340px]">
          {activeTab === 'visualizer' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Real-time Audio Spectrum
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  Mode: {visualizerMode.toUpperCase()}
                </span>
              </div>
              <AudioVisualizer
                mode={visualizerMode}
                onModeChange={setVisualizerMode}
                height={260}
                showControls={true}
              />
            </div>
          )}

          {activeTab === 'eq' && (
            <EqualizerPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'effects' && (
            <EffectsPanel className="animate-in fade-in duration-150" />
          )}

          {activeTab === 'stems' && (
            <StemsPlaceholderPanel className="animate-in fade-in duration-150" />
          )}
        </div>

      </div>

      {/* Bottom Timeline & Extended Player Controls */}
      <div className="w-full max-w-4xl mx-auto pt-6 border-t border-white/5 flex flex-col gap-4">
        
        {/* Full-width Waveform Scrubber */}
        <div className="flex flex-col gap-1.5">
          <WaveformScrubber
            peaks={currentTrack.waveformPeaks}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            height={44}
            barWidth={3}
            barGap={2}
            activeColor="#818cf8"
            inactiveColor="rgba(255, 255, 255, 0.15)"
          />

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[11px] text-zinc-600">Drag or click waveform to scrub</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Master Control Bar */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Favorite & Speed */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Favorite"
            >
              <Heart
                className={`w-5 h-5 ${currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>

            {/* Speed pills */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-zinc-900/60 border border-white/5">
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-lg transition-colors ${
                    Math.abs(playbackRate - rate) < 0.01
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          {/* Center: Play/Pause/Prev/Next/Shuffle/Repeat */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-xl transition-colors ${
                isShuffle ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="p-2 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              className="p-2 text-zinc-300 hover:text-white rounded-xl transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              className="p-4 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all shadow-xl shadow-white/10"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-2 text-zinc-300 hover:text-white rounded-xl transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-2 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-xl transition-colors ${
                repeatMode !== 'off' ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Master Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 text-zinc-400 hover:text-zinc-200"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <div className="w-24 hidden sm:block">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
};
