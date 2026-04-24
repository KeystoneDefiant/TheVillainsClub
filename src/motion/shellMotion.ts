import type { MotionPreset } from "./presets";

/**
 * Shell menu list variants for Framer Motion.
 * Keeps `opacity` + `translateY` on the compositor by also setting `z: 0` so Motion emits `translate3d(...)`
 * instead of a 2D-only translate.
 */
export function shellMenuContainerVariants(preset: MotionPreset, reduceMotion: boolean) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 1, z: 0 },
      show: { opacity: 1, z: 0, transition: { staggerChildren: 0, delayChildren: 0 } },
    };
  }
  return {
    hidden: { opacity: 0, z: 0 },
    show: {
      opacity: 1,
      z: 0,
      transition: {
        type: "tween" as const,
        staggerChildren: preset.menuStagger,
        delayChildren: 0.06,
        when: "beforeChildren" as const,
      },
    },
  };
}

export function shellMenuItemVariants(preset: MotionPreset, reduceMotion: boolean) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 1, y: 0, z: 0 },
      show: { opacity: 1, y: 0, z: 0, transition: { duration: 0 } },
    };
  }
  const easing = preset.easing;
  return {
    hidden: { opacity: 0, y: 14, z: 0 },
    show: {
      opacity: 1,
      y: 0,
      z: 0,
      transition: {
        type: "tween" as const,
        duration: preset.menuItemDuration,
        ease: [...easing] as [number, number, number, number],
      },
    },
  };
}
