import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { audioEngine } from '../../services/audioEngine';
import { 
  Activity, 
  ShieldCheck, 
  Volume2, 
  RotateCcw, 
  Sliders, 
  Gauge,
  Sparkles,
  Info,
  Layers
} from 'lucide-react';

export const DynamicsPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    compressor,
    updateCompressor,
    resetCompressor,
    limiter,
    updateLimiter,
    resetLimiter,
    loudness,
    updateLoudness,
    currentTrackAnalysis,
    isAdvancedMode
  } = useMusic();

  const [gainReduction, setGainReduction] = useState(0);

  // Poll gain reduction from audio engine compressor
  useEffect(() => {
    let animId: number;
    const poll = () => {
      if (compressor.enabled) {
        const gr = audioEngine.getCompressorReduction();
        setGainReduction(Math.abs(gr));
      } else {
        setGainReduction(0);
      }
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, [compressor.enabled]);

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Overview Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Dynamics & Loudness Control</h3>
            <p className="text-[11px] text-zinc-400">
              Studio dynamic range compression, brickwall peak protection, and ITU-R BS.1770 normalization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetCompressor();
              resetLimiter();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Dynamics
          </button>
        </div>
      </div>

      {/* Grid: 3 Main Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Module 1: Studio Compressor */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 lg:col-span-2 flex flex-col gap-4 ${
          compressor.enabled
            ? 'bg-zinc-900/80 border-amber-500/30 shadow-lg shadow-amber-500/5'
            : 'bg-zinc-900/30 border-white/5 opacity-80'
        }`}>
          {/* Compressor Header & Bypass */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${compressor.enabled ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-600'}`} />
              <div>
                <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">Studio Compressor</span>
                <span className="text-[10px] text-zinc-400 block">Controls dynamic peaks & adds punch</span>
              </div>
            </div>

            <button
              onClick={() => updateCompressor({ enabled: !compressor.enabled })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                compressor.enabled
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              {compressor.enabled ? 'ACTIVE' : 'BYPASS'}
            </button>
          </div>

          {/* Gain Reduction Meter */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Gain Reduction (GR)</span>
              <span className={`font-bold ${gainReduction > 0.5 ? 'text-amber-400' : 'text-zinc-500'}`}>
                -{gainReduction.toFixed(1)} dB
              </span>
            </div>
            
            {/* Meter Bar */}
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden flex flex-row-reverse relative">
              <div
                className="h-full bg-gradient-to-l from-amber-400 via-orange-500 to-rose-500 transition-all duration-75"
                style={{ width: `${Math.min(100, (gainReduction / 18) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-600">
              <span>0 dB</span>
              <span>-6 dB</span>
              <span>-12 dB</span>
              <span>-18 dB</span>
            </div>
          </div>

          {/* Simple Mode Intensity vs Pro Controls */}
          {!isAdvancedMode ? (
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Compression Punch Intensity</span>
                <span className="font-mono text-amber-300">{compressor.simpleIntensity ?? 40}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={compressor.simpleIntensity ?? 40}
                disabled={!compressor.enabled}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const threshold = -10 - (val / 100) * 35; // -10 to -45 dB
                  const ratio = 2 + (val / 100) * 6;        // 2:1 to 8:1
                  const makeupGain = (val / 100) * 4;       // 0 to 4 dB
                  updateCompressor({ simpleIntensity: val, threshold, ratio, makeupGain });
                }}
                className="w-full"
              />
              <p className="text-[11px] text-zinc-500">
                Smoothly tightens loud peaks while lifting quiet acoustic nuances automatically.
              </p>
            </div>
          ) : (
            /* Pro Controls Matrix */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Threshold */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Threshold</span>
                  <span className="font-mono text-zinc-200">{compressor.threshold.toFixed(0)} dB</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="0"
                  step="1"
                  value={compressor.threshold}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ threshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Ratio */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Ratio</span>
                  <span className="font-mono text-zinc-200">{compressor.ratio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={compressor.ratio}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ ratio: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Attack */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Attack</span>
                  <span className="font-mono text-zinc-200">{Math.round(compressor.attack * 1000)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.1"
                  step="0.002"
                  value={compressor.attack}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ attack: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Release */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Release</span>
                  <span className="font-mono text-zinc-200">{Math.round(compressor.release * 1000)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="1.0"
                  step="0.02"
                  value={compressor.release}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ release: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Knee */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Knee Softness</span>
                  <span className="font-mono text-zinc-200">{compressor.knee.toFixed(0)} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={compressor.knee}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ knee: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Makeup Gain */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Makeup Gain</span>
                  <span className="font-mono text-zinc-200">+{compressor.makeupGain?.toFixed(1) || 0} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={compressor.makeupGain || 0}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ makeupGain: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Master Peak Limiter & Protection */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-4 ${
          limiter.enabled
            ? 'bg-zinc-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
            : 'bg-zinc-900/30 border-white/5 opacity-80'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${limiter.enabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">Master Limiter</span>
            </div>

            <button
              onClick={() => updateLimiter({ enabled: !limiter.enabled })}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                limiter.enabled
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {limiter.enabled ? 'PROTECT' : 'OFF'}
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Zero-latency true peak brickwall limiter preventing DAC clipping, harsh digital distortion, and ear fatigue.
          </p>

          <div className="flex flex-col gap-3 mt-auto">
            {/* Ceiling */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">True Peak Ceiling</span>
                <span className="font-mono text-zinc-200">{limiter.ceiling.toFixed(1)} dBTP</span>
              </div>
              <input
                type="range"
                min="-6.0"
                max="-0.1"
                step="0.1"
                value={limiter.ceiling}
                disabled={!limiter.enabled}
                onChange={(e) => updateLimiter({ ceiling: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Threshold */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Limiter Threshold</span>
                <span className="font-mono text-zinc-200">{limiter.threshold.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="-12.0"
                max="0.0"
                step="0.5"
                value={limiter.threshold}
                disabled={!limiter.enabled}
                onChange={(e) => updateLimiter({ threshold: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Module 3: Loudness Normalization (ITU-R BS.1770 / EBU R128) */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">Target Loudness Normalization</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EBU R128
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Standardizes playback loudness across different tracks and albums without compressing dynamic range.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Target LUFS selector */}
          <select
            value={loudness.targetLufs}
            onChange={(e) => updateLoudness({ targetLufs: parseFloat(e.target.value) })}
            className="bg-zinc-950 border border-white/10 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
          >
            <option value="-14">-14 LUFS (Streaming Standard)</option>
            <option value="-16">-16 LUFS (Apple Music / AES)</option>
            <option value="-23">-23 LUFS (Broadcast EBU R128)</option>
          </select>

          {/* Toggle button */}
          <button
            onClick={() => updateLoudness({ enabled: !loudness.enabled })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              loudness.enabled
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {loudness.enabled ? 'NORMALIZING' : 'OFF'}
          </button>
        </div>
      </div>

    </div>
  );
};
