import React from 'react';
import {
  AURA_ICON_SIZES,
  AuraIconName,
  AuraIconSize,
  ICON_REGISTRY,
} from '../../icons/iconRegistry';
import { useMaterialSymbolsStatus } from '../../icons/fontStatus';

export interface AuraIconProps {
  name: AuraIconName;
  size?: AuraIconSize | number;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  filled?: boolean;
  grade?: number;
  opticalSize?: number;
  label?: string;
  decorative?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function resolveSizePx(size?: AuraIconSize | number): number {
  if (typeof size === 'number' && Number.isFinite(size)) {
    return size;
  }
  if (size && size in AURA_ICON_SIZES) {
    return AURA_ICON_SIZES[size as AuraIconSize];
  }
  return AURA_ICON_SIZES.md;
}

/**
 * Minimal vector fallback rendered ONLY if Material Symbols font fails to load
 * (e.g. offline first launch / blocked CDN), preventing raw ligature ASCII text leaks.
 */
const FallbackGlyphSvg: React.FC<{ name: AuraIconName; size: number; className?: string }> = ({
  name,
  size,
  className = '',
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `inline-block shrink-0 ${className}`.trim(),
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'play':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <polygon points="7,5 19,12 7,19" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      );
    case 'skipNext':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <polygon points="5,5 15,12 5,19" />
          <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
        </svg>
      );
    case 'skipPrevious':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="5" y="5" width="2.5" height="14" rx="1" />
          <polygon points="19,5 9,12 19,19" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case 'add':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case 'chevronLeft':
    case 'arrowLeft':
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    case 'chevronRight':
    case 'arrowRight':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case 'chevronUp':
      return (
        <svg {...common}>
          <path d="M6 15l6-6 6 6" />
        </svg>
      );
    case 'chevronDown':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5L12 4l8 6.5V20h-5v-5H9v5H4z" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="6" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="18" cy="12" r="1.7" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
};

export const AuraIcon: React.FC<AuraIconProps> = ({
  name,
  size = 'md',
  weight,
  filled,
  grade = 0,
  opticalSize,
  label,
  decorative,
  className = '',
  style,
}) => {
  const fontStatus = useMaterialSymbolsStatus();
  const entry = ICON_REGISTRY[name] as {
    ligature: string;
    defaultFilled?: boolean;
    defaultWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  };
  const resolvedSize = resolveSizePx(size);
  const resolvedFilled = filled ?? entry.defaultFilled ?? false;
  const resolvedWeight = weight ?? entry.defaultWeight ?? 400;
  const resolvedOpsz = opticalSize ?? Math.min(48, Math.max(20, Math.round(resolvedSize)));
  const isDecorative = decorative ?? !label;

  const accessibilityProps = isDecorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label };

  if (fontStatus === 'fallback') {
    return (
      <span
        {...accessibilityProps}
        className={`inline-flex items-center justify-center shrink-0 select-none ${className}`.trim()}
        style={{
          width: resolvedSize,
          height: resolvedSize,
          ...style,
        }}
      >
        <FallbackGlyphSvg name={name} size={resolvedSize} />
      </span>
    );
  }

  return (
    <span
      {...accessibilityProps}
      className={`aura-material-symbol ${className}`.trim()}
      style={{
        fontSize: resolvedSize,
        width: resolvedSize,
        height: resolvedSize,
        fontVariationSettings: `'FILL' ${resolvedFilled ? 1 : 0}, 'wght' ${resolvedWeight}, 'GRAD' ${grade}, 'opsz' ${resolvedOpsz}`,
        ...style,
      }}
    >
      {entry.ligature}
    </span>
  );
};
