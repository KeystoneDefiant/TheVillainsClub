import { create } from "zustand";

/**
 * Fullscreen intro handoff (red zoom → fade) after "Enter the Club" while `/bar` mounts underneath.
 */
type IntroToBarTransitionState = {
  active: boolean;
  begin: () => void;
  end: () => void;
};

export const useIntroToBarTransition = create<IntroToBarTransitionState>((set) => ({
  active: false,
  begin: () => set({ active: true }),
  end: () => set({ active: false }),
}));
