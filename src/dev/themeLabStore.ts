import { create } from "zustand";
import type { MantineThemeOverride } from "@mantine/core";

type ThemeLabState = {
  override: MantineThemeOverride;
  setOverride: (partial: MantineThemeOverride) => void;
  reset: () => void;
};

export const useThemeLab = create<ThemeLabState>((set) => ({
  override: {},
  setOverride: (partial) =>
    set((s) => ({
      override: { ...s.override, ...partial },
    })),
  reset: () => set({ override: {} }),
}));
