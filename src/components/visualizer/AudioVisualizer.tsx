import React, { useRef, useEffect, useState } from 'react';
import { VisualizerMode } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { useMusic } from '../../context/MusicContext';
import { BarChart3, Activity, Disc3, Minus, Youtube } from 'lucide-react';

interface AudioVisualizerProps {
  mode?: VisualizerMode;
  onModeChange?: (mode: VisualizerMode) => void;
  height?: number;
  className?: string;
  showControls?: boolean;
  accentColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'spectrum',
  onModeChange,
  height = 180,
  className = '',
  showControls = true,
  accentColor = '#818cf8',
}) => {
  const { currentTrack, isPlaying, currentTime, duration, isDirectStreamActive } = useMusic();
  const isYouTubeTrack = currentTrack?.source === 'youtube';
  const usesSyntheticVisualizer = isYouTubeTrack || isDirectStreamActive;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [currentMode, setCurrentMode] = useState<VisualizerMode>(mode);

  // Peak hold data for spectrum
  const peakHoldRef = useRef<number[]>([]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const handleModeSelect = (m: VisualizerMode) => {
    setCurrentMode(m);
    onModeChange?.(m);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const binCount = 128;
    const freqData = new Uint8Array(binCount);
    const timeData = new Uint8Array(binCount);

    if (peakHoldRef.current.length !== binCount) {
      peakHoldRef.current = new Array(binCount).fill(0);
    }

    let frameCount = 0;

    const render = () => {
      animationFrameId.current = requestAnimationFrame(render);
      frameCount++;

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

      if (usesSyntheticVisualizer) {
        // --- SOURCE-AWARE PLAYBACK VISUALIZATION (YouTube & Direct CORS-fallback Streams) ---
        // Generates organic, fluid waveforms and rhythmic motion without raw PCM FFT access
        const progress = duration > 0 ? currentTime / duration : 0;
        const timeFactor = isPlaying ? frameCount * 0.03 : 0;

        if (currentMode === 'spectrum') {
          // Playback-progress animated wave bars
          const barCount = 48;
          const barWidth = Math.max(3, (width / barCount) - 3);
          const gap = (width - (barCount * barWidth)) / (barCount - 1 || 1);

          for (let i = 0; i < barCount; i++) {
            const barProgress = i / barCount;
            // Generate fluid harmonic height
            const wave1 = Math.sin(barProgress * Math.PI * 3 + timeFactor) * 0.5 + 0.5;
            const wave2 = Math.cos(barProgress * Math.PI * 5 - timeFactor * 0.8) * 0.3 + 0.3;
            const centerBell = Math.sin(barProgress * Math.PI);
            
            const rawVal = isPlaying ? (wave1 * 0.6 + wave2 * 0.4) * centerBell * 200 + 20 : 15;
            const barHeight = Math.max(4, (rawVal / 255) * (h - 25));
            const x = i * (barWidth + gap);
            const y = h - barHeight - 6;

            const isPassed = barProgress <= progress;

            const grad = ctx.createLinearGradient(x, h, x, y);
            if (isPassed) {
              grad.addColorStop(0, isYouTubeTrack ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)');
              grad.addColorStop(0.7, isYouTubeTrack ? '#f87171' : '#38bdf8');
              grad.addColorStop(1, '#ffffff');
            } else {
              grad.addColorStop(0, 'rgba(129, 140, 248, 0.1)');
              grad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 2);
            ctx.fill();
          }
        } else if (currentMode === 'waveform') {
          // Oscilloscope flowing sinusoidal waves
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = isPlaying ? '#f87171' : 'rgba(255,255,255,0.3)';
          ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
          ctx.shadowBlur = isPlaying ? 10 : 0;

          ctx.beginPath();
          const points = 100;
          for (let i = 0; i <= points; i++) {
            const t = i / points;
            const x = t * width;
            const amplitude = isPlaying ? (h * 0.25) * Math.sin(t * Math.PI) : 0;
            const y = (h / 2) + Math.sin(t * Math.PI * 4 + timeFactor) * amplitude;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (currentMode === 'circular') {
          // Orbiting playback ring
          const centerX = width / 2;
          const centerY = h / 2;
          const baseRadius = Math.min(centerX, centerY) * 0.45;
          const totalPoints = 64;

          ctx.strokeStyle = isPlaying ? '#f87171' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();

          for (let i = 0; i <= totalPoints; i++) {
            const angle = (i / totalPoints) * Math.PI * 2;
            const wave = isPlaying ? Math.sin(angle * 6 + timeFactor) * 8 : 0;
            const r = baseRadius + wave;
            const px = centerX + Math.cos(angle) * r;
            const py = centerY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        } else {
          // Minimal pulse line
          const centerY = h / 2;
          const pulseWidth = width * (0.4 + (isPlaying ? Math.sin(timeFactor) * 0.2 : 0));
          const startX = (width - pulseWidth) / 2;

          const grad = ctx.createLinearGradient(startX, centerY, startX + pulseWidth, centerY);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
          grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.lineWidth = 3;
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(startX, centerY);
          ctx.lineTo(startX + pulseWidth, centerY);
          ctx.stroke();
        }

      } else {
        // --- REAL-TIME AUDIO SPECTRUM (Local Web Audio DSP) ---
        audioEngine.getFrequencyData(freqData);
        audioEngine.getTimeDomainData(timeData);

        const activePlaying = audioEngine.isPlaying();

        if (currentMode === 'spectrum') {
          const barCount = 48;
          const barWidth = Math.max(3, (width / barCount) - 3);
          const gap = (width - (barCount * barWidth)) / (barCount - 1 || 1);

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * (binCount * 0.75));
            let rawVal = freqData[dataIndex] || 0;
            if (!activePlaying) rawVal = 0;

            const barHeight = Math.max(3, (rawVal / 255) * (h - 20));
            const x = i * (barWidth + gap);
            const y = h - barHeight - 4;

            if (rawVal > (peakHoldRef.current[i] || 0)) {
              peakHoldRef.current[i] = rawVal;
            } else {
              peakHoldRef.current[i] = Math.max(0, (peakHoldRef.current[i] || 0) - 1.5);
            }
            const peakY = h - ((peakHoldRef.current[i] / 255) * (h - 20)) - 6;

            const grad = ctx.createLinearGradient(x, h, x, y);
            grad.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
            grad.addColorStop(0.7, accentColor);
            grad.addColorStop(1, '#c084fc');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 2);
            ctx.fill();

            if (peakHoldRef.current[i] > 10) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x, Math.max(2, peakY), barWidth, 1.5);
            }
          }
        } else if (currentMode === 'waveform') {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = accentColor;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.7)';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          const sliceWidth = width / (binCount - 1);
          let x = 0;

          for (let i = 0; i < binCount; i++) {
            const v = activePlaying ? (timeData[i] / 128.0) : 1.0;
            const y = (v * h) / 2;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.lineWidth = 1.0;
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < binCount; i++) {
            const v = activePlaying ? (timeData[i] / 128.0) : 1.0;
            const y = ((v - 1.0) * 0.6 + 1.0) * (h / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        } else if (currentMode === 'circular') {
          const centerX = width / 2;
          const centerY = h / 2;
          const baseRadius = Math.min(centerX, centerY) * 0.45;
          const totalPoints = 64;

          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(129, 140, 248, 0.6)';
          ctx.shadowBlur = 10;

          ctx.beginPath();
          for (let i = 0; i <= totalPoints; i++) {
            const idx = (i % totalPoints);
            const dataIdx = Math.floor((idx / totalPoints) * (binCount * 0.6));
            const val = activePlaying ? (freqData[dataIdx] / 255) : 0;
            const angle = (idx / totalPoints) * Math.PI * 2;
            const r = baseRadius + (val * 32);

            const px = centerX + Math.cos(angle) * r;
            const py = centerY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          const centerY = h / 2;
          const avg = activePlaying
            ? freqData.slice(0, 32).reduce((a, b) => a + b, 0) / (32 * 255)
            : 0;

          const pulseWidth = width * (0.3 + avg * 0.65);
          const startX = (width - pulseWidth) / 2;

          const grad = ctx.createLinearGradient(startX, centerY, startX + pulseWidth, centerY);
          grad.addColorStop(0, 'rgba(129, 140, 248, 0)');
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.4 + avg * 0.6})`);
          grad.addColorStop(1, 'rgba(129, 140, 248, 0)');

          ctx.lineWidth = 2 + avg * 4;
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(startX, centerY);
          ctx.lineTo(startX + pulseWidth, centerY);
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [currentMode, accentColor, usesSyntheticVisualizer, isYouTubeTrack, isPlaying, currentTime, duration]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-950/40 border border-white/5 ${className}`}>
      {/* Live Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height }}
      />

      {/* Source-Aware Status Indicator */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/80 border border-white/10 backdrop-blur-md z-10">
        {isYouTubeTrack ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-red-300">
            <Youtube className="w-3 h-3 text-red-400" />
            <span>PLAYBACK VISUALIZATION</span>
          </div>
        ) : isDirectStreamActive ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-sky-300">
            <Activity className="w-3 h-3 text-sky-400" />
            <span>AMBIENT VISUAL (NO WEB AUDIO FFT)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-300">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>REAL-TIME ANALYSIS</span>
          </div>
        )}
      </div>

      {/* Mode Switcher Toggle Bar */}
      {showControls && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900/80 border border-white/10 backdrop-blur-md z-10">
          <button
            type="button"
            onClick={() => handleModeSelect('spectrum')}
            title="Spectrum Wave"
            aria-label="Spectrum Wave mode"
            className={`p-1.5 rounded-md transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'spectrum'
                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('waveform')}
            title="Oscilloscope Waveform"
            aria-label="Oscilloscope Waveform mode"
            className={`p-1.5 rounded-md transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'waveform'
                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('circular')}
            title="Circular Orbit"
            aria-label="Circular Orbit mode"
            className={`p-1.5 rounded-md transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'circular'
                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('minimal')}
            title="Minimal Pulse"
            aria-label="Minimal Pulse mode"
            className={`p-1.5 rounded-md transition-colors cursor-pointer aura-focus-ring ${
              currentMode === 'minimal'
                ? 'bg-indigo-600/30 text-indigo-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

