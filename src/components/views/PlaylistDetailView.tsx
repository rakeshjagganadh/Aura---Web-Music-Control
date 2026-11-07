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
  X, 
  LayoutGrid, 
  List, 
  Sparkles, 
  Clock, 
  Calendar,
  Plus
} from 'lucide-react';
import { SongObjectCard } from '../common/SongObjectCard';
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
    isShuffle,
    toggleShuffle,
  } = useMusic();

  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');
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
        return {
          ...found,
          availabilityStatus: 'available' as const,
        };
      }
      
      const isLocal = id.startsWith('local-') || !id.includes('-');
      const sourcePrefix = id.split('-')[0];
      const sourceName = 
        sourcePrefix === 'jamendo' ? 'Jamendo Stream' :
        sourcePrefix === 'audius' ? 'Audius Decentralized Track' :
        sourcePrefix === 'yt' ? 'YouTube Stream' :
        sourcePrefix === 'radio' ? 'Internet Radio Station' : 'Local Music File';

      const fallbackTrack: Track = {
        id,
        title: `Track (${id.slice(0, 16)})`,
        artist: sourceName,
        album: playlist.title,
        duration: 0,
        fileFormat: isLocal ? 'LOCAL FILE' : 'STREAM',
        fileSize: 0,
        dateAdded: Date.now(),
        isAvailable: false,
        availabilityStatus: isLocal ? ('missing_local_file' as const) : ('network_error' as const),
      };
      return fallbackTrack;
    });
  }, [playlist, allKnownTracks]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <Music className="w-7 h-7 text-zinc-500" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">Space Not Found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
          This playlist may have been deleted or the link is invalid.
        </p>
        <button
          onClick={() => setCurrentView('playlists')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          Return to Spaces
        </button>
      </div>
    );
  }

  const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  // Playback Handlers
  const handlePlayPlaylist = () => {
    if (!playlistTracks.length) return;
    playTrack(playlistTracks[0], playlistTracks);
  };

  const handleShufflePlaylist = () => {
    if (!playlistTracks.length) return;

    // Fisher-Yates shuffle
    const shuffled = [...playlistTracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Ensure player shuffle indicator matches
    if (!isShuffle) {
      toggleShuffle();
    }

    playTrack(shuffled[0], shuffled);
  };

  const handleAddToQueue = () => {
    playlistTracks.forEach((track) => {
      addToQueue(track);
    });
  };

  // Track Reordering Handler
  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlist.trackIds.length) return;

    const newTrackIds = [...playlist.trackIds];
    const [movedId] = newTrackIds.splice(index, 1);
    newTrackIds.splice(targetIndex, 0, movedId);

    updatePlaylist({
      ...playlist,
      trackIds: newTrackIds,
      updatedAt: Date.now(),
    });
  };

  // Track Removal Handler (removes from playlist only, never from library)
  const handleRemoveTrack = (trackId: string) => {
    removeTrackFromPlaylist(playlist.id, trackId);
  };

  const updatedDateText = formatDate(playlist.updatedAt || playlist.createdAt);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none animate-fadeIn">
      
      {/* Navigation Breadcrumb */}
      <button
        onClick={() => setCurrentView('playlists')}
        className="group inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors w-fit px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Playlists & Spaces</span>
      </button>

      {/* Playlist Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b0d13]/80 border border-white/[0.08] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Dynamic Artwork Collage */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 shrink-0">
            <PlaylistCoverCollage playlist={playlist} allKnownTracks={allKnownTracks} />
          </div>

          {/* Details & Action Toolbar */}
          <div className="flex flex-col gap-2 text-center sm:text-left min-w-0 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Curated Space
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
              {playlist.title}
            </h1>

            {playlist.description && (
              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                {playlist.description}
              </p>
            )}

            {/* Verified Summary Metadata */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 mt-1">
              <span>{playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'}</span>
              <span>•</span>
              <span className="font-mono">{formatDuration(totalDuration)} total runtime</span>
              {updatedDateText && (
                <>
                  <span>•</span>
                  <span className="text-zinc-500 font-mono text-[11px]">Updated {updatedDateText}</span>
                </>
              )}
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              {playlistTracks.length > 0 && (
                <>
                  <button
                    onClick={handlePlayPlaylist}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-lg shadow-white/10 transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Space</span>
                  </button>

                  <button
                    onClick={handleShufflePlaylist}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-md"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={handleAddToQueue}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                    title="Add all tracks to playback queue"
                  >
                    <ListPlus className="w-4 h-4" />
                    <span>Add to Queue</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                title="Edit space details and theme gradient"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Space</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                title="Delete Space"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Track List Header with View Mode & Add Tracks CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
            Tracks ({playlistTracks.length})
          </h2>
          <button
            onClick={() => setCurrentView('songs')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-indigo-300 hover:text-indigo-200 border border-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Tracks from Library</span>
          </button>
        </div>

        {playlistTracks.length > 0 && (
          <div className="flex items-center bg-[#0b0d13]/80 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'row' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Track Listing Content */}
      {playlistTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-14 rounded-3xl bg-[#0b0d13]/50 border border-dashed border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Music className="w-6 h-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">This Space is Empty</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-5 leading-relaxed">
            Add tracks from your song library, albums, or artists using the "Add to Space" option or the button below.
          </p>
          <button
            onClick={() => setCurrentView('songs')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Browse Songs
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {playlistTracks.map((track) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={playlistTracks}
              variant="grid"
              onOpenPlaylistModal={setPlaylistModalTrack}
            />
          ))}
        </div>
      ) : (
        /* Row View with Track Reordering Controls and Direct Removal */
        <div className="flex flex-col divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/[0.06] overflow-hidden p-2 backdrop-blur-xl shadow-lg">
          {playlistTracks.map((track, i) => (
            <div 
              key={`${track.id}-${i}`} 
              className="group flex items-center gap-1 sm:gap-2 p-1 rounded-xl hover:bg-white/[0.03] transition-colors"
            >
              {/* Order Controls (Move Up / Down) */}
              <div className="flex flex-col items-center justify-center gap-0.5 px-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTrack(i, 'up');
                  }}
                  disabled={i === 0}
                  className="p-0.5 rounded text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Move track up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTrack(i, 'down');
                  }}
                  disabled={i === playlistTracks.length - 1}
                  className="p-0.5 rounded text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Move track down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Track Row Object Card */}
              <div className="flex-1 min-w-0">
                <SongObjectCard
                  track={track}
                  playlistContext={playlistTracks}
                  variant="row"
                  showIndex={i + 1}
                  onOpenPlaylistModal={setPlaylistModalTrack}
                />
              </div>

              {/* Quick Remove from Space Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTrack(track.id);
                }}
                className="p-2 mr-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                title="Remove from space"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add To Another Playlist Modal */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          isOpen={!!playlistModalTrack}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

      {/* Edit Space Modal */}
      <PlaylistModal
        playlistToEdit={playlist}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Delete Space Modal */}
      <DeletePlaylistModal
        playlist={playlist}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={(id) => {
          deletePlaylist(id);
          setCurrentView('playlists');
        }}
      />

    </div>
  );
};
