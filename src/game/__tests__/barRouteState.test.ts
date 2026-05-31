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

  it("isBarRouteState accepts valid endReason and stats", () => {
    expect(
      isBarRouteState({
        lastTable: {
          gameId: "oubliette_no9",
          buyIn: defaultBuyIn,
          totalReturn: 50,
          tableRound: 5,
          tiers: 0,
          endReason: "Voluntary cash-out at round 5",
          stats: [{ label: "Rounds", value: 5 }],
        },
      }),
    ).toBe(true);
  });

  it("isBarRouteState rejects non-string endReason", () => {
    expect(
      isBarRouteState({
        lastTable: {
          gameId: "oubliette_no9",
          buyIn: defaultBuyIn,
          totalReturn: 50,
          tableRound: 5,
          tiers: 0,
          endReason: 42,
        },
      }),
    ).toBe(false);
  });

  it("isBarRouteState rejects malformed stats array", () => {
    expect(
      isBarRouteState({
        lastTable: {
          gameId: "oubliette_no9",
          buyIn: defaultBuyIn,
          totalReturn: 50,
          tableRound: 5,
          tiers: 0,
          stats: [{ label: 99, value: "x" }],
        },
      }),
    ).toBe(false);
    expect(
      isBarRouteState({
        lastTable: {
          gameId: "oubliette_no9",
          buyIn: defaultBuyIn,
          totalReturn: 50,
          tableRound: 5,
          tiers: 0,
          stats: "not-an-array",
        },
      }),
    ).toBe(false);
  });

  it("buildBarRouteStateFromReturn copies detail fields and max win ceiling", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn, new Date("2026-01-01"));
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

  it("buildBarRouteStateFromReturn caps totalReturn at maxWinCredits", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn, new Date("2026-01-01"));
    const maxWin = defaultBuyIn * 50; // 100000
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 1_000_000,
      basePayout: 100_000,
      overachievementBonus: 900_000,
      tiers: 10,
      totalReturn: 1_000_000,
      tableRound: 32,
    }, settlement);
    expect(state.lastTable.totalReturn).toBe(maxWin);
  });

  it("buildBarRouteStateFromReturn forwards endReason", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn, new Date("2026-01-01"));
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 100,
      basePayout: 100,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 100,
      tableRound: 8,
      endReason: "Voluntary cash-out at round 8",
    }, settlement);
    expect(state.lastTable.endReason).toBe("Voluntary cash-out at round 8");
  });

  it("buildBarRouteStateFromReturn uses game-supplied stats when provided", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn, new Date("2026-01-01"));
    const customStats = [{ label: "Hands won", value: 42 }];
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 100,
      basePayout: 100,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 100,
      tableRound: 8,
      stats: customStats,
    }, settlement);
    expect(state.lastTable.stats).toEqual(customStats);
  });

  it("buildBarRouteStateFromReturn auto-generates default stats from detail when no stats supplied", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn, new Date("2026-01-01"));
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 200,
      basePayout: 150,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 150,
      tableRound: 5,
    }, settlement);
    // Should have at least "Rounds" and "Credits earned" from the defaults
    expect(state.lastTable.stats).toBeDefined();
    const labels = (state.lastTable.stats ?? []).map((s) => s.label);
    expect(labels).toContain("Rounds");
    expect(labels).toContain("Credits earned");
  });

  it("buildBarRouteStateFromReturn omits endReason when not provided", () => {
    const settlement = buildOublietteSettlementProfile(defaultBuyIn, new Date("2026-01-01"));
    const state = buildBarRouteStateFromReturn("oubliette_no9", defaultBuyIn, {
      uncappedCredits: 100,
      basePayout: 100,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 100,
    }, settlement);
    expect(state.lastTable.endReason).toBeUndefined();
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
