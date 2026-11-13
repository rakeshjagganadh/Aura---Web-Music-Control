import React, { useState, useEffect, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { LibraryNav } from '../library/LibraryNav';
import { TrackRow } from '../library/TrackRow';
import { TrackGridCard } from '../library/TrackGridCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { 
  Music, 
  Search, 
  X, 
  List, 
  LayoutGrid, 
  ArrowUpDown, 
  Filter, 
  Plus, 
  Play, 
  ListPlus, 
  Trash2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  HardDrive
} from 'lucide-react';

type SourceFilterType = 'all' | 'local' | 'jamendo' | 'audius' | 'youtube' | 'curated_stream';
type SortField = 'dateAdded' | 'title' | 'artist' | 'album' | 'duration' | 'source';

export const SongsView: React.FC = () => {
  const {
    tracks,
    searchQuery,
    setSearchQuery,
    playTrack,
    addToQueue,
    deleteTrack,
    setIsUploadModalOpen,
    loadDemoPack,
    setCurrentView,
  } = useMusic();

  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [activeSourceFilter, setActiveSourceFilter] = useState<SourceFilterType>('all');
  const [sortBy, setSortBy] = useState<SortField>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');

  // Multi-selection state
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [playlistModalBulkTracks, setPlaylistModalBulkTracks] = useState<Track[] | null>(null);

  // Synchronize local search with global search query
  useEffect(() => {
    if (searchQuery !== localSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    setSearchQuery(val);
  };

  // 1. Source Filtering
  const sourceFilteredTracks = useMemo(() => {
    if (activeSourceFilter === 'all') return tracks;
    if (activeSourceFilter === 'local') return tracks.filter((t) => !t.source || t.source === 'local');
    if (activeSourceFilter === 'jamendo') return tracks.filter((t) => t.source === 'jamendo');
    if (activeSourceFilter === 'audius') return tracks.filter((t) => t.source === 'audius');
    if (activeSourceFilter === 'youtube') return tracks.filter((t) => t.source === 'youtube');
    if (activeSourceFilter === 'curated_stream') return tracks.filter((t) => t.source === 'curated_stream');
    return tracks;
  }, [tracks, activeSourceFilter]);

  // 2. Query Search
  const searchFilteredTracks = useMemo(() => {
    if (!localSearch || !localSearch.trim()) return sourceFilteredTracks;
    const q = localSearch.trim().toLowerCase();

    return sourceFilteredTracks.filter((t) => {
      const titleMatch = t.title.toLowerCase().includes(q);
      const artistMatch = (t.artist || '').toLowerCase().includes(q);
      const albumMatch = (t.album || '').toLowerCase().includes(q);
      const genreMatch = (t.genre || '').toLowerCase().includes(q);
      return titleMatch || artistMatch || albumMatch || genreMatch;
    });
  }, [sourceFilteredTracks, localSearch]);

  // 3. Sorting
  const sortedTracks = useMemo(() => {
    return [...searchFilteredTracks].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          break;
        case 'artist':
          comparison = (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' });
          break;
        case 'album':
          comparison = (a.album || '').localeCompare(b.album || '', undefined, { sensitivity: 'base' });
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'source':
          comparison = (a.source || 'local').localeCompare(b.source || 'local');
          break;
        case 'dateAdded':
        default:
          comparison = (a.dateAdded || 0) - (b.dateAdded || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [searchFilteredTracks, sortBy, sortOrder]);

  // Source counts
  const sourceCounts = useMemo(() => {
    const counts = { all: tracks.length, local: 0, jamendo: 0, audius: 0, youtube: 0, curated_stream: 0 };
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

  const selectedTracksInOrder = useMemo(() => {
    return sortedTracks.filter((t) => selectedTrackIds.has(t.id));
  }, [sortedTracks, selectedTrackIds]);

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

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'title' || field === 'artist' || field === 'album' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44">
      
      {/* -------------------------------------------------------------
          1. HEADER & ACTIONS
          ------------------------------------------------------------- */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-400">
            <Music className="w-3.5 h-3.5 text-sky-400" />
            <span className="uppercase tracking-wider text-[11px] font-semibold text-sky-400">Music Catalogue</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>{tracks.length} tracks total</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-page-title text-white tracking-tight">
            All Tracks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-ui-meta">
            Browse, search, sort, and organize all audio files stored in your library and streaming sources.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import Audio</span>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. LIBRARY NAVIGATION
          ------------------------------------------------------------- */}
      <LibraryNav activeView="songs" />

      {/* -------------------------------------------------------------
          3. SEARCH, SOURCE FILTERS & CONTROLS TOOLBAR
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Working Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by title, artist, album, or genre..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all font-ui-title"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Sort Dropdown & View Mode Switcher */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Sort Dropdown */}
            <div className="relative flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-zinc-300 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="dateAdded" className="bg-[#12141c] text-white">Recently Added</option>
                <option value="title" className="bg-[#12141c] text-white">Title A–Z</option>
                <option value="artist" className="bg-[#12141c] text-white">Artist A–Z</option>
                <option value="album" className="bg-[#12141c] text-white">Album A–Z</option>
                <option value="duration" className="bg-[#12141c] text-white">Duration</option>
                <option value="source" className="bg-[#12141c] text-white">Source</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="hover:text-white px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 cursor-pointer"
                title="Toggle sort direction"
              >
                {sortOrder}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.05] border border-white/10">
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
          </div>
        </div>

        {/* Source Segmented Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1 shrink-0">Source:</span>
          
          <button
            type="button"
            onClick={() => setActiveSourceFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeSourceFilter === 'all'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            All Sources ({sourceCounts.all})
          </button>

          {sourceCounts.local > 0 && (
            <button
              type="button"
              onClick={() => setActiveSourceFilter('local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeSourceFilter === 'local'
                  ? 'bg-sky-500 text-white font-bold shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Local Vault ({sourceCounts.local})
            </button>
          )}

          {sourceCounts.jamendo > 0 && (
            <button
              type="button"
              onClick={() => setActiveSourceFilter('jamendo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeSourceFilter === 'jamendo'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Jamendo ({sourceCounts.jamendo})
            </button>
          )}

          {sourceCounts.audius > 0 && (
            <button
              type="button"
              onClick={() => setActiveSourceFilter('audius')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeSourceFilter === 'audius'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Audius ({sourceCounts.audius})
            </button>
          )}

          {sourceCounts.youtube > 0 && (
            <button
              type="button"
              onClick={() => setActiveSourceFilter('youtube')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeSourceFilter === 'youtube'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              YouTube ({sourceCounts.youtube})
            </button>
          )}

          {sourceCounts.curated_stream > 0 && (
            <button
              type="button"
              onClick={() => setActiveSourceFilter('curated_stream')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeSourceFilter === 'curated_stream'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Curated Streams ({sourceCounts.curated_stream})
            </button>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. BULK SELECTION ACTION BAR (WHEN TRACKS ARE SELECTED)
          ------------------------------------------------------------- */}
      {selectedTrackIds.size > 0 && (
        <section className="sticky top-2 z-30 flex items-center justify-between gap-3 p-3 rounded-2xl aura-glass-island border border-sky-500/30 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-white hover:text-sky-300 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-sky-400" />
              <span>{selectedTrackIds.size} {selectedTrackIds.size === 1 ? 'track' : 'tracks'} selected</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBulkPlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-black translate-x-0.2" />
              <span>Play Selected</span>
            </button>

            <button
              type="button"
              onClick={handleBulkAddToQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add to Queue</span>
            </button>

            <button
              type="button"
              onClick={handleBulkAddToPlaylist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add to Playlist...</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTrackIds(new Set())}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          5. TRACK LISTING (LIST OR GRID VIEW)
          ------------------------------------------------------------- */}
      {sortedTracks.length > 0 ? (
        viewMode === 'row' ? (
          <div className="flex flex-col rounded-2xl aura-glass-ambient border border-white/10 overflow-hidden">
            {/* Table Header Row (Desktop) */}
            <div className="hidden sm:flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="w-5 flex items-center justify-center text-zinc-500 hover:text-white cursor-pointer"
                  title={isAllSelected ? 'Deselect all' : 'Select all'}
                >
                  {isAllSelected ? <CheckSquare className="w-3.5 h-3.5 text-sky-400" /> : <Square className="w-3.5 h-3.5" />}
                </button>
                <span className="w-6 text-center">#</span>
                <span className="w-10">Art</span>
                <button
                  type="button"
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              <div className="hidden md:block w-44 lg:w-56 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSort('album')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  Album {sortBy === 'album' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              <div className="hidden lg:block w-28 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSort('dateAdded')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  Added {sortBy === 'dateAdded' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              <div className="hidden xl:block w-28 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSort('source')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  Source {sortBy === 'source' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0 pr-1">
                <span className="w-12 text-right">Time</span>
                <span className="w-8"></span>
              </div>
            </div>

            {/* Track Rows */}
            <div className="divide-y divide-white/[0.03] p-1.5">
              {sortedTracks.map((track, i) => (
                <TrackRow
                  key={`track-${track.id}`}
                  track={track}
                  index={i + 1}
                  playlistContext={sortedTracks}
                  isSelected={selectedTrackIds.has(track.id)}
                  showSelection={selectedTrackIds.size > 0}
                  onToggleSelect={toggleSelectTrack}
                  searchQuery={localSearch}
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                  onSelectArtist={(artist) => {
                    setLocalSearch(artist);
                    setSearchQuery(artist);
                  }}
                  onSelectAlbum={(album) => {
                    setLocalSearch(album);
                    setSearchQuery(album);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {sortedTracks.map((track) => (
              <TrackGridCard
                key={`grid-${track.id}`}
                track={track}
                playlistContext={sortedTracks}
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        )
      ) : (
        /* Thoughtful Empty State */
        <div className="p-10 sm:p-16 rounded-2xl aura-glass-ambient border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500">
            <Music className="w-6 h-6 text-zinc-400" />
          </div>
          {localSearch || activeSourceFilter !== 'all' ? (
            <>
              <h3 className="text-sm font-semibold text-zinc-200">No matching tracks found</h3>
              <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
                No tracks match your current filter criteria &quot;{localSearch}&quot;.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange('');
                    setActiveSourceFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-semibold shadow cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-zinc-200">Your audio library is empty</h3>
              <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
                Import local audio files into your offline vault or load the demo sound pack to start listening.
              </p>
              <div className="flex items-center gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow cursor-pointer"
                >
                  Import Local Audio
                </button>
                <button
                  type="button"
                  onClick={loadDemoPack}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 cursor-pointer"
                >
                  Load Demo Pack
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          6. MODALS
          ------------------------------------------------------------- */}
      {/* Add To Playlist Modal */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          isOpen={Boolean(playlistModalTrack)}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

      {playlistModalBulkTracks && (
        <AddToPlaylistModal
          tracks={playlistModalBulkTracks}
          isOpen={Boolean(playlistModalBulkTracks)}
          onClose={() => setPlaylistModalBulkTracks(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl aura-glass-island border border-white/15 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-ui-title">Delete {selectedTracksInOrder.length} Tracks?</h3>
                <p className="text-xs text-zinc-400 font-ui-meta">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-ui-meta leading-relaxed">
              Selected local files will be permanently removed from your browser&apos;s offline IndexedDB storage.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
