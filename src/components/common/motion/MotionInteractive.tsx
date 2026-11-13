import React from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import {
  MOTION_SCALE,
  MOTION_TRANSITION,
  REDUCED_FADE_TRANSITION,
} from '../../../motion/tokens';
import { useMotionCapabilities } from '../../../motion/useMotionCapabilities';

export interface MotionPressProps extends HTMLMotionProps<'button'> {
  /** 'control' for compact buttons/icons; 'subtle' for larger tiles/cards */
  intensity?: 'control' | 'subtle';
  /** Enable slight hover scale only on true hover devices (desktop) */
  enableHoverScale?: boolean;
  children: React.ReactNode;
}

/**
 * Platform-aware tactile button wrapper.
 * - Desktop (`hover: hover` + `pointer: fine`): optional restrained hover scale + crisp press compression.
 * - Mobile / Touch: zero hover scale (avoids sticky hover states) + immediate tap response.
 * - Reduced Motion: zero transform scaling.
 */
export const MotionPress = React.forwardRef<HTMLButtonElement, MotionPressProps>(
  (
    {
      intensity = 'control',
      enableHoverScale = false,
      disabled = false,
      type = 'button',
      children,
      ...rest
    },
    ref,
  ) => {
    const { prefersReducedMotion, canHover, controlTransition } =
      useMotionCapabilities();

    const tapScale =
      intensity === 'control'
        ? MOTION_SCALE.pressControl
        : MOTION_SCALE.pressSubtle;

    const shouldAnimate = !disabled && !prefersReducedMotion;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        whileHover={
          shouldAnimate && canHover && enableHoverScale
            ? { scale: MOTION_SCALE.hoverLift }
            : undefined
        }
        whileTap={shouldAnimate ? { scale: tapScale } : undefined}
        transition={controlTransition}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);

MotionPress.displayName = 'MotionPress';

export interface MotionIconSwapProps {
  /** Unique key representing the current icon state (e.g. 'play' | 'pause') */
  stateKey: string | number | boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Fast, restrained micro-transition for stateful icon changes (Play/Pause, Mute, Heart, Repeat).
 */
export const MotionIconSwap: React.FC<MotionIconSwapProps> = ({
  stateKey,
  className = 'inline-flex items-center justify-center',
  children,
}) => {
  const { prefersReducedMotion } = useMotionCapabilities();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={String(stateKey)}
        className={className}
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: MOTION_SCALE.iconSwapInitial }
        }
        animate={
          prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
        }
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: MOTION_SCALE.iconSwapInitial }
        }
        transition={
          prefersReducedMotion
            ? REDUCED_FADE_TRANSITION
            : MOTION_TRANSITION.micro
        }
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
};

export interface SharedIndicatorProps {
  layoutId: string;
  className?: string;
}

/**
 * Shared layout indicator pill/bar using AURA's calibrated indicator spring
 * (consistent with MobileBottomNav's active pill physics).
 */
export const SharedIndicator: React.FC<SharedIndicatorProps> = ({
  layoutId,
  className = '',
}) => {
  const { indicatorTransition } = useMotionCapabilities();

  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden="true"
      transition={indicatorTransition}
      className={className}
    />
  );
};
