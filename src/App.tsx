import React, { useEffect, useState } from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomPlayer } from './components/player/BottomPlayer';
import { ExpandedPlayer } from './components/player/ExpandedPlayer';
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

// Mobile-specific components
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { MobileMiniPlayer } from './components/mobile/MobileMiniPlayer';
import { MobileMoreSheet } from './components/mobile/MobileMoreSheet';
import { MobileSearchModal } from './components/mobile/MobileSearchModal';

// Views
import { HomeView } from './components/views/HomeView';
import { SongsView } from './components/views/SongsView';
import { AlbumsView } from './components/views/AlbumsView';
import { ArtistsView } from './components/views/ArtistsView';
import { PlaylistsView } from './components/views/PlaylistsView';
import { PlaylistDetailView } from './components/views/PlaylistDetailView';
import { FavoritesView } from './components/views/FavoritesView';
import { StudioView } from './components/views/StudioView';
import { SettingsView } from './components/views/SettingsView';

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#060709] text-zinc-100 font-sans antialiased overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      {/* Sound-reactive Atmospheric Background */}
      <AuraAtmosphere intensity="moderate" />
      
      {/* Top Header */}
      <Header onOpenMobileSearch={() => setIsMobileSearchOpen(true)} />

      {/* Main Workspace: Sidebar + View Content */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Main Viewport (with mobile bottom padding for mini player & nav) */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem-5rem)] pb-36 lg:pb-6 scroll-smooth">
          {selectedPlaylistId && currentView === 'playlist-detail' ? (
            <PlaylistDetailView />
          ) : currentView === 'home' ? (
            <HomeView />
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
          ) : currentView === 'studio' ? (
            <StudioView />
          ) : currentView === 'settings' ? (
            <SettingsView />
          ) : (
            <HomeView />
          )}
        </main>

      </div>

      {/* Desktop Persistent Bottom Player */}
      <BottomPlayer />

      {/* Mobile Floating Mini Player */}
      <MobileMiniPlayer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMore={() => setIsMobileMoreOpen(true)} />

      {/* Full-screen / Expanded Studio Player Modal */}
      <ExpandedPlayer />

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

      {/* Mobile Specific Sheets & Modals */}
      <MobileMoreSheet 
        isOpen={isMobileMoreOpen} 
        onClose={() => setIsMobileMoreOpen(false)} 
      />
      <MobileSearchModal 
        isOpen={isMobileSearchOpen} 
        onClose={() => setIsMobileSearchOpen(false)} 
      />

    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainLayout />
    </MusicProvider>
  );
}
