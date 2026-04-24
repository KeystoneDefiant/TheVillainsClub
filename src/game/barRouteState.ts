import type { ClubTableReturnDetail } from "./sessionSettlement";

/** Passed in React Router `location.state` when landing on `/bar` after a table session. */
export type BarRouteState = {
  lastTable: {
    gameId: string;
    buyIn: number;
    totalReturn: number;
    tableRound: number;
    tiers: number;
  };
};

export function isBarRouteState(value: unknown): value is BarRouteState {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const lt = o.lastTable;
  if (!lt || typeof lt !== "object") return false;
  const t = lt as Record<string, unknown>;
  return (
    typeof t.gameId === "string" &&
    typeof t.buyIn === "number" &&
    typeof t.totalReturn === "number" &&
    typeof t.tableRound === "number" &&
    typeof t.tiers === "number"
  );
}

/** Short in-character line after settling (driven only by settlement numbers). */
export function tableReturnTagline(f: BarRouteState["lastTable"]): string {
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
): BarRouteState {
  return {
    lastTable: {
      gameId,
      buyIn,
      totalReturn: detail.totalReturn,
      tableRound: detail.tableRound ?? 0,
      tiers: detail.tiers,
    },
  };
}
