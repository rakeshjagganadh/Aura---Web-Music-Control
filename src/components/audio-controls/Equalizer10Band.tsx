import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { EqualizerPreset } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { EQ_10_BANDS } from '../../services/audioEngine';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Bookmark, 
  Check,
  Zap
} from 'lucide-react';

const PRESET_GROUPS: {
  category: string;
  presets: { id: EqualizerPreset; label: string; desc: string }[];
}[] = [
  {
    category: 'Reference & Core',
    presets: [
      { id: 'flat', label: 'Flat', desc: '0 dB uncolored studio reference response' },
      { id: 'bass_boost', label: 'Bass Boost', desc: 'Warm low-end enhancement for punch' },
      { id: 'deep_bass', label: 'Deep Sub', desc: 'Sub-bass extension below 80 Hz' },
      { id: 'treble_boost', label: 'Treble Boost', desc: 'Crisp presence and high-frequency sparkle' },
      { id: 'vocal', label: 'Vocal Presence', desc: 'Brings lead vocals forward in the mix' },
      { id: 'podcast', label: 'Speech & Podcast', desc: 'High speech intelligibility and low cut' },
    ],
  },
  {
    category: 'Genres',
    presets: [
      { id: 'electronic', label: 'Electronic', desc: 'Deep sub-bass and bright hi-hat sizzle' },
      { id: 'hip_hop', label: 'Hip-Hop', desc: 'Heavy 808 sub punch with clean vocals' },
      { id: 'rock', label: 'Rock', desc: 'Punchy midrange crunch and guitar definition' },
      { id: 'pop', label: 'Pop', desc: 'Modern polished vocal & beat balance' },
      { id: 'acoustic', label: 'Acoustic', desc: 'Airy warmth for guitars, piano & strings' },
      { id: 'classical', label: 'Classical', desc: 'Natural orchestral dynamic headroom' },
      { id: 'cinematic', label: 'Cinematic', desc: 'Deep theater sub-rumble and open air' },
    ],
  },
  {
    category: 'Environments & Moods',
    presets: [
      { id: 'chill', label: 'Chill & Relax', desc: 'Smooth, non-fatiguing warm response' },
      { id: 'night', label: 'Late Night', desc: 'Tamed sub-bass and harsh transients' },
      { id: 'focus', label: 'Focus & Study', desc: 'Balanced non-distracting background curve' },
      { id: 'workout', label: 'Workout Energy', desc: 'Driving bass and energetic highs' },
      { id: 'gaming', label: 'Gaming', desc: 'Enhanced positional footsteps & cues' },
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
  const [bandQs, setBandQs] = useState<number[]>([0.7, 1.2, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 0.7]);

  // Real-time Frequency Response Curve Canvas
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

    // dB Grid Reference Lines (+12, +6, 0, -6, -12)
    const dbLevels = [12, 6, 0, -6, -12];
    dbLevels.forEach((db) => {
      const y = zeroY - (db / 12) * (height / 2 - 12);
      ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = db === 0 ? 1.5 : 1;
      if (db !== 0) ctx.setLineDash([3, 4]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Curve points log-distributed across 10 bands
    const points: { x: number; y: number }[] = [];
    const numBands = EQ_10_BANDS.length;

    for (let i = 0; i < numBands; i++) {
      const x = ((i + 0.5) / numBands) * width;
      const gain = eqGains[i] || 0; // -12 to +12 dB
      const y = zeroY - (gain / 12) * (height / 2 - 14);
      points.push({ x, y });
    }

    if (points.length > 0) {
      // Area gradient fill
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
      grad.addColorStop(0.5, 'rgba(79, 70, 229, 0.08)');
      grad.addColorStop(1, 'rgba(79, 70, 229, 0)');

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
      ctx.shadowColor = 'rgba(129, 140, 248, 0.5)';
      ctx.shadowBlur = 8;

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

      // Point handles
      ctx.shadowBlur = 0;
      points.forEach((p, idx) => {
        const gain = eqGains[idx] || 0;
        const isBoost = gain > 0.2;
        const isCut = gain < -0.2;

        ctx.fillStyle = isBoost ? '#818cf8' : isCut ? '#fb7185' : '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#312e81';
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

  const resetSingleBand = (idx: number) => {
    setEQGain(idx, 0);
  };

  return (
    <div className={`flex flex-col gap-6 p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-2xl ${className}`}>
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">10-Band Studio Parametric Equalizer</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-indigo-500/20 uppercase">
              {eqPreset}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            ISO octave bands (31 Hz – 16 kHz) with ±12 dB high-precision gain and resonance Q control.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdvancedMode && (
            <button
              type="button"
              onClick={() => setShowQControls(!showQControls)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer aura-pressable aura-focus-ring ${
                showQControls 
                  ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{showQControls ? 'Hide Q Filters' : 'Show Q Bandwidth'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Save Preset</span>
          </button>

          <button
            type="button"
            onClick={resetEQ}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            title="Reset all 10 bands to 0 dB flat"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Flat</span>
          </button>
        </div>
      </div>

      {/* Save Preset Inline Form */}
      <AnimatePresence initial={false}>
        {isSavingPreset && (
          <MotionFadeSlide key="eq-save-preset" direction="down" distance={6} duration="micro">
            <form onSubmit={handleSaveCustomPreset} className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-indigo-500/30">
              <input
                type="text"
                placeholder="Custom EQ preset name (e.g. Warm Vinyl, Vocal Cut)..."
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-sans"
                autoFocus
              />
              <button
                type="submit"
                disabled={!presetNameInput.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer aura-pressable aura-focus-ring"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSavingPreset(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer aura-pressable aura-focus-ring rounded-lg"
              >
                Cancel
              </button>
            </form>
          </MotionFadeSlide>
        )}
      </AnimatePresence>

      {/* Real-time Frequency Response Canvas */}
      <section aria-label="Frequency Response Curve" className="flex flex-col gap-1.5">
        <div className="relative w-full h-28 sm:h-32 rounded-xl bg-zinc-950 border border-white/10 overflow-hidden p-2 shadow-inner">
          <canvas ref={curveCanvasRef} className="w-full h-full block" />
          
          {/* Scale labels */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-indigo-400/80 tabular-nums font-semibold">+12 dB</div>
          <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[10px] font-mono text-zinc-500 tabular-nums">0 dB</div>
          <div className="absolute bottom-2 left-3 text-[10px] font-mono text-rose-400/80 tabular-nums font-semibold">-12 dB</div>

          {/* Real-time indicator */}
          <div className="absolute top-2 right-3 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Interpolated Biquad Curve</span>
          </div>
        </div>
      </section>

      {/* 10 Vertical Precision Band Faders */}
      <section aria-label="10 Equalizer Faders" className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 sm:p-4 rounded-xl bg-zinc-900/50 border border-white/5">
        {EQ_10_BANDS.map((band, idx) => {
          const gain = eqGains[idx] || 0;
          const qVal = bandQs[idx] || 1.4;
          const isBoost = gain > 0.1;
          const isCut = gain < -0.1;

          return (
            <div 
              key={band.freq} 
              className="flex flex-col items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.02] transition-colors group"
            >
              {/* dB Gain value readout */}
              <button
                type="button"
                onClick={() => resetSingleBand(idx)}
                title="Click to reset band to 0 dB"
                className={`text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded transition-colors ${
                  isBoost 
                    ? 'text-indigo-400 bg-indigo-500/10' 
                    : isCut 
                    ? 'text-rose-400 bg-rose-500/10' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {gain > 0 ? `+${gain.toFixed(1)}` : `${gain.toFixed(1)}`}
              </button>

              {/* Vertical Fader Slider */}
              <div className="relative flex items-center justify-center h-36">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={gain}
                  onChange={(e) => setEQGain(idx, parseFloat(e.target.value))}
                  className="slider-vertical"
                  aria-label={`${band.label} gain`}
                />
              </div>

              {/* Frequency Label */}
              <button
                type="button"
                onClick={() => resetSingleBand(idx)}
                className="text-xs font-bold text-zinc-200 font-mono tracking-tight hover:text-cyan-400 transition-colors"
                title="Click to reset to 0 dB"
              >
                {band.label}
              </button>

              {/* Band Character Description */}
              <span className="text-[10px] text-zinc-500 text-center leading-tight line-clamp-1 group-hover:text-zinc-400 transition-colors">
                {band.description}
              </span>

              {/* Advanced Q Bandwidth input */}
              <AnimatePresence initial={false}>
                {showQControls && (
                  <MotionFadeSlide key={`q-ctrl-${band.freq}`} direction="down" distance={4} duration="micro" className="w-full">
                    <div className="flex flex-col items-center gap-0.5 mt-1 pt-1 border-t border-white/5 w-full">
                      <span className="text-[9px] font-mono text-zinc-400 tabular-nums">Q:{qVal.toFixed(1)}</span>
                      <input
                        type="range"
                        min="0.4"
                        max="4.0"
                        step="0.1"
                        value={qVal}
                        onChange={(e) => handleQChange(idx, parseFloat(e.target.value))}
                        className="w-full h-1 accent-indigo-400"
                        title={`Q resonance factor for ${band.label}`}
                      />
                    </div>
                  </MotionFadeSlide>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </section>

      {/* Preset Selector by Category */}
      <section aria-label="Equalizer Presets" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Acoustic EQ Presets</span>
            <span className="text-[11px] text-zinc-500">· ISO calibrated profiles</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {PRESET_GROUPS.map((group) => (
            <div key={group.category} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider w-28 shrink-0">
                {group.category}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {group.presets.map((p) => {
                  const isActive = eqPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEQPreset(p.id)}
                      title={p.desc}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border cursor-pointer aura-pressable-subtle aura-focus-ring ${
                        isActive
                          ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-white/5'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 text-indigo-400" />}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* User Custom Presets */}
          {userPresets && userPresets.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider w-28 shrink-0">
                User Presets
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {userPresets.map((up) => {
                  const isActive = eqPreset === up.name;
                  return (
                    <button
                      key={up.id || up.name}
                      type="button"
                      onClick={() => setEQPreset(up.name as EqualizerPreset)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border cursor-pointer aura-pressable-subtle aura-focus-ring ${
                        isActive
                          ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50'
                          : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-white/5'
                      }`}
                    >
                      <Bookmark className="w-3 h-3 text-indigo-400" />
                      <span>{up.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
