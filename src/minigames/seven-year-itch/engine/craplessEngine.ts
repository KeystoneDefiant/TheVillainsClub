import type { PointNumber } from "@/config/minigames/sevenYearItchRules";
import {
  freeOddsProfit,
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
};

export type DiceRoll = { d1: number; d2: number; total: number };

export type RollLine = { kind: "info" | "win" | "loss" | "neutral"; text: string };

export type RollResolution = {
  roll: DiceRoll;
  nextTable: CraplessTableState;
  /** Net change to player cash balance (bets already removed from balance in UI). */
  walletDelta: number;
  /** Replace entire bets object (seven-out clears all). */
  nextBets: TableBets;
  lines: RollLine[];
};

export function initialTableState(): CraplessTableState {
  return { phase: "comeOut", point: null, rollsSincePoint: 0 };
}

export function initialBets(): TableBets {
  return { passLine: 0, freeOdds: 0, place: {} };
}

export type Rng = () => number;

export function rollDice(rng: Rng = Math.random): DiceRoll {
  const d1 = 1 + Math.floor(rng() * 6);
  const d2 = 1 + Math.floor(rng() * 6);
  return { d1, d2, total: rollTotal(d1, d2) };
}

function emptyPlace(): TableBets["place"] {
  return {};
}

/**
 * Validates and clamps free odds to pass and table rule.
 */
export function clampFreeOdds(passLine: number, requested: number): number {
  const cap = maxFreeOddsStake(passLine, sevenYearItchTableConfig.maxFreeOddsMultipleOfPass);
  return Math.max(0, Math.min(Math.floor(requested), cap));
}

/**
 * Resolves one roll given current table state and bets **at risk** (money already reserved off-balance in the UI).
 */
export function resolveRoll(
  table: CraplessTableState,
  bets: TableBets,
  roll: DiceRoll,
): RollResolution {
  const { total } = roll;
  const lines: RollLine[] = [];
  let walletDelta = 0;
  let nextTable: CraplessTableState = { ...table };
  let nextBets: TableBets = {
    passLine: bets.passLine,
    freeOdds: bets.freeOdds,
    place: { ...bets.place },
  };

  if (table.phase === "comeOut") {
    if (bets.passLine <= 0) {
      lines.push({ kind: "info", text: "Put something on the pass line before you roll." });
      return { roll, nextTable: table, walletDelta: 0, nextBets: bets, lines };
    }

    if (total === 7) {
      walletDelta += bets.passLine * 2;
      nextBets = { passLine: 0, freeOdds: 0, place: emptyPlace() };
      nextTable = { phase: "comeOut", point: null, rollsSincePoint: 0 };
      lines.push({ kind: "win", text: "Seven on the come-out — pass pays even money. Fresh felt." });
      return { roll, nextTable, walletDelta, nextBets, lines };
    }

    if (!isPointNumber(total)) {
      lines.push({ kind: "info", text: "Impossible total for two dice." });
      return { roll, nextTable: table, walletDelta: 0, nextBets: bets, lines };
    }

    nextTable = { phase: "point", point: total, rollsSincePoint: 0 };
    nextBets = {
      passLine: bets.passLine,
      freeOdds: 0,
      place: { ...bets.place },
    };
    lines.push({
      kind: "neutral",
      text: `The crackdown is on ${total}. Odds and place — if you dare.`,
    });
    return { roll, nextTable, walletDelta, nextBets, lines };
  }

  // point phase
  const pt = table.point;
  if (pt == null) {
    lines.push({ kind: "info", text: "Internal: point phase without a point." });
    return { roll, nextTable: table, walletDelta: 0, nextBets: bets, lines };
  }

  nextTable = { ...table, rollsSincePoint: table.rollsSincePoint + 1 };

  if (total === 7) {
    lines.push({ kind: "loss", text: "Seven — the bust. Everything on the layout is gone." });
    nextBets = { passLine: 0, freeOdds: 0, place: emptyPlace() };
    nextTable = { phase: "comeOut", point: null, rollsSincePoint: 0 };
    return { roll, nextTable, walletDelta: 0, nextBets, lines };
  }

  if (total === pt) {
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
    nextBets = { passLine: 0, freeOdds: 0, place: newPlace };
    nextTable = { phase: "comeOut", point: null, rollsSincePoint: 0 };
    lines.push({ kind: "neutral", text: "Point is made. New come-out — set your pass." });
    return { roll, nextTable, walletDelta, nextBets, lines };
  }

  if (isPointNumber(total)) {
    const pk = total as PointNumber;
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
      lines.push({ kind: "neutral", text: `${total} — business as usual.` });
    }
  }

  return { roll, nextTable, walletDelta, nextBets, lines };
}

/** Cash tied up on the layout (must be <= player balance when adjusting bets). */
export function totalOnLayout(b: TableBets): number {
  let s = b.passLine + b.freeOdds;
  for (const k of Object.keys(b.place) as unknown as PointNumber[]) {
    s += b.place[k] ?? 0;
  }
  return s;
}
