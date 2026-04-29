import specialsCatalog from "../../content/specials.json";

export type ClubSpecialModifier =
  | { type: "payout_mult"; value: number }
  | { type: "first_buy_in_credit"; value: number }
  | { type: string; value?: unknown };

export type SpecialDefinitionRow = {
  title: string;
  modifier: ClubSpecialModifier;
  /** Optional: shell can comp the first buy-in of a bar day. Runtime tracking is save-system work. */
  first_buy_in_credit?: number;
  /** Optional: scales max **return** cap for Oubliette only (multiplicative, e.g. 1.1). */
  oubliette_cap_mult?: number;
  /** Optional: scales max **return** cap for 7 Year Itch only (multiplicative). */
  seven_year_itch_cap_mult?: number;
  /** Optional: scales max **return** cap for all minigames (multiplicative). */
  all_minigames_cap_mult?: number;
};

export type ResolvedClubSpecial = {
  id: string;
  title: string;
  modifier: ClubSpecialModifier;
};

function cycleIdForDate(d: Date): string {
  const list = specialsCatalog.fallback_cycle;
  if (list.length === 0) return "quiet_night";
  const t0 = Date.UTC(2026, 0, 1);
  const day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - t0) / 86400000);
  return list[((day % list.length) + list.length) % list.length]!;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Active daily special (payout / cap hooks resolve from the definition row). */
export function resolveActiveClubSpecial(now: Date = new Date()): ResolvedClubSpecial | null {
  const key = dateKey(now);
  const byDate = specialsCatalog.by_date as Record<string, string>;
  const id = byDate[key] ?? cycleIdForDate(now);
  const def = specialsCatalog.definitions as Record<string, SpecialDefinitionRow>;
  const row = def[id];
  if (!row) return null;
  return { id, title: row.title, modifier: row.modifier };
}

export function resolveSpecialDefinitionRow(special: ResolvedClubSpecial | null): SpecialDefinitionRow | null {
  if (!special) return null;
  const def = specialsCatalog.definitions as Record<string, SpecialDefinitionRow>;
  return def[special.id] ?? null;
}

/** Multiplier from `payout_mult` (hand payouts inside minigames — separate from cap). */
export function payoutModifierFromSpecial(special: ResolvedClubSpecial | null): number {
  if (!special || special.modifier.type !== "payout_mult") return 1;
  const v = special.modifier.value;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 1;
}

export function firstBuyInCreditFromSpecial(special: ResolvedClubSpecial | null): number {
  if (!special || special.modifier.type !== "first_buy_in_credit") return 0;
  const v = special.modifier.value;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}

export function capModifiersFromSpecialDefinition(row: SpecialDefinitionRow | null): {
  oublietteCapMult: number;
  sevenYearItchCapMult: number;
  allMinigamesCapMult: number;
} {
  const oub = row?.oubliette_cap_mult;
  const syi = row?.seven_year_itch_cap_mult;
  const all = row?.all_minigames_cap_mult;
  return {
    oublietteCapMult: typeof oub === "number" && Number.isFinite(oub) && oub > 0 ? oub : 1,
    sevenYearItchCapMult: typeof syi === "number" && Number.isFinite(syi) && syi > 0 ? syi : 1,
    allMinigamesCapMult: typeof all === "number" && Number.isFinite(all) && all > 0 ? all : 1,
  };
}
