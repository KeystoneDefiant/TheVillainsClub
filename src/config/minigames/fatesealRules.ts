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

import {
  FATESEAL_STANDARD_SYMBOLS,
  FATESEAL_SPECIAL_SYMBOLS,
  fatesealSymbolLore,
  FATESEAL_GRID_SIZE,
  fatesealProphecyMode,
  fatesealCascadePayoutScale,
  fatesealCascadeMultipliers,
  fatesealProgressionRules,
  fatesealScatterSymbolPoolWeight,
  fatesealScatterRitual,
  fatesealGameConfig,
  fatesealCrossroadsNewShop,
  fatesealDefaultSymbolPool,
  fatesealUnsettleSpiritsConfig,
  fatesealFaustianBargainConfig,
  fatesealVassagoGambitConfig
} from './fatesealConfig';

import type {
  FatesealStandardId,
  FatesealSpecialId,
  FatesealSymbolId,
  FatesealProphecyModeKey,
  FatesealGameModeConfig,
  FatesealPoolEntry
} from './fatesealConfig';

export {
  FATESEAL_STANDARD_SYMBOLS,
  FATESEAL_SPECIAL_SYMBOLS,
  fatesealSymbolLore,
  FATESEAL_GRID_SIZE,
  fatesealProphecyMode,
  fatesealCascadePayoutScale,
  fatesealCascadeMultipliers,
  fatesealProgressionRules,
  fatesealScatterSymbolPoolWeight,
  fatesealScatterRitual,
  fatesealGameConfig,
  fatesealCrossroadsNewShop,
  fatesealDefaultSymbolPool,
  fatesealUnsettleSpiritsConfig,
  fatesealFaustianBargainConfig,
  fatesealVassagoGambitConfig
};

export type {
  FatesealStandardId,
  FatesealSpecialId,
  FatesealSymbolId,
  FatesealProphecyModeKey,
  FatesealGameModeConfig,
  FatesealPoolEntry
};

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

/** Credits for the next “add omen symbol” purchase this session (`alreadyPurchased` in 0..max-1). */
export function crossroadsNextOmenAdditionCostCredits(alreadyPurchased: number): number {
  const c = fatesealCrossroadsNewShop.addOmenSymbol;
  if (alreadyPurchased >= c.maxExtraPurchases) return Number.POSITIVE_INFINITY;
  return c.costs[alreadyPurchased] ?? Number.POSITIVE_INFINITY;
}

export function totalPoolWeight(pool: readonly FatesealPoolEntry[]): number {
  let s = 0;
  for (const e of pool) s += Math.max(0, e.weight);
  return s;
}

export function clonePool(pool: readonly FatesealPoolEntry[]): FatesealPoolEntry[] {
  return pool.map((e) => ({ ...e }));
}
