import type { BandsCatalog } from "@/config/bandsCatalog";

/** Start of the current "bar night" in local time: the period [4:00, next day 4:00). */
export function barDayStart(d: Date): Date {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const h = d.getHours();
  const start = new Date(y, m, day, 4, 0, 0, 0);
  if (h < 4) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

/** Stable key for the current bar day (local), aligned to 4:00 boundaries. */
export function barDateKey(d: Date): string {
  const s = barDayStart(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${s.getFullYear()}${pad(s.getMonth() + 1)}${pad(s.getDate())}`;
}

/** Milliseconds from `d` until the next 4:00 bar-day boundary (local). */
export function msUntilNextBarBoundary(d: Date): number {
  const start = barDayStart(d);
  const next = new Date(start);
  next.setDate(next.getDate() + 1);
  return Math.max(1, next.getTime() - d.getTime());
}

export function hashStringToUint32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Exactly one catalog band is active per bar day; index is stable for that key. */
export function activeBandIndexForBarDate(barDateKeyStr: string, catalog: BandsCatalog): number {
  if (catalog.bands.length === 0) return 0;
  return hashStringToUint32(`villains_bar:${barDateKeyStr}`) % catalog.bands.length;
}
