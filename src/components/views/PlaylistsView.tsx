import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Playlist, Track } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { PlaylistModal } from '../playlists/PlaylistModal';
import { DeletePlaylistModal } from '../playlists/DeletePlaylistModal';
import { 
  ListMusic, 
  Plus, 
  Play, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Clock, 
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react';

// Dynamic 4-Quadrant Artwork Collage Component
export const PlaylistCoverCollage: React.FC<{
  playlist: Playlist;
  allKnownTracks: Map<string, Track>;
  className?: string;
}> = ({ playlist, allKnownTracks, className = '' }) => {
  const validCovers = useMemo(() => {
    const urls: string[] = [];
    const seen = new Set<string>();

    for (const trackId of playlist.trackIds) {
      const track = allKnownTracks.get(trackId);
      if (track && track.coverUrl && !seen.has(track.coverUrl)) {
        urls.push(track.coverUrl);
        seen.add(track.coverUrl);
        if (urls.length >= 4) break;
      }
    }
    return urls;
  }, [playlist.trackIds, allKnownTracks]);

  if (validCovers.length >= 4) {
    return (
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-md grid grid-cols-2 grid-rows-2 ${className}`}>
        {validCovers.slice(0, 4).map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  if (validCovers.length > 0) {
    return (
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-md ${className}`}>
        <img src={validCovers[0]} alt={playlist.title} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${playlist.coverGradient || 'from-emerald-900 via-teal-950 to-black'} shadow-md flex items-center justify-center text-white font-bold text-2xl overflow-hidden border border-white/10 ${className}`}>
      <span className="relative z-10 opacity-80 select-none">
        {playlist.title ? playlist.title.charAt(0).toUpperCase() : 'P'}
      </span>
    </div>
  );
};

export const PlaylistsView: React.FC = () => {
  const {
    playlists,
    setSelectedPlaylistId,
    setCurrentView,
    setIsPlaylistModalOpen,
    deletePlaylist,
    tracks,
    favoriteItems,
    recentlyPlayed,
    history,
    playTrack,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'tracks' | 'updated' | 'created'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  // Pool all known tracks to resolve multi-source artwork
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

  // Filtered and sorted playlists
  const displayedPlaylists = useMemo(() => {
    let list = [...playlists];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.title.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let comp = 0;
      switch (sortBy) {
        case 'title':
          comp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          break;
        case 'tracks':
          comp = a.trackIds.length - b.trackIds.length;
          break;
        case 'updated':
          comp = (a.updatedAt || 0) - (b.updatedAt || 0);
          break;
        case 'created':
        default:
          comp = (a.createdAt || 0) - (b.createdAt || 0);
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [playlists, searchQuery, sortBy, sortOrder]);

  const handlePlayPlaylist = (playlist: Playlist) => {
    const pTracks: Track[] = [];
    playlist.trackIds.forEach((id) => {
      const t = allKnownTracks.get(id);
      if (t) pTracks.push(t);
    });
    if (pTracks.length > 0) {
      playTrack(pTracks[0], pTracks);
    }
  };

  const handleOpenPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentView('playlist-detail');
  };

  const handleEditClick = (e: React.MouseEvent, p: Playlist) => {
    e.stopPropagation();
    setPlaylistToEdit(p);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, p: Playlist) => {
    e.stopPropagation();
    setPlaylistToDelete(p);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44">
      
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-400">
            <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase tracking-wider text-[11px] font-semibold text-emerald-400">Playlists & Spaces</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>{playlists.length} custom collections</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight">
            Playlists
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-ui-meta">
            Curate custom track orders, mix audio from local vaults and streaming sources, and save sonic journeys.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Playlist</span>
          </button>
        </div>
      </section>

      {/* Library Navigation */}
      <LibraryNav activeView="playlists" />

      {/* Search & Sort Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlists by title or description..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-ui-title"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="relative flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-zinc-300 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="updated" className="bg-[#12141c] text-white">Recently Updated</option>
              <option value="created" className="bg-[#12141c] text-white">Date Created</option>
              <option value="title" className="bg-[#12141c] text-white">Playlist Title</option>
              <option value="tracks" className="bg-[#12141c] text-white">Track Count</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="hover:text-white px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 cursor-pointer"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </section>

      {/* Playlist Cards Grid */}
      {displayedPlaylists.length > 0 ? (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {displayedPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handleOpenPlaylist(playlist.id)}
              className="group relative flex flex-col p-3 rounded-2xl aura-glass-ambient hover:border-white/20 transition-all duration-300 cursor-pointer select-none shadow-md"
            >
              {/* Artwork Container */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-sm mb-3">
                <PlaylistCoverCollage
                  playlist={playlist}
                  allKnownTracks={allKnownTracks}
                />

                {/* Floating Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(playlist);
                    }}
                    className="w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={`Play ${playlist.title}`}
                  >
                    <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                  </button>
                </div>

                {/* Track count watermark */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-zinc-300 tabular-nums">
                  {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex items-start justify-between gap-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate font-ui-title leading-tight">
                    {playlist.title}
                  </h3>
                  {playlist.description && (
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta">
                      {playlist.description}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-zinc-500 mt-1">
                    {playlist.trackIds.length} tracks
                  </p>
                </div>

                {/* Quick Edit / Delete Menu */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleEditClick(e, playlist)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Edit playlist"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, playlist)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="p-10 sm:p-16 rounded-2xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500">
            <ListMusic className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No playlists found</h3>
          <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
            {searchQuery 
              ? `No playlists match "${searchQuery}".` 
              : 'Create custom playlists to group and sequence tracks from your library and streaming sources.'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow cursor-pointer aura-focus-ring"
            >
              Create Playlist
            </button>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {playlistToEdit && (
        <PlaylistModal
          playlist={playlistToEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setPlaylistToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {playlistToDelete && (
        <DeletePlaylistModal
          playlist={playlistToDelete}
          isOpen={Boolean(playlistToDelete)}
          onClose={() => setPlaylistToDelete(null)}
          onConfirm={() => {
            deletePlaylist(playlistToDelete.id);
            setPlaylistToDelete(null);
          }}
        />
      )}

    </div>
  );
};
