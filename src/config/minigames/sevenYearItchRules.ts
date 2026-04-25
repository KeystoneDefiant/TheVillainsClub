/**
 * 7 Year Itch — base table math (Crapless Craps).
 *
 * Regulatory reference (come-out, free odds on 2/3/11/12, place on 2/3/11/12):
 * https://www.gaming.nv.gov/siteassets/content/divisions/enforcement/rules-of-play/Crapless_Craps.pdf
 *
 * Free odds on other points and place payouts on 4–6 / 8–10 follow standard craps.
 */

export const SEVEN_YEAR_ITCH_RULES_PDF =
  "https://www.gaming.nv.gov/siteassets/content/divisions/enforcement/rules-of-play/Crapless_Craps.pdf" as const;

/** Point numbers in crapless (all totals except 7). */
export type PointNumber = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

export const POINT_NUMBERS: readonly PointNumber[] = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

export const sevenYearItchTableConfig = {
  /** Max free-odds stake as a multiple of the current pass line stake (simplified table rule). */
  maxFreeOddsMultipleOfPass: 2,
  minPassBet: 10,
  minPlaceBet: 5,
  maxPassBetFractionOfBuyIn: 0.25 as number,
} as const;

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
