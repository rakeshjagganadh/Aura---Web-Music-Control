import React, { useRef, useEffect, useState } from 'react';
import { VisualizerMode } from '../../types';
import { useMusic } from '../../context/MusicContext';
import {
  audioAnalysisPipeline,
  AnalysisCapabilityState,
  AnalysisSourceType,
} from '../../services/audioAnalysisPipeline';
import { AuraIcon } from '../ui/AuraIcon';

interface AudioVisualizerProps {
  mode?: VisualizerMode;
  onModeChange?: (mode: VisualizerMode) => void;
  height?: number;
  className?: string;
  showControls?: boolean;
  accentColor?: string;
}

type CanonicalVisualizerMode = 'spectrum' | 'waveform' | 'circular' | 'minimal';

function normalizeMode(mode: VisualizerMode | undefined): CanonicalVisualizerMode {
  switch (mode) {
    case 'waveform':
    case 'wave':
      return 'waveform';
    case 'circular':
    case 'radial':
      return 'circular';
    case 'minimal':
      return 'minimal';
    case 'spectrum':
    case 'bars':
    default:
      return 'spectrum';
  }
}

interface StatusBadgeState {
  capability: AnalysisCapabilityState;
  sourceType: AnalysisSourceType;
  sourceLabel: string;
  unavailableReason: string | null;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'spectrum',
  onModeChange,
  height = 180,
  className = '',
  showControls = true,
  accentColor = '#38bdf8',
}) => {
  const { currentTrack, isPlaying, currentTime, duration } = useMusic();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const [currentMode, setCurrentMode] = useState<CanonicalVisualizerMode>(() => normalizeMode(mode));
  const [badgeState, setBadgeState] = useState<StatusBadgeState>({
    capability: 'ANALYSIS_SILENT',
    sourceType: 'none',
    sourceLabel: 'STANDBY',
    unavailableReason: null,
    isPlaying: false,
  });

  // Live refs so rAF loop never tears down on currentTime/track progress ticks
  const modeRef = useRef<CanonicalVisualizerMode>(currentMode);
  const trackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const accentColorRef = useRef(accentColor);
  const badgeKeyRef = useRef('');
  const modeFadeRef = useRef(1);
  const lastModeRef = useRef<CanonicalVisualizerMode>(currentMode);

  useEffect(() => {
    const normalized = normalizeMode(mode);
    setCurrentMode(normalized);
  }, [mode]);

  useEffect(() => {
    if (lastModeRef.current !== currentMode) {
      modeFadeRef.current = 0.15;
      lastModeRef.current = currentMode;
    }
    modeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    trackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    accentColorRef.current = accentColor;
  }, [accentColor]);

  const handleModeSelect = (next: 'spectrum' | 'waveform' | 'circular') => {
    setCurrentMode(next);
    onModeChange?.(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reducedMotionMql =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let prefersReducedMotion = Boolean(reducedMotionMql?.matches);
    let isElementVisible = true;
    let isDocumentHidden = typeof document !== 'undefined' ? document.hidden : false;

    let logicalWidth = container.clientWidth || 320;
    let logicalHeight = container.clientHeight || height;
    let currentDpr = Math.min(window.devicePixelRatio || 1, 2);

    // Pre-cached gradients rebuilt only on resize or accentColor change
    let cachedGradW = 0;
    let cachedGradH = 0;
    let cachedGradAccent = '';
    let spectrumBarGrad: CanvasGradient | null = null;
    let waveStrokeGrad: CanvasGradient | null = null;
    let waveFillGrad: CanvasGradient | null = null;
    let radialEnvelopeGrad: CanvasGradient | null = null;

    const ensureCanvasSize = () => {
      const nextW = container.clientWidth || 320;
      const nextH = container.clientHeight || height;
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      if (
        nextW !== logicalWidth ||
        nextH !== logicalHeight ||
        nextDpr !== currentDpr ||
        canvas.width !== Math.round(nextW * nextDpr) ||
        canvas.height !== Math.round(nextH * nextDpr)
      ) {
        logicalWidth = nextW;
        logicalHeight = nextH;
        currentDpr = nextDpr;
        canvas.width = Math.max(1, Math.round(nextW * nextDpr));
        canvas.height = Math.max(1, Math.round(nextH * nextDpr));
      }
    };

    const ensureGradients = (w: number, h: number, accent: string) => {
      if (
        cachedGradW === w &&
        cachedGradH === h &&
        cachedGradAccent === accent &&
        spectrumBarGrad &&
        waveStrokeGrad &&
        waveFillGrad &&
        radialEnvelopeGrad
      ) {
        return;
      }

      cachedGradW = w;
      cachedGradH = h;
      cachedGradAccent = accent;

      const sGrad = ctx.createLinearGradient(0, h, 0, 12);
      sGrad.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
      sGrad.addColorStop(0.45, '#6366f1');
      sGrad.addColorStop(0.82, accent);
      sGrad.addColorStop(1, '#e0f2fe');
      spectrumBarGrad = sGrad;

      const wsGrad = ctx.createLinearGradient(0, 0, w, 0);
      wsGrad.addColorStop(0, '#6366f1');
      wsGrad.addColorStop(0.5, accent);
      wsGrad.addColorStop(1, '#a78bfa');
      waveStrokeGrad = wsGrad;

      const wfGrad = ctx.createLinearGradient(0, 8, 0, h - 8);
      wfGrad.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
      wfGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
      wfGrad.addColorStop(1, 'rgba(167, 139, 250, 0.18)');
      waveFillGrad = wfGrad;

      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.min(cx, cy) * 0.88;
      const rGrad = ctx.createRadialGradient(cx, cy, maxR * 0.25, cx, cy, maxR);
      rGrad.addColorStop(0, 'rgba(99, 102, 241, 0.04)');
      rGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.12)');
      rGrad.addColorStop(1, 'rgba(167, 139, 250, 0.02)');
      radialEnvelopeGrad = rGrad;
    };

    ensureCanvasSize();

    let lastRenderTimestamp = 0;

    const drawPassiveProgress = (w: number, h: number) => {
      const dur = durationRef.current;
      const cur = currentTimeRef.current;
      if (dur > 0 && cur > 0) {
        const pct = Math.max(0, Math.min(1, cur / dur));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(14, h - 4, w - 28, 1.5);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.fillRect(14, h - 4, (w - 28) * pct, 1.5);
      }
    };

    const drawSpectrum = (
      w: number,
      h: number,
      bands: Float32Array,
      bandPeaks: Float32Array,
      isAvailable: boolean,
      isUnavailable: boolean
    ) => {
      const showFreqLabels = h >= 125;
      const topPad = 32;
      const bottomPad = showFreqLabels ? 20 : 10;
      const sidePad = 14;
      const usableW = Math.max(40, w - sidePad * 2);
      const usableH = Math.max(24, h - topPad - bottomPad);
      const baseY = h - bottomPad;

      // Subtle calibrated horizontal dB grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.038)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let g = 1; g <= 3; g++) {
        const gy = Math.round(topPad + (usableH * g) / 4) + 0.5;
        ctx.moveTo(sidePad, gy);
        ctx.lineTo(w - sidePad, gy);
      }
      ctx.stroke();

      // Baseline rule
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(sidePad, baseY + 0.5);
      ctx.lineTo(w - sidePad, baseY + 0.5);
      ctx.stroke();

      if (showFreqLabels) {
        const ticks = [
          { label: '60', norm: 0.14 },
          { label: '250', norm: 0.36 },
          { label: '1K', norm: 0.58 },
          { label: '4K', norm: 0.79 },
          { label: '12K', norm: 0.94 },
        ];
        ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.textAlign = 'center';
        for (let t = 0; t < ticks.length; t++) {
          ctx.fillText(ticks[t].label, sidePad + ticks[t].norm * usableW, h - 6);
        }
      }

      const barCount = w < 340 ? 40 : w < 540 ? 52 : 64;
      const slotW = usableW / barCount;
      const barGap = Math.max(1.5, Math.min(3.5, slotW * 0.28));
      const barW = Math.max(2, slotW - barGap);
      const radius = Math.min(2.5, barW * 0.4);

      if (isUnavailable) {
        // Honest resting baseline ticks when FFT is unavailable — zero fake spectrum movement
        ctx.fillStyle = 'rgba(255, 255, 255, 0.065)';
        for (let i = 0; i < barCount; i++) {
          const x = sidePad + i * slotW + barGap * 0.5;
          ctx.fillRect(x, baseY - 2, barW, 2);
        }
        drawPassiveProgress(w, h);
        return;
      }

      for (let i = 0; i < barCount; i++) {
        // Resample smoothly from 64 logarithmic bands
        const bandPos = (i / (barCount - 1)) * (bands.length - 1);
        const b0 = Math.floor(bandPos);
        const b1 = Math.min(bands.length - 1, b0 + 1);
        const frac = bandPos - b0;

        const level = bands[b0] + (bands[b1] - bands[b0]) * frac;
        const peakLevel = bandPeaks[b0] + (bandPeaks[b1] - bandPeaks[b0]) * frac;
        const x = sidePad + i * slotW + barGap * 0.5;

        // Subtle inactive bed marker so active vs inactive spectrum slots are legible
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, baseY - 2, barW, 2);

        if (level > 0.004) {
          const barH = Math.max(2.5, level * usableH);
          const y = baseY - barH;

          ctx.fillStyle = spectrumBarGrad || accentColorRef.current;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [radius, radius, 0, 0]);
          ctx.fill();

          // Crisp crest highlight on energized bars
          if (level > 0.14) {
            ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
            ctx.fillRect(x, y, barW, 1.5);
          }
        }

        // Peak-hold hairline cap
        if (isAvailable && peakLevel > 0.035) {
          const peakY = Math.max(topPad, baseY - peakLevel * usableH - 3);
          ctx.fillStyle = 'rgba(224, 242, 254, 0.68)';
          ctx.fillRect(x, peakY, barW, 1.25);
        }
      }
    };

    const drawWaveform = (
      w: number,
      h: number,
      waveformPoints: Float32Array,
      rms: number,
      isAvailable: boolean,
      isUnavailable: boolean
    ) => {
      const sidePad = 14;
      const topPad = 28;
      const bottomPad = 12;
      const usableW = Math.max(40, w - sidePad * 2);
      const midY = topPad + (h - topPad - bottomPad) * 0.5;
      const maxAmp = Math.max(18, (h - topPad - bottomPad) * 0.45);

      // Oscilloscope graticule (+/- 0.5 guides and 0.0 reference axis)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sidePad, Math.round(midY - maxAmp * 0.55) + 0.5);
      ctx.lineTo(w - sidePad, Math.round(midY - maxAmp * 0.55) + 0.5);
      ctx.moveTo(sidePad, Math.round(midY + maxAmp * 0.55) + 0.5);
      ctx.lineTo(w - sidePad, Math.round(midY + maxAmp * 0.55) + 0.5);
      ctx.stroke();

      // Zero reference centerline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.beginPath();
      ctx.moveTo(sidePad, Math.round(midY) + 0.5);
      ctx.lineTo(w - sidePad, Math.round(midY) + 0.5);
      ctx.stroke();

      if (isUnavailable) {
        // Calm reference horizon line when source does not expose audio waveform
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sidePad, midY);
        ctx.lineTo(w - sidePad, midY);
        ctx.stroke();
        drawPassiveProgress(w, h);
        return;
      }

      const len = waveformPoints.length;
      const stepX = usableW / (len - 1);

      // Build smooth quadratic midpoint curve and translucent ribbon fill
      ctx.beginPath();
      ctx.moveTo(sidePad, midY);
      const firstY = midY - waveformPoints[0] * maxAmp;
      ctx.lineTo(sidePad, firstY);

      for (let i = 1; i < len - 1; i++) {
        const x0 = sidePad + i * stepX;
        const y0 = midY - waveformPoints[i] * maxAmp;
        const x1 = sidePad + (i + 1) * stepX;
        const y1 = midY - waveformPoints[i + 1] * maxAmp;
        const xc = (x0 + x1) * 0.5;
        const yc = (y0 + y1) * 0.5;
        ctx.quadraticCurveTo(x0, y0, xc, yc);
      }

      const lastX = sidePad + (len - 1) * stepX;
      const lastY = midY - waveformPoints[len - 1] * maxAmp;
      ctx.lineTo(lastX, lastY);
      ctx.lineTo(lastX, midY);
      ctx.closePath();

      if (waveFillGrad && (isAvailable || rms > 0.001)) {
        ctx.fillStyle = waveFillGrad;
        ctx.fill();
      }

      // Primary oscilloscope trace
      ctx.beginPath();
      ctx.moveTo(sidePad, firstY);
      for (let i = 1; i < len - 1; i++) {
        const x0 = sidePad + i * stepX;
        const y0 = midY - waveformPoints[i] * maxAmp;
        const x1 = sidePad + (i + 1) * stepX;
        const y1 = midY - waveformPoints[i + 1] * maxAmp;
        ctx.quadraticCurveTo(x0, y0, (x0 + x1) * 0.5, (y0 + y1) * 0.5);
      }
      ctx.lineTo(lastX, lastY);

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = isAvailable ? (waveStrokeGrad || accentColorRef.current) : 'rgba(148, 163, 184, 0.45)';
      if (isAvailable && !prefersReducedMotion && rms > 0.015) {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
        ctx.shadowBlur = 7;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Delicate inner luminance core when active
      if (isAvailable && rms > 0.01) {
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.35)';
        ctx.stroke();
      }
    };

    const drawRadial = (
      w: number,
      h: number,
      bands: Float32Array,
      lowEnergy: number,
      rms: number,
      isAvailable: boolean,
      isUnavailable: boolean
    ) => {
      const cx = w * 0.5;
      const cy = h * 0.5 + 4;
      const maxOuterR = Math.max(24, Math.min(w * 0.44, (h - 24) * 0.46));
      const innerR = maxOuterR * (0.42 + (isAvailable ? lowEnergy * 0.055 : 0));
      const barSpan = maxOuterR - innerR;

      // Concentric calibrated reference circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR + barSpan * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, maxOuterR, 0, Math.PI * 2);
      ctx.stroke();

      // Core aperture ring
      ctx.strokeStyle = isAvailable
        ? `rgba(125, 211, 252, ${(0.25 + lowEnergy * 0.45).toFixed(2)})`
        : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = isAvailable ? 1.5 + lowEnergy * 1.2 : 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();

      if (isUnavailable) {
        drawPassiveProgress(w, h);
        return;
      }

      // Bilateral symmetric circular spectrum (72 spokes):
      // 6 o'clock (+PI/2) anchors bass symmetrically, sweeping through mids to 12 o'clock (-PI/2) highs
      const totalSpokes = 72;
      const halfSpokes = totalSpokes / 2;

      // 1. Subtle radial harmonic envelope fill & contour
      ctx.beginPath();
      for (let i = 0; i <= totalSpokes; i++) {
        const spokeIdx = i % totalSpokes;
        const mirrorDist =
          spokeIdx <= halfSpokes
            ? spokeIdx / halfSpokes
            : (totalSpokes - spokeIdx) / halfSpokes;
        // Map mirrorDist 0..1 -> logarithmic bands 0..60
        const bandPos = mirrorDist * (bands.length - 4);
        const b0 = Math.floor(bandPos);
        const b1 = Math.min(bands.length - 1, b0 + 1);
        const frac = bandPos - b0;
        const energy = bands[b0] + (bands[b1] - bands[b0]) * frac;

        const angle = Math.PI * 0.5 + (spokeIdx / totalSpokes) * Math.PI * 2;
        const r = innerR + energy * barSpan * 0.96;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      if (radialEnvelopeGrad && (isAvailable || rms > 0.002)) {
        ctx.fillStyle = radialEnvelopeGrad;
        ctx.fill();
      }

      ctx.strokeStyle = isAvailable ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // 2. Crisp precision radial frequency bars
      ctx.lineCap = 'round';
      for (let i = 0; i < totalSpokes; i++) {
        const mirrorDist =
          i <= halfSpokes ? i / halfSpokes : (totalSpokes - i) / halfSpokes;
        const bandPos = mirrorDist * (bands.length - 4);
        const b0 = Math.floor(bandPos);
        const b1 = Math.min(bands.length - 1, b0 + 1);
        const frac = bandPos - b0;
        const energy = bands[b0] + (bands[b1] - bands[b0]) * frac;

        const angle = Math.PI * 0.5 + (i / totalSpokes) * Math.PI * 2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rStart = innerR + 2;
        const rEnd = rStart + Math.max(2, energy * barSpan * 0.95);

        ctx.strokeStyle =
          energy > 0.48
            ? 'rgba(224, 242, 254, 0.88)'
            : energy > 0.14
            ? accentColorRef.current
            : 'rgba(129, 140, 248, 0.32)';
        ctx.lineWidth = Math.max(1.3, (maxOuterR * 2 * Math.PI) / (totalSpokes * 2.8));
        ctx.beginPath();
        ctx.moveTo(cx + cosA * rStart, cy + sinA * rStart);
        ctx.lineTo(cx + cosA * rEnd, cy + sinA * rEnd);
        ctx.stroke();
      }
    };

    const drawMinimal = (
      w: number,
      h: number,
      rms: number,
      lowEnergy: number,
      isAvailable: boolean,
      isUnavailable: boolean
    ) => {
      const cy = h * 0.5;
      const sidePad = 24;
      const maxW = Math.max(40, w - sidePad * 2);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sidePad, cy);
      ctx.lineTo(w - sidePad, cy);
      ctx.stroke();

      if (isUnavailable) {
        drawPassiveProgress(w, h);
        return;
      }

      const energy = isAvailable ? Math.min(1, rms * 1.6 + lowEnergy * 0.45) : 0;
      const span = maxW * (0.28 + energy * 0.72);
      const x0 = (w - span) * 0.5;
      ctx.strokeStyle = waveStrokeGrad || accentColorRef.current;
      ctx.lineWidth = 1.5 + energy * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, cy);
      ctx.lineTo(x0 + span, cy);
      ctx.stroke();
    };

    const renderFrame = (now: number) => {
      animationFrameId.current = null;
      if (isDocumentHidden || !isElementVisible) return;

      animationFrameId.current = requestAnimationFrame(renderFrame);

      // Throttle cleanly under prefers-reduced-motion (~12fps)
      if (prefersReducedMotion && now - lastRenderTimestamp < 80) {
        return;
      }
      lastRenderTimestamp = now;

      ensureCanvasSize();
      const w = logicalWidth;
      const h = logicalHeight;
      const accent = accentColorRef.current;
      ensureGradients(w, h, accent);

      const analysis = audioAnalysisPipeline.sample(
        trackRef.current,
        isPlayingRef.current,
        now
      );

      // Update React badge state ONLY when status actually changes (zero 60fps re-renders)
      const nextBadgeKey = `${analysis.capability}|${analysis.sourceType}|${analysis.sourceLabel}|${analysis.isPlaying}`;
      if (nextBadgeKey !== badgeKeyRef.current) {
        badgeKeyRef.current = nextBadgeKey;
        setBadgeState({
          capability: analysis.capability,
          sourceType: analysis.sourceType,
          sourceLabel: analysis.sourceLabel,
          unavailableReason: analysis.unavailableReason,
          isPlaying: analysis.isPlaying,
        });
      }

      // Smooth mode transition fade
      if (modeFadeRef.current < 1) {
        modeFadeRef.current = prefersReducedMotion ? 1 : Math.min(1, modeFadeRef.current + 0.14);
      }

      ctx.save();
      ctx.scale(currentDpr, currentDpr);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = modeFadeRef.current;

      const isAvailable = analysis.capability === 'ANALYSIS_AVAILABLE';
      const isUnavailable = analysis.capability === 'ANALYSIS_UNAVAILABLE';
      const activeMode = modeRef.current;

      if (activeMode === 'spectrum') {
        drawSpectrum(w, h, analysis.bands, analysis.bandPeaks, isAvailable, isUnavailable);
      } else if (activeMode === 'waveform') {
        drawWaveform(w, h, analysis.waveformPoints, analysis.rms, isAvailable, isUnavailable);
      } else if (activeMode === 'circular') {
        drawRadial(w, h, analysis.bands, analysis.lowEnergy, analysis.rms, isAvailable, isUnavailable);
      } else {
        drawMinimal(w, h, analysis.rms, analysis.lowEnergy, isAvailable, isUnavailable);
      }

      ctx.restore();
    };

    const startLoop = () => {
      if (animationFrameId.current === null && !isDocumentHidden && isElementVisible) {
        animationFrameId.current = requestAnimationFrame(renderFrame);
      }
    };

    const stopLoop = () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => ensureCanvasSize())
        : null;
    resizeObserver?.observe(container);

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              isElementVisible = entry ? entry.isIntersecting : true;
              if (isElementVisible && !isDocumentHidden) {
                startLoop();
              } else {
                stopLoop();
              }
            },
            { threshold: 0.02 }
          )
        : null;
    intersectionObserver?.observe(container);

    const handleVisibilityChange = () => {
      isDocumentHidden = document.hidden;
      if (isDocumentHidden) {
        stopLoop();
      } else if (isElementVisible) {
        startLoop();
      }
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotionMql?.addEventListener?.('change', handleReducedMotionChange);

    startLoop();

    return () => {
      stopLoop();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotionMql?.removeEventListener?.('change', handleReducedMotionChange);
    };
  }, [height]);

  const statusDotClass =
    badgeState.capability === 'ANALYSIS_AVAILABLE'
      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.75)]'
      : badgeState.capability === 'ANALYSIS_INITIALIZING'
      ? 'bg-sky-400'
      : badgeState.capability === 'ANALYSIS_UNAVAILABLE'
      ? 'bg-slate-400'
      : 'bg-zinc-500';

  const statusText =
    badgeState.capability === 'ANALYSIS_AVAILABLE'
      ? `LIVE FFT • ${badgeState.sourceLabel}`
      : badgeState.capability === 'ANALYSIS_INITIALIZING'
      ? 'INITIALIZING FFT'
      : badgeState.capability === 'ANALYSIS_UNAVAILABLE'
      ? `ANALYSIS UNAVAILABLE • ${badgeState.sourceLabel}`
      : badgeState.isPlaying
      ? 'SILENT SIGNAL'
      : 'STANDBY';

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl bg-zinc-950/60 border border-white/[0.06] ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height }}
      />

      {/* Honest Capability Indicator */}
      <div className="pointer-events-none absolute top-2 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950/75 border border-white/[0.08] backdrop-blur-md z-10">
        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
        <span className="text-[10px] font-mono tracking-wide text-zinc-300">
          {statusText}
        </span>
      </div>

      {/* Restrained Notice When Raw PCM/FFT Is Unavailable */}
      {badgeState.capability === 'ANALYSIS_UNAVAILABLE' && (
        <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-center z-10">
          <span className="px-2.5 py-0.5 rounded bg-zinc-950/80 border border-white/[0.06] text-[10px] font-mono text-zinc-400 text-center truncate max-w-full">
            {badgeState.unavailableReason || 'Real-time audio FFT is restricted by this source.'}
          </span>
        </div>
      )}

      {/* Optional Inline Mode Switcher (used in StudioView) */}
      {showControls && (
        <div className="absolute top-2 right-2.5 flex items-center gap-1 p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.08] backdrop-blur-md z-10">
          <button
            type="button"
            onClick={() => handleModeSelect('spectrum')}
            title="Spectrum"
            aria-label="Spectrum mode"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'spectrum'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AuraIcon name="equalizer" size={12} />
            <span className="hidden sm:inline">Spectrum</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('waveform')}
            title="Wave"
            aria-label="Wave mode"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'waveform'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AuraIcon name="waves" size={12} />
            <span className="hidden sm:inline">Wave</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('circular')}
            title="Radial"
            aria-label="Radial mode"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'circular'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AuraIcon name="disc" size={12} />
            <span className="hidden sm:inline">Radial</span>
          </button>
        </div>
      )}
    </div>
  );
};
