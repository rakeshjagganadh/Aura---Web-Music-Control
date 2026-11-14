import React from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { X, Share, PlusSquare, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
}) => {
  const modalRef = useDialogAccessibility<HTMLDivElement>({ isOpen, onClose });

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBackdrop
          id="pwa-install-modal"
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={onClose}
        >
          <MotionModal
            ref={modalRef}
            variant="center"
            role="dialog"
            aria-modal="true"
            aria-label="Install AURA Studio"
            className="w-full max-w-md bg-[#0d0f15] border border-white/12 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-indigo-500/15 blur-2xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer aura-pressable"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with AURA Home Screen Logo */}
        <div className="flex items-center gap-3.5 mb-6">
          <AuraBrandMark size={42} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Install AURA Studio</h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Standalone mobile audio application</p>
          </div>
        </div>

        {/* Content based on platform */}
        {isIOS ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Install AURA directly to your home screen using Safari for a full-screen, standalone music app experience with zero browser address bars.
            </p>

            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">1. Tap the Share button</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Located at the bottom of Safari's browser bar</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">2. Select "Add to Home Screen"</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Scroll down in the action sheet to find this option</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">3. Tap "Add"</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Top-right corner. The AURA Studio icon will appear on your screen</div>
                </div>
              </div>
            </div>

            {/* Standalone Benefits Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-zinc-400">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Full-screen audio player, offline app shell, and quick launcher.</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Install AURA Studio on your device for quick home screen access, full-screen playback, and seamless standalone audio controls.
            </p>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300 flex flex-col gap-2">
              <div className="font-semibold text-white">From your browser menu:</div>
              <p className="text-zinc-400 text-[11px]">
                Tap the three dots (⋮) in Chrome or your browser's address bar icon, then select <span className="text-white font-medium">"Install app"</span> or <span className="text-white font-medium">"Add to Home screen"</span>.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer aura-pressable"
          >
            Got it
          </button>
        </div>
          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
