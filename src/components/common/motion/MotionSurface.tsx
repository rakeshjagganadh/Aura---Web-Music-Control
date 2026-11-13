import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import {
  artworkTransitionVariants,
  bottomSheetVariants,
  createDrawerVariants,
  createPopoverVariants,
  createSlideFadeVariants,
  dialogVariants,
  fadeVariants,
  MOTION_DURATION,
  MOTION_OFFSET,
  pageTransitionVariants,
  REDUCED_FADE_TRANSITION,
  type MotionDirection,
  type PopoverPlacement,
} from '../../../motion/tokens';
import { useMotionCapabilities } from '../../../motion/useMotionCapabilities';

export interface MotionFadeSlideProps extends HTMLMotionProps<'div'> {
  direction?: MotionDirection;
  distance?: number;
  duration?: keyof typeof MOTION_DURATION;
  children: React.ReactNode;
}

/**
 * Reusable directional opacity + settle container.
 * Collapses spatial travel to a clean opacity fade when reduced motion is enabled.
 */
export function MotionFadeSlide({
  direction = 'up' as MotionDirection,
  distance = MOTION_OFFSET.page,
  duration = 'standard' as keyof typeof MOTION_DURATION,
  children,
  ...rest
}: MotionFadeSlideProps) {
  const { prefersReducedMotion } = useMotionCapabilities();
  const variants = prefersReducedMotion
    ? fadeVariants
    : createSlideFadeVariants(direction, distance, MOTION_DURATION[duration]);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export interface MotionPopoverProps extends HTMLMotionProps<'div'> {
  placement?: PopoverPlacement;
  children: React.ReactNode;
}

/**
 * Floating popover / dropdown / context menu transition.
 * Anchors subtly toward its trigger edge with a restrained scale settle.
 */
export function MotionPopover({
  placement = 'top' as PopoverPlacement,
  children,
  ...rest
}: MotionPopoverProps) {
  const { prefersReducedMotion } = useMotionCapabilities();
  const variants = prefersReducedMotion
    ? fadeVariants
    : createPopoverVariants(placement);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export interface MotionBackdropProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
}

/**
 * Smooth scrim backdrop transition for modals, sheets, and drawers.
 */
export const MotionBackdrop: React.FC<MotionBackdropProps> = ({
  children,
  ...rest
}) => {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export type MotionModalVariant = 'center' | 'bottom-sheet' | 'drawer-right' | 'drawer-left';

export interface MotionModalProps extends HTMLMotionProps<'div'> {
  variant?: MotionModalVariant;
  children: React.ReactNode;
}

/**
 * Reusable surface container for centered desktop dialogs, mobile bottom sheets,
 * and slide-over drawers.
 */
export const MotionModal: React.FC<MotionModalProps> = ({
  variant = 'center',
  children,
  ...rest
}) => {
  const { prefersReducedMotion } = useMotionCapabilities();

  const variants = prefersReducedMotion
    ? fadeVariants
    : variant === 'bottom-sheet'
      ? bottomSheetVariants
      : variant === 'drawer-right'
        ? createDrawerVariants('right')
        : variant === 'drawer-left'
          ? createDrawerVariants('left')
          : dialogVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export interface MotionPageProps extends HTMLMotionProps<'div'> {
  viewKey: string;
  children: React.ReactNode;
}

/**
 * Lightweight main-view transition wrapper that keeps route changes responsive
 * without layout reflow or blocking pointer events.
 */
export const MotionPage: React.FC<MotionPageProps> = ({
  viewKey,
  children,
  ...rest
}) => {
  const { prefersReducedMotion } = useMotionCapabilities();

  return (
    <motion.div
      key={viewKey}
      variants={prefersReducedMotion ? fadeVariants : pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={prefersReducedMotion ? REDUCED_FADE_TRANSITION : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export interface MotionArtworkProps extends HTMLMotionProps<'div'> {
  artworkKey: string;
  children: React.ReactNode;
}

/**
 * Restrained crossfade + micro-scale settle when track artwork changes.
 */
export const MotionArtwork: React.FC<MotionArtworkProps> = ({
  artworkKey,
  children,
  ...rest
}) => {
  const { prefersReducedMotion } = useMotionCapabilities();

  return (
    <motion.div
      key={artworkKey}
      variants={prefersReducedMotion ? fadeVariants : artworkTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      {...rest}
    >
      {children}
    </motion.div>
  );
};
