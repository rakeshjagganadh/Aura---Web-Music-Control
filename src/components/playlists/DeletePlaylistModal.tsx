import React from 'react';
import { AnimatePresence } from 'motion/react';
import { MotionBackdrop, MotionModal } from '../common/motion/MotionSurface';
import { Playlist } from '../../types';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeletePlaylistModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (playlistId: string) => void;
}

export const DeletePlaylistModal: React.FC<DeletePlaylistModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const trackCount = playlist?.trackIds?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && playlist && (
        <MotionBackdrop
          onClick={onClose}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
        >
          <MotionModal
            variant="center"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-[#0e1017] border border-white/10 shadow-2xl p-6 flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">Delete Space</h3>
                  <p className="text-xs text-zinc-400">Remove playlist collection</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer aura-pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Space Overview Card */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${playlist.coverGradient || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white font-bold text-lg shrink-0 border border-white/10 shadow-sm`}>
                {playlist.title.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-zinc-100 truncate">{playlist.title}</h4>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                </p>
              </div>
            </div>

            {/* Non-Destructive Explanation Warning */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Deleting <span className="font-semibold text-white">"{playlist.title}"</span> will remove this space from your collection.
                The <span className="font-semibold text-white">{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span> and underlying audio files in your library will <span className="font-semibold text-white">remain completely untouched</span>.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer aura-pressable"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirmDelete(playlist.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-lg shadow-rose-600/20 cursor-pointer aura-pressable"
              >
                Delete Space
              </button>
            </div>
          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
