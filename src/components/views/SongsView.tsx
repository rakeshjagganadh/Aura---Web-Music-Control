import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track, MusicSourceType } from '../../types';
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
  ArrowUpDown,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  LayoutGrid,
  List,
  Filter,
  CheckCircle2,
  FileText,
  CheckSquare,
  Square,
  AlertTriangle,
  HardDrive,
  Radio,
  Youtube,
  Layers,
  Sparkles
} from 'lucide-react';

type SourceFilterType = 'all' | 'local' | 'jamendo' | 'audius' | 'youtube' | 'curated_stream';

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
  const [playlistModalBulkTracks, setPlaylistModalBulkTracks] = useState<Track[] | null>(null);

  // Sorting & View States
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'dateAdded'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');
  const [activeSourceFilter, setActiveSourceFilter] = useState<SourceFilterType>('all');

  // Multi-Selection State
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

  // Safe Deletion Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 1. Source-aware Filtering Logic
  const sourceFilteredTracks = useMemo(() => {
    if (activeSourceFilter === 'all') return tracks;
    if (activeSourceFilter === 'local') return tracks.filter((t) => !t.source || t.source === 'local');
    if (activeSourceFilter === 'jamendo') return tracks.filter((t) => t.source === 'jamendo');
    if (activeSourceFilter === 'audius') return tracks.filter((t) => t.source === 'audius');
    if (activeSourceFilter === 'youtube') return tracks.filter((t) => t.source === 'youtube');
    if (activeSourceFilter === 'curated_stream') return tracks.filter((t) => t.source === 'curated_stream');
    return tracks;
  }, [tracks, activeSourceFilter]);

  // 2. Query Search Logic (Verified Genre vs Text Substring Match)
  const { verifiedGenreMatches, textMatches, allMatches } = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return { verifiedGenreMatches: [], textMatches: [], allMatches: sourceFilteredTracks };
    }

    const q = searchQuery.trim().toLowerCase();
    const genreHits: Track[] = [];
    const textHits: Track[] = [];

    sourceFilteredTracks.forEach((t) => {
      const genreVal = (t.genre || '').toLowerCase();
      const titleVal = t.title.toLowerCase();
      const artistVal = t.artist.toLowerCase();
      const albumVal = t.album.toLowerCase();

      if (genreVal && (genreVal === q || genreVal.includes(q))) {
        genreHits.push(t);
      } else if (titleVal.includes(q) || artistVal.includes(q) || albumVal.includes(q)) {
        textHits.push(t);
      }
    });

    return {
      verifiedGenreMatches: genreHits,
      textMatches: textHits,
      allMatches: [...genreHits, ...textHits],
    };
  }, [searchQuery, sourceFilteredTracks]);

  // 3. Sorting Logic
  const sortedTracks = useMemo(() => {
    return [...allMatches].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') comparison = a.title.localeCompare(b.title);
      else if (sortBy === 'artist') comparison = a.artist.localeCompare(b.artist);
      else if (sortBy === 'duration') comparison = a.duration - b.duration;
      else if (sortBy === 'dateAdded') comparison = a.dateAdded - b.dateAdded;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allMatches, sortBy, sortOrder]);

  // Clean stale selection IDs when tracks change
  useEffect(() => {
    const validIds = new Set(sortedTracks.map((t) => t.id));
    setSelectedTrackIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [sortedTracks]);

  // Scroll active search result into view
  useEffect(() => {
    if (searchQuery && sortedTracks.length > 0) {
      const activeEl = rowRefs.current[activeSearchIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSearchIndex, searchQuery, sortedTracks.length]);

  // Source counts for source filter pills
  const sourceCounts = useMemo(() => {
    const counts = { local: 0, jamendo: 0, audius: 0, youtube: 0, curated_stream: 0 };
    tracks.forEach((t) => {
      if (!t.source || t.source === 'local') counts.local++;
      else if (t.source === 'jamendo') counts.jamendo++;
      else if (t.source === 'audius') counts.audius++;
      else if (t.source === 'youtube') counts.youtube++;
      else if (t.source === 'curated_stream') counts.curated_stream++;
    });
    return counts;
  }, [tracks]);

  // Multi-selection handlers
  const toggleSelectTrack = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const isAllSelected = sortedTracks.length > 0 && sortedTracks.every((t) => selectedTrackIds.has(t.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(sortedTracks.map((t) => t.id)));
    }
  };

  // Selected tracks in visible order
  const selectedTracksInOrder = useMemo(() => {
    return sortedTracks.filter((t) => selectedTrackIds.has(t.id));
  }, [sortedTracks, selectedTrackIds]);

  // Deletion Breakdown (Local vs External)
  const deletionBreakdown = useMemo(() => {
    let localCount = 0;
    let externalCount = 0;
    selectedTracksInOrder.forEach((t) => {
      if (!t.source || t.source === 'local') localCount++;
      else externalCount++;
    });
    return { localCount, externalCount };
  }, [selectedTracksInOrder]);

  // Bulk Actions
  const handleBulkPlay = () => {
    if (selectedTracksInOrder.length > 0) {
      playTrack(selectedTracksInOrder[0], selectedTracksInOrder);
      setSelectedTrackIds(new Set());
    }
  };

  const handleBulkAddToQueue = () => {
    if (selectedTracksInOrder.length > 0) {
      selectedTracksInOrder.forEach((t) => addToQueue(t));
      setSelectedTrackIds(new Set());
    }
  };

  const handleBulkAddToPlaylist = () => {
    if (selectedTracksInOrder.length > 0) {
      setPlaylistModalBulkTracks(selectedTracksInOrder);
    }
  };

  const handleConfirmBulkDelete = () => {
    selectedTracksInOrder.forEach((t) => {
      try {
        deleteTrack(t.id);
      } catch (err) {
        console.warn('Failed to delete track:', t.id, err);
      }
    });
    setSelectedTrackIds(new Set());
    setIsDeleteModalOpen(false);
  };

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
      
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">Audio Library</h1>
            {searchQuery && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Filter className="w-3 h-3" />
                <span>Filter: &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'row' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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

      {/* Source Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none pb-1 border-b border-white/5">
        <span className="text-zinc-500 font-mono uppercase text-[10px] mr-1 shrink-0">Source:</span>

        <button
          onClick={() => setActiveSourceFilter('all')}
          className={`px-3 py-1 rounded-xl transition-colors cursor-pointer shrink-0 font-medium ${
            activeSourceFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Sources ({tracks.length})
        </button>

        {sourceCounts.local > 0 && (
          <button
            onClick={() => setActiveSourceFilter('local')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors cursor-pointer shrink-0 font-medium ${
              activeSourceFilter === 'local'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/20'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Vault ({sourceCounts.local})</span>
          </button>
        )}

        {sourceCounts.jamendo > 0 && (
          <button
            onClick={() => setActiveSourceFilter('jamendo')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors cursor-pointer shrink-0 font-medium ${
              activeSourceFilter === 'jamendo'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/20'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Jamendo ({sourceCounts.jamendo})</span>
          </button>
        )}

        {sourceCounts.audius > 0 && (
          <button
            onClick={() => setActiveSourceFilter('audius')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors cursor-pointer shrink-0 font-medium ${
              activeSourceFilter === 'audius'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-purple-300 hover:bg-purple-950/20'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Audius ({sourceCounts.audius})</span>
          </button>
        )}

        {sourceCounts.youtube > 0 && (
          <button
            onClick={() => setActiveSourceFilter('youtube')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors cursor-pointer shrink-0 font-medium ${
              activeSourceFilter === 'youtube'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-red-300 hover:bg-red-950/20'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube ({sourceCounts.youtube})</span>
          </button>
        )}

        {sourceCounts.curated_stream > 0 && (
          <button
            onClick={() => setActiveSourceFilter('curated_stream')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-colors cursor-pointer shrink-0 font-medium ${
              activeSourceFilter === 'curated_stream'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Streams ({sourceCounts.curated_stream})</span>
          </button>
        )}
      </div>

      {/* Floating Bulk Action Bar (when tracks selected) */}
      {selectedTrackIds.size > 0 && (
        <div className="sticky top-20 z-40 p-3.5 rounded-2xl bg-[#0e1017]/95 border border-indigo-500/40 backdrop-blur-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedTrackIds.size} Selected</span>
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isAllSelected ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPlay}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={handleBulkAddToQueue}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add to Queue</span>
            </button>

            <button
              onClick={handleBulkAddToPlaylist}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              <ListMusic className="w-3.5 h-3.5 text-amber-400" />
              <span>Add to Space...</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete / Remove</span>
            </button>

            <button
              onClick={() => setSelectedTrackIds(new Set())}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Search / Genre Filter Toolbar */}
      {searchQuery && (
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Active Filter: &quot;{searchQuery}&quot;
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-300 border border-white/5">
                    {sortedTracks.length > 0
                      ? `${sortedTracks.length} matches`
                      : 'No matches'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sortedTracks.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={prevSearchResult}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
                    title="Previous match"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextSearchResult}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer"
                    title="Next match"
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
                </>
              )}

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-zinc-200 transition-colors cursor-pointer"
                title="Clear Filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filter</span>
              </button>
            </div>
          </div>

          {/* Filter Metadata Provenance Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs">
            {verifiedGenreMatches.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Genre Metadata: {verifiedGenreMatches.length}</span>
              </span>
            )}

            {textMatches.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Text Substring Match: {textMatches.length}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Song List Content */}
      {sortedTracks.length === 0 ? (
        <AuraEmptyState
          title={searchQuery ? `No tracks match "${searchQuery}"` : 'Your acoustic library is empty.'}
          description={
            searchQuery
              ? `No local tracks matched search filter "${searchQuery}". Clear your filter to view all library tracks.`
              : 'Add your high-fidelity audio tracks or load the synthesized demo pack to test your EQ and audio effects.'
          }
          actionLabel={searchQuery ? 'Clear Filter' : 'Upload Audio'}
          onAction={() => (searchQuery ? setSearchQuery('') : setIsUploadModalOpen(true))}
          secondaryActionLabel={!searchQuery ? 'Explore Demo Pack' : undefined}
          onSecondaryAction={!searchQuery ? loadDemoPack : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 sm:gap-6">
          {sortedTracks.map((track) => {
            const isSelected = selectedTrackIds.has(track.id);
            return (
              <div key={track.id} className="relative group/grid">
                <div
                  onClick={(e) => toggleSelectTrack(track.id, e)}
                  className="absolute top-3 left-3 z-30 cursor-pointer p-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-400 opacity-60 group-hover/grid:opacity-100" />
                  )}
                </div>
                <SongObjectCard
                  track={track}
                  playlistContext={sortedTracks}
                  variant="grid"
                  onOpenPlaylistModal={setPlaylistModalTrack}
                  className={isSelected ? 'ring-2 ring-indigo-500 rounded-2xl' : ''}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0b0d13]/60 border border-white/5 overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/5 text-[11px] font-mono text-zinc-500 uppercase tracking-wider items-center">
            <div className="col-span-1 flex items-center justify-center">
              <button
                onClick={toggleSelectAll}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title={isAllSelected ? 'Deselect All' : 'Select All Filtered'}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="col-span-5 sm:col-span-4 flex items-center gap-2 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('title')}>
              <span>Title</span>
              {sortBy === 'title' && <ArrowUpDown className="w-3 h-3 text-indigo-400" />}
            </div>

            <div className="col-span-3 sm:col-span-3 hidden sm:flex items-center gap-2 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('artist')}>
              <span>Artist</span>
              {sortBy === 'artist' && <ArrowUpDown className="w-3 h-3 text-indigo-400" />}
            </div>

            <div className="col-span-3 sm:col-span-2 hidden md:block">
              Album
            </div>

            <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2 cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('duration')}>
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
              const isVerifiedGenre = searchQuery && track.genre && track.genre.toLowerCase().includes(searchQuery.trim().toLowerCase());
              const isSelected = selectedTrackIds.has(track.id);

              return (
                <div
                  key={track.id}
                  ref={(el) => { rowRefs.current[idx] = el; }}
                  className={`group relative grid grid-cols-12 gap-3 px-4 py-2.5 items-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                      : isActiveSearchMatch
                      ? 'bg-indigo-950/50 ring-1 ring-indigo-500/60'
                      : isCurrent
                      ? 'bg-indigo-950/25 text-indigo-200 border-l-2 border-indigo-500'
                      : 'hover:bg-white/[0.03] text-zinc-300'
                  }`}
                  onDoubleClick={() => playTrack(track, sortedTracks)}
                >
                  {/* Col 0: Checkbox */}
                  <div className="col-span-1 flex items-center justify-center" onClick={(e) => toggleSelectTrack(track.id, e)}>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                    )}
                  </div>

                  {/* Col 1: Play button / Thumbnail / Title */}
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-zinc-500 w-4 shrink-0 text-center hidden sm:inline-block">
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
                      className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-[#0e1017] border border-white/5 cursor-pointer shadow-sm"
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
                          <Pause className="w-3.5 h-3.5 text-white fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white fill-current translate-x-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4
                          onClick={() => playTrack(track, sortedTracks)}
                          className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:text-indigo-400 ${
                            isCurrent ? 'text-indigo-300 font-bold' : 'text-zinc-200'
                          }`}
                        >
                          <HighlightText text={track.title} query={searchQuery} />
                        </h4>

                        {searchQuery && isVerifiedGenre && (
                          <span className="shrink-0 text-[8px] font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            GENRE
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
                  <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-1.5 z-40 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
                          {track.licenseType && (
                            <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 border-b border-white/5 mb-1">
                              <span className="text-emerald-400 font-semibold">{track.licenseType}</span>
                              {track.creatorName && (
                                <p className="truncate text-zinc-500">By {track.creatorName}</p>
                              )}
                            </div>
                          )}
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
                            Add to Space...
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

      {/* Add To Playlist Modal (Single & Bulk) */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        tracks={playlistModalBulkTracks || undefined}
        isOpen={Boolean(playlistModalTrack || playlistModalBulkTracks)}
        onClose={() => {
          setPlaylistModalTrack(null);
          setPlaylistModalBulkTracks(null);
        }}
      />

      {/* Safe Bulk Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0e1017] border border-rose-500/30 shadow-2xl p-6 flex flex-col gap-4">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white">
                  Confirm Bulk Deletion / Removal
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  You are about to remove <strong className="text-white">{selectedTrackIds.size} tracks</strong> from your AURA library collection.
                </p>
              </div>
            </div>

            {/* Source Breakdown Box */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex flex-col gap-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                Deletion Breakdown Scope
              </span>
              
              {deletionBreakdown.localCount > 0 && (
                <div className="flex items-center justify-between text-rose-300 font-mono text-[11px]">
                  <span>Local Files (IndexedDB Storage):</span>
                  <span className="font-bold">{deletionBreakdown.localCount} files permanently deleted</span>
                </div>
              )}

              {deletionBreakdown.externalCount > 0 && (
                <div className="flex items-center justify-between text-zinc-300 font-mono text-[11px]">
                  <span>External / Stream References:</span>
                  <span className="font-bold">{deletionBreakdown.externalCount} references removed from library</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Note: External online audio content (Jamendo, Audius, YouTube) will not be affected on remote servers. Local IndexedDB audio files will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Delete & Remove ({selectedTrackIds.size})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
