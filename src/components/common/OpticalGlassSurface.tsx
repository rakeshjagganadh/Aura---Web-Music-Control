import React, { useEffect, useId, useMemo, useState } from 'react';
import { useMusic } from '../../context/MusicContext';

export interface OpticalGlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  artworkUrl?: string | null;
  intensity?: 'subtle' | 'moderate' | 'intense';
  refractionScale?: number;
  showBacklight?: boolean;
  shape?: 'rounded-2xl' | 'rounded-3xl' | 'rounded-full' | 'rounded-xl';
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  id?: string;
  role?: string;
  'aria-label'?: string;
}

/**
 * Generates a smooth rounded-perimeter lens displacement map as a data URL.
 * Red = X normal offset (128 neutral), Green = Y normal offset (128 neutral).
 * Bends light smoothly along the perimeter bezel while keeping the center clear.
 */
function buildLensDisplacementDataUrl(width = 256, height = 96, bezelFraction = 0.24): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(width, height);
  const data = img.data;
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const minHalf = Math.min(halfW, halfH);
  const bezelPx = Math.max(8, minHalf * bezelFraction);
  const radius = Math.min(halfW, halfH) * 0.45;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;

      // Signed distance inside rounded box
      const qx = Math.abs(px) - (halfW - radius);
      const qy = Math.abs(py) - (halfH - radius);
      const outX = Math.max(qx, 0);
      const outY = Math.max(qy, 0);
      const distOutside = Math.hypot(outX, outY) + Math.min(Math.max(qx, qy), 0) - radius;
      const distInside = Math.max(0, -distOutside);

      let nx = 0;
      let ny = 0;

      if (distInside < bezelPx) {
        // Curved meniscus profile near edges
        const t = 1 - distInside / bezelPx; // 0 at inner edge, 1 at outer rim
        const curve = Math.sin(t * Math.PI * 0.5) * t;

        // Approximate inward normal of rounded rectangle
        let gx = 0;
        let gy = 0;
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy) || 1;
          gx = (qx / len) * Math.sign(px);
          gy = (qy / len) * Math.sign(py);
        } else if (qx > qy) {
          gx = Math.sign(px);
        } else {
          gy = Math.sign(py);
        }

        nx = gx * curve;
        ny = gy * curve;
      }

      // Subtle dome refraction across interior
      const domeX = (px / halfW) * 0.14;
      const domeY = (py / halfH) * 0.14;

      const r = Math.max(0, Math.min(255, Math.round(128 + (nx + domeX) * 110)));
      const g = Math.max(0, Math.min(255, Math.round(128 + (ny + domeY) * 110)));

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

let cachedLensMap: string | null = null;
function getCachedLensMap(): string {
  if (!cachedLensMap && typeof document !== 'undefined') {
    cachedLensMap = buildLensDisplacementDataUrl();
  }
  return cachedLensMap || '';
}

export const OpticalGlassSurface: React.FC<OpticalGlassSurfaceProps> = ({
  children,
  className = '',
  artworkUrl,
  intensity = 'moderate',
  refractionScale = 14,
  showBacklight = true,
  shape = 'rounded-3xl',
  style = {},
  onClick,
  id,
  role,
  'aria-label': ariaLabel,
}) => {
  const { currentTrack } = useMusic();
  const activeCover = artworkUrl !== undefined ? artworkUrl : currentTrack?.coverUrl;
  const rawId = useId();
  const filterId = useMemo(() => `aura-optical-lens-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);
  const [lensMapUrl, setLensMapUrl] = useState<string>('');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setLensMapUrl(getCachedLensMap());
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, []);

  const { backlightOpacity, tintAlpha, effectiveScale } = useMemo(() => {
    const scaleBoost = reducedMotion ? 0 : Math.max(8, refractionScale * 1.5);
    switch (intensity) {
      case 'subtle':
        return { backlightOpacity: 0.38, tintAlpha: 0.34, effectiveScale: scaleBoost * 0.75 };
      case 'intense':
        return { backlightOpacity: 0.62, tintAlpha: 0.44, effectiveScale: scaleBoost * 1.25 };
      default:
        return { backlightOpacity: 0.5, tintAlpha: 0.38, effectiveScale: scaleBoost };
    }
  }, [intensity, refractionScale, reducedMotion]);

  return (
    <div
      id={id}
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      style={style}
      className={`relative overflow-hidden select-none transition-all duration-300 ${shape} ${className}`}
    >
      {/* Unique SVG optical lens filter (no post-displacement heavy blur) */}
      {lensMapUrl && (
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <filter id={filterId} x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
              <feImage href={lensMapUrl} result="lensMap" preserveAspectRatio="none" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="lensMap"
                scale={effectiveScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="refracted"
              />
              <feGaussianBlur in="refracted" stdDeviation="2.5" result="softened" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Layer 1: Optical refracted artwork texture (aligned to container without destructive 36px blur) */}
      {showBacklight && activeCover && (
        <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden rounded-[inherit]">
          <img
            src={activeCover}
            alt=""
            className="w-full h-full object-cover scale-105 saturate-150 transition-opacity duration-500"
            style={{
              opacity: backlightOpacity,
              filter: lensMapUrl ? `url(#${filterId}) saturate(145%)` : 'blur(6px) saturate(145%)',
            }}
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 100% at 50% 0%, rgba(12, 16, 28, 0.18) 0%, rgba(7, 9, 16, 0.52) 100%)',
            }}
          />
        </div>
      )}

      {/* Layer 2: Translucent optical surface with directional specular catch (no opaque slate stacking) */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 rounded-[inherit]"
        style={{
          backgroundColor: `rgba(10, 14, 24, ${tintAlpha})`,
          backgroundImage:
            'linear-gradient(165deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.02) 32%, rgba(0, 0, 0, 0.14) 100%)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          boxShadow:
            'inset 0 1px 0 0 rgba(255, 255, 255, 0.16), inset 0 -1px 0 0 rgba(0, 0, 0, 0.38)',
        }}
      />

      {/* Layer 3: Interactive Content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};
