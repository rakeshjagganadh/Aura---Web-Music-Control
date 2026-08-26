import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  Sparkles, 
  RotateCcw, 
  Waves, 
  Disc, 
  Flame, 
  Zap, 
  VolumeX, 
  Radio, 
  Layers
} from 'lucide-react';

export const EffectsRackPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { effects, updateEffects, resetEffects } = useMusic();

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Modular DSP Effects Rack</h3>
            <p className="text-[11px] text-zinc-400">
              High-fidelity algorithmic reverb, analog tape echo, lush chorus, analog saturation, and exciters.
            </p>
          </div>
        </div>

        <button
          onClick={resetEffects}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Bypass All FX
        </button>
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Effect 1: Algorithmic Reverb */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3.5 ${
          effects.reverb.enabled
            ? 'bg-zinc-900/80 border-indigo-500/30 shadow-md'
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${effects.reverb.enabled ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-zinc-600'}`} />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Studio Reverb</span>
            </div>
            <button
              onClick={() => updateEffects({ reverb: { ...effects.reverb, enabled: !effects.reverb.enabled } })}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                effects.reverb.enabled
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.reverb.enabled ? 'ON' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Wet Mix</span>
                <span className="font-mono text-zinc-300">{Math.round(effects.reverb.wet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effects.reverb.wet}
                disabled={!effects.reverb.enabled}
                onChange={(e) => updateEffects({ reverb: { ...effects.reverb, wet: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Decay Time</span>
                <span className="font-mono text-zinc-300">{effects.reverb.decay.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.5"
                step="0.1"
                value={effects.reverb.decay}
                disabled={!effects.reverb.enabled}
                onChange={(e) => updateEffects({ reverb: { ...effects.reverb, decay: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Effect 2: Tape Echo / Delay */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3.5 ${
          effects.echo.enabled
            ? 'bg-zinc-900/80 border-cyan-500/30 shadow-md'
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${effects.echo.enabled ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-zinc-600'}`} />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Tape Echo / Delay</span>
            </div>
            <button
              onClick={() => updateEffects({ echo: { ...effects.echo, enabled: !effects.echo.enabled } })}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                effects.echo.enabled
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.echo.enabled ? 'ON' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Delay Time</span>
                <span className="font-mono text-zinc-300">{Math.round(effects.echo.delayTime * 1000)} ms</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.02"
                value={effects.echo.delayTime}
                disabled={!effects.echo.enabled}
                onChange={(e) => updateEffects({ echo: { ...effects.echo, delayTime: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Feedback Repeats</span>
                <span className="font-mono text-zinc-300">{Math.round(effects.echo.feedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.75"
                step="0.05"
                value={effects.echo.feedback}
                disabled={!effects.echo.enabled}
                onChange={(e) => updateEffects({ echo: { ...effects.echo, feedback: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Effect 3: Lush Stereo Chorus */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3.5 ${
          effects.chorus?.enabled
            ? 'bg-zinc-900/80 border-purple-500/30 shadow-md'
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${effects.chorus?.enabled ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-zinc-600'}`} />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Stereo Chorus</span>
            </div>
            <button
              onClick={() => updateEffects({ chorus: { ...effects.chorus, enabled: !effects.chorus?.enabled } })}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                effects.chorus?.enabled
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.chorus?.enabled ? 'ON' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">LFO Rate</span>
                <span className="font-mono text-zinc-300">{(effects.chorus?.rate || 1.5).toFixed(1)} Hz</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={effects.chorus?.rate || 1.5}
                disabled={!effects.chorus?.enabled}
                onChange={(e) => updateEffects({ chorus: { ...effects.chorus, rate: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Modulation Depth</span>
                <span className="font-mono text-zinc-300">{Math.round((effects.chorus?.depth || 0.5) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={effects.chorus?.depth || 0.5}
                disabled={!effects.chorus?.enabled}
                onChange={(e) => updateEffects({ chorus: { ...effects.chorus, depth: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Effect 4: Tape & Tube Saturation */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3.5 ${
          effects.saturation?.enabled
            ? 'bg-zinc-900/80 border-amber-500/30 shadow-md'
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className={`w-3.5 h-3.5 ${effects.saturation?.enabled ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Analog Saturation</span>
            </div>
            <button
              onClick={() => updateEffects({ saturation: { ...effects.saturation, enabled: !effects.saturation?.enabled } })}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                effects.saturation?.enabled
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.saturation?.enabled ? 'ON' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Saturation Type */}
            <div className="flex items-center gap-1.5">
              {(['tape', 'tube', 'warm'] as const).map((t) => (
                <button
                  key={t}
                  disabled={!effects.saturation?.enabled}
                  onClick={() => updateEffects({ saturation: { ...effects.saturation, type: t } })}
                  className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
                    effects.saturation?.type === t
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Harmonic Drive</span>
                <span className="font-mono text-zinc-300">{Math.round((effects.saturation?.drive || 0.3) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={effects.saturation?.drive || 0.3}
                disabled={!effects.saturation?.enabled}
                onChange={(e) => updateEffects({ saturation: { ...effects.saturation, drive: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Effect 5: High-Frequency Air Exciter */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3.5 ${
          effects.exciter?.enabled
            ? 'bg-zinc-900/80 border-emerald-500/30 shadow-md'
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${effects.exciter?.enabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">HF Air Exciter</span>
            </div>
            <button
              onClick={() => updateEffects({ exciter: { ...effects.exciter, enabled: !effects.exciter?.enabled } })}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                effects.exciter?.enabled
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.exciter?.enabled ? 'ON' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Exciter Frequency</span>
                <span className="font-mono text-zinc-300">{Math.round((effects.exciter?.frequency || 4500) / 1000)} kHz</span>
              </div>
              <input
                type="range"
                min="2500"
                max="10000"
                step="250"
                value={effects.exciter?.frequency || 4500}
                disabled={!effects.exciter?.enabled}
                onChange={(e) => updateEffects({ exciter: { ...effects.exciter, frequency: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Harmonic Air Amount</span>
                <span className="font-mono text-zinc-300">{Math.round((effects.exciter?.amount || 0.4) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={effects.exciter?.amount || 0.4}
                disabled={!effects.exciter?.enabled}
                onChange={(e) => updateEffects({ exciter: { ...effects.exciter, amount: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Effect 6: Noise Gate & Floor Cleaner */}
        <div className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3.5 ${
          effects.noiseGate?.enabled
            ? 'bg-zinc-900/80 border-rose-500/30 shadow-md'
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VolumeX className={`w-3.5 h-3.5 ${effects.noiseGate?.enabled ? 'text-rose-400' : 'text-zinc-500'}`} />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Noise Gate</span>
            </div>
            <button
              onClick={() => updateEffects({ noiseGate: { ...effects.noiseGate, enabled: !effects.noiseGate?.enabled } })}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                effects.noiseGate?.enabled
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.noiseGate?.enabled ? 'ON' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Gate Threshold</span>
                <span className="font-mono text-zinc-300">{(effects.noiseGate?.threshold || -60).toFixed(0)} dB</span>
              </div>
              <input
                type="range"
                min="-80"
                max="-20"
                step="2"
                value={effects.noiseGate?.threshold || -60}
                disabled={!effects.noiseGate?.enabled}
                onChange={(e) => updateEffects({ noiseGate: { ...effects.noiseGate, threshold: parseFloat(e.target.value) } })}
                className="w-full"
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              Silences hiss, hum, and analog background noise between quiet passages.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
