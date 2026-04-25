export type MotionPreset = {
  introTitleDuration: number;
  /** Per grey letter stroke in the VC intro mark; zoom spans `7 * introLogoLetterDrawSec`. */
  introLogoLetterDrawSec: number;
  /** Pause after the last grey stroke before the intro moves to the “hold” phase. */
  introLogoSettleSec: number;
  /** How long the full title block stays readable before auto-advancing to exit. */
  introHoldSec: number;
  introTaglineDelay: number;
  introTaglineDuration: number;
  introFadeOut: number;
  menuStagger: number;
  menuItemDuration: number;
  easing: readonly [number, number, number, number];
};

export const defaultMotionPreset: MotionPreset = {
  introTitleDuration: 0.9,
  introLogoLetterDrawSec: 0.22,
  introLogoSettleSec: 0.38,
  introHoldSec: 2.15,
  introTaglineDelay: 0.35,
  introTaglineDuration: 0.65,
  introFadeOut: 0.45,
  menuStagger: 0.055,
  menuItemDuration: 0.32,
  easing: [0.22, 1, 0.36, 1] as const,
};
