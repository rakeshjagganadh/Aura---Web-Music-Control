import React, { useRef, useState, useCallback, useEffect } from 'react';
import { WaveformMarker } from '../../types';

interface WaveformScrubberProps {
  peaks?: number[];
  currentTime: number;
  duration: number;
  onSeek?: (seconds: number) => void;
  onSeekingChange?: (isSeeking: boolean) => void;
  height?: number;
  barWidth?: number;
  barGap?: number;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
  showHoverTime?: boolean;
  disabled?: boolean;
  isRadio?: boolean;
  isLoadingDuration?: boolean;
  variant?: 'auto' | 'waveform' | 'bar';
  markers?: WaveformMarker[];
  onMarkerClick?: (marker: WaveformMarker) => void;
  loopRegion?: {
    pointA: number | null;
    pointB: number | null;
    enabled?: boolean;
  };
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  peaks,
  currentTime,
  duration,
  onSeek,
  onSeekingChange,
  height = 48,
  barWidth = 3,
  barGap = 2,
  activeColor = '#ffffff',
  inactiveColor = 'rgba(255, 255, 255, 0.16)',
  className = '',
  showHoverTime = true,
  disabled = false,
  isRadio = false,
  isLoadingDuration = false,
  variant = 'auto',
  markers = [],
  onMarkerClick,
  loopRegion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0); // 0 to 1
  const [hoverTime, setHoverTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);

  const isDraggingRef = useRef(false);
  const lastSeekTimeRef = useRef(0);
  const throttledSeekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);

  const hasValidDuration = !isRadio && Number.isFinite(duration) && duration > 0;
  const canSeek = Boolean(onSeek) && hasValidDuration && !disabled;
  const hasRealPeaks = Boolean(peaks && peaks.length > 0);
  const renderAsWaveform =
    variant === 'waveform' ? hasRealPeaks : variant === 'bar' ? false : hasRealPeaks;

  // Compute effective progress: while dragging, visual playhead tracks pointer immediately
  const progress =
    !hasValidDuration
      ? 0
      : isDragging && dragRatio !== null
        ? dragRatio
        : Math.max(0, Math.min(1, currentTime / duration));

  // Observe container resize so canvas stays crisp across layout transitions
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setLayoutTick((t) => t + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Render waveform or clean progress track on canvas
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (width <= 0 || h <= 0) return;

    const targetW = Math.round(width * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, h);

    // Draw Loop A/B Region highlight if active
    if (hasValidDuration && loopRegion && loopRegion.pointA !== null && loopRegion.pointB !== null) {
      const startX = Math.max(0, Math.min(width, (loopRegion.pointA / duration) * width));
      const endX = Math.max(0, Math.min(width, (loopRegion.pointB / duration) * width));
      const regionW = Math.max(2, endX - startX);

      ctx.fillStyle = loopRegion.enabled ? 'rgba(168, 85, 247, 0.20)' : 'rgba(168, 85, 247, 0.08)';
      ctx.fillRect(startX, 0, regionW, h);

      ctx.strokeStyle = loopRegion.enabled ? '#c084fc' : 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, h);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, h);
      ctx.stroke();
    }

    if (renderAsWaveform && peaks && peaks.length > 0 && hasValidDuration) {
      // Real waveform bars mode
      const step = barWidth + barGap;
      const totalBars = Math.max(1, Math.floor(width / step));
      const centerY = h / 2;

      for (let i = 0; i < totalBars; i++) {
        const x = i * step;
        const progressRatio = x / width;

        const peakIndex = Math.min(peaks.length - 1, Math.floor((i / totalBars) * peaks.length));
        const rawPeak = Math.max(0.08, Math.min(1, peaks[peakIndex] || 0.15));
        const barHeight = Math.max(3, rawPeak * (h - 6));
        const top = centerY - barHeight / 2;
        const radius = Math.min(barWidth / 2, 1.5);

        const isPlayed = progressRatio <= progress;
        const isHoveredPast =
          canSeek && isHovering && !isDragging && progressRatio <= hoverPosition && !isPlayed;

        if (isPlayed) {
          ctx.fillStyle = activeColor;
        } else if (isHoveredPast) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
        } else {
          ctx.fillStyle = inactiveColor;
        }

        ctx.beginPath();
        ctx.roundRect(x, top, barWidth, barHeight, radius);
        ctx.fill();
      }

      // Subtle hover cursor
      if (canSeek && isHovering && !isDragging && hoverPosition > 0 && hoverPosition < 1) {
        const hoverX = hoverPosition * width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.roundRect(hoverX - 0.5, 2, 1, h - 4, 0.5);
        ctx.fill();
      }

      // Clean playhead cursor line
      if (progress > 0 || isDragging) {
        const playheadX = Math.max(1, Math.min(width - 1, progress * width));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(playheadX - (isDragging ? 1.5 : 1), 1, isDragging ? 3 : 2, h - 2, 1);
        ctx.fill();
      }
    } else {
      // Clean functional linear progress track (never fakes waveform peaks)
      const centerY = h / 2;
      const trackH = isDragging ? 6 : isHovering && canSeek ? 5 : 4;
      const trackY = centerY - trackH / 2;
      const trackRadius = trackH / 2;

      // Base unplayed rail
      ctx.fillStyle = hasValidDuration ? inactiveColor : 'rgba(255, 255, 255, 0.10)';
      ctx.beginPath();
      ctx.roundRect(0, trackY, width, trackH, trackRadius);
      ctx.fill();

      if (hasValidDuration) {
        // Hover preview fill
        if (canSeek && isHovering && !isDragging && hoverPosition > progress) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.roundRect(0, trackY, hoverPosition * width, trackH, trackRadius);
          ctx.fill();
        }

        // Played portion
        const playedW = Math.max(0, Math.min(width, progress * width));
        if (playedW > 0) {
          ctx.fillStyle = activeColor;
          ctx.beginPath();
          ctx.roundRect(0, trackY, playedW, trackH, trackRadius);
          ctx.fill();
        }

        // Interactive scrubber thumb (subtle resting dot, expands cleanly on hover/drag)
        if (canSeek) {
          const thumbR = isDragging ? 6.5 : isHovering ? 5.5 : 4;
          const thumbX = Math.max(thumbR, Math.min(width - thumbR, playedW));
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(thumbX, centerY, thumbR, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore();
  }, [
    peaks,
    renderAsWaveform,
    hasValidDuration,
    canSeek,
    progress,
    isHovering,
    isDragging,
    hoverPosition,
    barWidth,
    barGap,
    activeColor,
    inactiveColor,
    duration,
    loopRegion,
    layoutTick,
  ]);

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  useEffect(() => {
    return () => {
      if (throttledSeekTimerRef.current) {
        clearTimeout(throttledSeekTimerRef.current);
      }
    };
  }, []);

  const calculateRatio = (clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const emitThrottledSeek = (targetTime: number) => {
    if (!onSeek) return;
    pendingSeekTimeRef.current = targetTime;
    const now = performance.now();
    const elapsed = now - lastSeekTimeRef.current;

    if (elapsed >= 45) {
      lastSeekTimeRef.current = now;
      onSeek(targetTime);
    } else if (!throttledSeekTimerRef.current) {
      throttledSeekTimerRef.current = setTimeout(() => {
        throttledSeekTimerRef.current = null;
        if (pendingSeekTimeRef.current !== null && isDraggingRef.current) {
          lastSeekTimeRef.current = performance.now();
          onSeek(pendingSeekTimeRef.current);
        }
      }, 45 - elapsed);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSeek || !containerRef.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    onSeekingChange?.(true);

    const ratio = calculateRatio(e.clientX);
    setDragRatio(ratio);
    setHoverPosition(ratio);
    const targetTime = ratio * duration;
    setHoverTime(targetTime);

    lastSeekTimeRef.current = performance.now();
    onSeek?.(targetTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasValidDuration) return;
    const ratio = calculateRatio(e.clientX);
    setHoverPosition(ratio);
    const targetTime = ratio * duration;
    setHoverTime(targetTime);

    if (isDraggingRef.current && canSeek) {
      setDragRatio(ratio);
      emitThrottledSeek(targetTime);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();

    if (throttledSeekTimerRef.current) {
      clearTimeout(throttledSeekTimerRef.current);
      throttledSeekTimerRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const ratio = calculateRatio(e.clientX);
    const finalTargetTime = ratio * duration;

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragRatio(null);

    onSeek?.(finalTargetTime);
    onSeekingChange?.(false);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    if (throttledSeekTimerRef.current) {
      clearTimeout(throttledSeekTimerRef.current);
      throttledSeekTimerRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragRatio(null);
    onSeekingChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canSeek || !onSeek) return;
    const step = e.shiftKey ? 10 : 5;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      onSeek(Math.min(duration, currentTime + step));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      onSeek(Math.max(0, currentTime - step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      onSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      onSeek(duration);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="waveform-scrubber-container"
      ref={containerRef}
      role="slider"
      aria-label="Playback timeline"
      aria-valuemin={0}
      aria-valuemax={hasValidDuration ? Math.round(duration) : 0}
      aria-valuenow={hasValidDuration ? Math.round(currentTime) : 0}
      aria-disabled={!canSeek}
      tabIndex={canSeek ? 0 : -1}
      onKeyDown={handleKeyDown}
      className={`relative w-full select-none group touch-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded-md ${
        canSeek ? 'cursor-pointer' : 'cursor-default'
      } ${className}`}
      style={{ height, touchAction: 'none' }}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => {
        setIsHovering(false);
        if (!isDraggingRef.current) {
          setDragRatio(null);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Subtle loading pulse overlay when duration is genuinely pending */}
      {!isRadio && isLoadingDuration && !hasValidDuration && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full overflow-hidden bg-white/[0.08]">
          <div className="h-full w-1/3 bg-white/25 rounded-full animate-pulse" />
        </div>
      )}

      {/* Markers Overlays */}
      {hasValidDuration &&
        markers.map((m) => {
          const markerPct = Math.max(0, Math.min(100, (m.time / duration) * 100));
          return (
            <button
              key={m.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onMarkerClick) onMarkerClick(m);
                else onSeek?.(m.time);
              }}
              title={`${m.label} (${formatTime(m.time)})`}
              className="absolute top-0 bottom-0 w-1 -translate-x-1/2 z-20 group/marker flex flex-col items-center justify-start pointer-events-auto"
              style={{ left: `${markerPct}%` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border border-black/50 shadow-md transform -translate-y-1 group-hover/marker:scale-125 transition-transform"
                style={{ backgroundColor: m.color || '#ec4899' }}
              />
              <div
                className="w-0.5 flex-1 opacity-75"
                style={{ backgroundColor: m.color || '#ec4899' }}
              />
            </button>
          );
        })}

      {/* Hover timestamp tooltip */}
      {showHoverTime && canSeek && (isHovering || isDragging) && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium text-white bg-zinc-900/95 border border-white/15 shadow-lg pointer-events-none transform -translate-x-1/2 transition-opacity duration-150 z-30 tabular-nums"
          style={{ left: `${Math.max(4, Math.min(96, (isDragging && dragRatio !== null ? dragRatio : hoverPosition) * 100))}%` }}
        >
          {formatTime(isDragging && dragRatio !== null ? dragRatio * duration : hoverTime)}
        </div>
      )}
    </div>
  );
};
