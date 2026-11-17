import React from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionFadeSlide } from './motion/MotionSurface';
import { useMusic } from '../../context/MusicContext';
import { AuraIcon } from '../ui/AuraIcon';
import { AuraIconName } from '../../icons/iconRegistry';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useMusic();

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-3 right-3 sm:left-auto sm:right-4 bottom-[calc(148px+env(safe-area-inset-bottom,0px))] lg:bottom-24 z-50 flex flex-col gap-2 pointer-events-none sm:w-full sm:max-w-sm"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          let iconName: AuraIconName = 'info';
          let borderClass = 'border-indigo-500/40 text-indigo-200';
          let bgClass = 'bg-[#0f1117]/95';

          if (toast.type === 'success') {
            iconName = 'checkCircle';
            borderClass = 'border-emerald-500/40 text-emerald-200';
          } else if (toast.type === 'error') {
            iconName = 'alertCircle';
            borderClass = 'border-rose-500/40 text-rose-200';
          } else if (toast.type === 'warning') {
            iconName = 'alertTriangle';
            borderClass = 'border-amber-500/40 text-amber-200';
          }

          return (
            <MotionFadeSlide
              key={toast.id}
              layout="position"
              direction="up"
              distance={10}
              duration="micro"
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border ${borderClass} ${bgClass} shadow-xl backdrop-blur-xl`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AuraIcon name={iconName} size={16} />
                <p className="text-xs font-medium text-zinc-200 truncate">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring shrink-0"
              >
                <AuraIcon name="close" size={14} />
              </button>
            </MotionFadeSlide>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
