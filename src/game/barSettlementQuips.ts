import rawQuips from "../../content/quips.json";
import type { BarRouteState } from "./barRouteState";

/** Outcome buckets for bartender VO lines (see repo `content/quips.json`). */
export type BarSettlementTone = "extreme_loss" | "loss" | "break_even" | "win" | "extreme_win";

const TONES: readonly BarSettlementTone[] = ["extreme_loss", "loss", "break_even", "win", "extreme_win"];

export type ParsedSettlementQuips = Record<BarSettlementTone, readonly string[]>;

const FALLBACK: ParsedSettlementQuips = {
  extreme_loss: ["The ledger kept most of tonight’s tithe—but the stools still owe you sympathy."],
  loss: ["Closer to even than oblivion—that’s adulthood with garnish."],
  break_even: ["Net zero—the rail shook your hand and let you leave with the shirt you wore in."],
  win: ["The club balance crept upward. Don’t make eye contact with hubris ordering another round."],
  extreme_win: ["That printout looks exaggerated. Drink water and verify before bragging sideways."],
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseQuipsJson(raw: unknown): ParsedSettlementQuips {
  if (typeof raw !== "object" || raw === null) throw new Error("quips.json: expected root object");
  const o = raw as Record<string, unknown>;
  const out: ParsedSettlementQuips = { ...FALLBACK };
  for (const tone of TONES) {
    const arr = o[tone];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const lines = arr.filter(isNonEmptyString).map((s) => s.trim());
    if (lines.length === 0) continue;
    out[tone] = lines;
  }
  return out;
}

let cached: ParsedSettlementQuips | undefined;

/** Validated bartender lines (fallback if a bucket fails parse). */
export function getSettlementQuips(): ParsedSettlementQuips {
  if (cached) return cached;
  try {
    cached = parseQuipsJson(rawQuips);
    return cached;
  } catch {
    cached = FALLBACK;
    return cached;
  }
}

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 9973 + 42841) * 43758.5453;
  return x - Math.floor(x);
}

function seedFromLastTable(t: BarRouteState["lastTable"]): number {
  const payload = `${t.gameId}\0${t.buyIn}\0${t.totalReturn}\0${t.tableRound}\0${t.tiers}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function netClubDeltaFromSettlement(lastTable: BarRouteState["lastTable"]): number {
  return Math.round(lastTable.totalReturn - lastTable.buyIn);
}

export function barSettlementTone(lastTable: BarRouteState["lastTable"]): BarSettlementTone {
  const buyIn = Math.max(1, Math.floor(lastTable.buyIn));
  const back = Math.max(0, lastTable.totalReturn);
  const fractionBack = back / buyIn;
  const tiers = Math.max(0, Math.floor(lastTable.tiers));

  if (back <= 0 || fractionBack < 0.22) return "extreme_loss";
  if (fractionBack < 0.92) return "loss";
  /** Exact return of buy-in with no tier stamp — net club delta zero. */
  if (tiers === 0 && Math.round(back - buyIn) === 0) return "break_even";
  if (fractionBack >= 3 || tiers >= 2) return "extreme_win";
  if (fractionBack >= 1 || tiers >= 1) return "win";
  return "loss";
}

export function pickSettlementQuip(tone: BarSettlementTone, lastTable: BarRouteState["lastTable"]): string {
  const lines = getSettlementQuips()[tone];
  if (!lines.length) return FALLBACK[tone][0]!;
  const toneSalt = tone.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const seed = seededUnit(seedFromLastTable(lastTable) + toneSalt * 17);
  const idx = Math.min(lines.length - 1, Math.floor(seed * lines.length));
  return lines[idx]!;
}
