import { describe, expect, it } from "vitest";
import { crossroadsNextOmenAdditionCostCredits, fatesealCrossroadsNewShop, fatesealProgressionRules } from "@/config/minigames/fatesealRules";
import { createInitialFatesealState } from "../cascadeEngine";
import {
  applyCrossroads,
  applyCrossroadsAddOmenSymbol,
  applyCrossroadsDeadReel,
  applyCrossroadsOmenMark,
  applyCrossroadsWildReel,
} from "../shopEngine";

describe("fateseal shopEngine", () => {
  it("Faustian bargain grants credits and adds void weights", () => {
    const s = createInitialFatesealState(10_000, 2000, Math.random);
    const before = s.symbolPool.length;
    const r = applyCrossroads(s, "faustian_bargain", null, 2000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nextState.sessionWallet).toBeGreaterThan(s.sessionWallet);
    expect(r.nextState.symbolPool.length).toBe(before + 3);
  });

  it("Silver Vision rejects without pick", () => {
    const s = createInitialFatesealState(10_000, 2000, Math.random);
    const r = applyCrossroads(s, "silver_vision", null, 2000);
    expect(r.ok).toBe(false);
  });

  it("add omen charges tiered credits and appends a new prophecy symbol", () => {
    const s0 = createInitialFatesealState(50_000, 2000, Math.random);
    const s = { ...s0, activeProphecy: ["dagger" as const] };
    const cost0 = crossroadsNextOmenAdditionCostCredits(0);
    const r = applyCrossroadsAddOmenSymbol(s, "chalice", 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(-cost0);
    expect(r.nextState.activeProphecy).toEqual(["dagger", "chalice"]);
    expect(r.nextState.sessionWallet).toBe(s.sessionWallet - cost0);
  });

  it("add omen rejects duplicate symbol", () => {
    const s = { ...createInitialFatesealState(50_000, 2000, Math.random), activeProphecy: ["dagger" as const] };
    const r = applyCrossroadsAddOmenSymbol(s, "dagger", 0);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("duplicate_symbol");
  });

  it("wild reel purchase deducts credits and increments counter", () => {
    const s = createInitialFatesealState(20_000, 2000, Math.random);
    const r = applyCrossroadsWildReel(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(-fatesealCrossroadsNewShop.wildReel.costCredits);
    expect(r.nextState.wildReelPaidSpinTimers).toEqual([fatesealProgressionRules.purchasedReels.wildRitualSpins]);
  });

  it("dead reel grant pays credits and increments counter", () => {
    const s = createInitialFatesealState(20_000, 2000, Math.random);
    const r = applyCrossroadsDeadReel(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.creditsDelta).toBe(fatesealCrossroadsNewShop.deadReel.grantCreditsOnTake);
    expect(r.nextState.deadReelPaidSpinTimers).toEqual([fatesealProgressionRules.purchasedReels.deadRitualSpins]);
  });

  it("omen mark requires an active prophecy pick", () => {
    const s = { ...createInitialFatesealState(20_000, 2000, Math.random), activeProphecy: ["dagger" as const] };
    const bad = applyCrossroadsOmenMark(s, "chalice");
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.reason).toBe("invalid_pick");
    const ok = applyCrossroadsOmenMark(s, "dagger");
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.nextState.markedOmenSymbol).toBe("dagger");
    expect(ok.nextState.markedOmenPaidSpinsLeft).toBe(fatesealProgressionRules.purchasedReels.markedRitualSpins);
  });
});
