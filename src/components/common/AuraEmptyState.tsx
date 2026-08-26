import React from 'react';
import { LucideIcon, Music, Plus, UploadCloud } from 'lucide-react';

interface AuraEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const AuraEmptyState: React.FC<AuraEmptyStateProps> = ({
  icon: Icon = Music,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center p-12 sm:p-16 rounded-3xl bg-[#0e1017]/60 border border-white/5 backdrop-blur-sm overflow-hidden select-none ${className}`}
    >
      {/* Subtle background acoustic echo lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-64 h-64 rounded-full border border-indigo-400/30 animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full border border-white/10" />
      </div>

      {/* Icon with refined aura ring */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-center text-zinc-400 shadow-xl shadow-black/40">
          <Icon className="w-6 h-6 text-zinc-400" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-transparent blur-sm -z-10" />
      </div>

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
              onClick={onAction}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
