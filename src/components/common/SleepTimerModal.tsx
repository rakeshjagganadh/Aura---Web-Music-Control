import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from './motion/MotionSurface';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { useMusic } from '../../context/MusicContext';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { 
  X, 
  Moon, 
  Clock, 
  Check, 
  Timer, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const {
    sleepTimerMinutes,
    sleepTimerRemainingSecs,
    isSleepTimerActive,
    startSleepTimer,
    setSleepTimerAtTrackEnd,
    cancelSleepTimer,
  } = useMusic();

  const [customMinutes, setCustomMinutes] = useState<string>('20');
  const { prefersReducedMotion } = useMotionCapabilities();
  const modalRef = useDialogAccessibility<HTMLDivElement>({ isOpen, onClose });

  const presets = [
    { label: '5 Minutes', value: 5 },
    { label: '15 Minutes', value: 15 },
    { label: '30 Minutes', value: 30 },
    { label: '45 Minutes', value: 45 },
    { label: '60 Minutes', value: 60 },
  ];

  const formatRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSetCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val) && val > 0 && val <= 240) {
      startSleepTimer(val);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBackdrop
          onClick={onClose}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <MotionModal
            ref={modalRef}
            variant="center"
            role="dialog"
            aria-modal="true"
            aria-label="Sleep Timer"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl p-6 flex flex-col gap-5"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Sleep Timer</h3>
              <p className="text-xs text-zinc-400">Audio will gently fade out when timer expires</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sleep timer modal"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer aura-pressable aura-focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Timer Countdown Status */}
        {isSleepTimerActive && sleepTimerRemainingSecs !== null && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
            <div className="flex items-center gap-2.5">
              <Timer className={`w-4 h-4 text-indigo-400 ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
              <div>
                <span className="text-xs font-semibold text-indigo-200">Active Timer Countdown</span>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {formatRemaining(sleepTimerRemainingSecs)} remaining
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                cancelSleepTimer();
              }}
              className="px-3 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              Cancel Timer
            </button>
          </div>
        )}

        {/* Presets Grid */}
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => {
            const isSelected = isSleepTimerActive && sleepTimerMinutes === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  startSleepTimer(p.value);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer aura-pressable-subtle aura-focus-ring ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500/40 text-white font-semibold'
                    : 'bg-zinc-900/50 hover:bg-zinc-800/80 border-white/5 text-zinc-300 hover:text-white'
                }`}
              >
                <span>{p.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}

          {/* End of Current Track Button */}
          <button
            type="button"
            onClick={() => {
              setSleepTimerAtTrackEnd();
              onClose();
            }}
            className={`col-span-2 flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer aura-pressable-subtle aura-focus-ring ${
              isSleepTimerActive && sleepTimerMinutes === -1
                ? 'bg-indigo-600/30 border-indigo-500/40 text-white font-semibold'
                : 'bg-zinc-900/50 hover:bg-zinc-800/80 border-white/5 text-zinc-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stop at End of Current Track</span>
            </div>
            {isSleepTimerActive && sleepTimerMinutes === -1 && (
              <Check className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>
        </div>

        {/* Custom Minutes Input */}
        <form onSubmit={handleSetCustom} className="flex items-center gap-2 pt-2 border-t border-white/5">
          <input
            type="number"
            min="1"
            max="240"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Custom mins"
            className="flex-1 px-3 py-2 text-xs bg-zinc-900/80 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-indigo-600/20 cursor-pointer aura-pressable"
          >
            Set Custom
          </button>
        </form>

          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
