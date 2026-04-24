import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { settleTableSession, startTableSession, type TableSession } from "./money";
import type { ClubTableReturnDetail } from "./sessionSettlement";

export type StartClubSessionResult =
  | { ok: true }
  | { ok: false; reason: "session_active" | "insufficient_funds" | "invalid_buy_in" };

type ClubWalletState = {
  clubBalance: number;
  activeSession: TableSession | null;
  hasSave: boolean;
  startSession: (input: {
    gameId: string;
    drinkId: string;
    buyIn: number;
    settlement: TableSession["settlement"];
  }) => StartClubSessionResult;
  endSession: (returned: number | ClubTableReturnDetail) => void;
  creditClub: (amount: number) => void;
  setHasSave: (value: boolean) => void;
  /** Club balance → default, clear table session and resume stub. Does not touch audio or other prefs. */
  resetWalletAndSession: () => void;
};

const STORAGE_KEY = "villains-club-wallet";

export const useClubWallet = create<ClubWalletState>()(
  persist(
    (set, get) => ({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      activeSession: null,
      hasSave: false,
      startSession: (input) => {
        const { clubBalance, activeSession } = get();
        if (activeSession) return { ok: false, reason: "session_active" };
        const result = startTableSession(clubBalance, {
          gameId: input.gameId,
          drinkId: input.drinkId,
          buyIn: input.buyIn,
          settlement: input.settlement,
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        set({
          clubBalance: clubBalance - input.buyIn,
          activeSession: result.session,
        });
        return { ok: true };
      },
      endSession: (returned) => {
        const { clubBalance, activeSession } = get();
        if (!activeSession) return;
        const total =
          typeof returned === "number" ? returned : Math.max(0, Math.floor(returned.totalReturn));
        const { clubBalance: next } = settleTableSession(clubBalance, activeSession, total);
        set({ clubBalance: next, activeSession: null });
      },
      creditClub: (amount) => {
        if (!Number.isFinite(amount)) return;
        set({ clubBalance: get().clubBalance + amount });
      },
      setHasSave: (value) => set({ hasSave: value }),
      resetWalletAndSession: () =>
        set({
          clubBalance: villainsGameDefaults.defaultClubBalance,
          activeSession: null,
          hasSave: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        clubBalance: s.clubBalance,
        hasSave: s.hasSave,
      }),
    },
  ),
);
