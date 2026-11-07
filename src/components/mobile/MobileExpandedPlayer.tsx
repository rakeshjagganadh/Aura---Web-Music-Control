import React, { useState, useRef, useMemo } from 'react';
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
  Volume2,
  VolumeX,
  Gauge,
  Moon,
  Info,
  X,
  Trash2,
  ChevronUp
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
    queue,
    setQueue,
    queueIndex,
    playTrack,
    removeFromQueue,
    reorderQueue,
  } = useMusic();

  const {
    isInRoom,
    activeRoom,
    participants,
    isOwner,
    isLocallySilenced,
    roomTogglePlay,
    roomNext,
    roomPrev,
    roomSeek,
  } = useListenTogether();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isQueueSheetOpen, setIsQueueSheetOpen] = useState(false);

  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  // Up Next tracks list for mobile queue sheet
  const upNextTracks = useMemo(() => {
    if (queueIndex < 0 || queueIndex >= queue.length) return [];
    return queue.slice(queueIndex + 1);
  }, [queue, queueIndex]);

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

  const handleMoveTrack = (relativeIndex: number, direction: 'up' | 'down') => {
    const actualIndex = queueIndex + 1 + relativeIndex;
    const targetActualIndex = direction === 'up' ? actualIndex - 1 : actualIndex + 1;
    if (direction === 'up' && targetActualIndex <= queueIndex) return;
    if (direction === 'down' && targetActualIndex >= queue.length) return;
    reorderQueue(actualIndex, targetActualIndex);
  };

  const handleRemoveTrack = (relativeIndex: number) => {
    const actualIndex = queueIndex + 1 + relativeIndex;
    removeFromQueue(actualIndex);
    showToast('Removed from queue', 'info');
  };

  const handleClearUpcoming = () => {
    if (upNextTracks.length === 0) return;
    setQueue((prev) => prev.slice(0, queueIndex + 1));
    showToast('Upcoming queue cleared', 'info');
  };

  const handleShuffleUpcoming = () => {
    if (upNextTracks.length <= 1) return;
    setQueue((prev) => {
      const preserved = prev.slice(0, queueIndex + 1);
      const upcoming = [...prev.slice(queueIndex + 1)];
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      return [...preserved, ...upcoming];
    });
    showToast('Upcoming queue shuffled', 'info');
  };

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

    // Swipe down to dismiss (only if not inside queue sheet)
    if (!isQueueSheetOpen && deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsExpandedPlayerOpen(false);
    }
    // Swipe left for next track
    else if (!isQueueSheetOpen && deltaX < -80 && Math.abs(deltaX) > Math.abs(deltaY)) {
      nextTrack();
    }
    // Swipe right for previous track
    else if (!isQueueSheetOpen && deltaX > 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
      prevTrack();
    }
  };

  const getSourceBadge = () => {
    switch (currentTrack.source) {
      case 'local':
        return { label: 'Local Audio', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'audius':
        return { label: 'Audius', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'jamendo':
        return { label: 'Jamendo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'youtube':
        return { label: 'YouTube', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
      case 'radio':
      case 'radiobrowser':
        return { label: 'Live Radio', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      default:
        return { label: 'AURA', color: 'text-zinc-400 bg-white/5 border-white/10' };
    }
  };

  const sourceBadge = getSourceBadge();

  return (
    <div
      id="mobile-expanded-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="lg:hidden fixed inset-0 z-50 bg-[#07090e] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 overflow-hidden pb-safe pt-safe select-none animate-in slide-in-from-bottom duration-200"
    >
      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION
          ------------------------------------------------------------- */}
      <div className="flex items-center justify-between w-full shrink-0">
        {/* Minimize Button */}
        <button
          type="button"
          onClick={() => setIsExpandedPlayerOpen(false)}
          className="p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors cursor-pointer"
          title="Minimize Player"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Center Title & Source Badge */}
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
              {participants.length} listening • {isOwner ? 'Host' : 'Guest'}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${sourceBadge.color}`}>
              {sourceBadge.label}
            </span>
            {currentTrack.genre && (
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                {currentTrack.genre}
              </span>
            )}
          </div>
        )}

        {/* Audio Studio Trigger / Active DSP Pill */}
        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
            isAudioEffectActive
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
              : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
          }`}
          title="Audio DSP Studio"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase">{eqPreset !== 'flat' ? eqPreset : 'DSP'}</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          MAIN BODY: ARTWORK & TRACK IDENTITY
          ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 my-auto py-3 w-full max-w-sm mx-auto overflow-hidden">
        
        {/* Prominent Center Artwork */}
        <div className="relative group shrink-0 w-64 h-64 sm:w-72 sm:h-72 max-w-[76vw] max-h-[36vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#10121a] flex items-center justify-center transition-all">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-[1.02]' : 'scale-100'
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-zinc-800 to-zinc-950'} flex flex-col items-center justify-center p-6 text-white`}>
              <Music className="w-16 h-16 opacity-40 mb-2" />
              <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                AURA MUSIC
              </span>
            </div>
          )}
        </div>

        {/* Track Title, Artist, and Favorite Row */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate leading-tight font-display">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-semibold text-zinc-300 truncate mt-0.5">
                {currentTrack.artist}
              </p>
              {currentTrack.album && currentTrack.album !== 'YouTube Stream' && currentTrack.album !== 'Audius Stream' && (
                <p className="text-xs text-zinc-500 font-mono truncate mt-0.5">
                  {currentTrack.album}
                </p>
              )}
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

          {/* Interactive Waveform Scrubber with Timestamps */}
          <div className="w-full flex flex-col gap-1.5 pt-1">
            <WaveformScrubber
              peaks={currentTrack.waveformPeaks}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              onSeekingChange={setIsSeeking}
              height={38}
              barWidth={2.5}
              barGap={1.5}
              activeColor="#ffffff"
              inactiveColor="rgba(255, 255, 255, 0.12)"
              showHoverTime={false}
            />

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-0.5">
              <span className="text-white font-medium">{formatTime(currentTime)}</span>
              {isInRoom && !isOwner && (
                <span className="text-[10px] text-zinc-500 font-sans">Host seeks</span>
              )}
              <span className="text-zinc-500">
                -{formatTime(Math.max(0, duration - currentTime))}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------
          BOTTOM PLAYBACK CONTROLS & SECONDARY TOOLBAR
          ------------------------------------------------------------- */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4 shrink-0">
        
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
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Large Main Play/Pause Button (64px thumb-friendly target) */}
          <button
            type="button"
            onClick={isInRoom ? roomTogglePlay : togglePlay}
            className="w-16 h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl active:scale-90 transition-all cursor-pointer shrink-0"
            title={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
          >
            {isPlaying && !isLocallySilenced ? (
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
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Forward 10s */}
          <button
            type="button"
            onClick={() => handleSeekRelative(10)}
            className="p-3 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer"
            title="Forward 10s"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* Repeat */}
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

        {/* Secondary Quick Action Bar */}
        <div className="flex items-center justify-between gap-1 p-2 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          
          {/* Volume Control Toggle & Popup */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="flex items-center gap-1.5 p-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Volume Slider"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span className="text-[11px] font-mono">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </button>

            {showVolumeSlider && (
              <div className="absolute bottom-full mb-3 left-0 p-3 rounded-2xl bg-[#141722] border border-white/10 shadow-2xl flex items-center gap-2 z-50 w-44">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>
            )}
          </div>

          {/* Playback Speed Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.06] text-zinc-300 text-xs font-mono font-medium hover:bg-white/10 transition-colors cursor-pointer border border-white/[0.06]"
            >
              <Gauge className="w-3.5 h-3.5 text-zinc-400" />
              <span>{playbackRate}×</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-1.5 rounded-2xl bg-[#141722] border border-white/10 shadow-2xl flex flex-col gap-1 z-50 min-w-[80px]">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono text-center rounded-lg transition-colors cursor-pointer ${
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

          {/* Sleep Timer */}
          <button
            type="button"
            onClick={() => setIsSleepTimerModalOpen(true)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
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
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Track Info"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Dedicated Up Next Queue Sheet Button */}
          <button
            type="button"
            onClick={() => setIsQueueSheetOpen(true)}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 active:bg-white/10 transition-colors cursor-pointer"
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            {upNextTracks.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>

        </div>

      </div>

      {/* -------------------------------------------------------------
          DEDICATED MOBILE UP NEXT QUEUE SHEET / MODAL
          ------------------------------------------------------------- */}
      {isQueueSheetOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xl flex flex-col justify-end animate-in fade-in duration-150">
          <div className="w-full max-h-[82vh] rounded-t-3xl bg-[#0c0e15] border-t border-white/10 p-4 sm:p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-1 rounded-full bg-white/20" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white font-display">
                    Up Next Queue
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                    {upNextTracks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {upNextTracks.length > 1 && (
                    <button
                      onClick={handleShuffleUpcoming}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Shuffle upcoming"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {upNextTracks.length > 0 && (
                    <button
                      onClick={handleClearUpcoming}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                      title="Clear upcoming"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setIsQueueSheetOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pinned Currently Playing Track */}
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Music className="w-4 h-4" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Playing Now
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Upcoming Tracks Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 max-h-[50vh] pr-1">
              {upNextTracks.length > 0 ? (
                upNextTracks.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5 transition-all"
                  >
                    <div 
                      onClick={() => {
                        playTrack(track);
                        setIsQueueSheetOpen(false);
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/5 relative">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <Music className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          onClick={() => handleMoveTrack(idx, 'up')}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {idx < upNextTracks.length - 1 && (
                        <button
                          onClick={() => handleMoveTrack(idx, 'down')}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveTrack(idx)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <ListMusic className="w-8 h-8 opacity-40 mb-1" />
                  <p className="text-xs font-medium text-zinc-400">Queue is empty</p>
                  <p className="text-[11px] text-zinc-600 max-w-[200px]">
                    Add tracks from your library or universal search.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Done Button */}
            <button
              onClick={() => setIsQueueSheetOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold transition-colors mt-1"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
