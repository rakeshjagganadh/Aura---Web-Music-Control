import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { Mic2, Drum, AudioLines, Music4, Info } from 'lucide-react';

export const StemsPlaceholderPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { stemState } = useMusic();

  const stemConfigs = [
    { key: 'vocals' as const, label: 'Vocals', icon: Mic2, color: 'text-rose-400' },
    { key: 'drums' as const, label: 'Drums & Rhythm', icon: Drum, color: 'text-amber-400' },
    { key: 'bass' as const, label: 'Bass Guitar / Synth', icon: AudioLines, color: 'text-indigo-400' },
    { key: 'instruments' as const, label: 'Melody & Synths', icon: Music4, color: 'text-cyan-400' },
  ];

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {/* Informational banner explaining unavailable neural stem pipeline */}
      <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-indigo-300">Stem Isolation Engine Architecture</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                UNAVAILABLE — REQUIRES LOCAL NEURAL MODEL
              </span>
            </div>
            <p className="text-zinc-400 mt-1">
              Real-time 4-channel stem separation requires a local ONNX/WASM neural separation model, which is not bundled in this release. Controls below are read-only while master audio routing remains active.
            </p>
          </div>
        </div>
      </div>

      {/* Disabled Stem Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {stemConfigs.map((stem) => {
          const Icon = stem.icon;
          const val = stemState[stem.key];

          return (
            <div
              key={stem.key}
              className="p-4 rounded-xl border bg-zinc-950/50 border-white/5 opacity-60"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-zinc-800 border border-white/5 ${stem.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">{stem.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">Channel {stem.key.toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Mute unavailable without neural stem model"
                    aria-label={`Mute ${stem.label} (unavailable)`}
                    className="px-2 py-1 text-[11px] font-mono rounded font-medium bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  >
                    M
                  </button>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Solo unavailable without neural stem model"
                    aria-label={`Solo ${stem.label} (unavailable)`}
                    className="px-2 py-1 text-[11px] font-mono rounded font-medium bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">Stem Gain</span>
                  <span className="font-mono text-zinc-400">{val}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={val}
                  disabled
                  aria-disabled="true"
                  aria-label={`${stem.label} gain (unavailable)`}
                  onChange={() => {}}
                  className="w-full cursor-not-allowed"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
