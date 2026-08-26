import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { Mic2, Drum, AudioLines, Music4, VolumeX, Radio, Info } from 'lucide-react';

export const StemsPlaceholderPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { stemState, updateStemState, showToast } = useMusic();

  const stemConfigs = [
    { key: 'vocals' as const, label: 'Vocals', icon: Mic2, color: 'text-rose-400', progressColor: 'bg-rose-500' },
    { key: 'drums' as const, label: 'Drums & Rhythm', icon: Drum, color: 'text-amber-400', progressColor: 'bg-amber-500' },
    { key: 'bass' as const, label: 'Bass Guitar / Synth', icon: AudioLines, color: 'text-indigo-400', progressColor: 'bg-indigo-500' },
    { key: 'instruments' as const, label: 'Melody & Synths', icon: Music4, color: 'text-cyan-400', progressColor: 'bg-cyan-500' },
  ];

  const handleSliderChange = (key: 'vocals' | 'drums' | 'bass' | 'instruments', val: number) => {
    updateStemState({ [key]: val });
  };

  const toggleMute = (key: 'vocals' | 'drums' | 'bass' | 'instruments') => {
    const isMuted = !!stemState.muted[key];
    updateStemState({
      muted: {
        ...stemState.muted,
        [key]: !isMuted,
      },
    });
  };

  const toggleSolo = (key: string) => {
    if (stemState.solo === key) {
      updateStemState({ solo: null });
    } else {
      updateStemState({ solo: key });
      showToast(`Solo channel: ${key.toUpperCase()} (stem architecture preview)`, 'info');
    }
  };

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {/* Informational banner explaining future stem pipeline */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 leading-relaxed">
          <span className="font-semibold text-indigo-300">Stem Isolation Engine Architecture</span>
          <p className="text-zinc-400 mt-0.5">
            This workspace includes the complete 4-channel stem control interface ready for local ONNX/WASM neural stem models. In this foundation release, master audio routing is maintained.
          </p>
        </div>
      </div>

      {/* Stem Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {stemConfigs.map((stem) => {
          const Icon = stem.icon;
          const val = stemState[stem.key];
          const isMuted = stemState.muted[stem.key];
          const isSolo = stemState.solo === stem.key;

          return (
            <div
              key={stem.key}
              className={`p-4 rounded-xl border transition-all ${
                isSolo
                  ? 'bg-zinc-900 border-indigo-500/50 shadow-md'
                  : isMuted
                  ? 'bg-zinc-950/40 border-white/5 opacity-50'
                  : 'bg-zinc-900/40 border-white/5'
              }`}
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
                    onClick={() => toggleMute(stem.key)}
                    title="Mute Channel"
                    className={`px-2 py-1 text-[11px] font-mono rounded font-medium transition-colors ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => toggleSolo(stem.key)}
                    title="Solo Channel"
                    className={`px-2 py-1 text-[11px] font-mono rounded font-medium transition-colors ${
                      isSolo
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">Stem Gain</span>
                  <span className="font-mono text-zinc-300">{isMuted ? 'MUTED' : `${val}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={val}
                  disabled={isMuted}
                  onChange={(e) => handleSliderChange(stem.key, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
