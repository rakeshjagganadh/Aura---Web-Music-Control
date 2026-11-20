import React from 'react';
import { AuraIcon } from '../ui/AuraIcon';
import { AuraIconName } from '../../icons/iconRegistry';
import { MotionFadeSlide } from './motion/MotionSurface';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';

interface AuraEmptyStateProps {
  icon?: AuraIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const AuraEmptyState: React.FC<AuraEmptyStateProps> = ({
  icon = 'musicNote',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <MotionFadeSlide
      direction="up"
      distance={10}
      duration="standard"
      className={`relative flex flex-col items-center justify-center text-center p-10 sm:p-14 rounded-2xl bg-[#0e1017]/60 border border-white/[0.06] backdrop-blur-sm overflow-hidden select-none ${className}`}
    >
      <AuraIcon name={icon} size={32} className="text-zinc-500 mb-4" />

      <h3 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold shadow-md transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <AuraIcon name="add" size={14} weight={600} />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-medium transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <AuraIcon name="add" size={14} className="text-zinc-400" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </MotionFadeSlide>
  );
};
