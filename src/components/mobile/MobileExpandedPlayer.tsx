import React, { useState, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { WaveformScrubber } from '../waveform/WaveformScrubber';
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  RotateCcw, 
  RotateCw,
  SlidersHorizontal, 
  ListMusic, 
  Music,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Sparkles,
  Gauge,
  Moon,
  Info
} from 'lucide-react';

export const MobileExpandedPlayer: React.FC = () => {
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
    setIsAudioControlsOpen,
    setIsQueueDrawerOpen,
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
    eqPreset,
    effects,
    bass,
    treble,
  } = useMusic();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  if (!isExpandedPlayerOpen || !currentTrack) return null;

  const isAudioEffectActive = 
    eqPreset !== 'flat' || 
    Boolean(effects?.reverb?.enabled) || 
    Boolean(effects?.echo?.enabled) || 
    Boolean(effects?.saturation?.enabled) || 
    (effects?.bassBoost ?? 0) > 0 || 
    (effects?.trebleBoost ?? 0) > 0 || 
    bass !== 0 || 
    treble !== 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Swipe down to dismiss
    if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsExpandedPlayerOpen(false);
    }
    // Swipe left for next track
    else if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY)) {
      nextTrack();
    }
    // Swipe right for previous track
    else if (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY)) {
      prevTrack();
    }
  };

  return (
    <div
      id="mobile-expanded-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="lg:hidden fixed inset-0 z-50 bg-[#08090d]/98 backdrop-blur-3xl text-zinc-100 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto pb-safe pt-safe select-none animate-in slide-in-from-bottom duration-300"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between w-full shrink-0">
        
        {/* Minimize Button */}
        <button
          type="button"
          onClick={() => setIsExpandedPlayerOpen(false)}
          className="p-2.5 -ml-2 rounded-2xl text-zinc-400 hover:text-white active:bg-zinc-800 transition-colors cursor-pointer"
          title="Minimize Player"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Center Title / Format Badge */}
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            Playing From Library
          </span>
          <span className="text-[11px] font-semibold text-zinc-200 truncate max-w-[180px]">
            {currentTrack.album || 'Aura Audio'}
          </span>
        </div>

        {/* Audio Studio Trigger / Active EQ Pill */}
        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
            isAudioEffectActive
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
              : 'bg-zinc-900/80 text-zinc-400 border-white/10'
          }`}
          title="Audio DSP Studio"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase">{eqPreset !== 'flat' ? eqPreset : 'DSP'}</span>
        </button>
      </div>

      {/* Main Player Body (Portrait & Landscape responsive) */}
      <div className="flex-1 flex flex-col landscape:flex-row items-center justify-center gap-6 my-auto py-2 w-full max-w-lg mx-auto">
        
        {/* Album Artwork */}
        <div className="relative group shrink-0 w-60 h-60 sm:w-72 sm:h-72 landscape:w-44 landscape:h-44 max-w-[70vw] max-h-[36vh] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 bg-zinc-900 flex items-center justify-center transition-transform">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-indigo-600 to-zinc-900'} flex flex-col items-center justify-center p-6 text-white`}>
              <Music className="w-16 h-16 opacity-50 mb-2" />
              <span className="text-[10px] font-mono tracking-widest opacity-60">AURA MUSIC</span>
            </div>
          )}

          {/* Active glow ring */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500/30 animate-pulse pointer-events-none" />
          )}
        </div>

        {/* Track Title, Artist, Favorite & Landscape controls container */}
        <div className="w-full flex flex-col gap-4">
          
          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate leading-tight">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-zinc-400 truncate mt-1">
                {currentTrack.artist}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-3 rounded-2xl text-zinc-400 hover:text-rose-400 active:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
              title="Favorite Track"
            >
              <Heart className={`w-6 h-6 transition-transform active:scale-125 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`} />
            </button>
          </div>

          {/* Waveform Scrubber with Timestamps */}
          <div className="w-full flex flex-col gap-1.5 pt-1">
            <WaveformScrubber
              peaks={currentTrack.waveformPeaks}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              height={36}
              barWidth={2.5}
              barGap={1.5}
              activeColor="#818cf8"
              inactiveColor="rgba(255, 255, 255, 0.15)"
              showHoverTime={false}
            />

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span className="text-[10px] text-zinc-500">
                {formatTime(Math.max(0, duration - currentTime))} left
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Playback Controls & Quick Studio Tools */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-4 shrink-0">
        
        {/* Main Controls Row (Thumb-Friendly Touch Targets) */}
        <div className="flex items-center justify-between gap-1 px-1">
          
          {/* Shuffle */}
          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-3 rounded-2xl transition-colors cursor-pointer ${
              isShuffle ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Rewind 10s */}
          <button
            type="button"
            onClick={() => seekRelative(-10)}
            className="p-3 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
            title="Rewind 10s"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            type="button"
            onClick={prevTrack}
            className="p-3 text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Large Main Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl shadow-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            type="button"
            onClick={nextTrack}
            className="p-3 text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Fast Forward 10s */}
          <button
            type="button"
            onClick={() => seekRelative(10)}
            className="p-3 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
            title="Forward 10s"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* Repeat Mode */}
          <button
            type="button"
            onClick={cycleRepeat}
            className={`p-3 rounded-2xl transition-colors cursor-pointer ${
              repeatMode !== 'off' ? 'text-indigo-400 bg-indigo-500/15' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>

        </div>

        {/* Secondary Quick Action Bar: Volume, Speed, Queue, Audio Studio */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-md">
          
          {/* Volume Control Toggle */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="flex items-center gap-1.5 p-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Volume"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span className="text-[11px] font-mono">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </button>

            {showVolumeSlider && (
              <div className="absolute bottom-full mb-2 left-0 p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex items-center gap-2 z-50 w-44">
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
            )}
          </div>

          {/* Playback Speed */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 text-zinc-300 text-xs font-mono font-medium hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              <span>{playbackRate}×</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-1.5 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl flex flex-col gap-1 z-50 min-w-[80px]">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono text-center rounded-lg transition-colors cursor-pointer ${
                      Math.abs(playbackRate - rate) < 0.01
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Audio Studio Sheet Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsAudioControlsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Audio Studio</span>
          </button>

          {/* Sleep Timer */}
          <button
            type="button"
            onClick={() => setIsSleepTimerModalOpen(true)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isSleepTimerActive ? 'text-indigo-300 bg-indigo-500/20' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Track Info */}
          <button
            type="button"
            onClick={() => openTrackInfo(currentTrack)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Track Info"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Up Next Queue */}
          <button
            type="button"
            onClick={() => setIsQueueDrawerOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
};
