import { describe, expect, it, vi, afterEach } from "vitest";
import * as specials from "./specialsResolver";
import {
  buildOublietteSettlementProfile,
  computeOublietteReturn,
  getOublietteBaseReturnCeiling,
} from "./sessionSettlement";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("computeOublietteReturn", () => {
  const baseProfile = {
    buyIn: 100,
    maxReturnMultipleOfBuyIn: 50,
    capModifierProduct: 1,
    overachievement: {
      capMultiple: 50,
      buyInSlab: 1,
      tierStepMultiple: 5,
      bonusMultipleOfBuyInPerTier: 5,
    },
  };

  it("caps base payout at buyIn * maxReturn * cap product", () => {
    const r = computeOublietteReturn(1_000_000, baseProfile);
    expect(r.basePayout).toBe(5000);
    expect(r.uncappedCredits).toBe(1_000_000);
  });

  it("adds overachievement bonus per tier bar", () => {
    const milestone = 100 * (50 + 1);
    const tierBar = 5 * milestone;
    const r = computeOublietteReturn(tierBar * 2 + 1, baseProfile);
    expect(r.tiers).toBe(2);
    expect(r.overachievementBonus).toBe(2 * 5 * 100);
    expect(r.totalReturn).toBe(r.basePayout + r.overachievementBonus);
  });

  it("applies cap modifiers from settlement profile", () => {
    const r = computeOublietteReturn(10_000, { ...baseProfile, capModifierProduct: 0.5 });
    expect(r.basePayout).toBe(2500);
  });

  it("getOublietteBaseReturnCeiling matches capped base line", () => {
    expect(getOublietteBaseReturnCeiling(baseProfile)).toBe(5000);
    expect(getOublietteBaseReturnCeiling({ ...baseProfile, capModifierProduct: 0.5 })).toBe(2500);
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
    const p = buildOublietteSettlementProfile(100);
    expect(p.capModifierProduct).toBeCloseTo(1.32);
  });
});
