import React, { useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { 
  Music, 
  Disc, 
  User, 
  Heart, 
  ListMusic, 
  Clock, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  HardDrive,
  Sparkles,
  FolderOpen
} from 'lucide-react';

export const LibraryOverviewView: React.FC = () => {
  const {
    tracks,
    playlists,
    favoriteItems,
    recentlyPlayed,
    history,
    setCurrentView,
    setIsUploadModalOpen,
    loadDemoPack,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = React.useState<Track | null>(null);

  // Rail scroll refs
  const recentlyAddedRef = useRef<HTMLDivElement>(null);
  const recentlyPlayedRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);

  const scrollRail = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Derive genuine metrics & lists from existing context data
  const recentlyAddedTracks = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 12);
  
  const recentHistoryTracks = (recentlyPlayed && recentlyPlayed.length > 0
    ? recentlyPlayed.map((rp) => rp.track)
    : history
  ).filter(Boolean).slice(0, 12);

  const favoritedTracks = favoriteItems.slice(0, 12).map((f) => f.track).filter(Boolean);

  const albumCount = React.useMemo(() => {
    return new Set(tracks.map((t) => t.album).filter(Boolean)).size;
  }, [tracks]);

  const artistCount = React.useMemo(() => {
    return new Set(tracks.map((t) => t.artist).filter(Boolean)).size;
  }, [tracks]);

  return (
    <div className="flex flex-col gap-8 sm:gap-10 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. LIBRARY HEADER & HERO SUMMARY
          ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[#0b0d13]/70 border border-white/[0.08] backdrop-blur-2xl shadow-xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Personal Music Vault</span>
            <span className="text-zinc-600 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-zinc-400">{tracks.length} Total Tracks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            Your Audio Library
          </h1>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Manage your local high-fidelity audio vault, personal playlists, saved favorites, and persistent listening history in one unified dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Audio Files</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. COMPACT CATEGORY SHORTCUT CARDS
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Songs Shortcut */}
        <div
          onClick={() => setCurrentView('songs')}
          className="group cursor-pointer p-4 rounded-2xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Music className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
              Songs
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>

        {/* Albums Shortcut */}
        <div
          onClick={() => setCurrentView('albums')}
          className="group cursor-pointer p-4 rounded-2xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Disc className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              Albums
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {albumCount} {albumCount === 1 ? 'album' : 'albums'}
            </p>
          </div>
        </div>

        {/* Artists Shortcut */}
        <div
          onClick={() => setCurrentView('artists')}
          className="group cursor-pointer p-4 rounded-2xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <User className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              Artists
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {artistCount} {artistCount === 1 ? 'artist' : 'artists'}
            </p>
          </div>
        </div>

        {/* Playlists & Spaces Shortcut */}
        <div
          onClick={() => setCurrentView('playlists')}
          className="group cursor-pointer p-4 rounded-2xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] hover:border-emerald-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ListMusic className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              Spaces & Playlists
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {playlists.length} {playlists.length === 1 ? 'space' : 'spaces'}
            </p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. RECENTLY ADDED TRACKS (Fixed 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Recently Added to Library
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {recentlyAddedTracks.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(recentlyAddedRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(recentlyAddedRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCurrentView('songs')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
            >
              All Songs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentlyAddedTracks.length > 0 ? (
          <div
            ref={recentlyAddedRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {recentlyAddedTracks.map((track) => (
              <div key={`rec-add-${track.id}`} className="w-36 sm:w-[185px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={recentlyAddedTracks}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#0b0d13]/60 border border-white/5 flex flex-col items-center justify-center text-center gap-2">
            <Music className="w-8 h-8 text-zinc-600 mb-1" />
            <p className="text-xs font-semibold text-zinc-300">No tracks added to library yet</p>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Upload local audio files or explore demo audio tracks to populate your personal library vault.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold shadow-sm cursor-pointer"
              >
                Upload Music
              </button>
              <button
                type="button"
                onClick={loadDemoPack}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 cursor-pointer"
              >
                Demo Pack
              </button>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          4. RECENTLY PLAYED HISTORY (Fixed 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      {recentHistoryTracks.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Recently Played
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(recentlyPlayedRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(recentlyPlayedRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">Session History</span>
            </div>
          </div>

          <div
            ref={recentlyPlayedRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {recentHistoryTracks.map((track) => (
              <div key={`rec-play-${track.id}`} className="w-36 sm:w-[185px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={recentHistoryTracks}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          5. YOUR FAVORITES VAULT (Fixed 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      {favoritedTracks.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 fill-current" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Favorite Tracks ({favoritedTracks.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(favoritesRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(favoritesRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('favorites')}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
              >
                View Favorites <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={favoritesRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {favoritedTracks.map((track) => (
              <div key={`fav-lib-${track.id}`} className="w-36 sm:w-[185px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={favoritedTracks}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        </section>
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
