import React, { useEffect, useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { UploadCloud, Music } from 'lucide-react';

export const DropzoneOverlay: React.FC = () => {
  const { uploadFiles } = useMusic();
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragOver(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      dragCounter = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        await uploadFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [uploadFiles]);

  if (!isDragOver) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#07080b]/90 backdrop-blur-md flex items-center justify-center p-6 pointer-events-none animate-in fade-in duration-150">
      <div className="flex flex-col items-center justify-center max-w-md w-full p-10 rounded-3xl border-2 border-dashed border-indigo-500/70 bg-indigo-950/20 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 mb-4 animate-bounce">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Drop your music here
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Automatic metadata, waveform extraction, and local-first persistence.
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-[11px] font-mono text-indigo-300/80 bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-500/30">
          <Music className="w-3 h-3" /> MP3 • WAV • FLAC • M4A • AAC • OGG
        </div>
      </div>
    </div>
  );
};
