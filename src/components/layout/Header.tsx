import React, { useRef, useEffect, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { 
  Search, 
  UploadCloud, 
  Sparkles, 
  Keyboard, 
  SlidersHorizontal, 
  Disc, 
  HardDrive,
  X,
  ChevronDown,
  ChevronUp,
  ListMusic,
  ChevronLeft,
  User,
  Plus
} from 'lucide-react';

export const Header: React.FC<{ 
  onOpenMobileSearch?: () => void;
  onOpenUniversalSearch?: () => void;
  onOpenAccount?: () => void;
}> = ({ onOpenMobileSearch, onOpenUniversalSearch, onOpenAccount }) => {
  const {
    searchQuery,
    setSearchQuery,
    activeSearchIndex,
    nextSearchResult,
    prevSearchResult,
    tracks,
    playTrack,
    currentView,
    setCurrentView,
    selectedPlaylistId,
    setSelectedPlaylistId,
    queue,
    setIsQueueDrawerOpen,
    setIsUploadModalOpen,
    setIsShortcutsModalOpen,
    loadDemoPack,
    storageUsage,
    isPlaying,
  } = useMusic();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered count
  const matchingTracks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.fileFormat.toLowerCase().includes(q)
    );
  }, [searchQuery, tracks]);

  // Global search shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        if (matchingTracks.length > 0) {
          const target = matchingTracks[activeSearchIndex] || matchingTracks[0];
          playTrack(target);
        }
      } else if (e.shiftKey) {
        prevSearchResult();
      } else {
        nextSearchResult();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextSearchResult();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      prevSearchResult();
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };

  const formatStorageMB = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#090a0d]/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 select-none">
      
      {/* Brand Logo or Back Button if inside Playlist Detail on mobile */}
      <div className="flex items-center gap-2">
        {selectedPlaylistId && currentView === 'playlist-detail' ? (
          <button
            type="button"
            onClick={() => {
              setSelectedPlaylistId(null);
              setCurrentView('playlists');
            }}
            className="lg:hidden p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white active:bg-zinc-800 transition-colors"
            title="Back to Playlists"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : null}

        <div 
          onClick={() => {
            setSelectedPlaylistId(null);
            setCurrentView('home');
          }} 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          id="header-brand-logo"
        >
          <AuraBrandMark isPlaying={isPlaying} size={32} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-white tracking-widest font-sans">AURA</span>
              <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                STUDIO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Bar (Desktop / Tablet) */}
      <div className="hidden sm:block flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search songs, artists... (Enter for next, / to focus)"
          value={searchQuery}
          onKeyDown={handleSearchKeyDown}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value && currentView !== 'songs') {
              setCurrentView('songs');
            }
          }}
          className="w-full pl-9 pr-28 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 focus:bg-zinc-900 border border-white/5 focus:border-indigo-500/50 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all"
        />
        
        {searchQuery ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-white/5">
              {matchingTracks.length > 0 ? (
                `${Math.min(activeSearchIndex + 1, matchingTracks.length)}/${matchingTracks.length}`
              ) : (
                '0'
              )}
            </span>

            <button
              type="button"
              onClick={prevSearchResult}
              disabled={matchingTracks.length === 0}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              title="Previous Match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={nextSearchResult}
              disabled={matchingTracks.length === 0}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              title="Next Match"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-800 rounded border border-white/5">
            /
          </kbd>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        
        {/* Mobile Search Button (Visible only on small mobile) */}
        {onOpenMobileSearch && (
          <button
            type="button"
            onClick={onOpenMobileSearch}
            className="sm:hidden p-2 rounded-xl text-zinc-400 hover:text-white active:bg-zinc-800 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Local Storage badge */}
        <div 
          onClick={() => setCurrentView('settings')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/50 border border-white/5 text-[11px] text-zinc-400 font-mono cursor-pointer hover:border-white/10 transition-colors"
          title="Local IndexedDB storage usage"
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatStorageMB(storageUsage.approxBytes)}</span>
        </div>

        {/* Demo Pack Loader */}
        <button
          onClick={loadDemoPack}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          title="Synthesize royalty-free sample music"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Demo Pack
        </button>

        {/* Add Music Button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Music</span>
        </button>

        {/* Queue Drawer Trigger */}
        <button
          onClick={() => setIsQueueDrawerOpen(true)}
          className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
          {queue.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
          )}
        </button>

        {/* Account / Sync Profile */}
        {onOpenAccount && (
          <button
            onClick={onOpenAccount}
            className="p-2 rounded-xl text-zinc-400 hover:text-indigo-300 hover:bg-zinc-900 transition-colors cursor-pointer"
            title="AURA Profile & Studio Sync"
          >
            <User className="w-4 h-4" />
          </button>
        )}

        {/* Shortcuts ? (Desktop) */}
        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          className="hidden sm:flex p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
