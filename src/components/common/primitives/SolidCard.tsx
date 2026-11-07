import React from 'react';

export interface SolidCardProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  as?: React.ElementType;
  variant?: 'flat' | 'elevated' | 'milled';
  interactive?: boolean;
  selected?: boolean;
  className?: string;
}

export const SolidCard: React.FC<SolidCardProps> = ({
  children,
  as: Component = 'div',
  variant = 'elevated',
  interactive = false,
  selected = false,
  className = '',
  ...props
}) => {
  const variantClasses = {
    flat: 'bg-[#0b0d13] border-white/[0.05]',
    elevated: 'bg-[#11131b] border-white/[0.08]',
    milled: 'bg-[#171a24] border-white/[0.12]',
  }[variant];

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-200 hover:bg-[#181b26] hover:border-white/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
    : '';

  const selectedClasses = selected
    ? 'ring-1 ring-white/50 border-white/30 shadow-lg'
    : '';

  return (
    <Component
      className={`relative border rounded-xl ${variantClasses} ${interactiveClasses} ${selectedClasses} ${className}`}
      tabIndex={interactive && props.tabIndex === undefined ? 0 : props.tabIndex}
      {...props}
    >
      {children}
    </Component>
  );
};
