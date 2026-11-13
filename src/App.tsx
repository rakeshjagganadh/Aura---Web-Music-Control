import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { MotionPage } from './components/common/motion/MotionSurface';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomPlayer } from './components/player/BottomPlayer';
import { ExpandedPlayer } from './components/player/ExpandedPlayer';
import { YouTubeEmbedPlayer } from './components/player/YouTubeEmbedPlayer';
import { QueueDrawer } from './components/queue/QueueDrawer';
import { UploadModal } from './components/upload/UploadModal';
import { PlaylistModal } from './components/playlists/PlaylistModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { SleepTimerModal } from './components/common/SleepTimerModal';
import { TrackInfoModal } from './components/common/TrackInfoModal';
import { ToastContainer } from './components/common/ToastContainer';
import { DropzoneOverlay } from './components/upload/DropzoneOverlay';
import { AudioControlCenter } from './components/audio-controls/AudioControlCenter';
import { AuraAtmosphere } from './components/common/AuraAtmosphere';
import { TrimExportModal } from './components/sound-lab/TrimExportModal';
import { UniversalSearchModal } from './components/search/UniversalSearchModal';
import { AuraAccountModal } from './components/account/AuraAccountModal';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { PWAInstallModal } from './components/pwa/PWAInstallModal';
import { usePWAInstall } from './hooks/usePWAInstall';

// Mobile-specific components
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { MobileMiniPlayer } from './components/mobile/MobileMiniPlayer';
import { MobileMoreSheet } from './components/mobile/MobileMoreSheet';
import { MobileSearchModal } from './components/mobile/MobileSearchModal';

// Views
import { HomeView } from './components/views/HomeView';
import { SourcesView } from './components/views/SourcesView';
import { SongsView } from './components/views/SongsView';
import { LibraryOverviewView } from './components/views/LibraryOverviewView';
import { AlbumsView } from './components/views/AlbumsView';
import { ArtistsView } from './components/views/ArtistsView';
import { PlaylistsView } from './components/views/PlaylistsView';
import { PlaylistDetailView } from './components/views/PlaylistDetailView';
import { FavoritesView } from './components/views/FavoritesView';
import { AuraMomentsPanel } from './components/sound-lab/AuraMomentsPanel';
import { StudioView } from './components/views/StudioView';
import { SettingsView } from './components/views/SettingsView';
import { ListenTogetherView } from './components/views/ListenTogetherView';
import { OpticalGlassLab } from './components/dev/OpticalGlassLab';
import { ListenTogetherProvider } from './context/ListenTogetherContext';
import { Analytics } from '@vercel/analytics/react';

const MainLayout: React.FC = () => {
  const {
    currentView,
    currentTrack,
    togglePlay,
    seekRelative,
    nextTrack,
    prevTrack,
    toggleMute,
    setVolume,
    volume,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    openTrackInfo,
    setIsExpandedPlayerOpen,
    isExpandedPlayerOpen,
    setIsShortcutsModalOpen,
    isShortcutsModalOpen,
    setIsAudioControlsOpen,
    isAudioControlsOpen,
    setIsQueueDrawerOpen,
    isQueueDrawerOpen,
    selectedPlaylistId,
  } = useMusic();

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Progressive Web App installability & standalone detection
  const pwa = usePWAInstall();

  // Global Keyboard Shortcuts (Space, ⌘K, ?, arrows, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K for Universal Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsUniversalSearchOpen((prev) => !prev);
        return;
      }

      // Don't trigger if typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          prevTrack();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'KeyR':
          e.preventDefault();
          cycleRepeat();
          break;
        case 'KeyL':
          if (currentTrack) {
            e.preventDefault();
            toggleFavorite(currentTrack.id);
          }
          break;
        case 'KeyI':
          if (currentTrack) {
            e.preventDefault();
            openTrackInfo(currentTrack);
          }
          break;
        case 'KeyQ':
          e.preventDefault();
          setIsQueueDrawerOpen(!isQueueDrawerOpen);
          break;
        case 'KeyF':
          e.preventDefault();
          setIsExpandedPlayerOpen(!isExpandedPlayerOpen);
          break;
        case 'KeyE':
          e.preventDefault();
          setIsAudioControlsOpen(!isAudioControlsOpen);
          break;
        case 'Escape':
          if (isUniversalSearchOpen) setIsUniversalSearchOpen(false);
          if (isAccountModalOpen) setIsAccountModalOpen(false);
          if (isExpandedPlayerOpen) setIsExpandedPlayerOpen(false);
          if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
          if (isQueueDrawerOpen) setIsQueueDrawerOpen(false);
          if (isAudioControlsOpen) setIsAudioControlsOpen(false);
          break;
        case 'Slash':
          if (e.shiftKey) {
            // '?' key
            e.preventDefault();
            setIsShortcutsModalOpen(!isShortcutsModalOpen);
          } else {
            // '/' key: Universal Search
            e.preventDefault();
            setIsUniversalSearchOpen(true);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    nextTrack,
    prevTrack,
    toggleMute,
    setVolume,
    volume,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    openTrackInfo,
    currentTrack,
    setIsExpandedPlayerOpen,
    isExpandedPlayerOpen,
    setIsShortcutsModalOpen,
    isShortcutsModalOpen,
    setIsAudioControlsOpen,
    isAudioControlsOpen,
    setIsQueueDrawerOpen,
    isQueueDrawerOpen,
    isUniversalSearchOpen,
    isAccountModalOpen,
  ]);

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-[#030407] text-zinc-100 font-sans antialiased overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      {/* Sound-reactive Atmospheric Background */}
      <AuraAtmosphere intensity="moderate" />
      
      {/* Main Workspace: Left Sidebar + Content Pane (Header & Viewport) */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Desktop Sidebar Rail */}
        <Sidebar />

        {/* Content Pane: Houses Floating Header, Main Viewport, and Floating Playback Island */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Header (Detached Floating Command Surface on Desktop, Compact Bar on Mobile) */}
          <Header 
            onOpenMobileSearch={() => setIsMobileSearchOpen(true)}
            onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
            onOpenAccount={() => setIsAccountModalOpen(true)}
            canInstall={pwa.canInstall}
            isInstalled={pwa.isInstalled}
            onInstall={pwa.promptInstall}
          />

          {/* Dynamic Main Viewport (with calculated safe-area clearance for floating player on desktop & mobile) */}
          <main className="flex-1 overflow-y-auto pb-[calc(210px+env(safe-area-inset-bottom,0px))] sm:pb-56 lg:pb-52 scroll-smooth focus:outline-none">
            <AnimatePresence mode="wait" initial={false}>
              <MotionPage
                viewKey={
                  selectedPlaylistId && currentView === 'playlist-detail'
                    ? `playlist-detail:${selectedPlaylistId}`
                    : currentView
                }
                className="w-full"
              >
                {selectedPlaylistId && currentView === 'playlist-detail' ? (
                  <PlaylistDetailView />
                ) : currentView === 'home' ? (
                  <HomeView />
                ) : currentView === 'sources' ? (
                  <SourcesView />
                ) : currentView === 'listen-together' ? (
                  <ListenTogetherView />
                ) : currentView === 'library' ? (
                  <LibraryOverviewView />
                ) : currentView === 'songs' ? (
                  <SongsView />
                ) : currentView === 'albums' ? (
                  <AlbumsView />
                ) : currentView === 'artists' ? (
                  <ArtistsView />
                ) : currentView === 'playlists' ? (
                  <PlaylistsView />
                ) : currentView === 'favorites' ? (
                  <FavoritesView />
                ) : currentView === 'moments' ? (
                  <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                    <AuraMomentsPanel />
                  </div>
                ) : currentView === 'studio' ? (
                  <StudioView />
                ) : currentView === 'settings' ? (
                  <SettingsView />
                ) : currentView === 'optical-lab' ? (
                  <OpticalGlassLab />
                ) : (
                  <HomeView />
                )}
              </MotionPage>
            </AnimatePresence>
          </main>

          {/* Desktop Floating Playback Island (Centered horizontally in available content area) */}
          <BottomPlayer />
        </div>

      </div>

      {/* Mobile Floating Mini Player */}
      <MobileMiniPlayer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMore={() => setIsMobileMoreOpen(true)} />

      {/* Full-screen / Expanded Studio Player Modal */}
      <ExpandedPlayer />

      {/* Official YouTube Embed Audio Integration */}
      <YouTubeEmbedPlayer />

      {/* Queue & History Drawer */}
      <QueueDrawer />

      {/* Modals & Overlays */}
      <AudioControlCenter />
      <TrimExportModal />
      <UploadModal />
      <PlaylistModal />
      <ShortcutsModal />
      <SleepTimerModal />
      <TrackInfoModal />
      <ToastContainer />
      <DropzoneOverlay />

      {/* Universal Search Modal (⌘K) */}
      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
      />

      {/* Account & Cloud Sync Modal */}
      <AuraAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Mobile Specific Sheets & Modals */}
      <MobileMoreSheet 
        isOpen={isMobileMoreOpen} 
        onClose={() => setIsMobileMoreOpen(false)} 
        canInstall={pwa.canInstall}
        isInstalled={pwa.isInstalled}
        onInstall={pwa.promptInstall}
      />
      <MobileSearchModal 
        isOpen={isMobileSearchOpen} 
        onClose={() => setIsMobileSearchOpen(false)} 
      />

      {/* PWA Install Banner (Non-aggressive, delayed, dismissible) */}
      <PWAInstallBanner
        canInstall={pwa.canInstall}
        isInstalled={pwa.isInstalled}
        isBannerDismissed={pwa.isBannerDismissed}
        onInstall={pwa.promptInstall}
        onDismiss={pwa.dismissBanner}
      />

      {/* PWA iOS / Safari Manual Instructions Modal */}
      <PWAInstallModal
        isOpen={pwa.isInstructionsOpen}
        onClose={() => pwa.setIsInstructionsOpen(false)}
        isIOS={pwa.isIOS}
      />

    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <MusicProvider>
        <ListenTogetherProvider>
          <MainLayout />
          <Analytics />
        </ListenTogetherProvider>
      </MusicProvider>
    </MotionConfig>
  );
}
