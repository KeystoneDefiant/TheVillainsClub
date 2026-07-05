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
  buildLigneeRoyaleSettlementProfile,
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
  hasPlayedFirstGame: boolean;
  isBum: boolean;
  customPlayerTitle: string | null;
  showBankruptcyDialogue: boolean;
  playedGames: Record<string, boolean>;
  startSession: (input: {
    gameId: string;
    drinkId: string;
    buyIn: number;
    settlement: TableSession["settlement"];
    gameModeId?: string;
  }) => StartClubSessionResult;
  startTutorialSession: (gameId: string) => void;
  updateActiveSessionProgress: (
    patch: Partial<Pick<TableSession, "progressRound" | "oublietteState" | "recent_spins">>,
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
  selectPlayerTitle: (titleId: string | null) => void;
  dismissBankruptcyDialogue: () => void;
  payBumFee: () => boolean;
  setDevTitleStates: (patch: {
    clubBalance?: number;
    hasPlayedFirstGame?: boolean;
    isBum?: boolean;
    customPlayerTitle?: string | null;
    playedGames?: Record<string, boolean>;
  }) => void;
};

const STORAGE_KEY = "villains-club-wallet";

const checkBankruptcyState = (balance: number, currentIsBum: boolean) => {
  if (balance < villainsGameDefaults.bankruptcy.minCreditsTrigger && !currentIsBum) {
    return {
      clubBalance: villainsGameDefaults.defaultClubBalance,
      isBum: true,
      showBankruptcyDialogue: true,
    };
  }
  return { clubBalance: balance };
};

export const useClubWallet = create<ClubWalletState>()(
  persist(
    (set, get) => ({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      playerName: null,
      activeSession: null,
      hasSave: false,
      hasPlayedFirstGame: false,
      isBum: false,
      customPlayerTitle: null,
      showBankruptcyDialogue: false,
      playedGames: {
        oubliette_no9: false,
        seven_year_itch: false,
        fateseal_silver: false,
        masterson_1881: false,
        lignee_royale: false,
      },
      startSession: (input) => {
        const { clubBalance, activeSession, isBum } = get();
        if (activeSession) return { ok: false, reason: "session_active" };
        const result = startTableSession(clubBalance, {
          gameId: input.gameId,
          drinkId: input.drinkId,
          buyIn: input.buyIn,
          settlement: input.settlement,
          gameModeId: input.gameModeId,
        });
        if (!result.ok) return { ok: false, reason: result.reason };
        const nextBalance = clubBalance - input.buyIn;
        const newState = checkBankruptcyState(nextBalance, isBum);
        set({
          ...newState,
          activeSession: result.session,
          playedGames: {
            ...get().playedGames,
            [input.gameId]: true,
          },
          hasPlayedFirstGame: true,
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
                : gameId === "lignee_royale"
                  ? buildLigneeRoyaleSettlementProfile(1000)
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
          playedGames: {
            ...get().playedGames,
            [gameId]: true,
          },
          hasPlayedFirstGame: true,
        });
      },
      updateActiveSessionProgress: (patch) => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: { ...activeSession, ...patch } });
      },
      endSession: (returned) => {
        const { clubBalance, activeSession, isBum } = get();
        if (!activeSession) return;
        if (activeSession.isTutorial) {
          set({ activeSession: null });
          return;
        }
        const rawTotal =
          typeof returned === "number" ? returned : Math.max(0, Math.floor(returned.totalReturn));
        const baseCap = getOublietteBaseReturnCeiling(activeSession.settlement, activeSession.gameId);
        const total = Math.min(rawTotal, baseCap);
        const { clubBalance: next } = settleTableSession(clubBalance, activeSession, total);
        const newState = checkBankruptcyState(next, isBum);
        set({
          ...newState,
          activeSession: null,
          hasPlayedFirstGame: true,
        });
      },
      creditClub: (amount) => {
        if (!Number.isFinite(amount)) return;
        const nextBalance = get().clubBalance + amount;
        const newState = checkBankruptcyState(nextBalance, get().isBum);
        set(newState);
      },
      setHasSave: (value) => set({ hasSave: value }),
      setPlayerName: (name) => set({ playerName: name }),
      forfeitActiveSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: null, hasPlayedFirstGame: true });
      },
      resetWalletAndSession: () =>
        set({
          clubBalance: villainsGameDefaults.defaultClubBalance,
          activeSession: null,
          playerName: null,
          hasSave: false,
          hasPlayedFirstGame: false,
          isBum: false,
          customPlayerTitle: null,
          showBankruptcyDialogue: false,
          playedGames: {
            oubliette_no9: false,
            seven_year_itch: false,
            fateseal_silver: false,
            masterson_1881: false,
            lignee_royale: false,
          },
        }),
      selectPlayerTitle: (titleId) => {
        set({ customPlayerTitle: titleId });
      },
      dismissBankruptcyDialogue: () => {
        set({ showBankruptcyDialogue: false });
      },
      payBumFee: () => {
        const { clubBalance, isBum } = get();
        if (!isBum) return false;
        if (clubBalance < villainsGameDefaults.bankruptcy.restoreMinCreditsRequired) return false;
        set({
          clubBalance: clubBalance - villainsGameDefaults.bankruptcy.restoreFee,
          isBum: false,
          customPlayerTitle: null,
        });
        return true;
      },
      setDevTitleStates: (patch) => {
        set(patch);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        clubBalance: s.clubBalance,
        playerName: s.playerName,
        activeSession: s.activeSession,
        hasSave: s.hasSave,
        hasPlayedFirstGame: s.hasPlayedFirstGame,
        isBum: s.isBum,
        customPlayerTitle: s.customPlayerTitle,
        playedGames: s.playedGames,
      }),
    },
  ),
);

export function getPlayerTitle(state: {
  clubBalance: number;
  hasPlayedFirstGame: boolean;
  isBum: boolean;
  customPlayerTitle: string | null;
}): string {
  if (state.isBum) {
    return villainsGameDefaults.bankruptcy.bumTitle;
  }

  const qualifies = (titleId: string): boolean => {
    if (titleId === "new_villain") return true;
    if (titleId === "villain") return state.hasPlayedFirstGame;
    if (titleId === "known_villain") return state.clubBalance >= 30000;
    if (titleId === "notorious_villain") return state.clubBalance >= 1000000;
    return false;
  };

  if (state.customPlayerTitle && qualifies(state.customPlayerTitle)) {
    const found = villainsGameDefaults.playerTitles.find((t) => t.id === state.customPlayerTitle);
    if (found) return found.title;
  }

  // Fallback to highest unlocked
  if (!state.hasPlayedFirstGame) {
    return "New Villain";
  }
  if (state.clubBalance >= 1000000) {
    return "Notorious Villain";
  }
  if (state.clubBalance >= 30000) {
    return "Known Villain";
  }
  return "Villain";
}
