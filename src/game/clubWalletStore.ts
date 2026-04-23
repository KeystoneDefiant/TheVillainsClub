import { create } from "zustand";
import { settleTableSession, startTableSession, type TableSession } from "./money";

type ClubWalletState = {
  clubBalance: number;
  activeSession: TableSession | null;
  hasSave: boolean;
  startSession: (input: { gameId: string; drinkId: string; buyIn: number }) => boolean;
  endSession: (returnedToClub: number) => void;
  creditClub: (amount: number) => void;
  setHasSave: (value: boolean) => void;
};

export const useClubWallet = create<ClubWalletState>((set, get) => ({
  clubBalance: 250,
  activeSession: null,
  hasSave: false,
  startSession: (input) => {
    const { clubBalance, activeSession } = get();
    if (activeSession) return false;
    const result = startTableSession(clubBalance, input);
    if (!result.ok) return false;
    set({
      clubBalance: clubBalance - input.buyIn,
      activeSession: result.session,
    });
    return true;
  },
  endSession: (returnedToClub) => {
    const { clubBalance, activeSession } = get();
    if (!activeSession) return;
    const { clubBalance: next } = settleTableSession(clubBalance, activeSession, returnedToClub);
    set({ clubBalance: next, activeSession: null });
  },
  creditClub: (amount) => {
    if (!Number.isFinite(amount)) return;
    set({ clubBalance: get().clubBalance + amount });
  },
  setHasSave: (value) => set({ hasSave: value }),
}));
