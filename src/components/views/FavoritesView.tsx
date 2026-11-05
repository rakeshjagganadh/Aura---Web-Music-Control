import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Heart, Play, LayoutGrid, List, Sparkles } from 'lucide-react';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { Track } from '../../types';

export const FavoritesView: React.FC = () => {
  const { tracks, favoriteIds, favoriteItems, playTrack } = useMusic();
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Mixed-source favorites support
  const favoriteTracks = favoriteItems && favoriteItems.length > 0
    ? favoriteItems.map((f) => f.track)
    : tracks.filter((t) => favoriteIds.has(t.id));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Favorites</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {favoriteTracks.length} {favoriteTracks.length === 1 ? 'loved track' : 'loved tracks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid of Music Objects"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'row' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Compact Atmospheric List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {favoriteTracks.length > 0 && (
            <button
              onClick={() => playTrack(favoriteTracks[0], favoriteTracks)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play All
            </button>
          )}
        </div>
      </div>

      {favoriteTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 rounded-3xl bg-[#0b0d13]/60 border border-dashed border-white/10">
          <Heart className="w-10 h-10 text-zinc-600 mb-3 stroke-1" />
          <h3 className="text-base font-semibold text-zinc-300">Your favorite space is empty</h3>
          <p className="text-xs text-zinc-500 max-w-xs mt-1">
            Heart any track while listening or browsing to collect your personal sonic moments here.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 sm:gap-6">
          {favoriteTracks.map((track) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={favoriteTracks}
              variant="grid"
              onOpenPlaylistModal={setPlaylistModalTrack}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#0b0d13]/60 border border-white/5 overflow-hidden p-2">
          {favoriteTracks.map((track, i) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={favoriteTracks}
              variant="row"
              showIndex={i + 1}
              onOpenPlaylistModal={setPlaylistModalTrack}
            />
          ))}
        </div>
      )}

      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
      />

    </div>
  );
};
