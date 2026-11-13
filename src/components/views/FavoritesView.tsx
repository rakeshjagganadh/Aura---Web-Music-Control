import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { TrackRow } from '../library/TrackRow';
import { TrackGridCard } from '../library/TrackGridCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { 
  Heart, 
  Play, 
  Shuffle, 
  ListPlus, 
  LayoutGrid, 
  List, 
  Search, 
  X, 
  Compass, 
  Sparkles 
} from 'lucide-react';

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0 min';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
}

export const FavoritesView: React.FC = () => {
  const { 
    tracks, 
    favoriteIds, 
    favoriteItems, 
    playTrack, 
    addToQueue,
    isShuffle,
    toggleShuffle,
    setCurrentView 
  } = useMusic();

  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Mixed-source favorites support from real IndexedDB state
  const favoriteTracks = useMemo(() => {
    if (favoriteItems && favoriteItems.length > 0) {
      return favoriteItems.map((f) => f.track).filter(Boolean);
    }
    return tracks.filter((t) => favoriteIds.has(t.id));
  }, [favoriteItems, tracks, favoriteIds]);

  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favoriteTracks;
    const q = searchQuery.toLowerCase().trim();
    return favoriteTracks.filter((t) => 
      t.title.toLowerCase().includes(q) || 
      (t.artist || '').toLowerCase().includes(q) || 
      (t.album || '').toLowerCase().includes(q)
    );
  }, [favoriteTracks, searchQuery]);

  const totalDuration = useMemo(() => {
    return favoriteTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [favoriteTracks]);

  // Extract up to 4 distinct artworks for collage header
  const collageArtworks = useMemo(() => {
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const t of favoriteTracks) {
      if (t.coverUrl && !seen.has(t.coverUrl)) {
        urls.push(t.coverUrl);
        seen.add(t.coverUrl);
        if (urls.length >= 4) break;
      }
    }
    return urls;
  }, [favoriteTracks]);

  const handlePlayAll = (shuffle = false) => {
    if (favoriteTracks.length === 0) return;
    const queue = shuffle ? [...favoriteTracks].sort(() => Math.random() - 0.5) : favoriteTracks;
    playTrack(queue[0], queue);
  };

  const handleAddAllToQueue = () => {
    favoriteTracks.forEach((t) => addToQueue(t));
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44">
      
      {/* -------------------------------------------------------------
          1. LARGE ARTWORK HERO BANNER
          ------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-3xl aura-glass-island p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
        {/* Dynamic Collage or Heart Icon Artwork */}
        <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-rose-950 via-zinc-900 to-black border border-rose-500/30 shadow-2xl flex items-center justify-center">
          {collageArtworks.length >= 4 ? (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2">
              {collageArtworks.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt="" className="w-full h-full object-cover" />
              ))}
            </div>
          ) : collageArtworks.length > 0 ? (
            <img src={collageArtworks[0]} alt="Liked Songs" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-rose-400">
              <Heart className="w-16 h-16 fill-current" />
            </div>
          )}

          {/* Micro Heart Badge Overlay */}
          <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg">
            <Heart className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Details & Controls */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 inline-block mb-2">
            COLLECTION PLAYLIST
          </span>

          <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight">
            Liked Songs
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-xs sm:text-sm text-zinc-300 font-ui-meta">
            <span>{favoriteTracks.length} {favoriteTracks.length === 1 ? 'liked track' : 'liked tracks'}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="font-mono text-zinc-400">{formatDuration(totalDuration)}</span>
          </div>

          {/* Action Buttons */}
          {favoriteTracks.length > 0 && (
            <div className="flex items-center justify-center md:justify-start gap-2.5 mt-5 flex-wrap">
              <button
                type="button"
                onClick={() => handlePlayAll(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
              >
                <Play className="w-4 h-4 fill-current text-black translate-x-0.2" />
                <span>Play All</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAll(true)}
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
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. LIBRARY NAVIGATION
          ------------------------------------------------------------- */}
      <LibraryNav activeView="favorites" />

      {/* -------------------------------------------------------------
          3. FILTER & VIEW MODE CONTROLS
          ------------------------------------------------------------- */}
      {favoriteTracks.length > 0 && (
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in liked songs..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-all font-ui-title"
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

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/10 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'row' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          4. TRACK LISTING (LIST OR GRID)
          ------------------------------------------------------------- */}
      {favoriteTracks.length === 0 ? (
        <div className="p-12 sm:p-20 rounded-3xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-1">
            <Heart className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-white font-ui-title">No liked songs yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm font-ui-meta leading-relaxed">
            Click the heart icon on any track row, mini-player, or expanded studio player to save your favorite songs here for quick listening.
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md cursor-pointer aura-focus-ring"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-950" />
              <span>Explore Music</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('songs')}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 cursor-pointer aura-focus-ring"
            >
              Browse Library
            </button>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="p-10 rounded-2xl aura-glass-ambient border border-white/10 text-center text-xs text-zinc-400">
          No liked songs match &quot;{searchQuery}&quot;.
        </div>
      ) : viewMode === 'row' ? (
        <div className="flex flex-col rounded-2xl aura-glass-ambient border border-white/10 overflow-hidden divide-y divide-white/[0.03] p-1.5">
          {filteredFavorites.map((track, i) => (
            <TrackRow
              key={`fav-${track.id}`}
              track={track}
              index={i + 1}
              playlistContext={filteredFavorites}
              onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filteredFavorites.map((track) => (
            <TrackGridCard
              key={`fav-grid-${track.id}`}
              track={track}
              playlistContext={filteredFavorites}
              onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
            />
          ))}
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

    </div>
  );
};
