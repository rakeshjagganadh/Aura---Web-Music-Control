import React, { useRef, useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { OpticalGlassSurface } from '../common/OpticalGlassSurface';
import {
  Play,
  Pause,
  SkipForward,
  Heart,
  Music,
} from 'lucide-react';

function getQuietMobileSource(source?: string): string {
  switch (source) {
    case 'youtube':
      return 'YouTube';
    case 'audius':
      return 'Audius';
    case 'jamendo':
      return 'Jamendo';
    case 'radio':
    case 'radiobrowser':
      return 'Live';
    case 'web_stream':
    case 'curated_stream':
      return 'Stream';
    default:
      return 'Local';
  }
}

export const MobileMiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    seek,
    setIsSeeking,
    toggleFavorite,
    setIsExpandedPlayerOpen,
    isExpandedPlayerOpen,
    currentView,
    showToast,
  } = useMusic();

  const {
    isInRoom,
    isOwner,
    isLocallySilenced,
    roomTogglePlay,
    roomNext,
    roomSeek,
  } = useListenTogether();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastSeekAtRef = useRef(0);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  // Hide mini player on Listen Together view or when expanded player is open
  if (!currentTrack || currentView === 'listen-together' || isExpandedPlayerOpen) return null;

  const isRadio = currentTrack.source === 'radio' || currentTrack.source === 'radiobrowser';
  const hasValidDuration = !isRadio && Number.isFinite(duration) && duration > 0;
  const canSeek = hasValidDuration && (!isInRoom || isOwner);
  const progressPercent = hasValidDuration
    ? Math.min(
        100,
        Math.max(0, (isScrubbing && scrubRatio !== null ? scrubRatio : currentTime / duration) * 100)
      )
    : 0;

  const computeRatio = (clientX: number): number => {
    const el = progressBarRef.current;
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
    e.stopPropagation();
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
    lastSeekAtRef.current = performance.now();
    performSeek(ratio * duration);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !canSeek) return;
    e.stopPropagation();
    const ratio = computeRatio(e.clientX);
    setScrubRatio(ratio);
    emitThrottledSeek(ratio * duration);
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();

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
    e.stopPropagation();
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

  const quietSource = getQuietMobileSource(currentTrack.source);

  return (
    <div
      id="mobile-mini-player"
      aria-label="Current Track Mini Player"
      className="lg:hidden fixed bottom-[calc(78px+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-md mx-auto z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <OpticalGlassSurface
        onClick={() => setIsExpandedPlayerOpen(true)}
        className="w-full px-2.5 sm:px-3 pt-2 pb-3 flex flex-col justify-between cursor-pointer active:scale-[0.99] shadow-[0_14px_36px_rgba(0,0,0,0.72)]"
        artworkUrl={currentTrack.coverUrl}
        refractionScale={8}
        intensity="moderate"
        shape="rounded-2xl"
      >
        {/* COMPACT SINGLE ROW — ARTWORK | TITLE + ARTIST | COMPACT ACTIONS */}
        <div className="flex items-center justify-between gap-2 sm:gap-2.5 min-w-0">
          {/* Left: Fixed 40px Artwork */}
          <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-[#0d1017] border border-white/[0.1] shadow-sm flex items-center justify-center">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isPlaying ? 'scale-105' : ''
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
                } flex items-center justify-center text-white`}
              >
                <Music className="w-4 h-4 opacity-70" />
              </div>
            )}
          </div>

          {/* Center: Title & Artist + Quiet Source */}
          <div className="min-w-0 flex-1">
            <h4
              className="text-[13px] font-track-title text-white truncate leading-tight"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h4>
            <div className="flex items-center gap-1 min-w-0 mt-0.5 text-[11px] leading-tight">
              <span className="font-artist-name text-zinc-400 truncate">
                {currentTrack.artist}
              </span>
              <span className="text-zinc-600 shrink-0" aria-hidden="true">·</span>
              <span className="text-[10px] text-zinc-500 shrink-0 font-medium inline-flex items-center gap-1">
                {isRadio && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                <span>{quietSource}</span>
              </span>
            </div>
          </div>

          {/* Right: Compact Touch Controls (Never overflows 320px) */}
          <div
            className="flex items-center gap-0.5 sm:gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Favorite Heart */}
            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={Boolean(currentTrack.isFavorite)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center active:scale-110 transition-all cursor-pointer aura-focus-ring ${
                currentTrack.isFavorite
                  ? 'text-rose-500'
                  : 'text-zinc-300 hover:text-rose-400'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>

            {/* Primary Play/Pause */}
            <button
              type="button"
              onClick={isInRoom ? roomTogglePlay : togglePlay}
              aria-label={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-zinc-950 bg-white hover:bg-zinc-100 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.4)] active:scale-95 transition-all cursor-pointer aura-focus-ring shrink-0"
            >
              {isPlaying && !isLocallySilenced ? (
                <Pause className="w-4 h-4 fill-current text-zinc-950" />
              ) : (
                <Play className="w-4 h-4 fill-current text-zinc-950 translate-x-[1px]" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={isInRoom ? roomNext : nextTrack}
              aria-label="Next Track"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all cursor-pointer aura-focus-ring"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE SLIM BOTTOM PROGRESS LINE (With generous touch hit area) */}
        <div
          ref={progressBarRef}
          role={hasValidDuration ? 'slider' : undefined}
          aria-label="Seek playback position"
          aria-valuemin={hasValidDuration ? 0 : undefined}
          aria-valuemax={hasValidDuration ? Math.round(duration) : undefined}
          aria-valuenow={hasValidDuration ? Math.round(currentTime) : undefined}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
          onPointerCancel={handleProgressPointerCancel}
          style={{ touchAction: 'none' }}
          className={`absolute -bottom-3 left-1.5 right-1.5 h-5 pb-1 flex items-end z-20 ${
            canSeek ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <div
            className={`relative w-full rounded-full transition-all duration-150 ${
              isScrubbing ? 'h-[3.5px]' : 'h-[2px]'
            } bg-white/[0.12] overflow-visible`}
          >
            {isRadio ? (
              <div className="h-full w-full rounded-full bg-emerald-400/50" />
            ) : hasValidDuration ? (
              <>
                <div
                  className="h-full rounded-full bg-white/85 transition-[width] duration-100 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
                {isScrubbing && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm"
                    style={{ left: `${progressPercent}%` }}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </OpticalGlassSurface>
    </div>
  );
};
