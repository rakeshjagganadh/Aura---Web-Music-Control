import React, { useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  X, 
  UploadCloud, 
  Music, 
  CheckCircle2, 
  Sparkles, 
  HardDrive, 
  FileAudio 
} from 'lucide-react';

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    uploadFiles,
    loadDemoPack,
  } = useMusic();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isUploadModalOpen) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      await uploadFiles(e.target.files);
      setIsProcessing(false);
      setIsUploadModalOpen(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsProcessing(true);
    await loadDemoPack();
    setIsProcessing(false);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl p-6 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Add Music to Aura</h3>
              <p className="text-xs text-zinc-400">Stored safely on your device (IndexedDB)</p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop / Browse Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 bg-zinc-900/30 hover:bg-indigo-950/10 transition-all text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus"
            onChange={handleFilesSelected}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 text-zinc-400 flex items-center justify-center mb-3 transition-colors">
            <FileAudio className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
            {isProcessing ? 'Processing audio metadata & waveforms...' : 'Click to browse or drag audio files'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Supports MP3, WAV, FLAC, M4A, AAC, and OGG
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
            {['MP3', 'WAV', 'FLAC', 'M4A', 'AAC', 'OGG'].map((fmt) => (
              <span key={fmt} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-white/5">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Local Storage Privacy Note */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-xs text-zinc-400">
          <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-zinc-300 font-medium">Local-first privacy:</strong> Files are never uploaded to any remote server.
          </span>
        </div>

        {/* Demo Pack Option */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="text-xs text-zinc-400">
            Don&apos;t have audio files ready?
          </div>
          <button
            onClick={handleLoadDemo}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Load Studio Demo Pack
          </button>
        </div>

      </div>
    </div>
  );
};
