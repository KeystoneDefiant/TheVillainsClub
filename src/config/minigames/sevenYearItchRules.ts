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
  /** Table clicks add/remove this many credits per tap (primary / context). */
  chipIncrement: 5,
  /** Max free-odds stake as a multiple of the current pass line stake (simplified table rule). */
  maxFreeOddsMultipleOfPass: 2,
  minPassBet: 10,
  minPlaceBet: 5,
  maxPassBetFractionOfBuyIn: 0.25 as number,
} as const;

export const sevenYearItchRackets = {
  2: { name: "Political Graft", risk: "Extreme", story: "City Hall opens a side door and the councilmen start taking envelopes." },
  3: { name: "Diamond Smuggling", risk: "High", story: "A velvet pouch crosses the border under a customs man's hat." },
  4: { name: "Union Extortion", risk: "Mid", story: "The loading dock votes your way after one quiet conversation." },
  5: { name: "Speakeasies", risk: "Stable", story: "The back room fills, the glasses sweat, and the till starts singing." },
  6: { name: "Protection Rackets", risk: "Low", story: "Every storefront on the block remembers who keeps the windows intact." },
  8: { name: "Numbers Games", risk: "Low", story: "Policy slips flutter through the neighborhood like confetti with a price." },
  9: { name: "Underground Casinos", risk: "Stable", story: "The roulette wheel is honest enough to keep the suckers comfortable." },
  10: { name: "Dockside Smuggling", risk: "Mid", story: "A crate loses its manifest and gains a police escort." },
  11: { name: "Luxury Heists", risk: "High", story: "The penthouse safe coughs up diamonds before dessert is cleared." },
  12: { name: "High Commission", risk: "Extreme", story: "The boardroom signs a deal so dirty even the ink wants a lawyer." },
} as const satisfies Record<PointNumber, { name: string; risk: string; story: string }>;

export type SevenYearItchHeatBonusId =
  | "look_the_other_way"
  | "inside_man"
  | "kingpins_cut"
  | "aggressive_expansion";

export type SevenYearItchHeatBonus = {
  id: SevenYearItchHeatBonusId;
  title: string;
  description: string;
  pullWeight: number;
  effect: {
    type: "shield_next_seven" | "next_non_seven_multiplier" | "place_hit_multiplier" | "risk_reward_multiplier";
    value: number;
    risk?: "seven_forfeits_table";
  };
};

export const sevenYearItchHeatBonuses: readonly SevenYearItchHeatBonus[] = [
  {
    id: "look_the_other_way",
    title: "The Look the Other Way",
    description: "Ignore the next 7. Heat drops and the investigation keeps breathing.",
    pullWeight: 38,
    effect: { type: "shield_next_seven", value: 1 },
  },
  {
    id: "inside_man",
    title: "The Inside Man",
    description: "Next non-7 roll pays an extra 25% as a crooked clerk tips the ledger.",
    pullWeight: 28,
    effect: { type: "next_non_seven_multiplier", value: 1.25 },
  },
  {
    id: "kingpins_cut",
    title: "The Kingpin's Cut",
    description: "The next place hit pays double. Miss it and the boss still wants his name on the door.",
    pullWeight: 22,
    effect: { type: "place_hit_multiplier", value: 2 },
  },
  {
    id: "aggressive_expansion",
    title: "Aggressive Expansion",
    description: "Double the next non-7 payout, but a 7 forfeits everything still on the felt.",
    pullWeight: 12,
    effect: { type: "risk_reward_multiplier", value: 2, risk: "seven_forfeits_table" },
  },
] as const;

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
