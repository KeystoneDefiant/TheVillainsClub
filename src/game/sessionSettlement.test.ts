import { describe, expect, it, vi, afterEach } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import * as specials from "./specialsResolver";
import * as barBandOverrideStore from "@/audio/barBandOverrideStore";
import {
  buildFatesealSettlementProfile,
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  computeOublietteReturn,
  computeFatesealReturn,
  computeSevenYearItchReturn,
  getOublietteBaseReturnCeiling,
} from "./sessionSettlement";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("computeOublietteReturn", () => {
  const cfg = villainsGameDefaults.oublietteNo9;
  const buyIn = cfg.defaultBuyIn;
  const baseProfile = {
    buyIn,
    maxReturnMultipleOfBuyIn: cfg.maxReturnMultipleOfBuyIn,
    capModifierProduct: 1,
    overachievement: { ...cfg.overachievement },
  };

  it("caps base payout at buyIn * maxReturn * cap product", () => {
    const r = computeOublietteReturn(1_000_000, baseProfile);
    const expectedCap = buyIn * cfg.maxReturnMultipleOfBuyIn;
    expect(r.basePayout).toBe(expectedCap);
    expect(r.uncappedCredits).toBe(1_000_000);
  });

  it("adds overachievement bonus per tier bar but caps totalReturn at baseCap", () => {
    const oa = cfg.overachievement;
    const milestone = buyIn * (oa.capMultiple + oa.buyInSlab);
    const tierBar = oa.tierStepMultiple * milestone;
    const r = computeOublietteReturn(tierBar * 2 + 1, baseProfile);
    expect(r.tiers).toBe(2);
    expect(r.overachievementBonus).toBe(2 * oa.bonusMultipleOfBuyInPerTier * buyIn);
    expect(r.totalReturn).toBe(getOublietteBaseReturnCeiling(baseProfile));
  });

  it("strictly caps totalReturn at baseCap even with massive uncapped credits", () => {
    const massiveCredits = 10_000_000;
    const r = computeOublietteReturn(massiveCredits, baseProfile);
    const expectedCap = getOublietteBaseReturnCeiling(baseProfile);
    expect(r.totalReturn).toBe(expectedCap);
  });

  it("applies cap modifiers from settlement profile", () => {
    const r = computeOublietteReturn(10_000, { ...baseProfile, capModifierProduct: 0.5 });
    expect(r.basePayout).toBe(10_000);
  });

  it("getOublietteBaseReturnCeiling matches capped base line", () => {
    expect(getOublietteBaseReturnCeiling(baseProfile)).toBe(buyIn * cfg.maxReturnMultipleOfBuyIn);
    expect(getOublietteBaseReturnCeiling({ ...baseProfile, capModifierProduct: 0.5 })).toBe(
      Math.floor(buyIn * cfg.maxReturnMultipleOfBuyIn * 0.5),
    );
  });
});

describe("buildOublietteSettlementProfile", () => {
  it("merges oubliette and global cap mults from special definition row", () => {
    vi.spyOn(specials, "resolveActiveClubSpecial").mockReturnValue({
      id: "test",
      title: "Test",
      modifier: { type: "payout_mult", value: 1 },
    });
    vi.spyOn(specials, "resolveSpecialDefinitionRow").mockReturnValue({
      title: "Test",
      modifier: { type: "payout_mult", value: 1 },
      oubliette_cap_mult: 1.2,
      all_minigames_cap_mult: 1.1,
    });
    const p = buildOublietteSettlementProfile(villainsGameDefaults.oublietteNo9.defaultBuyIn);
    expect(p.capModifierProduct).toBeCloseTo(1.32);
  });
});

describe("buildSevenYearItchSettlementProfile", () => {
  it("merges seven year itch and global cap mults from special definition row", () => {
    vi.spyOn(specials, "resolveActiveClubSpecial").mockReturnValue({
      id: "test",
      title: "Test",
      modifier: { type: "payout_mult", value: 1 },
    });
    vi.spyOn(specials, "resolveSpecialDefinitionRow").mockReturnValue({
      title: "Test",
      modifier: { type: "payout_mult", value: 1 },
      seven_year_itch_cap_mult: 1.15,
      all_minigames_cap_mult: 1.1,
    });
    const p = buildSevenYearItchSettlementProfile(villainsGameDefaults.sevenYearItch.defaultBuyIn);
    expect(p.capModifierProduct).toBeCloseTo(1.265);
  });

  it("computeSevenYearItchReturn matches Oubliette cap math", () => {
    vi.spyOn(barBandOverrideStore, "effectiveBandIndexForBarDate").mockReturnValue(-1);
    const cfg = villainsGameDefaults.sevenYearItch;
    const profile = {
      buyIn: cfg.defaultBuyIn,
      maxReturnMultipleOfBuyIn: cfg.maxReturnMultipleOfBuyIn,
      capModifierProduct: 1,
      overachievement: { ...cfg.overachievement },
    };
    expect(computeSevenYearItchReturn(5000, profile).totalReturn).toBe(
      computeOublietteReturn(5000, profile).totalReturn,
    );
  });
});

describe("buildFatesealSettlementProfile", () => {
  it("merges fateseal and global cap mults from special definition row", () => {
    vi.spyOn(specials, "resolveActiveClubSpecial").mockReturnValue({
      id: "test",
      title: "Test",
      modifier: { type: "payout_mult", value: 1 },
    });
    vi.spyOn(specials, "resolveSpecialDefinitionRow").mockReturnValue({
      title: "Test",
      modifier: { type: "payout_mult", value: 1 },
      fateseal_cap_mult: 1.1,
      all_minigames_cap_mult: 1.05,
    });
    const p = buildFatesealSettlementProfile(villainsGameDefaults.fatesealSilver.defaultBuyIn);
    expect(p.capModifierProduct).toBeCloseTo(1.155);
  });

  it("computeFatesealReturn matches Oubliette cap math", () => {
    vi.spyOn(barBandOverrideStore, "effectiveBandIndexForBarDate").mockReturnValue(-1);
    const cfg = villainsGameDefaults.fatesealSilver;
    const profile = {
      buyIn: cfg.defaultBuyIn,
      maxReturnMultipleOfBuyIn: cfg.maxReturnMultipleOfBuyIn,
      capModifierProduct: 1,
      overachievement: { ...cfg.overachievement },
    };
    expect(computeFatesealReturn(8000, profile).totalReturn).toBe(computeOublietteReturn(8000, profile).totalReturn);
  });
});

describe("sessionSettlement band modifiers", () => {
  it("scales payouts and caps when a matching band modifier is active", () => {
    // Force active band to Velvet and Dust (index 5), which grants fateseal_silver +10%
    vi.spyOn(barBandOverrideStore, "effectiveBandIndexForBarDate").mockReturnValue(5);

    const cfg = villainsGameDefaults.fatesealSilver;
    const profile = {
      buyIn: 1000,
      maxReturnMultipleOfBuyIn: 3,
      capModifierProduct: 1,
      overachievement: { ...cfg.overachievement },
    };

    // Fateseal Silver: base return ceiling normally is 3000. Under Velvet, it scales by +10% to 3300.
    // Uncapped payout 2000 scaled by +10% is 2200.
    const r = computeFatesealReturn(2000, profile);
    expect(r.uncappedCredits).toBe(2200);
    expect(r.basePayout).toBe(2200);
    expect(r.totalReturn).toBe(2200);

    // Uncapped payout 4000 scaled by +10% is 4400. Caps at Velvet's 3300.
    const rCap = computeFatesealReturn(4000, profile);
    expect(rCap.totalReturn).toBe(3300);
  });
});
