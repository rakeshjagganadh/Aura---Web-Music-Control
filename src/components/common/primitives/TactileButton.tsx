import React from 'react';

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger' | 'indigo' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
}

export const TactileButton = React.forwardRef<HTMLButtonElement, TactileButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        'bg-white text-zinc-950 font-semibold hover:bg-zinc-200 active:bg-zinc-300 shadow-md border border-white/20',
      secondary:
        'bg-white/[0.06] text-white font-medium hover:bg-white/[0.12] active:bg-white/[0.16] border border-white/10 hover:border-white/20',
      ghost:
        'bg-transparent text-zinc-400 font-medium hover:text-white hover:bg-white/[0.06] active:bg-white/[0.10]',
      glass:
        'glass-reflective text-white font-medium hover:border-white/30 active:scale-[0.98]',
      danger:
        'bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30 hover:bg-rose-500/30 active:bg-rose-500/40',
      indigo:
        'bg-indigo-600 text-white font-semibold hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-600/20 border border-indigo-400/30',
      emerald:
        'bg-emerald-600 text-white font-semibold hover:bg-emerald-500 active:bg-emerald-700 shadow-md shadow-emerald-600/20 border border-emerald-400/30',
    }[variant];

    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
      md: 'px-3.5 py-1.5 text-xs font-medium rounded-xl gap-2',
      lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2.5',
      icon: 'p-2 text-xs rounded-xl flex items-center justify-center shrink-0 min-w-[36px] min-h-[36px]',
    }[size];

    const disabledClasses = disabled
      ? 'opacity-40 pointer-events-none cursor-not-allowed'
      : 'cursor-pointer active:scale-[0.98] transition-all duration-150';

    const focusClasses = 'aura-focus-ring';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center select-none ${variantClasses} ${sizeClasses} ${disabledClasses} ${focusClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TactileButton.displayName = 'TactileButton';
