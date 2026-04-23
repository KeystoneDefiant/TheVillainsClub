/**
 * Economy contract (club vs table session).
 *
 * - `clubBalance` is the persisted global wallet.
 * - `sessionWallet` is the stake isolated for the active minigame session.
 * - Minigames receive only `{ sessionWallet, rulesPayload }` and never read or write `clubBalance`.
 */

export type TableSession = {
  gameId: string;
  drinkId: string;
  buyIn: number;
  sessionWallet: number;
};

export type MinigameRuntimeProps = {
  sessionWallet: number;
  rulesPayload: unknown;
};

export type StartSessionInput = {
  gameId: string;
  drinkId: string;
  buyIn: number;
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
  return {
    ok: true,
    session: {
      gameId: input.gameId,
      drinkId: input.drinkId,
      buyIn: input.buyIn,
      sessionWallet: input.buyIn,
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
