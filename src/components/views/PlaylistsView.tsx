import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Playlist, Track } from '../../types';
import { 
  ListMusic, 
  Plus, 
  Play, 
  Trash2, 
  Disc, 
  Edit3, 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  MoreHorizontal,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { PlaylistModal } from '../playlists/PlaylistModal';
import { DeletePlaylistModal } from '../playlists/DeletePlaylistModal';

// Dynamic 4-Quadrant Artwork Collage Component
export const PlaylistCoverCollage: React.FC<{
  playlist: Playlist;
  allKnownTracks: Map<string, Track>;
  className?: string;
}> = ({ playlist, allKnownTracks, className = '' }) => {
  // Extract verified cover URLs from playlist's member tracks
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

  // If 4 or more distinct cover URLs exist, render a 2x2 grid collage
  if (validCovers.length >= 4) {
    return (
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e1017] border border-white/10 shadow-md grid grid-cols-2 grid-rows-2 ${className}`}>
        {validCovers.slice(0, 4).map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  // If 1 to 3 covers exist, render the primary cover art
  if (validCovers.length > 0) {
    return (
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden bg-[#0e1017] border border-white/10 shadow-md ${className}`}>
        <img src={validCovers[0]} alt={playlist.title} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Fallback: Obsidian Theme Gradient with Initial Character
  return (
    <div className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${playlist.coverGradient || 'from-indigo-600 to-purple-800'} shadow-md flex items-center justify-center text-white font-bold text-2xl overflow-hidden border border-white/10 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_70%)]" />
      <span className="relative z-10 opacity-90 select-none">
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

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'tracks' | 'updated' | 'created'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
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
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'tracks':
          return b.trackIds.length - a.trackIds.length;
        case 'updated':
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        case 'created':
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [playlists, searchQuery, sortBy]);

  // Play playlist action
  const handlePlayPlaylist = (playlist: Playlist) => {
    if (!playlist.trackIds.length) return;
    const resolvedTracks = playlist.trackIds
      .map((id) => allKnownTracks.get(id))
      .filter((t): t is Track => t !== undefined);

    if (resolvedTracks.length > 0) {
      playTrack(resolvedTracks[0], resolvedTracks);
    }
  };

  const handleOpenEdit = (playlist: Playlist, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlaylistToEdit(playlist);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (playlist: Playlist, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlaylistToDelete(playlist);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none animate-fadeIn">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Playlists & Spaces</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {playlists.length} {playlists.length === 1 ? 'curated space' : 'curated spaces'} in your collection
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spaces..."
              className="w-full bg-[#0b0d13]/80 border border-white/10 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 backdrop-blur-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#0b0d13]/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="updated" className="bg-zinc-900 text-white">Recently Updated</option>
              <option value="title" className="bg-zinc-900 text-white">Title (A–Z)</option>
              <option value="tracks" className="bg-zinc-900 text-white">Track Count</option>
              <option value="created" className="bg-zinc-900 text-white">Date Created</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0b0d13]/80 border border-white/10 rounded-xl p-0.5">
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
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Create Space CTA */}
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Space</span>
          </button>
        </div>
      </div>

      {/* Playlist Content */}
      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 rounded-3xl bg-[#0b0d13]/60 border border-dashed border-white/10">
          <ListMusic className="w-10 h-10 text-zinc-600 mb-3 stroke-1" />
          <h3 className="text-base font-semibold text-zinc-300">No playlists or spaces created yet</h3>
          <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-5">
            Group your songs into acoustic sets for focus, energy, evening unwind, or spatial audio tests.
          </p>
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Space
          </button>
        </div>
      ) : displayedPlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-[#0b0d13]/40 border border-white/[0.04] p-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Search className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No spaces match your search</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            No playlists found for "{searchQuery}". Clear your search query to view all spaces.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {displayedPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                setSelectedPlaylistId(pl.id);
                setCurrentView('playlist-detail');
              }}
              className="group relative cursor-pointer flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0b0d13]/70 hover:bg-[#121520]/80 border border-white/[0.06] hover:border-white/[0.14] backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Cover Collage Thumbnail */}
              <div className="relative">
                <PlaylistCoverCollage playlist={pl} allKnownTracks={allKnownTracks} />

                {/* Quick Play Hover Button */}
                {pl.trackIds.length > 0 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(pl);
                    }}
                    className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                    title={`Play ${pl.title}`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex items-start justify-between gap-1 px-0.5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
                    {pl.title}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                    {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>

                {/* Actions Menu */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEdit(pl, e)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit space"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(pl, e)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors"
                    title="Delete space"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/[0.06] overflow-hidden backdrop-blur-xl">
          {displayedPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                setSelectedPlaylistId(pl.id);
                setCurrentView('playlist-detail');
              }}
              className="group flex items-center justify-between p-3 px-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Thumbnail Collage */}
                <div className="w-11 h-11 shrink-0">
                  <PlaylistCoverCollage playlist={pl} allKnownTracks={allKnownTracks} />
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                    {pl.title}
                  </h4>
                  {pl.description && (
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-md">
                      {pl.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta & Actions */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 shrink-0">
                <span>{pl.trackIds.length} tracks</span>

                {pl.trackIds.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(pl);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    title={`Play ${pl.title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                <button
                  onClick={(e) => handleOpenEdit(pl, e)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="Edit space"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleOpenDelete(pl, e)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Delete space"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Playlist Modal */}
      <PlaylistModal
        playlistToEdit={playlistToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setPlaylistToEdit(null);
        }}
      />

      {/* Custom Non-Destructive Safe Delete Confirmation Modal */}
      <DeletePlaylistModal
        playlist={playlistToDelete}
        isOpen={!!playlistToDelete}
        onClose={() => setPlaylistToDelete(null)}
        onConfirmDelete={(id) => {
          deletePlaylist(id);
        }}
      />

    </div>
  );
};
