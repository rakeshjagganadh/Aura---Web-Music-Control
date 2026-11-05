import React, { useRef, useState, useCallback, useEffect } from 'react';
import { WaveformMarker } from '../../types';

interface WaveformScrubberProps {
  peaks?: number[];
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onSeekingChange?: (isSeeking: boolean) => void;
  height?: number;
  barWidth?: number;
  barGap?: number;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
  showHoverTime?: boolean;
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
  activeColor = '#818cf8',
  inactiveColor = 'rgba(255, 255, 255, 0.18)',
  className = '',
  showHoverTime = true,
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

  const isDraggingRef = useRef(false);
  const lastSeekTimeRef = useRef(0);
  const throttledSeekTimerRef = useRef<any>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);

  // Generate fallback peaks if empty
  const defaultPeaks = React.useMemo(() => {
    if (peaks && peaks.length > 0) return peaks;
    const fallback: number[] = [];
    for (let i = 0; i < 140; i++) {
      const t = i / 140;
      fallback.push(0.15 + 0.6 * Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.sin(t * 12)));
    }
    return fallback;
  }, [peaks]);

  // Compute effective progress: while dragging, visual playhead tracks pointer immediately
  const progress = isDragging && dragRatio !== null
    ? dragRatio
    : duration > 0
      ? Math.max(0, Math.min(1, currentTime / duration))
      : 0;

  // Render waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
      canvas.width = width * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, h);

    // Draw Loop A/B Region highlight if active
    if (duration > 0 && loopRegion && loopRegion.pointA !== null && loopRegion.pointB !== null) {
      const startX = Math.max(0, Math.min(width, (loopRegion.pointA / duration) * width));
      const endX = Math.max(0, Math.min(width, (loopRegion.pointB / duration) * width));
      const regionW = Math.max(2, endX - startX);

      ctx.fillStyle = loopRegion.enabled ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.08)';
      ctx.fillRect(startX, 0, regionW, h);

      // Loop boundaries
      ctx.strokeStyle = loopRegion.enabled ? '#c084fc' : 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, h);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, h);
      ctx.stroke();
    }

    const step = barWidth + barGap;
    const totalBars = Math.floor(width / step);
    const centerY = h / 2;

    for (let i = 0; i < totalBars; i++) {
      const x = i * step;
      const progressRatio = x / width;

      // Sample from peaks array
      const peakIndex = Math.floor((i / totalBars) * defaultPeaks.length);
      const rawPeak = defaultPeaks[peakIndex] || 0.2;
      const barHeight = Math.max(4, rawPeak * (h - 6));
      const top = centerY - barHeight / 2;
      const radius = Math.min(barWidth / 2, 1.5);

      const isPlayed = progressRatio <= progress;
      const isHoveredPast = isHovering && !isDragging && progressRatio <= hoverPosition && !isPlayed;

      if (isPlayed) {
        // High contrast Aura Violet to Celestial Cyan gradient
        const barGrad = ctx.createLinearGradient(x, top, x, top + barHeight);
        barGrad.addColorStop(0, '#a5b4fc');
        barGrad.addColorStop(1, activeColor);
        ctx.fillStyle = barGrad;
      } else if (isHoveredPast) {
        ctx.fillStyle = 'rgba(129, 140, 248, 0.45)';
      } else {
        ctx.fillStyle = inactiveColor;
      }

      ctx.beginPath();
      ctx.roundRect(x, top, barWidth, barHeight, radius);
      ctx.fill();
    }

    // Draw hover cursor line when hovering and not dragging
    if (isHovering && !isDragging && hoverPosition > 0 && hoverPosition < 1) {
      const hoverX = hoverPosition * width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(hoverX - 0.5, 2, 1, h - 4, 0.5);
      ctx.fill();
    }

    // Draw playhead cursor line
    if (progress > 0) {
      const playheadX = progress * width;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = isDragging ? 'rgba(165, 180, 252, 1)' : 'rgba(129, 140, 248, 0.9)';
      ctx.shadowBlur = isDragging ? 12 : 8;
      ctx.beginPath();
      ctx.roundRect(playheadX - (isDragging ? 1.5 : 1), 1, isDragging ? 3 : 2, h - 2, 1);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [defaultPeaks, progress, isHovering, isDragging, hoverPosition, barWidth, barGap, activeColor, inactiveColor, duration, loopRegion]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  // Clean up timers on unmount
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
    if (!containerRef.current || !duration || duration <= 0) return;
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
    const targetTime = ratio * (duration || 0);
    setHoverTime(targetTime);

    lastSeekTimeRef.current = performance.now();
    onSeek(targetTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ratio = calculateRatio(e.clientX);
    setHoverPosition(ratio);
    const targetTime = ratio * (duration || 0);
    setHoverTime(targetTime);

    if (isDraggingRef.current) {
      setDragRatio(ratio);
      emitThrottledSeek(targetTime);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
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

    const ratio = calculateRatio(e.clientX);
    const finalTargetTime = ratio * (duration || 0);

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragRatio(null);

    // Final exact seek on release
    onSeek(finalTargetTime);
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
      className={`relative w-full cursor-pointer select-none group py-1 touch-none ${className}`}
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
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Markers Overlays */}
      {duration > 0 && markers.map((m) => {
        const markerPct = Math.max(0, Math.min(100, (m.time / duration) * 100));
        return (
          <button
            key={m.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkerClick) onMarkerClick(m);
              else onSeek(m.time);
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
      {showHoverTime && isHovering && duration > 0 && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-white bg-zinc-900 border border-zinc-700/60 shadow-lg pointer-events-none transform -translate-x-1/2 transition-opacity duration-150 z-30"
          style={{ left: `${hoverPosition * 100}%` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
};
