import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { Sparkles, Waves, Volume2, Gauge, RefreshCw, Layers } from 'lucide-react';

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const EffectsPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    effects, 
    updateEffects, 
    resetEffects, 
    playbackRate, 
    setPlaybackRate,
    volume,
    setVolume,
    isMuted,
    toggleMute 
  } = useMusic();

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Studio Audio Controls & Effects</h3>
        </div>
        <button
          onClick={resetEffects}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg border border-white/5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      {/* Section 1: Quick Tone & Stereo Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bass & Treble Warmth */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Quick Tone Shaping
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Analog Color</span>
          </div>

          {/* Bass Boost */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Low-End Warmth (Bass)</span>
              <span className="font-mono text-zinc-300">+{effects.bassBoost.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={effects.bassBoost}
              onChange={(e) => updateEffects({ bassBoost: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Treble Boost */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">High-End Air (Treble)</span>
              <span className="font-mono text-zinc-300">+{effects.trebleBoost.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={effects.trebleBoost}
              onChange={(e) => updateEffects({ trebleBoost: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Spatial & Balance */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              Spatial & Stereo Balance
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Soundstage</span>
          </div>

          {/* Balance Pan */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Balance</span>
              <span className="font-mono text-zinc-300">
                {effects.balance === 0
                  ? 'Center (0)'
                  : effects.balance < 0
                  ? `L ${Math.round(Math.abs(effects.balance) * 100)}%`
                  : `R ${Math.round(effects.balance * 100)}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500">L</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={effects.balance}
                onChange={(e) => updateEffects({ balance: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="text-[10px] font-mono text-zinc-500">R</span>
            </div>
          </div>

          {/* Stereo Width */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Stereo Width</span>
              <span className="font-mono text-zinc-300">{Math.round(effects.stereoWidth * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">Narrow</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={effects.stereoWidth}
                onChange={(e) => updateEffects({ stereoWidth: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="text-[10px] text-zinc-500">Wide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Reverb & Echo DSP Rack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reverb Unit */}
        <div className={`p-4 rounded-xl border transition-all duration-200 ${
          effects.reverb.enabled 
            ? 'bg-zinc-900/70 border-indigo-500/30 shadow-sm' 
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${effects.reverb.enabled ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-zinc-600'}`} />
              <span className="text-xs font-semibold text-zinc-200">Algorithmic Reverb</span>
            </div>
            <button
              onClick={() => updateEffects({ reverb: { ...effects.reverb, enabled: !effects.reverb.enabled } })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                effects.reverb.enabled
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.reverb.enabled ? 'ACTIVE' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
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
              <div className="flex items-center justify-between text-xs">
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

        {/* Echo / Delay Unit */}
        <div className={`p-4 rounded-xl border transition-all duration-200 ${
          effects.echo.enabled 
            ? 'bg-zinc-900/70 border-cyan-500/30 shadow-sm' 
            : 'bg-zinc-900/30 border-white/5 opacity-75'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${effects.echo.enabled ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-zinc-600'}`} />
              <span className="text-xs font-semibold text-zinc-200">Analog Tape Echo / Delay</span>
            </div>
            <button
              onClick={() => updateEffects({ echo: { ...effects.echo, enabled: !effects.echo.enabled } })}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                effects.echo.enabled
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {effects.echo.enabled ? 'ACTIVE' : 'BYPASS'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Echo Feedback</span>
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
      </div>

      {/* Section 3: Playback Rate Speed Selector */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Playback Speed</span>
            <span className="text-[11px] text-zinc-500">Real-time time stretching</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {SPEED_PRESETS.map((rate) => {
            const isSelected = Math.abs(playbackRate - rate) < 0.01;
            return (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {rate}×
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
