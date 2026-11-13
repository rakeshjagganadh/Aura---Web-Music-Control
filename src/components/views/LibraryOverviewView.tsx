import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { TrackGridCard } from '../library/TrackGridCard';
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
  Play,
  Search,
  X,
  ArrowUpRight,
  Database,
  FileAudio
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
    setIsPlaylistModalOpen,
    loadDemoPack,
    playTrack,
    toggleShuffle,
    isShuffle,
    storageUsage,
    setSearchQuery: setGlobalSearchQuery,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [libraryFilter, setLibraryFilter] = useState('');

  // Genuine derived metrics from local IndexedDB data
  const localVaultTracks = useMemo(() => {
    return tracks.filter((t) => !t.source || t.source === 'local');
  }, [tracks]);

  const recentlyAddedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)).slice(0, 8);
  }, [tracks]);
  
  const recentHistoryTracks = useMemo(() => {
    const list = (recentlyPlayed && recentlyPlayed.length > 0
      ? recentlyPlayed.map((rp) => rp.track)
      : history || []
    ).filter(Boolean);
    // Deduplicate
    const seen = new Set<string>();
    const deduped: Track[] = [];
    for (const t of list) {
      if (t && !seen.has(t.id)) {
        seen.add(t.id);
        deduped.push(t);
      }
    }
    return deduped.slice(0, 8);
  }, [recentlyPlayed, history]);

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
    if (!bytes || bytes <= 0) return '0.0 MB';
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    if (!isShuffle) toggleShuffle();
    const randomIndex = Math.floor(Math.random() * tracks.length);
    playTrack(tracks[randomIndex], tracks);
  };

  const handleLibrarySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (libraryFilter.trim()) {
      setGlobalSearchQuery(libraryFilter.trim());
      setCurrentView('songs');
    }
  };

  return (
    <div className="flex flex-col gap-8 sm:gap-10 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44">
      
      {/* -------------------------------------------------------------
          1. REFINED EDITORIAL HEADER & COMPACT ACTIONS
          ------------------------------------------------------------- */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-400">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="uppercase tracking-wider text-[11px] font-semibold text-sky-400">Personal Collection</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>IndexedDB Vault</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight">
            Your Library
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl font-ui-meta leading-relaxed">
            Your personal music catalogue, lossless local vault, and curated listening collections.
          </p>
        </div>

        {/* Compact Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Search within Library */}
          <form onSubmit={handleLibrarySearch} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={libraryFilter}
              onChange={(e) => setLibraryFilter(e.target.value)}
              placeholder="Filter library..."
              className="w-40 sm:w-48 pl-8 pr-7 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all"
            />
            {libraryFilter && (
              <button
                type="button"
                onClick={() => setLibraryFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>

          {tracks.length > 0 && (
            <button
              type="button"
              onClick={handleShuffleAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable"
              title="Shuffle all tracks in library"
            >
              <Shuffle className="w-3.5 h-3.5 text-sky-400" />
              <span>Shuffle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable"
            title="Create a new playlist"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Playlist</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable"
            title="Import audio files into vault"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import Audio</span>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. UNIFIED COLLECTION NAVIGATION
          ------------------------------------------------------------- */}
      <LibraryNav activeView="library" />

      {/* -------------------------------------------------------------
          3. REAL COLLECTION METRICS BAR (ZERO INVENTED NUMBERS)
          ------------------------------------------------------------- */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setCurrentView('songs')}
          className="p-4 rounded-3xl glass-ambient hover:glass-reflective border border-white/[0.18] flex flex-col justify-between cursor-pointer transition-colors shadow-lg aura-hover-scale aura-pressable-subtle"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Tracks</span>
            <Music className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{tracks.length}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta">In library</p>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('albums')}
          className="p-4 rounded-3xl glass-ambient hover:glass-reflective border border-white/[0.18] flex flex-col justify-between cursor-pointer transition-colors shadow-lg aura-hover-scale aura-pressable-subtle"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Albums</span>
            <Disc className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{albumCount}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta">Catalogued</p>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('artists')}
          className="p-4 rounded-3xl glass-ambient hover:glass-reflective border border-white/[0.18] flex flex-col justify-between cursor-pointer transition-colors shadow-lg aura-hover-scale aura-pressable-subtle"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Artists</span>
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{artistCount}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta">Creators</p>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('playlists')}
          className="p-4 rounded-3xl glass-ambient hover:glass-reflective border border-white/[0.18] flex flex-col justify-between cursor-pointer transition-colors shadow-lg aura-hover-scale aura-pressable-subtle"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Playlists</span>
            <ListMusic className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{playlists.length}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta">Organized</p>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('favorites')}
          className="p-4 rounded-3xl glass-ambient hover:glass-reflective border border-white/[0.18] flex flex-col justify-between cursor-pointer transition-colors shadow-lg aura-hover-scale aura-pressable-subtle"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Liked Songs</span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{favoriteItems.length}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta">Starred</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-ambient border border-white/[0.18] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Vault Storage</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{formatStorageMB(storageUsage.approxBytes)}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-ui-meta">{localVaultTracks.length} local files</p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. RECENTLY ADDED (ARTWORK-LED SHELF)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-section-title text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Recently Added
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-ui-meta">
              Latest audio files and discovered tracks added to your collection
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('songs')}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium aura-pressable"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentlyAddedTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
            {recentlyAddedTracks.map((track) => (
              <TrackGridCard
                key={`rec-add-${track.id}`}
                track={track}
                playlistContext={recentlyAddedTracks}
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-2xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500">
              <FileAudio className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Your library is currently empty</h3>
            <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
              Import local audio files (MP3, FLAC, WAV, AAC) into your offline IndexedDB vault or load the demo sound pack to start listening.
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md cursor-pointer aura-focus-ring aura-pressable"
              >
                Import Local Audio
              </button>
              <button
                type="button"
                onClick={loadDemoPack}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 cursor-pointer aura-focus-ring aura-pressable"
              >
                Load Demo Pack
              </button>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          5. RECENTLY PLAYED HISTORY (ONLY WHEN REAL DATA EXISTS)
          ------------------------------------------------------------- */}
      {recentHistoryTracks.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-section-title text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Recently Played
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-ui-meta">
                Tracks you recently experienced across your active playback sessions
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Recent Sessions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-5">
            {recentHistoryTracks.map((track) => (
              <TrackGridCard
                key={`rec-play-${track.id}`}
                track={track}
                playlistContext={recentHistoryTracks}
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          6. LOCAL MUSIC VAULT MANAGEMENT (HONEST INDEXEDDB OVERVIEW)
          ------------------------------------------------------------- */}
      <section className="p-5 sm:p-7 rounded-2xl aura-glass-island border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0 text-cyan-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25">
                PRIVATE VAULT
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {localVaultTracks.length} tracks · {formatStorageMB(storageUsage.approxBytes)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-ui-title">
              Local Audio Vault & Offline Engine
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-ui-meta leading-relaxed">
              Files imported into AURA are stored directly in your browser's private IndexedDB storage for instant offline listening and high-fidelity Web Audio DSP processing. No external tracking or uploads.
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px] font-mono text-zinc-400">
              <span className="text-zinc-500">Supported Formats:</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-300">FLAC</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-300">WAV</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-300">MP3</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-300">AAC</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-300">OGG</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-zinc-300">WebM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import Audio Files</span>
          </button>
        </div>
      </section>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={Boolean(playlistModalTrack)}
        onClose={() => setPlaylistModalTrack(null)}
      />

    </div>
  );
};
