import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  ArrowLeft, 
  Play, 
  Shuffle, 
  ListPlus, 
  Trash2, 
  Edit3, 
  Music, 
  ChevronUp, 
  ChevronDown, 
  Plus,
  Clock,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { TrackRow } from '../library/TrackRow';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { PlaylistModal } from '../playlists/PlaylistModal';
import { DeletePlaylistModal } from '../playlists/DeletePlaylistModal';
import { PlaylistCoverCollage } from './PlaylistsView';
import { Track } from '../../types';

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds > 0 ? `${seconds} sec` : ''}`.trim();
  }
  return `${seconds} sec`;
}

function formatDate(timestamp?: number): string | null {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const PlaylistDetailView: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    setCurrentView,
    tracks,
    favoriteItems,
    recentlyPlayed,
    history,
    playTrack,
    updatePlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    addToQueue,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const playlist = playlists.find((p) => p.id === selectedPlaylistId);

  // Pool all known tracks to resolve multi-source playlist items
  const allKnownTracks = useMemo(() => {
    const map = new Map<string, Track>();
    tracks.forEach((t) => map.set(t.id, t));
    (favoriteItems || []).forEach((f) => {
      if (f.track && !map.has(f.track.id)) map.set(f.track.id, f.track);
    });
    (recentlyPlayed || []).forEach((r) => {
      if (r.track && !map.has(r.track.id)) map.set(r.track.id, r.track);
    });
    (history || []).forEach((h) => {
      if (h && !map.has(h.id)) map.set(h.id, h);
    });
    return map;
  }, [tracks, favoriteItems, recentlyPlayed, history]);

  // Resolve tracks in order with differentiated availability statuses
  const playlistTracks = useMemo(() => {
    if (!playlist) return [];
    return playlist.trackIds.map((id) => {
      const found = allKnownTracks.get(id);
      if (found) {
        return found;
      }
      
      const isLocal = id.startsWith('local-') || !id.includes('-');
      const sourcePrefix = id.split('-')[0];
      const sourceName = 
        sourcePrefix === 'jamendo' ? 'Jamendo Stream' :
        sourcePrefix === 'audius' ? 'Audius Track' :
        sourcePrefix === 'yt' ? 'YouTube Stream' :
        sourcePrefix === 'radio' ? 'Internet Radio' : 'Local File';

      const fallbackTrack: Track = {
        id,
        title: `Track (${id.slice(0, 14)})`,
        artist: sourceName,
        album: playlist.title,
        duration: 0,
        fileFormat: isLocal ? 'LOCAL FILE' : 'STREAM',
        fileSize: 0,
        dateAdded: Date.now(),
        isAvailable: false,
      };
      return fallbackTrack;
    });
  }, [playlist, allKnownTracks]);

  const totalDurationSeconds = useMemo(() => {
    return playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [playlistTracks]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <Music className="w-7 h-7 text-zinc-500" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">Playlist Not Found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
          This playlist may have been deleted or the link is invalid.
        </p>
        <button
          onClick={() => setCurrentView('playlists')}
          className="px-4 py-2 bg-white text-zinc-950 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
        >
          Return to Playlists
        </button>
      </div>
    );
  }

  const handlePlayPlaylist = (shuffle = false) => {
    if (playlistTracks.length === 0) return;
    const queue = shuffle ? [...playlistTracks].sort(() => Math.random() - 0.5) : playlistTracks;
    playTrack(queue[0], queue);
  };

  const handleAddAllToQueue = () => {
    playlistTracks.forEach((t) => addToQueue(t));
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    const newTrackIds = [...playlist.trackIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTrackIds.length) return;

    const [moved] = newTrackIds.splice(index, 1);
    newTrackIds.splice(targetIndex, 0, moved);

    updatePlaylist(playlist.id, { trackIds: newTrackIds });
  };

  const handleRemoveTrack = (trackId: string) => {
    removeTrackFromPlaylist(playlist.id, trackId);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44 animate-fadeIn">
      
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentView('playlists')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Playlists</span>
        </button>
      </div>

      {/* Playlist Hero Header */}
      <section className="relative overflow-hidden rounded-3xl aura-glass-island p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
        {/* Dynamic Collage */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shrink-0 bg-zinc-900 border border-white/15 shadow-2xl">
          <PlaylistCoverCollage
            playlist={playlist}
            allKnownTracks={allKnownTracks}
          />
        </div>

        {/* Details & Controls */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 inline-block mb-2">
            PLAYLIST
          </span>

          <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight line-clamp-2">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-zinc-300 mt-2 font-ui-meta line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-xs text-zinc-400 font-ui-meta">
            <span>{playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="font-mono">{formatDuration(totalDurationSeconds)}</span>
            {playlist.createdAt && (
              <>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span>Created {formatDate(playlist.createdAt)}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center md:justify-start gap-2.5 mt-5 flex-wrap">
            {playlistTracks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handlePlayPlaylist(false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
                >
                  <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                  <span>Play All</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlayPlaylist(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring"
                >
                  <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddAllToQueue}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring"
                >
                  <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add to Queue</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </section>

      {/* Playlist Track Listing with Reordering */}
      {playlistTracks.length > 0 ? (
        <section className="flex flex-col rounded-2xl aura-glass-ambient border border-white/10 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-ui-title">Playlist Tracks ({playlistTracks.length})</h3>
            <span className="text-xs font-mono text-zinc-400">{formatDuration(totalDurationSeconds)}</span>
          </div>

          <div className="divide-y divide-white/[0.03] p-1.5">
            {playlistTracks.map((track, i) => (
              <div key={`pl-item-${track.id}-${i}`} className="group/item relative flex items-center">
                {/* Reorder Buttons (Visible on hover) */}
                <div className="hidden sm:flex flex-col items-center justify-center gap-0.5 pl-2 pr-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveTrack(i, 'up');
                    }}
                    className={`p-0.5 rounded text-zinc-400 hover:text-white transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Move up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={i === playlistTracks.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveTrack(i, 'down');
                    }}
                    className={`p-0.5 rounded text-zinc-400 hover:text-white transition-colors ${i === playlistTracks.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Move down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <TrackRow
                    track={track}
                    index={i + 1}
                    playlistContext={playlistTracks}
                    onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                    onRemove={handleRemoveTrack}
                    removeLabel="Remove from Playlist"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="p-12 sm:p-20 rounded-3xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-1">
            <Music className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-white font-ui-title">This playlist is empty</h3>
          <p className="text-xs text-zinc-400 max-w-sm font-ui-meta leading-relaxed">
            Add tracks to &quot;{playlist.title}&quot; from your library, search results, or discovery feeds.
          </p>
          <button
            type="button"
            onClick={() => setCurrentView('songs')}
            className="flex items-center gap-2 px-4 py-2 mt-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-950" />
            <span>Browse All Tracks</span>
          </button>
        </div>
      )}

      {/* Add To Playlist Modal */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          isOpen={Boolean(playlistModalTrack)}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

      {/* Edit Playlist Modal */}
      {isEditModalOpen && (
        <PlaylistModal
          playlist={playlist}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeletePlaylistModal
          playlist={playlist}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deletePlaylist(playlist.id);
            setIsDeleteModalOpen(false);
            setCurrentView('playlists');
          }}
        />
      )}

    </div>
  );
};
