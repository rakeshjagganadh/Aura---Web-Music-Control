import React, { useMemo } from 'react';
import { motion, LayoutGroup, useReducedMotion } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { NavView } from '../../types';
import { OpticalGlassSurface } from '../common/OpticalGlassSurface';
import { AuraIcon } from '../ui/AuraIcon';

interface MobileBottomNavProps {
  onOpenMore: () => void;
  onOpenSearch: () => void;
  isSearchOpen?: boolean;
}

type MobileNavTabId = 'home' | 'search' | 'library' | 'studio' | 'more';

const PILL_SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.85,
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenMore,
  onOpenSearch,
  isSearchOpen = false,
}) => {
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
    setIsAudioControlsOpen(false);
    setSelectedPlaylistId(null);
    setCurrentView(id);
  };

  // Single mutually-exclusive active tab so the shared glass pill always has one unambiguous target
  const activeTab: MobileNavTabId | null = useMemo(() => {
    if (isSearchOpen) return 'search';
    if (isAudioControlsOpen || currentView === 'studio') return 'studio';
    if (
      [
        'library',
        'songs',
        'albums',
        'artists',
        'playlists',
        'playlist-detail',
        'favorites',
      ].includes(currentView) ||
      Boolean(selectedPlaylistId)
    ) {
      return 'library';
    }
    if (currentView === 'home') return 'home';
    if (
      ['moments', 'sources', 'listen-together', 'settings', 'optical-lab'].includes(currentView)
    ) {
      return 'more';
    }
    return null;
  }, [isSearchOpen, isAudioControlsOpen, currentView, selectedPlaylistId]);

  const isHomeActive = activeTab === 'home';
  const isSearchActive = activeTab === 'search';
  const isLibraryActive = activeTab === 'library';
  const isStudioActive = activeTab === 'studio';
  const isMoreActive = activeTab === 'more';

  const pillTransition = prefersReducedMotion ? { duration: 0 } : PILL_SPRING_TRANSITION;

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-[calc(8px+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 max-w-md mx-auto z-40 select-none"
    >
      <OpticalGlassSurface
        className="w-full p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.82)]"
        artworkUrl={currentTrack?.coverUrl}
        refractionScale={6}
        intensity="moderate"
        shape="rounded-full"
      >
        <LayoutGroup id="mobile-bottom-nav-group">
          <div className="grid grid-cols-5 items-center h-12 gap-0.5">
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => handleNav('home')}
              aria-current={isHomeActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-200 ease-out cursor-pointer aura-focus-ring whitespace-nowrap ${
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
                  className="absolute inset-0 rounded-full bg-white/[0.11] pointer-events-none"
                />
              )}
              <AuraIcon
                name="home"
                size={17}
                filled={isHomeActive}
                className={`relative z-10 transition-[transform,color] duration-200 ease-out ${
                  isHomeActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}text-sky-300`
                    : 'scale-100'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Home
              </span>
            </button>

            {/* 2. Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-current={isSearchActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-200 ease-out cursor-pointer aura-focus-ring whitespace-nowrap ${
                isSearchActive
                  ? 'text-sky-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 active:text-white'
              }`}
              aria-label="Search"
            >
              {isSearchActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  transition={pillTransition}
                  className="absolute inset-0 rounded-full bg-white/[0.11] pointer-events-none"
                />
              )}
              <AuraIcon
                name="search"
                size={17}
                filled={isSearchActive}
                className={`relative z-10 transition-[transform,color] duration-200 ease-out ${
                  isSearchActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}text-sky-300`
                    : 'scale-100'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Search
              </span>
            </button>

            {/* 3. Library */}
            <button
              type="button"
              onClick={() => handleNav('songs')}
              aria-current={isLibraryActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-200 ease-out cursor-pointer aura-focus-ring whitespace-nowrap ${
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
                  className="absolute inset-0 rounded-full bg-white/[0.11] pointer-events-none"
                />
              )}
              <AuraIcon
                name="musicNote"
                size={17}
                filled={isLibraryActive}
                className={`relative z-10 transition-[transform,color] duration-200 ease-out ${
                  isLibraryActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}text-sky-300`
                    : 'scale-100'
                }`}
              />
              <span className="relative z-10 text-[10px] tracking-tight leading-none font-medium">
                Library
              </span>
            </button>

            {/* 4. Audio Studio DSP Control Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsAudioControlsOpen(!isAudioControlsOpen)}
              aria-current={isStudioActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-200 ease-out cursor-pointer aura-focus-ring whitespace-nowrap ${
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
                  className="absolute inset-0 rounded-full bg-white/[0.11] pointer-events-none"
                />
              )}
              <div className="relative z-10 flex items-center justify-center">
                <AuraIcon
                  name="sliders"
                  size={17}
                  filled={isStudioActive}
                  className={`transition-[transform,color] duration-200 ease-out ${
                    isStudioActive
                      ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}text-sky-300`
                      : 'scale-100'
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
              className={`relative flex flex-col items-center justify-center gap-0.5 h-11 rounded-full transition-colors duration-200 ease-out cursor-pointer aura-focus-ring whitespace-nowrap ${
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
                  className="absolute inset-0 rounded-full bg-white/[0.11] pointer-events-none"
                />
              )}
              <AuraIcon
                name="more"
                size={17}
                filled={isMoreActive}
                className={`relative z-10 transition-[transform,color] duration-200 ease-out ${
                  isMoreActive
                    ? `${prefersReducedMotion ? '' : 'scale-[1.06] '}text-sky-300`
                    : 'scale-100'
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
