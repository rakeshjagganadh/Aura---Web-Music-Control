import React, { useEffect, useMemo, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { audioEngine } from '../../services/audioEngine';

interface AuraAtmosphereProps {
  intensity?: 'subtle' | 'moderate' | 'focused';
  className?: string;
}

export const AuraAtmosphere: React.FC<AuraAtmosphereProps> = ({
  className = '',
}) => {
  const { currentTrack, isPlaying, currentView } = useMusic();

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const smoothBassRef = useRef(0);
  const smoothEnergyRef = useRef(0);

  // Section-aware and artwork-derived ambient chromatic palette
  const ambientPalette = useMemo(() => {
    // 1. If track is playing and has artwork/color, derive warm atmospheric lighting
    if (currentTrack) {
      const coverColor = (currentTrack.coverColor || '').toLowerCase();

      if (coverColor.includes('rose') || coverColor.includes('pink') || coverColor.includes('red')) {
        return {
          primaryGlow: 'rgba(244, 63, 94, 0.35)',
          secondaryGlow: 'rgba(225, 29, 72, 0.28)',
          topAccent: 'rgba(251, 113, 133, 0.24)',
          bottomDepth: 'rgba(12, 16, 26, 0.85)',
          meshA: 'rgba(225, 29, 72, 0.20)',
          meshB: 'rgba(99, 102, 241, 0.22)',
        };
      }

      if (coverColor.includes('amber') || coverColor.includes('orange') || coverColor.includes('yellow')) {
        return {
          primaryGlow: 'rgba(245, 158, 11, 0.35)',
          secondaryGlow: 'rgba(217, 119, 6, 0.28)',
          topAccent: 'rgba(252, 211, 77, 0.22)',
          bottomDepth: 'rgba(15, 17, 26, 0.85)',
          meshA: 'rgba(217, 119, 6, 0.20)',
          meshB: 'rgba(79, 70, 229, 0.22)',
        };
      }

      if (coverColor.includes('emerald') || coverColor.includes('teal') || coverColor.includes('green')) {
        return {
          primaryGlow: 'rgba(16, 185, 129, 0.32)',
          secondaryGlow: 'rgba(13, 148, 136, 0.26)',
          topAccent: 'rgba(52, 211, 153, 0.22)',
          bottomDepth: 'rgba(10, 18, 22, 0.85)',
          meshA: 'rgba(5, 150, 105, 0.18)',
          meshB: 'rgba(99, 102, 241, 0.20)',
        };
      }

      if (coverColor.includes('cyan') || coverColor.includes('sky') || coverColor.includes('blue')) {
        return {
          primaryGlow: 'rgba(6, 182, 212, 0.35)',
          secondaryGlow: 'rgba(37, 99, 235, 0.28)',
          topAccent: 'rgba(56, 189, 248, 0.24)',
          bottomDepth: 'rgba(8, 14, 26, 0.85)',
          meshA: 'rgba(14, 165, 233, 0.22)',
          meshB: 'rgba(99, 102, 241, 0.25)',
        };
      }

      // Default with track active: rich oceanic indigo & vibrant violet
      return {
        primaryGlow: 'rgba(99, 102, 241, 0.35)',
        secondaryGlow: 'rgba(147, 51, 234, 0.28)',
        topAccent: 'rgba(56, 189, 248, 0.24)',
        bottomDepth: 'rgba(8, 12, 22, 0.85)',
        meshA: 'rgba(79, 70, 229, 0.22)',
        meshB: 'rgba(6, 182, 212, 0.24)',
      };
    }

    // 2. Section-Adaptive Ambient Environments
    if (currentView === 'studio') {
      return {
        primaryGlow: 'rgba(56, 189, 248, 0.24)',
        secondaryGlow: 'rgba(99, 102, 241, 0.20)',
        topAccent: 'rgba(129, 140, 248, 0.16)',
        bottomDepth: 'rgba(8, 10, 15, 0.95)',
        meshA: 'rgba(16, 185, 129, 0.12)',
        meshB: 'rgba(14, 165, 233, 0.14)',
      };
    }

    if (currentView === 'listen-together') {
      return {
        primaryGlow: 'rgba(147, 51, 234, 0.28)',
        secondaryGlow: 'rgba(99, 102, 241, 0.24)',
        topAccent: 'rgba(168, 85, 247, 0.20)',
        bottomDepth: 'rgba(9, 11, 18, 0.92)',
        meshA: 'rgba(236, 72, 153, 0.16)',
        meshB: 'rgba(6, 182, 212, 0.16)',
      };
    }

    if (currentView === 'library' || currentView === 'songs' || currentView === 'albums' || currentView === 'artists') {
      return {
        primaryGlow: 'rgba(79, 70, 229, 0.22)',
        secondaryGlow: 'rgba(30, 64, 175, 0.20)',
        topAccent: 'rgba(56, 189, 248, 0.16)',
        bottomDepth: 'rgba(7, 9, 13, 0.95)',
        meshA: 'rgba(99, 102, 241, 0.14)',
        meshB: 'rgba(30, 58, 138, 0.15)',
      };
    }

    // Default Home / Discovery: Luminous sapphire, celestial cyan and deep indigo
    return {
      primaryGlow: 'rgba(79, 70, 229, 0.28)',
      secondaryGlow: 'rgba(14, 165, 233, 0.24)',
      topAccent: 'rgba(99, 102, 241, 0.18)',
      bottomDepth: 'rgba(8, 10, 16, 0.92)',
      meshA: 'rgba(37, 99, 235, 0.18)',
      meshB: 'rgba(168, 85, 247, 0.16)',
    };
  }, [currentTrack, currentView]);

  // Audio-reactive dynamics listener loop via CSS custom properties (zero React re-renders per frame)
  useEffect(() => {
    const resetVars = () => {
      const el = containerRef.current;
      if (!el) return;
      el.style.setProperty('--aura-scale', '1');
      el.style.setProperty('--aura-opacity', isPlaying ? '0.95' : '0.75');
      el.style.setProperty('--aura-shift-x', '0px');
      el.style.setProperty('--aura-shift-y', '0px');
      el.style.setProperty('--aura-shift-x-neg', '0px');
      el.style.setProperty('--aura-shift-y-pos', '0px');
    };

    const reducedMotionQuery = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

    const stopLoop = () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    if (!isPlaying || reducedMotionQuery?.matches || (typeof document !== 'undefined' && document.hidden)) {
      smoothBassRef.current = 0;
      smoothEnergyRef.current = 0;
      resetVars();
      if (!isPlaying || reducedMotionQuery?.matches) {
        return;
      }
    }

    let lastTimestamp = performance.now();
    const isYouTube = currentTrack?.source === 'youtube';

    const updateReactiveFields = (now: number) => {
      if (document.hidden || reducedMotionQuery?.matches) {
        animFrameRef.current = null;
        return;
      }

      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      let rawBass = 0;
      let rawEnergy = 0;

      if (isYouTube) {
        const t = now * 0.0015;
        rawBass = (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.45;
        rawEnergy = (Math.cos(t * 2.1) * 0.5 + 0.5) * 0.5;
      } else {
        audioEngine.getFrequencyData(freqDataRef.current);
        const freq = freqDataRef.current;

        let bassSum = 0;
        for (let i = 0; i < 8; i++) {
          bassSum += freq[i];
        }
        rawBass = bassSum / (8 * 255);

        let totalSum = 0;
        for (let i = 0; i < 32; i++) {
          totalSum += freq[i];
        }
        rawEnergy = totalSum / (32 * 255);
      }

      const smoothingFactor = Math.min(1.0, delta * 7);
      smoothBassRef.current += (rawBass - smoothBassRef.current) * smoothingFactor;
      smoothEnergyRef.current += (rawEnergy - smoothEnergyRef.current) * smoothingFactor;

      const bass = smoothBassRef.current;
      const energy = smoothEnergyRef.current;

      const targetScale = 1.0 + bass * 0.07;
      const targetOpacityMod = 0.95 + energy * 0.22;

      const time = now * 0.0003;
      const driftX = Math.sin(time) * 20;
      const driftY = Math.cos(time * 0.8) * 16;

      const el = containerRef.current;
      if (el) {
        el.style.setProperty('--aura-scale', targetScale.toFixed(4));
        el.style.setProperty('--aura-opacity', targetOpacityMod.toFixed(3));
        el.style.setProperty('--aura-shift-x', `${(driftX * 0.6).toFixed(2)}px`);
        el.style.setProperty('--aura-shift-y', `${(driftY * 0.6).toFixed(2)}px`);
        el.style.setProperty('--aura-shift-x-neg', `${(-driftX * 0.5).toFixed(2)}px`);
        el.style.setProperty('--aura-shift-y-pos', `${(driftY * 0.5).toFixed(2)}px`);
      }

      animFrameRef.current = requestAnimationFrame(updateReactiveFields);
    };

    const startLoopIfActive = () => {
      if (!document.hidden && !reducedMotionQuery?.matches && animFrameRef.current === null) {
        lastTimestamp = performance.now();
        animFrameRef.current = requestAnimationFrame(updateReactiveFields);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoopIfActive();
      }
    };

    const handleReducedMotionChange = () => {
      if (reducedMotionQuery?.matches) {
        stopLoop();
        resetVars();
      } else {
        startLoopIfActive();
      }
    };

    startLoopIfActive();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotionQuery?.addEventListener?.('change', handleReducedMotionChange);

    return () => {
      stopLoop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotionQuery?.removeEventListener?.('change', handleReducedMotionChange);
    };
  }, [isPlaying, currentTrack]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${className}`}
      style={{
        ['--aura-scale' as string]: '1',
        ['--aura-opacity' as string]: isPlaying ? '0.95' : '0.75',
        ['--aura-shift-x' as string]: '0px',
        ['--aura-shift-y' as string]: '0px',
        ['--aura-shift-x-neg' as string]: '0px',
        ['--aura-shift-y-pos' as string]: '0px',
      }}
    >
      {/* 1. Deep Oceanic-Graphite Foundation Gradient */}
      <div
        className="absolute inset-0 transition-colors duration-1000 ease-out"
        style={{
          background: 'linear-gradient(175deg, #090c14 0%, #0f1422 35%, #0b0e19 70%, #07090e 100%)',
        }}
      />

      {/* Dynamic Full-Canvas Ambient Artwork Wash (Active Track Lighting) */}
      {currentTrack?.coverUrl && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out overflow-hidden"
          style={{ opacity: isPlaying ? 0.22 : 0.12 }}
        >
          <img
            src={currentTrack.coverUrl}
            alt=""
            className="w-full h-full object-cover blur-[100px] scale-140 filter saturate-120 brightness-70"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/70 via-transparent to-[#05060a]/85" />
        </div>
      )}

      {/* 2. Top-Left Luminous Light Field (Provides vivid backlight for floating navigation and header) */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vh] rounded-full will-change-transform"
        style={{
          background: `radial-gradient(circle, ${ambientPalette.primaryGlow} 0%, rgba(99, 102, 241, 0.08) 55%, transparent 80%)`,
          filter: 'blur(90px)',
          transform: 'translate3d(var(--aura-shift-x), var(--aura-shift-y), 0) scale(var(--aura-scale))',
          opacity: 'var(--aura-opacity)',
        }}
      />

      {/* 3. Top-Right Ambient Aperture (Provides depth across main viewport) */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vh] rounded-full will-change-transform"
        style={{
          background: `radial-gradient(circle, ${ambientPalette.meshB} 0%, rgba(6, 182, 212, 0.06) 60%, transparent 85%)`,
          filter: 'blur(100px)',
          transform: 'translate3d(var(--aura-shift-x-neg), var(--aura-shift-y-pos), 0)',
        }}
      />

      {/* 4. Center-Stage Ambient Artwork Lighting Wash (Expands when track is loaded) */}
      <div
        className="absolute top-[20%] left-[25%] w-[50vw] h-[45vh] rounded-full will-change-transform"
        style={{
          background: `radial-gradient(ellipse 65% 50% at 50% 50%, ${ambientPalette.secondaryGlow} 0%, ${ambientPalette.meshA} 50%, transparent 80%)`,
          filter: 'blur(110px)',
          transform: 'scale(calc(var(--aura-scale) * 1.02))',
          opacity: 'var(--aura-opacity)',
        }}
      />

      {/* 5. Bottom Playback Island Reflection Field (Luminous optical reflection under player) */}
      <div
        className="absolute -bottom-[8%] left-[10%] right-[10%] h-[32vh] rounded-full transition-opacity duration-1000 ease-out pointer-events-none"
        style={{
          background: currentTrack
            ? `radial-gradient(ellipse 80% 60% at 50% 100%, ${ambientPalette.primaryGlow} 0%, ${ambientPalette.secondaryGlow} 40%, transparent 80%)`
            : 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99, 102, 241, 0.16) 0%, rgba(14, 165, 233, 0.10) 45%, transparent 75%)',
          filter: 'blur(70px)',
        }}
      />

      {/* 6. Subtle Micro-Atmospheric Noise Grain (Continuous acoustic velvety depth, NO visible stippled dots) */}
      <div
        className="absolute inset-0 opacity-[0.014] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
