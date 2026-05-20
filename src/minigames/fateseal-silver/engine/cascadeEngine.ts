import {
  FATESEAL_GRID_SIZE,
  clonePool,
  fatesealCascadeMultipliers,
  fatesealCascadePayoutScale,
  fatesealDefaultSymbolPool,
  fatesealProphecyMode,
  fatesealProgressionRules,
  fatesealScatterRitual,
  getCurrentFatesealGameMode,
  type FatesealGameModeConfig,
  type FatesealPoolEntry,
  type FatesealProphecyModeKey,
  type FatesealStandardId,
  type FatesealSymbolId,
  totalPoolWeight,
} from "@/config/minigames/fatesealRules";

export type Rng = () => number;

export type FatesealEngineState = {
  grid: FatesealSymbolId[][];
  symbolPool: FatesealPoolEntry[];
  prophecyMode: FatesealProphecyModeKey;
  activeProphecy: FatesealStandardId[];
  baseBet: number;
  sessionWallet: number;
  /** Completed spins (after entire cascade + inflow settles). */
  spinCount: number;
  /**
   * Running count of scatter symbols on the **post-spin settled grid** toward Crossroads
   * ({@link fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop}).
   */
  crossroadsBonusAccum: number;
  scatterMeter: number;
  freeRitualSpinsLeft: number;
  tomeSpinsLeft: number;
  silverVisionTarget: FatesealStandardId | null;
  buyIn: number;
  /**
   * Crossroads wild-reel purchases: FIFO paid-spin countdown per slot (see
   * `fatesealProgressionRules.purchasedReels.wildRitualSpins`). Column wild behavior TBD.
   */
  wildReelPaidSpinTimers: readonly number[];
  /**
   * Crossroads dead-reel purchases: FIFO paid-spin countdown per slot (see `deadRitualSpins`).
   * Column dead behavior TBD.
   */
  deadReelPaidSpinTimers: readonly number[];
  /** Crossroads mark — when set, prophecy payouts get a multiplier if the marked standard appears in a prophecy hit on that step. */
  markedOmenSymbol: FatesealStandardId | null;
  /** Paid spins remaining for the active omen mark (see `markedRitualSpins`). */
  markedOmenPaidSpinsLeft: number;
};

export type CascadeLogLine =
  | { kind: "cascade"; depth: number; prophecyMatches: number; clusterTiles: number; removed: number; payout: number }
  | { kind: "spin_start"; bet: number }
  | { kind: "spin_end"; scatterGained: number; totalSpinPayout: number }
  | { kind: "scatter_ritual_started"; spins: number }
  | { kind: "sympathetic_vibrations"; payout: number }
  | { kind: "insufficient_funds" };

/** One cascades step for UI animation (cells before removals, payouts, settled grid after refill). */
export type CascadeKeyframe = {
  depth: number;
  gridBeforeRemoval: FatesealSymbolId[][];
  removedKeys: string[];
  prophecyMatchKeys: string[];
  payout: number;
  gridAfterCascade: FatesealSymbolId[][];
};

export type SpinResult = {
  nextState: FatesealEngineState;
  log: CascadeLogLine[];
  totalPayout: number;
  /** True when accumulated post-spin scatters meet the Crossroads threshold (`fatesealProgressionRules.crossroads`). */
  crossroadsGate: boolean;
  /** Cascade steps keyed for shell animation — empty when the spin clears no tiles. */
  cascadeKeyframes: CascadeKeyframe[];
};

const GRID = FATESEAL_GRID_SIZE;

/** One paid spin ticks the first FIFO reel timer stack (Crossroads wild/dead). Exported for tests. */
export function tickFifoReelTimers(timers: readonly number[]): number[] {
  if (timers.length === 0) return [];
  const next = [...timers];
  next[0] = next[0]! - 1;
  while (next.length > 0 && next[0]! <= 0) {
    next.shift();
  }
  return next;
}

function key(r: number, c: number): string {
  return `${r},${c}`;
}

function parseKey(k: string): { r: number; c: number } {
  const [a, b] = k.split(",");
  return { r: Number(a), c: Number(b) };
}

export function newEmptyGrid(): FatesealSymbolId[][] {
  return Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => "key" as FatesealSymbolId));
}

/** @internal exported for tests */
export function pickFromPool(pool: readonly FatesealPoolEntry[], total: number, rng: Rng): FatesealSymbolId {
  if (total <= 0) return "key";
  let roll = rng() * total;
  for (const e of pool) {
    const w = Math.max(0, e.weight);
    roll -= w;
    if (roll <= 0) return e.symbol;
  }
  return pool[0]?.symbol ?? "key";
}

export function buildEffectivePool(
  pool: readonly FatesealPoolEntry[],
  opts: {
    tomeSpinsLeft: number;
    freeRitualSpinsLeft: number;
    silverVisionTarget: FatesealStandardId | null;
    /** In-spin bonus append waves (TODO.md) use the same wild weight nudge as legacy banked free ritual. */
    inFreeRitualCascadeWave?: boolean;
  },
): FatesealPoolEntry[] {
  const p = clonePool(pool);
  if (opts.silverVisionTarget) {
    for (const e of p) {
      if (e.symbol === opts.silverVisionTarget) e.symbol = "wild";
    }
  }
  if (opts.tomeSpinsLeft > 0) {
    for (const e of p) {
      if (e.symbol === "scatter") e.weight *= 2;
    }
  }
  if (opts.freeRitualSpinsLeft > 0 || opts.inFreeRitualCascadeWave) {
    for (const e of p) {
      if (e.symbol === "wild") e.weight += fatesealScatterRitual.freeRitualWildWeightBoost;
    }
  }
  return p;
}

/** Column overrides after a random pick (void wins over wild). */
export type FatesealFillColumnContext = {
  /** Bonus-only dead columns on the left; stripped after the composite spin ends. */
  bonusDeadColCount: number;
  /** Purchased wild columns: leftmost k columns become wild. */
  wildColCount: number;
  /** Purchased dead columns: rightmost k columns become void. */
  purchasedDeadColCount: number;
};

function applyColumnPostPick(
  grid: FatesealSymbolId[][],
  colCtx: FatesealFillColumnContext | undefined,
  rng: Rng,
): void {
  if (!colCtx) return;
  const n = grid.length;
  const wildK = colCtx.wildColCount;
  const deadK = Math.max(0, Math.min(colCtx.purchasedDeadColCount, n));
  const bonusDead = Math.max(0, Math.min(colCtx.bonusDeadColCount, n));
  
  const chance = fatesealProgressionRules.purchasedReels.wildChancePerActiveReel * wildK;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let sym = grid[r]![c]!;
      if (wildK > 0 && sym !== "void" && rng() < chance) sym = "wild";
      if (c >= n - deadK) sym = "void";
      if (c < bonusDead) sym = "void";
      grid[r]![c] = sym;
    }
  }
}

export function fillGridRandom(
  grid: FatesealSymbolId[][],
  pool: readonly FatesealPoolEntry[],
  rng: Rng,
  colCtx?: FatesealFillColumnContext,
): void {
  const n = grid.length;
  const t = totalPoolWeight(pool);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid[r]![c] = pickFromPool(pool, t, rng);
    }
  }
  applyColumnPostPick(grid, colCtx, rng);
}

function countScattersOnGrid(grid: FatesealSymbolId[][]): number {
  const n = grid.length;
  let ct = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r]![c] === "scatter") ct++;
    }
  }
  return ct;
}

/**
 * Adds scatters visible on the current grid to the ritual meter; each full meter fires one
 * **in-spin bonus append** (TODO.md). Appends `scatter_ritual_started` to `log` per trigger.
 * Partial meter **does not** carry to the next player spin — caller resets after the composite spin.
 */
export function meterTickFromScattersOnGrid(
  scatterMeter: number,
  scatterOnGrid: number,
  log: CascadeLogLine[],
  logRitualStarts = true,
): { scatterMeter: number; ritualTriggers: number } {
  let meter = scatterMeter + scatterOnGrid;
  let ritualTriggers = 0;
  const th = fatesealScatterRitual.meterToTrigger;
  const grant = fatesealScatterRitual.freeSpinsGranted;
  while (meter >= th) {
    meter -= th;
    ritualTriggers++;
    if (logRitualStarts) {
      log.push({ kind: "scatter_ritual_started", spins: grant });
    }
  }
  return { scatterMeter: meter, ritualTriggers };
}

function prophecyMatchCells(grid: FatesealSymbolId[][], prophecy: readonly FatesealStandardId[]): Set<string> {
  const set = new Set<string>();
  const prop = new Set(prophecy);
  if (prop.size === 0) return set;
  const gn = grid.length;
  for (let r = 0; r < gn; r++) {
    for (let c = 0; c < gn; c++) {
      const s = grid[r]![c];
      if (s === "void" || s === "scatter") continue;
      if (s === "wild") {
        set.add(key(r, c));
        continue;
      }
      if (prop.has(s as FatesealStandardId)) set.add(key(r, c));
    }
  }
  return set;
}

/** Undirected orthogonal adjacencies between two cells both in `prophecy` (each edge counted once). */
export function countProphecyAdjacencyEdges(prophecy: ReadonlySet<string>, gridSize: number): number {
  let edges = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const k = key(r, c);
      if (!prophecy.has(k)) continue;
      if (c + 1 < gridSize && prophecy.has(key(r, c + 1))) edges++;
      if (r + 1 < gridSize && prophecy.has(key(r + 1, c))) edges++;
    }
  }
  return edges;
}

const ORTHO: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function bfsCluster(
  grid: FatesealSymbolId[][],
  sr: number,
  sc: number,
  target: FatesealStandardId,
): Set<string> {
  const gn = grid.length;
  const q: [number, number][] = [[sr, sc]];
  const seen = new Set<string>();
  while (q.length > 0) {
    const [r, c] = q.shift()!;
    const k = key(r, c);
    if (seen.has(k)) continue;
    if (r < 0 || r >= gn || c < 0 || c >= gn) continue;
    const cell = grid[r]![c];
    if (cell === "void" || cell === "scatter") continue;
    if (cell !== "wild" && cell !== target) continue;
    seen.add(k);
    for (const [dr, dc] of ORTHO) {
      q.push([r + dr, c + dc]);
    }
  }
  return seen;
}

/**
 * Orthogonal clusters of the same standard (+ wild bridges) clear when the symbol is **not**
 * actively prophesied and the component size meets
 * `fatesealProgressionRules.linking.minOrthogonalRunForNonProphecyRemoval`. Prophesied standards
 * clear only via prophecy hits (no link-size gate on those symbols).
 */
export function findClusterRemovalCells(
  grid: FatesealSymbolId[][],
  activeProphecy: readonly FatesealStandardId[],
): Set<string> {
  const gn = grid.length;
  const prop = new Set(activeProphecy);
  const minRun = fatesealProgressionRules.linking.minOrthogonalRunForNonProphecyRemoval;
  const removal = new Set<string>();
  const consumed = new Set<string>();
  for (let r = 0; r < gn; r++) {
    for (let c = 0; c < gn; c++) {
      const k = key(r, c);
      if (consumed.has(k)) continue;
      const s = grid[r]![c];
      if (s === "void" || s === "scatter" || s === "wild") continue;
      const target = s as FatesealStandardId;
      if (prop.has(target)) continue;
      const comp = bfsCluster(grid, r, c, target);
      if (comp.size < minRun) continue;
      comp.forEach((cell) => {
        removal.add(cell);
        consumed.add(cell);
      });
    }
  }
  return removal;
}

type NullableGrid = (FatesealSymbolId | null)[][];

function toNullable(grid: FatesealSymbolId[][]): NullableGrid {
  return grid.map((row) => row.map((x) => x));
}

function fromNullable(g: NullableGrid): FatesealSymbolId[][] {
  return g.map((row) =>
    row.map((x) => {
      if (x == null) throw new Error("fateseal: null in fromNullable");
      return x;
    }),
  );
}

function applyRemovalMask(grid: FatesealSymbolId[][], remove: Set<string>): NullableGrid {
  const g = toNullable(grid);
  for (const k of remove) {
    const { r, c } = parseKey(k);
    if (g[r]![c] === "void") continue;
    g[r]![c] = null;
  }
  return g;
}

function applyGravity(g: NullableGrid): NullableGrid {
  const n = g.length;
  const out: NullableGrid = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      if (g[r]![c] === "void") {
        out[r]![c] = "void";
      }
    }
    let writeRow = n - 1;
    for (let r = n - 1; r >= 0; r--) {
      const cell = g[r]![c];
      if (cell === "void") {
        writeRow = r - 1;
      } else if (cell != null) {
        out[writeRow]![c] = cell;
        writeRow--;
      }
    }
  }
  return out;
}

function fillNullsFromPool(g: NullableGrid, pool: readonly FatesealPoolEntry[], rng: Rng): FatesealSymbolId[][] {
  const n = g.length;
  const t = totalPoolWeight(pool);
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      if (g[r]![c] == null) {
        g[r]![c] = pickFromPool(pool, t, rng);
      }
    }
  }
  return fromNullable(g as NullableGrid);
}

function cascadeMultAt(depth: number): number {
  const m = fatesealCascadeMultipliers;
  return m[Math.min(depth, m.length - 1)]!;
}

function modeMult(mode: FatesealProphecyModeKey): number {
  return mode === "single" ? fatesealProphecyMode.single.winMultipleOfBaseBet : fatesealProphecyMode.triple.winMultipleOfBaseBet;
}

function runCascadeStep(
  grid: FatesealSymbolId[][],
  state: Pick<FatesealEngineState, "prophecyMode" | "activeProphecy" | "baseBet" | "markedOmenSymbol">,
  pool: readonly FatesealPoolEntry[],
  rng: Rng,
  depth: number,
  fillColCtx?: FatesealFillColumnContext,
): {
  grid: FatesealSymbolId[][];
  stepPayout: number;
  prophecyMatches: number;
  clusterTiles: number;
  removed: number;
  prophecyMatchKeys: string[];
  removedKeys: string[];
} {
  const prophecy = prophecyMatchCells(grid, state.activeProphecy);
  const clusters = findClusterRemovalCells(grid, state.activeProphecy);
  const remove = new Set<string>([...prophecy, ...clusters]);
  if (remove.size === 0) {
    return {
      grid,
      stepPayout: 0,
      prophecyMatches: 0,
      clusterTiles: 0,
      removed: 0,
      prophecyMatchKeys: [],
      removedKeys: [],
    };
  }
  const mult = cascadeMultAt(depth);
  const linkCfg = fatesealProgressionRules.linking;
  const gn = grid.length;
  const prophecyEdges = countProphecyAdjacencyEdges(prophecy, gn);
  let effectiveMult: number;
  if (linkCfg.usePowProphecyLinkingForCascadeMult) {
    const n = Math.min(prophecyEdges, linkCfg.maxProphecyEdgesForLinkingPow);
    effectiveMult = mult * Math.pow(linkCfg.prophecyLinkingPowBasePerAdjacency, n);
  } else {
    const linkAdd = Math.min(
      linkCfg.maxCascadeMultBonusFromLinking,
      prophecyEdges * linkCfg.cascadeMultAddPerProphecyAdjacency,
    );
    effectiveMult = mult + linkAdd;
  }
  const base = modeMult(state.prophecyMode);
  const activeCount = state.activeProphecy.length || 1;
  const factors = fatesealProgressionRules.purchasedReels.omenScalingFactors;
  const scale =
    state.prophecyMode === "single"
      ? (factors[Math.min(activeCount - 1, factors.length - 1)] ?? 1.0)
      : 1.0;

  const prophecyContribution = prophecy.size * base * scale;
  const nonSelectedContribution = clusters.size * 0.5;

  let stepPayout = Math.floor(
    (prophecyContribution + nonSelectedContribution) *
      state.baseBet *
      effectiveMult *
      fatesealCascadePayoutScale,
  );
  const marked = state.markedOmenSymbol;
  if (marked && stepPayout > 0) {
    for (const k of prophecy) {
      const { r, c } = parseKey(k);
      if (grid[r]![c] === marked) {
        stepPayout = Math.floor(
          stepPayout * fatesealProgressionRules.purchasedReels.markedSymbolPayoutMultiplier,
        );
        break;
      }
    }
  }
  let g = applyRemovalMask(grid, remove);
  g = applyGravity(g);
  const filled = fillNullsFromPool(g, pool, rng);
  applyColumnPostPick(filled, fillColCtx, rng);
  return {
    grid: filled,
    stepPayout,
    prophecyMatches: prophecy.size,
    clusterTiles: [...clusters].filter((k) => !prophecy.has(k)).length,
    removed: remove.size,
    prophecyMatchKeys: [...prophecy],
    removedKeys: [...remove],
  };
}

/** Embed prior `oldN×oldN` tablet in the bottom-left of `newN×newN`, fill new bands, then column masks. */
export function expandGridForBonusWave(
  oldGrid: FatesealSymbolId[][],
  oldN: number,
  newN: number,
  pool: readonly FatesealPoolEntry[],
  rng: Rng,
  colCtx: FatesealFillColumnContext,
): FatesealSymbolId[][] {
  const rowOff = newN - oldN;
  const g: FatesealSymbolId[][] = Array.from({ length: newN }, () =>
    Array.from({ length: newN }, () => "key" as FatesealSymbolId),
  );
  for (let r = 0; r < oldN; r++) {
    for (let c = 0; c < oldN; c++) {
      g[rowOff + r]![c] = oldGrid[r]![c]!;
    }
  }
  const t = totalPoolWeight(pool);
  for (let r = 0; r < newN; r++) {
    for (let c = 0; c < newN; c++) {
      if (r >= rowOff && c < oldN) continue;
      g[r]![c] = pickFromPool(pool, t, rng);
    }
  }
  applyColumnPostPick(g, colCtx, rng);
  return g;
}

/** Bottom-left `FATESEAL_GRID_SIZE` window after a larger ritual (TODO.md bonus grid). */
export function shrinkGridToSessionSize(grid: FatesealSymbolId[][]): FatesealSymbolId[][] {
  const n = grid.length;
  const t = FATESEAL_GRID_SIZE;
  if (n <= t) return grid.map((row) => [...row]);
  const startRow = n - t;
  return Array.from({ length: t }, (_, i) =>
    Array.from({ length: t }, (_, j) => grid[startRow + i]![j]!),
  );
}

export function createInitialFatesealState(
  sessionWallet: number,
  buyIn: number,
  rng?: Rng,
  tableConfig: FatesealGameModeConfig = getCurrentFatesealGameMode(),
): FatesealEngineState {
  const grid = newEmptyGrid();
  const pool = clonePool(fatesealDefaultSymbolPool);
  if (rng) fillGridRandom(grid, pool, rng);
  const cap = Math.max(
    tableConfig.minBaseBet,
    Math.floor(sessionWallet * tableConfig.maxBaseBetFractionOfSession),
  );
  const step = Math.max(1, tableConfig.chipIncrement);
  const raw = Math.max(tableConfig.minBaseBet, Math.min(Math.floor(buyIn * 0.05), cap));
  const aligned = Math.floor(raw / step) * step;
  const baseBet = Math.min(Math.max(tableConfig.minBaseBet, aligned), cap);
  return {
    grid,
    symbolPool: pool,
    prophecyMode: "single",
    activeProphecy: [],
    baseBet,
    sessionWallet,
    spinCount: 0,
    crossroadsBonusAccum: 0,
    scatterMeter: 0,
    freeRitualSpinsLeft: 0,
    tomeSpinsLeft: 0,
    silverVisionTarget: null,
    buyIn,
    wildReelPaidSpinTimers: [],
    deadReelPaidSpinTimers: [],
    markedOmenSymbol: null,
    markedOmenPaidSpinsLeft: 0,
  };
}

export function runSpin(
  state: FatesealEngineState,
  rng: Rng,
  options?: { skipInitialFill?: boolean; /** Monte Carlo / isolation: no meter, bonus appends, or sympathetic. */ forBaseRitualSim?: boolean },
): SpinResult {
  const log: CascadeLogLine[] = [];
  const emptyResult = (): SpinResult => ({
    nextState: state,
    log,
    totalPayout: 0,
    crossroadsGate: false,
    cascadeKeyframes: [],
  });
  if (state.activeProphecy.length === 0) {
    return emptyResult();
  }

  const useFreeSpin = state.freeRitualSpinsLeft > 0;
  const bet = useFreeSpin ? 0 : state.baseBet;
  if (state.sessionWallet < bet) {
    log.push({ kind: "insufficient_funds" });
    return emptyResult();
  }

  let wallet = state.sessionWallet - bet;
  log.push({ kind: "spin_start", bet });

  let scatterMeter = state.scatterMeter;
  let freeRitualSpinsLeft = state.freeRitualSpinsLeft;
  const maxGrid = fatesealProgressionRules.bonusGrid.maxGridSize;
  const gridBase = FATESEAL_GRID_SIZE;
  const baseSim = options?.forBaseRitualSim === true;

  let grid = state.grid.map((row) => [...row]);
  let bonusQueue = 0;
  let ritualTriggersThisSpin = 0;
  let totalPayout = 0;
  const cascadeKeyframes: CascadeKeyframe[] = [];
  let globalDepth = 0;

  const poolOpts = (inBonusWave: boolean) =>
    buildEffectivePool(state.symbolPool, {
      tomeSpinsLeft: state.tomeSpinsLeft,
      freeRitualSpinsLeft: state.freeRitualSpinsLeft,
      silverVisionTarget: state.silverVisionTarget,
      inFreeRitualCascadeWave: inBonusWave,
    });

  const colCtxForWave = (bonusDeadColCount: number): FatesealFillColumnContext => {
    const n = grid.length;
    return {
      bonusDeadColCount: Math.min(bonusDeadColCount, n),
      wildColCount: Math.min(state.wildReelPaidSpinTimers.length, n),
      purchasedDeadColCount: Math.min(state.deadReelPaidSpinTimers.length, n),
    };
  };

  const tickScatterMeter = (enqueueBonus: boolean): void => {
    if (baseSim) return;
    const sc = countScattersOnGrid(grid);
    const t = meterTickFromScattersOnGrid(scatterMeter, sc, log, enqueueBonus);
    scatterMeter = t.scatterMeter;
    ritualTriggersThisSpin += t.ritualTriggers;
    if (enqueueBonus) bonusQueue += t.ritualTriggers;
  };

  const runOneCascadeLoop = (inBonusWave: boolean, bonusWaveNumber: number): void => {
    const effPool = poolOpts(inBonusWave);
    const fillCtx = colCtxForWave(inBonusWave ? bonusWaveNumber : 0);
    tickScatterMeter(true);

    const maxSteps = 200;
    for (let s = 0; s < maxSteps; s++) {
      const gridBeforeRemoval = grid.map((row) => [...row]);
      const step = runCascadeStep(grid, state, effPool, rng, globalDepth, fillCtx);
      grid = step.grid;
      if (step.removed === 0) break;
      totalPayout += step.stepPayout;
      cascadeKeyframes.push({
        depth: globalDepth,
        gridBeforeRemoval,
        removedKeys: step.removedKeys,
        prophecyMatchKeys: step.prophecyMatchKeys,
        payout: step.stepPayout,
        gridAfterCascade: grid.map((row) => [...row]),
      });
      log.push({
        kind: "cascade",
        depth: globalDepth,
        prophecyMatches: step.prophecyMatches,
        clusterTiles: step.clusterTiles,
        removed: step.removed,
        payout: step.stepPayout,
      });
      globalDepth++;
      tickScatterMeter(false);
    }
  };

  let bonusWaveIdx = 0;
  if (!options?.skipInitialFill) {
    fillGridRandom(grid, poolOpts(false), rng, colCtxForWave(0));
  }

  runOneCascadeLoop(false, 0);

  while (bonusQueue > 0) {
    bonusQueue--;
    bonusWaveIdx++;
    const targetN = Math.min(maxGrid, gridBase + bonusWaveIdx);
    const fillPool = poolOpts(true);
    const waveCtx = colCtxForWave(bonusWaveIdx);
    if (targetN > grid.length) {
      grid = expandGridForBonusWave(grid, grid.length, targetN, fillPool, rng, waveCtx);
    } else {
      fillGridRandom(grid, fillPool, rng, waveCtx);
    }
    runOneCascadeLoop(true, bonusWaveIdx);
  }

  const symCfg = fatesealProgressionRules.sympatheticVibrations;
  if (!baseSim && ritualTriggersThisSpin >= symCfg.bonusRoundIndexTrigger) {
    const sympatheticPayout = Math.floor(symCfg.payoutMultipleOfBaseBet * state.baseBet);
    totalPayout += sympatheticPayout;
    log.push({ kind: "sympathetic_vibrations", payout: sympatheticPayout });
  }

  wallet += totalPayout;

  if (useFreeSpin) {
    freeRitualSpinsLeft = Math.max(0, freeRitualSpinsLeft - 1);
  }

  let wildReelPaidSpinTimers = state.wildReelPaidSpinTimers;
  let deadReelPaidSpinTimers = state.deadReelPaidSpinTimers;
  let markedOmenPaidSpinsLeft = state.markedOmenPaidSpinsLeft;
  let markedOmenSymbol = state.markedOmenSymbol;
  const decayThisSpin =
    bet > 0 || !fatesealProgressionRules.purchasedReels.bonusSpinsExcludeFromReelDecay;
  if (decayThisSpin) {
    wildReelPaidSpinTimers = tickFifoReelTimers(wildReelPaidSpinTimers);
    deadReelPaidSpinTimers = tickFifoReelTimers(deadReelPaidSpinTimers);
    if (markedOmenPaidSpinsLeft > 0) {
      markedOmenPaidSpinsLeft -= 1;
      if (markedOmenPaidSpinsLeft <= 0) {
        markedOmenPaidSpinsLeft = 0;
        markedOmenSymbol = null;
      }
    }
  }

  /** TODO.md — bonus scatter meter does not carry between player rounds (only within-composite). */
  scatterMeter = 0;

  const scatters = countScattersOnGrid(grid);
  const spinCount = state.spinCount + 1;
  const tomeSpinsLeft = state.tomeSpinsLeft > 0 ? state.tomeSpinsLeft - 1 : 0;

  const crossroadsThreshold = fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop;
  let crossroadsBonusAccum = state.crossroadsBonusAccum + scatters;
  let crossroadsGate = false;
  if (crossroadsBonusAccum >= crossroadsThreshold) {
    crossroadsGate = true;
    crossroadsBonusAccum -= crossroadsThreshold;
  }

  log.push({ kind: "spin_end", scatterGained: scatters, totalSpinPayout: totalPayout });

  grid = shrinkGridToSessionSize(grid);

  const nextState: FatesealEngineState = {
    ...state,
    grid,
    sessionWallet: wallet,
    spinCount,
    crossroadsBonusAccum,
    scatterMeter,
    freeRitualSpinsLeft,
    tomeSpinsLeft,
    wildReelPaidSpinTimers,
    deadReelPaidSpinTimers,
    markedOmenSymbol,
    markedOmenPaidSpinsLeft,
  };

  return {
    nextState,
    log,
    totalPayout,
    crossroadsGate,
    cascadeKeyframes,
  };
}
