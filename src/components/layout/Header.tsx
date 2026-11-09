import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { 
  Search, 
  Sparkles, 
  Keyboard, 
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
    playlists,
    queue,
    setIsQueueDrawerOpen,
    setIsUploadModalOpen,
    setIsShortcutsModalOpen,
    loadDemoPack,
    isPlaying,
  } = useMusic();

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const getBreadcrumbContext = () => {
    if (selectedPlaylistId && currentView === 'playlist-detail') {
      return { section: 'Spaces', title: selectedPlaylist?.name || 'Space' };
    }
    switch (currentView) {
      case 'home': return { section: 'Discover', title: 'Home' };
      case 'sources': return { section: 'Discover', title: 'Open Sources & Radio' };
      case 'listen-together': return { section: 'Experiences', title: 'Listen Together' };
      case 'library': return { section: 'Music Vault', title: 'Vault Overview' };
      case 'songs': return { section: 'Music Vault', title: 'Tracks' };
      case 'albums': return { section: 'Music Vault', title: 'Albums' };
      case 'artists': return { section: 'Music Vault', title: 'Artists' };
      case 'playlists': return { section: 'Collections', title: 'Spaces' };
      case 'favorites': return { section: 'Music Vault', title: 'Liked Songs' };
      case 'moments': return { section: 'Sound Lab', title: 'Aura Moments' };
      case 'studio': return { section: 'Experiences', title: 'Audio Studio & DSP' };
      case 'settings': return { section: 'System', title: 'Preferences' };
      default: return { section: 'AURA', title: 'Discover' };
    }
  };

  const breadcrumb = getBreadcrumbContext();

  return (
    <>
      {/* -------------------------------------------------------------
          MOBILE HEADER: Compact fixed control surface (lg:hidden)
          ------------------------------------------------------------- */}
      <header className="lg:hidden h-13 border-b border-white/[0.05] bg-[rgba(8,10,16,0.72)] backdrop-blur-2xl px-4 flex items-center justify-between gap-3 sticky top-0 z-20 select-none">
        {/* Mobile Brand */}
        <div 
          onClick={() => {
            setSelectedPlaylistId(null);
            setCurrentView('home');
          }}
          className="flex items-center gap-2 cursor-pointer group"
          id="mobile-header-brand"
        >
          <AuraBrandMark isPlaying={isPlaying} size={26} />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white tracking-[0.14em] font-display">AURA</span>
            <span className="text-[9px] font-mono tracking-widest text-sky-400 font-semibold uppercase">SPATIAL</span>
          </div>
        </div>

        {/* Mobile Right Utilities */}
        <div className="flex items-center gap-1.5">
          {onOpenUniversalSearch && (
            <button
              type="button"
              onClick={onOpenUniversalSearch}
              className="p-2 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors aura-focus-ring cursor-pointer"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors aura-focus-ring cursor-pointer"
            title="Add Music"
            aria-label="Add Music"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsQueueDrawerOpen(true)}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors cursor-pointer aura-focus-ring"
            title="Play Queue"
            aria-label="Open Play Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute 1 top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            )}
          </button>

          {onOpenAccount && (
            <button
              type="button"
              onClick={onOpenAccount}
              className="p-2 rounded-xl text-zinc-400 hover:text-white active:bg-white/5 transition-colors cursor-pointer aura-focus-ring"
              title="AURA Profile & Studio Sync"
              aria-label="Profile and Cloud Sync"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* -------------------------------------------------------------
          DESKTOP FLOATING COMMAND SURFACE (hidden lg:block)
          Detached glass island aligned with the main content grid
          ------------------------------------------------------------- */}
      <div className="hidden lg:block w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 mt-3.5 lg:mt-4 mb-1.5 shrink-0 z-20">
        <header className="h-[54px] rounded-2xl aura-glass-island px-4 lg:px-5 flex items-center justify-between gap-4 select-none shadow-[0_16px_40px_rgba(0,0,0,0.65)]">
          
          {/* ZONE 1: BREADCRUMB / CURRENT LOCATION */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            {selectedPlaylistId && currentView === 'playlist-detail' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlaylistId(null);
                  setCurrentView('playlists');
                }}
                className="p-1.5 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors aura-focus-ring flex items-center gap-1.5 cursor-pointer min-w-0"
                title="Back to Spaces"
                aria-label="Back to Spaces"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline shrink-0">Spaces</span>
                <span className="text-zinc-600 text-xs font-mono shrink-0">/</span>
                <span className="text-xs text-white font-semibold truncate max-w-[100px] sm:max-w-[160px] xl:max-w-[220px] font-display">
                  {breadcrumb.title}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
                <span className="text-zinc-500 font-mono uppercase tracking-wider text-[10px] font-semibold shrink-0">
                  {breadcrumb.section}
                </span>
                <span className="text-zinc-700 font-mono text-[10px] shrink-0" aria-hidden="true">/</span>
                <h1 className="text-white font-semibold font-display tracking-tight text-sm truncate max-w-[110px] sm:max-w-[180px] xl:max-w-xs">
                  {breadcrumb.title}
                </h1>
              </div>
            )}
          </div>

          {/* ZONE 2: UNIVERSAL SEARCH COMMAND BAR (Central Visual Anchor) */}
          <div 
            onClick={() => onOpenUniversalSearch?.()}
            className="flex-1 min-w-[140px] max-w-xs sm:max-w-sm md:max-w-md xl:max-w-lg items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.035] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/20 text-xs text-zinc-400 cursor-pointer transition-all flex group select-none shadow-sm aura-focus-ring"
            title="Universal Search (⌘K or /)"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenUniversalSearch?.();
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-sky-300 transition-colors shrink-0" />
              <span className="truncate group-hover:text-zinc-200 font-ui-body text-xs">
                Search tracks, artists, spaces, radio...
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 pl-1.5">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-white/[0.05] rounded border border-white/[0.08] group-hover:text-zinc-200 group-hover:border-white/15">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* ZONE 3: UTILITY ACTIONS & PRIMARY CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Demo Pack Loader */}
            <button
              type="button"
              onClick={loadDemoPack}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer aura-focus-ring"
              title="Load sample music"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-ui-body">Demo Pack</span>
            </button>

            {/* PWA Install Button */}
            {onInstall && (
              <PWAInstallButton
                canInstall={canInstall}
                isInstalled={isInstalled}
                onInstall={onInstall}
              />
            )}

            {/* Primary Add Music CTA */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm aura-focus-ring"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline font-ui-title">Add Music</span>
            </button>

            {/* Play Queue Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsQueueDrawerOpen(true)}
              className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer aura-focus-ring"
              title="Play Queue"
              aria-label="Open Play Queue"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-white text-zinc-950 ring-2 ring-[#07090e]">
                  {queue.length}
                </span>
              )}
            </button>

            {/* Account / Cloud Sync */}
            {onOpenAccount && (
              <button
                type="button"
                onClick={onOpenAccount}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer aura-focus-ring"
                title="AURA Profile & Studio Sync"
                aria-label="Profile and Cloud Sync"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {/* Shortcuts (?) Desktop */}
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="hidden sm:flex p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer aura-focus-ring"
              title="Keyboard Shortcuts (?)"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>

        </header>
      </div>
    </>
  );
};
