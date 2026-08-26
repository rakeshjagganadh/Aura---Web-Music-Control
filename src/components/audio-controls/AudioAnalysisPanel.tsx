import React, { useEffect, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { audioEngine } from '../../services/audioEngine';
import { RealtimeMeterData } from '../../types';
import { 
  Activity, 
  BarChart3, 
  Sparkles, 
  Zap, 
  Music2, 
  Gauge, 
  FileAudio,
  Radio,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const AudioAnalysisPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    currentTrack, 
    currentTrackAnalysis, 
    isAnalyzingTrack, 
    analyzeCurrentTrack 
  } = useMusic();

  const [meterLevels, setMeterLevels] = useState<RealtimeMeterData>({
    peakL: -60,
    peakR: -60,
    peakLNorm: 0,
    peakRNorm: 0,
    vuL: -20,
    vuR: -20,
    approxLufs: -24,
    dynamicRangeDb: 8,
    isClipping: false,
    gainReductionDb: 0,
  });

  // Real-time meter polling
  useEffect(() => {
    let animId: number;
    const poll = () => {
      const levels = audioEngine.getRealtimeMeterData();
      setMeterLevels(levels);
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, []);

  const dbToPercent = (db: number) => {
    // Map -60 dB to 0 dB to 0% - 100%
    const clamped = Math.max(-60, Math.min(0, db));
    return ((clamped + 60) / 60) * 100;
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Audio Analysis & Signal Inspection</h3>
            <p className="text-[11px] text-zinc-400">
              Real-time ITU-R BS.1770 LUFS metering, peak dynamics, and client-side offline audio analysis.
            </p>
          </div>
        </div>

        <button
          onClick={analyzeCurrentTrack}
          disabled={isAnalyzingTrack || !currentTrack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-500/20"
        >
          {isAnalyzingTrack ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Analyzing Audio...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              Analyze Active Track
            </>
          )}
        </button>
      </div>

      {/* Real-time Level Meters */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Live Master Output Metering
          </span>

          <div className="flex items-center gap-2">
            {meterLevels.isClipping && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold animate-pulse border border-rose-500/30">
                OVERLOAD PEAK
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-400">
              Momentary: {meterLevels.approxLufs.toFixed(1)} LUFS
            </span>
          </div>
        </div>

        {/* Stereo Peak & RMS Bars */}
        <div className="flex flex-col gap-2.5">
          {/* Left Channel */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-zinc-400 w-4">L</span>
            <div className="flex-1 h-3.5 bg-zinc-950 rounded-md overflow-hidden p-0.5 border border-white/5 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-sm transition-all duration-75"
                style={{ width: `${dbToPercent(meterLevels.peakL)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-300 w-12 text-right">
              {meterLevels.peakL.toFixed(1)} dB
            </span>
          </div>

          {/* Right Channel */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-zinc-400 w-4">R</span>
            <div className="flex-1 h-3.5 bg-zinc-950 rounded-md overflow-hidden p-0.5 border border-white/5 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-sm transition-all duration-75"
                style={{ width: `${dbToPercent(meterLevels.peakR)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-300 w-12 text-right">
              {meterLevels.peakR.toFixed(1)} dB
            </span>
          </div>

          {/* Scale markers */}
          <div className="flex justify-between text-[9px] font-mono text-zinc-600 px-7">
            <span>-60 dB</span>
            <span>-40 dB</span>
            <span>-20 dB</span>
            <span>-12 dB</span>
            <span>-6 dB</span>
            <span>0 dB</span>
          </div>
        </div>
      </div>

      {/* Offline Deep Analysis Summary */}
      {currentTrackAnalysis ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* BPM */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-indigo-400" />
                Tempo / BPM
              </span>
              <span className="text-xl font-bold text-white font-mono tracking-tight">
                {currentTrackAnalysis.estimatedBpm} <span className="text-xs text-zinc-500 font-normal">BPM</span>
              </span>
            </div>

            {/* Integrated LUFS */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" />
                Integrated Loudness
              </span>
              <span className="text-xl font-bold text-white font-mono tracking-tight">
                {currentTrackAnalysis.integratedLufs} <span className="text-xs text-zinc-500 font-normal">LUFS</span>
              </span>
            </div>

            {/* True Peak */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" />
                Peak Level
              </span>
              <span className="text-xl font-bold text-white font-mono tracking-tight">
                {currentTrackAnalysis.truePeakEstimateDb || currentTrackAnalysis.peakDb} <span className="text-xs text-zinc-500 font-normal">dBFS</span>
              </span>
            </div>

            {/* Dynamic Range */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-emerald-400" />
                Dynamic Range (DR)
              </span>
              <span className="text-xl font-bold text-white font-mono tracking-tight">
                {currentTrackAnalysis.dynamicRangeDb} <span className="text-xs text-zinc-500 font-normal">dB</span>
              </span>
            </div>

          </div>

          {/* Frequency Balance Distribution */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Spectral Energy Distribution
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Sub Bass & Lows', val: (currentTrackAnalysis.subBassEnergy || 0.3) * 100, color: 'from-purple-500 to-indigo-500' },
                { label: 'Midrange & Body', val: (currentTrackAnalysis.midEnergy || 0.4) * 100, color: 'from-indigo-500 to-cyan-500' },
                { label: 'Highs & Shimmer', val: (currentTrackAnalysis.highEnergy || 0.3) * 100, color: 'from-cyan-500 to-emerald-500' },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-[10px] text-zinc-400">{f.label}</span>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${f.color}`}
                      style={{ width: `${Math.min(100, f.val)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-300 self-end">{f.val.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-zinc-900/20 border border-white/5 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-300">Run Deep Offline Audio Analysis</h4>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-0.5">
              Click the button above to extract exact BPM tempo, integrated LUFS loudness, spectral energy, and dynamic headroom directly in your browser.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
