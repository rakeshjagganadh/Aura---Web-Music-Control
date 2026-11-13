import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion, type Transition } from 'motion/react';
import {
  INSTANT_TRANSITION,
  MOTION_SPRING,
  REDUCED_FADE_TRANSITION,
} from './tokens';

export interface MotionCapabilities {
  /** OS / user prefers-reduced-motion setting */
  prefersReducedMotion: boolean;
  /** True on pointer devices capable of true hover (desktop mouse / trackpad) */
  canHover: boolean;
  /** True when the primary input device is coarse (touchscreen) */
  isCoarsePointer: boolean;
  /** True when hover is unavailable or touch is primary */
  isTouchPrimary: boolean;
  /** Spring or instant transition for compact controls */
  controlTransition: Transition;
  /** Spring or instant transition for floating overlays/sheets */
  surfaceTransition: Transition;
  /** Spring or instant transition for shared active indicators */
  indicatorTransition: Transition;
  /** Spring or instant transition for shared layout/artwork continuity */
  sharedTransition: Transition;
  /** Subtle opacity fade transition preserved even under reduced motion */
  fadeTransition: Transition;
}

const HOVER_MEDIA_QUERY = '(hover: hover) and (pointer: fine)';
const COARSE_MEDIA_QUERY = '(pointer: coarse)';

function matchMediaSafe(query: string, fallback: boolean): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return fallback;
  }
  return window.matchMedia(query).matches;
}

/**
 * Exposes platform pointer capability (desktop hover vs. touch) and user
 * reduced-motion preference so components can adapt feedback cleanly without
 * introducing sticky hover states on mobile or unwanted motion when disabled.
 */
export function useMotionCapabilities(): MotionCapabilities {
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [canHover, setCanHover] = useState<boolean>(() =>
    matchMediaSafe(HOVER_MEDIA_QUERY, true),
  );
  const [isCoarsePointer, setIsCoarsePointer] = useState<boolean>(() =>
    matchMediaSafe(COARSE_MEDIA_QUERY, false),
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const hoverMql = window.matchMedia(HOVER_MEDIA_QUERY);
    const coarseMql = window.matchMedia(COARSE_MEDIA_QUERY);

    const handleHoverChange = (event: MediaQueryListEvent) => {
      setCanHover(event.matches);
    };
    const handleCoarseChange = (event: MediaQueryListEvent) => {
      setIsCoarsePointer(event.matches);
    };

    setCanHover(hoverMql.matches);
    setIsCoarsePointer(coarseMql.matches);

    hoverMql.addEventListener('change', handleHoverChange);
    coarseMql.addEventListener('change', handleCoarseChange);

    return () => {
      hoverMql.removeEventListener('change', handleHoverChange);
      coarseMql.removeEventListener('change', handleCoarseChange);
    };
  }, []);

  return useMemo<MotionCapabilities>(() => {
    const isTouchPrimary = !canHover || isCoarsePointer;

    return {
      prefersReducedMotion,
      canHover,
      isCoarsePointer,
      isTouchPrimary,
      controlTransition: prefersReducedMotion
        ? INSTANT_TRANSITION
        : MOTION_SPRING.control,
      surfaceTransition: prefersReducedMotion
        ? INSTANT_TRANSITION
        : MOTION_SPRING.surface,
      indicatorTransition: prefersReducedMotion
        ? INSTANT_TRANSITION
        : MOTION_SPRING.indicator,
      sharedTransition: prefersReducedMotion
        ? INSTANT_TRANSITION
        : MOTION_SPRING.shared,
      fadeTransition: REDUCED_FADE_TRANSITION,
    };
  }, [prefersReducedMotion, canHover, isCoarsePointer]);
}
