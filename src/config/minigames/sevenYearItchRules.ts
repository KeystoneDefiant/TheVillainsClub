/**
 * 7 Year Itch — base table math (Crapless Craps).
 *
 * Regulatory reference (come-out, free odds on 2/3/11/12, place on 2/3/11/12):
 * https://www.gaming.nv.gov/siteassets/content/divisions/enforcement/rules-of-play/Crapless_Craps.pdf
 *
 * Free odds on other points and place payouts on 4–6 / 8–10 follow standard craps.
 */

import {
  POINT_NUMBERS,
  sevenYearItchGameConfig,
  sevenYearItchRackets,
  sevenYearItchHeatBonuses
} from './sevenYearItchConfig';

import type {
  PointNumber,
  SevenYearItchGameModeConfig,
  SevenYearItchHeatBonusId,
  SevenYearItchHeatBonus
} from './sevenYearItchConfig';

export {
  POINT_NUMBERS,
  sevenYearItchGameConfig,
  sevenYearItchRackets,
  sevenYearItchHeatBonuses
};

export type {
  PointNumber,
  SevenYearItchGameModeConfig,
  SevenYearItchHeatBonusId,
  SevenYearItchHeatBonus
};

export const SEVEN_YEAR_ITCH_RULES_PDF =
  "https://www.gaming.nv.gov/siteassets/content/divisions/enforcement/rules-of-play/Crapless_Craps.pdf" as const;

function mergeSevenYearItchGameMode(
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
      result[key] = mergeSevenYearItchGameMode(
        defVal as Record<string, unknown>,
        ovVal as Record<string, unknown>,
      );
    } else {
      result[key] = ovVal;
    }
  }
  return result;
}

/** Active mode: default merged with `gameModes.normalGame` (currently empty). */
export function getCurrentSevenYearItchGameMode(): SevenYearItchGameModeConfig {
  const base = { ...sevenYearItchGameConfig.defaultGameMode } as unknown as Record<string, unknown>;
  const overrides = sevenYearItchGameConfig.gameModes.normalGame as unknown as Record<string, unknown>;
  return mergeSevenYearItchGameMode(base, overrides) as unknown as SevenYearItchGameModeConfig;
}

/** Resolve a specific mode (for future shell / session `modeId`). */
export function getSevenYearItchGameMode(
  modeId: keyof typeof sevenYearItchGameConfig.gameModes,
): SevenYearItchGameModeConfig {
  const base = { ...sevenYearItchGameConfig.defaultGameMode } as unknown as Record<string, unknown>;
  const overrides = (sevenYearItchGameConfig.gameModes[modeId] ?? {}) as unknown as Record<string, unknown>;
  return mergeSevenYearItchGameMode(base, overrides) as unknown as SevenYearItchGameModeConfig;
}

export type SevenYearItchGameModeId = keyof typeof sevenYearItchGameConfig.gameModes;

/** Session / shell: invalid or missing ids fall back to the normal merged profile. */
export function resolveSevenYearItchGameMode(modeId: string | undefined): SevenYearItchGameModeConfig {
  if (modeId != null && modeId !== "" && modeId in sevenYearItchGameConfig.gameModes) {
    return getSevenYearItchGameMode(modeId as SevenYearItchGameModeId);
  }
  return getCurrentSevenYearItchGameMode();
}

/** Default resolved rules (normal game); engine tests use this when no session is present. */
export const sevenYearItchTableConfig: SevenYearItchGameModeConfig = getCurrentSevenYearItchGameMode();

export function isPointNumber(n: number): n is PointNumber {
  return n !== 7 && n >= 2 && n <= 12;
}

/** Integer profit on a winning free-odds stake (true odds per NV + standard craps). */
export function freeOddsProfit(point: PointNumber, stake: number): number {
  if (stake <= 0) return 0;
  switch (point) {
    case 2:
    case 12:
      return Math.floor((stake * 6) / 1);
    case 3:
    case 11:
      return Math.floor((stake * 3) / 1);
    case 4:
    case 10:
      return Math.floor((stake * 2) / 1);
    case 5:
    case 9:
      return Math.floor((stake * 3) / 2);
    case 6:
    case 8:
      return Math.floor((stake * 6) / 5);
    default:
      return 0;
  }
}

/** Max free odds allowed behind pass for this pass stake. */
export function maxFreeOddsStake(passStake: number, maxMultiple: number = sevenYearItchTableConfig.maxFreeOddsMultipleOfPass): number {
  const p = Math.max(0, Math.floor(passStake));
  if (p <= 0) return 0;
  return Math.floor(p * maxMultiple);
}

/** Apply post-divest skim: full return at scale 1; after Divest, scale is 0.5 on profit only. */
export function placeBetScaledReturn(point: PointNumber, stake: number, profitScale: number): number {
  const full = placeBetTotalReturn(point, stake);
  if (profitScale >= 1 || stake <= 0) return full;
  const profit = full - stake;
  return stake + Math.floor(profit * profitScale);
}

/** Total return (stake + profit) for a winning place bet on `point`. */
export function placeBetTotalReturn(point: PointNumber, stake: number): number {
  if (stake <= 0) return 0;
  let profit = 0;
  switch (point) {
    case 4:
    case 10:
      profit = Math.floor((stake * 9) / 5);
      break;
    case 5:
    case 9:
      profit = Math.floor((stake * 7) / 5);
      break;
    case 6:
    case 8:
      profit = Math.floor((stake * 7) / 6);
      break;
    case 2:
    case 12:
      profit = Math.floor((stake * 25) / 5);
      break;
    case 3:
    case 11:
      profit = Math.floor((stake * 13) / 5);
      break;
    default:
      return 0;
  }
  return stake + profit;
}

export function rollTotal(d1: number, d2: number): number {
  return d1 + d2;
}

export function assertDie(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    throw new RangeError("Die must be integer 1..6");
  }
}

/** Hard 4 / 6 / 8 / 10 (pairs only). */
export type HardwayNumber = 4 | 6 | 8 | 10;

export const HARDWAY_NUMBERS: readonly HardwayNumber[] = [4, 6, 8, 10];

/** One-roll hop on a specific unordered pair (dice can fall either way). */
export const HOP_DOUBLE_KEYS = ["1-1", "2-2", "3-3", "4-4", "5-5", "6-6"] as const;
export type HopDoubleKey = (typeof HOP_DOUBLE_KEYS)[number];

export const HOP_EASY_KEYS = ["1-2", "5-6", "1-4", "2-4", "2-3", "4-5"] as const;
export type HopEasyKey = (typeof HOP_EASY_KEYS)[number];

export type HopKey = HopDoubleKey | HopEasyKey;

export const ALL_HOP_KEYS: readonly HopKey[] = [...HOP_DOUBLE_KEYS, ...HOP_EASY_KEYS];

export function hopKeyFromDice(d1: number, d2: number): `${number}-${number}` {
  const a = Math.min(d1, d2);
  const b = Math.max(d1, d2);
  return `${a}-${b}`;
}

export function isAllowedHopKey(key: string): key is HopKey {
  return (ALL_HOP_KEYS as readonly string[]).includes(key);
}

/** Field wins on these totals (standard field layout). */
export function isFieldWinnerTotal(total: number): boolean {
  return total === 2 || total === 3 || total === 4 || total === 9 || total === 10 || total === 11 || total === 12;
}

/** Credits returned to wallet (stake + profit) for a winning field bet; 0 if loss. */
export function fieldBetReturn(total: number, stake: number): number {
  if (stake <= 0 || !isFieldWinnerTotal(total)) return 0;
  if (total === 2 || total === 12) {
    return stake + Math.floor(stake * 2);
  }
  return stake + stake;
}

/** Horn: equal unit on 2, 3, 11, 12. Credits returned to wallet for this roll (0 if horn not hit). */
export function hornBetReturn(total: number, hornUnit: number): number {
  if (hornUnit <= 0) return 0;
  const u = hornUnit;
  switch (total) {
    case 2:
    case 12:
      return u + Math.floor(u * 30);
    case 3:
    case 11:
      return u + Math.floor(u * 15);
    default:
      return 0;
  }
}

/** One-roll hop: doubles pay 30:for 1 profit; easy pays 15:for 1 profit (stake returned on win). */
export function hopBetReturn(key: HopKey, stake: number): number {
  if (stake <= 0) return 0;
  const parts = key.split("-");
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  const isDouble = a === b;
  if (isDouble) {
    return stake + Math.floor(stake * 30);
  }
  return stake + Math.floor(stake * 15);
}

export function isHardRollForNumber(hw: HardwayNumber, d1: number, d2: number): boolean {
  if (d1 !== d2) return false;
  return d1 + d2 === hw;
}

/** Same total as hardway but not the hard pair (e.g. 1-3 for hard 4). */
export function isEasyHardwayLoss(hw: HardwayNumber, d1: number, d2: number): boolean {
  return d1 + d2 === hw && !isHardRollForNumber(hw, d1, d2);
}

/** Profit (not including stake return) for a winning hardway. */
export function hardwayProfit(hw: HardwayNumber, stake: number): number {
  if (stake <= 0) return 0;
  if (hw === 4 || hw === 10) {
    return Math.floor(stake * 7);
  }
  return Math.floor(stake * 9);
}
