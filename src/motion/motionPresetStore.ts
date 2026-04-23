import { create } from "zustand";
import { defaultMotionPreset, type MotionPreset } from "./presets";

type MotionPresetState = {
  preset: MotionPreset;
  setPartial: (partial: Partial<MotionPreset>) => void;
  reset: () => void;
};

export const useMotionPresetStore = create<MotionPresetState>((set) => ({
  preset: defaultMotionPreset,
  setPartial: (partial) =>
    set((s) => ({
      preset: { ...s.preset, ...partial },
    })),
  reset: () => set({ preset: defaultMotionPreset }),
}));
