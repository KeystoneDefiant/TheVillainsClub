import { describe, expect, it } from "vitest";
import {
  crossroadsNextOmenAdditionCostCredits,
  fatesealUnsettleSpiritsConfig,
  fatesealFaustianBargainConfig,
} from "@/config/minigames/fatesealRules";
import { createInitialFatesealState } from "../cascadeEngine";
import {
  applyCrossroadsAddOmenSymbol,
  applyCrossroadsUnsettleSpirits,
  unsettleSpiritsCost,
  applyCrossroadsFaustianBargain,
  faustianBargainGrant,
  applyCrossroadsVassagoGambit,
  vassagoGambitCost,
} from "../shopEngine";

describe("fateseal shopEngine", () => {
  it("add omen charges tiered credits and appends a new prophecy symbol", () => {
    const s0 = createInitialFatesealState(50_000, 2000, Math.random);
    const s = { ...s0, activeProphecy: ["dagger" as const] };
    const cost0 = crossroadsNextOmenAdditionCostCredits(0);
    const r = applyCrossroadsAddOmenSymbol(s, "chalice");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(-cost0);
    expect(r.nextState.activeProphecy).toEqual(["dagger", "chalice"]);
    expect(r.nextState.purchasedExtraProphecies).toEqual(["chalice"]);
    expect(r.nextState.sessionWallet).toBe(s.sessionWallet - cost0);
  });

  it("add omen costs rise to 3500, 6000, and 12000 for each purchase", () => {
    expect(crossroadsNextOmenAdditionCostCredits(0)).toBe(3500);
    expect(crossroadsNextOmenAdditionCostCredits(1)).toBe(6000);
    expect(crossroadsNextOmenAdditionCostCredits(2)).toBe(12000);
    expect(crossroadsNextOmenAdditionCostCredits(3)).toBe(Number.POSITIVE_INFINITY);
  });

  it("add omen rejects duplicate symbol", () => {
    const s = { ...createInitialFatesealState(50_000, 2000, Math.random), activeProphecy: ["dagger" as const] };
    const r = applyCrossroadsAddOmenSymbol(s, "dagger");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("duplicate_symbol");
  });

  it("Unsettle the Spirits purchase deducts correct cost and sets wild timers", () => {
    const s = createInitialFatesealState(20_000, 2000, Math.random);
    const cost = unsettleSpiritsCost(s.sessionWallet, s.buyIn);
    const r = applyCrossroadsUnsettleSpirits(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(-cost);
    expect(r.nextState.wildReelPaidSpinTimers).toEqual([fatesealUnsettleSpiritsConfig.durationSpins]);
    expect(r.nextState.sessionWallet).toBe(s.sessionWallet - cost);
  });

  it("Faustian bargain grant pays credits based on buyIn and appends dead timers", () => {
    const s = createInitialFatesealState(20_000, 2000, Math.random);
    const grant = faustianBargainGrant(s.buyIn);
    const r = applyCrossroadsFaustianBargain(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(grant);
    expect(r.nextState.deadReelPaidSpinTimers).toEqual([fatesealFaustianBargainConfig.durationSpinsPerLevel]);
    expect(r.nextState.sessionWallet).toBe(s.sessionWallet + grant);
  });

  it("Vassago's Gambit purchase deducts cost and sets active flag", () => {
    const s = createInitialFatesealState(20_000, 2000, Math.random);
    const cost = vassagoGambitCost(s.sessionWallet, s.buyIn);
    const r = applyCrossroadsVassagoGambit(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(-cost);
    expect(r.nextState.vassagoActive).toBe(true);
    expect(r.nextState.sessionWallet).toBe(s.sessionWallet - cost);
  });
});
