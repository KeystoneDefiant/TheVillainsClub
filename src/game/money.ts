/**
 * Economy contract (club vs table session).
 *
 * - `clubBalance` is the persisted global wallet.
 * - `sessionWallet` is the stake isolated for the active minigame session.
 * - `oublietteState` stores the current table snapshot so resuming does not create a new buy-in.
 * - Minigames never read or write `clubBalance` directly; the shell settles using `settlement` snapshots.
 */

import type { GameState as OublietteGameState } from "@/minigames/oubliette-no9/types";
import type { OublietteSettlementProfile } from "./sessionSettlement";

export type TableSession = {
  gameId: string;
  drinkId: string;
  buyIn: number;
  sessionWallet: number;
  /** Last resumable round / roll marker reported by a minigame. */
  progressRound?: number;
  /** Oubliette state snapshot for resuming without another buy-in. */
  oublietteState?: OublietteGameState;
  /** Game-specific settlement snapshot (same cap shape for Oubliette and 7 Year Itch; see `sessionSettlement.ts`). */
  settlement: OublietteSettlementProfile;
};

export type MinigameRuntimeProps = {
  sessionWallet: number;
  rulesPayload: unknown;
};

export type StartSessionInput = {
  gameId: string;
  drinkId: string;
  buyIn: number;
  settlement: OublietteSettlementProfile;
};

export type StartSessionResult =
  | { ok: true; session: TableSession }
  | { ok: false; reason: "insufficient_funds" | "invalid_buy_in" };

export function startTableSession(
  clubBalance: number,
  input: StartSessionInput,
): StartSessionResult {
  if (!Number.isFinite(input.buyIn) || input.buyIn <= 0) {
    return { ok: false, reason: "invalid_buy_in" };
  }
  if (input.buyIn > clubBalance) {
    return { ok: false, reason: "insufficient_funds" };
  }
  if (!input.settlement || Math.floor(input.settlement.buyIn) !== Math.floor(input.buyIn)) {
    return { ok: false, reason: "invalid_buy_in" };
  }
  return {
    ok: true,
    session: {
      gameId: input.gameId,
      drinkId: input.drinkId,
      buyIn: input.buyIn,
      sessionWallet: input.buyIn,
      settlement: input.settlement,
    },
  };
}

export function settleTableSession(
  clubBalance: number,
  _session: TableSession,
  returnedToClub: number,
): { clubBalance: number } {
  const safeReturn = Number.isFinite(returnedToClub) ? Math.max(0, returnedToClub) : 0;
  return { clubBalance: clubBalance + safeReturn };
}
