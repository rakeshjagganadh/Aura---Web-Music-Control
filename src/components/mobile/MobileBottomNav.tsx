import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { 
  Home, 
  Music, 
  ListMusic, 
  SlidersHorizontal, 
  MoreHorizontal
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMore }) => {
  const {
    currentView,
    setCurrentView,
    setSelectedPlaylistId,
    selectedPlaylistId,
    setIsAudioControlsOpen,
    isAudioControlsOpen,
    eqPreset,
    effects,
    bass,
    treble,
    spatial,
  } = useMusic();

  const isAudioEffectActive = 
    eqPreset !== 'flat' || 
    Boolean(effects?.reverb?.enabled) || 
    Boolean(effects?.echo?.enabled) || 
    Boolean(effects?.chorus?.enabled) ||
    Boolean(effects?.saturation?.enabled) ||
    Boolean(effects?.exciter?.enabled) ||
    Boolean(effects?.noiseGate?.enabled) ||
    (effects?.bassBoost ?? 0) > 0 || 
    (effects?.trebleBoost ?? 0) > 0 ||
    bass !== 0 || 
    treble !== 0 || 
    Boolean(spatial?.enabled);

  const handleNav = (id: NavView) => {
    setSelectedPlaylistId(null);
    setCurrentView(id);
  };

  const isHomeActive = currentView === 'home' && !selectedPlaylistId;
  const isLibraryActive = ['library', 'songs'].includes(currentView) && !selectedPlaylistId;
  const isSpacesActive = (currentView === 'playlists' || currentView === 'playlist-detail');
  const isStudioActive = currentView === 'studio' || isAudioControlsOpen;
  const isMoreActive = ['albums', 'artists', 'favorites', 'moments', 'sources', 'listen-together', 'settings'].includes(currentView) && !selectedPlaylistId;

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgba(9,12,18,0.72)] backdrop-blur-2xl border-t border-white/[0.06] pb-safe shadow-[0_-1px_0_0_rgba(255,255,255,0.08),0_-12px_28px_rgba(0,0,0,0.65)] select-none"
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto px-2">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-150 cursor-pointer aura-focus-ring ${
            isHomeActive
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Home"
        >
          <Home className={`w-5 h-5 transition-transform duration-150 ${isHomeActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">Home</span>
          {isHomeActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          )}
        </button>

        {/* 2. Library / Songs */}
        <button
          type="button"
          onClick={() => handleNav('songs')}
          className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-150 cursor-pointer aura-focus-ring ${
            isLibraryActive
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Library"
        >
          <Music className={`w-5 h-5 transition-transform duration-150 ${isLibraryActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">Vault</span>
          {isLibraryActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          )}
        </button>

        {/* 3. Spaces / Playlists */}
        <button
          type="button"
          onClick={() => handleNav('playlists')}
          className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-150 cursor-pointer aura-focus-ring ${
            isSpacesActive
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Spaces"
        >
          <ListMusic className={`w-5 h-5 transition-transform duration-150 ${isSpacesActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">Spaces</span>
          {isSpacesActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          )}
        </button>

        {/* 4. Audio Studio DSP Control Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-150 cursor-pointer aura-focus-ring ${
            isStudioActive
              ? 'text-sky-400 font-semibold'
              : isAudioEffectActive
              ? 'text-sky-300'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Audio DSP Studio"
        >
          <div className="relative">
            <SlidersHorizontal className={`w-5 h-5 transition-transform duration-150 ${isStudioActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
            {isAudioEffectActive && (
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none font-medium">Studio</span>
          {isStudioActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          )}
        </button>

        {/* 5. More Menu Sheet */}
        <button
          type="button"
          onClick={onOpenMore}
          className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all duration-150 cursor-pointer aura-focus-ring ${
            isMoreActive
              ? 'text-white font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="More Navigation Options"
        >
          <MoreHorizontal className={`w-5 h-5 transition-transform duration-150 ${isMoreActive ? 'scale-105 stroke-[2.3]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">More</span>
          {isMoreActive && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
          )}
        </button>

      </div>
    </nav>
  );
};
