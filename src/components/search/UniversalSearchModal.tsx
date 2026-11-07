import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { 
  Search, 
  X, 
  Play, 
  Music, 
  Disc, 
  User, 
  Radio, 
  Youtube, 
  HardDrive,
  Plus, 
  Key,
  Sparkles,
  FolderOpen,
  History,
  Tag,
  ListMusic,
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
          <span key={i} className="bg-indigo-500/30 text-indigo-200 font-semibold px-0.5 rounded">
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
    setIsUploadModalOpen,
    showToast,
  } = useMusic();

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
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(youtubeService.getApiKey());

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

  // Focus and sync on open
  useEffect(() => {
    if (isOpen) {
      if (initialQuery !== undefined) {
        setQuery(initialQuery);
      }
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen, initialQuery]);

  // Execute search when query changes
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

    // 2. Debounced External execution
    const isDirectYt = !!youtubeService.parseVideoId(q);
    const shouldSearchExternal = isDirectYt || (youtubeService.isConfigured() && q.length > 1) || q.length > 1;

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
      }, isDirectYt ? 50 : 350);
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

  // Save custom YouTube API Key handler
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    youtubeService.setCustomApiKey(customApiKey.trim());
    setShowApiKeyInput(false);
    executeSearch(query);
  };

  // Filter songs by source if source filter is active
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

  if (!isOpen) return null;

  const hasAnyResults =
    searchResults.songs.length > 0 ||
    searchResults.artists.length > 0 ||
    searchResults.albums.length > 0 ||
    searchResults.playlists.length > 0 ||
    !!searchResults.detectedDirectTrack;

  return (
    <div
      id="aura-universal-search-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-start justify-center p-3 sm:p-6 sm:pt-14 animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-3xl max-h-[88vh] rounded-3xl bg-[#0a0d16]/90 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-zinc-950/80">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              youtubeService.isConfigured()
                ? 'Search tracks, artists, albums, playlists, radio stations or paste a YouTube link...'
                : 'Search your library, Jamendo, Audius, Radio or paste a YouTube link...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          
          {isSearchingExternal && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 text-[11px] font-mono border border-indigo-500/20 animate-pulse shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Searching online...</span>
            </div>
          )}

          {onSelectTrack && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 shrink-0">
              {title || 'Adding to Shared Room'}
            </span>
          )}

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Categories & Source Filter Tabs */}
        {query && hasAnyResults && (
          <div className="px-4 py-2 bg-zinc-950/90 border-b border-white/5 flex flex-col gap-2">
            {/* Primary Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                All Results
              </button>

              {searchResults.songs.length > 0 && (
                <button
                  onClick={() => setActiveTab('songs')}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'songs'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Songs ({searchResults.songs.length})
                </button>
              )}

              {searchResults.artists.length > 0 && (
                <button
                  onClick={() => setActiveTab('artists')}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'artists'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Artists ({searchResults.artists.length})
                </button>
              )}

              {searchResults.albums.length > 0 && (
                <button
                  onClick={() => setActiveTab('albums')}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'albums'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Albums ({searchResults.albums.length})
                </button>
              )}

              {searchResults.playlists.length > 0 && (
                <button
                  onClick={() => setActiveTab('playlists')}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'playlists'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Spaces ({searchResults.playlists.length})
                </button>
              )}

              {sourceCounts.radiobrowser > 0 && (
                <button
                  onClick={() => setActiveTab('radio')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                    activeTab === 'radio'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Radio ({sourceCounts.radiobrowser})</span>
                </button>
              )}
            </div>

            {/* Secondary Source Filter Pills (When 'songs' or 'all' is active) */}
            {(activeTab === 'all' || activeTab === 'songs') && searchResults.songs.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none pt-1 border-t border-white/5">
                <span className="text-zinc-500 font-mono uppercase text-[9px] mr-1">Source:</span>
                
                <button
                  onClick={() => setActiveSourceFilter('all')}
                  className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    activeSourceFilter === 'all'
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All Sources
                </button>

                {sourceCounts.local > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('local')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'local'
                        ? 'bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-emerald-300'
                    }`}
                  >
                    <HardDrive className="w-3 h-3" />
                    <span>Local ({sourceCounts.local})</span>
                  </button>
                )}

                {sourceCounts.jamendo > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('jamendo')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'jamendo'
                        ? 'bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40'
                        : 'text-zinc-400 hover:text-amber-300'
                    }`}
                  >
                    <Music className="w-3 h-3" />
                    <span>Jamendo ({sourceCounts.jamendo})</span>
                  </button>
                )}

                {sourceCounts.audius > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('audius')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'audius'
                        ? 'bg-purple-500/30 text-purple-300 font-semibold border border-purple-500/40'
                        : 'text-zinc-400 hover:text-purple-300'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>Audius ({sourceCounts.audius})</span>
                  </button>
                )}

                {sourceCounts.radiobrowser > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('radiobrowser')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'radiobrowser'
                        ? 'bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-zinc-400 hover:text-cyan-300'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>Radio ({sourceCounts.radiobrowser})</span>
                  </button>
                )}

                {sourceCounts.youtube > 0 && (
                  <button
                    onClick={() => setActiveSourceFilter('youtube')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSourceFilter === 'youtube'
                        ? 'bg-red-500/30 text-red-300 font-semibold border border-red-500/40'
                        : 'text-zinc-400 hover:text-red-300'
                    }`}
                  >
                    <Youtube className="w-3 h-3" />
                    <span>YouTube ({sourceCounts.youtube})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-6">
          
          {/* Direct YouTube Video Link Card */}
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      YOUTUBE LINK DETECTED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mt-1">
                    {searchResults.detectedDirectTrack.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate">
                    {searchResults.detectedDirectTrack.artist} • Ready to stream & play
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePlayTrack(searchResults.detectedDirectTrack!)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{onSelectTrack ? 'Add to Room Queue' : 'Play Now'}</span>
              </button>
            </div>
          )}

          {/* Empty Search Prompt */}
          {!query && (
            <div className="flex flex-col gap-6 py-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  Universal Music Search
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  Type any song title, artist, album, playlist, radio station, or paste a direct YouTube video link.
                </p>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
                      <History className="w-3 h-3 text-indigo-400" />
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-xs text-zinc-300 transition-colors group cursor-pointer"
                        onClick={() => setQuery(term)}
                      >
                        <Search className="w-3 h-3 text-indigo-400" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded ml-0.5"
                          title="Remove search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Library Artists */}
              {tracks.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                    Artists in Your Library
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(tracks.map((t) => t.artist).filter(Boolean))).slice(0, 10).map((art) => (
                      <button
                        key={art}
                        onClick={() => setQuery(art)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 text-xs text-zinc-300 transition-colors cursor-pointer"
                      >
                        <User className="w-3 h-3 text-indigo-400" />
                        <span>{art}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audius Status Info Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-purple-400 shrink-0" />
                  <p className="text-xs text-zinc-400">
                    <span className="text-purple-300 font-semibold">Audius Decentralized Network</span> is live for universal discovery & audio streaming.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  Ready
                </span>
              </div>

              {/* YouTube Status Info Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-zinc-400">
                    {youtubeService.isConfigured() ? (
                      <span className="text-emerald-400">
                        YouTube Data API Connected. Live YouTube search is active.
                      </span>
                    ) : (
                      <span>
                        YouTube URL embeds active. Set <code className="text-indigo-300 font-mono">YOUTUBE_DATA_API_KEY</code> for live YouTube search.
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-white/5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Key className="w-3 h-3 inline-block mr-1" />
                  {showApiKeyInput ? 'Hide' : 'API Key'}
                </button>
              </div>

              {showApiKeyInput && (
                <form onSubmit={handleSaveApiKey} className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">Custom YouTube Data API Key</label>
                    <span className="text-[10px] font-mono text-zinc-400">Optional</span>
                  </div>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Save Key
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Songs & Radio Section */}
          {query && (activeTab === 'all' || activeTab === 'songs' || activeTab === 'radio') && songsToShow.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  Songs & Streams ({songsToShow.length})
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  ↑↓ navigate • Enter to play
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {songsToShow.map((song, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isYouTube = song.source === 'youtube';
                  const isAudius = song.source === 'audius';
                  const isJamendo = song.source === 'jamendo';
                  const isRadio = song.source === 'radiobrowser' || song.source === 'radio';

                  // Group separators for 'all' tab
                  const getSourceGroup = (s: string) => {
                    if (s === 'youtube') return { label: 'YouTube Music', icon: Youtube, color: 'text-red-400' };
                    if (s === 'audius') return { label: 'Audius Catalog', icon: Radio, color: 'text-purple-400' };
                    if (s === 'jamendo') return { label: 'Jamendo Music', icon: Music, color: 'text-amber-400' };
                    if (s === 'radiobrowser' || s === 'radio') return { label: 'Live Radio Stations', icon: Radio, color: 'text-cyan-400' };
                    return { label: 'Local Vault & Curated', icon: HardDrive, color: 'text-emerald-400' };
                  };

                  const currentGroup = getSourceGroup(song.source);
                  const prevGroup = idx > 0 ? getSourceGroup(songsToShow[idx - 1].source) : null;
                  const isFirstInGroup = activeTab === 'all' && activeSourceFilter === 'all' && currentGroup.label !== prevGroup?.label;

                  return (
                    <React.Fragment key={song.id}>
                      {isFirstInGroup && (
                        <div className="pt-3 pb-1.5 flex items-center gap-2 border-b border-white/5 first:pt-1">
                          <currentGroup.icon className={`w-3.5 h-3.5 ${currentGroup.color}`} />
                          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-300">
                            {currentGroup.label}
                          </span>
                        </div>
                      )}
                      <div
                        onClick={() => handlePlayTrack(song)}
                        className={`group cursor-pointer flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                            : 'hover:bg-white/[0.04] border-transparent hover:border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10 relative">
                            {song.coverUrl ? (
                              <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${song.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white`}>
                                <Music className="w-4 h-4" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-4 h-4 fill-white" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 truncate">
                                <HighlightMatch text={song.title} query={query} />
                              </h4>

                              {isYouTube ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0 flex items-center gap-1 font-semibold">
                                  <Youtube className="w-2.5 h-2.5" />
                                  YOUTUBE
                                </span>
                              ) : isAudius ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 flex items-center gap-1 font-semibold">
                                  <Radio className="w-2.5 h-2.5" />
                                  AUDIUS
                                </span>
                              ) : isJamendo ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1 font-semibold">
                                  <Music className="w-2.5 h-2.5" />
                                  JAMENDO
                                </span>
                              ) : isRadio ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0 flex items-center gap-1 font-semibold">
                                  <Radio className="w-2.5 h-2.5" />
                                  RADIO
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1 font-semibold">
                                  <HardDrive className="w-2.5 h-2.5" />
                                  LOCAL
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              <HighlightMatch text={song.artist} query={query} />
                              {song.album && song.album !== 'YouTube Stream' && song.album !== 'Audius Stream' && (
                                <span> • <HighlightMatch text={song.album} query={query} /></span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectTrack) {
                                onSelectTrack(song);
                                onClose();
                              } else {
                                addToQueue(song);
                                showToast?.(`"${song.title}" added to queue`, 'success');
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/5 transition-colors cursor-pointer"
                            title={onSelectTrack ? 'Add to room queue' : 'Add to queue'}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {query && (activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Artists ({searchResults.artists.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {searchResults.artists.map((artist) => (
                  <div
                    key={artist.name}
                    onClick={() => handleSelectArtist(artist.name)}
                    className="p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 flex items-center gap-2.5 cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20 overflow-hidden">
                      {artist.sampleCover ? (
                        <img src={artist.sampleCover} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 truncate">
                        <HighlightMatch text={artist.name} query={query} />
                      </p>
                      <p className="text-[10px] text-zinc-500">{artist.trackCount} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {query && (activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Albums ({searchResults.albums.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {searchResults.albums.map((album) => (
                  <div
                    key={`${album.name}-${album.artist}`}
                    onClick={() => handleSelectAlbum(album.name)}
                    className="p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 flex items-center gap-2.5 cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                      {album.coverUrl ? (
                        <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <Disc className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 truncate">
                        <HighlightMatch text={album.name} query={query} />
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">{album.artist} • {album.trackCount} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists / Spaces Section */}
          {query && (activeTab === 'all' || activeTab === 'playlists') && searchResults.playlists.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Spaces & Playlists ({searchResults.playlists.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {searchResults.playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handleSelectPlaylist(pl.id)}
                    className="p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 flex items-center gap-3 cursor-pointer transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                      {pl.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-indigo-300 truncate">
                        <HighlightMatch text={pl.title} query={query} />
                      </p>
                      <p className="text-[10px] text-zinc-500">{pl.trackCount} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zero Results Handling */}
          {query && !hasAnyResults && (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <Search className="w-10 h-10 text-zinc-600 mb-1 opacity-50" />
              <div>
                <p className="text-sm font-bold text-zinc-200">No matches found for &quot;{query}&quot;</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  No local songs, artists, or playlists matched your search. You can import audio files or paste a direct YouTube video URL.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => {
                    onClose();
                    setIsUploadModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Import Music Files</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
