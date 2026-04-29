import { create } from "zustand";

type ClubFlowState = {
  /** Set once the player steps past the landing door for the current app session. */
  hasEnteredClub: boolean;
  setHasEnteredClub: (entered: boolean) => void;
};

export const useClubFlowStore = create<ClubFlowState>((set) => ({
  hasEnteredClub: false,
  setHasEnteredClub: (hasEnteredClub) => set({ hasEnteredClub }),
}));
