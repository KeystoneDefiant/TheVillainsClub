export type MotionPreset = {
  introTitleDuration: number;
  introTaglineDelay: number;
  introTaglineDuration: number;
  introFadeOut: number;
  menuStagger: number;
  menuItemDuration: number;
  easing: readonly [number, number, number, number];
};

export const defaultMotionPreset: MotionPreset = {
  introTitleDuration: 0.9,
  introTaglineDelay: 0.35,
  introTaglineDuration: 0.65,
  introFadeOut: 0.45,
  menuStagger: 0.08,
  menuItemDuration: 0.4,
  easing: [0.22, 1, 0.36, 1] as const,
};
