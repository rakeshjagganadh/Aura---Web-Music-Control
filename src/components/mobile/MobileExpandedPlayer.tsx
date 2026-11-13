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
  SlidersHorizontal,
  ListMusic,
  Music,
  Volume2,
  Volume1,
  VolumeX,
  Gauge,
  Moon,
  Info,
  X,
  Trash2,
  ChevronUp,
} from 'lucide-react';

export const MobileExpandedPlayer: React.FC = () => {
  const {
    currentTrack,
    isDirectStreamActive,
    isPlaying,
    currentTime,
    duration,
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
    markers,
    jumpToMarker,
    loopAB,
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

  const [activeTray, setActiveTray] = useState<'none' | 'volume' | 'speed'>('none');
  const [showRemainingTime, setShowRemainingTime] = useState(true);
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
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
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

    if (!isQueueSheetOpen && deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsExpandedPlayerOpen(false);
    } else if (!isQueueSheetOpen && deltaX < -85 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (isInRoom) roomNext();
      else nextTrack();
    } else if (!isQueueSheetOpen && deltaX > 85 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (isInRoom) roomPrev();
      else prevTrack();
    }
  };

  const isRadio = currentTrack.source === 'radio' || currentTrack.source === 'radiobrowser';
  const hasValidDuration = !isRadio && Number.isFinite(duration) && duration > 0;
  const remainingSecs = Math.max(0, duration - currentTime);
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);

  const getSourceLabel = () => {
    switch (currentTrack.source) {
      case 'local':
        return 'Local Audio';
      case 'audius':
        return 'Audius';
      case 'jamendo':
        return 'Jamendo';
      case 'youtube':
        return isDirectStreamActive ? 'YouTube Direct' : 'YouTube';
      case 'radio':
      case 'radiobrowser':
        return 'Live Radio';
      default:
        return 'AURA';
    }
  };

  const rightTimestamp = isRadio
    ? 'LIVE'
    : !hasValidDuration
      ? '--:--'
      : showRemainingTime
        ? `-${formatTime(remainingSecs)}`
        : formatTime(duration);

  return (
    <div
      id="mobile-expanded-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="lg:hidden fixed inset-0 z-50 bg-[#07090e] text-zinc-100 flex flex-col justify-between px-4 sm:px-6 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-[calc(16px+env(safe-area-inset-bottom,0px))] overflow-hidden select-none animate-in slide-in-from-bottom duration-200"
    >
      {/* Artwork-derived Ambient Light Wash */}
      {currentTrack.coverUrl && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <img
            src={currentTrack.coverUrl}
            alt=""
            className="w-full h-full object-cover blur-[88px] opacity-40 scale-150 brightness-90 saturate-140"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/65 to-[#07090e]/75" />
        </div>
      )}

      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION
          ------------------------------------------------------------- */}
      <div className="flex items-center justify-between w-full max-w-sm mx-auto shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setIsExpandedPlayerOpen(false)}
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer aura-focus-ring"
          title="Minimize Player"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {isInRoom && activeRoom ? (
          <button
            type="button"
            onClick={() => {
              setIsExpandedPlayerOpen(false);
              setCurrentView('listen-together');
            }}
            className="flex flex-col items-center text-center cursor-pointer active:opacity-80 min-w-0"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[160px]">{activeRoom.roomName}</span>
            </span>
            <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[180px]">
              {participants.length} listening · {isOwner ? 'Host' : 'Guest'}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 min-w-0">
            <span className="uppercase tracking-wider truncate">{getSourceLabel()}</span>
            {currentTrack.genre && (
              <>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="truncate max-w-[110px] text-zinc-500">{currentTrack.genre}</span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          aria-label="Audio DSP Studio"
          className={`h-9 px-3 rounded-full border text-[11px] font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 aura-focus-ring ${
            isAudioEffectActive
              ? 'bg-sky-500/15 text-sky-300 border-sky-400/35'
              : 'bg-white/[0.06] text-zinc-300 border-white/[0.1] hover:bg-white/[0.1]'
          }`}
          title="Audio DSP Studio"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="uppercase">{eqPreset !== 'flat' ? eqPreset : 'DSP'}</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          MAIN BODY: PROPORTIONAL ARTWORK + TRACK IDENTITY + INTEGRATED TIMELINE
          ------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-evenly w-full max-w-sm mx-auto gap-3 py-2">
        {/* Balanced Square Artwork (Scales cleanly for both 640px short and 932px tall screens) */}
        <div className="relative shrink-0 flex items-center justify-center">
          {currentTrack.coverUrl && (
            <div
              className="absolute -inset-3 rounded-3xl opacity-35 blur-2xl -z-10 pointer-events-none"
              style={{
                backgroundImage: `url(${currentTrack.coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="relative w-[min(68vw,32dvh)] h-[min(68vw,32dvh)] max-w-[296px] max-h-[296px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/[0.14] bg-[#0d1017] flex items-center justify-center">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-[1.02]' : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${
                  currentTrack.coverColor || 'from-[#141a29] to-[#080b12]'
                } flex flex-col items-center justify-center p-6 text-white`}
              >
                <Music className="w-14 h-14 opacity-40 mb-2" />
                <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                  AURA
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Track Identity & Integrated Timeline Group */}
        <div className="w-full flex flex-col gap-3 shrink-0">
          {/* Title, Artist & Accessible Favorite Action */}
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <h2
                className="text-lg sm:text-xl font-page-title text-white tracking-tight leading-snug line-clamp-2"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </h2>
              <p className="text-sm font-artist-name text-zinc-300 truncate mt-0.5" title={currentTrack.artist}>
                {currentTrack.artist}
              </p>
              {currentTrack.album &&
                currentTrack.album !== 'YouTube Stream' &&
                currentTrack.album !== 'Audius Stream' && (
                  <p className="text-xs text-zinc-400/80 font-ui-meta truncate mt-0.5 max-[680px]:hidden">
                    {currentTrack.album}
                  </p>
                )}
            </div>

            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={Boolean(currentTrack.isFavorite)}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0 aura-focus-ring ${
                currentTrack.isFavorite
                  ? 'bg-rose-500/12 text-rose-500'
                  : 'bg-white/[0.06] text-zinc-300 hover:text-white'
              }`}
              title={currentTrack.isFavorite ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
          </div>

          {/* Integrated Playback Timeline (Stops swipe-to-skip propagation while scrubbing) */}
          <div
            className="w-full flex flex-col gap-1"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {isRadio ? (
              <div className="w-full h-9 flex items-center gap-2.5">
                <div className="flex-1 h-1 rounded-full bg-emerald-500/25 overflow-hidden">
                  <div className="h-full w-full bg-emerald-400/70" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 shrink-0">
                  Live Stream
                </span>
              </div>
            ) : (
              <WaveformScrubber
                peaks={currentTrack.waveformPeaks}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                onSeekingChange={setIsSeeking}
                disabled={isInRoom && !isOwner}
                isRadio={isRadio}
                isLoadingDuration={!hasValidDuration && isPlaying}
                variant="auto"
                height={38}
                barWidth={2.5}
                barGap={1.5}
                activeColor="#ffffff"
                inactiveColor="rgba(255, 255, 255, 0.16)"
                showHoverTime={false}
                markers={markers}
                onMarkerClick={jumpToMarker}
                loopRegion={{
                  pointA: loopAB.pointA,
                  pointB: loopAB.pointB,
                  enabled: loopAB.enabled,
                }}
              />
            )}

            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-400">
              <span className="text-zinc-200 font-medium">
                {isRadio ? 'LIVE' : formatTime(currentTime)}
              </span>

              {isInRoom && !isOwner ? (
                <span className="text-[10px] text-zinc-400 font-sans">Host controls seek</span>
              ) : !isRadio && !hasValidDuration ? (
                <span className="text-[10px] text-zinc-400 font-sans">
                  {isPlaying ? 'Loading track duration…' : 'Duration unavailable'}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => hasValidDuration && setShowRemainingTime((v) => !v)}
                disabled={!hasValidDuration}
                className={`text-[11px] font-mono tabular-nums transition-colors ${
                  hasValidDuration
                    ? 'text-zinc-400 hover:text-zinc-200 cursor-pointer'
                    : 'text-zinc-500 cursor-default'
                }`}
              >
                {rightTimestamp}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          BOTTOM TRANSPORT & REFINED SECONDARY CONTROLS
          ------------------------------------------------------------- */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3 shrink-0">
        {/* 5-Button Balanced Transport Row: Shuffle · Prev · Play/Pause · Next · Repeat */}
        <div className="flex items-center justify-between w-full px-1">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={`Shuffle ${isShuffle ? 'On' : 'Off'}`}
            aria-pressed={isShuffle}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer aura-focus-ring ${
              isShuffle ? 'text-sky-300 bg-white/[0.08]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-4.5 h-4.5" />
            {isShuffle && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-sky-300" />}
          </button>

          <button
            type="button"
            onClick={isInRoom ? roomPrev : prevTrack}
            aria-label="Previous Track"
            className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer aura-focus-ring"
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={isInRoom ? roomTogglePlay : togglePlay}
            aria-label={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
            className="w-15 h-15 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-[0_6px_24px_rgba(0,0,0,0.45)] active:scale-92 transition-all cursor-pointer shrink-0 aura-focus-ring"
            title={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
          >
            {isPlaying && !isLocallySilenced ? (
              <Pause className="w-6.5 h-6.5 fill-current text-zinc-950" />
            ) : (
              <Play className="w-6.5 h-6.5 fill-current text-zinc-950 translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={isInRoom ? roomNext : nextTrack}
            aria-label="Next Track"
            className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-200 hover:text-white active:scale-95 transition-all cursor-pointer aura-focus-ring"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={`Repeat ${repeatMode}`}
            aria-pressed={repeatMode !== 'off'}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer aura-focus-ring ${
              repeatMode !== 'off' ? 'text-sky-300 bg-white/[0.08]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4.5 h-4.5" />
            ) : (
              <Repeat className="w-4.5 h-4.5" />
            )}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-sky-300" />
            )}
          </button>
        </div>

        {/* Inline Expandable Tray for Volume or Speed (Never clips at 320px) */}
        {activeTray === 'volume' && (
          <div
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.07] border border-white/[0.1] backdrop-blur-xl flex items-center gap-3 animate-in fade-in duration-150"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-zinc-300 hover:text-white shrink-0 cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectiveVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.9) ${volumePercent}%, rgba(255,255,255,0.16) ${volumePercent}%)`,
                height: '4px',
                borderRadius: '9999px',
              }}
              aria-label="Volume slider"
              className="flex-1"
            />
            <span className="text-[11px] font-mono tabular-nums text-zinc-300 w-9 text-right shrink-0">
              {volumePercent}%
            </span>
          </div>
        )}

        {activeTray === 'speed' && (
          <div className="w-full p-1.5 rounded-2xl bg-white/[0.07] border border-white/[0.1] backdrop-blur-xl grid grid-cols-4 gap-1 animate-in fade-in duration-150">
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setPlaybackRate(rate);
                  setActiveTray('none');
                }}
                className={`py-2 text-xs font-mono rounded-xl transition-colors cursor-pointer ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'bg-white text-zinc-950 font-bold'
                    : 'text-zinc-300 hover:bg-white/[0.08]'
                }`}
              >
                {rate}×
              </button>
            ))}
          </div>
        )}

        {/* Calm Secondary Action Row */}
        <div className="flex items-center justify-between w-full px-1 pt-0.5">
          {/* Volume */}
          <button
            type="button"
            onClick={() => setActiveTray((t) => (t === 'volume' ? 'none' : 'volume'))}
            aria-label="Toggle Volume Control"
            aria-expanded={activeTray === 'volume'}
            className={`h-10 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer aura-focus-ring ${
              activeTray === 'volume'
                ? 'bg-white/[0.12] text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Volume"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span className="tabular-nums text-[11px]">{volumePercent}%</span>
          </button>

          {/* Playback Speed */}
          <button
            type="button"
            onClick={() => setActiveTray((t) => (t === 'speed' ? 'none' : 'speed'))}
            aria-label="Playback Speed"
            aria-expanded={activeTray === 'speed'}
            className={`h-10 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer aura-focus-ring ${
              activeTray === 'speed' || Math.abs(playbackRate - 1.0) > 0.01
                ? 'bg-white/[0.12] text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Playback Speed"
          >
            <Gauge className="w-4 h-4" />
            <span className="tabular-nums text-[11px]">{playbackRate}×</span>
          </button>

          {/* Sleep Timer */}
          <button
            type="button"
            onClick={() => setIsSleepTimerModalOpen(true)}
            aria-label="Sleep Timer"
            className={`relative h-10 px-2.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer aura-focus-ring ${
              isSleepTimerActive
                ? 'bg-white/[0.12] text-purple-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
            {isSleepTimerActive && sleepTimerRemainingSecs ? (
              <span className="text-[10px] font-mono tabular-nums">
                {Math.ceil(sleepTimerRemainingSecs / 60)}m
              </span>
            ) : null}
          </button>

          {/* Track Info */}
          <button
            type="button"
            onClick={() => openTrackInfo(currentTrack)}
            aria-label="Track Information"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer aura-focus-ring"
            title="Track Info"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Up Next Queue */}
          <button
            type="button"
            onClick={() => setIsQueueSheetOpen(true)}
            aria-label="Open Up Next Queue"
            className="h-10 px-2.5 rounded-xl flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 active:bg-white/10 transition-colors cursor-pointer aura-focus-ring"
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            {upNextTracks.length > 0 && (
              <span className="text-[11px] font-mono tabular-nums text-zinc-300">
                {upNextTracks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          DEDICATED MOBILE UP NEXT QUEUE SHEET / MODAL
          ------------------------------------------------------------- */}
      {isQueueSheetOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xl flex flex-col justify-end animate-in fade-in duration-150"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="w-full max-h-[82vh] rounded-t-3xl bg-[#0c0e15] border-t border-white/10 p-4 sm:p-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-1 rounded-full bg-white/20" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white font-display">Up Next Queue</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                    {upNextTracks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {upNextTracks.length > 1 && (
                    <button
                      type="button"
                      onClick={handleShuffleUpcoming}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Shuffle upcoming"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {upNextTracks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearUpcoming}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Clear upcoming"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsQueueSheetOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                    aria-label="Close Queue"
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
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
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
                <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                <p className="text-[10px] text-zinc-400 truncate">{currentTrack.artist}</p>
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
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
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
                        <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTrack(idx, 'up')}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {idx < upNextTracks.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTrack(idx, 'down')}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveTrack(idx)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
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

            <button
              type="button"
              onClick={() => setIsQueueSheetOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold transition-colors mt-1 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
