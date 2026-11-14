import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
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
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
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
  const { canHover } = useMotionCapabilities();

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

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {!playlist ? (
          <MotionFadeSlide
            key="playlist-missing"
            direction="up"
            distance={8}
            duration="standard"
            className="flex flex-col items-center justify-center py-20 text-center select-none"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Music className="w-7 h-7 text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Playlist Not Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
              This playlist may have been deleted or the link is invalid.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('playlists')}
              className="px-4 py-2 bg-white text-zinc-950 rounded-xl text-xs font-semibold shadow-md cursor-pointer aura-pressable aura-focus-ring"
            >
              Return to Playlists
            </button>
          </MotionFadeSlide>
        ) : (
          <MotionFadeSlide
            key={`playlist-detail:${playlist.id}`}
            direction="up"
            distance={8}
            duration="standard"
            className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44"
          >
            {/* Back Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView('playlists')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
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
                  onClick={() => {
                    if (playlistTracks.length === 0) return;
                    playTrack(playlistTracks[0], playlistTracks);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable"
                >
                  <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                  <span>Play All</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (playlistTracks.length === 0) return;
                    const queue = [...playlistTracks].sort(() => Math.random() - 0.5);
                    playTrack(queue[0], queue);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable"
                >
                  <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Shuffle</span>
                </button>

                <button
                  type="button"
                  onClick={() => playlistTracks.forEach((t) => addToQueue(t))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable"
                >
                  <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add to Queue</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer aura-pressable aura-focus-ring"
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
                {/* Reorder Buttons (Visible on hover/focus or on touch devices) */}
                <div className={`hidden sm:flex flex-col items-center justify-center gap-0.5 pl-2 pr-1 transition-opacity ${
                  !canHover ? 'opacity-90' : 'opacity-0 group-hover/item:opacity-100 focus-within:opacity-100'
                }`}>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTrackIds = [...playlist.trackIds];
                      const targetIndex = i - 1;
                      if (targetIndex < 0) return;
                      const [moved] = newTrackIds.splice(i, 1);
                      newTrackIds.splice(targetIndex, 0, moved);
                      updatePlaylist({ ...playlist, trackIds: newTrackIds });
                    }}
                    className={`p-0.5 rounded text-zinc-400 hover:text-white transition-colors aura-focus-ring ${i === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer aura-pressable'}`}
                    title="Move up"
                    aria-label={`Move ${track.title} up`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={i === playlistTracks.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTrackIds = [...playlist.trackIds];
                      const targetIndex = i + 1;
                      if (targetIndex >= newTrackIds.length) return;
                      const [moved] = newTrackIds.splice(i, 1);
                      newTrackIds.splice(targetIndex, 0, moved);
                      updatePlaylist({ ...playlist, trackIds: newTrackIds });
                    }}
                    className={`p-0.5 rounded text-zinc-400 hover:text-white transition-colors aura-focus-ring ${i === playlistTracks.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer aura-pressable'}`}
                    title="Move down"
                    aria-label={`Move ${track.title} down`}
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
                    onRemove={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)}
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
            className="flex items-center gap-2 px-4 py-2 mt-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md cursor-pointer aura-focus-ring aura-pressable"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-950" />
            <span>Browse All Tracks</span>
          </button>
        </div>
      )}
          </MotionFadeSlide>
        )}
      </AnimatePresence>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={Boolean(playlistModalTrack)}
        onClose={() => setPlaylistModalTrack(null)}
      />

      {/* Edit Playlist Modal */}
      <PlaylistModal
        playlistToEdit={playlist ?? null}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeletePlaylistModal
        playlist={playlist ?? null}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={(id) => {
          deletePlaylist(id);
          setIsDeleteModalOpen(false);
          setCurrentView('playlists');
        }}
      />

    </>
  );
};
