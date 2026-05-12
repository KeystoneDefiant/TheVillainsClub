import { describe, expect, it } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { buildOublietteSettlementProfile } from "../sessionSettlement";
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
    expect(
      isBarRouteState({
        lastTable: {
          gameId: "oubliette_no9",
          buyIn: defaultBuyIn,
          totalReturn: 50,
          tableRound: 5,
          tiers: 0,
          maxWinCredits: Number.NaN,
        },
      }),
    ).toBe(false);
  });

  it("buildBarRouteStateFromReturn copies detail fields and max win ceiling", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn);
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 200,
      basePayout: 50,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 50,
      tableRound: 12,
    }, settlement);
    expect(state.lastTable.gameId).toBe("oubliette_no9");
    expect(state.lastTable.buyIn).toBe(defaultBuyIn);
    expect(state.lastTable.totalReturn).toBe(50);
    expect(state.lastTable.tableRound).toBe(12);
    expect(state.lastTable.tiers).toBe(0);
    expect(state.lastTable.maxWinCredits).toBeGreaterThan(0);
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

  it("tableReturnTagline uses 7 Year Itch copy when gameId matches", () => {
    const buyIn = villainsGameDefaults.sevenYearItch.defaultBuyIn;
    expect(
      tableReturnTagline({
        gameId: "seven_year_itch",
        buyIn,
        totalReturn: 0,
        tableRound: 0,
        tiers: 0,
      }),
    ).toMatch(/feds took the layout/i);
  });

  it("tableReturnTagline uses Fateseal copy when gameId matches", () => {
    const buyIn = villainsGameDefaults.fatesealSilver.defaultBuyIn;
    expect(
      tableReturnTagline({
        gameId: "fateseal_silver",
        buyIn,
        totalReturn: 0,
        tableRound: 3,
        tiers: 0,
      }),
    ).toMatch(/seal stayed shut/i);
  });
});
