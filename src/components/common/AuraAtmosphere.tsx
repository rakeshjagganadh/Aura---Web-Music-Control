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

  // Compute refined architectural atmosphere with quiet, non-distracting depth
  const currentPalette: PaletteTheme = useMemo(() => {
    if (!currentTrack) {
      return {
        primary: 'rgba(255, 255, 255, 0.015)',
        secondary: 'rgba(255, 255, 255, 0.01)',
        accent: 'rgba(255, 255, 255, 0.01)',
        glow: 'rgba(255, 255, 255, 0.02)',
      };
    }

    const coverColor = (currentTrack.coverColor || '').toLowerCase();

    if (coverColor.includes('rose') || coverColor.includes('pink') || coverColor.includes('red')) {
      return {
        primary: 'rgba(225, 29, 72, 0.06)',
        secondary: 'rgba(159, 18, 57, 0.04)',
        accent: 'rgba(190, 18, 60, 0.03)',
        glow: 'rgba(225, 29, 72, 0.08)',
      };
    }

    if (coverColor.includes('amber') || coverColor.includes('orange') || coverColor.includes('yellow')) {
      return {
        primary: 'rgba(217, 119, 6, 0.06)',
        secondary: 'rgba(180, 83, 9, 0.04)',
        accent: 'rgba(161, 98, 7, 0.03)',
        glow: 'rgba(217, 119, 6, 0.08)',
      };
    }

    if (coverColor.includes('emerald') || coverColor.includes('teal') || coverColor.includes('green')) {
      return {
        primary: 'rgba(5, 150, 105, 0.06)',
        secondary: 'rgba(13, 148, 136, 0.04)',
        accent: 'rgba(15, 118, 110, 0.03)',
        glow: 'rgba(5, 150, 105, 0.08)',
      };
    }

    if (coverColor.includes('cyan') || coverColor.includes('sky') || coverColor.includes('blue')) {
      return {
        primary: 'rgba(2, 132, 199, 0.06)',
        secondary: 'rgba(30, 64, 175, 0.04)',
        accent: 'rgba(3, 105, 161, 0.03)',
        glow: 'rgba(2, 132, 199, 0.08)',
      };
    }

    // Default: Refined deep monochromatic warmth
    return {
      primary: 'rgba(255, 255, 255, 0.04)',
      secondary: 'rgba(148, 163, 184, 0.03)',
      accent: 'rgba(100, 116, 139, 0.02)',
      glow: 'rgba(255, 255, 255, 0.05)',
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

    const isYouTube = currentTrack?.source === 'youtube';

    const updateReactiveFields = (now: number) => {
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      let rawBass = 0;
      let rawEnergy = 0;

      if (isYouTube) {
        // Natural organic harmonic breathing for stream playback
        const t = now * 0.0015;
        rawBass = (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.45;
        rawEnergy = (Math.cos(t * 2.1) * 0.5 + 0.5) * 0.5;
      } else {
        // Extract low-frequency energy (bass) from local Web Audio engine
        audioEngine.getFrequencyData(freqDataRef.current);
        const freq = freqDataRef.current;
        
        // Calculate sub-bass & bass energy (first 8 bins ~ 0-170 Hz)
        let bassSum = 0;
        for (let i = 0; i < 8; i++) {
          bassSum += freq[i];
        }
        rawBass = (bassSum / (8 * 255)); // 0 to 1

        // Overall average energy
        let totalSum = 0;
        for (let i = 0; i < 32; i++) {
          totalSum += freq[i];
        }
        rawEnergy = (totalSum / (32 * 255));
      }

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
      {/* Subtle Studio Light Wash */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{
          opacity: audioDynamics.energyOpacity * 0.7,
          background: `radial-gradient(ellipse 70% 50% at 50% 15%, ${currentPalette.primary} 0%, rgba(9, 10, 15, 0) 80%)`,
          filter: 'blur(100px)',
          transitionProperty: 'background, opacity',
          transitionDuration: '1400ms, 500ms',
        }}
      />

      {/* Tertiary Sub-Bass Warmth Node (Bottom Vignette) */}
      <div
        className="absolute inset-0 transition-all duration-1200 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle 60% at 50% 100%, ${currentPalette.accent} 0%, rgba(9, 10, 15, 0) 70%)`,
          filter: 'blur(120px)',
        }}
      />

      {/* Micro-Tactile Texture Layer for precision matte finish */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
    </div>
  );
};
