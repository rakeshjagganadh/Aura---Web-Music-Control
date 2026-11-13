import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { X, Download, Smartphone } from 'lucide-react';
import { AuraBrandMark } from '../common/AuraBrandMark';

interface PWAInstallBannerProps {
  canInstall: boolean;
  isInstalled: boolean;
  isBannerDismissed: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  canInstall,
  isInstalled,
  isBannerDismissed,
  onInstall,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (isInstalled || isBannerDismissed || !canInstall) {
      setIsVisible(false);
      return;
    }

    // Delay presentation by 6 seconds so user is not interrupted on immediate visit
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [isInstalled, isBannerDismissed, canInstall]);

  const showBanner = isVisible && !isInstalled && !isBannerDismissed && canInstall;

  return (
    <AnimatePresence>
      {showBanner && (
        <MotionFadeSlide
          id="pwa-install-banner"
          direction="up"
          distance={14}
          duration="standard"
          style={{ pointerEvents: showBanner ? 'auto' : 'none' }}
          className="fixed bottom-20 sm:bottom-24 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 select-none"
        >
          <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#13151d]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/80">
            
            {/* Left: Icon & Label */}
            <div className="flex items-center gap-3 min-w-0">
              <AuraBrandMark size={34} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight truncate">Install AURA Studio</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                    APP
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  Full-screen music & home screen icon
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onInstall}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer shadow-sm aura-pressable"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVisible(false);
                  onDismiss();
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer aura-pressable"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </MotionFadeSlide>
      )}
    </AnimatePresence>
  );
};
