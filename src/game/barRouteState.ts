import {
  getOublietteBaseReturnCeiling,
  type ClubTableReturnDetail,
  type OublietteSettlementProfile,
  type StatEntry,
} from "./sessionSettlement";

/** Passed in React Router `location.state` when landing on `/bar` after a table session. */
export type BarRouteState = {
  lastTable: {
    gameId: string;
    buyIn: number;
    totalReturn: number;
    tableRound: number;
    tiers: number;
    /**
     * Base return ceiling at table open (buy-in × cap multiples), before overachievement tiers.
     * Used for extreme-win quip gating. Omitted on legacy saved router state.
     */
    maxWinCredits?: number;
    /**
     * Short human-readable sentence explaining why the session ended.
     * Shown prominently on the settlement panel below the game title.
     */
    endReason?: string;
    /** Ordered statistics shown in the scrolling ticker on the settlement panel. */
    stats?: ReadonlyArray<StatEntry>;
  };
};

export function isBarRouteState(value: unknown): value is BarRouteState {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const lt = o.lastTable;
  if (!lt || typeof lt !== "object") return false;
  const t = lt as Record<string, unknown>;
  const base =
    typeof t.gameId === "string" &&
    typeof t.buyIn === "number" &&
    typeof t.totalReturn === "number" &&
    typeof t.tableRound === "number" &&
    typeof t.tiers === "number";
  if (!base) return false;
  if (t.maxWinCredits !== undefined && !(typeof t.maxWinCredits === "number" && Number.isFinite(t.maxWinCredits))) return false;
  if (t.endReason !== undefined && typeof t.endReason !== "string") return false;
  if (t.stats !== undefined) {
    if (!Array.isArray(t.stats)) return false;
    for (const s of t.stats as unknown[]) {
      if (!s || typeof s !== "object") return false;
      const e = s as Record<string, unknown>;
      if (typeof e.label !== "string") return false;
      if (typeof e.value !== "string" && typeof e.value !== "number") return false;
    }
  }
  return true;
}

/** Short in-character line after settling (driven only by settlement numbers). */
export function tableReturnTagline(f: BarRouteState["lastTable"]): string {
  if (f.gameId === "seven_year_itch") {
    if (f.tableRound >= 24) {
      return "That many rolls? The syndicate will tell stories about you.";
    }
    if (f.totalReturn === 0) {
      return "The feds took the layout. Your club tab still breathes.";
    }
    if (f.totalReturn >= f.buyIn * 8) {
      return "The rye was worth it — walk before the heat comes back.";
    }
    if (f.tiers > 0) {
      return "The house cut a check through clenched teeth. Enjoy the tiers.";
    }
    return "Back from the felt — club balance squared.";
  }
  if (f.gameId === "fateseal_silver") {
    if (f.totalReturn === 0) {
      return "The seal stayed shut — the void kept your stake and yawned.";
    }
    if (f.tableRound >= 18) {
      return "That many rituals? The Crossroads will remember your name.";
    }
    if (f.tiers > 0) {
      return "The house pays through gritted teeth on those tiers — burn silver before dawn.";
    }
    if (f.totalReturn >= f.buyIn * 6) {
      return "The ledger closed in your favor. Don’t tempt the next eclipse.";
    }
    return "The bar takes your tithe — club balance squared.";
  }
  if (f.tableRound >= 30) {
    return "You went deep. The bar will pretend it never saw the math.";
  }
  if (f.tiers > 0) {
    return "The house pays—grudgingly—on those tiers. Don't make eye contact with pit.";
  }
  if (f.totalReturn >= f.buyIn * 10) {
    return "Not a bad pull. Buy yourself something illicit from the tuck shop.";
  }
  if (f.totalReturn === 0) {
    return "Rest the deck. We'll still call your tab.";
  }
  return "Welcome back to the rail—your club balance is squared.";
}

export function buildBarRouteStateFromReturn(
  gameId: string,
  buyIn: number,
  detail: ClubTableReturnDetail,
  settlement: OublietteSettlementProfile,
): BarRouteState {
  const maxWinCredits = getOublietteBaseReturnCeiling(settlement);
  const totalReturn = Math.min(detail.totalReturn, maxWinCredits);

  // Build default stats from the always-available detail fields.
  // Games may supply their own richer stats array; if they do, those are used
  // as-is and we only append defaults for entries not already present.
  const defaultStats: StatEntry[] = [];
  if (detail.tableRound != null && detail.tableRound > 0) {
    defaultStats.push({ label: "Rounds", value: detail.tableRound });
  }
  if (detail.tiers > 0) {
    defaultStats.push({ label: "Tiers", value: detail.tiers });
  }
  if (detail.uncappedCredits > 0) {
    defaultStats.push({ label: "Credits earned", value: detail.uncappedCredits.toLocaleString() });
  }
  if (detail.basePayout > 0) {
    defaultStats.push({ label: "Base payout", value: detail.basePayout.toLocaleString() });
  }
  if (detail.overachievementBonus > 0) {
    defaultStats.push({ label: "Overachievement bonus", value: `+${detail.overachievementBonus.toLocaleString()}` });
  }

  const gameStats: ReadonlyArray<StatEntry> = detail.stats ?? defaultStats;

  return {
    lastTable: {
      gameId,
      buyIn,
      totalReturn,
      tableRound: detail.tableRound ?? 0,
      tiers: detail.tiers,
      maxWinCredits,
      ...(detail.endReason !== undefined ? { endReason: detail.endReason } : {}),
      ...(gameStats.length > 0 ? { stats: gameStats } : {}),
    },
  };
}
