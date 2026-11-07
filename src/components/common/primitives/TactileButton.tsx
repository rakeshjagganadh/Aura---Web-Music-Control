import React from 'react';

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
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
        'bg-white text-black font-semibold hover:bg-zinc-200 active:bg-zinc-300 shadow-md border border-white/20',
      secondary:
        'bg-white/[0.08] text-white font-medium hover:bg-white/[0.14] active:bg-white/[0.18] border border-white/10 hover:border-white/25',
      ghost:
        'bg-transparent text-zinc-400 font-medium hover:text-white hover:bg-white/[0.06] active:bg-white/[0.10]',
      glass:
        'bg-[#0c0e14]/70 text-white font-medium backdrop-blur-xl border border-white/12 hover:border-white/30 hover:bg-[#141724]/85 active:scale-[0.98]',
      danger:
        'bg-rose-600/20 text-rose-300 font-medium border border-rose-500/30 hover:bg-rose-600/30 active:bg-rose-600/40',
    }[variant];

    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
      md: 'px-3.5 py-1.5 text-xs font-medium rounded-xl gap-2',
      lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2.5',
      icon: 'p-2 text-xs rounded-xl flex items-center justify-center shrink-0',
    }[size];

    const disabledClasses = disabled
      ? 'opacity-40 pointer-events-none cursor-not-allowed'
      : 'cursor-pointer active:scale-[0.98] transition-all duration-150';

    const focusClasses =
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070a]';

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
