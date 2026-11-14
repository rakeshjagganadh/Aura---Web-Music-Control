import React from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from './motion/MotionSurface';
import { useMusic } from '../../context/MusicContext';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause audio' },
  { key: '← / →', desc: 'Seek 10s backward / forward' },
  { key: '↑ / ↓', desc: 'Volume up / down' },
  { key: 'M', desc: 'Mute / Unmute' },
  { key: 'N', desc: 'Next track' },
  { key: 'P', desc: 'Previous track' },
  { key: 'S', desc: 'Toggle Shuffle' },
  { key: 'R', desc: 'Cycle Repeat mode' },
  { key: 'L', desc: 'Favorite active track' },
  { key: 'I', desc: 'Track metadata inspector' },
  { key: 'Q', desc: 'Toggle Up Next queue' },
  { key: 'E', desc: 'Toggle Audio Studio & EQ' },
  { key: 'F', desc: 'Toggle Fullscreen Studio' },
  { key: '/', desc: 'Focus Search bar' },
  { key: '?', desc: 'Show this shortcuts sheet' },
];

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen } = useMusic();
  const modalRef = useDialogAccessibility<HTMLDivElement>({
    isOpen: isShortcutsModalOpen,
    onClose: () => setIsShortcutsModalOpen(false),
  });

  return (
    <AnimatePresence>
      {isShortcutsModalOpen && (
        <MotionBackdrop
          onClick={() => setIsShortcutsModalOpen(false)}
          style={{ pointerEvents: isShortcutsModalOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <MotionModal
            ref={modalRef}
            variant="center"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard Shortcuts"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl p-6 flex flex-col gap-5"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Keyboard Shortcuts</h3>
              </div>

              <button
                type="button"
                aria-label="Close keyboard shortcuts"
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto">
              {SHORTCUTS.map((sc) => (
                <div
                  key={sc.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs"
                >
                  <span className="text-zinc-400">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[11px] border border-white/10 shadow-sm shrink-0 ml-2">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-zinc-500 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">?</kbd> anywhere to open this dialog.
            </p>
          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
