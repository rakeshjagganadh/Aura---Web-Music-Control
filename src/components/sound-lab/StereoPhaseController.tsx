import React, { useEffect, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  Compass, 
  Split, 
  RotateCcw, 
  Radio, 
  Sliders, 
  Activity, 
  Volume2,
  Headphones,
  Check
} from 'lucide-react';
import { ChannelMonitorMode } from '../../types';

export const StereoPhaseController: React.FC = () => {
  const {
    stereoControl,
    setStereoWidth,
    setStereoBalance,
    toggleMono,
    setChannelMonitor,
    getStereoCorrelation,
  } = useMusic();

  const [phaseData, setPhaseData] = useState<{
    correlation: number;
    leftEnergy: number;
    rightEnergy: number;
    widthPct: number;
  }>({
    correlation: 0.85,
    leftEnergy: 0.4,
    rightEnergy: 0.4,
    widthPct: 100,
  });

  // Poll phase correlation during playback
  useEffect(() => {
    const interval = setInterval(() => {
      const val = getStereoCorrelation();
      if (typeof val === 'number') {
        setPhaseData((prev) => ({ ...prev, correlation: isNaN(val) ? 0.85 : val }));
      } else if (val && typeof val === 'object') {
        setPhaseData({
          correlation: typeof val.correlation === 'number' && !isNaN(val.correlation) ? val.correlation : 0.85,
          leftEnergy: typeof val.leftEnergy === 'number' ? val.leftEnergy : 0.4,
          rightEnergy: typeof val.rightEnergy === 'number' ? val.rightEnergy : 0.4,
          widthPct: typeof val.widthPct === 'number' ? val.widthPct : 100,
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [getStereoCorrelation]);

  const monitorModes: { id: ChannelMonitorMode; label: string; desc: string }[] = [
    { id: 'stereo', label: 'Full Stereo', desc: 'Standard L/R matrix' },
    { id: 'left', label: 'Solo Left (L)', desc: 'Audition Left Channel' },
    { id: 'right', label: 'Solo Right (R)', desc: 'Audition Right Channel' },
    { id: 'mono', label: 'Mono Sum (L+R)', desc: 'Check Mono Compatibility' },
  ];

  const correlation = typeof phaseData.correlation === 'number' && !isNaN(phaseData.correlation)
    ? Math.max(-1.0, Math.min(1.0, phaseData.correlation))
    : 0.85;

  // Correlation position percentage: -1 (0%) -> 0 (50%) -> +1 (100%)
  const correlationPct = Math.max(0, Math.min(100, ((correlation + 1) / 2) * 100));

  return (
    <div id="stereo-phase-controller" className="flex flex-col gap-6 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Stereo Field & Phase Studio</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Stereo spatial spread, L/R balance, solo monitoring, and real-time phase correlation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setStereoWidth(1.0);
            setStereoBalance(0);
            setChannelMonitor('stereo');
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 transition-colors self-start sm:self-auto cursor-pointer aura-pressable aura-focus-ring"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Stereo
        </button>
      </div>

      {/* Real-time Phase Correlation Meter */}
      <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-zinc-950/70 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stereo Phase Correlation Meter</span>
          </div>
          <span className={`text-xs font-mono font-bold ${
            correlation > 0.3 ? 'text-emerald-400' : correlation > 0 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {correlation >= 0 ? `+${correlation.toFixed(2)}` : correlation.toFixed(2)}
          </span>
        </div>

        {/* Meter bar */}
        <div className="relative w-full h-4 rounded-full bg-zinc-900 overflow-hidden border border-white/10">
          {/* Gradient backdrop: Red on left (-1), Yellow in middle (0), Green on right (+1) */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-emerald-500/30" />
          {/* Center line marker */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 transform -translate-x-1/2 z-0" />
          {/* Active pointer indicator */}
          <div
            className="absolute top-0 bottom-0 w-2.5 rounded-full bg-white shadow-lg shadow-cyan-400/50 transform -translate-x-1/2 transition-[left] duration-100 ease-out z-10"
            style={{ left: `${correlationPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
          <span className="text-rose-400">-1 (Out of Phase)</span>
          <span className="text-amber-400">0 (Wide Stereo)</span>
          <span className="text-emerald-400">+1 (Mono In-Phase)</span>
        </div>

        {/* L / R Energy Meters */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold w-4">L</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-[width] duration-75"
                style={{ width: `${Math.min(100, (phaseData.leftEnergy || 0) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold w-4">R</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-[width] duration-75"
                style={{ width: `${Math.min(100, (phaseData.rightEnergy || 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Width & Balance Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stereo Width Slider */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/50 border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Stereo Expansion Width</h4>
              <p className="text-[10px] text-zinc-400">0% (Mono) to 200% (Ultra-Wide binaural)</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-white/5">
              {Math.round(stereoControl.width * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={stereoControl.width}
            onChange={(e) => setStereoWidth(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>0% (Mono)</span>
            <span className={Math.abs(stereoControl.width - 1.0) < 0.05 ? 'text-cyan-400 font-bold' : ''}>100% (Standard)</span>
            <span>200% (Max Wide)</span>
          </div>
        </div>

        {/* Stereo Balance Slider */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/50 border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Left / Right Pan Balance</h4>
              <p className="text-[10px] text-zinc-400">Precision pan positioning across speakers</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-300 bg-zinc-900 px-2 py-0.5 rounded-lg border border-white/5">
              {stereoControl.balance === 0
                ? 'Center'
                : stereoControl.balance < 0
                ? `L ${Math.round(Math.abs(stereoControl.balance) * 100)}%`
                : `R ${Math.round(stereoControl.balance * 100)}%`}
            </span>
          </div>

          <input
            type="range"
            min="-1"
            max="1"
            step="0.02"
            value={stereoControl.balance}
            onChange={(e) => setStereoBalance(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg bg-zinc-800 accent-blue-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>100% Left</span>
            <span className={stereoControl.balance === 0 ? 'text-blue-400 font-bold' : ''}>Center (0)</span>
            <span>100% Right</span>
          </div>
        </div>
      </div>

      {/* Monitor Modes Grid */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Channel Monitoring Routing</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {monitorModes.map((m) => {
            const isSelected = stereoControl.monitorMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setChannelMonitor(m.id)}
                className={`flex flex-col items-start gap-1 p-3 rounded-2xl text-left transition-colors border cursor-pointer aura-pressable-subtle aura-focus-ring ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-200 shadow-md shadow-blue-500/10'
                    : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">{m.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
