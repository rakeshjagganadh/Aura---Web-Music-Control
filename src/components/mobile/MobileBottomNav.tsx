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

  const navItems: { id: NavView; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'songs', label: 'Library', icon: Music },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
  ];

  const handleNav = (id: NavView) => {
    setSelectedPlaylistId(null);
    setCurrentView(id);
  };

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0c10]/95 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.6)] select-none"
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-lg mx-auto px-1">
        
        {/* Home */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all cursor-pointer ${
            currentView === 'home' && !selectedPlaylistId
              ? 'text-indigo-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none">Home</span>
        </button>

        {/* Library / Songs */}
        <button
          type="button"
          onClick={() => handleNav('songs')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all cursor-pointer ${
            currentView === 'songs' && !selectedPlaylistId
              ? 'text-indigo-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Music className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none">Library</span>
        </button>

        {/* Playlists */}
        <button
          type="button"
          onClick={() => handleNav('playlists')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all cursor-pointer ${
            (currentView === 'playlists' || currentView === 'playlist-detail')
              ? 'text-indigo-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListMusic className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none">Playlists</span>
        </button>

        {/* Audio Studio Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsAudioControlsOpen(true)}
          className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all cursor-pointer ${
            isAudioControlsOpen
              ? 'text-indigo-400 font-semibold'
              : isAudioEffectActive
              ? 'text-indigo-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5" />
            {isAudioEffectActive && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none">Audio</span>
        </button>

        {/* More Menu */}
        <button
          type="button"
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all cursor-pointer ${
            ['albums', 'artists', 'favorites', 'studio', 'settings'].includes(currentView) && !selectedPlaylistId
              ? 'text-indigo-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] tracking-tight leading-none">More</span>
        </button>

      </div>
    </nav>
  );
};
