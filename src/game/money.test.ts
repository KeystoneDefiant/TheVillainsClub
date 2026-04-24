import { describe, expect, it } from "vitest";
import { settleTableSession, startTableSession, type TableSession } from "./money";
import type { OublietteSettlementProfile } from "./sessionSettlement";

const profile = (buyIn: number): OublietteSettlementProfile => ({
  buyIn,
  maxReturnMultipleOfBuyIn: 50,
  capModifierProduct: 1,
  overachievement: {
    capMultiple: 50,
    buyInSlab: 1,
    tierStepMultiple: 5,
    bonusMultipleOfBuyInPerTier: 5,
  },
});

describe("startTableSession", () => {
  it("stores settlement on the session", () => {
    const settlement = profile(100);
    const r = startTableSession(1000, {
      gameId: "oubliette_no9",
      drinkId: "x",
      buyIn: 100,
      settlement,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.session.settlement).toEqual(settlement);
  });

  it("rejects settlement buy-in mismatch", () => {
    const r = startTableSession(1000, {
      gameId: "x",
      drinkId: "x",
      buyIn: 100,
      settlement: profile(99),
    });
    expect(r.ok).toBe(false);
  });
});

describe("settleTableSession", () => {
  const session: TableSession = {
    gameId: "x",
    drinkId: "x",
    buyIn: 100,
    sessionWallet: 100,
    settlement: profile(100),
  };

  it("adds returned credits to club balance", () => {
    const { clubBalance } = settleTableSession(500, session, 6500);
    expect(clubBalance).toBe(7000);
  });
});
