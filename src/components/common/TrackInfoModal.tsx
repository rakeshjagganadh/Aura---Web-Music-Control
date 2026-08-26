import React, { useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  X, 
  Info, 
  Music, 
  Disc, 
  Clock, 
  HardDrive, 
  Activity, 
  Sparkles, 
  Play, 
  Heart,
  Sliders,
  Cpu,
  Layers
} from 'lucide-react';
import { WaveformScrubber } from '../waveform/WaveformScrubber';

export const TrackInfoModal: React.FC = () => {
  const {
    isTrackInfoOpen,
    closeTrackInfo,
    selectedInfoTrack,
    currentTrack,
    playTrack,
    toggleFavorite,
    analyzeCurrentTrack,
    isAnalyzingTrack,
    currentTrackAnalysis,
  } = useMusic();

  const track = selectedInfoTrack || currentTrack;

  useEffect(() => {
    if (isTrackInfoOpen && track && !currentTrackAnalysis) {
      // Automatic non-blocking analysis trigger if needed
    }
  }, [isTrackInfoOpen, track, currentTrackAnalysis]);

  if (!isTrackInfoOpen || !track) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (ts: number) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#0d0f15] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Track Metadata & Acoustic Profile</h3>
              <p className="text-xs text-zinc-400">Technical specifications and audio analysis</p>
            </div>
          </div>

          <button
            onClick={closeTrackInfo}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
          
          {/* Main Track Summary Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4.5 rounded-2xl bg-zinc-900/60 border border-white/5">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-md">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                  <Music className="w-8 h-8 text-white/80" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {track.fileFormat} AUDIO
                </span>
                {track.isFavorite && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    FAVORITE
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-white truncate mt-1">{track.title}</h4>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {track.artist} {track.album ? `• ${track.album}` : ''}
              </p>
            </div>

            <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => playTrack(track)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Track
              </button>
              <button
                onClick={() => toggleFavorite(track.id)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Waveform Signature
            </span>
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5">
              <WaveformScrubber
                peaks={track.waveformPeaks}
                currentTime={0}
                duration={track.duration}
                height={36}
                barWidth={2.5}
                barGap={1.5}
                activeColor="#818cf8"
                inactiveColor="rgba(255, 255, 255, 0.18)"
              />
            </div>
          </div>

          {/* Technical Audio Metadata Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Audio File Specifications
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
                <span className="text-zinc-500">Format & Codec</span>
                <span className="font-mono text-zinc-200 font-semibold">{track.fileFormat}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
                <span className="text-zinc-500">Duration</span>
                <span className="font-mono text-zinc-200 font-semibold">{formatTime(track.duration)}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
                <span className="text-zinc-500">File Size</span>
                <span className="font-mono text-emerald-400 font-semibold">{formatBytes(track.fileSize)}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
                <span className="text-zinc-500">Sample Rate</span>
                <span className="font-mono text-zinc-200 font-semibold">{track.sampleRate || 44100} Hz</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
                <span className="text-zinc-500">Audio Channels</span>
                <span className="font-mono text-zinc-200 font-semibold">{track.channels || 2} (Stereo)</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1">
                <span className="text-zinc-500">Date Added</span>
                <span className="font-mono text-zinc-200 font-semibold">{formatDate(track.dateAdded)}</span>
              </div>
            </div>
          </div>

          {/* Deep Offline Acoustic Analysis */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Offline Spectral & Dynamics Analysis
              </span>

              <button
                onClick={analyzeCurrentTrack}
                disabled={isAnalyzingTrack}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {isAnalyzingTrack ? 'Analyzing...' : 'Run Deep Analysis'}
              </button>
            </div>

            {currentTrackAnalysis ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-1">
                  <span className="text-zinc-400">Integrated LUFS</span>
                  <span className="font-mono text-indigo-300 font-bold text-sm">
                    {currentTrackAnalysis.integratedLufs} LUFS
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-1">
                  <span className="text-zinc-400">Estimated Tempo</span>
                  <span className="font-mono text-cyan-300 font-bold text-sm">
                    {currentTrackAnalysis.estimatedBpm} BPM
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-1">
                  <span className="text-zinc-400">Dynamic Range</span>
                  <span className="font-mono text-zinc-200 font-bold text-sm">
                    {currentTrackAnalysis.dynamicRangeDb} dB
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-1">
                  <span className="text-zinc-400">Peak Volume</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {currentTrackAnalysis.peakDb} dB
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-dashed border-white/5 text-center">
                <p className="text-xs text-zinc-400">
                  Run deep spectral analysis to calculate integrated loudness (LUFS), estimated BPM, dynamic range, and frequency distribution.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/5 flex items-center justify-end">
          <button
            onClick={closeTrackInfo}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
