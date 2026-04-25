import type { HardwayNumber, HopKey, PointNumber } from "@/config/minigames/sevenYearItchRules";
import {
  freeOddsProfit,
  HARDWAY_NUMBERS,
  hardwayProfit,
  hopBetReturn,
  hopKeyFromDice,
  hornBetReturn,
  fieldBetReturn,
  isAllowedHopKey,
  isEasyHardwayLoss,
  isHardRollForNumber,
  isPointNumber,
  maxFreeOddsStake,
  placeBetTotalReturn,
  rollTotal,
  sevenYearItchTableConfig,
} from "@/config/minigames/sevenYearItchRules";

export type GamePhase = "comeOut" | "point";

export type CraplessTableState = {
  phase: GamePhase;
  /** Set only in `point` phase. */
  point: PointNumber | null;
  /** Rolls since point established (resets on new come-out or seven-out). */
  rollsSincePoint: number;
};

export type TableBets = {
  passLine: number;
  freeOdds: number;
  place: Partial<Record<PointNumber, number>>;
  /** One-roll field bet. */
  field: number;
  /** Equal stake on each of 2, 3, 11, 12; total at risk = hornUnit × 4. */
  hornUnit: number;
  /** One-roll hops on allowed keys only. */
  hops: Partial<Record<HopKey, number>>;
  /** Hard 4 / 6 / 8 / 10 until win, seven, or easy. */
  hardways: Partial<Record<HardwayNumber, number>>;
};

export type DiceRoll = { d1: number; d2: number; total: number };

export type RollLine = { kind: "info" | "win" | "loss" | "neutral"; text: string };

export type RollResolution = {
  roll: DiceRoll;
  nextTable: CraplessTableState;
  /** Net change to player cash balance (bets already removed from balance in the UI). */
  walletDelta: number;
  /** Replace entire bets object (seven-out clears all). */
  nextBets: TableBets;
  lines: RollLine[];
};

export function initialTableState(): CraplessTableState {
  return { phase: "comeOut", point: null, rollsSincePoint: 0 };
}

export function initialBets(): TableBets {
  return {
    passLine: 0,
    freeOdds: 0,
    place: {},
    field: 0,
    hornUnit: 0,
    hops: {},
    hardways: {},
  };
}

export type Rng = () => number;

export function rollDice(rng: Rng = Math.random): DiceRoll {
  const d1 = 1 + Math.floor(rng() * 6);
  const d2 = 1 + Math.floor(rng() * 6);
  return { d1, d2, total: rollTotal(d1, d2) };
}

function cloneBets(b: TableBets): TableBets {
  return {
    passLine: b.passLine,
    freeOdds: b.freeOdds,
    place: { ...b.place },
    field: b.field,
    hornUnit: b.hornUnit,
    hops: { ...b.hops },
    hardways: { ...b.hardways },
  };
}

function emptyAllBets(): TableBets {
  return initialBets();
}

/**
 * Validates and clamps free odds to pass and table rule.
 */
export function clampFreeOdds(passLine: number, requested: number): number {
  const cap = maxFreeOddsStake(passLine, sevenYearItchTableConfig.maxFreeOddsMultipleOfPass);
  return Math.max(0, Math.min(Math.floor(requested), cap));
}

function resolveFieldHornHops(
  roll: DiceRoll,
  nb: TableBets,
  lines: RollLine[],
): number {
  let wd = 0;
  const { total } = roll;

  if (nb.field > 0) {
    const st = nb.field;
    const ret = fieldBetReturn(total, st);
    if (ret > 0) {
      wd += ret;
      lines.push({ kind: "win", text: `Field pays ${ret.toLocaleString()} credits.` });
    } else {
      lines.push({ kind: "loss", text: "Field loses — one roll." });
    }
    nb.field = 0;
  }

  if (nb.hornUnit > 0) {
    const u = nb.hornUnit;
    const ret = hornBetReturn(total, u);
    if (ret > 0) {
      wd += ret;
      lines.push({ kind: "win", text: `Horn hits for ${ret.toLocaleString()} credits.` });
    } else {
      lines.push({ kind: "loss", text: "Horn misses." });
    }
    nb.hornUnit = 0;
  }

  const hk = hopKeyFromDice(roll.d1, roll.d2);
  for (const key of [...Object.keys(nb.hops)] as HopKey[]) {
    const st = nb.hops[key] ?? 0;
    if (st <= 0) {
      delete nb.hops[key];
      continue;
    }
    if (key === hk && isAllowedHopKey(key)) {
      const ret = hopBetReturn(key, st);
      wd += ret;
      lines.push({ kind: "win", text: `Hop ${key} pays ${ret.toLocaleString()} credits.` });
    } else {
      lines.push({ kind: "loss", text: `Hop ${key} loses.` });
    }
    delete nb.hops[key];
  }
  nb.hops = {};

  return wd;
}

function resolveHardways(roll: DiceRoll, nb: TableBets, lines: RollLine[]): number {
  let wd = 0;
  const { d1, d2, total } = roll;

  if (total === 7) {
    let any = false;
    for (const hw of HARDWAY_NUMBERS) {
      if ((nb.hardways[hw] ?? 0) > 0) any = true;
    }
    if (any) {
      lines.push({ kind: "loss", text: "Seven — hardways scrubbed." });
    }
    nb.hardways = {};
    return wd;
  }

  for (const hw of HARDWAY_NUMBERS) {
    const st = nb.hardways[hw] ?? 0;
    if (st <= 0) continue;
    if (isHardRollForNumber(hw, d1, d2)) {
      const pr = hardwayProfit(hw, st);
      wd += st + pr;
      lines.push({ kind: "win", text: `Hard ${hw} — ${(st + pr).toLocaleString()} credits.` });
      delete nb.hardways[hw];
    } else if (isEasyHardwayLoss(hw, d1, d2)) {
      lines.push({ kind: "loss", text: `Easy ${hw} — hard ${hw} is picked up.` });
      delete nb.hardways[hw];
    }
  }

  return wd;
}

/**
 * Resolves one roll given current table state and bets **at risk** (money already reserved off-balance in the UI).
 */
export function resolveRoll(table: CraplessTableState, bets: TableBets, roll: DiceRoll): RollResolution {
  const lines: RollLine[] = [];
  let walletDelta = 0;

  if (bets.passLine <= 0) {
    lines.push({ kind: "info", text: "Put something on the pass line before you roll." });
    return { roll, nextTable: table, walletDelta: 0, nextBets: bets, lines };
  }

  const nb = cloneBets(bets);

  walletDelta += resolveFieldHornHops(roll, nb, lines);
  walletDelta += resolveHardways(roll, nb, lines);

  if (table.phase === "comeOut") {
    const { total } = roll;

    if (total === 7) {
      walletDelta += bets.passLine * 2;
      lines.push({ kind: "win", text: "Seven on the come-out — pass pays even money. Fresh felt." });
      return {
        roll,
        nextTable: { phase: "comeOut", point: null, rollsSincePoint: 0 },
        walletDelta,
        nextBets: emptyAllBets(),
        lines,
      };
    }

    if (!isPointNumber(total)) {
      lines.push({ kind: "info", text: "Impossible total for two dice." });
      return { roll, nextTable: table, walletDelta: 0, nextBets: bets, lines };
    }

    lines.push({
      kind: "neutral",
      text: `The crackdown is on ${total}. Odds and place — if you dare.`,
    });
    return {
      roll,
      nextTable: { phase: "point", point: total, rollsSincePoint: 0 },
      walletDelta,
      nextBets: {
        ...nb,
        freeOdds: 0,
      },
      lines,
    };
  }

  const pt = table.point;
  if (pt == null) {
    lines.push({ kind: "info", text: "Internal: point phase without a point." });
    return { roll, nextTable: table, walletDelta: 0, nextBets: bets, lines };
  }

  const nextTableBase: CraplessTableState = {
    ...table,
    rollsSincePoint: table.rollsSincePoint + 1,
  };

  if (roll.total === 7) {
    lines.push({ kind: "loss", text: "Seven — the bust. Everything on the layout is gone." });
    return {
      roll,
      nextTable: { phase: "comeOut", point: null, rollsSincePoint: 0 },
      walletDelta,
      nextBets: emptyAllBets(),
      lines,
    };
  }

  if (roll.total === pt) {
    walletDelta += bets.passLine * 2;
    lines.push({ kind: "win", text: `The ${pt} pays. Pass line holds.` });
    if (bets.freeOdds > 0) {
      const pr = freeOddsProfit(pt, bets.freeOdds);
      walletDelta += bets.freeOdds + pr;
      lines.push({ kind: "win", text: `Free odds rake in ${(bets.freeOdds + pr).toLocaleString()} credits.` });
    }
    const plOnPoint = bets.place[pt] ?? 0;
    if (plOnPoint > 0) {
      const ret = placeBetTotalReturn(pt, plOnPoint);
      walletDelta += ret;
      lines.push({ kind: "win", text: `Place on ${pt} returns ${ret.toLocaleString()} credits.` });
    }
    const newPlace = { ...bets.place };
    delete newPlace[pt];
    lines.push({ kind: "neutral", text: "Point is made. New come-out — set your pass." });
    const cleared = emptyAllBets();
    return {
      roll,
      nextTable: { phase: "comeOut", point: null, rollsSincePoint: 0 },
      walletDelta,
      nextBets: {
        ...cleared,
        place: newPlace,
        hardways: { ...nb.hardways },
      },
      lines,
    };
  }

  if (isPointNumber(roll.total)) {
    const pk = roll.total as PointNumber;
    const st = bets.place[pk] ?? 0;
    if (st > 0) {
      const ret = placeBetTotalReturn(pk, st);
      const profit = ret - st;
      walletDelta += profit;
      lines.push({
        kind: "win",
        text: `Place on ${pk} — ${profit.toLocaleString()} credits profit (stake rides).`,
      });
    } else {
      lines.push({ kind: "neutral", text: `${roll.total} — business as usual.` });
    }
  }

  return {
    roll,
    nextTable: nextTableBase,
    walletDelta,
    nextBets: {
      ...nb,
      passLine: bets.passLine,
      freeOdds: bets.freeOdds,
      place: { ...bets.place },
    },
    lines,
  };
}

/** Cash tied up on the layout (must be <= player balance when adjusting bets). */
export function totalOnLayout(b: TableBets): number {
  let s = b.passLine + b.freeOdds + b.field + b.hornUnit * 4;
  for (const k of Object.keys(b.place) as unknown as PointNumber[]) {
    s += b.place[k] ?? 0;
  }
  for (const k of Object.keys(b.hops) as HopKey[]) {
    s += b.hops[k] ?? 0;
  }
  for (const k of Object.keys(b.hardways) as unknown as HardwayNumber[]) {
    s += b.hardways[k] ?? 0;
  }
  return s;
}
