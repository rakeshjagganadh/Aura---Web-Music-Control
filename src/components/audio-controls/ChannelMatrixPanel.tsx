import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { ChannelMode } from '../../types';
import { 
  Split, 
  RotateCcw, 
  Disc3, 
  Check
} from 'lucide-react';

const CHANNEL_MODES: { id: ChannelMode; label: string; desc: string }[] = [
  { id: 'stereo', label: 'Standard Stereo', desc: 'Normal discrete Left and Right playback' },
  { id: 'mono', label: 'Mono Sum (L+R)', desc: 'Sums both channels equally into mono' },
  { id: 'swap', label: 'Swap L / R Channels', desc: 'Inverts stereo staging across Left and Right' },
  { id: 'invertL', label: 'Invert Left Phase (Ø)', desc: '180° phase flip on left channel (vocal isolation testing)' },
  { id: 'invertR', label: 'Invert Right Phase (Ø)', desc: '180° phase flip on right channel' },
];

export const ChannelMatrixPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    channel,
    updateChannels,
    balance,
    setBalance,
    pitchTempo,
    updatePitchTempo,
    resetPitchTempo,
    playbackRate,
    setPlaybackRate
  } = useMusic();

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Split className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Channel Matrix & Pitch / Speed Studio</h3>
            <p className="text-[11px] text-zinc-400">
              Discrete stereo channel routing, phase inversion, pitch shifting, and master tempo control.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            updateChannels({ mode: 'stereo', balance: 0 });
            setBalance(0);
            resetPitchTempo();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset All
        </button>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Section 1: Channel Matrix Routing */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Channel Matrix Routing</span>
            <span className="text-[10px] font-mono text-zinc-500">{channel.mode.toUpperCase()}</span>
          </div>

          <div className="flex flex-col gap-2">
            {CHANNEL_MODES.map((m) => {
              const isSelected = channel.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => updateChannels({ mode: m.id })}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-500/15 border-blue-500/40 text-white shadow-sm'
                      : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">{m.label}</span>
                    <span className="text-[10px] text-zinc-500">{m.desc}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Balance Pan Slider */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Stereo Balance (Pan)</span>
              <span className="font-mono text-blue-300">
                {balance === 0
                  ? 'Center (0)'
                  : balance < 0
                  ? `L ${Math.round(Math.abs(balance) * 100)}%`
                  : `R ${Math.round(balance * 100)}%`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500">L</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] font-mono text-zinc-500">R</span>
            </div>
          </div>
        </div>

        {/* Section 2: Pitch Transposition & Playback Speed */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Pitch & Speed Control</span>
            </div>
            <span className="text-[10px] font-mono text-amber-300">
              {pitchTempo.pitchSemitones > 0 ? `+${pitchTempo.pitchSemitones}` : pitchTempo.pitchSemitones} st
            </span>
          </div>

          {/* Pitch Shifter */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Pitch Transposition (Semitones)</span>
              <span className="font-mono text-amber-300">
                {pitchTempo.pitchSemitones > 0 ? `+${pitchTempo.pitchSemitones}` : pitchTempo.pitchSemitones} semitones
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchTempo.pitchSemitones || 0}
              onChange={(e) => updatePitchTempo({ pitchSemitones: parseInt(e.target.value, 10) })}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-600">
              <span>-1 Octave (-12st)</span>
              <span>Original (0)</span>
              <span>+1 Octave (+12st)</span>
            </div>
          </div>

          {/* Playback Tempo Speed */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Playback Speed (Tempo)</span>
              <span className="font-mono text-amber-300">{playbackRate.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.5"
              step="0.05"
              value={playbackRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPlaybackRate(val);
                updatePitchTempo({ playbackRate: val });
              }}
              className="w-full"
            />
            <div className="flex items-center gap-1.5 pt-1">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    updatePitchTempo({ playbackRate: rate });
                  }}
                  className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                    Math.abs(playbackRate - rate) < 0.01
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          {/* Preserve Pitch Toggle (Key Lock vs Tape Varispeed) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Preserve Pitch (Key Lock)</span>
              <span className="text-[10px] text-zinc-500">
                {pitchTempo.preservePitch 
                  ? 'Active: Speed change does not affect musical key' 
                  : 'Varispeed: Analog vinyl/tape pitch linked to speed'}
              </span>
            </div>
            <button
              onClick={() => updatePitchTempo({ preservePitch: !pitchTempo.preservePitch })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                pitchTempo.preservePitch
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {pitchTempo.preservePitch ? 'KEY LOCKED' : 'VARISPEED'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
