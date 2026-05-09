import { describe, expect, it } from "vitest";
import { createInitialFatesealState } from "../cascadeEngine";
import { applyCrossroads } from "../shopEngine";

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
});
