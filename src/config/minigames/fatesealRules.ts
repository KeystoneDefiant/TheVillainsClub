/**
 * Fateseal Silver — occult cascading grid slot (see repo root `Fateseal_Specs.md`).
 *
 * Tunables live here; Vitest and the Monte Carlo sim import this module so defaults
 * cannot drift from production behavior.
 *
 * **RTP / house edge:** The design doc fixes symbolic multipliers (§3B–§3C). This module adds a
 * **cascade payout scale** (`fatesealCascadePayoutScale`) and softer cascade ramp / scatter cadence
 * so average session wallet drift over long runs stays negative vs. base bet under `npm run sim:fateseal`.
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
 * Applied to every cascade step payout after §3B × §3C math (floor). Tightens long-run RTP vs. raw
 * symbolic multipliers alone. Re-tune with `npm run sim:fateseal`.
 */
/** Monte Carlo (see `npm run sim:fateseal` with `FATESEAL_SIM_BASE_ONLY=1`) targets ~88–95% payout/paid bet. */
export const fatesealCascadePayoutScale = 0.0125 as const;

/**
 * §3C step 3 — payout uses a per-cascade multiplier that rises with chain depth.
 * Index 0 = first evaluation after a spin / inflow; further cascades use successive entries (clamped).
 * Softer ramp than early prototypes — pairs with {@link fatesealCascadePayoutScale}.
 */
export const fatesealCascadeMultipliers = [1, 1, 2, 3, 4, 6] as const;

/** Adjacent (orthogonal) clusters of this many matching standards (+ wild) clear per §3C step 4. */
export const fatesealAdjacentMinRun = 3;

/** §4 — Crossroads after every N completed spins (counted after cascades settle). */
export const fatesealCrossroadsEveryNSpins = 3;

/** §3A / §5 — Scatter collected across spins until the Free Ritual fires. */
export const fatesealScatterRitual = {
  /** Scatters on the board added to the meter after each spin settles. */
  meterToTrigger: 12,
  /** Bonus spins granted — no base bet deducted while active. */
  freeSpinsGranted: 2,
  /** During Free Ritual fills, extra wild weight is applied in generation (soft guarantee). */
  freeRitualWildWeightBoost: 1,
} as const;

/**
 * Game mode container (same pattern as Oubliette / 7 Year Itch): **defaultGameMode** plus
 * **gameModes** partial overrides. Shell passes `gameModeId` on `TableSession`.
 */
export const fatesealGameConfig = {
  defaultGameMode: {
    displayName: "Normal ritual",
    /** Primary chip step for base bet control. */
    chipIncrement: 10,
    minBaseBet: 10,
    /** Max base bet as a fraction of current session credits (session wallet). */
    maxBaseBetFractionOfSession: 0.25 as number,
  },
  gameModes: {
    normalGame: {},
    /** Example low-stakes profile (not shell-selected until wired). */
    quickBet: {
      chipIncrement: 5,
      minBaseBet: 5,
    },
  },
} as const;

export type FatesealGameModeConfig = (typeof fatesealGameConfig)["defaultGameMode"];

function mergeFatesealGameMode(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] === undefined) continue;
    const defVal = defaults[key];
    const ovVal = overrides[key];
    if (
      ovVal !== null &&
      typeof ovVal === "object" &&
      !Array.isArray(ovVal) &&
      defVal !== null &&
      typeof defVal === "object" &&
      !Array.isArray(defVal)
    ) {
      result[key] = mergeFatesealGameMode(
        defVal as Record<string, unknown>,
        ovVal as Record<string, unknown>,
      );
    } else {
      result[key] = ovVal;
    }
  }
  return result;
}

export function getCurrentFatesealGameMode(): FatesealGameModeConfig {
  const base = { ...fatesealGameConfig.defaultGameMode } as unknown as Record<string, unknown>;
  const overrides = fatesealGameConfig.gameModes.normalGame as unknown as Record<string, unknown>;
  return mergeFatesealGameMode(base, overrides) as unknown as FatesealGameModeConfig;
}

export function getFatesealGameMode(modeId: keyof typeof fatesealGameConfig.gameModes): FatesealGameModeConfig {
  const base = { ...fatesealGameConfig.defaultGameMode } as unknown as Record<string, unknown>;
  const overrides = (fatesealGameConfig.gameModes[modeId] ?? {}) as unknown as Record<string, unknown>;
  return mergeFatesealGameMode(base, overrides) as unknown as FatesealGameModeConfig;
}

export type FatesealGameModeId = keyof typeof fatesealGameConfig.gameModes;

export function resolveFatesealGameMode(modeId: string | undefined): FatesealGameModeConfig {
  if (modeId != null && modeId !== "" && modeId in fatesealGameConfig.gameModes) {
    return getFatesealGameMode(modeId as FatesealGameModeId);
  }
  return getCurrentFatesealGameMode();
}

/** Default table stakes for engines / scripts when no session is present. */
export const fatesealTableConfig: FatesealGameModeConfig = getCurrentFatesealGameMode();

/**
 * §4 Crossroads — costs scale with buy-in so the shop stays legible across stakes.
 * Payout / grant values are **proposals** from Monte Carlo tuning (see scripts/sim-fateseal.mts).
 */
export const fatesealCrossroadsOffers = {
  faustianBargain: {
    /** Credits granted immediately (floor of buy-in × ratio). */
    creditRatioOfBuyIn: 0.12,
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
 * Starting symbol pool — weights tuned with the payout scale and cascade ramp for controlled
 * volatility at default buy-in. Void starts at 0 (Faustian adds it).
 */
export const fatesealDefaultSymbolPool: readonly FatesealPoolEntry[] = [
  { symbol: "dagger", weight: 9 },
  { symbol: "chalice", weight: 9 },
  { symbol: "goat", weight: 9 },
  { symbol: "eye", weight: 9 },
  { symbol: "serpent", weight: 9 },
  { symbol: "moon", weight: 9 },
  { symbol: "flame", weight: 9 },
  { symbol: "key", weight: 9 },
  { symbol: "wild", weight: 2 },
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
