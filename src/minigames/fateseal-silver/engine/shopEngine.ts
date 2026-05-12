import type { FatesealStandardId } from "@/config/minigames/fatesealRules";
import {
  clonePool,
  crossroadsNextOmenAdditionCostCredits,
  fatesealCrossroadsNewShop,
  fatesealCrossroadsOffers,
  fatesealProgressionRules,
} from "@/config/minigames/fatesealRules";
import type { FatesealEngineState } from "./cascadeEngine";

export type CrossroadsChoice = "faustian_bargain" | "silver_vision" | "forbidden_tome";

export type ApplyShopResult =
  | { ok: true; nextState: FatesealEngineState; creditsDelta: number }
  | {
      ok: false;
      reason: "insufficient_credits" | "invalid_pick" | "at_capacity" | "duplicate_symbol";
    };

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

/** Extra prophecy symbol (paid credits). `alreadyPurchasedThisVisit` counts successful buys this Crossroads visit (0 = first price tier). */
export function applyCrossroadsAddOmenSymbol(
  state: FatesealEngineState,
  symbol: FatesealStandardId,
  alreadyPurchasedThisVisit: number,
): ApplyShopResult {
  const maxSyms = 1 + fatesealCrossroadsNewShop.addOmenSymbol.maxPurchasesThisVisit;
  if (state.activeProphecy.length >= maxSyms) {
    return { ok: false, reason: "at_capacity" };
  }
  if (state.activeProphecy.includes(symbol)) {
    return { ok: false, reason: "duplicate_symbol" };
  }
  const cost = crossroadsNextOmenAdditionCostCredits(alreadyPurchasedThisVisit);
  if (!Number.isFinite(cost)) {
    return { ok: false, reason: "at_capacity" };
  }
  if (state.sessionWallet < cost) {
    return { ok: false, reason: "insufficient_credits" };
  }
  return {
    ok: true,
    creditsDelta: -cost,
    nextState: {
      ...state,
      sessionWallet: state.sessionWallet - cost,
      activeProphecy: [...state.activeProphecy, symbol],
    },
  };
}

export function applyCrossroadsWildReel(state: FatesealEngineState): ApplyShopResult {
  const { costCredits, maxActive } = fatesealCrossroadsNewShop.wildReel;
  const spins = fatesealProgressionRules.purchasedReels.wildRitualSpins;
  if (state.wildReelPaidSpinTimers.length >= maxActive) {
    return { ok: false, reason: "at_capacity" };
  }
  if (state.sessionWallet < costCredits) {
    return { ok: false, reason: "insufficient_credits" };
  }
  return {
    ok: true,
    creditsDelta: -costCredits,
    nextState: {
      ...state,
      sessionWallet: state.sessionWallet - costCredits,
      wildReelPaidSpinTimers: [...state.wildReelPaidSpinTimers, spins],
    },
  };
}

/** Grants credits and records a dead-reel slot (column behavior TBD in cascade). */
export function applyCrossroadsDeadReel(state: FatesealEngineState): ApplyShopResult {
  const { grantCreditsOnTake, maxActive } = fatesealCrossroadsNewShop.deadReel;
  const spins = fatesealProgressionRules.purchasedReels.deadRitualSpins;
  if (state.deadReelPaidSpinTimers.length >= maxActive) {
    return { ok: false, reason: "at_capacity" };
  }
  return {
    ok: true,
    creditsDelta: grantCreditsOnTake,
    nextState: {
      ...state,
      sessionWallet: state.sessionWallet + grantCreditsOnTake,
      deadReelPaidSpinTimers: [...state.deadReelPaidSpinTimers, spins],
    },
  };
}

/** Marks one **active** prophecy standard for a cascade payout multiplier when it appears in a prophecy hit. */
export function applyCrossroadsOmenMark(
  state: FatesealEngineState,
  symbol: FatesealStandardId,
): ApplyShopResult {
  const { costCredits, maxActive } = fatesealCrossroadsNewShop.omenMark;
  const markSpins = fatesealProgressionRules.purchasedReels.markedRitualSpins;
  if (maxActive < 1 || state.markedOmenSymbol != null) {
    return { ok: false, reason: "at_capacity" };
  }
  if (!state.activeProphecy.includes(symbol)) {
    return { ok: false, reason: "invalid_pick" };
  }
  if (state.sessionWallet < costCredits) {
    return { ok: false, reason: "insufficient_credits" };
  }
  return {
    ok: true,
    creditsDelta: -costCredits,
    nextState: {
      ...state,
      sessionWallet: state.sessionWallet - costCredits,
      markedOmenSymbol: symbol,
      markedOmenPaidSpinsLeft: markSpins,
    },
  };
}
