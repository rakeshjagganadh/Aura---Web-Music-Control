import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { useMusic } from '../../context/MusicContext';
import { formatSeconds, formatPreciseSeconds } from '../../utils/formatTime';
import { 
  Scissors, 
  Download, 
  Play, 
  Pause, 
  X, 
  Sliders, 
  Sparkles, 
  Save, 
  Music, 
  FileAudio, 
  Check, 
  Clock, 
  Volume2 
} from 'lucide-react';
import { ExportAudioOptions } from '../../types';

export const TrimExportModal: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    trimFade,
    updateTrimFade,
    previewTrimmedSection,
    stopTrimPreview,
    saveTrimmedClip,
    exportTrack,
    isTrimExportModalOpen,
    setIsTrimExportModalOpen,
    showToast,
  } = useMusic();

  const [isExporting, setIsExporting] = useState(false);
  const [isSavingClip, setIsSavingClip] = useState(false);
  const [applyDsp, setApplyDsp] = useState(true);
  const [applyTrim, setApplyTrim] = useState(true);
  const [bitDepth, setBitDepth] = useState<16 | 24 | 32>(24);
  const [sampleRate, setSampleRate] = useState<44100 | 48000 | 96000>(44100);
  const [customFilename, setCustomFilename] = useState('');

  const trackDuration = duration || currentTrack?.duration || 180;
  const trimStart = trimFade.trimStart || 0;
  const trimEnd = trimFade.trimEnd && trimFade.trimEnd > 0 ? trimFade.trimEnd : trackDuration;
  const selectedLength = Math.max(0.5, trimEnd - trimStart);

  const handleExportDownload = async () => {
    if (!currentTrack) return;
    try {
      setIsExporting(true);
      const options: ExportAudioOptions = {
        filename: customFilename || `${currentTrack.artist} - ${currentTrack.title}`,
        format: 'wav',
        bitDepth,
        sampleRate,
        applyDsp,
        applyTrim,
        trimStart: applyTrim ? trimStart : 0,
        trimEnd: applyTrim ? trimEnd : trackDuration,
        fadeIn: applyTrim ? trimFade.fadeIn : 0,
        fadeOut: applyTrim ? trimFade.fadeOut : 0,
      };
      const { blob, filename } = await exportTrack(options);

      // Trigger browser file download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export download error:', err);
      showToast('Export failed. Please ensure the audio file is loaded.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!currentTrack) return;
    try {
      setIsSavingClip(true);
      const title = customFilename || `${currentTrack.title} (Trimmed)`;
      const newTrack = await saveTrimmedClip(title);
      if (newTrack) {
        setIsTrimExportModalOpen(false);
      }
    } catch (err) {
      console.error('Save to library error:', err);
    } finally {
      setIsSavingClip(false);
    }
  };

  return (
    <AnimatePresence>
      {isTrimExportModalOpen && (
        <MotionBackdrop
          onClick={() => setIsTrimExportModalOpen(false)}
          style={{ pointerEvents: isTrimExportModalOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <MotionModal
            variant="center"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Audio Trimmer & Lossless Master Export</h2>
              <p className="text-xs text-zinc-400">
                Render trimmed snippets or export high-resolution master files with your custom DSP chain.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTrimExportModalOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer aura-pressable"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Active Track Banner */}
          {currentTrack && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {currentTrack.coverUrl ? (
                    <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{currentTrack.title}</h4>
                  <p className="text-[11px] text-zinc-400">{currentTrack.artist} • {formatSeconds(trackDuration)}</p>
                </div>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => {
                  if (trimFade.isPlayingPreview) {
                    stopTrimPreview();
                  } else {
                    previewTrimmedSection();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  trimFade.isPlayingPreview
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-200 border-white/10 hover:bg-zinc-700'
                }`}
              >
                {trimFade.isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {trimFade.isPlayingPreview ? 'Stop Preview' : 'Audition Trim'}
              </button>
            </div>
          )}

          {/* Trim Range Sliders */}
          <div className="flex flex-col gap-4 p-4 rounded-2xl bg-zinc-950/40 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Trim Boundaries</span>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                Selection: {formatPreciseSeconds(selectedLength)}
              </span>
            </div>

            {/* Start Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Start Point:</span>
                <span className="font-mono text-white">{formatPreciseSeconds(trimStart)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(1, trimEnd - 0.5)}
                step="0.1"
                value={trimStart}
                onChange={(e) => updateTrimFade({ trimStart: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-lg bg-zinc-800 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* End Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>End Point:</span>
                <span className="font-mono text-white">{formatPreciseSeconds(trimEnd)}</span>
              </div>
              <input
                type="range"
                min={Math.min(trackDuration - 0.1, trimStart + 0.5)}
                max={trackDuration}
                step="0.1"
                value={trimEnd}
                onChange={(e) => updateTrimFade({ trimEnd: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-lg bg-zinc-800 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Quick Set buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => updateTrimFade({ trimStart: currentTime })}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Set Start at Playhead ({formatSeconds(currentTime)})
              </button>
              <button
                onClick={() => updateTrimFade({ trimEnd: currentTime })}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Set End at Playhead ({formatSeconds(currentTime)})
              </button>
              <button
                onClick={() => updateTrimFade({ trimStart: 0, trimEnd: trackDuration })}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors ml-auto"
              >
                Reset Span
              </button>
            </div>
          </div>

          {/* Fades Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-950/40 border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Fade In</span>
                <span className="font-mono text-cyan-300">{trimFade.fadeIn.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={trimFade.fadeIn}
                onChange={(e) => updateTrimFade({ fadeIn: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-950/40 border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Fade Out</span>
                <span className="font-mono text-cyan-300">{trimFade.fadeOut.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={trimFade.fadeOut}
                onChange={(e) => updateTrimFade({ fadeOut: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-lg bg-zinc-800 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Master Rendering & Format Options */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/40 border border-white/5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Audio Master Settings</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bit Depth */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-zinc-400">Resolution Bit Depth</label>
                <div className="flex gap-1.5">
                  {([16, 24, 32] as const).map((bits) => (
                    <button
                      key={bits}
                      onClick={() => setBitDepth(bits)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                        bitDepth === bits
                          ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                          : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {bits}-bit {bits === 24 ? '(Studio)' : bits === 16 ? '(CD)' : '(Float)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Rate */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-zinc-400">Sample Rate</label>
                <div className="flex gap-1.5">
                  {([44100, 48000, 96000] as const).map((sr) => (
                    <button
                      key={sr}
                      onClick={() => setSampleRate(sr)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                        sampleRate === sr
                          ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                          : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sr === 44100 ? '44.1k' : sr === 48000 ? '48k' : '96k'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle DSP checkbox */}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyDsp}
                  onChange={(e) => setApplyDsp(e.target.checked)}
                  className="rounded bg-zinc-800 border-white/10 text-emerald-500 focus:ring-0"
                />
                <span>Include Aura Sound Lab DSP Effects & EQ snapshot in export</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTrim}
                  onChange={(e) => setApplyTrim(e.target.checked)}
                  className="rounded bg-zinc-800 border-white/10 text-emerald-500 focus:ring-0"
                />
                <span>Apply Trim & Fade Range</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 border-t border-white/5 bg-zinc-950/80">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Export filename (optional)"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveToLibrary}
              disabled={isSavingClip || isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-white/10 disabled:opacity-50 transition-colors cursor-pointer aura-pressable"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              {isSavingClip ? 'Saving...' : 'Save Clip to Library'}
            </button>

            <button
              onClick={handleExportDownload}
              disabled={isExporting || isSavingClip}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-colors cursor-pointer aura-pressable"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Rendering Audio...' : 'Export WAV Master'}
            </button>
          </div>
        </div>
          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
