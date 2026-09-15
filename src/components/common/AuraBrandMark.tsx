import React from 'react';

interface AuraBrandMarkProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isPlaying?: boolean;
  withAuraGlow?: boolean;
}

export const AuraBrandMark: React.FC<AuraBrandMarkProps> = ({
  size = 'md',
  className = '',
  isPlaying = false,
  withAuraGlow = false,
}) => {
  const pixelSize = typeof size === 'number' 
    ? size 
    : size === 'sm' 
    ? 24 
    : size === 'lg' 
    ? 40 
    : size === 'xl' 
    ? 56 
    : 32;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer Architectural Precision Chassis */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill="#13151d"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.2"
        />

        {/* Minimalist Acoustic Sine Aperture */}
        <circle
          cx="16"
          cy="16"
          r="10"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Core Monogram / Soundwave Sculpture */}
        <path
          d="M16 7L22.5 23.5H19L16 16L13 23.5H9.5L16 7Z"
          fill="#ffffff"
        />

        {/* Precision Crossbar */}
        <line
          x1="12.5"
          y1="19.5"
          x2="19.5"
          y2="19.5"
          stroke="#090a0f"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Active Audio Signal Dot */}
        <circle
          cx="16"
          cy="12"
          r="1.2"
          fill={isPlaying ? '#10b981' : '#6b7280'}
          className={isPlaying ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );
};
