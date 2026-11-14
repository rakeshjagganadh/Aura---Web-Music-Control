import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { MotionBackdrop, MotionFadeSlide, MotionModal } from '../common/motion/MotionSurface';
import { SharedIndicator } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { MOTION_TRANSITION } from '../../motion/tokens';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { 
  Search, 
  X, 
  Play, 
  Pause,
  Music, 
  Disc, 
  User, 
  Radio as RadioIcon, 
  Youtube, 
  HardDrive,
  Plus, 
  Sparkles,
  History,
  ListMusic,
  Heart,
  Globe,
  Compass,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { universalSearchCoordinator, UniversalSearchResults, SearchMatchArtist, SearchMatchAlbum, SearchMatchPlaylist } from '../../services/sourceAdapters';
import { youtubeService } from '../../services/youtubeService';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack?: (track: Track) => void;
  title?: string;
  initialQuery?: string;
}

type CategoryTab = 'all' | 'songs' | 'artists' | 'albums' | 'playlists' | 'radio';
type SourceFilter = 'all' | 'local' | 'jamendo' | 'audius' | 'radiobrowser' | 'youtube';

const HighlightMatch: React.FC<{ text: string; query: string; className?: string }> = ({ text, query, className = '' }) => {
  if (!query || !query.trim()) return <span className={className}>{text}</span>;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-sky-300 font-semibold underline decoration-sky-400/40 underline-offset-2">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectTrack, 
  title,
  initialQuery = ''
}) => {
  const {
    tracks,
    playlists,
    playTrack,
    addToQueue,
    setSelectedPlaylistId,
    setCurrentView,
    currentTrack,
    isPlaying,
    togglePlay,
    toggleFavorite,
  } = useMusic();

  const { canHover, prefersReducedMotion } = useMotionCapabilities();

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [activeSourceFilter, setActiveSourceFilter] = useState<SourceFilter>('all');
  const [searchResults, setSearchResults] = useState<UniversalSearchResults>({
    query: '',
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
    sourceStatus: { local: 'ready', youtube: 'not_configured', audius: 'ready' },
  });
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aura_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('aura_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((termToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem('aura_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('aura_recent_searches');
    } catch {}
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useDialogAccessibility<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

  // Reset filters and sync initialQuery when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || '');
      setActiveTab('all');
      setActiveSourceFilter('all');
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  // Search execution logic
  const executeSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({
        query: '',
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        sourceStatus: { 
          local: 'ready', 
          youtube: youtubeService.isConfigured() ? 'ready' : 'not_configured',
          audius: 'ready',
        },
      });
      setIsSearchingExternal(false);
      setSelectedIndex(0);
      return;
    }

    // 1. Instant local search execution
    const results = await universalSearchCoordinator.search(
      q, 
      { tracks, playlists }, 
      { includeYouTube: false, includeAudius: false, includeJamendo: false, includeRadio: false }
    );
    setSearchResults(results);
    setSelectedIndex(0);

    // 2. Debounced External query execution across Jamendo, Audius, Radio Browser & YouTube
    const isDirectYt = !!youtubeService.parseVideoId(q);
    const shouldSearchExternal = isDirectYt || q.length > 1;

    if (shouldSearchExternal) {
      setIsSearchingExternal(true);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        const fullResults = await universalSearchCoordinator.search(
          q, 
          { tracks, playlists }, 
          { 
            includeYouTube: isDirectYt || youtubeService.isConfigured(),
            includeAudius: true,
            includeJamendo: true,
            includeRadio: true,
          }
        );
        setSearchResults(fullResults);
        setIsSearchingExternal(false);
      }, isDirectYt ? 50 : 280);
    } else {
      setIsSearchingExternal(false);
    }
  }, [tracks, playlists]);

  useEffect(() => {
    executeSearch(query);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, executeSearch]);

  // Filter songs by source
  const songsFilteredBySource = useMemo(() => {
    if (activeSourceFilter === 'all') return searchResults.songs;
    if (activeSourceFilter === 'local') return searchResults.songs.filter((s) => !s.source || s.source === 'local');
    if (activeSourceFilter === 'youtube') return searchResults.songs.filter((s) => s.source === 'youtube');
    if (activeSourceFilter === 'audius') return searchResults.songs.filter((s) => s.source === 'audius');
    if (activeSourceFilter === 'jamendo') return searchResults.songs.filter((s) => s.source === 'jamendo');
    if (activeSourceFilter === 'radiobrowser') return searchResults.songs.filter((s) => s.source === 'radiobrowser' || s.source === 'radio');
    return searchResults.songs;
  }, [searchResults.songs, activeSourceFilter]);

  // Filter final display songs based on active Category Tab
  const songsToShow = useMemo(() => {
    if (activeTab === 'radio') {
      return songsFilteredBySource.filter((s) => s.source === 'radiobrowser' || s.source === 'radio');
    }
    return songsFilteredBySource;
  }, [songsFilteredBySource, activeTab]);

  // Count matches per source
  const sourceCounts = useMemo(() => {
    const counts = { local: 0, youtube: 0, audius: 0, jamendo: 0, radiobrowser: 0 };
    searchResults.songs.forEach((s) => {
      if (!s.source || s.source === 'local') counts.local++;
      else if (s.source === 'youtube') counts.youtube++;
      else if (s.source === 'audius') counts.audius++;
      else if (s.source === 'jamendo') counts.jamendo++;
      else if (s.source === 'radiobrowser' || s.source === 'radio') counts.radiobrowser++;
    });
    return counts;
  }, [searchResults.songs]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (songsToShow.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % songsToShow.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (songsToShow.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + songsToShow.length) % songsToShow.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.detectedDirectTrack) {
        handlePlayTrack(searchResults.detectedDirectTrack);
        return;
      }
      if (songsToShow.length > 0 && songsToShow[selectedIndex]) {
        handlePlayTrack(songsToShow[selectedIndex]);
      }
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    if (onSelectTrack) {
      onSelectTrack(track);
    } else {
      playTrack(track);
    }
    onClose();
  };

  const handleSelectArtist = (artistName: string) => {
    setQuery(artistName);
    setActiveTab('songs');
  };

  const handleSelectAlbum = (albumName: string) => {
    setQuery(albumName);
    setActiveTab('songs');
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setCurrentView('playlist-detail');
    onClose();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasAnyResults =
    searchResults.songs.length > 0 ||
    searchResults.artists.length > 0 ||
    searchResults.albums.length > 0 ||
    searchResults.playlists.length > 0 ||
    !!searchResults.detectedDirectTrack;

  const topMatch = songsToShow.length > 0 ? songsToShow[0] : null;
  const contentViewState = !query
    ? 'landing'
    : !hasAnyResults && isSearchingExternal
      ? 'loading'
      : !hasAnyResults && !isSearchingExternal
        ? 'empty'
        : 'results';

  const getSourceBadgeStyle = (source?: string) => {
    switch (source) {
      case 'audius':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'jamendo':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'radio':
      case 'radiobrowser':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'youtube':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBackdrop
          id="aura-universal-search-modal"
          key="universal-search-backdrop"
          onClick={onClose}
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xl flex items-start justify-center p-3 sm:p-6 sm:pt-14 select-none"
        >
          <MotionModal
            ref={modalRef}
            variant="center"
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Universal Search'}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[88vh] rounded-2xl sm:rounded-3xl bg-[#0a0d18]/90 backdrop-blur-3xl flex flex-col overflow-hidden border border-white/[0.10] shadow-[0_32px_90px_rgba(0,0,0,0.95)]"
          >
        
        {/* -------------------------------------------------------------
            SEARCH HEADER BAR
            ------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.02]">
          <Search className={`w-5 h-5 shrink-0 transition-colors ${query ? 'text-sky-400' : 'text-zinc-500'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              youtubeService.isConfigured()
                ? 'Search tracks, artists, albums, spaces, radio or paste a YouTube link...'
                : 'Search your vault, Jamendo, Audius, Live Radio or paste a YouTube link...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none font-ui-body"
          />
          
          {isSearchingExternal && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-300 text-[11px] font-mono border border-sky-500/20 shrink-0 ${!prefersReducedMotion ? 'animate-pulse' : ''}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Federating sources...</span>
            </div>
          )}

          {onSelectTrack && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/30 shrink-0">
              {title || 'Room Selection'}
            </span>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 aura-pressable transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 aura-pressable transition-colors cursor-pointer"
            title="Close search (Esc)"
          >
            ESC
          </button>
        </div>

        {/* -------------------------------------------------------------
            CATEGORIES & SOURCE FILTER TABS (When results exist)
            ------------------------------------------------------------- */}
        {query && hasAnyResults && (
          <div className="px-4 py-2.5 glass-ambient border-b border-white/[0.08] flex flex-col gap-2 shrink-0">
            
            {/* Primary Category Tabs */}
            <LayoutGroup id="universal-search-tabs">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`relative px-3 py-1 rounded-xl font-medium aura-pressable transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'all' && (
                    <SharedIndicator
                      layoutId="universal-search-tab-pill"
                      className="absolute inset-0 rounded-xl bg-white shadow-sm pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">All Results</span>
                </button>

                {searchResults.songs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('songs')}
                    className={`relative px-3 py-1 rounded-xl font-medium aura-pressable transition-colors cursor-pointer ${
                      activeTab === 'songs'
                        ? 'text-zinc-950 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === 'songs' && (
                      <SharedIndicator
                        layoutId="universal-search-tab-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">Tracks ({searchResults.songs.length})</span>
                  </button>
                )}

                {searchResults.artists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('artists')}
                    className={`relative px-3 py-1 rounded-xl font-medium aura-pressable transition-colors cursor-pointer ${
                      activeTab === 'artists'
                        ? 'text-zinc-950 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === 'artists' && (
                      <SharedIndicator
                        layoutId="universal-search-tab-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">Artists ({searchResults.artists.length})</span>
                  </button>
                )}

                {searchResults.albums.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('albums')}
                    className={`relative px-3 py-1 rounded-xl font-medium aura-pressable transition-colors cursor-pointer ${
                      activeTab === 'albums'
                        ? 'text-zinc-950 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === 'albums' && (
                      <SharedIndicator
                        layoutId="universal-search-tab-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">Albums ({searchResults.albums.length})</span>
                  </button>
                )}

                {searchResults.playlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('playlists')}
                    className={`relative px-3 py-1 rounded-xl font-medium aura-pressable transition-colors cursor-pointer ${
                      activeTab === 'playlists'
                        ? 'text-zinc-950 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === 'playlists' && (
                      <SharedIndicator
                        layoutId="universal-search-tab-pill"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm pointer-events-none"
                      />
                    )}
                    <span className="relative z-10">Spaces ({searchResults.playlists.length})</span>
                  </button>
                )}

                {sourceCounts.radiobrowser > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('radio')}
                    className={`relative flex items-center gap-1 px-3 py-1 rounded-xl font-medium aura-pressable transition-colors cursor-pointer ${
                      activeTab === 'radio'
                        ? 'text-zinc-950 font-semibold'
                        : 'text-cyan-400 hover:bg-cyan-950/30'
                    }`}
                  >
                    {activeTab === 'radio' && (
                      <SharedIndicator
                        layoutId="universal-search-tab-pill"
                        className="absolute inset-0 rounded-xl bg-cyan-400 shadow-sm pointer-events-none"
                      />
                    )}
                    <RadioIcon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">Radio ({sourceCounts.radiobrowser})</span>
                  </button>
                )}
              </div>
            </LayoutGroup>

            {/* Source Origin Filters */}
            {(activeTab === 'all' || activeTab === 'songs') && searchResults.songs.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar pt-1 border-t border-white/[0.06]">
                <span className="text-zinc-500 font-mono uppercase text-[9px] mr-0.5">Source:</span>
                
                <button
                  onClick={() => setActiveSourceFilter('all')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    activeSourceFilter === 'all'
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Sources
                </button>

                {sourceCounts.local > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('local')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'local'
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-zinc-400 hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Local ({sourceCounts.local})</span>
                  </button>
                )}

                {sourceCounts.jamendo > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('jamendo')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'jamendo'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-zinc-400 hover:text-amber-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Jamendo ({sourceCounts.jamendo})</span>
                  </button>
                )}

                {sourceCounts.audius > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('audius')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'audius'
                        ? 'bg-purple-500/20 text-purple-300 font-semibold'
                        : 'text-zinc-400 hover:text-purple-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Audius ({sourceCounts.audius})</span>
                  </button>
                )}

                {sourceCounts.radiobrowser > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('radiobrowser')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'radiobrowser'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-zinc-400 hover:text-cyan-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Radio ({sourceCounts.radiobrowser})</span>
                  </button>
                )}

                {sourceCounts.youtube > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('youtube')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'youtube'
                        ? 'bg-red-500/20 text-red-300 font-semibold'
                        : 'text-zinc-400 hover:text-red-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>YouTube ({sourceCounts.youtube})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            CONTENT AREA — SCROLLABLE RESULTS / LANDING STATE
            ------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 custom-scrollbar">
          <AnimatePresence mode="wait" initial={false}>
            <MotionFadeSlide
              key={contentViewState}
              direction="up"
              distance={6}
              duration="micro"
              className="flex flex-col gap-6"
            >
          
          {/* Direct YouTube Video Link Banner */}
          {searchResults.detectedDirectTrack && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-black border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 overflow-hidden">
                  {searchResults.detectedDirectTrack.coverUrl ? (
                    <img src={searchResults.detectedDirectTrack.coverUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <Youtube className="w-6 h-6 fill-current" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 font-semibold flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full bg-red-400 ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
                    YOUTUBE URL RECOGNIZED
                  </span>
                  <h4 className="text-sm font-bold text-white truncate mt-0.5 font-ui-title">
                    {searchResults.detectedDirectTrack.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5 font-ui-meta">
                    {searchResults.detectedDirectTrack.artist} · Official IFrame API Stream
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePlayTrack(searchResults.detectedDirectTrack!)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-md aura-pressable aura-focus-ring transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{onSelectTrack ? 'Add to Room' : 'Play Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToQueue(searchResults.detectedDirectTrack!);
                    setQuery('');
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white aura-pressable transition-colors cursor-pointer"
                  title="Add to queue"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              LANDING EXPERIENCE (EMPTY QUERY)
              ------------------------------------------------------------- */}
          {!query && (
            <div className="flex flex-col gap-7 py-1">
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                      <History className="w-3 h-3 text-sky-400" />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="flex items-center gap-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs text-zinc-300 transition-colors group pr-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => setQuery(term)}
                          className="flex items-center gap-1.5 pl-3 pr-1 py-1.5 cursor-pointer aura-focus-ring rounded-l-xl"
                        >
                          <Search className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                          <span>{term}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(term)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded aura-focus-ring cursor-pointer"
                          title={`Remove search ${term}`}
                          aria-label={`Remove search ${term}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explore By Sound / Mood Categories */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-sky-400" />
                  Explore By Sound & Mood
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Ambient Space',
                    'Retro Synthwave',
                    'Lo-Fi Chill',
                    'Neo-Classical',
                    'Binaural 3D',
                    'Sub-Bass Dynamics',
                    'Live Radio',
                    'Jazz Lounge',
                    'Deep Focus',
                    'Night Drive',
                  ].map((mood) => (
                    <button
                      type="button"
                      key={mood}
                      onClick={() => setQuery(mood)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer font-ui-body aura-pressable aura-focus-ring"
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse Catalog Sources */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  Supported Catalog Sources
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  
                  {/* Personal Vault */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('local');
                      setActiveSourceFilter('local');
                    }}
                    className="p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-emerald-500/30 text-left transition-colors cursor-pointer group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-emerald-400 uppercase font-semibold">INDEXEDDB</span>
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1.5 font-ui-title group-hover:text-emerald-300">Personal Vault</h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-ui-meta line-clamp-1">{tracks.length} local files</p>
                  </button>

                  {/* Audius */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('audius');
                      setActiveSourceFilter('audius');
                    }}
                    className="p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-purple-500/30 text-left transition-colors cursor-pointer group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-purple-400 uppercase font-semibold">DECENTRALIZED</span>
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1.5 font-ui-title group-hover:text-purple-300">Audius Network</h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-ui-meta line-clamp-1">1M+ open tracks</p>
                  </button>

                  {/* Jamendo */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('jamendo');
                      setActiveSourceFilter('jamendo');
                    }}
                    className="p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-amber-500/30 text-left transition-colors cursor-pointer group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-amber-400 uppercase font-semibold">CREATIVE COMMONS</span>
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1.5 font-ui-title group-hover:text-amber-300">Jamendo Catalog</h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-ui-meta line-clamp-1">Free CC licensing</p>
                  </button>

                  {/* Radio Browser */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('radio');
                      setActiveTab('radio');
                    }}
                    className="p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-cyan-500/30 text-left transition-colors cursor-pointer group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-cyan-400 uppercase font-semibold">LIVE RADIO</span>
                      <RadioIcon className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1.5 font-ui-title group-hover:text-cyan-300">Radio Browser</h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-ui-meta line-clamp-1">30k+ live broadcasts</p>
                  </button>

                  {/* YouTube */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSourceFilter('youtube');
                      inputRef.current?.focus();
                    }}
                    className="p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-red-500/30 text-left transition-colors cursor-pointer group col-span-2 sm:col-span-1 aura-pressable-subtle aura-focus-ring"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-red-400 uppercase font-semibold">OFFICIAL IFRAME</span>
                      <Youtube className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mt-1.5 font-ui-title group-hover:text-red-300">YouTube Embed</h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-ui-meta line-clamp-1">Paste video URL or search</p>
                  </button>

                </div>
              </div>

            </div>
          )}

          {/* -------------------------------------------------------------
              ACTIVE SEARCH: BEST MATCH SPOTLIGHT CARD
              ------------------------------------------------------------- */}
          {query && topMatch && (activeTab === 'all' || activeTab === 'songs') && !searchResults.detectedDirectTrack && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Best Match
              </span>

              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  handlePlayTrack(topMatch);
                }}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handlePlayTrack(topMatch);
                  }
                }}
                aria-label={`Play best match ${topMatch.title} by ${topMatch.artist}`}
                className="group p-4 rounded-2xl bg-[#0e111a] hover:bg-[#141824] border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg aura-pressable-subtle aura-focus-ring"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/12 shrink-0 relative shadow-sm">
                    {topMatch.coverUrl ? (
                      <img src={topMatch.coverUrl} alt={topMatch.title} className={`w-full h-full object-cover transition-transform duration-300 ${canHover ? 'group-hover:scale-105' : ''}`} referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${topMatch.coverColor || 'from-indigo-900 to-black'} flex items-center justify-center text-white/80`}>
                        <Music className="w-7 h-7" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 fill-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-semibold uppercase ${getSourceBadgeStyle(topMatch.source)}`}>
                      {(topMatch.source || 'LOCAL').toUpperCase()} STREAM
                    </span>
                    <h3 className="text-base font-bold text-white truncate mt-1 font-ui-title group-hover:text-sky-300 transition-colors">
                      <HighlightMatch text={topMatch.title} query={query} />
                    </h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5 font-ui-meta">
                      <HighlightMatch text={topMatch.artist} query={query} />
                      {topMatch.album && <span> · {topMatch.album}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTrack(topMatch);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueue(topMatch);
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Add to queue"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ACTIVE SEARCH: TRACKS LIST
              ------------------------------------------------------------- */}
          {query && (activeTab === 'all' || activeTab === 'songs' || activeTab === 'radio') && songsToShow.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="uppercase tracking-widest font-semibold">
                  Tracks ({songsToShow.length})
                </span>
                <span>↑↓ navigate · Enter to play</span>
              </div>

              <div className="flex flex-col gap-1">
                {songsToShow.map((song, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isCurrent = currentTrack?.id === song.id;

                  return (
                    <div
                      key={song.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        handlePlayTrack(song);
                      }}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handlePlayTrack(song);
                        }
                      }}
                      aria-label={`Play ${song.title} by ${song.artist}`}
                      className={`group cursor-pointer flex items-center justify-between p-2.5 rounded-2xl border transition-colors aura-focus-ring ${
                        isSelected
                          ? 'bg-[#121624] border-sky-500/40 shadow-sm ring-1 ring-sky-500/20'
                          : 'hover:bg-white/[0.03] border-transparent hover:border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* 40x40 artwork */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 relative shadow-sm">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${song.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white`}>
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 fill-white translate-x-0.5" />
                          </div>
                        </div>

                        {/* Title and metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-semibold truncate font-ui-title ${isCurrent ? 'text-sky-300' : 'text-zinc-100 group-hover:text-white'}`}>
                              <HighlightMatch text={song.title} query={query} />
                            </h4>

                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${getSourceBadgeStyle(song.source)}`}>
                              {(song.source || 'LOCAL').toUpperCase()}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta">
                            <HighlightMatch text={song.artist} query={query} />
                            {song.album && <span> · <HighlightMatch text={song.album} query={query} /></span>}
                          </p>
                        </div>
                      </div>

                      {/* Right duration & actions */}
                      <div className="flex items-center gap-3 shrink-0 pl-2">
                        {song.duration > 0 && (
                          <span className="text-xs font-mono text-zinc-500 tabular-nums">
                            {formatTime(song.duration)}
                          </span>
                        )}

                        <div
                          className={`flex items-center gap-1 transition-opacity ${
                            !canHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => addToQueue(song)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
                            title="Add to queue"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(song.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
                            title={song.isFavorite ? 'Remove favorite' : 'Add favorite'}
                          >
                            <motion.span
                              className="inline-flex items-center justify-center"
                              animate={!prefersReducedMotion && song.isFavorite ? { scale: [1, 1.24, 1] } : { scale: 1 }}
                              transition={MOTION_TRANSITION.micro}
                            >
                              <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </motion.span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ACTIVE SEARCH: ARTISTS SHELF
              ------------------------------------------------------------- */}
          {query && (activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Artists ({searchResults.artists.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {searchResults.artists.map((artist) => (
                  <div
                    key={artist.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectArtist(artist.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectArtist(artist.name);
                      }
                    }}
                    className="p-3 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-white/20 transition-colors cursor-pointer flex items-center gap-3 group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className={`w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 transition-transform duration-200 ${canHover ? 'group-hover:scale-105' : ''}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate font-ui-title group-hover:text-sky-300 transition-colors">
                        <HighlightMatch text={artist.name} query={query} />
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {artist.trackCount} {artist.trackCount === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ACTIVE SEARCH: ALBUMS SHELF
              ------------------------------------------------------------- */}
          {query && (activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Albums ({searchResults.albums.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {searchResults.albums.map((album) => (
                  <div
                    key={`${album.name}-${album.artist}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectAlbum(album.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectAlbum(album.name);
                      }
                    }}
                    className="p-3 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-white/20 transition-colors cursor-pointer flex items-center gap-3 group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                      {album.coverUrl ? (
                        <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <Disc className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate font-ui-title group-hover:text-sky-300 transition-colors">
                        <HighlightMatch text={album.name} query={query} />
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta">
                        {album.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ACTIVE SEARCH: SPACES / PLAYLISTS
              ------------------------------------------------------------- */}
          {query && (activeTab === 'all' || activeTab === 'playlists') && searchResults.playlists.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Spaces ({searchResults.playlists.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.playlists.map((pl) => (
                  <div
                    key={pl.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPlaylist(pl.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectPlaylist(pl.id);
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#121624] border border-white/[0.06] hover:border-white/20 transition-colors cursor-pointer flex items-center gap-3.5 group aura-pressable-subtle aura-focus-ring"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pl.coverGradient || 'from-sky-500 to-indigo-600'} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate font-ui-title group-hover:text-sky-300 transition-colors">
                        <HighlightMatch text={pl.title} query={query} />
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {pl.trackCount} tracks in space
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Skeleton Feedback while fetching external sources */}
          {query && !hasAnyResults && isSearchingExternal && (
            <div className="flex flex-col gap-2 py-2" aria-busy="true" aria-label="Searching streams">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="w-10 h-10 rounded-lg aura-skeleton shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3.5 w-2/5 rounded aura-skeleton" />
                    <div className="h-2.5 w-1/4 rounded aura-skeleton" />
                  </div>
                  <div className="h-3 w-12 rounded aura-skeleton shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Empty Search Result Feedback */}
          {query && !hasAnyResults && !isSearchingExternal && (
            <div className="p-10 rounded-2xl bg-[#0c0e17] border border-white/[0.06] text-center flex flex-col items-center justify-center gap-3">
              <Search className="w-8 h-8 text-zinc-600" />
              <h4 className="text-sm font-semibold text-white">No results found for &quot;{query}&quot;</h4>
              <p className="text-xs text-zinc-400 max-w-sm font-ui-meta">
                Try searching for an artist, album, genre, or paste a YouTube video link to stream directly.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-zinc-200 aura-pressable aura-focus-ring transition-colors cursor-pointer"
              >
                Clear Query
              </button>
            </div>
          )}

            </MotionFadeSlide>
          </AnimatePresence>
        </div>

          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
