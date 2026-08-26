import React, { useState, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { EQ_10_BANDS } from '../../services/audioEngine';
import { EqualizerPreset } from '../../types';
import { 
  X, 
  RotateCcw, 
  Radio, 
  SlidersHorizontal, 
  Sparkles, 
  Compass, 
  Activity, 
  BarChart3, 
  Bookmark, 
  Layers, 
  Check
} from 'lucide-react';

type MobileAudioTab = 'basic' | 'eq' | 'effects' | 'spatial' | 'dynamics' | 'analysis' | 'presets';

export const MobileAudioControlSheet: React.FC = () => {
  const {
    isAudioControlsOpen,
    setIsAudioControlsOpen,
    isABBypassed,
    toggleABBypass,
    resetAllAudioProcessing,
    bass,
    setBass,
    treble,
    setTreble,
    balance,
    setBalance,
    eqPreset,
    setEqPreset,
    eqGains,
    setEqGain,
    effects,
    updateEffects,
    spatial,
    updateSpatial,
    compressor,
    updateCompressor,
    limiter,
    updateLimiter,
    currentTrack,
    realtimeMeters,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<MobileAudioTab>('basic');
  const spatialCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!isAudioControlsOpen) return null;

  const tabs: { id: MobileAudioTab; label: string; icon: React.ElementType }[] = [
    { id: 'basic', label: 'Tone', icon: Layers },
    { id: 'eq', label: '10-Band EQ', icon: SlidersHorizontal },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'spatial', label: 'Spatial 3D', icon: Compass },
    { id: 'dynamics', label: 'Dynamics', icon: Activity },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'presets', label: 'Presets', icon: Bookmark },
  ];

  const PRESET_LIST: { id: EqualizerPreset; label: string; desc: string }[] = [
    { id: 'flat', label: 'Flat / Studio Direct', desc: 'Neutral, unaltered studio mastering curve' },
    { id: 'bass_boost', label: 'Bass Boost', desc: 'Rich sub punch and low-end warmth' },
    { id: 'deep_bass', label: 'Deep Bass Sub', desc: 'Heavy sub-bass emphasis for electronic and trap' },
    { id: 'vocal', label: 'Vocal Clarity', desc: 'Lifted mids and intelligibility for speech & singing' },
    { id: 'rock', label: 'Rock & Metal', desc: 'Punchy kick, crisp electric guitars, elevated highs' },
    { id: 'pop', label: 'Modern Pop', desc: 'Bright presence, polished vocals, dynamic low-end' },
    { id: 'hip_hop', label: 'Hip-Hop & R&B', desc: 'Sub-bass dominance with crisp hi-hat shimmer' },
    { id: 'acoustic', label: 'Acoustic / Warm', desc: 'Natural woody resonance and organic mid tones' },
    { id: 'cinematic', label: 'Cinematic Wide', desc: 'Grand scale, cinematic score depth and rumble' },
    { id: 'night', label: 'Night Listening', desc: 'Tamed dynamic peaks for low-volume comfort' },
    { id: 'workout', label: 'Workout Energy', desc: 'High impact energetic kick and driving highs' },
    { id: 'chill', label: 'Chill & Relax', desc: 'Smooth, relaxed high-end and gentle warmth' },
  ];

  // Interactive Spatial 2D Touch Field
  const handleSpatialTouch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!spatialCanvasRef.current) return;
    const rect = spatialCanvasRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const xRel = (clientX - rect.left) / rect.width; // 0 to 1
    const yRel = (clientY - rect.top) / rect.height; // 0 to 1

    // Map to positionX (-1 to 1) and positionY (-1 to 1)
    const posX = Math.max(-1, Math.min(1, (xRel - 0.5) * 2));
    const posY = Math.max(-1, Math.min(1, (0.5 - yRel) * 2));

    const angleRad = Math.atan2(posY, posX);
    const angleDeg = Math.round((angleRad * 180) / Math.PI);

    updateSpatial({
      enabled: true,
      mode: spatial?.mode === 'off' ? '3d' : (spatial?.mode || '3d'),
      positionX: posX,
      positionY: posY,
      angle: angleDeg,
    });
  };

  return (
    <div
      id="mobile-audio-control-sheet"
      className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none animate-in fade-in duration-200"
    >
      {/* Backdrop tap to close */}
      <div 
        className="flex-1" 
        onClick={() => setIsAudioControlsOpen(false)} 
      />

      {/* Sheet Content Container */}
      <div className="relative w-full max-h-[92vh] bg-[#0c0d12] border-t border-white/15 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pb-safe animate-in slide-in-from-bottom duration-300">
        
        {/* Sheet Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto mt-3 mb-1 shrink-0" />

        {/* Top Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">Audio Studio</h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  DSP
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate max-w-[170px] sm:max-w-xs">
                {currentTrack ? currentTrack.title : 'Master Audio Controls'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* A/B Comparison Toggle */}
            <button
              type="button"
              onClick={toggleABBypass}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold font-mono border transition-all cursor-pointer ${
                isABBypassed
                  ? 'bg-zinc-800 text-zinc-400 border-white/10'
                  : 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40'
              }`}
              title="A/B Comparison"
            >
              <Radio className={`w-3 h-3 ${!isABBypassed ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>{isABBypassed ? 'A: RAW' : 'B: DSP'}</span>
            </button>

            {/* Reset Processing */}
            <button
              type="button"
              onClick={resetAllAudioProcessing}
              className="p-2 text-zinc-400 hover:text-zinc-200 active:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Reset Audio Processing"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => setIsAudioControlsOpen(false)}
              className="p-2 text-zinc-400 hover:text-white active:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Horizontal Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          
          {/* TAB 1: BASIC TONE */}
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-5">
              
              {/* Bass Slider */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Low-End Bass</span>
                  <span className={`text-xs font-mono font-bold ${bass > 0 ? 'text-indigo-400' : bass < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {bass > 0 ? `+${bass.toFixed(1)}` : bass.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={bass}
                  onChange={(e) => setBass(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Treble Slider */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">High-End Treble</span>
                  <span className={`text-xs font-mono font-bold ${treble > 0 ? 'text-cyan-400' : treble < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {treble > 0 ? `+${treble.toFixed(1)}` : treble.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={treble}
                  onChange={(e) => setTreble(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Stereo Balance Slider */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Stereo Balance</span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {balance === 0 ? 'CENTER' : balance < 0 ? `L ${Math.abs(Math.round(balance * 100))}%` : `R ${Math.round(balance * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={balance}
                  onChange={(e) => setBalance(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Quick Presets Pills */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Quick Sound Curve
                </span>
                <div className="flex flex-wrap gap-2">
                  {['flat', 'bass_boost', 'vocal', 'rock', 'pop', 'cinematic'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEqPreset(p as EqualizerPreset)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        eqPreset === p
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-zinc-900 text-zinc-300 border border-white/5 hover:bg-zinc-800'
                      }`}
                    >
                      {p.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: 10-BAND EQ */}
          {activeTab === 'eq' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                  Active Curve: {eqPreset.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setEqPreset('flat')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Reset Flat
                </button>
              </div>

              {/* 10 Vertical Bands with touch spacing and horizontal scroll */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 overflow-x-auto no-scrollbar">
                <div className="flex items-end justify-between gap-3 min-w-[460px] h-48 py-2">
                  {EQ_10_BANDS.map((band, idx) => {
                    const gainVal = eqGains[idx] || 0;
                    return (
                      <div key={band.freq} className="flex flex-col items-center gap-2 flex-1">
                        <span className={`text-[10px] font-mono font-bold ${gainVal > 0 ? 'text-indigo-400' : gainVal < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                          {gainVal > 0 ? `+${gainVal.toFixed(0)}` : gainVal.toFixed(0)}
                        </span>
                        <div className="h-32 flex items-center justify-center">
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={gainVal}
                            onChange={(e) => setEqGain(idx, parseFloat(e.target.value))}
                            className="slider-vertical"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 font-medium whitespace-nowrap">
                          {band.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preset Selector Grid */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Select Preset
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_LIST.slice(0, 8).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEqPreset(preset.id)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        eqPreset === preset.id
                          ? 'bg-indigo-950/40 text-indigo-200 border-indigo-500/50 ring-1 ring-indigo-500/30'
                          : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-semibold text-zinc-200">{preset.label}</span>
                      <span className="text-[10px] text-zinc-500 truncate mt-0.5">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EFFECTS RACK (Stacked Touch Cards) */}
          {activeTab === 'effects' && (
            <div className="flex flex-col gap-4">
              
              {/* Reverb Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">Reverb Studio</span>
                    <span className="text-[10px] font-mono text-zinc-400">{Math.round((effects?.reverb?.wet || 0.3) * 100)}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateEffects({ reverb: { ...effects?.reverb, enabled: !effects?.reverb?.enabled, roomSize: effects?.reverb?.roomSize || 0.5, decay: effects?.reverb?.decay || 1.5, wet: effects?.reverb?.wet || 0.3 } })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      effects?.reverb?.enabled ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {effects?.reverb?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {effects?.reverb?.enabled && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Wet Mix</span>
                      <span>{Math.round((effects?.reverb?.wet || 0.3) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={effects?.reverb?.wet || 0.3}
                      onChange={(e) => updateEffects({ reverb: { ...effects?.reverb, wet: parseFloat(e.target.value), enabled: true, roomSize: effects?.reverb?.roomSize || 0.5, decay: effects?.reverb?.decay || 1.5 } })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Delay / Echo Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">Echo & Delay</span>
                    <span className="text-[10px] font-mono text-zinc-400">{Math.round((effects?.echo?.delayTime || 0.25) * 1000)}ms</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateEffects({ echo: { ...effects?.echo, enabled: !effects?.echo?.enabled, delayTime: effects?.echo?.delayTime || 0.25, feedback: effects?.echo?.feedback || 0.3, wet: effects?.echo?.wet || 0.3 } })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      effects?.echo?.enabled ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {effects?.echo?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {effects?.echo?.enabled && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Delay Time</span>
                        <span>{Math.round((effects?.echo?.delayTime || 0.25) * 1000)} ms</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.01"
                        value={effects?.echo?.delayTime || 0.25}
                        onChange={(e) => updateEffects({ echo: { ...effects?.echo, delayTime: parseFloat(e.target.value), enabled: true, feedback: effects?.echo?.feedback || 0.3, wet: effects?.echo?.wet || 0.3 } })}
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Feedback</span>
                        <span>{Math.round((effects?.echo?.feedback || 0.3) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.01"
                        value={effects?.echo?.feedback || 0.3}
                        onChange={(e) => updateEffects({ echo: { ...effects?.echo, feedback: parseFloat(e.target.value), enabled: true, delayTime: effects?.echo?.delayTime || 0.25, wet: effects?.echo?.wet || 0.3 } })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Analog Warmth & Tube Drive Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">Analog Warmth / Drive</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateEffects({ saturation: { ...effects?.saturation, enabled: !effects?.saturation?.enabled, drive: effects?.saturation?.drive || 0.3, type: effects?.saturation?.type || 'tube' } })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      effects?.saturation?.enabled ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {effects?.saturation?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {effects?.saturation?.enabled && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Drive Amount</span>
                      <span>{Math.round((effects?.saturation?.drive || 0.3) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={effects?.saturation?.drive || 0.3}
                      onChange={(e) => updateEffects({ saturation: { ...effects?.saturation, drive: parseFloat(e.target.value), enabled: true, type: effects?.saturation?.type || 'tube' } })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Bass Boost & Treble Boost Sliders */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-100">Harmonic Bass Boost</span>
                  <span className="text-[10px] font-mono text-zinc-400">{effects?.bassBoost ? `+${effects.bassBoost.toFixed(1)} dB` : '0 dB'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={effects?.bassBoost || 0}
                  onChange={(e) => updateEffects({ bassBoost: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

            </div>
          )}

          {/* TAB 4: SPATIAL 3D AUDIO */}
          {activeTab === 'spatial' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">3D Binaural Soundfield</h4>
                  <p className="text-[11px] text-zinc-400">Drag the sound source point around your head</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSpatial({ enabled: !spatial?.enabled, mode: spatial?.mode === 'off' ? '3d' : (spatial?.mode || '3d') })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    spatial?.enabled ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {spatial?.enabled ? '3D ON' : 'OFF'}
                </button>
              </div>

              {/* Interactive 2D Soundfield Touch Circle */}
              <div className="relative w-64 h-64 mx-auto rounded-full bg-zinc-950 border-2 border-indigo-500/20 flex items-center justify-center shadow-inner touch-none">
                <canvas
                  ref={spatialCanvasRef}
                  width={256}
                  height={256}
                  onClick={handleSpatialTouch}
                  onTouchMove={handleSpatialTouch}
                  onTouchStart={handleSpatialTouch}
                  className="absolute inset-0 w-full h-full rounded-full cursor-crosshair"
                />
                
                {/* Center Listener Head */}
                <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-400/50 flex flex-col items-center justify-center text-[9px] font-bold text-indigo-300 pointer-events-none shadow-md">
                  <span>YOU</span>
                </div>

                {/* Draggable Sound Point Visual */}
                <div
                  className="absolute w-7 h-7 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_15px_#22d3ee] flex items-center justify-center pointer-events-none transition-transform"
                  style={{
                    left: `calc(${(((spatial?.positionX ?? 0) + 1) / 2) * 100}% - 14px)`,
                    top: `calc(${((1 - (spatial?.positionY ?? 0)) / 2) * 100}% - 14px)`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              {/* Width & Depth Sliders */}
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-zinc-300">
                    <span>Stereo Width</span>
                    <span className="font-mono text-indigo-400">{Math.round((spatial?.width ?? 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={spatial?.width ?? 1.0}
                    onChange={(e) => updateSpatial({ width: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-zinc-300">
                    <span>Virtual Room Scale</span>
                    <span className="font-mono text-indigo-400">{Math.round((spatial?.room ?? 0.3) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={spatial?.room ?? 0.3}
                    onChange={(e) => updateSpatial({ room: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DYNAMICS & LIMITER */}
          {activeTab === 'dynamics' && (
            <div className="flex flex-col gap-4">
              
              {/* Compressor Module */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100">Dynamic Compressor</span>
                  <button
                    type="button"
                    onClick={() => updateCompressor({ enabled: !compressor?.enabled })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      compressor?.enabled ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {compressor?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {compressor?.enabled && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Threshold</span>
                        <span className="font-mono text-zinc-200">{compressor?.threshold ?? -20} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="0"
                        step="1"
                        value={compressor?.threshold ?? -20}
                        onChange={(e) => updateCompressor({ threshold: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Ratio</span>
                        <span className="font-mono text-zinc-200">{compressor?.ratio ?? 4}:1</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={compressor?.ratio ?? 4}
                        onChange={(e) => updateCompressor({ ratio: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Limiter Module */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100">Brickwall Peak Limiter</span>
                  <button
                    type="button"
                    onClick={() => updateLimiter({ enabled: !limiter?.enabled })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      limiter?.enabled ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {limiter?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {limiter?.enabled && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Ceiling</span>
                      <span className="font-mono text-zinc-200">{limiter?.ceiling ?? -0.5} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="0"
                      step="0.1"
                      value={limiter?.ceiling ?? -0.5}
                      onChange={(e) => updateLimiter({ ceiling: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 6: ANALYSIS & LIVE METERS */}
          {activeTab === 'analysis' && (
            <div className="flex flex-col gap-4">
              
              {/* Stereo Peak VU Meters */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Live Output Levels</span>
                
                {/* L Channel */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-zinc-400 w-4">L</span>
                  <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.max(0, ((realtimeMeters?.peakL ?? -60) + 60) * 1.66))}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 w-12 text-right">
                    {(realtimeMeters?.peakL ?? -60).toFixed(1)} dB
                  </span>
                </div>

                {/* R Channel */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-zinc-400 w-4">R</span>
                  <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.max(0, ((realtimeMeters?.peakR ?? -60) + 60) * 1.66))}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 w-12 text-right">
                    {(realtimeMeters?.peakR ?? -60).toFixed(1)} dB
                  </span>
                </div>
              </div>

              {/* Integrated Loudness LUFS */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-200">Integrated Loudness</span>
                  <p className="text-[10px] text-zinc-400">Standard Streaming Target: -14.0 LUFS</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-indigo-300">
                    {(realtimeMeters?.lufs ?? -14).toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 ml-1">LUFS</span>
                </div>
              </div>

              {/* Track Metadata Specs */}
              {currentTrack && (
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Audio Stream Info</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-zinc-500">Format:</span> <span className="text-zinc-200 font-mono">{currentTrack.fileFormat}</span></div>
                    <div><span className="text-zinc-500">Sample Rate:</span> <span className="text-zinc-200 font-mono">{currentTrack.sampleRate ? `${(currentTrack.sampleRate / 1000).toFixed(1)} kHz` : '44.1 kHz'}</span></div>
                    <div><span className="text-zinc-500">Channels:</span> <span className="text-zinc-200 font-mono">{currentTrack.channels === 1 ? 'Mono' : 'Stereo 2.0'}</span></div>
                    <div><span className="text-zinc-500">Bitrate:</span> <span className="text-zinc-200 font-mono">{currentTrack.bitrate ? `${Math.round(currentTrack.bitrate / 1000)} kbps` : '320 kbps (est)'}</span></div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 7: PRESETS */}
          {activeTab === 'presets' && (
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Master DSP Presets
              </span>
              <div className="flex flex-col gap-2">
                {PRESET_LIST.map((p) => {
                  const isSelected = eqPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEqPreset(p.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 text-indigo-200 border-indigo-500/50 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-300 border-white/5 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">{p.label}</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">{p.desc}</span>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
