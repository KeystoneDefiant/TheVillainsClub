import { describe, expect, it } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { settleTableSession, startTableSession, type TableSession } from "./money";
import type { OublietteSettlementProfile } from "./sessionSettlement";

const o9 = villainsGameDefaults.oublietteNo9;

const profile = (buyIn: number): OublietteSettlementProfile => ({
  buyIn,
  maxReturnMultipleOfBuyIn: o9.maxReturnMultipleOfBuyIn,
  capModifierProduct: 1,
  overachievement: { ...o9.overachievement },
});

describe("startTableSession", () => {
  it("stores settlement on the session", () => {
    const buyIn = o9.defaultBuyIn;
    const settlement = profile(buyIn);
    const r = startTableSession(villainsGameDefaults.defaultClubBalance, {
      gameId: "oubliette_no9",
      drinkId: "x",
      buyIn,
      settlement,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.session.settlement).toEqual(settlement);
      expect(r.session.progressRound).toBeUndefined();
    }
  });

  it("rejects settlement buy-in mismatch", () => {
    const buyIn = o9.defaultBuyIn;
    const r = startTableSession(villainsGameDefaults.defaultClubBalance, {
      gameId: "x",
      drinkId: "x",
      buyIn,
      settlement: profile(buyIn - 1),
    });
    expect(r.ok).toBe(false);
  });
});

describe("settleTableSession", () => {
  const buyIn = o9.defaultBuyIn;
  const session: TableSession = {
    gameId: "x",
    drinkId: "x",
    buyIn,
    sessionWallet: buyIn,
    settlement: profile(buyIn),
  };

  it("adds returned credits to club balance", () => {
    const { clubBalance } = settleTableSession(500, session, 6500);
    expect(clubBalance).toBe(7000);
  });
});
