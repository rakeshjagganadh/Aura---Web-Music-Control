import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { MotionFadeSlide, MotionModal } from '../common/motion/MotionSurface';
import { SharedIndicator } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
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
  FolderOpen,
  Globe,
  Compass,
  ArrowRight
} from 'lucide-react';
import { universalSearchCoordinator, UniversalSearchResults } from '../../services/sourceAdapters';
import { youtubeService } from '../../services/youtubeService';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MobileTab = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

const QUICK_MOODS = [
  { label: 'Ambient', query: 'Ambient', icon: '🌌' },
  { label: 'Focus', query: 'Focus', icon: '🧠' },
  { label: 'Night Drive', query: 'Synthwave', icon: '🌃' },
  { label: 'Cyberpunk', query: 'Cyberpunk', icon: '⚡' },
  { label: 'Lo-Fi Chill', query: 'Lo-Fi', icon: '☕' },
  { label: 'Deep Techno', query: 'Techno', icon: '🎛️' },
  { label: 'Cinematic', query: 'Cinematic', icon: '🎬' },
  { label: 'Neo-Soul', query: 'Soul', icon: '🎷' },
];

const HighlightText: React.FC<{ text: string; query: string; className?: string }> = ({ text, query, className = '' }) => {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-sky-300 font-semibold underline decoration-sky-400/50 underline-offset-2">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    tracks,
    playlists,
    playTrack,
    addToQueue,
    setSelectedPlaylistId,
    setCurrentView,
    setIsUploadModalOpen,
    currentTrack,
    isPlaying,
    togglePlay,
  } = useMusic();

  const { prefersReducedMotion } = useMotionCapabilities();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MobileTab>('all');
  const [searchResults, setSearchResults] = useState<UniversalSearchResults>({
    query: '',
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
    sourceStatus: { local: 'ready', youtube: 'not_configured', audius: 'ready' },
  });
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);

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
  const debounceTimerRef = useRef<any>(null);
  const modalRef = useDialogAccessibility<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

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
      return;
    }

    // 1. Instant local search execution
    const results = await universalSearchCoordinator.search(
      q, 
      { tracks, playlists }, 
      { includeYouTube: false, includeAudius: false, includeJamendo: false, includeRadio: false }
    );
    setSearchResults(results);

    // 2. Debounced External query execution
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

  const handlePlayTrack = (track: Track) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    playTrack(track);
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

  const hasAnyResults =
    searchResults.songs.length > 0 ||
    searchResults.artists.length > 0 ||
    searchResults.albums.length > 0 ||
    searchResults.playlists.length > 0 ||
    !!searchResults.detectedDirectTrack;

  const bestMatch = searchResults.songs[0];
  const contentViewState = !query
    ? 'landing'
    : !hasAnyResults && isSearchingExternal
      ? 'loading'
      : !hasAnyResults && !isSearchingExternal
        ? 'empty'
        : 'results';

  const getSourceBadgeStyle = (source?: string) => {
    switch (source) {
      case 'audius': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'jamendo': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'radio':
      case 'radiobrowser': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'youtube': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionModal
          ref={modalRef}
          id="mobile-search-modal"
          key="mobile-search-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Search Audio"
          variant="bottom-sheet"
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          className="lg:hidden fixed inset-0 z-50 bg-[#07080e]/98 backdrop-blur-3xl text-zinc-100 flex flex-col pt-safe pb-safe select-none"
        >
      {/* Top Search Input Bar */}
      <div className="p-3 sm:p-4 border-b border-white/[0.08] flex items-center gap-2.5 bg-zinc-950/95 sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all 5 catalogs or paste YouTube link..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-sky-500/50 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors shadow-inner font-ui-body"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white active:bg-white/10 rounded-xl aura-pressable transition-colors cursor-pointer shrink-0 min-h-[44px] flex items-center justify-center"
        >
          Done
        </button>
      </div>

      {/* Category Tabs & Searching Indicator */}
      {query && hasAnyResults && (
        <div className="px-3 py-2 bg-zinc-950/80 border-b border-white/[0.06] flex items-center justify-between gap-2 overflow-x-auto text-xs scrollbar-none sticky top-[69px] z-10 backdrop-blur-md">
          <LayoutGroup id="mobile-search-tabs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium aura-pressable transition-colors cursor-pointer shrink-0 min-h-[36px] flex items-center ${
                  activeTab === 'all'
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                {activeTab === 'all' && (
                  <SharedIndicator
                    layoutId="mobile-search-tab-pill"
                    className="absolute inset-0 rounded-lg bg-white/15 pointer-events-none"
                  />
                )}
                <span className="relative z-10">All Results</span>
              </button>

              {searchResults.songs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('songs')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium aura-pressable transition-colors cursor-pointer shrink-0 min-h-[36px] flex items-center ${
                    activeTab === 'songs'
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'songs' && (
                    <SharedIndicator
                      layoutId="mobile-search-tab-pill"
                      className="absolute inset-0 rounded-lg bg-white/15 pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">Songs ({searchResults.songs.length})</span>
                </button>
              )}

              {searchResults.artists.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('artists')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium aura-pressable transition-colors cursor-pointer shrink-0 min-h-[36px] flex items-center ${
                    activeTab === 'artists'
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'artists' && (
                    <SharedIndicator
                      layoutId="mobile-search-tab-pill"
                      className="absolute inset-0 rounded-lg bg-white/15 pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">Artists ({searchResults.artists.length})</span>
                </button>
              )}

              {searchResults.albums.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('albums')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium aura-pressable transition-colors cursor-pointer shrink-0 min-h-[36px] flex items-center ${
                    activeTab === 'albums'
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'albums' && (
                    <SharedIndicator
                      layoutId="mobile-search-tab-pill"
                      className="absolute inset-0 rounded-lg bg-white/15 pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">Albums ({searchResults.albums.length})</span>
                </button>
              )}

              {searchResults.playlists.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('playlists')}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium aura-pressable transition-colors cursor-pointer shrink-0 min-h-[36px] flex items-center ${
                    activeTab === 'playlists'
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {activeTab === 'playlists' && (
                    <SharedIndicator
                      layoutId="mobile-search-tab-pill"
                      className="absolute inset-0 rounded-lg bg-white/15 pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">Spaces ({searchResults.playlists.length})</span>
                </button>
              )}
            </div>
          </LayoutGroup>

          {isSearchingExternal && (
            <div className={`flex items-center gap-1.5 text-[10px] text-sky-400 font-mono tracking-wider shrink-0 pl-2 ${!prefersReducedMotion ? 'animate-pulse' : ''}`}>
              <Sparkles className="w-3 h-3" />
              <span>LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Results & Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-5">
        <AnimatePresence mode="wait" initial={false}>
          <MotionFadeSlide
            key={contentViewState}
            direction="up"
            distance={6}
            duration="micro"
            className="flex flex-col gap-5"
          >
        
        {/* Direct YouTube Video Link Card */}
        {searchResults.detectedDirectTrack && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-black border border-red-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 overflow-hidden">
                {searchResults.detectedDirectTrack.coverUrl ? (
                  <img src={searchResults.detectedDirectTrack.coverUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <Youtube className="w-6 h-6 fill-current" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono tracking-wider text-red-300 font-bold uppercase flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full bg-red-400 ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
                  YouTube Link Detected
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-0.5 font-ui-title">
                  {searchResults.detectedDirectTrack.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate font-ui-meta">
                  {searchResults.detectedDirectTrack.artist}
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayTrack(searchResults.detectedDirectTrack!)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shrink-0 cursor-pointer shadow-md min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>
          </div>
        )}

        {/* Empty Search Prompt / Recent Searches / Mood Discovery */}
        {!query && (
          <div className="flex flex-col gap-6">
            
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-sky-400" />
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition-colors p-1"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden min-h-[38px]"
                    >
                      <button
                        type="button"
                        onClick={() => setQuery(term)}
                        className="flex items-center gap-2 pl-3 pr-1.5 py-2 hover:bg-white/[0.06] text-xs text-zinc-300 cursor-pointer aura-focus-ring"
                      >
                        <Search className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate max-w-[160px] font-ui-body">{term}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecentSearch(term)}
                        className="text-zinc-500 hover:text-rose-400 p-2 rounded-r-xl cursor-pointer aura-focus-ring"
                        aria-label={`Remove ${term}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Sonic Moods */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Sonic Mood Discovery
              </span>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_MOODS.map((mood) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setQuery(mood.query)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-left text-xs text-zinc-200 transition-colors aura-pressable aura-focus-ring cursor-pointer min-h-[44px]"
                  >
                    <span className="text-base shrink-0">{mood.icon}</span>
                    <span className="font-medium text-xs text-zinc-200 truncate font-ui-body">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Sources Catalog Pillars */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Catalog Sources
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCurrentView('library');
                  }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left flex items-center justify-between min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-200 truncate font-ui-title">Local Vault</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-emerald-400/60 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setQuery('Audius')}
                  className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-left flex items-center justify-between min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-xs font-semibold text-purple-200 truncate font-ui-title">Audius Live</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-purple-400/60 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setQuery('Jamendo')}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-center justify-between min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold text-amber-200 truncate font-ui-title">Jamendo CC</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-amber-400/60 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCurrentView('sources');
                  }}
                  className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-left flex items-center justify-between min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <RadioIcon className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs font-semibold text-sky-200 truncate font-ui-title">World Radio</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-sky-400/60 shrink-0" />
                </button>
              </div>
            </div>

            {/* Recent Tracks in Library */}
            {tracks.length > 0 && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  From Your Vault ({tracks.length})
                </span>
                <div className="flex flex-col gap-1.5">
                  {tracks.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play ${track.title} by ${track.artist}`}
                      onClick={() => handlePlayTrack(track)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlayTrack(track);
                        }
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] active:bg-white/[0.1] cursor-pointer min-h-[48px] aura-focus-ring"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/10 relative">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-sky-600 to-zinc-900'} flex items-center justify-center text-white`}>
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-zinc-200 truncate font-ui-title">{track.title}</h5>
                        <p className="text-[11px] text-zinc-500 truncate font-ui-meta">{track.artist}</p>
                      </div>
                      <Play className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Best Match Spotlight Card (when search results exist and in 'all' tab) */}
        {query && activeTab === 'all' && bestMatch && !searchResults.detectedDirectTrack && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.08] via-zinc-900/90 to-black border border-white/[0.12] shadow-xl relative overflow-hidden">
            <div className="text-[10px] font-mono tracking-widest uppercase text-sky-400 font-bold mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Top Match</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 relative shadow-md">
                {bestMatch.coverUrl ? (
                  <img src={bestMatch.coverUrl} alt={bestMatch.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${bestMatch.coverColor || 'from-sky-600 to-zinc-900'} flex items-center justify-center text-white`}>
                    <Music className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate font-ui-title">
                  <HighlightText text={bestMatch.title} query={query} />
                </h3>
                <p className="text-xs text-zinc-400 truncate mt-0.5 font-ui-meta">
                  <HighlightText text={bestMatch.artist} query={query} />
                </p>
                <div className="text-[10px] font-mono mt-1">
                  <span className={`px-1.5 py-0.2 rounded border font-semibold uppercase ${getSourceBadgeStyle(bestMatch.source)}`}>
                    {bestMatch.source === 'radiobrowser' ? 'RADIO' : (bestMatch.source || 'LOCAL')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePlayTrack(bestMatch)}
                className="w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg aura-pressable aura-focus-ring transition-transform shrink-0 cursor-pointer"
                aria-label="Play top match"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* Songs List */}
        {query && (activeTab === 'all' || activeTab === 'songs') && searchResults.songs.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Songs ({searchResults.songs.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {searchResults.songs.map((song) => {
                const isPlayingThis = currentTrack?.id === song.id;

                return (
                  <div
                    key={song.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${song.title} by ${song.artist}`}
                    onClick={() => handlePlayTrack(song)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handlePlayTrack(song);
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer min-h-[56px] aura-focus-ring"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 relative">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${song.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white`}>
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                        {isPlayingThis && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-sky-400">
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-semibold truncate font-ui-title ${isPlayingThis ? 'text-sky-300' : 'text-zinc-100'}`}>
                          <HighlightText text={song.title} query={query} />
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate mt-0.5">
                          <span className="truncate font-ui-meta">
                            <HighlightText text={song.artist} query={query} />
                          </span>
                          <span className="text-zinc-600">·</span>
                          <span className={`text-[9px] font-mono px-1 py-0.2 rounded border uppercase shrink-0 font-semibold ${getSourceBadgeStyle(song.source)}`}>
                            {song.source === 'radiobrowser' ? 'RADIO' : (song.source || 'LOCAL')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                      }}
                      className="p-3 text-zinc-400 hover:text-white shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Add to queue"
                      aria-label="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Artists Section */}
        {query && (activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Artists ({searchResults.artists.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {searchResults.artists.map((artist) => (
                <div
                  key={artist.name}
                  role="button"
                  tabIndex={0}
                  aria-label={`Filter by artist ${artist.name}`}
                  onClick={() => handleSelectArtist(artist.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectArtist(artist.name);
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] active:bg-white/[0.08] flex items-center gap-3 cursor-pointer min-h-[48px] aura-focus-ring"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20 overflow-hidden">
                    {artist.sampleCover ? (
                      <img src={artist.sampleCover} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100 truncate font-ui-title">
                      <HighlightText text={artist.name} query={query} />
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">{artist.trackCount} {artist.trackCount === 1 ? 'track' : 'tracks'}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mr-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Albums Section */}
        {query && (activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Albums ({searchResults.albums.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {searchResults.albums.map((album) => (
                <div
                  key={`${album.name}-${album.artist}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Filter by album ${album.name}`}
                  onClick={() => handleSelectAlbum(album.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectAlbum(album.name);
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] active:bg-white/[0.08] flex items-center gap-3 cursor-pointer min-h-[48px] aura-focus-ring"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                    ) : (
                      <Disc className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100 truncate font-ui-title">
                      <HighlightText text={album.name} query={query} />
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate font-ui-meta">{album.artist} · {album.trackCount} tracks</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mr-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playlists / Spaces Section */}
        {query && (activeTab === 'all' || activeTab === 'playlists') && searchResults.playlists.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Spaces & Playlists ({searchResults.playlists.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {searchResults.playlists.map((pl) => (
                <div
                  key={pl.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open space ${pl.title}`}
                  onClick={() => handleSelectPlaylist(pl.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectPlaylist(pl.id);
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] active:bg-white/[0.08] flex items-center gap-3 cursor-pointer min-h-[48px] aura-focus-ring"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pl.coverGradient || 'from-sky-600 to-indigo-800'} flex items-center justify-center shrink-0 border border-white/10 overflow-hidden`}>
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100 truncate font-ui-title">
                      <HighlightText text={pl.title} query={query} />
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">{pl.trackCount} tracks</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mr-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeleton Feedback while external federation runs */}
        {query && !hasAnyResults && isSearchingExternal && (
          <div
            className="flex flex-col gap-2"
            aria-busy="true"
            aria-label="Searching across catalogs"
          >
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] min-h-[56px]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl aura-skeleton shrink-0" />
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <div className="h-3.5 w-3/5 rounded aura-skeleton" />
                    <div className="h-2.5 w-2/5 rounded aura-skeleton" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg aura-skeleton shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Zero Results Handling */}
        {query && !hasAnyResults && !isSearchingExternal && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-600 mb-1">
              <Search className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-sm font-bold text-zinc-200">No matches found for &quot;{query}&quot;</p>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-ui-meta">
              Check spelling, try exploring different genres, or paste any YouTube video link directly.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsUploadModalOpen(true);
              }}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 aura-pressable cursor-pointer min-h-[44px]"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Import Audio Files</span>
            </button>
          </div>
        )}

          </MotionFadeSlide>
        </AnimatePresence>
      </div>
        </MotionModal>
      )}
    </AnimatePresence>
  );
};
