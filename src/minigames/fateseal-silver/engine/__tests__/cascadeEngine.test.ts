import { describe, expect, it } from "vitest";
import {
  fatesealCascadePayoutScale,
  fatesealProgressionRules,
  fatesealScatterRitual,
} from "@/config/minigames/fatesealRules";
import type { CascadeLogLine } from "../cascadeEngine";
import {
  createInitialFatesealState,
  countProphecyAdjacencyEdges,
  findClusterRemovalCells,
  meterTickFromScattersOnGrid,
  pickFromPool,
  runSpin,
  tickFifoReelTimers,
} from "../cascadeEngine";
import { clonePool, fatesealDefaultSymbolPool, totalPoolWeight } from "@/config/minigames/fatesealRules";

const zeroRng = () => 0;

describe("fateseal cascadeEngine", () => {
  it("tickFifoReelTimers decrements head and drops exhausted slots", () => {
    expect(tickFifoReelTimers([3, 3])).toEqual([2, 3]);
    expect(tickFifoReelTimers([1])).toEqual([]);
    expect(tickFifoReelTimers([])).toEqual([]);
  });

  it("pickFromPool uses first weighted entry when rng is 0", () => {
    const pool = clonePool(fatesealDefaultSymbolPool);
    const t = totalPoolWeight(pool);
    expect(pickFromPool(pool, t, zeroRng)).toBe(pool[0]!.symbol);
  });

  it("findClusterRemovalCells clears non-prophesied runs that meet min orthogonal size", () => {
    const min = fatesealProgressionRules.linking.minOrthogonalRunForNonProphecyRemoval;
    const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => "void" as const)) as Parameters<
      typeof findClusterRemovalCells
    >[0];
    for (let c = 0; c < 5; c++) grid[4]![c] = "moon";
    const rm = findClusterRemovalCells(grid, ["dagger"]);
    expect(rm.size).toBeGreaterThanOrEqual(min);
  });

  it("findClusterRemovalCells does not clear short non-prophesied runs", () => {
    const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => "void" as const)) as Parameters<
      typeof findClusterRemovalCells
    >[0];
    grid[4]![0] = grid[4]![1] = grid[4]![2] = "moon";
    expect(findClusterRemovalCells(grid, ["dagger"]).size).toBe(0);
  });

  it("findClusterRemovalCells skips cluster expansion for prophesied standards", () => {
    const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => "void" as const)) as Parameters<
      typeof findClusterRemovalCells
    >[0];
    for (let c = 0; c < 5; c++) grid[4]![c] = "dagger";
    expect(findClusterRemovalCells(grid, ["dagger"]).size).toBe(0);
  });

  it("countProphecyAdjacencyEdges counts each orthogonal prophecy pair once", () => {
    const prophecy = new Set(["0,0", "0,1", "1,0"]);
    expect(countProphecyAdjacencyEdges(prophecy, 5)).toBe(2);
  });

  it("meterTickFromScattersOnGrid can grant multiple Free Rituals in one tick", () => {
    const log: CascadeLogLine[] = [];
    const r = meterTickFromScattersOnGrid(0, 25, log);
    expect(r.ritualTriggers).toBe(2);
    expect(r.scatterMeter).toBe(1);
    expect(log.filter((l) => l.kind === "scatter_ritual_started").length).toBe(2);
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
    const linkCfg = fatesealProgressionRules.linking;
    const prophecyKeys = result.cascadeKeyframes[0]?.prophecyMatchKeys ?? [];
    const prophecyEdges = countProphecyAdjacencyEdges(new Set(prophecyKeys), 5);
    const n = Math.min(prophecyEdges, linkCfg.maxProphecyEdgesForLinkingPow);
    const effectiveMult =
      1 *
      (linkCfg.usePowProphecyLinkingForCascadeMult
        ? Math.pow(linkCfg.prophecyLinkingPowBasePerAdjacency, n)
        : 1 +
            Math.min(
              linkCfg.maxCascadeMultBonusFromLinking,
              prophecyEdges * linkCfg.cascadeMultAddPerProphecyAdjacency,
            ));
    expect(first?.payout).toBe(
      Math.floor(25 * 10 * 10 * effectiveMult * fatesealCascadePayoutScale),
    );
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
    const linkCfg = fatesealProgressionRules.linking;
    const prophecyKeys = result.cascadeKeyframes[0]?.prophecyMatchKeys ?? [];
    const prophecyEdges = countProphecyAdjacencyEdges(new Set(prophecyKeys), 5);
    const n = Math.min(prophecyEdges, linkCfg.maxProphecyEdgesForLinkingPow);
    const effectiveMult =
      1 *
      (linkCfg.usePowProphecyLinkingForCascadeMult
        ? Math.pow(linkCfg.prophecyLinkingPowBasePerAdjacency, n)
        : 1 +
            Math.min(
              linkCfg.maxCascadeMultBonusFromLinking,
              prophecyEdges * linkCfg.cascadeMultAddPerProphecyAdjacency,
            ));
    expect(first?.payout).toBe(
      Math.floor(25 * 1 * 10 * effectiveMult * fatesealCascadePayoutScale),
    );
  });

  it("scatter ritual meter fires append in-spin bonus waves (no banked free ritual charges)", () => {
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
    const starts = result.log.filter((l) => l.kind === "scatter_ritual_started");
    expect(starts.length).toBeGreaterThanOrEqual(3);
    expect(result.nextState.freeRitualSpinsLeft).toBe(0);
    expect(result.nextState.scatterMeter).toBe(0);
  });

  it("forBaseRitualSim skips meter, bonus append waves, and sympathetic", () => {
    const s = createInitialFatesealState(100_000, 2000, Math.random);
    s.activeProphecy = ["eye"];
    s.scatterMeter = fatesealScatterRitual.meterToTrigger - 1;
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "scatter";
      }
    }
    const result = runSpin(s, () => 0.5, { skipInitialFill: true, forBaseRitualSim: true });
    expect(result.log.filter((l) => l.kind === "scatter_ritual_started").length).toBe(0);
    expect(result.log.some((l) => l.kind === "sympathetic_vibrations")).toBe(false);
    expect(result.nextState.scatterMeter).toBe(0);
  });

  it("awards Sympathetic Vibrations when enough ritual meter fires occur in one spin", () => {
    const s = createInitialFatesealState(100_000, 2000, Math.random);
    s.activeProphecy = ["eye"];
    s.scatterMeter = 23;
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "scatter";
      }
    }
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    const sym = result.log.find((l) => l.kind === "sympathetic_vibrations");
    expect(sym?.kind).toBe("sympathetic_vibrations");
    if (sym?.kind === "sympathetic_vibrations") {
      expect(sym.payout).toBe(Math.floor(75 * 10));
    }
    expect(result.totalPayout).toBeGreaterThanOrEqual(Math.floor(75 * 10));
  });

  it("opens Crossroads when final-grid scatters reach the configured threshold", () => {
    const threshold = fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop;
    const s = createInitialFatesealState(100_000, 2000, Math.random);
    s.activeProphecy = ["eye"];
    s.crossroadsBonusAccum = threshold - 1;
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "eye";
      }
    }
    s.grid[0][0] = "scatter";
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    expect(result.crossroadsGate).toBe(true);
    expect(result.nextState.crossroadsBonusAccum).toBe(0);
  });

  it("carries remainder scatters toward the next Crossroads after a gate", () => {
    const threshold = fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop;
    const s = createInitialFatesealState(100_000, 2000, Math.random);
    s.activeProphecy = ["eye"];
    s.crossroadsBonusAccum = threshold - 1;
    s.baseBet = 10;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "eye";
      }
    }
    s.grid[0][0] = "scatter";
    s.grid[0][1] = "scatter";
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    expect(result.crossroadsGate).toBe(true);
    expect(result.nextState.crossroadsBonusAccum).toBe(1);
  });

  it("paid spin ticks Crossroads wild reel FIFO timers", () => {
    const s0 = createInitialFatesealState(50_000, 2000, Math.random);
    const s = {
      ...s0,
      activeProphecy: ["dagger" as const],
      prophecyMode: "single" as const,
      baseBet: 10,
      wildReelPaidSpinTimers: [3, 3],
    };
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "void";
      }
    }
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    expect(result.nextState.wildReelPaidSpinTimers).toEqual([2, 3]);
  });

  it("free ritual spin does not tick wild reel timers when bonusSpinsExcludeFromReelDecay", () => {
    const s0 = createInitialFatesealState(50_000, 2000, Math.random);
    const s = {
      ...s0,
      activeProphecy: ["dagger" as const],
      prophecyMode: "single" as const,
      baseBet: 10,
      freeRitualSpinsLeft: 1,
      wildReelPaidSpinTimers: [3, 3],
    };
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        s.grid[r][c] = "void";
      }
    }
    const result = runSpin(s, () => 0.5, { skipInitialFill: true });
    expect(result.nextState.wildReelPaidSpinTimers).toEqual([3, 3]);
  });
});
