import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { OpticalGlassSurface } from '../common/OpticalGlassSurface';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import {
  fadeVariants,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_TRANSITION,
  REDUCED_FADE_TRANSITION,
} from '../../motion/tokens';
import {
  MotionArtwork,
  MotionIconSwap,
  MotionPopover,
  MotionPress,
} from '../common/motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  SlidersHorizontal,
  Maximize2,
  Music,
  Moon,
  Info,
  MoreHorizontal,
  Disc,
} from 'lucide-react';

function getQuietSourceLabel(source?: string, isDirectStream?: boolean): string {
  switch (source) {
    case 'youtube':
      return isDirectStream ? 'YouTube Direct' : 'YouTube';
    case 'audius':
      return 'Audius';
    case 'jamendo':
      return 'Jamendo';
    case 'radio':
    case 'radiobrowser':
      return 'Live Radio';
    case 'web_stream':
    case 'curated_stream':
      return 'Stream';
    default:
      return 'Local';
  }
}

export const BottomPlayer: React.FC = () => {
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
    isAudioControlsOpen,
    isQueueDrawerOpen,
    isSleepTimerActive,
    sleepTimerRemainingSecs,
    setIsSleepTimerModalOpen,
    openTrackInfo,
    togglePlay,
    seek,
    setIsExpandedPlayerOpen,
    isExpandedPlayerOpen,
    setIsAudioControlsOpen,
    setIsQueueDrawerOpen,
    eqPreset,
    effects,
    currentView,
    queue,
    queueIndex,
    toggleFavorite,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    prevTrack,
    showToast,
  } = useMusic();

  const {
    isInRoom,
    isOwner,
    isLocallySilenced,
    roomTogglePlay,
    roomNext,
    roomPrev,
    roomSeek,
  } = useListenTogether();

  const { prefersReducedMotion, controlTransition } = useMotionCapabilities();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; right: number } | null>(null);

  // Slim integrated progress bar state
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastSeekAtRef = useRef(0);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverRatio, setHoverRatio] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = moreTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const edgePadding = 16;
    const verticalGap = 12;
    const bottom = Math.max(edgePadding, window.innerHeight - rect.top + verticalGap);
    const right = Math.max(edgePadding, Math.min(window.innerWidth - 272, window.innerWidth - rect.right));
    setMenuPosition({ bottom, right });
  }, []);

  // Keep More menu anchored cleanly on resize/scroll and handle outside click + Escape
  useEffect(() => {
    if (!showMoreMenu) return;

    updateMenuPosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = moreTriggerRef.current?.contains(target);
      const clickedMenu = portalMenuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setShowMoreMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setShowMoreMenu(false);
        moreTriggerRef.current?.focus();
      }
    };

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showMoreMenu, updateMenuPosition]);

  // Close More menu if player hides
  useEffect(() => {
    if (!currentTrack || currentView === 'listen-together' || isExpandedPlayerOpen) {
      setShowMoreMenu(false);
    }
  }, [currentTrack, currentView, isExpandedPlayerOpen]);

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  const isAudioEffectActive =
    eqPreset !== 'flat' ||
    Boolean(effects?.reverb?.enabled) ||
    Boolean(effects?.echo?.enabled) ||
    Boolean(effects?.saturation?.enabled) ||
    (effects?.bassBoost ?? 0) > 0 ||
    (effects?.trebleBoost ?? 0) > 0;

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isRadio = currentTrack?.source === 'radio' || currentTrack?.source === 'radiobrowser';
  const hasValidDuration = !isRadio && Number.isFinite(duration) && duration > 0;
  const canSeek = hasValidDuration && (!isInRoom || isOwner);
  const upcomingCount = Math.max(0, queue.length - (queueIndex + 1));
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);

  const progressPercent = hasValidDuration
    ? Math.min(
        100,
        Math.max(0, (isScrubbing && scrubRatio !== null ? scrubRatio : currentTime / duration) * 100)
      )
    : 0;

  const computeRatio = (clientX: number): number => {
    const el = progressTrackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const performSeek = (seconds: number) => {
    if (isInRoom) {
      roomSeek(seconds);
    } else {
      seek(seconds);
    }
  };

  const emitThrottledSeek = (targetSecs: number) => {
    pendingSeekRef.current = targetSecs;
    const now = performance.now();
    const elapsed = now - lastSeekAtRef.current;
    if (elapsed >= 45) {
      lastSeekAtRef.current = now;
      performSeek(targetSecs);
    } else if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        if (pendingSeekRef.current !== null && isDraggingRef.current) {
          lastSeekAtRef.current = performance.now();
          performSeek(pendingSeekRef.current);
        }
      }, 45 - elapsed);
    }
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasValidDuration) return;
    if (isInRoom && !isOwner) {
      showToast('Only the host can seek the track.', 'info');
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = true;
    setIsScrubbing(true);
    setIsSeeking(true);

    const ratio = computeRatio(e.clientX);
    setScrubRatio(ratio);
    setHoverRatio(ratio);
    lastSeekAtRef.current = performance.now();
    performSeek(ratio * duration);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasValidDuration) return;
    const ratio = computeRatio(e.clientX);
    setHoverRatio(ratio);
    if (isDraggingRef.current && canSeek) {
      setScrubRatio(ratio);
      emitThrottledSeek(ratio * duration);
    }
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const ratio = computeRatio(e.clientX);
    isDraggingRef.current = false;
    setIsScrubbing(false);
    setScrubRatio(null);
    if (canSeek) {
      performSeek(ratio * duration);
    }
    setIsSeeking(false);
  };

  const handleProgressPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDraggingRef.current = false;
    setIsScrubbing(false);
    setScrubRatio(null);
    setIsSeeking(false);
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canSeek) return;
    const step = e.shiftKey ? 10 : 5;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      performSeek(Math.min(duration, currentTime + step));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      performSeek(Math.max(0, currentTime - step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      performSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      performSeek(duration);
    }
  };

  // Hide bottom player inside Listen Together dedicated view or when full-screen expanded player is open
  if (currentView === 'listen-together' || isExpandedPlayerOpen) {
    return null;
  }

  // --- EMPTY PLAYER STATE (Compact 76px single-row footprint) ---
  if (!currentTrack) {
    return (
      <div
        id="bottom-player-bar"
        className="hidden lg:grid grid-cols-[minmax(200px,1fr)_auto_minmax(220px,1fr)] items-center gap-4 absolute bottom-3.5 sm:bottom-4 lg:bottom-5 left-4 right-4 sm:left-6 sm:right-6 max-w-4xl xl:max-w-5xl mx-auto h-[76px] rounded-3xl bg-[#0c101c]/85 backdrop-blur-2xl border border-white/[0.08] z-30 px-5 xl:px-6 select-none shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden"
      >
        {/* Left: Quiescent Identifier */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 shrink-0">
            <Disc className="w-4.5 h-4.5 opacity-60 animate-spin" style={{ animationDuration: '16s' }} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-300 font-display truncate">
              Space is quiescent
            </h4>
            <p className="text-[11px] text-zinc-500 font-ui-meta mt-0.5 truncate">
              Select a track to begin listening
            </p>
          </div>
        </div>

        {/* Middle: Inactive Single-Row Transport */}
        <div className="flex items-center justify-center gap-2 opacity-30 pointer-events-none">
          <div className="w-8 h-8 flex items-center justify-center">
            <Shuffle className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <SkipBack className="w-4 h-4 text-zinc-400 fill-current" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-zinc-300">
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <SkipForward className="w-4 h-4 text-zinc-400 fill-current" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <Repeat className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>

        {/* Right: Operational Utilities */}
        <div className="flex items-center justify-end gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <div className="w-16 xl:w-20 flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectiveVolume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.85) ${volumePercent}%, rgba(255,255,255,0.14) ${volumePercent}%)`,
                  height: '4px',
                  borderRadius: '9999px',
                }}
                aria-label="Volume slider"
                className="w-full"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Queue"
            aria-label="Toggle Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const quietSource = getQuietSourceLabel(currentTrack.source, isDirectStreamActive);
  const activeRatio = isScrubbing && scrubRatio !== null ? scrubRatio : hoverRatio;
  const activeHoverTime = activeRatio * (hasValidDuration ? duration : 0);

  // --- ACTIVE PLAYING STATE (Original Compact 76px Footprint, Single Horizontal Row) ---
  return (
    <div className="hidden lg:flex absolute bottom-3.5 sm:bottom-4 lg:bottom-5 left-4 right-4 sm:left-6 sm:right-6 max-w-4xl xl:max-w-5xl mx-auto z-30 select-none">
      {/* Hover timestamp tooltip rendered outside OpticalGlassSurface overflow-hidden so it never clips */}
      <AnimatePresence>
        {(isHoveringProgress || isScrubbing) && canSeek && (
          <motion.div
            key="bottom-player-progress-tooltip"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={prefersReducedMotion ? REDUCED_FADE_TRANSITION : MOTION_TRANSITION.micro}
            className="pointer-events-none absolute -top-7 z-40 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums text-white bg-zinc-950/90 border border-white/15 shadow-lg whitespace-nowrap"
            style={{
              left: `calc(24px + (100% - 48px) * ${Math.max(0.02, Math.min(0.98, activeRatio))})`,
            }}
          >
            {formatTime(activeHoverTime)} <span className="text-zinc-500">/ {formatTime(duration)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <OpticalGlassSurface
        id="bottom-player-bar"
        className="w-full h-[76px] px-5 xl:px-6 shadow-[0_20px_50px_rgba(0,0,0,0.80)]"
        artworkUrl={currentTrack.coverUrl}
        refractionScale={10}
        intensity="moderate"
        shape="rounded-3xl"
      >
        {/* Single Vertically-Centered Horizontal Composition */}
        <div className="w-full h-full grid grid-cols-[minmax(190px,1fr)_auto_minmax(230px,1fr)] items-center gap-3 xl:gap-5">
          {/* -------------------------------------------------------------
              LEFT — ALBUM ARTWORK, TRACK TITLE, ARTIST & QUIET SOURCE
              ------------------------------------------------------------- */}
          <div className="flex items-center gap-3 min-w-0">
            <MotionPress
              onClick={() => setIsExpandedPlayerOpen(true)}
              intensity="subtle"
              enableHoverScale
              className="relative group shrink-0 w-11 h-11 overflow-hidden cursor-pointer rounded-xl border border-white/[0.08] shadow-md bg-[#0d1017] aura-focus-ring"
              title="Open Expanded Player"
              aria-label="Open Expanded Player"
            >
              <AnimatePresence initial={false}>
                <MotionArtwork
                  key={`${currentTrack.id}:${currentTrack.coverUrl || ''}`}
                  artworkKey={`${currentTrack.id}:${currentTrack.coverUrl || ''}`}
                  className="absolute inset-0 w-full h-full"
                >
                  {currentTrack.coverUrl ? (
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        currentTrack.coverColor || 'from-[#141a29] to-[#080b12]'
                      } flex items-center justify-center`}
                    >
                      <Music className="w-4.5 h-4.5 text-white/70" />
                    </div>
                  )}
                </MotionArtwork>
              </AnimatePresence>

              <div className="absolute inset-0 z-10 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </div>
            </MotionPress>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsExpandedPlayerOpen(true)}
                className="block w-full text-left text-xs sm:text-sm font-track-title text-white truncate hover:text-zinc-200 cursor-pointer leading-tight focus-visible:outline-none focus-visible:underline"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </button>

              <div className="flex items-center gap-1.5 min-w-0 mt-0.5 text-xs">
                <span className="font-artist-name text-zinc-400 truncate" title={currentTrack.artist}>
                  {currentTrack.artist}
                </span>
                <span className="hidden xl:inline text-zinc-600 shrink-0" aria-hidden="true">·</span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium shrink-0">
                  {((currentTrack.source === 'youtube' && isDirectStreamActive) || isRadio) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90" />
                  )}
                  <span>{quietSource}</span>
                </span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              MIDDLE — SHUFFLE · PREV · PLAY/PAUSE · NEXT · REPEAT
              ------------------------------------------------------------- */}
          <div className="flex items-center justify-center gap-1.5 xl:gap-2.5 shrink-0">
            <MotionPress
              onClick={toggleShuffle}
              intensity="control"
              enableHoverScale
              aria-label={`Shuffle ${isShuffle ? 'On' : 'Off'}`}
              aria-pressed={isShuffle}
              title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer aura-focus-ring ${
                isShuffle
                  ? 'text-sky-300 bg-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <motion.span
                className="inline-flex items-center justify-center"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: isShuffle ? [1, 1.16, 1] : 1 }
                }
                transition={{ duration: MOTION_DURATION.micro, ease: MOTION_EASE.standard }}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </motion.span>
              <AnimatePresence>
                {isShuffle && (
                  <motion.span
                    key="shuffle-dot"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    transition={controlTransition}
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-300"
                  />
                )}
              </AnimatePresence>
            </MotionPress>

            <MotionPress
              onClick={isInRoom ? roomPrev : prevTrack}
              intensity="control"
              enableHoverScale
              aria-label="Previous Track"
              title="Previous Track (P)"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer aura-focus-ring"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </MotionPress>

            <MotionPress
              onClick={isInRoom ? roomTogglePlay : togglePlay}
              intensity="control"
              enableHoverScale
              aria-label={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
              title={isPlaying && !isLocallySilenced ? 'Pause (Space)' : 'Play (Space)'}
              className="w-10 h-10 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-[0_2px_14px_rgba(0,0,0,0.45)] transition-colors cursor-pointer aura-focus-ring shrink-0"
            >
              <MotionIconSwap stateKey={isPlaying && !isLocallySilenced ? 'pause' : 'play'}>
                {isPlaying && !isLocallySilenced ? (
                  <Pause className="w-4 h-4 fill-current text-zinc-950" />
                ) : (
                  <Play className="w-4 h-4 fill-current text-zinc-950 translate-x-[1px]" />
                )}
              </MotionIconSwap>
            </MotionPress>

            <MotionPress
              onClick={isInRoom ? roomNext : nextTrack}
              intensity="control"
              enableHoverScale
              aria-label="Next Track"
              title="Next Track (N)"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer aura-focus-ring"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </MotionPress>

            <MotionPress
              onClick={cycleRepeat}
              intensity="control"
              enableHoverScale
              aria-label={`Repeat ${repeatMode}`}
              aria-pressed={repeatMode !== 'off'}
              title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer aura-focus-ring ${
                repeatMode !== 'off'
                  ? 'text-sky-300 bg-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <MotionIconSwap stateKey={repeatMode}>
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5" />
                ) : (
                  <Repeat className="w-3.5 h-3.5" />
                )}
              </MotionIconSwap>
              <AnimatePresence>
                {repeatMode !== 'off' && (
                  <motion.span
                    key="repeat-dot"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    transition={controlTransition}
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-300"
                  />
                )}
              </AnimatePresence>
            </MotionPress>
          </div>

          {/* -------------------------------------------------------------
              RIGHT — FAVOURITE · VOLUME · AUDIO STUDIO · QUEUE · MORE
              ------------------------------------------------------------- */}
          <div className="flex items-center justify-end gap-1 xl:gap-1.5 min-w-0">
            {/* Favourite */}
            <MotionPress
              onClick={() => toggleFavorite(currentTrack.id)}
              intensity="control"
              enableHoverScale
              aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={Boolean(currentTrack.isFavorite)}
              title={currentTrack.isFavorite ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer aura-focus-ring ${
                currentTrack.isFavorite
                  ? 'text-rose-500 hover:bg-rose-500/10'
                  : 'text-zinc-400 hover:text-rose-400 hover:bg-white/[0.06]'
              }`}
            >
              <motion.span
                key={`${currentTrack.id}:${Boolean(currentTrack.isFavorite)}`}
                className="inline-flex items-center justify-center"
                initial={false}
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: currentTrack.isFavorite ? [1, 1.24, 1] : [1, 0.9, 1] }
                }
                transition={{ duration: MOTION_DURATION.standard, ease: MOTION_EASE.emphasized }}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </motion.span>
            </MotionPress>

            {/* Volume */}
            <div className="flex items-center gap-1 mr-0.5">
              <MotionPress
                onClick={toggleMute}
                intensity="control"
                enableHoverScale
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute (M)' : `Mute (${volumePercent}%)`}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer aura-focus-ring shrink-0"
              >
                <MotionIconSwap
                  stateKey={
                    isMuted || volume === 0 ? 'muted' : volume < 0.5 ? 'low' : 'high'
                  }
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </MotionIconSwap>
              </MotionPress>

              <div className="w-16 xl:w-20 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effectiveVolume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.88) ${volumePercent}%, rgba(255,255,255,0.14) ${volumePercent}%)`,
                    height: '4px',
                    borderRadius: '9999px',
                  }}
                  className="w-full transition-[filter] duration-150 hover:brightness-110"
                  aria-label="Volume slider"
                />
              </div>
            </div>

            {/* Audio Studio DSP Shortcut */}
            <MotionPress
              onClick={() => setIsAudioControlsOpen(!isAudioControlsOpen)}
              intensity="control"
              enableHoverScale
              aria-label="Audio Studio DSP"
              aria-pressed={isAudioControlsOpen}
              title="Audio Studio & DSP Controls (E)"
              className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer aura-focus-ring shrink-0 ${
                isAudioEffectActive || isAudioControlsOpen
                  ? 'text-sky-300 bg-sky-500/12'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <AnimatePresence>
                {isAudioEffectActive && (
                  <motion.span
                    key="dsp-active-dot"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                    transition={controlTransition}
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-400"
                  />
                )}
              </AnimatePresence>
            </MotionPress>

            {/* Queue */}
            <MotionPress
              onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
              intensity="control"
              enableHoverScale
              aria-label="Toggle Queue"
              aria-pressed={isQueueDrawerOpen}
              title="Play Queue (Q)"
              className={`h-8 px-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer aura-focus-ring shrink-0 ${
                isQueueDrawerOpen
                  ? 'bg-white/[0.12] text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <AnimatePresence initial={false}>
                {upcomingCount > 0 && (
                  <motion.span
                    key="queue-count"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    transition={MOTION_TRANSITION.micro}
                    className="text-[10px] font-mono text-zinc-300 font-medium tabular-nums"
                  >
                    {upcomingCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </MotionPress>

            {/* More Options */}
            <div className="relative shrink-0">
              <MotionPress
                ref={moreTriggerRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showMoreMenu) updateMenuPosition();
                  setShowMoreMenu((v) => !v);
                }}
                intensity="control"
                enableHoverScale
                aria-label="More Options"
                aria-haspopup="menu"
                aria-expanded={showMoreMenu}
                title="More Options"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer aura-focus-ring ${
                  showMoreMenu
                    ? 'bg-white/[0.12] text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </MotionPress>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            SLIM INTEGRATED BOTTOM PROGRESS LINE (No extra layout row)
            Generous 12px pointer target along lower edge; visual rail 2.5px -> 4px
            ------------------------------------------------------------- */}
        <div
          ref={progressTrackRef}
          role={hasValidDuration ? 'slider' : undefined}
          aria-label="Seek playback position"
          aria-valuemin={hasValidDuration ? 0 : undefined}
          aria-valuemax={hasValidDuration ? Math.round(duration) : undefined}
          aria-valuenow={hasValidDuration ? Math.round(currentTime) : undefined}
          aria-disabled={!canSeek}
          tabIndex={canSeek ? 0 : -1}
          onKeyDown={handleProgressKeyDown}
          onPointerEnter={() => setIsHoveringProgress(true)}
          onPointerLeave={() => {
            setIsHoveringProgress(false);
            if (!isDraggingRef.current) setScrubRatio(null);
          }}
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
          onPointerCancel={handleProgressPointerCancel}
          style={{ touchAction: 'none' }}
          className={`absolute bottom-0 left-0 right-0 h-3 flex items-end z-20 focus-visible:outline-none ${
            canSeek ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <div
            className={`relative w-full rounded-full transition-all duration-150 ${
              isHoveringProgress || isScrubbing ? 'h-[4px]' : 'h-[2.5px]'
            } bg-white/[0.12] overflow-visible`}
          >
            {isRadio ? (
              <div className="h-full w-full rounded-full bg-emerald-400/55" />
            ) : hasValidDuration ? (
              <>
                {isHoveringProgress && !isScrubbing && canSeek && (
                  <div
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white/20"
                    style={{ transform: `scaleX(${hoverRatio})` }}
                  />
                )}
                <div
                  key={currentTrack.id}
                  className={`relative h-full w-full origin-left rounded-full bg-white/85 ${
                    isScrubbing || prefersReducedMotion
                      ? 'transition-none'
                      : 'transition-transform duration-200 ease-linear'
                  }`}
                  style={{ transform: `scaleX(${progressPercent / 100})` }}
                />
                <AnimatePresence>
                  {(isHoveringProgress || isScrubbing) && canSeek && (
                    <motion.div
                      key="bottom-player-scrub-thumb"
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: isScrubbing ? 1.15 : 1 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                      transition={MOTION_TRANSITION.micro}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm"
                      style={{ left: `${progressPercent}%` }}
                    />
                  )}
                </AnimatePresence>
              </>
            ) : null}
          </div>
        </div>
      </OpticalGlassSurface>

      {/* Portal-rendered More Menu (Escapes OpticalGlassSurface overflow-hidden & stacking context) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showMoreMenu && menuPosition && (
              <MotionPopover
                key="bottom-player-more-menu"
                placement="top"
                style={{
                  position: 'fixed',
                  bottom: `${menuPosition.bottom}px`,
                  right: `${menuPosition.right}px`,
                }}
                className="z-[70]"
              >
                <div
                  ref={portalMenuRef}
                  role="menu"
                  aria-label="More playback options"
                  onClick={(e) => e.stopPropagation()}
                  className="w-64 max-h-[calc(100vh-120px)] overflow-y-auto p-2 rounded-2xl bg-[#0e121e]/95 backdrop-blur-2xl border border-white/[0.10] shadow-[0_20px_50px_rgba(0,0,0,0.88)] flex flex-col gap-1 text-left select-none"
                >
                  {/* Playback Speed Row */}
                  <div className="px-2.5 py-2 flex items-center justify-between border-b border-white/[0.08] mb-0.5">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                      Speed
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-1.5 py-0.5 text-[11px] font-mono rounded-md transition-colors cursor-pointer aura-pressable ${
                            Math.abs(playbackRate - rate) < 0.01
                              ? 'bg-white text-zinc-950 font-bold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {rate}×
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAudioControlsOpen(!isAudioControlsOpen);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer aura-pressable"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="flex-1 truncate">Audio Studio &amp; DSP</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsSleepTimerModalOpen(true);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer aura-pressable"
                  >
                    <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="flex-1 truncate font-ui-body">Sleep Timer</span>
                    {isSleepTimerActive && sleepTimerRemainingSecs ? (
                      <span className="text-[10px] font-mono text-purple-300 tabular-nums">
                        {Math.ceil(sleepTimerRemainingSecs / 60)}m
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      openTrackInfo(currentTrack);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer aura-pressable"
                  >
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="flex-1 truncate font-ui-body">Track Metadata Info</span>
                  </button>

                  <div className="my-0.5 border-t border-white/[0.08]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsExpandedPlayerOpen(true);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer aura-pressable"
                  >
                    <Maximize2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="flex-1 truncate font-ui-body">Expand Studio Canvas</span>
                  </button>
                </div>
              </MotionPopover>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
