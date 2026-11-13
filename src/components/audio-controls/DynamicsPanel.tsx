import React, { useRef, useEffect } from 'react';
import { MotionIconSwap } from '../common/motion/MotionInteractive';
import { useMusic } from '../../context/MusicContext';
import { audioEngine } from '../../services/audioEngine';
import { 
  Activity, 
  ShieldCheck, 
  Volume2, 
  RotateCcw, 
  Power,
  Gauge,
  Sliders,
  Check
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

  // High-performance DOM refs for gain-reduction meter (prevents 60Hz React re-renders)
  const grBarRef = useRef<HTMLDivElement>(null);
  const grTextRef = useRef<HTMLSpanElement>(null);

  // Poll gain reduction from Web Audio DynamicsCompressorNode only when compressor is active
  useEffect(() => {
    let animId: number;

    const poll = () => {
      if (compressor.enabled) {
        const reduction = Math.abs(audioEngine.getCompressorReduction());
        if (grBarRef.current) {
          // Meter visual range: 0 to 18 dB
          const pct = Math.min(100, (reduction / 18) * 100);
          grBarRef.current.style.width = `${pct}%`;
        }
        if (grTextRef.current) {
          grTextRef.current.textContent = reduction > 0.05 ? `-${reduction.toFixed(1)} dB` : '0.0 dB';
        }
        animId = requestAnimationFrame(poll);
      } else {
        if (grBarRef.current) grBarRef.current.style.width = '0%';
        if (grTextRef.current) grTextRef.current.textContent = '0.0 dB';
      }
    };

    if (compressor.enabled) {
      animId = requestAnimationFrame(poll);
    } else {
      if (grBarRef.current) grBarRef.current.style.width = '0%';
      if (grTextRef.current) grTextRef.current.textContent = '0.0 dB';
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [compressor.enabled]);

  // Calculate estimated loudness gain offset
  const trackLufs = currentTrackAnalysis?.integratedLufs ?? -14.0;
  const targetLufs = loudness.targetLufs ?? -14.0;
  const computedOffset = Math.max(-8, Math.min(6, targetLufs - trackLufs));

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Dynamics & Loudness Control</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-amber-500/20">
                DSP DYNAMICS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Studio dynamic range compression, brickwall peak protection, and ITU-R BS.1770 / EBU R128 loudness normalization.
            </p>
          </div>
        </div>

        {/* Global Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              resetCompressor();
              resetLimiter();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            title="Reset Compressor and Limiter to studio defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Dynamics</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Compressor (Col 1-2) & Limiter (Col 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ======================================================== */}
        {/* MODULE 1: STUDIO COMPRESSOR                              */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 lg:col-span-2 flex flex-col gap-4.5 ${
          compressor.enabled
            ? 'bg-zinc-950/80 border-amber-500/30 shadow-xl shadow-amber-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Compressor Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                compressor.enabled ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-600'
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Studio Compressor</h3>
                <p className="text-[11px] text-zinc-400">Controls peak transients & enhances acoustic body</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateCompressor({ enabled: !compressor.enabled })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                compressor.enabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={compressor.enabled}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{compressor.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          </div>

          {/* Gain Reduction Meter (Real-time Web Audio API telemetry) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Gain Reduction (GR)</span>
              </span>
              <span 
                ref={grTextRef}
                className="font-mono text-xs font-bold text-amber-300 tabular-nums"
              >
                0.0 dB
              </span>
            </div>
            
            {/* RTL Meter Bar: 0 dB on right, -18 dB on left */}
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden flex flex-row-reverse border border-white/5">
              <div
                ref={grBarRef}
                className="h-full bg-gradient-to-l from-amber-400 via-orange-500 to-rose-500 transition-[width] duration-75"
                style={{ width: '0%' }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums px-0.5">
              <span>-18 dB</span>
              <span>-12 dB</span>
              <span>-6 dB</span>
              <span>-3 dB</span>
              <span>0 dB</span>
            </div>
          </div>

          {/* Mode Switch: Simple Intensity vs Pro Surgical Controls */}
          {!isAdvancedMode ? (
            /* Simple Mode: Single Macro Intensity Slider */
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-200 font-semibold block">Compression Punch Intensity</span>
                  <span className="text-[11px] text-zinc-400">Coordinated threshold, ratio & makeup contour</span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                  {compressor.simpleIntensity ?? 40}%
                </span>
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
                className="w-full h-2 rounded-lg bg-zinc-800 accent-amber-400 cursor-pointer disabled:opacity-40"
                aria-label="Compression Punch Intensity"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 border-t border-white/5 tabular-nums">
                <span>Threshold: {compressor.threshold.toFixed(0)} dB</span>
                <span>Ratio: {compressor.ratio.toFixed(1)}:1</span>
                <span>Makeup: +{(compressor.makeupGain || 0).toFixed(1)} dB</span>
              </div>
            </div>
          ) : (
            /* Pro Engineering Controls Matrix */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* 1. Threshold */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Threshold</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {compressor.threshold.toFixed(0)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="0"
                  step="1"
                  value={compressor.threshold}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ threshold: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                  aria-label="Compressor Threshold"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                  <span>-60 dB</span>
                  <span>0 dB</span>
                </div>
              </div>

              {/* 2. Ratio */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Ratio</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {compressor.ratio.toFixed(1)}:1
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={compressor.ratio}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ ratio: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                  aria-label="Compressor Ratio"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                  <span>1:1</span>
                  <span>20:1</span>
                </div>
              </div>

              {/* 3. Attack Time */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Attack Time</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {Math.round(compressor.attack * 1000)} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.1"
                  step="0.001"
                  value={compressor.attack}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ attack: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                  aria-label="Compressor Attack Time"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                  <span>1 ms</span>
                  <span>100 ms</span>
                </div>
              </div>

              {/* 4. Release Time */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Release Time</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {Math.round(compressor.release * 1000)} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="1.0"
                  step="0.01"
                  value={compressor.release}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ release: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                  aria-label="Compressor Release Time"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                  <span>20 ms</span>
                  <span>1000 ms</span>
                </div>
              </div>

              {/* 5. Knee Softness */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Knee Softness</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    {compressor.knee.toFixed(0)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={compressor.knee}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ knee: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                  aria-label="Compressor Knee"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                  <span>0 dB (Hard)</span>
                  <span>40 dB (Soft)</span>
                </div>
              </div>

              {/* 6. Makeup Gain */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Makeup Gain</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    +{(compressor.makeupGain || 0).toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="0.5"
                  value={compressor.makeupGain || 0}
                  disabled={!compressor.enabled}
                  onChange={(e) => updateCompressor({ makeupGain: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                  aria-label="Compressor Makeup Gain"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                  <span>0 dB</span>
                  <span>+18 dB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODULE 2: MASTER PEAK LIMITER                            */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between gap-4.5 ${
          limiter.enabled
            ? 'bg-zinc-950/80 border-emerald-500/30 shadow-xl shadow-emerald-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Limiter Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${limiter.enabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Master Peak Limiter</h3>
                <p className="text-[11px] text-zinc-400">Lookahead brickwall DAC protection</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateLimiter({ enabled: !limiter.enabled })}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                limiter.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={limiter.enabled}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{limiter.enabled ? 'PROTECT' : 'OFF'}</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Zero-latency true peak brickwall limiter preventing inter-sample DAC clipping, harsh digital distortion, and headphone ear fatigue.
          </p>

          {/* Limiter Controls */}
          <div className="flex flex-col gap-3.5 mt-auto">
            {/* 1. True Peak Ceiling */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">True Peak Ceiling</span>
                <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums">
                  {limiter.ceiling.toFixed(1)} dBTP
                </span>
              </div>
              <input
                type="range"
                min="-6.0"
                max="-0.1"
                step="0.1"
                value={limiter.ceiling}
                disabled={!limiter.enabled}
                onChange={(e) => updateLimiter({ ceiling: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-emerald-400 cursor-pointer disabled:opacity-40"
                aria-label="True Peak Ceiling"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>-6.0 dBTP</span>
                <span>-0.1 dBTP</span>
              </div>
            </div>

            {/* 2. Limiter Threshold */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Limiter Threshold</span>
                <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                  {limiter.threshold.toFixed(1)} dB
                </span>
              </div>
              <input
                type="range"
                min="-12.0"
                max="0.0"
                step="0.5"
                value={limiter.threshold}
                disabled={!limiter.enabled}
                onChange={(e) => updateLimiter({ threshold: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-emerald-400 cursor-pointer disabled:opacity-40"
                aria-label="Limiter Threshold"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>-12.0 dB</span>
                <span>0.0 dB</span>
              </div>
            </div>

            {/* 3. Limiter Release */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Release Time</span>
                <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                  {Math.round((limiter.release || 0.12) * 1000)} ms
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.01"
                value={limiter.release || 0.12}
                disabled={!limiter.enabled}
                onChange={(e) => updateLimiter({ release: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-emerald-400 cursor-pointer disabled:opacity-40"
                aria-label="Limiter Release Time"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>50 ms</span>
                <span>400 ms</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODULE 3: LOUDNESS NORMALIZATION (ITU-R BS.1770 / EBU R128) */}
      {/* ======================================================== */}
      <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        loudness.enabled 
          ? 'bg-zinc-950/80 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
          : 'bg-zinc-950/40 border-white/5'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Target Loudness Normalization
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-indigo-300 border border-indigo-500/20">
                ITU-R BS.1770 / EBU R128
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Consistent perceived playback loudness across diverse tracks and albums without compressing dynamic range or introducing harmonic distortion.
            </p>
            
            {/* Real-time Integrated LUFS readout and calculated gain offset */}
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-2 flex-wrap">
              <span>
                Track Integrated: <strong className="text-zinc-200">{currentTrackAnalysis?.integratedLufs ? `${currentTrackAnalysis.integratedLufs.toFixed(1)} LUFS` : '—'}</strong>
              </span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>
                Applied Offset: <strong className={loudness.enabled ? (computedOffset >= 0 ? 'text-emerald-400' : 'text-amber-400') : 'text-zinc-500'}>
                  {loudness.enabled ? `${computedOffset >= 0 ? '+' : ''}${computedOffset.toFixed(1)} dB` : '0.0 dB (Bypassed)'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Target selector & Normalizing Toggle */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Target Standard</span>
            <select
              value={loudness.targetLufs}
              disabled={!loudness.enabled}
              onChange={(e) => updateLoudness({ targetLufs: parseFloat(e.target.value) })}
              className="bg-zinc-900 border border-white/10 text-xs text-zinc-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed aura-focus-ring"
              aria-label="Target Loudness Standard"
            >
              <option value="-14">-14 LUFS (Streaming Standard)</option>
              <option value="-16">-16 LUFS (Apple Music / AES)</option>
              <option value="-23">-23 LUFS (Broadcast EBU R128)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Status</span>
            <button
              type="button"
              onClick={() => updateLoudness({ enabled: !loudness.enabled })}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                loudness.enabled
                  ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={loudness.enabled}>
                <Power className="w-3.5 h-3.5" />
              </MotionIconSwap>
              <span>{loudness.enabled ? 'NORMALIZING' : 'BYPASS'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
