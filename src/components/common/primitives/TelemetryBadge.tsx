import React from 'react';

export interface TelemetryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'active' | 'amber' | 'cyan' | 'emerald' | 'rose' | 'purple' | 'youtube' | 'glass';
  size?: 'sm' | 'md';
  dot?: boolean;
  dotPulse?: boolean;
  className?: string;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotPulse = false,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-white/[0.05] text-zinc-400 border-white/[0.08]',
    active: 'bg-white/10 text-white border-white/20 font-semibold',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    youtube: 'bg-red-500/15 text-red-300 border-red-500/30',
    glass: 'aura-glass-tier3 text-zinc-300',
  }[variant];

  const dotColorClasses = {
    default: 'bg-zinc-400',
    active: 'bg-white',
    amber: 'bg-amber-400',
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    purple: 'bg-purple-400',
    youtube: 'bg-red-400',
    glass: 'bg-zinc-300',
  }[variant];

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 rounded gap-1',
    md: 'text-[10px] px-2 py-0.5 rounded-md gap-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider border font-medium select-none ${variantClasses} ${sizeClasses} ${className}`}
      style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClasses} ${
            dotPulse ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
