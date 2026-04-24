import { describe, expect, it } from "vitest";
import { buildBarRouteStateFromReturn, isBarRouteState, tableReturnTagline } from "../barRouteState";

describe("barRouteState", () => {
  it("isBarRouteState validates shape", () => {
    expect(isBarRouteState(null)).toBe(false);
    expect(isBarRouteState({})).toBe(false);
    expect(
      isBarRouteState({
        lastTable: { gameId: "oubliette_no9", buyIn: 100, totalReturn: 50, tableRound: 5, tiers: 0 },
      }),
    ).toBe(true);
  });

  it("buildBarRouteStateFromReturn copies detail fields", () => {
    const state = buildBarRouteStateFromReturn("oubliette_no9", 100, {
      uncappedCredits: 200,
      basePayout: 50,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 50,
      tableRound: 12,
    });
    expect(state.lastTable).toEqual({
      gameId: "oubliette_no9",
      buyIn: 100,
      totalReturn: 50,
      tableRound: 12,
      tiers: 0,
    });
  });

  it("tableReturnTagline picks tier and round lines", () => {
    expect(tableReturnTagline({ gameId: "x", buyIn: 100, totalReturn: 0, tableRound: 1, tiers: 0 })).toMatch(
      /Rest the deck/i,
    );
    expect(tableReturnTagline({ gameId: "x", buyIn: 100, totalReturn: 2000, tableRound: 5, tiers: 1 })).toMatch(
      /grudgingly/i,
    );
    expect(tableReturnTagline({ gameId: "x", buyIn: 100, totalReturn: 100, tableRound: 31, tiers: 0 })).toMatch(
      /went deep/i,
    );
  });
});
