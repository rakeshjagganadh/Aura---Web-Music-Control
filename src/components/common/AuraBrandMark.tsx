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
  withAuraGlow = true,
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
      {/* Sound-reactive Ambient Halo behind mark */}
      {withAuraGlow && isPlaying && (
        <div 
          className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-md -z-10 animate-pulse"
          style={{ transform: 'scale(1.25)' }}
        />
      )}

      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-transform duration-300"
      >
        <defs>
          <linearGradient id="auraMarkGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>

          <linearGradient id="auraGlowGrad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Outer Minimalist Precision Base Container */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="9"
          fill="#0e1017"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1.2"
        />

        {/* Surrounding Acoustic Aura Concentric Rings (Frequency field) */}
        <circle
          cx="16"
          cy="16"
          r="11.5"
          stroke="url(#auraMarkGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 2.5"
          opacity={isPlaying ? '0.75' : '0.35'}
          className={isPlaying ? 'origin-center animate-[spin_12s_linear_infinite]' : ''}
        />

        <circle
          cx="16"
          cy="16"
          r="8.5"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />

        {/* Central Geometric "A" Sound Wave Prism */}
        <path
          d="M16 8L22 23H18.5L16 16.5L13.5 23H10L16 8Z"
          fill="url(#auraMarkGrad)"
        />

        {/* Transverse Acoustic Harmonic Bridge (Cross-frequency beam) */}
        <path
          d="M12.8 19.5H19.2"
          stroke="#f8fafc"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Central Pure Harmonic Apex Dot */}
        <circle
          cx="16"
          cy="13"
          r="1.2"
          fill="#38bdf8"
          className={isPlaying ? 'animate-ping origin-center' : ''}
          style={{ animationDuration: '2.5s' }}
        />
      </svg>
    </div>
  );
};
