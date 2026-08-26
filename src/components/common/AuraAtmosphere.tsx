import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { audioEngine } from '../../services/audioEngine';

interface AuraAtmosphereProps {
  intensity?: 'subtle' | 'moderate' | 'focused';
  className?: string;
}

interface PaletteTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export const AuraAtmosphere: React.FC<AuraAtmosphereProps> = ({
  intensity = 'moderate',
  className = '',
}) => {
  const { currentTrack, isPlaying } = useMusic();
  const [audioDynamics, setAudioDynamics] = useState({
    bassScale: 1.0,
    energyOpacity: 1.0,
    shiftX: 0,
    shiftY: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const smoothBassRef = useRef(0);
  const smoothEnergyRef = useRef(0);

  // Compute atmospheric palette with smooth fallback and color harmonies
  const currentPalette: PaletteTheme = useMemo(() => {
    if (!currentTrack) {
      return {
        primary: 'rgba(99, 102, 241, 0.04)',
        secondary: 'rgba(56, 189, 248, 0.02)',
        accent: 'rgba(168, 85, 247, 0.03)',
        glow: 'rgba(99, 102, 241, 0.08)',
      };
    }

    const coverColor = (currentTrack.coverColor || '').toLowerCase();

    if (coverColor.includes('rose') || coverColor.includes('pink') || coverColor.includes('red')) {
      return {
        primary: 'rgba(244, 63, 94, 0.14)',
        secondary: 'rgba(168, 85, 247, 0.09)',
        accent: 'rgba(251, 113, 133, 0.08)',
        glow: 'rgba(244, 63, 94, 0.22)',
      };
    }

    if (coverColor.includes('amber') || coverColor.includes('orange') || coverColor.includes('yellow')) {
      return {
        primary: 'rgba(245, 158, 11, 0.13)',
        secondary: 'rgba(234, 88, 12, 0.08)',
        accent: 'rgba(236, 72, 153, 0.07)',
        glow: 'rgba(245, 158, 11, 0.20)',
      };
    }

    if (coverColor.includes('emerald') || coverColor.includes('teal') || coverColor.includes('green')) {
      return {
        primary: 'rgba(16, 185, 129, 0.12)',
        secondary: 'rgba(6, 182, 212, 0.09)',
        accent: 'rgba(20, 184, 166, 0.07)',
        glow: 'rgba(16, 185, 129, 0.20)',
      };
    }

    if (coverColor.includes('cyan') || coverColor.includes('sky') || coverColor.includes('blue')) {
      return {
        primary: 'rgba(56, 189, 248, 0.14)',
        secondary: 'rgba(99, 102, 241, 0.09)',
        accent: 'rgba(14, 165, 233, 0.08)',
        glow: 'rgba(56, 189, 248, 0.22)',
      };
    }

    // Default AURA Signature Celestial Violet & Deep Indigo
    return {
      primary: 'rgba(129, 140, 248, 0.15)',
      secondary: 'rgba(56, 189, 248, 0.09)',
      accent: 'rgba(168, 85, 247, 0.08)',
      glow: 'rgba(129, 140, 248, 0.24)',
    };
  }, [currentTrack]);

  // Audio-reactive listener loop with gentle low-pass smoothing (no jarring flashing)
  useEffect(() => {
    if (!isPlaying) {
      smoothBassRef.current = 0;
      smoothEnergyRef.current = 0;
      setAudioDynamics({
        bassScale: 1.0,
        energyOpacity: 1.0,
        shiftX: 0,
        shiftY: 0,
      });
      return;
    }

    let lastTimestamp = performance.now();

    const updateReactiveFields = (now: number) => {
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      // Extract low-frequency energy (bass)
      audioEngine.getFrequencyData(freqDataRef.current);
      const freq = freqDataRef.current;
      
      // Calculate sub-bass & bass energy (first 8 bins ~ 0-170 Hz)
      let bassSum = 0;
      for (let i = 0; i < 8; i++) {
        bassSum += freq[i];
      }
      const rawBass = (bassSum / (8 * 255)); // 0 to 1

      // Overall average energy
      let totalSum = 0;
      for (let i = 0; i < 32; i++) {
        totalSum += freq[i];
      }
      const rawEnergy = (totalSum / (32 * 255));

      // Smooth with natural spring/decay (tau = 0.15s)
      const smoothingFactor = Math.min(1.0, delta * 7);
      smoothBassRef.current += (rawBass - smoothBassRef.current) * smoothingFactor;
      smoothEnergyRef.current += (rawEnergy - smoothEnergyRef.current) * smoothingFactor;

      const bass = smoothBassRef.current;
      const energy = smoothEnergyRef.current;

      // Very subtle organic scaling: 1.00 -> 1.05 max
      const targetScale = 1.0 + bass * 0.06;
      // Slight brightness modulation without harsh pulsation
      const targetOpacityMod = 0.92 + energy * 0.18;

      // Gentle floating orbital drift
      const time = now * 0.0003;
      const driftX = Math.sin(time) * 15;
      const driftY = Math.cos(time * 0.8) * 12;

      setAudioDynamics({
        bassScale: targetScale,
        energyOpacity: targetOpacityMod,
        shiftX: driftX,
        shiftY: driftY,
      });

      animFrameRef.current = requestAnimationFrame(updateReactiveFields);
    };

    animFrameRef.current = requestAnimationFrame(updateReactiveFields);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Overall atmosphere master opacity
  const masterOpacity = useMemo(() => {
    if (!currentTrack) return 'opacity-20';
    if (!isPlaying) return 'opacity-40'; // Settles gracefully when paused
    return intensity === 'focused' ? 'opacity-100' : intensity === 'moderate' ? 'opacity-90' : 'opacity-70';
  }, [currentTrack, isPlaying, intensity]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-1000 ease-out select-none ${masterOpacity} ${className}`}
    >
      {/* Primary Ambient Diffusion Light Field */}
      <div
        className="absolute -inset-[20%] transition-transform duration-700 ease-out"
        style={{
          transform: `scale(${audioDynamics.bassScale}) translate(${audioDynamics.shiftX}px, ${audioDynamics.shiftY}px)`,
          opacity: audioDynamics.energyOpacity,
          background: `radial-gradient(ellipse 65% 55% at 50% 10%, ${currentPalette.primary} 0%, rgba(6, 7, 9, 0) 75%)`,
          filter: 'blur(80px)',
          transitionProperty: 'background, opacity',
          transitionDuration: '1200ms, 400ms',
        }}
      />

      {/* Secondary Orbital Soft Light Node (Right Upper Field) */}
      <div
        className="absolute -inset-[15%] transition-all duration-1000 ease-out"
        style={{
          transform: `scale(${1.0 + (audioDynamics.bassScale - 1.0) * 0.7}) translate(${-audioDynamics.shiftX * 0.8}px, ${audioDynamics.shiftY * 0.6}px)`,
          background: `radial-gradient(circle 45% at 80% 25%, ${currentPalette.secondary} 0%, rgba(6, 7, 9, 0) 65%)`,
          filter: 'blur(90px)',
          transitionProperty: 'background',
          transitionDuration: '1400ms',
        }}
      />

      {/* Tertiary Sub-Bass Warmth Node (Bottom Center/Left Glow) */}
      <div
        className="absolute -inset-[25%] transition-all duration-1200 ease-out"
        style={{
          transform: `scale(${audioDynamics.bassScale * 0.98})`,
          background: `radial-gradient(circle 50% at 25% 75%, ${currentPalette.accent} 0%, rgba(6, 7, 9, 0) 70%)`,
          filter: 'blur(100px)',
          transitionProperty: 'background',
          transitionDuration: '1600ms',
        }}
      />

      {/* Center Track Illumination Aura - subtle halo behind active content */}
      {isPlaying && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${currentPalette.glow} 0%, rgba(6, 7, 9, 0) 70%)`,
            filter: 'blur(60px)',
            opacity: audioDynamics.energyOpacity * 0.85,
          }}
        />
      )}

      {/* Micro-Tactile Texture Layer for precision matte finish */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
    </div>
  );
};
