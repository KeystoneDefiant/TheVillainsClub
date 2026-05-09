import { describe, expect, it } from "vitest";
import {
  barSettlementTone,
  netClubDeltaFromSettlement,
  pickSettlementQuip,
} from "../barSettlementQuips";
import type { BarRouteState } from "../barRouteState";

function table(over: Partial<BarRouteState["lastTable"]>): BarRouteState["lastTable"] {
  return {
    gameId: over.gameId ?? "oubliette_no9",
    buyIn: over.buyIn ?? 1000,
    totalReturn: over.totalReturn ?? 0,
    tableRound: over.tableRound ?? 1,
    tiers: over.tiers ?? 0,
  };
}

describe("barSettlementQuips", () => {
  it("netClubDeltaFromSettlement is totalReturn minus buy-in", () => {
    expect(netClubDeltaFromSettlement(table({ buyIn: 100, totalReturn: 40 }))).toBe(-60);
    expect(netClubDeltaFromSettlement(table({ buyIn: 100, totalReturn: 180 }))).toBe(80);
    expect(netClubDeltaFromSettlement(table({ buyIn: 1000, totalReturn: 1000 }))).toBe(0);
  });

  it("classifies extreme_loss for empty or nearly empty return", () => {
    expect(barSettlementTone(table({ totalReturn: 0, buyIn: 1000 }))).toBe("extreme_loss");
    expect(barSettlementTone(table({ totalReturn: 219, buyIn: 1000 }))).toBe("extreme_loss");
  });

  it("classifies loss for partial beat with no tier", () => {
    expect(barSettlementTone(table({ totalReturn: 500, buyIn: 1000, tiers: 0 }))).toBe("loss");
    expect(barSettlementTone(table({ totalReturn: 919, buyIn: 1000, tiers: 0 }))).toBe("loss");
  });

  it("classifies break_even for exact buy-in back with no tiers", () => {
    expect(barSettlementTone(table({ totalReturn: 1000, buyIn: 1000, tiers: 0 }))).toBe("break_even");
    expect(barSettlementTone(table({ totalReturn: 50, buyIn: 50, tiers: 0 }))).toBe("break_even");
  });

  it("classifies win for profit or tier credit without zero net edge case", () => {
    expect(barSettlementTone(table({ totalReturn: 1001, buyIn: 1000, tiers: 0 }))).toBe("win");
    expect(barSettlementTone(table({ totalReturn: 950, buyIn: 1000, tiers: 1 }))).toBe("win");
  });

  it("classifies extreme_win for big multiples or multiple tiers", () => {
    expect(barSettlementTone(table({ totalReturn: 3400, buyIn: 1000, tiers: 0 }))).toBe("extreme_win");
    expect(barSettlementTone(table({ totalReturn: 2100, buyIn: 1000, tiers: 2 }))).toBe("extreme_win");
  });

  it("pickSettlementQuip is deterministic for the same settlement row and tone", () => {
    const t = table({ gameId: "fateseal_silver", buyIn: 1200, totalReturn: 800, tableRound: 4, tiers: 0 });
    const tone = barSettlementTone(t);
    expect(pickSettlementQuip(tone, t)).toBe(pickSettlementQuip(tone, t));
  });
});
