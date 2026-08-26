import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { AuraEmptyState } from '../common/AuraEmptyState';
import { SongObjectCard } from '../common/SongObjectCard';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  ListMusic, 
  Trash2, 
  ListPlus, 
  Clock, 
  Music, 
  UploadCloud, 
  Sparkles,
  ArrowUpDown,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  LayoutGrid,
  List
} from 'lucide-react';

const HighlightText: React.FC<{ text: string; query: string; className?: string }> = ({ text, query, className = '' }) => {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-indigo-500/30 text-indigo-200 px-0.5 rounded font-medium">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const SongsView: React.FC = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    searchQuery,
    setSearchQuery,
    activeSearchIndex,
    nextSearchResult,
    prevSearchResult,
    playTrack,
    togglePlay,
    toggleFavorite,
    addToQueue,
    playNext,
    deleteTrack,
    setIsUploadModalOpen,
    loadDemoPack,
  } = useMusic();

  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'dateAdded'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter & Search
  const filteredTracks = tracks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.fileFormat.toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'title') comparison = a.title.localeCompare(b.title);
    else if (sortBy === 'artist') comparison = a.artist.localeCompare(b.artist);
    else if (sortBy === 'duration') comparison = a.duration - b.duration;
    else if (sortBy === 'dateAdded') comparison = a.dateAdded - b.dateAdded;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Scroll active search result into view
  useEffect(() => {
    if (searchQuery && sortedTracks.length > 0) {
      const activeEl = rowRefs.current[activeSearchIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSearchIndex, searchQuery, sortedTracks.length]);

  const toggleSort = (field: 'title' | 'artist' | 'duration' | 'dateAdded') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto select-none" onClick={() => setActiveMenuTrackId(null)}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Audio Library</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sortedTracks.length} {sortedTracks.length === 1 ? 'track' : 'tracks'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/5">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'row' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Music Objects Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {sortedTracks.length > 0 && (
            <button
              onClick={() => playTrack(sortedTracks[0], sortedTracks)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play All
            </button>
          )}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </div>

      {/* Active Search Toolbar */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Results for "{searchQuery}"
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-300 border border-white/5">
                  {sortedTracks.length > 0
                    ? `Match ${Math.min(activeSearchIndex + 1, sortedTracks.length)} of ${sortedTracks.length}`
                    : 'No matches'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Use Enter / ↓ for Next match, Shift+Enter / ↑ for Previous match
              </p>
            </div>
          </div>

          {sortedTracks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSearchResult}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
                title="Previous search result"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={nextSearchResult}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
                title="Next search result"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Next</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = sortedTracks[activeSearchIndex] || sortedTracks[0];
                  if (target) playTrack(target, sortedTracks);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play Match</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Song List Content */}
      {sortedTracks.length === 0 ? (
        <AuraEmptyState
          title={searchQuery ? 'No tracks matched' : 'Your acoustic library is empty.'}
          description={
            searchQuery
              ? `No tracks matched "${searchQuery}". Check spelling or clear your search.`
              : 'Add your high-fidelity audio tracks or load the synthesized demo pack to test your EQ and audio effects.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Upload Audio'}
          onAction={() => (searchQuery ? setSearchQuery('') : setIsUploadModalOpen(true))}
          secondaryActionLabel={!searchQuery ? 'Explore Demo Pack' : undefined}
          onSecondaryAction={!searchQuery ? loadDemoPack : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 sm:gap-6">
          {sortedTracks.map((track) => (
            <SongObjectCard
              key={track.id}
              track={track}
              playlistContext={sortedTracks}
              variant="grid"
              onOpenPlaylistModal={setPlaylistModalTrack}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0b0d13]/60 border border-white/5 overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-5 flex items-center gap-2 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('title')}>
              <span># Title</span>
              {sortBy === 'title' && <ArrowUpDown className="w-3 h-3 text-indigo-400" />}
            </div>
            <div className="col-span-3 sm:col-span-3 hidden sm:flex items-center gap-2 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('artist')}>
              <span>Artist</span>
              {sortBy === 'artist' && <ArrowUpDown className="w-3 h-3 text-indigo-400" />}
            </div>
            <div className="col-span-3 sm:col-span-2 hidden md:block">
              Album
            </div>
            <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('duration')}>
              <Clock className="w-3 h-3" />
              <span>Time</span>
              {sortBy === 'duration' && <ArrowUpDown className="w-3 h-3 text-indigo-400" />}
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/[0.04]">
            {sortedTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isActivelyPlaying = isCurrent && isPlaying;
              const isActiveSearchMatch = searchQuery && idx === activeSearchIndex;

              return (
                <div
                  key={track.id}
                  ref={(el) => { rowRefs.current[idx] = el; }}
                  className={`group relative grid grid-cols-12 gap-4 px-4 py-2.5 items-center transition-all cursor-pointer ${
                    isActiveSearchMatch
                      ? 'bg-indigo-950/50 ring-1 ring-indigo-500/60'
                      : isCurrent
                      ? 'bg-indigo-950/25 text-indigo-200 border-l-2 border-indigo-500'
                      : 'hover:bg-white/[0.03] text-zinc-300'
                  }`}
                  onDoubleClick={() => playTrack(track, sortedTracks)}
                >
                  {/* Col 1: Play button / Thumbnail / Title */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-zinc-500 w-4 shrink-0 text-center">
                      {isActivelyPlaying ? (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </span>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) togglePlay();
                        else playTrack(track, sortedTracks);
                      }}
                      className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#0e1017] border border-white/5 cursor-pointer shadow-sm"
                    >
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                          <Music className="w-4 h-4 text-white/80" />
                        </div>
                      )}
                      
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {isActivelyPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-current" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => playTrack(track, sortedTracks)}
                          className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:text-indigo-400 ${
                            isCurrent ? 'text-indigo-300 font-bold' : 'text-zinc-200'
                          }`}
                        >
                          <HighlightText text={track.title} query={searchQuery} />
                        </h4>
                        {isActiveSearchMatch && (
                          <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.2 bg-indigo-500 text-white rounded font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate sm:hidden">
                        <HighlightText text={track.artist} query={searchQuery} />
                      </p>
                    </div>
                  </div>

                  {/* Col 2: Artist */}
                  <div className="col-span-3 sm:col-span-3 hidden sm:block truncate text-xs text-zinc-400">
                    <HighlightText text={track.artist} query={searchQuery} />
                  </div>

                  {/* Col 3: Album */}
                  <div className="col-span-3 sm:col-span-2 hidden md:block truncate text-xs text-zinc-500">
                    <HighlightText text={track.album} query={searchQuery} />
                  </div>

                  {/* Col 4: Time, Favorite & More Menu */}
                  <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFavorite(track.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Favorite"
                    >
                      <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <span className="text-xs font-mono text-zinc-500 w-10 text-right">
                      {formatTime(track.duration)}
                    </span>

                    {/* Context Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuTrackId === track.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-1.5 z-40 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              playNext(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left cursor-pointer"
                          >
                            <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                            Play Next
                          </button>
                          <button
                            onClick={() => {
                              addToQueue(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left cursor-pointer"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                            Add to Queue
                          </button>
                          <button
                            onClick={() => {
                              setPlaylistModalTrack(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left cursor-pointer"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                            Add to Playlist...
                          </button>
                          <button
                            onClick={() => {
                              deleteTrack(track.id);
                              setActiveMenuTrackId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Track
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
      />

    </div>
  );
};
