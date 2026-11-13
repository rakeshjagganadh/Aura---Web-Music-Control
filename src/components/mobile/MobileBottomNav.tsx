import React, { useMemo } from 'react';
import { motion, LayoutGroup, useReducedMotion } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { OpticalGlassSurface } from '../common/OpticalGlassSurface';
import {
  Home,
  Music,
  ListMusic,
  SlidersHorizontal,
  MoreHorizontal,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

type MobileNavTabId = 'home' | 'vault' | 'spaces' | 'studio' | 'more';

const PILL_SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.85,
};

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

  const prefersReducedMotion = useReducedMotion();

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

  // Single mutually-exclusive active tab so the shared glass pill always has one unambiguous target
  const activeTab: MobileNavTabId | null = useMemo(() => {
    if (isAudioControlsOpen || currentView === 'studio') return 'studio';
    if (currentView === 'playlists' || currentView === 'playlist-detail' || selectedPlaylistId) {
      return 'spaces';
    }
    if (currentView === 'home') return 'home';
    if (currentView === 'library' || currentView === 'songs') return 'vault';
    if (
      [
        'albums',
        'artists',
        'favorites',
        'moments',
        'sources',
        'listen-together',
        'settings',
        'optical-lab',
      ].includes(currentView)
    ) {
      return 'more';
    }
    return null;
  }, [isAudioControlsOpen, currentView, selectedPlaylistId]);

  const isHomeActive = activeTab === 'home';
  const isLibraryActive = activeTab === 'vault';
  const isSpacesActive = activeTab === 'spaces';
  const isStudioActive = activeTab === 'studio';
  const isMoreActive = activeTab === 'more';

  const pillTransition = prefersReducedMotion ? { duration: 0 } : PILL_SPRING_TRANSITION;

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
        <LayoutGroup id="mobile-bottom-nav-group">
          <div className="grid grid-cols-5 items-center h-12 gap-1">
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => handleNav('home')}
              aria-current={isHomeActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-250 ease-out cursor-pointer aura-focus-ring ${
                isHomeActive
                  ? 'text-sky-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 active:text-white'
              }`}
              aria-label="Home"
            >
              {isHomeActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  transition={pillTransition}
                  className="absolute inset-0 rounded-full bg-white/[0.10] pointer-events-none"
                />
              )}
              <Home
                className={`relative z-10 w-4 h-4 transition-[transform,color] duration-250 ease-out ${
                  isHomeActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}stroke-[2.2] text-sky-300`
                    : 'scale-100 stroke-[1.8]'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Home
              </span>
            </button>

            {/* 2. Library / Vault */}
            <button
              type="button"
              onClick={() => handleNav('songs')}
              aria-current={isLibraryActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-250 ease-out cursor-pointer aura-focus-ring ${
                isLibraryActive
                  ? 'text-sky-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 active:text-white'
              }`}
              aria-label="Library"
            >
              {isLibraryActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  transition={pillTransition}
                  className="absolute inset-0 rounded-full bg-white/[0.10] pointer-events-none"
                />
              )}
              <Music
                className={`relative z-10 w-4 h-4 transition-[transform,color] duration-250 ease-out ${
                  isLibraryActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}stroke-[2.2] text-sky-300`
                    : 'scale-100 stroke-[1.8]'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Vault
              </span>
            </button>

            {/* 3. Spaces / Playlists */}
            <button
              type="button"
              onClick={() => handleNav('playlists')}
              aria-current={isSpacesActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-250 ease-out cursor-pointer aura-focus-ring ${
                isSpacesActive
                  ? 'text-sky-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 active:text-white'
              }`}
              aria-label="Spaces"
            >
              {isSpacesActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  transition={pillTransition}
                  className="absolute inset-0 rounded-full bg-white/[0.10] pointer-events-none"
                />
              )}
              <ListMusic
                className={`relative z-10 w-4 h-4 transition-[transform,color] duration-250 ease-out ${
                  isSpacesActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}stroke-[2.2] text-sky-300`
                    : 'scale-100 stroke-[1.8]'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Spaces
              </span>
            </button>

            {/* 4. Audio Studio DSP Control Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsAudioControlsOpen(true)}
              aria-current={isStudioActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-250 ease-out cursor-pointer aura-focus-ring ${
                isStudioActive
                  ? 'text-sky-300 font-semibold'
                  : isAudioEffectActive
                    ? 'text-sky-300'
                    : 'text-zinc-400 hover:text-zinc-200 active:text-white'
              }`}
              aria-label="Audio DSP Studio"
            >
              {isStudioActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  transition={pillTransition}
                  className="absolute inset-0 rounded-full bg-white/[0.10] pointer-events-none"
                />
              )}
              <div className="relative z-10">
                <SlidersHorizontal
                  className={`w-4 h-4 transition-[transform,color] duration-250 ease-out ${
                    isStudioActive
                      ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}stroke-[2.2] text-sky-300`
                      : 'scale-100 stroke-[1.8]'
                  }`}
                />
                {isAudioEffectActive && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </div>
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Studio
              </span>
            </button>

            {/* 5. More Menu Sheet */}
            <button
              type="button"
              onClick={onOpenMore}
              aria-current={isMoreActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-250 ease-out cursor-pointer aura-focus-ring ${
                isMoreActive
                  ? 'text-sky-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 active:text-white'
              }`}
              aria-label="More Navigation Options"
            >
              {isMoreActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  transition={pillTransition}
                  className="absolute inset-0 rounded-full bg-white/[0.10] pointer-events-none"
                />
              )}
              <MoreHorizontal
                className={`relative z-10 w-4 h-4 transition-[transform,color] duration-250 ease-out ${
                  isMoreActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}stroke-[2.3] text-sky-300`
                    : 'scale-100 stroke-[1.8]'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                More
              </span>
            </button>
          </div>
        </LayoutGroup>
      </OpticalGlassSurface>
    </nav>
  );
};
