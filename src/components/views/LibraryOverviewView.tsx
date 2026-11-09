import React, { useMemo } from 'react';
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
  HardDrive, 
  Sparkles,
  Shuffle,
  Play
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
    playTrack,
    toggleShuffle,
    isShuffle,
    storageUsage,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = React.useState<Track | null>(null);

  // Derived metrics from genuine library data
  const recentlyAddedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 8);
  }, [tracks]);
  
  const recentHistoryTracks = useMemo(() => {
    return (recentlyPlayed && recentlyPlayed.length > 0
      ? recentlyPlayed.map((rp) => rp.track)
      : history
    ).filter(Boolean).slice(0, 8);
  }, [recentlyPlayed, history]);

  const favoritedTracks = useMemo(() => {
    return favoriteItems.slice(0, 8).map((f) => f.track).filter(Boolean);
  }, [favoriteItems]);

  const albumCount = useMemo(() => {
    return new Set(tracks.map((t) => t.album).filter(Boolean)).size;
  }, [tracks]);

  const artistCount = useMemo(() => {
    return new Set(tracks.map((t) => t.artist).filter(Boolean)).size;
  }, [tracks]);

  const totalDurationSeconds = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [tracks]);

  const formatTotalTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0h';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatStorageMB = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    if (!isShuffle) toggleShuffle();
    const randomIndex = Math.floor(Math.random() * tracks.length);
    playTrack(tracks[randomIndex], tracks);
  };

  return (
    <div className="flex flex-col gap-10 sm:gap-14 p-4 sm:p-8 lg:p-10 max-w-[1600px] mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. LIBRARY HERO & AUDIO VAULT PANORAMA
          ------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-3xl aura-glass-island p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 relative">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono">
              <span className="text-[11px] tracking-widest uppercase text-sky-400/90 font-semibold">
                Offline Vault
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="text-zinc-400">
                IndexedDB Storage · {formatStorageMB(storageUsage.approxBytes)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight font-display">
              Music Vault
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl font-ui-meta leading-relaxed">
              Your personal lossless audio sanctuary. Manage imported audio files, curated albums, artists, saved favorites, and custom spaces in one high-performance hub.
            </p>

            <div className="flex items-center gap-4 sm:gap-6 mt-4 text-xs font-mono text-zinc-300">
              <div>
                <span className="text-white font-bold font-display text-base">{tracks.length}</span>
                <span className="text-zinc-500 ml-1">Tracks</span>
              </div>
              <div className="w-[1px] h-3.5 bg-white/10" />
              <div>
                <span className="text-white font-bold font-display text-base">{albumCount}</span>
                <span className="text-zinc-500 ml-1">Albums</span>
              </div>
              <div className="w-[1px] h-3.5 bg-white/10" />
              <div>
                <span className="text-white font-bold font-display text-base">{artistCount}</span>
                <span className="text-zinc-500 ml-1">Artists</span>
              </div>
              <div className="w-[1px] h-3.5 bg-white/10" />
              <div>
                <span className="text-white font-bold font-display text-base">{formatTotalTime(totalDurationSeconds)}</span>
                <span className="text-zinc-500 ml-1">Runtime</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {tracks.length > 0 && (
              <button
                type="button"
                onClick={handleShuffleAll}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer aura-focus-ring"
              >
                <Shuffle className="w-4 h-4 text-sky-400" />
                <span>Shuffle All</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 active:scale-95 text-zinc-950 text-xs font-bold shadow-md transition-all cursor-pointer aura-focus-ring"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Import Audio Files</span>
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. CATEGORY BENTO STRIP (Songs, Albums, Artists, Spaces, Favorites)
          ------------------------------------------------------------- */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Songs */}
        <div
          onClick={() => setCurrentView('songs')}
          className="group cursor-pointer p-4 rounded-2xl aura-glass-ambient hover:bg-white/[0.05] transition-all flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors font-ui-title">
              Tracks
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>

        {/* Albums */}
        <div
          onClick={() => setCurrentView('albums')}
          className="group cursor-pointer p-4 rounded-2xl aura-glass-ambient hover:bg-white/[0.05] transition-all flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Disc className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors font-ui-title">
              Albums
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {albumCount} {albumCount === 1 ? 'album' : 'albums'}
            </p>
          </div>
        </div>

        {/* Artists */}
        <div
          onClick={() => setCurrentView('artists')}
          className="group cursor-pointer p-4 rounded-2xl aura-glass-ambient hover:bg-white/[0.05] transition-all flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors font-ui-title">
              Artists
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {artistCount} {artistCount === 1 ? 'creator' : 'creators'}
            </p>
          </div>
        </div>

        {/* Spaces */}
        <div
          onClick={() => setCurrentView('playlists')}
          className="group cursor-pointer p-4 rounded-2xl aura-glass-ambient hover:bg-white/[0.05] transition-all flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ListMusic className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors font-ui-title">
              Spaces
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {playlists.length} {playlists.length === 1 ? 'space' : 'spaces'}
            </p>
          </div>
        </div>

        {/* Favorites */}
        <div
          onClick={() => setCurrentView('favorites')}
          className="group cursor-pointer p-4 rounded-2xl aura-glass-ambient hover:bg-white/[0.05] transition-all flex flex-col justify-between gap-4 shadow-sm col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-rose-300 transition-colors font-ui-title">
              Liked Songs
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {favoriteItems.length} {favoriteItems.length === 1 ? 'favorite' : 'favorites'}
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. RECENTLY ADDED TO VAULT (Grid Layout)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-ui-title">
              Recently Added to Vault
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('songs')}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            All Tracks <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentlyAddedTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentlyAddedTracks.map((track) => (
              <SongObjectCard
                key={`rec-add-${track.id}`}
                track={track}
                playlistContext={recentlyAddedTracks}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#090b14]/70 border border-white/[0.06] flex flex-col items-center justify-center text-center gap-3">
            <Music className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-200">No tracks added to vault yet</p>
            <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
              Upload local audio files or explore demo audio tracks to populate your personal offline library vault.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-semibold shadow-sm cursor-pointer"
              >
                Upload Audio
              </button>
              <button
                type="button"
                onClick={loadDemoPack}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold border border-white/10 cursor-pointer"
              >
                Load Demo Pack
              </button>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          4. RECENTLY PLAYED HISTORY
          ------------------------------------------------------------- */}
      {recentHistoryTracks.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-ui-title">
                Recent Sessions History
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Recently Active</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentHistoryTracks.map((track) => (
              <SongObjectCard
                key={`rec-play-${track.id}`}
                track={track}
                playlistContext={recentHistoryTracks}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
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
