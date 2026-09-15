import React, { useState, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
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
    isSeeking,
    setIsSeeking,
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
    showToast,
    setCurrentView,
  } = useMusic();

  const {
    isInRoom,
    activeRoom,
    participants,
    isOwner,
    isLocallySilenced,
    togglePersonalSilence,
    roomTogglePlay,
    roomNext,
    roomPrev,
    roomSeek,
  } = useListenTogether();

  const handleSeek = (pos: number) => {
    if (isInRoom) {
      if (!isOwner) {
        showToast('Only the host can seek the track.', 'info');
        return;
      }
      roomSeek(pos);
      return;
    }
    seek(pos);
  };

  const handleSeekRelative = (delta: number) => {
    if (isInRoom) {
      if (!isOwner) {
        showToast('Only the host can seek backward or forward.', 'info');
        return;
      }
      roomSeek(currentTime + delta);
      return;
    }
    seekRelative(delta);
  };

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
      className="lg:hidden fixed inset-0 z-50 bg-[#0a0c12] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto pb-safe pt-safe select-none animate-in slide-in-from-bottom duration-200"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between w-full shrink-0">
        
        {/* Minimize Button */}
        <button
          type="button"
          onClick={() => setIsExpandedPlayerOpen(false)}
          className="p-2.5 -ml-2 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors cursor-pointer"
          title="Minimize Player"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Center Title / Format Badge */}
        {isInRoom && activeRoom ? (
          <button
            type="button"
            onClick={() => {
              setIsExpandedPlayerOpen(false);
              setCurrentView('listen-together');
            }}
            className="flex flex-col items-center text-center cursor-pointer active:opacity-80"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Room: {activeRoom.roomName}
            </span>
            <span className="text-[11px] font-semibold text-zinc-300 truncate max-w-[180px]">
              {participants.length} listening • {isOwner ? 'You are Host' : `Host: ${activeRoom.ownerName}`}
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              Playing From Library
            </span>
            <span className="text-[11px] font-semibold text-zinc-200 truncate max-w-[180px]">
              {currentTrack.album || 'Aura Audio'}
            </span>
          </div>
        )}

        {/* Audio Studio Trigger / Active EQ Pill */}
        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all cursor-pointer ${
            isAudioEffectActive
              ? 'bg-white/10 text-white border-white/20'
              : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
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
        <div className="relative group shrink-0 w-60 h-60 sm:w-72 sm:h-72 landscape:w-44 landscape:h-44 max-w-[70vw] max-h-[36vh] rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-[#12141c] flex items-center justify-center transition-transform">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-[1.02]' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-zinc-800 to-zinc-950'} flex flex-col items-center justify-center p-6 text-white`}>
              <Music className="w-16 h-16 opacity-40 mb-2" />
              <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">AURA MUSIC</span>
            </div>
          )}
        </div>

        {/* Track Title, Artist, Favorite & Landscape controls container */}
        <div className="w-full flex flex-col gap-4">
          
          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate leading-tight font-display">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-zinc-400 truncate mt-1">
                {currentTrack.artist}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 active:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Favorite Track"
            >
              <Heart className={`w-5 h-5 transition-transform active:scale-125 ${
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
              onSeek={handleSeek}
              onSeekingChange={setIsSeeking}
              height={36}
              barWidth={2.5}
              barGap={1.5}
              activeColor="#ffffff"
              inactiveColor="rgba(255, 255, 255, 0.12)"
              showHoverTime={false}
            />

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-0.5">
              <span>{formatTime(currentTime)}</span>
              {isInRoom && !isOwner && (
                <span className="text-[10px] text-zinc-500 font-sans">Host seeks</span>
              )}
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
            className={`p-3 rounded-xl transition-colors cursor-pointer ${
              isShuffle ? 'text-white bg-white/10 border border-white/15' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Rewind 10s */}
          <button
            type="button"
            onClick={() => handleSeekRelative(-10)}
            className="p-3 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
            title="Rewind 10s"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            type="button"
            onClick={isInRoom ? roomPrev : prevTrack}
            className="p-3 text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Large Main Play/Pause Button - Shared for everyone */}
          <button
            type="button"
            onClick={isInRoom ? roomTogglePlay : togglePlay}
            className="w-16 h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer shrink-0"
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
            onClick={isInRoom ? roomNext : nextTrack}
            className="p-3 text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Fast Forward 10s */}
          <button
            type="button"
            onClick={() => handleSeekRelative(10)}
            className="p-3 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
            title="Forward 10s"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* Repeat Mode */}
          <button
            type="button"
            onClick={cycleRepeat}
            className={`p-3 rounded-xl transition-colors cursor-pointer ${
              repeatMode !== 'off' ? 'text-white bg-white/10 border border-white/15' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>

        </div>

        {/* Secondary Quick Action Bar: Volume, Speed, Queue, Audio Studio */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          
          {/* Volume Control Toggle */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="flex items-center gap-1.5 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
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
              <div className="absolute bottom-full mb-2 left-0 p-3 rounded-xl bg-[#141720] border border-white/10 shadow-2xl flex items-center gap-2 z-50 w-44">
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-zinc-300 text-xs font-mono font-medium hover:bg-white/10 transition-colors cursor-pointer border border-white/[0.06]"
            >
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              <span>{playbackRate}×</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-1.5 rounded-xl bg-[#141720] border border-white/10 shadow-2xl flex flex-col gap-1 z-50 min-w-[80px]">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono text-center rounded-md transition-colors cursor-pointer ${
                      Math.abs(playbackRate - rate) < 0.01
                        ? 'bg-white text-zinc-950 font-bold'
                        : 'text-zinc-300 hover:bg-white/5'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          {/* Sleep Timer */}
          <button
            type="button"
            onClick={() => setIsSleepTimerModalOpen(true)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSleepTimerActive ? 'text-white bg-white/15' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
          </button>

          {/* Track Info */}
          <button
            type="button"
            onClick={() => openTrackInfo(currentTrack)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Track Info"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Up Next Queue */}
          <button
            type="button"
            onClick={() => setIsQueueDrawerOpen(true)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
};
