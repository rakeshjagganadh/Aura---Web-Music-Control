import React, { useRef, useEffect, useState } from 'react';
import { EqualizerPreset } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { EQ_10_BANDS, SYSTEM_EQ_PRESETS } from '../../services/audioEngine';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Sparkles, 
  Bookmark, 
  Plus, 
  ChevronDown,
  Info,
  Layers
} from 'lucide-react';

const PRESET_CATEGORIES: {
  category: string;
  presets: { id: EqualizerPreset; label: string; desc: string }[];
}[] = [
  {
    category: 'Essential',
    presets: [
      { id: 'flat', label: 'Flat / Neutral', desc: 'Reference studio response' },
      { id: 'bass_boost', label: 'Bass Boost', desc: 'Warm, powerful low-end punch' },
      { id: 'deep_bass', label: 'Deep Sub Bass', desc: 'Extended sub frequencies' },
      { id: 'treble_boost', label: 'Treble Boost', desc: 'Crystal air and high-end sparkle' },
      { id: 'vocal', label: 'Vocal Presence', desc: 'Brings voices forward clearly' },
      { id: 'podcast', label: 'Podcast & Speech', desc: 'High speech intelligibility' },
    ],
  },
  {
    category: 'Genres',
    presets: [
      { id: 'electronic', label: 'Electronic / EDM', desc: 'Deep sub-bass and crisp hats' },
      { id: 'hip_hop', label: 'Hip-Hop / Urban', desc: 'Heavy 808s and vocal clarity' },
      { id: 'rock', label: 'Rock', desc: 'Punchy midrange and guitar bite' },
      { id: 'pop', label: 'Pop', desc: 'Modern polished frequency contour' },
      { id: 'classical', label: 'Classical', desc: 'Wide dynamic orchestral headroom' },
      { id: 'acoustic', label: 'Acoustic', desc: 'Airy warmth for guitar and strings' },
      { id: 'cinematic', label: 'Cinematic Movie', desc: 'Immersive low end and spatial air' },
    ],
  },
  {
    category: 'Activities & Moods',
    presets: [
      { id: 'workout', label: 'Workout Energy', desc: 'Punchy bass & motivating rhythm' },
      { id: 'chill', label: 'Chill & Relax', desc: 'Smooth, warm, non-fatiguing' },
      { id: 'gaming', label: 'Gaming Immersion', desc: 'Enhanced footsteps & spatial cues' },
      { id: 'night', label: 'Late Night', desc: 'Tamed dynamics for quiet listening' },
      { id: 'focus', label: 'Focus & Study', desc: 'Balanced background audio' },
    ],
  },
];

export const Equalizer10Band: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    eqPreset, 
    eqGains, 
    setEQGain, 
    setEQBandQ,
    setEQPreset, 
    resetEQ, 
    userPresets,
    saveCurrentAsPreset,
    isAdvancedMode
  } = useMusic();

  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showQControls, setShowQControls] = useState(false);
  const [bandQs, setBandQs] = useState<number[]>([1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4]);

  // Draw 10-Band EQ Frequency Response Curve
  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const zeroY = height / 2;

    // Draw Subtle Grid Lines (+12, +6, 0, -6, -12 dB)
    const dbLevels = [12, 6, 0, -6, -12];
    dbLevels.forEach((db) => {
      const y = zeroY - (db / 12) * (height / 2 - 12);
      ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = db === 0 ? 1.5 : 1;
      if (db !== 0) ctx.setLineDash([3, 4]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Calculate curve points across the 10 frequency bands (log-distributed)
    const points: { x: number; y: number }[] = [];
    const numBands = EQ_10_BANDS.length;

    for (let i = 0; i < numBands; i++) {
      const x = ((i + 0.5) / numBands) * width;
      const gain = eqGains[i] || 0; // -12 to +12
      const y = zeroY - (gain / 12) * (height / 2 - 14);
      points.push({ x, y });
    }

    if (points.length > 0) {
      // Area under curve
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(129, 140, 248, 0.28)');
      grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, points[0].y);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(width, points[points.length - 1].y);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Main curve stroke
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(129, 140, 248, 0.6)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(0, points[0].y);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(width, points[points.length - 1].y);
      ctx.stroke();

      // Draw point handles
      ctx.shadowBlur = 0;
      points.forEach((p, idx) => {
        const gain = eqGains[idx] || 0;
        ctx.fillStyle = Math.abs(gain) > 0.5 ? '#818cf8' : '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    ctx.restore();
  }, [eqGains]);

  const handleSaveCustomPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;
    await saveCurrentAsPreset(presetNameInput.trim(), 'custom');
    setPresetNameInput('');
    setIsSavingPreset(false);
  };

  const handleQChange = (idx: number, newQ: number) => {
    const next = [...bandQs];
    next[idx] = newQ;
    setBandQs(next);
    setEQBandQ(idx, newQ);
  };

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      
      {/* Header & Preset Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">10-Band Studio Parametric EQ</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-indigo-500/20">
                {eqPreset.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              ISO standard octave bands with ±12 dB high-precision gain and resonance Q control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdvancedMode && (
            <button
              onClick={() => setShowQControls(!showQControls)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                showQControls 
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              {showQControls ? 'Hide Q Filters' : 'Show Q Bandwidth'}
            </button>
          )}

          <button
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/10 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            Save Preset
          </button>

          <button
            onClick={resetEQ}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Flat
          </button>
        </div>
      </div>

      {/* Save Preset Inline Form */}
      {isSavingPreset && (
        <form onSubmit={handleSaveCustomPreset} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-indigo-500/30 animate-in fade-in duration-150">
          <input
            type="text"
            placeholder="Enter custom preset name (e.g. Warm Vinyl, Late Night)..."
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={!presetNameInput.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsSavingPreset(false)}
            className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Category-based Preset Badges */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Acoustic Presets</span>
          <span className="text-[10px] text-zinc-500">Instant curve matching</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_CATEGORIES.flatMap(c => c.presets).map((p) => {
            const isActive = eqPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setEQPreset(p.id)}
                title={p.desc}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-white/5'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Frequency Response Canvas */}
      <div className="relative w-full h-28 rounded-2xl bg-zinc-950/80 border border-white/10 overflow-hidden p-2 shadow-inner">
        <canvas ref={curveCanvasRef} className="w-full h-full block" />
        
        {/* Scale labels */}
        <div className="absolute top-2 left-3 text-[10px] font-mono text-indigo-300/60">+12 dB</div>
        <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[10px] font-mono text-zinc-600">0 dB</div>
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-rose-300/60">-12 dB</div>

        {/* Dynamic center indicator */}
        <div className="absolute top-2 right-3 text-[10px] font-mono text-zinc-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>Real-time DSP Interpolation</span>
        </div>
      </div>

      {/* 10 Vertical Band Faders */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 sm:p-4 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
        {EQ_10_BANDS.map((band, idx) => {
          const gain = eqGains[idx] || 0;
          const qVal = bandQs[idx] || 1.4;

          return (
            <div key={band.freq} className="flex flex-col items-center gap-2 p-1 rounded-xl hover:bg-white/[0.02] transition-colors">
              {/* dB Gain value */}
              <span className={`text-[11px] font-mono font-semibold ${
                gain > 0.1 ? 'text-indigo-400' : gain < -0.1 ? 'text-rose-400' : 'text-zinc-500'
              }`}>
                {gain > 0 ? `+${gain.toFixed(1)}` : `${gain.toFixed(1)}`}
              </span>

              {/* Vertical Slider */}
              <div className="relative flex items-center justify-center h-36">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={gain}
                  onChange={(e) => setEQGain(idx, parseFloat(e.target.value))}
                  className="slider-vertical"
                  aria-label={`${band.label} band gain`}
                />
              </div>

              {/* Frequency Label */}
              <span className="text-xs font-bold text-zinc-200 font-mono tracking-tight">
                {band.label}
              </span>

              {/* Band Character Description */}
              <span className="text-[10px] text-zinc-500 text-center leading-tight line-clamp-1">
                {band.description}
              </span>

              {/* Advanced Q Bandwidth input */}
              {showQControls && (
                <div className="flex flex-col items-center gap-0.5 mt-1 pt-1 border-t border-white/5 w-full">
                  <span className="text-[9px] font-mono text-zinc-500">Q:{qVal.toFixed(1)}</span>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={qVal}
                    onChange={(e) => handleQChange(idx, parseFloat(e.target.value))}
                    className="w-full h-1"
                    title={`Q factor for ${band.label}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
