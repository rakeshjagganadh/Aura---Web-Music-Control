import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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
  Sparkles,
  History,
  FolderOpen
} from 'lucide-react';
import { universalSearchCoordinator, UniversalSearchResults } from '../../services/sourceAdapters';
import { youtubeService } from '../../services/youtubeService';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MobileTab = 'all' | 'songs' | 'artists' | 'albums' | 'playlists' | 'radio';

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
          <span key={i} className="bg-indigo-500/30 text-indigo-200 px-0.5 rounded font-bold">
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
  } = useMusic();

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
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

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

  return (
    <div
      id="mobile-search-modal"
      className="lg:hidden fixed inset-0 z-50 bg-[#07080e]/98 backdrop-blur-3xl text-zinc-100 flex flex-col pt-safe pb-safe select-none animate-in fade-in duration-200"
    >
      {/* Top Search Input Bar */}
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-2.5 bg-zinc-950/90">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search songs, artists, albums, radio or paste YouTube link..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 focus:border-indigo-500/60 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white active:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          Done
        </button>
      </div>

      {/* Category Tabs & Searching Indicator */}
      {query && hasAnyResults && (
        <div className="px-3 py-2 bg-zinc-950/90 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto text-xs scrollbar-none">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              All
            </button>

            {searchResults.songs.length > 0 && (
              <button
                onClick={() => setActiveTab('songs')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'songs'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                Songs ({searchResults.songs.length})
              </button>
            )}

            {searchResults.artists.length > 0 && (
              <button
                onClick={() => setActiveTab('artists')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'artists'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                Artists ({searchResults.artists.length})
              </button>
            )}

            {searchResults.albums.length > 0 && (
              <button
                onClick={() => setActiveTab('albums')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'albums'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                Albums ({searchResults.albums.length})
              </button>
            )}

            {searchResults.playlists.length > 0 && (
              <button
                onClick={() => setActiveTab('playlists')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'playlists'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                Spaces ({searchResults.playlists.length})
              </button>
            )}
          </div>

          {isSearchingExternal && (
            <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono animate-pulse shrink-0">
              <Sparkles className="w-3 h-3" />
              <span>Searching...</span>
            </div>
          )}
        </div>
      )}

      {/* Results & Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-4">
        
        {/* Direct YouTube Video Link Card */}
        {searchResults.detectedDirectTrack && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-black border border-red-500/40 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 overflow-hidden">
                {searchResults.detectedDirectTrack.coverUrl ? (
                  <img src={searchResults.detectedDirectTrack.coverUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <Youtube className="w-5 h-5 fill-current" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">
                  YOUTUBE LINK
                </span>
                <h4 className="text-xs font-bold text-white truncate mt-0.5">
                  {searchResults.detectedDirectTrack.title}
                </h4>
              </div>
            </div>

            <button
              onClick={() => handlePlayTrack(searchResults.detectedDirectTrack!)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </button>
          </div>
        )}

        {/* Empty Search Prompt / Recent Searches */}
        {!query && (
          <div className="flex flex-col gap-5">
            {recentSearches.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1">
                    <History className="w-3 h-3 text-indigo-400" />
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-300 cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-indigo-400" />
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Genre / Mood Discovery Suggestions */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                Explore Genres
              </span>
              <div className="flex flex-wrap gap-2">
                {['Electronic', 'Chillout', 'Synthwave', 'Ambient', 'Rock', 'Cyberpunk', 'Jazz'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-xs text-zinc-300 cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Tracks in Library */}
            {tracks.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  Recent Library Songs
                </span>
                <div className="flex flex-col gap-1">
                  {tracks.slice(0, 6).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-900 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white`}>
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-zinc-200 truncate">{track.title}</h5>
                        <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                const isYouTube = song.source === 'youtube';
                const isAudius = song.source === 'audius';
                const isJamendo = song.source === 'jamendo';
                const isRadio = song.source === 'radiobrowser' || song.source === 'radio';

                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlayTrack(song)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/50 border border-white/5 active:bg-zinc-800 transition-all cursor-pointer"
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
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-zinc-100 truncate">
                            <HighlightText text={song.title} query={query} />
                          </h4>
                          {isYouTube ? (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0 font-semibold">
                              YT
                            </span>
                          ) : isAudius ? (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 font-semibold">
                              AUDIUS
                            </span>
                          ) : isJamendo ? (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-semibold">
                              JAMENDO
                            </span>
                          ) : isRadio ? (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0 font-semibold">
                              RADIO
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-semibold">
                              LOCAL
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          <HighlightText text={song.artist} query={query} />
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                      }}
                      className="p-2 text-zinc-400 hover:text-indigo-300 shrink-0 cursor-pointer"
                      title="Add to queue"
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
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
              Artists ({searchResults.artists.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {searchResults.artists.map((artist) => (
                <div
                  key={artist.name}
                  onClick={() => handleSelectArtist(artist.name)}
                  className="p-2.5 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20 overflow-hidden">
                    {artist.sampleCover ? (
                      <img src={artist.sampleCover} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      <HighlightText text={artist.name} query={query} />
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
            <div className="flex flex-col gap-1.5">
              {searchResults.albums.map((album) => (
                <div
                  key={`${album.name}-${album.artist}`}
                  onClick={() => handleSelectAlbum(album.name)}
                  className="p-2.5 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                    ) : (
                      <Disc className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      <HighlightText text={album.name} query={query} />
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{album.artist} • {album.trackCount} tracks</p>
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
            <p className="text-sm font-bold text-zinc-200">No matches found for &quot;{query}&quot;</p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Try a different song, artist, album name, or paste a YouTube video link.
            </p>
            <button
              onClick={() => {
                onClose();
                setIsUploadModalOpen(true);
              }}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Import Audio Files</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
