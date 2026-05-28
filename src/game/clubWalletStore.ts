import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { settleTableSession, startTableSession, type TableSession } from "./money";
import {
  getOublietteBaseReturnCeiling,
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  buildFatesealSettlementProfile,
  buildMastersonSettlementProfile,
} from "./sessionSettlement";
import type { ClubTableReturnDetail } from "./sessionSettlement";

export type StartClubSessionResult =
  | { ok: true }
  | { ok: false; reason: "session_active" | "insufficient_funds" | "invalid_buy_in" };

type ClubWalletState = {
  clubBalance: number;
  playerName: string | null;
  activeSession: TableSession | null;
  hasSave: boolean;
  startSession: (input: {
    gameId: string;
    drinkId: string;
    buyIn: number;
    settlement: TableSession["settlement"];
    gameModeId?: string;
  }) => StartClubSessionResult;
  startTutorialSession: (gameId: string) => void;
  updateActiveSessionProgress: (
    patch: Partial<Pick<TableSession, "progressRound" | "oublietteState">>,
  ) => void;
  endSession: (returned: number | ClubTableReturnDetail) => void;
  creditClub: (amount: number) => void;
  setHasSave: (value: boolean) => void;
  setPlayerName: (name: string) => void;
  /** Club balance → default, clear table session and resume stub. Does not touch audio or other prefs. */
  resetWalletAndSession: () => void;
  /**
   * End the active table without returning session credits to the club wallet.
   * Buy-in already left the club at `startSession`; forfeiture means no payout and no refund.
   */
  forfeitActiveSession: () => void;
};

const STORAGE_KEY = "villains-club-wallet";

export const useClubWallet = create<ClubWalletState>()(
  persist(
    (set, get) => ({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      playerName: null,
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
          gameModeId: input.gameModeId,
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        set({
          clubBalance: clubBalance - input.buyIn,
          activeSession: result.session,
        });
        return { ok: true };
      },
      startTutorialSession: (gameId) => {
        const { activeSession } = get();
        if (activeSession) return;
        const settlement =
          gameId === "oubliette_no9"
            ? buildOublietteSettlementProfile(1000)
            : gameId === "fateseal_silver"
              ? buildFatesealSettlementProfile(1000)
              : gameId === "masterson_1881"
                ? buildMastersonSettlementProfile(1000)
                : buildSevenYearItchSettlementProfile(1000);
        set({
          activeSession: {
            gameId,
            drinkId: "tutorial",
            buyIn: 1000,
            sessionWallet: 1000,
            gameModeId: "house",
            isTutorial: true,
            settlement,
          },
        });
      },
      updateActiveSessionProgress: (patch) => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: { ...activeSession, ...patch } });
      },
      endSession: (returned) => {
        const { clubBalance, activeSession } = get();
        if (!activeSession) return;
        if (activeSession.isTutorial) {
          set({ activeSession: null });
          return;
        }
        const rawTotal =
          typeof returned === "number" ? returned : Math.max(0, Math.floor(returned.totalReturn));
        const baseCap = getOublietteBaseReturnCeiling(activeSession.settlement);
        const total = Math.min(rawTotal, baseCap);
        const { clubBalance: next } = settleTableSession(clubBalance, activeSession, total);
        set({ clubBalance: next, activeSession: null });
      },
      creditClub: (amount) => {
        if (!Number.isFinite(amount)) return;
        set({ clubBalance: get().clubBalance + amount });
      },
      setHasSave: (value) => set({ hasSave: value }),
      setPlayerName: (name) => set({ playerName: name }),
      forfeitActiveSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: null });
      },
      resetWalletAndSession: () =>
        set({
          clubBalance: villainsGameDefaults.defaultClubBalance,
          activeSession: null,
          playerName: null,
          hasSave: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        clubBalance: s.clubBalance,
        playerName: s.playerName,
        activeSession: s.activeSession,
        hasSave: s.hasSave,
      }),
    },
  ),
);
