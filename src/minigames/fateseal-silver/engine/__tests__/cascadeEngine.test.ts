import { describe, expect, it } from "vitest";
import {
  fatesealCascadePayoutScale,
  fatesealScatterRitual,
  fatesealAdjacentMinRun,
} from "@/config/minigames/fatesealRules";
import {
  createInitialFatesealState,
  findClusterRemovalCells,
  pickFromPool,
  runSpin,
} from "../cascadeEngine";
import { clonePool, fatesealDefaultSymbolPool, totalPoolWeight } from "@/config/minigames/fatesealRules";

const zeroRng = () => 0;

describe("fateseal cascadeEngine", () => {
  it("pickFromPool uses first weighted entry when rng is 0", () => {
    const pool = clonePool(fatesealDefaultSymbolPool);
    const t = totalPoolWeight(pool);
    expect(pickFromPool(pool, t, zeroRng)).toBe(pool[0]!.symbol);
  });

  it("findClusterRemovalCells removes orthogonal runs of 3+ matching standards (wild bridges)", () => {
    const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => "key" as const)) as Parameters<
      typeof findClusterRemovalCells
    >[0];
    grid[4][0] = "dagger";
    grid[4][1] = "dagger";
    grid[4][2] = "dagger";
    const rm = findClusterRemovalCells(grid);
    expect(rm.size).toBeGreaterThanOrEqual(fatesealAdjacentMinRun);
  });

  it("runSpin pays prophecy matches × 10 × base bet on first cascade (single focus)", () => {
    const s = createInitialFatesealState(50_000, 2000, Math.random);
    s.activeProphecy = ["dagger"];
    s.prophecyMode = "single";
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "dagger";
      }
    }
    const rng = () => 0.5;
    const result = runSpin(s, rng, { skipInitialFill: true });
    expect(result.log.some((l) => l.kind === "cascade")).toBe(true);
    const cascadeLogs = result.log.filter((l) => l.kind === "cascade");
    expect(result.cascadeKeyframes.length).toBe(cascadeLogs.length);
    const first = result.log.find((l) => l.kind === "cascade");
    expect(first?.payout).toBe(Math.floor(25 * 10 * 10 * 1 * fatesealCascadePayoutScale));
    const kf0 = result.cascadeKeyframes[0];
    expect(kf0?.prophecyMatchKeys.length).toBe(25);
    expect(kf0?.removedKeys.length).toBe(25);
    expect(result.nextState.sessionWallet).toBeGreaterThan(s.sessionWallet - 10);
  });

  it("triple focus uses 1× multiple per prophecy match", () => {
    const s = createInitialFatesealState(50_000, 2000, Math.random);
    s.activeProphecy = ["dagger", "chalice", "goat"];
    s.prophecyMode = "triple";
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "dagger";
      }
    }
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    const first = result.log.find((l) => l.kind === "cascade");
    expect(first?.payout).toBe(Math.floor(25 * 1 * 10 * 1 * fatesealCascadePayoutScale));
  });

  it("accumulates scatter meter and can award Free Ritual spins", () => {
    const s = createInitialFatesealState(100_000, 2000, Math.random);
    s.activeProphecy = ["eye"];
    s.scatterMeter = fatesealScatterRitual.meterToTrigger - 1;
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "scatter";
      }
    }
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    expect(result.log.some((l) => l.kind === "scatter_ritual_started")).toBe(true);
    expect(result.nextState.freeRitualSpinsLeft).toBeGreaterThan(0);
  });
});
