import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { X, Plus, Check } from 'lucide-react';

interface AddToPlaylistModalProps {
  track?: Track | null;
  tracks?: Track[];
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  tracks,
  isOpen,
  onClose,
}) => {
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist, setIsPlaylistModalOpen } = useMusic();

  const targetTracks = React.useMemo(() => {
    if (tracks && tracks.length > 0) return tracks;
    if (track) return [track];
    return [];
  }, [track, tracks]);

  if (!isOpen || targetTracks.length === 0) return null;

  const isBulk = targetTracks.length > 1;

  const handlePlaylistClick = (playlistId: string, inPlaylist: boolean) => {
    if (inPlaylist) {
      targetTracks.forEach((t) => removeTrackFromPlaylist(playlistId, t.id));
    } else {
      targetTracks.forEach((t) => addTrackToPlaylist(playlistId, t.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0e1017] border border-white/10 shadow-2xl p-5 flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {isBulk ? `Add ${targetTracks.length} Tracks to Space` : 'Add to Space'}
            </h4>
            <p className="text-xs text-zinc-400 truncate max-w-[240px]">
              {isBulk ? `${targetTracks.length} selected tracks` : targetTracks[0]?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist List */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500">
              No spaces created yet. Create one below!
            </div>
          ) : (
            playlists.map((pl) => {
              const allInPlaylist = targetTracks.every((t) => pl.trackIds.includes(t.id));
              const someInPlaylist = targetTracks.some((t) => pl.trackIds.includes(t.id));

              return (
                <button
                  key={pl.id}
                  onClick={() => handlePlaylistClick(pl.id, allInPlaylist)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    allInPlaylist
                      ? 'bg-indigo-950/40 text-indigo-200 border border-indigo-500/40'
                      : someInPlaylist
                      ? 'bg-indigo-950/20 text-indigo-300 border border-indigo-500/20'
                      : 'hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}>
                      {pl.title.charAt(0)}
                    </div>
                    <span className="truncate">{pl.title}</span>
                  </div>

                  {allInPlaylist ? (
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
          className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-indigo-300 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Space</span>
        </button>

      </div>
    </div>
  );
};
