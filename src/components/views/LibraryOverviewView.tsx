import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { TrackGridCard } from '../library/TrackGridCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { AuraIcon } from '../ui/AuraIcon';

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
    <div className="flex flex-col gap-5 sm:gap-10 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-6 sm:pb-44">
      
      {/* -------------------------------------------------------------
          1. REFINED EDITORIAL HEADER & COMPACT ACTIONS
          ------------------------------------------------------------- */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-zinc-400 font-sans tabular-nums">
            <span>{tracks.length} tracks</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>{albumCount} albums</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>{artistCount} artists</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="font-mono">{formatStorageMB(storageUsage.approxBytes)}</span>
          </div>

          <h1 className="text-xl sm:text-4xl font-page-title text-white tracking-tight">
            Your Library
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl font-ui-meta leading-relaxed">
            Your personal music catalogue, offline local vault, and curated collections.
          </p>
        </div>

        {/* Compact Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search within Library */}
          <form onSubmit={handleLibrarySearch} className="relative flex-1 sm:flex-initial">
            <AuraIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={libraryFilter}
              onChange={(e) => setLibraryFilter(e.target.value)}
              placeholder="Filter library..."
              className="w-full sm:w-48 pl-8 pr-7 py-2 min-h-[40px] rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
            {libraryFilter && (
              <button
                type="button"
                onClick={() => setLibraryFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <AuraIcon name="close" size={12} />
              </button>
            )}
          </form>

          {tracks.length > 0 && (
            <button
              type="button"
              onClick={handleShuffleAll}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[40px] rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable shrink-0"
              title="Shuffle all tracks in library"
            >
              <AuraIcon name="shuffle" size={14} className="text-sky-400" />
              <span>Shuffle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[40px] rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer aura-focus-ring aura-pressable shrink-0"
            title="Create a new playlist"
          >
            <AuraIcon name="add" size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">New Playlist</span>
            <span className="sm:hidden">Playlist</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[40px] rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable shrink-0"
            title="Import audio files into vault"
          >
            <AuraIcon name="add" size={14} weight={600} />
            <span className="hidden sm:inline">Import Audio</span>
            <span className="sm:hidden">Import</span>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. UNIFIED COLLECTION NAVIGATION
          ------------------------------------------------------------- */}
      <LibraryNav activeView="library" />

      {/* -------------------------------------------------------------
          4. RECENTLY ADDED (ARTWORK-LED SHELF)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-section-title text-white flex items-center gap-2">
              <AuraIcon name="clock" size={16} className="text-sky-400" />
              Recently Added
            </h2>
            <p className="hidden sm:block text-xs text-zinc-400 mt-0.5 font-ui-meta">
              Latest audio files and discovered tracks added to your collection
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('songs')}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium aura-pressable min-h-[36px] px-2 -mr-2"
          >
            <span>View All</span>
            <AuraIcon name="chevronRight" size={14} />
          </button>
        </div>

        {recentlyAddedTracks.length > 0 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 -mx-3 px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-5 [&>*]:w-[42vw] [&>*]:max-w-[168px] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto sm:[&>*]:max-w-none">
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
          <div className="p-8 sm:p-10 rounded-2xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
            <AuraIcon name="fileAudio" size={28} className="text-zinc-500" />
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
        <section className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-section-title text-white flex items-center gap-2">
                <AuraIcon name="history" size={16} className="text-sky-400" />
                Recently Played
              </h2>
              <p className="hidden sm:block text-xs text-zinc-400 mt-0.5 font-ui-meta">
                Tracks you recently experienced across your active playback sessions
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-sans font-medium hidden sm:inline">Recent Sessions</span>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 -mx-3 px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-5 [&>*]:w-[42vw] [&>*]:max-w-[168px] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto sm:[&>*]:max-w-none">
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
      <section className="p-4 sm:p-6 rounded-2xl aura-glass-ambient border border-white/[0.08] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <AuraIcon name="hardDrive" size={16} className="text-cyan-400 shrink-0" />
            <h3 className="text-base font-bold text-white font-ui-title">
              Local Audio Vault
            </h3>
            <span className="text-xs font-mono tabular-nums text-zinc-400">
              · {localVaultTracks.length} tracks · {formatStorageMB(storageUsage.approxBytes)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-ui-meta leading-relaxed">
            Imported audio stays inside browser-local IndexedDB storage for offline playback and Web Audio DSP (FLAC, WAV, MP3, AAC, OGG, WebM).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer aura-focus-ring aura-pressable"
          >
            <AuraIcon name="add" size={16} weight={600} />
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
