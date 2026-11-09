import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  // Section-aware and artwork-derived ambient chromatic palette
  const ambientPalette = useMemo(() => {
    // 1. If track is playing and has artwork/color, derive warm atmospheric lighting
    if (currentTrack) {
      const coverColor = (currentTrack.coverColor || '').toLowerCase();

      if (coverColor.includes('rose') || coverColor.includes('pink') || coverColor.includes('red')) {
        return {
          primaryGlow: 'rgba(225, 29, 72, 0.16)',
          secondaryGlow: 'rgba(159, 18, 57, 0.12)',
          topAccent: 'rgba(244, 63, 94, 0.10)',
          bottomDepth: 'rgba(12, 16, 26, 0.85)',
          meshA: 'rgba(225, 29, 72, 0.08)',
          meshB: 'rgba(99, 102, 241, 0.09)',
        };
      }

      if (coverColor.includes('amber') || coverColor.includes('orange') || coverColor.includes('yellow')) {
        return {
          primaryGlow: 'rgba(245, 158, 11, 0.15)',
          secondaryGlow: 'rgba(180, 83, 9, 0.10)',
          topAccent: 'rgba(251, 191, 36, 0.08)',
          bottomDepth: 'rgba(15, 17, 26, 0.85)',
          meshA: 'rgba(217, 119, 6, 0.08)',
          meshB: 'rgba(79, 70, 229, 0.09)',
        };
      }

      if (coverColor.includes('emerald') || coverColor.includes('teal') || coverColor.includes('green')) {
        return {
          primaryGlow: 'rgba(16, 185, 129, 0.14)',
          secondaryGlow: 'rgba(13, 148, 136, 0.10)',
          topAccent: 'rgba(52, 211, 153, 0.08)',
          bottomDepth: 'rgba(10, 18, 22, 0.85)',
          meshA: 'rgba(5, 150, 105, 0.08)',
          meshB: 'rgba(99, 102, 241, 0.08)',
        };
      }

      if (coverColor.includes('cyan') || coverColor.includes('sky') || coverColor.includes('blue')) {
        return {
          primaryGlow: 'rgba(6, 182, 212, 0.15)',
          secondaryGlow: 'rgba(30, 64, 175, 0.12)',
          topAccent: 'rgba(56, 189, 248, 0.09)',
          bottomDepth: 'rgba(8, 14, 26, 0.85)',
          meshA: 'rgba(14, 165, 233, 0.09)',
          meshB: 'rgba(99, 102, 241, 0.11)',
        };
      }
    }

    // 2. Section-Adaptive Ambient Environments (Neutral obsidian, graphite, charcoal and cool slate)
    if (currentView === 'studio') {
      // Audio Studio: Restrained, technical, deep carbon with subtle cyan/slate meter glow
      return {
        primaryGlow: 'rgba(38, 52, 70, 0.12)',
        secondaryGlow: 'rgba(24, 34, 48, 0.10)',
        topAccent: 'rgba(45, 65, 85, 0.08)',
        bottomDepth: 'rgba(8, 10, 15, 0.95)',
        meshA: 'rgba(16, 185, 129, 0.03)',
        meshB: 'rgba(14, 165, 233, 0.04)',
      };
    }

    if (currentView === 'listen-together') {
      // Social Room: Warm, collaborative muted violet and slate depth
      return {
        primaryGlow: 'rgba(99, 102, 241, 0.10)',
        secondaryGlow: 'rgba(67, 56, 202, 0.08)',
        topAccent: 'rgba(129, 140, 248, 0.06)',
        bottomDepth: 'rgba(9, 11, 18, 0.92)',
        meshA: 'rgba(147, 51, 234, 0.05)',
        meshB: 'rgba(6, 182, 212, 0.05)',
      };
    }

    if (currentView === 'library' || currentView === 'songs' || currentView === 'albums' || currentView === 'artists') {
      // Music Vault: Calm, focused deep obsidian, graphite and cool slate
      return {
        primaryGlow: 'rgba(40, 50, 68, 0.10)',
        secondaryGlow: 'rgba(25, 32, 45, 0.12)',
        topAccent: 'rgba(148, 163, 184, 0.04)',
        bottomDepth: 'rgba(7, 9, 13, 0.95)',
        meshA: 'rgba(51, 65, 85, 0.06)',
        meshB: 'rgba(30, 41, 59, 0.06)',
      };
    }

    // Default Home / Discovery: Balanced graphite, smoked charcoal, and subtle cool slate (NOT purple plastic)
    return {
      primaryGlow: 'rgba(35, 48, 70, 0.13)',
      secondaryGlow: 'rgba(22, 32, 48, 0.10)',
      topAccent: 'rgba(56, 75, 105, 0.06)',
      bottomDepth: 'rgba(8, 10, 16, 0.92)',
      meshA: 'rgba(30, 42, 60, 0.07)',
      meshB: 'rgba(18, 25, 38, 0.06)',
    };
  }, [currentTrack, currentView]);

  // Audio-reactive dynamics listener loop
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
        rawBass = (bassSum / (8 * 255));

        let totalSum = 0;
        for (let i = 0; i < 32; i++) {
          totalSum += freq[i];
        }
        rawEnergy = (totalSum / (32 * 255));
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
  }, [isPlaying, currentTrack]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${className}`}
    >
      {/* 1. Deep Graphite Foundation Gradient */}
      <div 
        className="absolute inset-0 transition-colors duration-1000 ease-out"
        style={{
          background: 'linear-gradient(175deg, #07090e 0%, #0c0f17 35%, #080a11 70%, #05060a 100%)',
        }}
      />

      {/* 2. Top-Left Luminous Light Field (Provides vivid backlight for floating navigation and header) */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vh] rounded-full transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle, ${ambientPalette.primaryGlow} 0%, rgba(99, 102, 241, 0.03) 60%, transparent 80%)`,
          filter: 'blur(90px)',
          transform: `translate3d(${audioDynamics.shiftX * 0.6}px, ${audioDynamics.shiftY * 0.6}px, 0) scale(${audioDynamics.bassScale})`,
          opacity: audioDynamics.energyOpacity,
        }}
      />

      {/* 3. Top-Right Ambient Aperture (Provides depth across main viewport) */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vh] rounded-full transition-all duration-1200 ease-out"
        style={{
          background: `radial-gradient(circle, ${ambientPalette.meshB} 0%, rgba(6, 182, 212, 0.02) 65%, transparent 85%)`,
          filter: 'blur(100px)',
          transform: `translate3d(${-audioDynamics.shiftX * 0.5}px, ${audioDynamics.shiftY * 0.5}px, 0)`,
        }}
      />

      {/* 4. Center-Stage Ambient Artwork Lighting Wash (Expands when track is loaded) */}
      <div
        className="absolute top-[20%] left-[25%] w-[50vw] h-[45vh] rounded-full transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(ellipse 65% 50% at 50% 50%, ${ambientPalette.secondaryGlow} 0%, ${ambientPalette.meshA} 50%, transparent 80%)`,
          filter: 'blur(110px)',
          transform: `scale(${audioDynamics.bassScale * 1.02})`,
          opacity: isPlaying ? audioDynamics.energyOpacity : 0.65,
        }}
      />

      {/* 5. Bottom Playback Island Reflection Field (Restrained natural reflection, NOT an obvious warm-to-blue painted gradient) */}
      <div
        className="absolute -bottom-[8%] left-[12%] right-[12%] h-[30vh] rounded-full transition-all duration-1000 ease-out pointer-events-none"
        style={{
          background: currentTrack
            ? `radial-gradient(ellipse 70% 50% at 50% 100%, ${ambientPalette.primaryGlow} 0%, rgba(16, 22, 34, 0.16) 45%, transparent 75%)`
            : 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255, 255, 255, 0.025) 0%, rgba(14, 18, 28, 0.15) 45%, transparent 75%)',
          filter: 'blur(80px)',
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
