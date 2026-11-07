import React, { useRef, useState, useCallback } from 'react';
import { useMusic } from '../../context/MusicContext';
import { SpatialMode } from '../../types';
import { 
  Compass, 
  Waves, 
  RotateCcw, 
  Headphones, 
  Box, 
  Radio, 
  Move,
  Volume2,
  Disc3,
  Sliders
} from 'lucide-react';

interface SpatialModeOption {
  id: SpatialMode;
  label: string;
  shortDesc: string;
  techDesc: string;
  icon: React.ReactNode;
}

const SPATIAL_MODES: SpatialModeOption[] = [
  { 
    id: 'off', 
    label: 'Direct Stereo', 
    shortDesc: 'Standard L/R Passthrough',
    techDesc: 'Bypasses 3D processing for uncolored direct stereo monitoring.',
    icon: <Radio className="w-4 h-4 text-zinc-400" /> 
  },
  { 
    id: '3d', 
    label: '3D Binaural (HRTF)', 
    shortDesc: 'Binaural Transfer Functions',
    techDesc: 'Web Audio HRTF panner positioning sound in 360° spherical azimuth & elevation.',
    icon: <Headphones className="w-4 h-4 text-cyan-400" /> 
  },
  { 
    id: 'stereo_wide', 
    label: 'Stereo Widening', 
    shortDesc: 'Haas Effect & Cross-Feed',
    techDesc: 'Expands stereo soundstage perception beyond physical speaker/headphone boundaries.',
    icon: <Waves className="w-4 h-4 text-indigo-400" /> 
  },
  { 
    id: 'cinema', 
    label: 'Virtual Cinema', 
    shortDesc: 'Expansive Hall Acoustics',
    techDesc: 'Simulates theater acoustic reflections with enhanced depth and ambient reverb.',
    icon: <Box className="w-4 h-4 text-purple-400" /> 
  },
  { 
    id: 'headphones', 
    label: 'Headphone Staging', 
    shortDesc: 'In-Head Fatigue Compensation',
    techDesc: 'Subtle crossfeed processing to reduce claustrophobic in-head acoustic fatigue.',
    icon: <Headphones className="w-4 h-4 text-emerald-400" /> 
  },
];

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

  // Drag interaction mapping on 2D Soundstage Radar
  const handleRadarMove = useCallback((clientX: number, clientY: number) => {
    const radar = radarRef.current;
    if (!radar) return;
    const rect = radar.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relX = (clientX - centerX) / (rect.width / 2);
    const relY = (clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1, Math.min(1, relX));
    const clampedY = Math.max(-1, Math.min(1, relY));

    // Calculate polar angle in degrees (-180 to 180)
    const angleRad = Math.atan2(clampedY, clampedX);
    let angleDeg = Math.round((angleRad * 180) / Math.PI);
    if (angleDeg < 0) angleDeg += 360;

    // Calculate normalized distance (0 to 1)
    const dist = Math.min(1.0, Math.sqrt(clampedX * clampedX + clampedY * clampedY));

    updateSpatial({
      enabled: true,
      mode: spatial.mode === 'off' ? '3d' : spatial.mode,
      positionX: parseFloat(clampedX.toFixed(2)),
      positionY: parseFloat(clampedY.toFixed(2)),
      angle: angleDeg,
      depth: parseFloat(dist.toFixed(2)),
    });
  }, [spatial.mode, updateSpatial]);

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

  const handleCenterPosition = () => {
    updateSpatial({
      positionX: 0,
      positionY: 0,
      angle: 0,
      depth: 0.4,
    });
  };

  const posX = spatial.positionX || 0;
  const posY = spatial.positionY || 0;
  const angle = spatial.angle || 0;
  const distancePct = Math.round((spatial.depth ?? Math.sqrt(posX * posX + posY * posY)) * 100);

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Spatial Audio & Soundstage Studio</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-cyan-500/20">
                HRTF 3D FIELD
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Binaural HRTF spatial positioning, stereo width expansion, and acoustic room depth simulation.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetSpatial}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-colors"
            title="Reset spatial engine to default settings"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Spatial</span>
          </button>
        </div>
      </div>

      {/* Spatial Modes Selector */}
      <section aria-label="Spatial Audio Modes" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {SPATIAL_MODES.map((m) => {
          const isSelected = (spatial.mode === m.id) && (m.id === 'off' ? !spatial.enabled : spatial.enabled);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (m.id === 'off') {
                  updateSpatial({ enabled: false, mode: 'off' });
                } else {
                  updateSpatial({ enabled: true, mode: m.id });
                }
              }}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {m.icon}
                  <span className="text-xs font-bold">{m.label}</span>
                </div>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </div>
              <div>
                <span className="text-[11px] font-medium text-zinc-300 block">{m.shortDesc}</span>
                <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 line-clamp-2">{m.techDesc}</p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Two-Column Grid: Interactive Radar (Left) + Spatial Parameters (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ======================================================== */}
        {/* 2D INTERACTIVE SOUNDSTAGE RADAR (Left 6 Columns)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-2xl bg-zinc-950/80 border border-white/10 relative select-none shadow-xl">
          {/* Radar Header Telemetry */}
          <div className="flex items-center justify-between w-full mb-3 text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              <span>360° Soundstage Radar</span>
            </span>
            <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
              <span className="text-zinc-400">Azimuth: <strong className="text-cyan-300">{angle}°</strong></span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-zinc-400">Dist: <strong className="text-cyan-300">{distancePct}%</strong></span>
            </div>
          </div>

          {/* Radar Container */}
          <div className="flex items-center justify-center py-2">
            <div
              ref={radarRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-cyan-500/25 bg-zinc-900/60 relative cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center touch-none"
              title="Click or drag to position sound in the 360° sound field"
            >
              {/* Concentric Distance Calibration Rings */}
              <div className="w-48 h-48 rounded-full border border-white/5 absolute pointer-events-none" />
              <div className="w-36 h-36 rounded-full border border-white/5 absolute pointer-events-none" />
              <div className="w-24 h-24 rounded-full border border-white/5 absolute pointer-events-none" />
              <div className="w-12 h-12 rounded-full border border-cyan-500/10 absolute pointer-events-none" />

              {/* Crosshair Axes */}
              <div className="w-full h-px bg-white/5 absolute pointer-events-none" />
              <div className="h-full w-px bg-white/5 absolute pointer-events-none" />

              {/* Listener Center Orientation Anchor */}
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-indigo-500/40 flex items-center justify-center z-10 pointer-events-none shadow-md">
                <Headphones className="w-4 h-4 text-indigo-300" />
              </div>

              {/* Draggable Sound Source Beacon */}
              <div
                className="absolute w-7 h-7 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_16px_rgba(34,211,238,0.8)] flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none z-20"
                style={{
                  left: `${50 + posX * 42}%`,
                  top: `${50 + posY * 42}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
              </div>

              {/* Polar Field Direction Labels */}
              <span className="absolute top-2 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase tracking-wider">Front (0°)</span>
              <span className="absolute bottom-2 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase tracking-wider">Rear (180°)</span>
              <span className="absolute left-2.5 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase tracking-wider">Left (270°)</span>
              <span className="absolute right-2.5 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase tracking-wider">Right (90°)</span>
            </div>
          </div>

          {/* Radar Footer: Quick Action & Guidance */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5 mt-2">
            <span className="text-[11px] text-zinc-500 font-mono">
              X: {posX > 0 ? `+${posX.toFixed(2)}` : posX.toFixed(2)} · Y: {posY > 0 ? `+${posY.toFixed(2)}` : posY.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={handleCenterPosition}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Reset to Center
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SPATIAL CONTROLS & IMMERSION SLIDERS (Right 6 Columns)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4 p-5 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-xl">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Soundstage Parameters</span>
              <span className="text-[10px] font-mono text-zinc-500">REALTIME DSP</span>
            </div>

            {/* 1. Stereo Soundstage Width */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Stereo Soundstage Width</span>
                <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                  {Math.round((spatial.width || 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={spatial.width || 1.0}
                onChange={(e) => updateSpatial({ width: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
                aria-label="Stereo Soundstage Width"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
                <span>Mono (20%)</span>
                <span>100% (Studio)</span>
                <span>Ultra-Wide (250%)</span>
              </div>
            </div>

            {/* 2. Acoustic Soundstage Depth */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Acoustic Soundstage Depth</span>
                <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                  {Math.round((spatial.depth || 0.4) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={spatial.depth || 0.4}
                onChange={(e) => updateSpatial({ depth: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
                aria-label="Acoustic Soundstage Depth"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
                <span>Intimate (0%)</span>
                <span>Moderate (50%)</span>
                <span>Expansive (100%)</span>
              </div>
            </div>

            {/* 3. Virtual Room Reflections */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Virtual Room Reflections</span>
                <span className="font-mono text-xs font-bold text-cyan-300 tabular-nums">
                  {Math.round(spatial.room || 0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={spatial.room || 0}
                onChange={(e) => updateSpatial({ room: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
                aria-label="Virtual Room Reflections"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 tabular-nums">
                <span>Dry Studio (0%)</span>
                <span>Chamber (50%)</span>
                <span>Large Hall (100%)</span>
              </div>
            </div>
          </div>

          {/* Immersion Enhancers (Speech Clarity & Sub-Bass Enhancement) */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-white/5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Immersion Enhancers</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Clarity */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Speech Clarity</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    +{immersive.clarity?.toFixed(1) || 0} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={immersive.clarity || 0}
                  onChange={(e) => updateImmersive({ clarity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
                  aria-label="Speech Clarity Boost"
                />
              </div>

              {/* Sub-Bass Enhancement */}
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Sub Immersion</span>
                  <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
                    +{immersive.bassEnhancement?.toFixed(1) || 0} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={immersive.bassEnhancement || 0}
                  onChange={(e) => updateImmersive({ bassEnhancement: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded accent-cyan-400 cursor-pointer"
                  aria-label="Sub Immersion Boost"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
