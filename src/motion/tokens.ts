import type { Transition, Variants } from 'motion/react';

/**
 * AURA 3.0 — Global Motion Tokens
 *
 * Calibrated for precision, spatial continuity, and restraint across desktop
 * and mobile surfaces. All motion animates strictly GPU-composited properties
 * (`transform` and `opacity`) and avoids excessive bounce or heavy blur loops.
 */

export const MOTION_DURATION = {
  /** Micro icon swaps, press releases, immediate toggles */
  instant: 0.12,
  /** Compact hover responses, small menu dismissals, focus transitions */
  micro: 0.16,
  /** Standard UI state changes, tooltips, list highlights */
  standard: 0.24,
  /** Floating surfaces, popovers, sheets, expanded controls */
  surface: 0.3,
  /** Main content view changes */
  page: 0.34,
  /** Shared layout & artwork continuity transitions */
  shared: 0.42,
} as const;

export const MOTION_DURATION_MS = {
  instant: 120,
  micro: 160,
  standard: 240,
  surface: 300,
  page: 340,
  shared: 420,
} as const;

export const MOTION_EASE = {
  /** Smooth deceleration for everyday interface state shifts */
  standard: [0.22, 1, 0.36, 1] as const,
  /** Crisp initial acceleration with a long, restrained settle */
  emphasized: [0.16, 1, 0.3, 1] as const,
  /** Quick, unobtrusive dismissal */
  exit: [0.4, 0, 1, 1] as const,
  linear: [0, 0, 1, 1] as const,
} as const;

export const MOTION_SPRING = {
  /** Small controls, transport buttons, icon states */
  control: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 34,
    mass: 0.7,
  },
  /** Floating overlays, popovers, sheets, player expansions */
  surface: {
    type: 'spring' as const,
    stiffness: 340,
    damping: 32,
    mass: 0.9,
  },
  /** Shared navigation indicators (aligned with MobileBottomNav pill) */
  indicator: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.85,
  },
  /** Larger shared-element continuity (artwork & container morphs) */
  shared: {
    type: 'spring' as const,
    stiffness: 280,
    damping: 30,
    mass: 0.95,
  },
} as const;

export const MOTION_SCALE = {
  pressControl: 0.95,
  pressSubtle: 0.985,
  hoverLift: 1.015,
  popoverInitial: 0.96,
  modalInitial: 0.97,
  artworkInitial: 0.98,
  iconSwapInitial: 0.86,
} as const;

export const MOTION_OFFSET = {
  popover: 6,
  page: 6,
  sheet: 24,
  drawer: 28,
} as const;

export const INSTANT_TRANSITION: Transition = {
  duration: 0,
};

export const REDUCED_FADE_TRANSITION: Transition = {
  duration: MOTION_DURATION.instant,
  ease: MOTION_EASE.standard,
};

export const MOTION_TRANSITION = {
  micro: {
    duration: MOTION_DURATION.micro,
    ease: MOTION_EASE.standard,
  } satisfies Transition,
  standard: {
    duration: MOTION_DURATION.standard,
    ease: MOTION_EASE.standard,
  } satisfies Transition,
  emphasized: {
    duration: MOTION_DURATION.surface,
    ease: MOTION_EASE.emphasized,
  } satisfies Transition,
  exit: {
    duration: MOTION_DURATION.instant,
    ease: MOTION_EASE.exit,
  } satisfies Transition,
  pageEnter: {
    duration: MOTION_DURATION.page,
    ease: MOTION_EASE.emphasized,
  } satisfies Transition,
  pageExit: {
    duration: MOTION_DURATION.micro,
    ease: MOTION_EASE.exit,
  } satisfies Transition,
} as const;

export type MotionDirection = 'up' | 'down' | 'left' | 'right' | 'none';
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: MOTION_TRANSITION.standard,
  },
  exit: {
    opacity: 0,
    transition: MOTION_TRANSITION.exit,
  },
};

export function createSlideFadeVariants(
  direction: MotionDirection = 'up',
  distance: number = MOTION_OFFSET.page,
  duration: number = MOTION_DURATION.standard,
): Variants {
  const offset =
    direction === 'up'
      ? { y: distance }
      : direction === 'down'
        ? { y: -distance }
        : direction === 'left'
          ? { x: distance }
          : direction === 'right'
            ? { x: -distance }
            : {};

  return {
    initial: { opacity: 0, ...offset },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, ease: MOTION_EASE.emphasized },
    },
    exit: {
      opacity: 0,
      ...offset,
      transition: MOTION_TRANSITION.exit,
    },
  };
}

export function createPopoverVariants(placement: PopoverPlacement = 'top'): Variants {
  const offset =
    placement === 'top'
      ? { y: MOTION_OFFSET.popover }
      : placement === 'bottom'
        ? { y: -MOTION_OFFSET.popover }
        : placement === 'left'
          ? { x: MOTION_OFFSET.popover }
          : { x: -MOTION_OFFSET.popover };

  return {
    initial: {
      opacity: 0,
      scale: MOTION_SCALE.popoverInitial,
      ...offset,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: MOTION_SPRING.surface,
    },
    exit: {
      opacity: 0,
      scale: MOTION_SCALE.popoverInitial,
      ...offset,
      transition: MOTION_TRANSITION.exit,
    },
  };
}

export const dialogVariants: Variants = {
  initial: {
    opacity: 0,
    scale: MOTION_SCALE.modalInitial,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRING.surface,
  },
  exit: {
    opacity: 0,
    scale: MOTION_SCALE.modalInitial,
    y: 6,
    transition: MOTION_TRANSITION.exit,
  },
};

export const bottomSheetVariants: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_OFFSET.sheet,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: MOTION_SPRING.surface,
  },
  exit: {
    opacity: 0,
    y: MOTION_OFFSET.sheet,
    transition: MOTION_TRANSITION.micro,
  },
};

export function createDrawerVariants(side: 'left' | 'right' = 'right'): Variants {
  const xOffset = side === 'right' ? MOTION_OFFSET.drawer : -MOTION_OFFSET.drawer;
  return {
    initial: {
      opacity: 0,
      x: xOffset,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: MOTION_SPRING.surface,
    },
    exit: {
      opacity: 0,
      x: xOffset,
      transition: MOTION_TRANSITION.micro,
    },
  };
}

export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_OFFSET.page,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: MOTION_TRANSITION.pageEnter,
  },
  exit: {
    opacity: 0,
    y: -MOTION_OFFSET.page,
    transition: MOTION_TRANSITION.pageExit,
  },
};

export const artworkTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    scale: MOTION_SCALE.artworkInitial,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: MOTION_TRANSITION.emphasized,
  },
  exit: {
    opacity: 0,
    scale: 1.01,
    transition: MOTION_TRANSITION.micro,
  },
};
