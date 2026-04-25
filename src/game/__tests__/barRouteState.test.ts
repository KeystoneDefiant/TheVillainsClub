import { describe, expect, it } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { buildBarRouteStateFromReturn, isBarRouteState, tableReturnTagline } from "../barRouteState";

const defaultBuyIn = villainsGameDefaults.oublietteNo9.defaultBuyIn;

describe("barRouteState", () => {
  it("isBarRouteState validates shape", () => {
    expect(isBarRouteState(null)).toBe(false);
    expect(isBarRouteState({})).toBe(false);
    expect(
      isBarRouteState({
        lastTable: {
          gameId: "oubliette_no9",
          buyIn: defaultBuyIn,
          totalReturn: 50,
          tableRound: 5,
          tiers: 0,
        },
      }),
    ).toBe(true);
  });

  it("buildBarRouteStateFromReturn copies detail fields", () => {
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 200,
      basePayout: 50,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 50,
      tableRound: 12,
    });
    expect(state.lastTable).toEqual({
      gameId: "oubliette_no9",
      buyIn: defaultBuyIn,
      totalReturn: 50,
      tableRound: 12,
      tiers: 0,
    });
  });

  it("tableReturnTagline picks tier and round lines", () => {
    expect(
      tableReturnTagline({ gameId: "x", buyIn: defaultBuyIn, totalReturn: 0, tableRound: 1, tiers: 0 }),
    ).toMatch(/Rest the deck/i);
    expect(
      tableReturnTagline({
        gameId: "x",
        buyIn: defaultBuyIn,
        totalReturn: defaultBuyIn * 10,
        tableRound: 5,
        tiers: 1,
      }),
    ).toMatch(/grudgingly/i);
    expect(
      tableReturnTagline({
        gameId: "x",
        buyIn: defaultBuyIn,
        totalReturn: defaultBuyIn,
        tableRound: 31,
        tiers: 0,
      }),
    ).toMatch(/went deep/i);
  });
});
