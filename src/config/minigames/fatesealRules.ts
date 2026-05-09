/**
 * Fateseal Silver — occult cascading grid slot (see repo root `Fateseal_Specs.md`).
 *
 * Tunables live here; Vitest and the Monte Carlo sim import this module so defaults
 * cannot drift from production behavior.
 */

/** Standard occult icons (§3A — 8 unique). */
export const FATESEAL_STANDARD_SYMBOLS = [
  "dagger",
  "chalice",
  "goat",
  "eye",
  "serpent",
  "moon",
  "flame",
  "key",
] as const;

export type FatesealStandardId = (typeof FATESEAL_STANDARD_SYMBOLS)[number];

export const FATESEAL_SPECIAL_SYMBOLS = ["wild", "scatter", "void"] as const;
export type FatesealSpecialId = (typeof FATESEAL_SPECIAL_SYMBOLS)[number];

export type FatesealSymbolId = FatesealStandardId | FatesealSpecialId;

export const fatesealSymbolLore: Record<FatesealStandardId, { title: string; blurb: string }> = {
  dagger: { title: "The Dagger", blurb: "A promise cut in silver." },
  chalice: { title: "The Chalice", blurb: "Wine dark as a sealed oath." },
  goat: { title: "The Goat", blurb: "Horns against a thin moon." },
  eye: { title: "The Eye", blurb: "It blinks when nobody is watching." },
  serpent: { title: "The Serpent", blurb: "Coils in the corner of the vision." },
  moon: { title: "The Moon", blurb: "A thin sickle over charcoal stone." },
  flame: { title: "The Flame", blurb: "Cold fire that eats the edges." },
  key: { title: "The Key", blurb: "Teeth that fit a lock you never saw." },
};

/** Grid is 5×5 per spec §3. */
export const FATESEAL_GRID_SIZE = 5 as const;

/**
 * §3B — Single Focus: 10× base bet per prophecy match instance.
 * Triple Focus: 1× base bet per instance of any of the three symbols.
 */
export const fatesealProphecyMode = {
  single: { pickCount: 1 as const, winMultipleOfBaseBet: 10 },
  triple: { pickCount: 3 as const, winMultipleOfBaseBet: 1 },
} as const;

export type FatesealProphecyModeKey = keyof typeof fatesealProphecyMode;

/**
 * §3C step 3 — payout uses a per-cascade multiplier that rises with chain depth.
 * Index 0 = first evaluation after a spin / inflow; further cascades use successive entries (clamped).
 */
export const fatesealCascadeMultipliers = [1, 2, 3, 5, 8, 13] as const;

/** Adjacent (orthogonal) clusters of this many matching standards (+ wild) clear per §3C step 4. */
export const fatesealAdjacentMinRun = 3;

/** §4 — Crossroads after every N completed spins (counted after cascades settle). */
export const fatesealCrossroadsEveryNSpins = 3;

/** §3A / §5 — Scatter collected across spins until the Free Ritual fires. */
export const fatesealScatterRitual = {
  /** Scatters on the board added to the meter after each spin settles. */
  meterToTrigger: 5,
  /** Bonus spins granted — no base bet deducted while active. */
  freeSpinsGranted: 8,
  /** During Free Ritual fills, extra wild weight is applied in generation (soft guarantee). */
  freeRitualWildWeightBoost: 4,
} as const;

/** Table stakes — session wallet debited each spin unless Free Ritual is active. */
export const fatesealTableConfig = {
  /** Primary chip step for base bet control. */
  chipIncrement: 10,
  minBaseBet: 10,
  /** Max base bet as a fraction of current session credits (session wallet). */
  maxBaseBetFractionOfSession: 0.25,
} as const;

/**
 * §4 Crossroads — costs scale with buy-in so the shop stays legible across stakes.
 * Payout / grant values are **proposals** from Monte Carlo tuning (see scripts/sim-fateseal.mts).
 */
export const fatesealCrossroadsOffers = {
  faustianBargain: {
    /** Credits granted immediately (floor of buy-in × ratio). */
    creditRatioOfBuyIn: 0.15,
    /** Voids permanently appended to the symbol pool weight list. */
    voidsAdded: 3,
  },
  silverVision: {
    costRatioOfBuyIn: 0.2,
    /** Replaces one chosen standard's pool entries with wild for the rest of the session. */
  },
  forbiddenTome: {
    costRatioOfBuyIn: 0.1,
    /** Doubles effective scatter weight for the next N spins (§4 table). */
    boostedSpins: 3,
  },
} as const;

/** Weighted pool row used for drops / shop bookkeeping. */
export type FatesealPoolEntry = {
  symbol: FatesealSymbolId;
  weight: number;
};

/**
 * Starting symbol pool — weights are tuned for ~medium volatility at default buy-in.
 * Standards dominate; wild/scatter are spice; void starts at 0 (Faustian adds it).
 */
export const fatesealDefaultSymbolPool: readonly FatesealPoolEntry[] = [
  { symbol: "dagger", weight: 10 },
  { symbol: "chalice", weight: 10 },
  { symbol: "goat", weight: 10 },
  { symbol: "eye", weight: 10 },
  { symbol: "serpent", weight: 10 },
  { symbol: "moon", weight: 10 },
  { symbol: "flame", weight: 10 },
  { symbol: "key", weight: 10 },
  { symbol: "wild", weight: 3 },
  { symbol: "scatter", weight: 2 },
];

export function totalPoolWeight(pool: readonly FatesealPoolEntry[]): number {
  let s = 0;
  for (const e of pool) s += Math.max(0, e.weight);
  return s;
}

export function clonePool(pool: readonly FatesealPoolEntry[]): FatesealPoolEntry[] {
  return pool.map((e) => ({ ...e }));
}
