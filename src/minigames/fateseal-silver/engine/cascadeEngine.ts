import {
  FATESEAL_GRID_SIZE,
  clonePool,
  fatesealAdjacentMinRun,
  fatesealCascadeMultipliers,
  fatesealCascadePayoutScale,
  fatesealDefaultSymbolPool,
  fatesealProphecyMode,
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
  scatterMeter: number;
  freeRitualSpinsLeft: number;
  tomeSpinsLeft: number;
  silverVisionTarget: FatesealStandardId | null;
  buyIn: number;
};

export type CascadeLogLine =
  | { kind: "cascade"; depth: number; prophecyMatches: number; clusterTiles: number; removed: number; payout: number }
  | { kind: "spin_start"; bet: number }
  | { kind: "spin_end"; scatterGained: number; totalSpinPayout: number }
  | { kind: "scatter_ritual_started"; spins: number }
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
  /** True every 3 completed spins — open Crossroads before the next spin. */
  crossroadsGate: boolean;
  /** Cascade steps keyed for shell animation — empty when the spin clears no tiles. */
  cascadeKeyframes: CascadeKeyframe[];
};

const GRID = FATESEAL_GRID_SIZE;

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
  opts: { tomeSpinsLeft: number; freeRitualSpinsLeft: number; silverVisionTarget: FatesealStandardId | null },
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
  if (opts.freeRitualSpinsLeft > 0) {
    for (const e of p) {
      if (e.symbol === "wild") e.weight += fatesealScatterRitual.freeRitualWildWeightBoost;
    }
  }
  return p;
}

export function fillGridRandom(grid: FatesealSymbolId[][], pool: readonly FatesealPoolEntry[], rng: Rng): void {
  const t = totalPoolWeight(pool);
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      grid[r][c] = pickFromPool(pool, t, rng);
    }
  }
}

function countScattersOnGrid(grid: FatesealSymbolId[][]): number {
  let n = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (grid[r][c] === "scatter") n++;
    }
  }
  return n;
}

function prophecyMatchCells(grid: FatesealSymbolId[][], prophecy: readonly FatesealStandardId[]): Set<string> {
  const set = new Set<string>();
  const prop = new Set(prophecy);
  if (prop.size === 0) return set;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const s = grid[r][c];
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
  const q: [number, number][] = [[sr, sc]];
  const seen = new Set<string>();
  while (q.length > 0) {
    const [r, c] = q.shift()!;
    const k = key(r, c);
    if (seen.has(k)) continue;
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) continue;
    const cell = grid[r][c];
    if (cell === "void" || cell === "scatter") continue;
    if (cell !== "wild" && cell !== target) continue;
    seen.add(k);
    for (const [dr, dc] of ORTHO) {
      q.push([r + dr, c + dc]);
    }
  }
  return seen;
}

/** @internal exported for tests */
export function findClusterRemovalCells(grid: FatesealSymbolId[][]): Set<string> {
  const removal = new Set<string>();
  const consumed = new Set<string>();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const k = key(r, c);
      if (consumed.has(k)) continue;
      const s = grid[r][c];
      if (s === "void" || s === "scatter" || s === "wild") continue;
      const target = s as FatesealStandardId;
      const comp = bfsCluster(grid, r, c, target);
      if (comp.size < fatesealAdjacentMinRun) continue;
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
  const out: NullableGrid = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => null));
  for (let c = 0; c < GRID; c++) {
    let writeRow = GRID - 1;
    for (let r = GRID - 1; r >= 0; r--) {
      const cell = g[r]![c];
      if (cell != null) {
        out[writeRow]![c] = cell;
        writeRow--;
      }
    }
  }
  return out;
}

function fillNullsFromPool(g: NullableGrid, pool: readonly FatesealPoolEntry[], rng: Rng): FatesealSymbolId[][] {
  const t = totalPoolWeight(pool);
  for (let c = 0; c < GRID; c++) {
    for (let r = 0; r < GRID; r++) {
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
  state: Pick<FatesealEngineState, "prophecyMode" | "activeProphecy" | "baseBet">,
  pool: readonly FatesealPoolEntry[],
  rng: Rng,
  depth: number,
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
  const clusters = findClusterRemovalCells(grid);
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
  const base = modeMult(state.prophecyMode);
  const stepPayout = Math.floor(
    prophecy.size * base * state.baseBet * mult * fatesealCascadePayoutScale,
  );
  let g = applyRemovalMask(grid, remove);
  g = applyGravity(g);
  const filled = fillNullsFromPool(g, pool, rng);
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
    scatterMeter: 0,
    freeRitualSpinsLeft: 0,
    tomeSpinsLeft: 0,
    silverVisionTarget: null,
    buyIn,
  };
}

export function runSpin(state: FatesealEngineState, rng: Rng, options?: { skipInitialFill?: boolean }): SpinResult {
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

  const effPool = buildEffectivePool(state.symbolPool, {
    tomeSpinsLeft: state.tomeSpinsLeft,
    freeRitualSpinsLeft: state.freeRitualSpinsLeft,
    silverVisionTarget: state.silverVisionTarget,
  });

  let grid = state.grid.map((row) => [...row]);
  if (!options?.skipInitialFill) {
    fillGridRandom(grid, effPool, rng);
  }

  let totalPayout = 0;
  let depth = 0;
  const maxCascadeSteps = 200;
  const cascadeKeyframes: CascadeKeyframe[] = [];
  for (; depth < maxCascadeSteps; depth++) {
    const gridBeforeRemoval = grid.map((row) => [...row]);
    const step = runCascadeStep(grid, state, effPool, rng, depth);
    grid = step.grid;
    if (step.removed === 0) break;
    totalPayout += step.stepPayout;
    cascadeKeyframes.push({
      depth,
      gridBeforeRemoval,
      removedKeys: step.removedKeys,
      prophecyMatchKeys: step.prophecyMatchKeys,
      payout: step.stepPayout,
      gridAfterCascade: grid.map((row) => [...row]),
    });
    log.push({
      kind: "cascade",
      depth,
      prophecyMatches: step.prophecyMatches,
      clusterTiles: step.clusterTiles,
      removed: step.removed,
      payout: step.stepPayout,
    });
  }

  wallet += totalPayout;

  const scatters = countScattersOnGrid(grid);
  let scatterMeter = state.scatterMeter + scatters;

  let freeRitualSpinsLeft = state.freeRitualSpinsLeft;
  if (useFreeSpin) {
    freeRitualSpinsLeft = Math.max(0, freeRitualSpinsLeft - 1);
  }
  if (scatterMeter >= fatesealScatterRitual.meterToTrigger) {
    scatterMeter = 0;
    freeRitualSpinsLeft += fatesealScatterRitual.freeSpinsGranted;
    log.push({ kind: "scatter_ritual_started", spins: fatesealScatterRitual.freeSpinsGranted });
  }

  const spinCount = state.spinCount + 1;
  const tomeSpinsLeft = state.tomeSpinsLeft > 0 ? state.tomeSpinsLeft - 1 : 0;

  log.push({ kind: "spin_end", scatterGained: scatters, totalSpinPayout: totalPayout });

  const nextState: FatesealEngineState = {
    ...state,
    grid,
    sessionWallet: wallet,
    spinCount,
    scatterMeter,
    freeRitualSpinsLeft,
    tomeSpinsLeft,
  };

  return {
    nextState,
    log,
    totalPayout,
    crossroadsGate: spinCount % 3 === 0,
    cascadeKeyframes,
  };
}
