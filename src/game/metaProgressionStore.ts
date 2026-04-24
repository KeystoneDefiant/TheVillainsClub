import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const STORAGE_KEY = "villains-club-meta";

type MetaProgressionState = {
  /**
   * Future-facing: narrative / club unlock ids (drinks, tables, modes, etc.).
   * Empty until features write into this list.
   */
  unlockIds: string[];
  resetMetaProgression: () => void;
};

export const useMetaProgression = create<MetaProgressionState>()(
  persist(
    (set) => ({
      unlockIds: [],
      resetMetaProgression: () => set({ unlockIds: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ unlockIds: s.unlockIds }),
    },
  ),
);
