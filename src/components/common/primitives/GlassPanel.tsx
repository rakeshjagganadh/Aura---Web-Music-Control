import React from 'react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  as?: React.ElementType;
  tier?: 'immersive' | 'floating' | 'reflective' | 'ambient' | 'frosted' | 'solid' | 'tier1' | 'tier2' | 'tier3';
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
    subtle: 'ambient',
    standard: 'floating',
    prominent: 'immersive',
  }[intensity];

  const tierClasses: Record<string, string> = {
    immersive: 'glass-immersive',
    floating: 'glass-floating',
    reflective: 'glass-reflective',
    ambient: 'glass-ambient',
    frosted: 'glass-frosted',
    solid: 'glass-solid',
    tier1: 'glass-immersive',
    tier2: 'glass-floating',
    tier3: 'glass-ambient',
  };

  const selectedTierClass = tierClasses[resolvedTier] || 'glass-floating';

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
      className={`relative rounded-2xl ${selectedTierClass} ${elevationClasses} ${interactiveClasses} ${className}`}
      tabIndex={interactive && props.tabIndex === undefined ? 0 : props.tabIndex}
      {...props}
    >
      {children}
    </Component>
  );
};
