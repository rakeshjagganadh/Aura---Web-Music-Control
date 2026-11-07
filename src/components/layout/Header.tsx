import React, { useRef, useEffect, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { TelemetryBadge } from '../common/primitives/TelemetryBadge';
import { 
  Search, 
  Sparkles, 
  Keyboard, 
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
  canInstall?: boolean;
  isInstalled?: boolean;
  onInstall?: () => void;
}> = ({ 
  onOpenMobileSearch, 
  onOpenUniversalSearch, 
  onOpenAccount,
  canInstall = false,
  isInstalled = false,
  onInstall
}) => {
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
    <header className="h-16 border-b border-white/[0.10] bg-[#0c0e14]/80 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 select-none">
      
      {/* Brand Logo or Back Button if inside Playlist Detail on mobile */}
      <div className="flex items-center gap-2">
        {selectedPlaylistId && currentView === 'playlist-detail' ? (
          <button
            type="button"
            onClick={() => {
              setSelectedPlaylistId(null);
              setCurrentView('playlists');
            }}
            className="lg:hidden p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
          <AuraBrandMark isPlaying={isPlaying} size={30} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight font-display">AURA</span>
              <TelemetryBadge variant="glass" size="sm">
                STUDIO
              </TelemetryBadge>
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
          placeholder="Search songs, artists, spaces... (/ to focus)"
          value={searchQuery}
          onKeyDown={handleSearchKeyDown}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value && currentView !== 'songs') {
              setCurrentView('songs');
            }
          }}
          className="w-full pl-9 pr-28 py-2 rounded-xl bg-[#11131b] hover:bg-[#171a24] focus:bg-[#171a24] border border-white/[0.08] focus:border-white/20 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-all"
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
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              title="Previous Match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={nextSearchResult}
              disabled={matchingTracks.length === 0}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
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
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2">
            {onOpenUniversalSearch && (
              <button
                type="button"
                onClick={onOpenUniversalSearch}
                className="hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                title="Universal Search (⌘K)"
              >
                <TelemetryBadge variant="glass" size="sm">
                  ⌘K
                </TelemetryBadge>
              </button>
            )}
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-white/[0.04] rounded border border-white/[0.06]">
              /
            </kbd>
          </div>
        )}
      </div>

      {/* Header Utility Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        
        {/* Mobile Search Button */}
        {onOpenMobileSearch && (
          <button
            type="button"
            onClick={onOpenMobileSearch}
            className="sm:hidden p-2 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Local Storage Database usage badge */}
        <div 
          onClick={() => setCurrentView('settings')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] text-zinc-400 font-mono cursor-pointer hover:border-white/10 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="Local storage database usage"
          tabIndex={0}
        >
          <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
          <span>{formatStorageMB(storageUsage.approxBytes)}</span>
        </div>

        {/* Demo Pack Loader */}
        <button
          onClick={loadDemoPack}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-300 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="Synthesize royalty-free sample music"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>Demo Pack</span>
        </button>

        {/* PWA Install Button */}
        {onInstall && (
          <PWAInstallButton
            canInstall={canInstall}
            isInstalled={isInstalled}
            onInstall={onInstall}
          />
        )}

        {/* Add Music Button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Music</span>
        </button>

        {/* Queue Drawer Trigger */}
        <button
          onClick={() => setIsQueueDrawerOpen(true)}
          className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
          {queue.length > 0 && (
            <TelemetryBadge
              variant="emerald"
              size="sm"
              className="absolute -top-1 -right-1 px-1 py-0 text-[8px] rounded-full"
            >
              {queue.length}
            </TelemetryBadge>
          )}
        </button>

        {/* Account / Sync Profile */}
        {onOpenAccount && (
          <button
            onClick={onOpenAccount}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title="AURA Profile & Studio Sync"
          >
            <User className="w-4 h-4" />
          </button>
        )}

        {/* Shortcuts ? (Desktop) */}
        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          className="hidden sm:flex p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
