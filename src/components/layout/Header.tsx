import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { TelemetryBadge } from '../common/primitives/TelemetryBadge';
import { 
  Search, 
  Sparkles, 
  Keyboard, 
  HardDrive,
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

      {/* Unified Universal Search Gateway (Desktop / Tablet) */}
      <div 
        onClick={() => onOpenUniversalSearch?.()}
        className="hidden sm:flex flex-1 max-w-md items-center justify-between px-3.5 py-2 rounded-xl bg-[#11131b] hover:bg-[#161a25] border border-white/[0.08] hover:border-white/20 text-xs text-zinc-400 cursor-pointer transition-all group select-none shadow-sm"
        title="Open Universal Search (⌘K or /)"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenUniversalSearch?.();
          }
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
          <span className="truncate group-hover:text-zinc-200">
            Search songs, artists, albums, spaces, radio...
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.06] rounded border border-white/[0.08] group-hover:text-zinc-200 group-hover:border-white/15">
            ⌘K
          </kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-white/[0.04] rounded border border-white/[0.06]">
            /
          </kbd>
        </div>
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
