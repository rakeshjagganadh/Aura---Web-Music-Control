import React from 'react';
import { MotionIconSwap } from '../common/motion/MotionInteractive';
import { useMusic } from '../../context/MusicContext';
import { ChannelMode } from '../../types';
import { 
  Split, 
  RotateCcw, 
  Disc3, 
  Check,
  Radio,
  Sliders,
  Volume2,
  Lock,
  Unlock,
  ArrowRightLeft
} from 'lucide-react';

interface ChannelModeConfig {
  id: ChannelMode;
  label: string;
  flowDiagram: string;
  desc: string;
  useCase: string;
}

const CHANNEL_MODES: ChannelModeConfig[] = [
  { 
    id: 'stereo', 
    label: 'Standard Discrete Stereo', 
    flowDiagram: 'L → L  ·  R → R',
    desc: 'Normal unsummed Left and Right channel separation.',
    useCase: 'Default reference monitoring'
  },
  { 
    id: 'mono', 
    label: 'Mono Sum', 
    flowDiagram: '(L + R) → Both Ears',
    desc: 'Sums both channels equally into mono across both ears.',
    useCase: 'Phase cancellation & mix compatibility check'
  },
  { 
    id: 'swap', 
    label: 'Swap Channels', 
    flowDiagram: 'L → R  ·  R → L',
    desc: 'Inverts stereo staging across Left and Right monitors.',
    useCase: 'Headphone orientation check & balance symmetry'
  },
  { 
    id: 'invertL', 
    label: 'Invert Left Phase (Ø L)', 
    flowDiagram: '-L → L  ·  R → R',
    desc: '180° polarity flip on the Left channel.',
    useCase: 'Center-panned vocal isolation & stereo difference'
  },
  { 
    id: 'invertR', 
    label: 'Invert Right Phase (Ø R)', 
    flowDiagram: 'L → L  ·  -R → R',
    desc: '180° polarity flip on the Right channel.',
    useCase: 'Phase correlation testing & out-of-phase diagnosis'
  },
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

  const handleResetAll = () => {
    updateChannels({ mode: 'stereo', balance: 0 });
    setBalance(0);
    resetPitchTempo();
  };

  const handleCenterBalance = () => {
    setBalance(0);
  };

  const handleResetPitch = () => {
    updatePitchTempo({ pitchSemitones: 0 });
  };

  const handleResetTempo = () => {
    setPlaybackRate(1.0);
    updatePitchTempo({ playbackRate: 1.0 });
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Split className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Channel Matrix & Pitch / Speed Studio</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-blue-400 border border-blue-500/20">
                DSP ROUTING & VARISPEED
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Discrete stereo cross-matrix routing, polarity inversion, pitch transposition, and master tempo shaping.
            </p>
          </div>
        </div>

        {/* Global Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            title="Reset Channel Matrix, Balance Pan, and Pitch/Tempo to studio defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Matrix</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Section 1 (Channel Routing & Balance) & Section 2 (Pitch & Speed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* ======================================================== */}
        {/* SECTION 1: CHANNEL MATRIX ROUTING & STEREO PAN BALANCE  */}
        {/* ======================================================== */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col justify-between gap-5 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Channel Matrix Routing</h3>
                <p className="text-[11px] text-zinc-400">Signal path topology across discrete stereo DAC channels</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-blue-300 border border-white/10 uppercase">
                {channel.mode}
              </span>
            </div>

            {/* Routing Mode Buttons */}
            <div className="flex flex-col gap-2">
              {CHANNEL_MODES.map((m) => {
                const isSelected = channel.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateChannels({ mode: m.id })}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer aura-pressable-subtle aura-focus-ring ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/40 text-white shadow-sm'
                        : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{m.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950/80 text-blue-300 border border-white/5">
                          {m.flowDiagram}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</span>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600 uppercase">{m.useCase}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stereo Balance Pan Section */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                <span>Stereo Balance (Pan)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-300 tabular-nums">
                  {balance === 0
                    ? 'Center (0)'
                    : balance < 0
                    ? `L ${Math.round(Math.abs(balance) * 100)}%`
                    : `R ${Math.round(balance * 100)}%`}
                </span>
                <button
                  type="button"
                  onClick={handleCenterBalance}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline cursor-pointer aura-pressable aura-focus-ring rounded px-1"
                >
                  Center
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-400 font-bold">L</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg accent-blue-400 cursor-pointer"
                aria-label="Stereo Pan Balance"
              />
              <span className="text-[10px] font-mono text-zinc-400 font-bold">R</span>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
              <span>Full Left (-100%)</span>
              <span>Center (0)</span>
              <span>Full Right (+100%)</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: PITCH TRANSPOSITION & MASTER TEMPO SPEED     */}
        {/* ======================================================== */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col justify-between gap-5 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pitch & Master Tempo Studio</h3>
                  <p className="text-[11px] text-zinc-400">Independent musical pitch shifting and variable speed playback</p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-white/10 tabular-nums">
                {pitchTempo.pitchSemitones > 0 ? `+${pitchTempo.pitchSemitones}` : pitchTempo.pitchSemitones} st · {playbackRate.toFixed(2)}×
              </span>
            </div>

            {/* 1. Pitch Transposition */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-200 font-semibold block">Pitch Transposition</span>
                  <span className="text-[10px] text-zinc-400">Musical pitch shift in equal-tempered semitones</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                    {pitchTempo.pitchSemitones > 0 ? `+${pitchTempo.pitchSemitones}` : pitchTempo.pitchSemitones} st
                  </span>
                  {pitchTempo.pitchSemitones !== 0 && (
                    <button
                      type="button"
                      onClick={handleResetPitch}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium hover:underline cursor-pointer aura-pressable aura-focus-ring rounded px-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                disabled={pitchTempo.preservePitch}
                value={pitchTempo.pitchSemitones || 0}
                onChange={(e) => updatePitchTempo({ pitchSemitones: parseInt(e.target.value, 10) })}
                className={`w-full h-1.5 bg-zinc-800 rounded accent-amber-400 ${pitchTempo.preservePitch ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label="Pitch Transposition in Semitones"
              />

              <div className="flex justify-between text-[9px] font-mono text-zinc-500 tabular-nums">
                <span>-12 st (-1 Octave)</span>
                <span>0 st (Original Key)</span>
                <span>+12 st (+1 Octave)</span>
              </div>

              {pitchTempo.preservePitch && (
                <div className="flex items-center justify-between gap-2 pt-1.5 mt-0.5 border-t border-white/5 text-[11px]">
                  <span className="text-zinc-400">Requires Varispeed Mode (Key Lock is active)</span>
                  <button
                    type="button"
                    onClick={() => updatePitchTempo({ preservePitch: false })}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-semibold cursor-pointer aura-pressable aura-focus-ring shrink-0"
                  >
                    Enable Varispeed
                  </button>
                </div>
              )}
            </div>

            {/* 2. Playback Speed (Tempo) */}
            <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-200 font-semibold block">Playback Speed (Master Tempo)</span>
                  <span className="text-[10px] text-zinc-400">Continuous speed multiplier</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                    {playbackRate.toFixed(2)}×
                  </span>
                  {Math.abs(playbackRate - 1.0) > 0.01 && (
                    <button
                      type="button"
                      onClick={handleResetTempo}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium hover:underline cursor-pointer aura-pressable aura-focus-ring rounded px-1"
                    >
                      1.0×
                    </button>
                  )}
                </div>
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
                className="w-full h-1.5 bg-zinc-800 rounded accent-amber-400 cursor-pointer"
                aria-label="Playback Speed"
              />

              {/* Snap Rate Buttons */}
              <div className="grid grid-cols-6 gap-1 pt-1">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => {
                  const isCurrent = Math.abs(playbackRate - rate) < 0.01;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(rate);
                        updatePitchTempo({ playbackRate: rate });
                      }}
                      className={`py-1 text-[11px] font-mono rounded-lg transition-colors border cursor-pointer aura-pressable aura-focus-ring ${
                        isCurrent
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/5'
                      }`}
                    >
                      {rate}×
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Key Lock / Varispeed Segmented Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2.5">
              <MotionIconSwap stateKey={pitchTempo.preservePitch} className="inline-flex items-center justify-center shrink-0">
                {pitchTempo.preservePitch ? (
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </MotionIconSwap>
              <div>
                <span className="text-xs font-bold text-white block">
                  {pitchTempo.preservePitch ? 'Key Lock Active (Pitch Preserved)' : 'Varispeed Mode (Pitch Linked)'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {pitchTempo.preservePitch
                    ? 'Speed adjustments preserve musical key and pitch integrity.'
                    : 'Analog tape/vinyl mode: Speed shifts pitch naturally in tandem.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updatePitchTempo({ preservePitch: !pitchTempo.preservePitch })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border whitespace-nowrap shrink-0 cursor-pointer aura-pressable aura-focus-ring ${
                pitchTempo.preservePitch
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
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
