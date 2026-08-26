import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { X, Plus, Check, ListMusic } from 'lucide-react';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist, setIsPlaylistModalOpen } = useMusic();

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl p-5 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Add to Playlist</h4>
            <p className="text-xs text-zinc-400 truncate max-w-[240px]">{track.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist List */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500">
              No playlists yet. Create one below!
            </div>
          ) : (
            playlists.map((pl) => {
              const inPlaylist = pl.trackIds.includes(track.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => {
                    if (inPlaylist) {
                      removeTrackFromPlaylist(pl.id, track.id);
                    } else {
                      addTrackToPlaylist(pl.id, track.id);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                    inPlaylist
                      ? 'bg-indigo-950/30 text-indigo-200 border border-indigo-500/30'
                      : 'hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}>
                      {pl.title.charAt(0)}
                    </div>
                    <span className="truncate">{pl.title}</span>
                  </div>

                  {inPlaylist ? (
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-zinc-500 hover:text-zinc-300 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create New Playlist CTA */}
        <button
          onClick={() => {
            onClose();
            setIsPlaylistModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-indigo-300 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Playlist
        </button>

      </div>
    </div>
  );
};
