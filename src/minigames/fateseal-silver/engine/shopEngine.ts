import type { FatesealStandardId } from "@/config/minigames/fatesealRules";
import { clonePool, fatesealCrossroadsOffers } from "@/config/minigames/fatesealRules";
import type { FatesealEngineState } from "./cascadeEngine";

export type CrossroadsChoice = "faustian_bargain" | "silver_vision" | "forbidden_tome";

export type ApplyShopResult =
  | { ok: true; nextState: FatesealEngineState; creditsDelta: number }
  | { ok: false; reason: "insufficient_credits" | "invalid_pick" };

export function applyCrossroads(
  state: FatesealEngineState,
  choice: CrossroadsChoice,
  silverPick: FatesealStandardId | null,
  buyIn: number,
): ApplyShopResult {
  const pool = clonePool(state.symbolPool);
  let wallet = state.sessionWallet;
  let silverTarget = state.silverVisionTarget;
  let tomeSpins = state.tomeSpinsLeft;

  if (choice === "faustian_bargain") {
    const grant = Math.max(0, Math.floor(buyIn * fatesealCrossroadsOffers.faustianBargain.creditRatioOfBuyIn));
    for (let i = 0; i < fatesealCrossroadsOffers.faustianBargain.voidsAdded; i++) {
      pool.push({ symbol: "void", weight: 8 });
    }
    wallet += grant;
    return {
      ok: true,
      creditsDelta: grant,
      nextState: {
        ...state,
        symbolPool: pool,
        sessionWallet: wallet,
      },
    };
  }

  if (choice === "silver_vision") {
    if (!silverPick) return { ok: false, reason: "invalid_pick" };
    const cost = Math.max(0, Math.floor(buyIn * fatesealCrossroadsOffers.silverVision.costRatioOfBuyIn));
    if (wallet < cost) return { ok: false, reason: "insufficient_credits" };
    silverTarget = silverPick;
    wallet -= cost;
    for (const e of pool) {
      if (e.symbol === silverPick) e.symbol = "wild";
    }
    return {
      ok: true,
      creditsDelta: -cost,
      nextState: {
        ...state,
        symbolPool: pool,
        sessionWallet: wallet,
        silverVisionTarget: silverTarget,
      },
    };
  }

  const cost = Math.max(0, Math.floor(buyIn * fatesealCrossroadsOffers.forbiddenTome.costRatioOfBuyIn));
  if (wallet < cost) return { ok: false, reason: "insufficient_credits" };
  wallet -= cost;
  tomeSpins = fatesealCrossroadsOffers.forbiddenTome.boostedSpins;
  return {
    ok: true,
    creditsDelta: -cost,
    nextState: {
      ...state,
      sessionWallet: wallet,
      tomeSpinsLeft: tomeSpins,
    },
  };
}

export function faustianCreditGrant(buyIn: number): number {
  return Math.max(0, Math.floor(buyIn * fatesealCrossroadsOffers.faustianBargain.creditRatioOfBuyIn));
}

export function silverVisionCost(buyIn: number): number {
  return Math.max(0, Math.floor(buyIn * fatesealCrossroadsOffers.silverVision.costRatioOfBuyIn));
}

export function tomeCost(buyIn: number): number {
  return Math.max(0, Math.floor(buyIn * fatesealCrossroadsOffers.forbiddenTome.costRatioOfBuyIn));
}
