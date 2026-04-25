import { describe, expect, it } from "vitest";
import {
  clampFreeOdds,
  initialBets,
  initialTableState,
  resolveRoll,
  totalOnLayout,
  type DiceRoll,
} from "../craplessEngine";

function roll(d1: number, d2: number): DiceRoll {
  return { d1, d2, total: d1 + d2 };
}

describe("resolveRoll crapless", () => {
  it("come-out 7 pays pass even money and clears bets", () => {
    const t0 = initialTableState();
    const b0 = { ...initialBets(), passLine: 100 };
    const r = resolveRoll(t0, b0, roll(3, 4));
    expect(r.walletDelta).toBe(200);
    expect(r.nextTable.phase).toBe("comeOut");
    expect(r.nextBets.passLine).toBe(0);
  });

  it("come-out 8 establishes point", () => {
    const t0 = initialTableState();
    const b0 = { ...initialBets(), passLine: 50 };
    const r = resolveRoll(t0, b0, roll(4, 4));
    expect(r.walletDelta).toBe(0);
    expect(r.nextTable.phase).toBe("point");
    expect(r.nextTable.point).toBe(8);
    expect(r.nextBets.passLine).toBe(50);
  });

  it("seven-out clears layout without wallet credit", () => {
    const t0 = { phase: "point" as const, point: 8 as const, rollsSincePoint: 2 };
    const b0 = { passLine: 100, freeOdds: 100, place: { 6: 30 } };
    const r = resolveRoll(t0, b0, roll(3, 4));
    expect(r.walletDelta).toBe(0);
    expect(r.nextBets.passLine).toBe(0);
    expect(r.nextBets.freeOdds).toBe(0);
    expect(Object.keys(r.nextBets.place).length).toBe(0);
    expect(r.nextTable.phase).toBe("comeOut");
  });

  it("making the point pays pass, odds, and place on the point", () => {
    const t0 = { phase: "point" as const, point: 6 as const, rollsSincePoint: 1 };
    const b0 = { passLine: 100, freeOdds: 60, place: { 6: 30 } };
    const r = resolveRoll(t0, b0, roll(3, 3));
    expect(r.walletDelta).toBe(397);
    expect(r.nextTable.phase).toBe("comeOut");
    expect(r.nextBets.passLine).toBe(0);
  });

  it("place hit (not point) pays profit only; stake rides", () => {
    const t0 = { phase: "point" as const, point: 8 as const, rollsSincePoint: 0 };
    const b0 = { passLine: 50, freeOdds: 0, place: { 5: 25 } };
    const r = resolveRoll(t0, b0, roll(2, 3));
    const profit = Math.floor((25 * 7) / 5);
    expect(r.walletDelta).toBe(profit);
    expect(r.nextBets.place[5]).toBe(25);
  });

  it("increments rollsSincePoint in point phase", () => {
    const t0 = { phase: "point" as const, point: 9 as const, rollsSincePoint: 0 };
    const b0 = { passLine: 10, freeOdds: 0, place: {} };
    const r = resolveRoll(t0, b0, roll(2, 2));
    expect(r.nextTable.rollsSincePoint).toBe(1);
  });
});

describe("clampFreeOdds", () => {
  it("caps at 2× pass by default", () => {
    expect(clampFreeOdds(100, 250)).toBe(200);
    expect(clampFreeOdds(100, 50)).toBe(50);
  });
});

describe("totalOnLayout", () => {
  it("sums pass, odds, and places", () => {
    expect(
      totalOnLayout({
        passLine: 10,
        freeOdds: 20,
        place: { 4: 5, 10: 5 },
      }),
    ).toBe(40);
  });
});
