import React from 'react';
import { LayoutGroup } from 'motion/react';
import { MotionIconSwap, SharedIndicator } from '../common/motion/MotionInteractive';
import { useMusic } from '../../context/MusicContext';
import { formatSeconds, formatPreciseSeconds } from '../../utils/formatTime';
import { 
  Repeat, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Check, 
  Pin, 
  Scissors, 
  Clock 
} from 'lucide-react';
import { LoopABMode } from '../../types';

export const LoopABController: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    seek,
    loopAB,
    setLoopPointA,
    setLoopPointB,
    clearLoopAB,
    toggleLoopAB,
    setLoopABMode,
    updateLoopAB,
    showToast,
  } = useMusic();

  const handleNudgeA = (delta: number) => {
    if (loopAB.pointA === null) return;
    const newA = Math.max(0, loopAB.pointA + delta);
    if (loopAB.pointB !== null && newA >= loopAB.pointB) return;
    updateLoopAB({ pointA: newA });
  };

  const handleNudgeB = (delta: number) => {
    if (loopAB.pointB === null) return;
    const newB = Math.min(duration || 9999, loopAB.pointB + delta);
    if (loopAB.pointA !== null && newB <= loopAB.pointA) return;
    updateLoopAB({ pointB: newB });
  };

  const modes: { label: string; mode: LoopABMode }[] = [
    { label: 'Infinite', mode: 'forever' },
    { label: '1x Repeat', mode: 1 },
    { label: '2x Repeats', mode: 2 },
    { label: '4x Repeats', mode: 4 },
  ];

  const loopLength = (loopAB.pointA !== null && loopAB.pointB !== null)
    ? Math.max(0, loopAB.pointB - loopAB.pointA)
    : 0;

  return (
    <div id="loop-ab-controller" className="flex flex-col gap-5 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Precision A/B Loop Studio</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Isolate phrases, solos, or groove sections with zero-gap loop boundaries.
            </p>
          </div>
        </div>

        {/* State Indicators & Clear */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-loop-ab-active-btn"
            type="button"
            onClick={() => toggleLoopAB()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer aura-pressable aura-focus-ring ${
              loopAB.enabled
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/10'
                : 'bg-zinc-800 text-zinc-400 border-white/10 hover:bg-zinc-700'
            }`}
          >
            <MotionIconSwap stateKey={loopAB.enabled ? 'on' : 'off'}>
              <Repeat className="w-3.5 h-3.5" />
            </MotionIconSwap>
            <span>{loopAB.enabled ? 'Looping Active' : 'Loop Off'}</span>
            {loopAB.enabled && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>

          <button
            id="clear-loop-ab-btn"
            type="button"
            onClick={clearLoopAB}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <RotateCcw className="w-3 h-3" />
            Clear A/B
          </button>
        </div>
      </div>

      {/* Points & Nudge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Point A Panel */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold font-mono text-xs flex items-center justify-center border border-purple-500/30">
                A
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Loop Start Point</h4>
                <p className="text-[10px] text-zinc-400">Mark cue point for phrase beginning</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/30">
              {loopAB.pointA !== null ? formatPreciseSeconds(loopAB.pointA) : '--:--.-'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="set-point-a-btn"
              type="button"
              onClick={() => setLoopPointA()}
              className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-purple-600/20 cursor-pointer aura-pressable aura-focus-ring"
            >
              <Pin className="w-3.5 h-3.5" />
              Set Point A (Here)
            </button>
            <button
              type="button"
              disabled={loopAB.pointA === null}
              onClick={() => handleNudgeA(-0.1)}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              title="Nudge Point A backward -0.1s"
            >
              -0.1s
            </button>
            <button
              type="button"
              disabled={loopAB.pointA === null}
              onClick={() => handleNudgeA(0.1)}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              title="Nudge Point A forward +0.1s"
            >
              +0.1s
            </button>
          </div>
        </div>

        {/* Point B Panel */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 font-bold font-mono text-xs flex items-center justify-center border border-pink-500/30">
                B
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Loop End Point</h4>
                <p className="text-[10px] text-zinc-400">Mark loop boundary for seamless restart</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-pink-300 bg-pink-950/40 px-2.5 py-1 rounded-lg border border-pink-800/30">
              {loopAB.pointB !== null ? formatPreciseSeconds(loopAB.pointB) : '--:--.-'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="set-point-b-btn"
              type="button"
              onClick={() => setLoopPointB()}
              className="flex-1 py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-pink-600/20 cursor-pointer aura-pressable aura-focus-ring"
            >
              <Pin className="w-3.5 h-3.5" />
              Set Point B (Here)
            </button>
            <button
              type="button"
              disabled={loopAB.pointB === null}
              onClick={() => handleNudgeB(-0.1)}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              title="Nudge Point B backward -0.1s"
            >
              -0.1s
            </button>
            <button
              type="button"
              disabled={loopAB.pointB === null}
              onClick={() => handleNudgeB(0.1)}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              title="Nudge Point B forward +0.1s"
            >
              +0.1s
            </button>
          </div>
        </div>
      </div>

      {/* Mode & Details Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/40 border border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400">Loop Repetition:</span>
          <LayoutGroup id="loop-ab-modes">
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10">
              {modes.map((m) => {
                const isSelected = loopAB.mode === m.mode;
                return (
                  <button
                    key={String(m.mode)}
                    type="button"
                    onClick={() => setLoopABMode(m.mode)}
                    className={`relative px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer aura-pressable aura-focus-ring ${
                      isSelected
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isSelected && (
                      <SharedIndicator
                        layoutId="loop-ab-mode-pill"
                        className="absolute inset-0 rounded-lg bg-purple-600 shadow-sm pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Section info */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Region Span:</span>
            <span className="text-white font-bold">{formatPreciseSeconds(loopLength)}</span>
          </div>

          {loopAB.pointA !== null && (
            <button
              type="button"
              onClick={() => seek(loopAB.pointA!)}
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors cursor-pointer aura-pressable aura-focus-ring rounded px-1"
            >
              Jump to A
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
