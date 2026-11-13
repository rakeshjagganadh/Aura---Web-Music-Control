import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { OpticalGlassSurface } from '../common/OpticalGlassSurface';
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
    currentTrack,
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
      className="lg:hidden fixed bottom-[calc(10px+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-md mx-auto z-40 select-none"
    >
      <OpticalGlassSurface
        className="w-full p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.8)]"
        artworkUrl={currentTrack?.coverUrl}
        refractionScale={6}
        intensity="moderate"
        shape="rounded-full"
      >
        <div className="grid grid-cols-5 items-center h-12 gap-1">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-all duration-200 cursor-pointer aura-focus-ring ${
            isHomeActive
              ? 'bg-white/[0.10] text-sky-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Home"
        >
          <Home className={`w-4 h-4 transition-transform duration-200 ${isHomeActive ? 'scale-110 stroke-[2.2] text-sky-300' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">Home</span>
        </button>

        {/* 2. Library / Songs */}
        <button
          type="button"
          onClick={() => handleNav('songs')}
          className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-all duration-200 cursor-pointer aura-focus-ring ${
            isLibraryActive
              ? 'bg-white/[0.10] text-sky-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Library"
        >
          <Music className={`w-4 h-4 transition-transform duration-200 ${isLibraryActive ? 'scale-110 stroke-[2.2] text-sky-300' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">Vault</span>
        </button>

        {/* 3. Spaces / Playlists */}
        <button
          type="button"
          onClick={() => handleNav('playlists')}
          className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-all duration-200 cursor-pointer aura-focus-ring ${
            isSpacesActive
              ? 'bg-white/[0.10] text-sky-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Spaces"
        >
          <ListMusic className={`w-4 h-4 transition-transform duration-200 ${isSpacesActive ? 'scale-110 stroke-[2.2] text-sky-300' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">Spaces</span>
        </button>

        {/* 4. Audio Studio DSP Control Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-all duration-200 cursor-pointer aura-focus-ring ${
            isStudioActive
              ? 'bg-white/[0.10] text-sky-300 font-semibold'
              : isAudioEffectActive
              ? 'text-sky-300'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="Audio DSP Studio"
        >
          <div className="relative">
            <SlidersHorizontal className={`w-4 h-4 transition-transform duration-200 ${isStudioActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
            {isAudioEffectActive && (
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none font-medium">Studio</span>
        </button>

        {/* 5. More Menu Sheet */}
        <button
          type="button"
          onClick={onOpenMore}
          className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-all duration-200 cursor-pointer aura-focus-ring ${
            isMoreActive
              ? 'bg-white/[0.10] text-sky-300 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 active:text-white'
          }`}
          aria-label="More Navigation Options"
        >
          <MoreHorizontal className={`w-4 h-4 transition-transform duration-200 ${isMoreActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight leading-none font-medium">More</span>
        </button>

      </div>
      </OpticalGlassSurface>
    </nav>
  );
};
