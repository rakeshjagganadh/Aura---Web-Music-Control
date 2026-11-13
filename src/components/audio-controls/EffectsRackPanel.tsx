import React from 'react';
import { MotionIconSwap } from '../common/motion/MotionInteractive';
import { useMusic } from '../../context/MusicContext';
import { 
  Sparkles, 
  RotateCcw, 
  Waves, 
  Disc, 
  Flame, 
  Zap, 
  Radio, 
  Power,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

export const EffectsRackPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { effects, updateEffects, resetEffects } = useMusic();

  const handleBypassAll = () => {
    resetEffects();
  };

  // Quick snap delay times in milliseconds
  const DELAY_SNAPS = [
    { label: '62ms', ms: 0.0625 },
    { label: '125ms', ms: 0.125 },
    { label: '250ms', ms: 0.25 },
    { label: '375ms', ms: 0.375 },
    { label: '500ms', ms: 0.5 },
  ];

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Modular DSP Effects Rack</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-purple-400 border border-purple-500/20">
                64-BIT STUDIO GRAPH
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              High-fidelity algorithmic reverb, tape delay, stereo chorus, analog saturation curves, and high-frequency exciter.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBypassAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            title="Bypass and reset all modular DSP effects to flat defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Bypass All FX</span>
          </button>
        </div>
      </div>

      {/* Signal Chain Architecture Diagram */}
      <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5 flex items-center justify-between overflow-x-auto scrollbar-none gap-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-500 uppercase">Signal Flow:</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-300">Input</span>
          <ArrowRight className="w-3 h-3 text-zinc-600" />
          <span className={`px-2 py-0.5 rounded border transition-colors ${
            effects.saturation?.enabled ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-zinc-900 border-white/5 text-zinc-500'
          }`}>
            Saturation
          </span>
          <ArrowRight className="w-3 h-3 text-zinc-600" />
          <span className="text-zinc-500">Parallel Send (</span>
          <span className={`px-1.5 py-0.5 rounded border ${
            effects.reverb.enabled ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'text-zinc-500 border-transparent'
          }`}>Reverb</span>
          <span className="text-zinc-600">·</span>
          <span className={`px-1.5 py-0.5 rounded border ${
            effects.echo.enabled ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'text-zinc-500 border-transparent'
          }`}>Delay</span>
          <span className="text-zinc-600">·</span>
          <span className={`px-1.5 py-0.5 rounded border ${
            effects.chorus?.enabled ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'text-zinc-500 border-transparent'
          }`}>Chorus</span>
          <span className="text-zinc-600">·</span>
          <span className={`px-1.5 py-0.5 rounded border ${
            effects.exciter?.enabled ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'text-zinc-500 border-transparent'
          }`}>Exciter</span>
          <span className="text-zinc-500">)</span>
          <ArrowRight className="w-3 h-3 text-zinc-600" />
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-300">Output</span>
        </div>
      </div>

      {/* Effects Rack Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* ======================================================== */}
        {/* MODULE 1: STUDIO CONVOLVER / ALGORITHMIC REVERB          */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between gap-4.5 ${
          effects.reverb.enabled
            ? 'bg-zinc-950/80 border-indigo-500/30 shadow-xl shadow-indigo-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                effects.reverb.enabled ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-zinc-600'
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Studio Reverb</h3>
                <p className="text-[11px] text-zinc-400">Algorithmic impulse acoustic space</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateEffects({ reverb: { ...effects.reverb, enabled: !effects.reverb.enabled } })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                effects.reverb.enabled
                  ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={Boolean(effects.reverb.enabled)}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{effects.reverb.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3.5">
            {/* Wet Mix */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Wet / Dry Mix</span>
                <span className="font-mono text-xs font-bold text-indigo-300 tabular-nums">
                  {Math.round(effects.reverb.wet * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effects.reverb.wet}
                disabled={!effects.reverb.enabled}
                onChange={(e) => updateEffects({ reverb: { ...effects.reverb, wet: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-indigo-400 cursor-pointer disabled:opacity-40"
                aria-label="Reverb Wet Mix"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>0% (Dry)</span>
                <span>50%</span>
                <span>100% (Wet)</span>
              </div>
            </div>

            {/* Decay Time */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Decay Time</span>
                <span className="font-mono text-xs font-bold text-indigo-300 tabular-nums">
                  {effects.reverb.decay.toFixed(1)} s
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={effects.reverb.decay}
                disabled={!effects.reverb.enabled}
                onChange={(e) => updateEffects({ reverb: { ...effects.reverb, decay: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-indigo-400 cursor-pointer disabled:opacity-40"
                aria-label="Reverb Decay Time"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>0.5 s (Tight)</span>
                <span>2.5 s (Medium)</span>
                <span>5.0 s (Cathedral)</span>
              </div>
            </div>

            {/* Room Size */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Room Dimension</span>
                <span className="font-mono text-xs font-bold text-indigo-300 tabular-nums">
                  {Math.round((effects.reverb.roomSize || 0.5) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={effects.reverb.roomSize || 0.5}
                disabled={!effects.reverb.enabled}
                onChange={(e) => updateEffects({ reverb: { ...effects.reverb, roomSize: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-indigo-400 cursor-pointer disabled:opacity-40"
                aria-label="Reverb Room Size"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>Chamber (10%)</span>
                <span>Studio (50%)</span>
                <span>Hall (100%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 2: TAPE ECHO / ANALOG DELAY                       */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between gap-4.5 ${
          effects.echo.enabled
            ? 'bg-zinc-950/80 border-cyan-500/30 shadow-xl shadow-cyan-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                effects.echo.enabled ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-zinc-600'
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tape Echo / Delay</h3>
                <p className="text-[11px] text-zinc-400">Warm 3.5 kHz damped analog feedback</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateEffects({ echo: { ...effects.echo, enabled: !effects.echo.enabled } })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                effects.echo.enabled
                  ? 'bg-cyan-600/25 text-cyan-200 border-cyan-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={Boolean(effects.echo.enabled)}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{effects.echo.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3.5">
            {/* Delay Time */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Delay Time</span>
                <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                  {Math.round(effects.echo.delayTime * 1000)} ms
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.5"
                step="0.02"
                value={effects.echo.delayTime}
                disabled={!effects.echo.enabled}
                onChange={(e) => updateEffects({ echo: { ...effects.echo, delayTime: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer disabled:opacity-40"
                aria-label="Delay Time"
              />

              {/* Snap Delay Quick Buttons */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {DELAY_SNAPS.map((snap) => {
                  const isCurrent = Math.abs(effects.echo.delayTime - snap.ms) < 0.01;
                  return (
                    <button
                      key={snap.label}
                      type="button"
                      disabled={!effects.echo.enabled}
                      onClick={() => updateEffects({ echo: { ...effects.echo, delayTime: snap.ms } })}
                      className={`py-0.5 text-[10px] font-mono rounded transition-colors border cursor-pointer aura-pressable aura-focus-ring disabled:cursor-not-allowed ${
                        isCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5 disabled:opacity-40'
                      }`}
                    >
                      {snap.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Repeats */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Feedback Regeneration</span>
                <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                  {Math.round(effects.echo.feedback * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.85"
                step="0.05"
                value={effects.echo.feedback}
                disabled={!effects.echo.enabled}
                onChange={(e) => updateEffects({ echo: { ...effects.echo, feedback: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer disabled:opacity-40"
                aria-label="Delay Feedback"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>Single Slap (5%)</span>
                <span>Moderate (45%)</span>
                <span>Infinite (85%)</span>
              </div>
            </div>

            {/* Wet Mix */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Echo Wet Mix</span>
                <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                  {Math.round((effects.echo.wet ?? 0.3) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effects.echo.wet ?? 0.3}
                disabled={!effects.echo.enabled}
                onChange={(e) => updateEffects({ echo: { ...effects.echo, wet: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer disabled:opacity-40"
                aria-label="Delay Wet Mix"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>0% (Dry)</span>
                <span>50%</span>
                <span>100% (Full Wet)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 3: STEREO CHORUS                                  */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between gap-4.5 ${
          effects.chorus?.enabled
            ? 'bg-zinc-950/80 border-purple-500/30 shadow-xl shadow-purple-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                effects.chorus?.enabled ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-zinc-600'
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Stereo Chorus</h3>
                <p className="text-[11px] text-zinc-400">LFO modulated delay ensemble</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateEffects({ chorus: { ...effects.chorus, enabled: !effects.chorus?.enabled } })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                effects.chorus?.enabled
                  ? 'bg-purple-600/25 text-purple-200 border-purple-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={Boolean(effects.chorus?.enabled)}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{effects.chorus?.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3.5">
            {/* LFO Modulation Rate */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">LFO Modulation Rate</span>
                <span className="font-mono text-xs font-bold text-purple-300 tabular-nums">
                  {(effects.chorus?.rate || 1.5).toFixed(1)} Hz
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={effects.chorus?.rate || 1.5}
                disabled={!effects.chorus?.enabled}
                onChange={(e) => updateEffects({ chorus: { ...effects.chorus, rate: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-purple-400 cursor-pointer disabled:opacity-40"
                aria-label="Chorus LFO Rate"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>0.2 Hz (Slow Sweep)</span>
                <span>2.5 Hz</span>
                <span>5.0 Hz (Fast Shimmer)</span>
              </div>
            </div>

            {/* Modulation Depth */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Modulation Depth</span>
                <span className="font-mono text-xs font-bold text-purple-300 tabular-nums">
                  {Math.round((effects.chorus?.depth || 0.5) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={effects.chorus?.depth || 0.5}
                disabled={!effects.chorus?.enabled}
                onChange={(e) => updateEffects({ chorus: { ...effects.chorus, depth: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-purple-400 cursor-pointer disabled:opacity-40"
                aria-label="Chorus Modulation Depth"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>Subtle (10%)</span>
                <span>Lush (50%)</span>
                <span>Deep Detune (100%)</span>
              </div>
            </div>

            {/* Wet Mix */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Chorus Wet Mix</span>
                <span className="font-mono text-xs font-bold text-purple-300 tabular-nums">
                  {Math.round((effects.chorus?.wet ?? 0.4) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effects.chorus?.wet ?? 0.4}
                disabled={!effects.chorus?.enabled}
                onChange={(e) => updateEffects({ chorus: { ...effects.chorus, wet: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-purple-400 cursor-pointer disabled:opacity-40"
                aria-label="Chorus Wet Mix"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>0% (Dry)</span>
                <span>50%</span>
                <span>100% (Wet Ensemble)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 4: ANALOG SATURATION (WAVESHAPER)                */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between gap-4.5 ${
          effects.saturation?.enabled
            ? 'bg-zinc-950/80 border-amber-500/30 shadow-xl shadow-amber-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Flame className={`w-4 h-4 ${effects.saturation?.enabled ? 'text-amber-400' : 'text-zinc-500'}`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Analog Saturation</h3>
                <p className="text-[11px] text-zinc-400">2× oversampled nonlinear wave shaping</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateEffects({ saturation: { ...effects.saturation, enabled: !effects.saturation?.enabled } })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                effects.saturation?.enabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={Boolean(effects.saturation?.enabled)}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{effects.saturation?.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3.5">
            {/* Saturation Character Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Saturation Profile</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['tape', 'tube', 'transistor'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={!effects.saturation?.enabled}
                    onClick={() => updateEffects({ saturation: { ...effects.saturation, type: t } })}
                    className={`py-1.5 text-xs font-bold uppercase rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring disabled:cursor-not-allowed ${
                      effects.saturation?.type === t
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5 disabled:opacity-40'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight pt-0.5">
                {effects.saturation?.type === 'tape' && 'Tape: Soft symmetric odd-order harmonic compression & warmth.'}
                {effects.saturation?.type === 'tube' && 'Tube: Asymmetric triode saturation with rich second harmonics.'}
                {effects.saturation?.type === 'transistor' && 'Transistor: Symmetrical hard clipping with aggressive presence.'}
              </p>
            </div>

            {/* Harmonic Drive Intensity */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Harmonic Drive</span>
                <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                  {Math.round((effects.saturation?.drive || 0.3) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={effects.saturation?.drive || 0.3}
                disabled={!effects.saturation?.enabled}
                onChange={(e) => updateEffects({ saturation: { ...effects.saturation, drive: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer disabled:opacity-40"
                aria-label="Harmonic Drive"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>Subtle (5%)</span>
                <span>Warm Drive (40%)</span>
                <span>Heavy (100%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODULE 5: HF AIR EXCITER                                 */}
        {/* ======================================================== */}
        <div className={`p-5 rounded-2xl border transition-colors duration-200 flex flex-col justify-between gap-4.5 ${
          effects.exciter?.enabled
            ? 'bg-zinc-950/80 border-emerald-500/30 shadow-xl shadow-emerald-500/5'
            : 'bg-zinc-950/40 border-white/5'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${effects.exciter?.enabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">HF Air Exciter</h3>
                <p className="text-[11px] text-zinc-400">Aural harmonic brilliance generator</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateEffects({ exciter: { ...effects.exciter, enabled: !effects.exciter?.enabled } })}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                effects.exciter?.enabled
                  ? 'bg-emerald-600/25 text-emerald-200 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
              }`}
            >
              <MotionIconSwap stateKey={Boolean(effects.exciter?.enabled)}>
                <Power className="w-3 h-3" />
              </MotionIconSwap>
              <span>{effects.exciter?.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3.5">
            {/* Cutoff Frequency */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Exciter High-Pass Cutoff</span>
                <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums">
                  {((effects.exciter?.frequency || 4500) / 1000).toFixed(1)} kHz
                </span>
              </div>
              <input
                type="range"
                min="2500"
                max="10000"
                step="250"
                value={effects.exciter?.frequency || 4500}
                disabled={!effects.exciter?.enabled}
                onChange={(e) => updateEffects({ exciter: { ...effects.exciter, frequency: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-emerald-400 cursor-pointer disabled:opacity-40"
                aria-label="Exciter Frequency"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>2.5 kHz (Upper Mids)</span>
                <span>5.0 kHz</span>
                <span>10.0 kHz (Ultra Air)</span>
              </div>
            </div>

            {/* Exciter Amount */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Harmonic Air Amount</span>
                <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums">
                  {Math.round((effects.exciter?.amount || 0.4) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={effects.exciter?.amount || 0.4}
                disabled={!effects.exciter?.enabled}
                onChange={(e) => updateEffects({ exciter: { ...effects.exciter, amount: parseFloat(e.target.value) } })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-emerald-400 cursor-pointer disabled:opacity-40"
                aria-label="Exciter Amount"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>Subtle Shimmer (5%)</span>
                <span>Moderate (40%)</span>
                <span>Bright (100%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
