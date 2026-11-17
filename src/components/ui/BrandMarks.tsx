import React from 'react';

interface BrandMarkProps {
  className?: string;
  size?: number;
  label?: string;
}

/**
 * Genuine YouTube brand mark SVG used strictly to identify the external
 * YouTube Web Embed music source (never replaced by a generic UI icon).
 */
export const YouTubeBrandMark: React.FC<BrandMarkProps> = ({
  className = '',
  size,
  label,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={`shrink-0 ${className}`.trim()}
    >
      <rect
        x="2"
        y="4.5"
        width="20"
        height="15"
        rx="4.2"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M10.2 9.25L15.4 12L10.2 14.75V9.25Z"
        fill="currentColor"
      />
    </svg>
  );
};
