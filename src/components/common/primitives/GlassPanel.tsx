import React from 'react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  as?: React.ElementType;
  tier?: 'tier1' | 'tier2' | 'tier3';
  intensity?: 'subtle' | 'standard' | 'prominent'; // Backwards compatibility alias
  interactive?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  as: Component = 'div',
  tier,
  intensity = 'standard',
  interactive = false,
  elevation = 'md',
  className = '',
  ...props
}) => {
  // Map tier or legacy intensity to AURA 3.0 Glass System Tiers
  const resolvedTier = tier || {
    subtle: 'tier3',
    standard: 'tier2',
    prominent: 'tier1',
  }[intensity];

  const tierClasses = {
    tier1: 'aura-glass-tier1',
    tier2: 'aura-glass-tier2',
    tier3: 'aura-glass-tier3',
  }[resolvedTier];

  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg shadow-black/40',
    lg: 'shadow-2xl shadow-black/70',
  }[elevation];

  const interactiveClasses = interactive
    ? 'cursor-pointer active:scale-[0.99] aura-focus-ring'
    : '';

  return (
    <Component
      className={`relative rounded-2xl ${tierClasses} ${elevationClasses} ${interactiveClasses} ${className}`}
      tabIndex={interactive && props.tabIndex === undefined ? 0 : props.tabIndex}
      {...props}
    >
      {children}
    </Component>
  );
};
