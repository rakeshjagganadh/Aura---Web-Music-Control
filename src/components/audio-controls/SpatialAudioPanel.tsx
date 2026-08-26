import React, { useRef, useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { SpatialMode } from '../../types';
import { 
  Compass, 
  Waves, 
  RotateCcw, 
  Headphones, 
  Box, 
  Radio,
  Sparkles,
  Move
} from 'lucide-react';

export const SpatialAudioPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    spatial, 
    updateSpatial, 
    resetSpatial, 
    immersive, 
    updateImmersive,
    isAdvancedMode 
  } = useMusic();

  const radarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const SPATIAL_MODES: { id: SpatialMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'off', label: 'Off / Direct Stereo', desc: 'Standard direct left/right stereo', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: '3d', label: '3D Binaural (HRTF)', desc: 'Full 3D spatial field with head-related transfer functions', icon: <Headphones className="w-3.5 h-3.5" /> },
    { id: 'stereo_wide', label: 'Stereo Widening (Haas)', desc: 'Expands acoustic soundstage beyond physical headphones', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'cinema', label: 'Virtual Cinema Acoustic', desc: 'Simulates expansive theater and hall acoustic reflections', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'headphones', label: 'Headphone Staging', desc: 'Compensates for in-head localization fatigue', icon: <Headphones className="w-3.5 h-3.5" /> },
  ];

  // Drag interaction on 2D Soundstage Radar
  const handleRadarMove = (clientX: number, clientY: number) => {
    const radar = radarRef.current;
    if (!radar) return;
    const rect = radar.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relX = (clientX - centerX) / (rect.width / 2);
    const relY = (clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1, Math.min(1, relX));
    const clampedY = Math.max(-1, Math.min(1, relY));

    // Calculate angle in degrees
    const angleRad = Math.atan2(clampedY, clampedX);
    const angleDeg = Math.round((angleRad * 180) / Math.PI);

    updateSpatial({
      enabled: true,
      mode: spatial.mode === 'off' ? '3d' : spatial.mode,
      positionX: clampedX,
      positionY: clampedY,
      angle: angleDeg,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleRadarMove(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleRadarMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Spatial Audio & 3D Immersion</h3>
            <p className="text-[11px] text-zinc-400">
              Acoustic HRTF soundstage positioning, binaural psychoacoustics, and stereo widening.
            </p>
          </div>
        </div>

        <button
          onClick={resetSpatial}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-white/5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Center Position
        </button>
      </div>

      {/* Spatial Modes Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {SPATIAL_MODES.map((m) => {
          const isSelected = (spatial.mode === m.id) && (m.id === 'off' ? !spatial.enabled : spatial.enabled);
          return (
            <button
              key={m.id}
              onClick={() => {
                if (m.id === 'off') {
                  updateSpatial({ enabled: false, mode: 'off' });
                } else {
                  updateSpatial({ enabled: true, mode: m.id });
                }
              }}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all duration-150 ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm'
                  : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={isSelected ? 'text-cyan-400' : 'text-zinc-500'}>{m.icon}</span>
                <span className="text-xs font-bold">{m.label}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Interactive 2D Soundstage Radar & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* 2D Interactive Soundstage Radar (Left) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-950/80 border border-white/5 relative select-none">
          <div className="flex items-center justify-between w-full mb-3 text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              Interactive Soundstage Radar
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              X: {(spatial.positionX || 0).toFixed(2)} | Y: {(spatial.positionY || 0).toFixed(2)}
            </span>
          </div>

          {/* Circular Radar Stage */}
          <div
            ref={radarRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-cyan-500/20 bg-zinc-900/50 relative cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center"
          >
            {/* Concentric distance rings */}
            <div className="w-40 h-40 rounded-full border border-white/5 absolute pointer-events-none" />
            <div className="w-24 h-24 rounded-full border border-white/5 absolute pointer-events-none" />
            
            {/* Crosshairs */}
            <div className="w-full h-px bg-white/5 absolute pointer-events-none" />
            <div className="h-full w-px bg-white/5 absolute pointer-events-none" />

            {/* Listener Head Marker (Center) */}
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-indigo-500/40 flex items-center justify-center z-10 pointer-events-none shadow-md">
              <Headphones className="w-4 h-4 text-indigo-400" />
            </div>

            {/* Draggable Sound Source Puk */}
            <div
              className="absolute w-6 h-6 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_15px_#22d3ee] flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none z-20"
              style={{
                left: `${50 + (spatial.positionX || 0) * 42}%`,
                top: `${50 + (spatial.positionY || 0) * 42}%`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
            </div>

            {/* Stage cardinal labels */}
            <span className="absolute top-2 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase">Front</span>
            <span className="absolute bottom-2 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase">Rear</span>
            <span className="absolute left-2 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase">Left</span>
            <span className="absolute right-2 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase">Right</span>
          </div>

          <p className="text-[10px] text-zinc-500 mt-3 text-center">
            Drag the cyan beacon to position the audio origin anywhere in your 360° sound field.
          </p>
        </div>

        {/* Spatial Depth & Immersion Sliders (Right) */}
        <div className="lg:col-span-6 flex flex-col gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/5">
          
          {/* Stereo Soundstage Width */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Stereo Soundstage Width</span>
              <span className="font-mono text-cyan-300">{Math.round((spatial.width || 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={spatial.width || 1.0}
              onChange={(e) => updateSpatial({ width: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Mono Center</span>
              <span>100% Studio</span>
              <span>Ultra-Wide</span>
            </div>
          </div>

          {/* Soundstage Depth */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Acoustic Depth</span>
              <span className="font-mono text-cyan-300">{Math.round((spatial.depth || 0.4) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={spatial.depth || 0.4}
              onChange={(e) => updateSpatial({ depth: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Room Simulation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Virtual Room Reflections</span>
              <span className="font-mono text-cyan-300">{Math.round((spatial.room || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={spatial.room || 0}
              onChange={(e) => updateSpatial({ room: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Immersion Enhancers */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            {/* Clarity */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Speech Clarity</span>
                <span className="font-mono text-zinc-300">+{immersive.clarity?.toFixed(1) || 0} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.5"
                value={immersive.clarity || 0}
                onChange={(e) => updateImmersive({ clarity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Bass Sub Enhancement */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Sub Immersion</span>
                <span className="font-mono text-zinc-300">+{immersive.bassEnhancement?.toFixed(1) || 0} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={immersive.bassEnhancement || 0}
                onChange={(e) => updateImmersive({ bassEnhancement: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
