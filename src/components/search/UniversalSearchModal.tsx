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
  ListMusic, 
  Radio, 
  Youtube, 
  HardDrive,
  Plus, 
  Key,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { universalSearchCoordinator, UniversalSearchResults, SearchMatchArtist, SearchMatchAlbum, SearchMatchPlaylist } from '../../services/sourceAdapters';
import { youtubeService } from '../../services/youtubeService';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack?: (track: Track) => void;
  title?: string;
}

type SearchTab = 'all' | 'songs' | 'audius' | 'youtube' | 'artists' | 'albums' | 'playlists';

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

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ isOpen, onClose, onSelectTrack, title }) => {
  const {
    tracks,
    playlists,
    playTrack,
    addToQueue,
    setSelectedPlaylistId,
    setCurrentView,
    setIsUploadModalOpen,
  } = useMusic();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
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

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Execute search when query or tracks change
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
      { includeYouTube: false, includeAudius: false }
    );
    setSearchResults(results);
    setSelectedIndex(0);

    // 2. Debounced External execution (YouTube & Audius)
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

  // Filtered lists based on active tab
  const songsToShow = useMemo(() => {
    if (activeTab === 'youtube') {
      return searchResults.songs.filter((s) => s.source === 'youtube');
    }
    if (activeTab === 'audius') {
      return searchResults.songs.filter((s) => s.source === 'audius');
    }
    if (activeTab === 'songs') {
      return searchResults.songs;
    }
    // 'all' tab: Group naturally by source: YouTube, Audius, then Local/catalog
    const yt = searchResults.songs.filter((s) => s.source === 'youtube');
    const aud = searchResults.songs.filter((s) => s.source === 'audius');
    const loc = searchResults.songs.filter((s) => s.source !== 'youtube' && s.source !== 'audius');
    return [...yt, ...aud, ...loc];
  }, [searchResults.songs, activeTab]);

  const ytSongsCount = useMemo(() => {
    return searchResults.songs.filter((s) => s.source === 'youtube').length;
  }, [searchResults.songs]);

  const audiusSongsCount = useMemo(() => {
    return searchResults.songs.filter((s) => s.source === 'audius').length;
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
      // If direct URL is detected, play it immediately
      if (searchResults.detectedDirectTrack) {
        handlePlayTrack(searchResults.detectedDirectTrack);
        return;
      }
      // Otherwise play currently highlighted song
      if (songsToShow.length > 0 && songsToShow[selectedIndex]) {
        handlePlayTrack(songsToShow[selectedIndex]);
      }
    }
  };

  const handlePlayTrack = (track: Track) => {
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-start justify-center p-3 sm:p-6 sm:pt-14 animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-3xl max-h-[88vh] rounded-3xl bg-[#0b0d14] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
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
                ? 'Search your library, YouTube music, or paste a link...'
                : 'Search your library (songs, artists, albums) or paste a YouTube link...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          
          {isSearchingExternal && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-mono border border-indigo-500/20 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Searching online...</span>
            </div>
          )}

          {onSelectTrack && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 shrink-0">
              {title || 'Adding to Shared Room'}
            </span>
          )}

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Dynamic Category Tabs */}
        {query && hasAnyResults && (
          <div className="px-4 py-2 bg-zinc-950/90 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${
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
                className={`px-3 py-1 rounded-xl font-medium transition-colors ${
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
                className={`px-3 py-1 rounded-xl font-medium transition-colors ${
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
                className={`px-3 py-1 rounded-xl font-medium transition-colors ${
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
                className={`px-3 py-1 rounded-xl font-medium transition-colors ${
                  activeTab === 'playlists'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                Spaces ({searchResults.playlists.length})
              </button>
            )}

            {ytSongsCount > 0 && (
              <button
                onClick={() => setActiveTab('youtube')}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl font-medium transition-colors ${
                  activeTab === 'youtube'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-red-400 hover:text-red-300 hover:bg-red-950/30'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube ({ytSongsCount})</span>
              </button>
            )}

            {audiusSongsCount > 0 && (
              <button
                onClick={() => setActiveTab('audius')}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl font-medium transition-colors ${
                  activeTab === 'audius'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Audius ({audiusSongsCount})</span>
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-6">
          
          {/* Direct YouTube Video Link Card */}
          {searchResults.detectedDirectTrack && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-black border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
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
                    {searchResults.detectedDirectTrack.artist} • Ready to embed & play
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
                  Local Library Quick Search
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  Type any song title, artist, album, or playlist name. Or paste any YouTube video link directly into the search bar.
                </p>
              </div>

              {/* Suggestions / Artists in user's library */}
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
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-purple-400 shrink-0" />
                  <p className="text-xs text-zinc-400">
                    <span className="text-purple-300 font-semibold">Audius Decentralized Network</span> is live. Full public streaming & discovery with DSP effects enabled.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  Ready
                </span>
              </div>

              {/* YouTube Status Info Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-zinc-400">
                    {youtubeService.isConfigured() ? (
                      <span className="text-emerald-400">
                        YouTube Data API Connected. Live universal search is active.
                      </span>
                    ) : (
                      <span>
                        YouTube URL embeds are active. Set <code className="text-indigo-300 font-mono">YOUTUBE_DATA_API_KEY</code> to enable live YouTube search.
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

          {/* Songs Section */}
          {query && (activeTab === 'all' || activeTab === 'songs' || activeTab === 'youtube' || activeTab === 'audius') && songsToShow.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  Songs ({songsToShow.length})
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

                  // Group separators for 'all' tab
                  const getSourceGroup = (s: string) => {
                    if (s === 'youtube') return { label: 'YouTube Music', icon: Youtube, color: 'text-red-400' };
                    if (s === 'audius') return { label: 'Audius Catalog', icon: Radio, color: 'text-purple-400' };
                    return { label: 'Local Library & Spaces', icon: HardDrive, color: 'text-emerald-400' };
                  };

                  const currentGroup = getSourceGroup(song.source);
                  const prevGroup = idx > 0 ? getSourceGroup(songsToShow[idx - 1].source) : null;
                  const isFirstInGroup = activeTab === 'all' && currentGroup.label !== prevGroup?.label;

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
                              ) : song.source === 'curated_stream' ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                                  OPEN STREAM
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
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
                    <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20 overflow-hidden">
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
                      <p className="text-[10px] text-zinc-500">{artist.trackCount} local tracks</p>
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
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
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
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pl.coverGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
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
