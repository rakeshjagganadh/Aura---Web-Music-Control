import React from 'react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  as?: React.ElementType;
  intensity?: 'subtle' | 'standard' | 'prominent';
  interactive?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  as: Component = 'div',
  intensity = 'standard',
  interactive = false,
  elevation = 'md',
  className = '',
  ...props
}) => {
  const intensityClasses = {
    subtle: 'bg-[#0c0e14]/60 backdrop-blur-md border-white/[0.06]',
    standard: 'bg-[#0c0e14]/78 backdrop-blur-xl border-white/[0.10]',
    prominent: 'bg-[#0e1017]/90 backdrop-blur-2xl border-white/[0.14]',
  }[intensity];

  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg shadow-black/40',
    lg: 'shadow-2xl shadow-black/70',
  }[elevation];

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-200 hover:bg-[#141724]/85 hover:border-white/20 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
    : '';

  return (
    <Component
      className={`relative border rounded-xl ${intensityClasses} ${elevationClasses} ${interactiveClasses} ${className}`}
      style={{
        boxShadow: intensity !== 'subtle' ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.10)' : undefined,
      }}
      tabIndex={interactive && props.tabIndex === undefined ? 0 : props.tabIndex}
      {...props}
    >
      {children}
    </Component>
  );
};
