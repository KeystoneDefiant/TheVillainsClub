import type { FatesealStandardId } from "@/config/minigames/fatesealRules";
import {
  fatesealUnsettleSpiritsConfig,
  fatesealFaustianBargainConfig,
  fatesealVassagoGambitConfig,
  crossroadsNextOmenAdditionCostCredits,
} from "@/config/minigames/fatesealRules";
import type { FatesealEngineState } from "./cascadeEngine";

export type ApplyShopResult =
  | { ok: true; nextState: FatesealEngineState; creditsDelta: number }
  | {
      ok: false;
      reason: "insufficient_credits" | "invalid_pick" | "at_capacity" | "duplicate_symbol";
    };

/** Purchase random extra prophecy symbol */
export function applyCrossroadsAddOmenSymbol(
  state: FatesealEngineState,
  symbol: FatesealStandardId,
): ApplyShopResult {
  const maxSyms = 4;
  if (state.activeProphecy.length >= maxSyms) {
    return { ok: false, reason: "at_capacity" };
  }
  if (state.activeProphecy.includes(symbol)) {
    return { ok: false, reason: "duplicate_symbol" };
  }
  const alreadyPurchasedCount = state.purchasedExtraProphecies?.length ?? 0;
  const cost = crossroadsNextOmenAdditionCostCredits(alreadyPurchasedCount);
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
      purchasedExtraProphecies: [...(state.purchasedExtraProphecies ?? []), symbol],
    },
  };
}

/** "Unsettle the Spirits" (Wild Reel) Cost */
export function unsettleSpiritsCost(bank: number): number {
  return Math.max(
    fatesealUnsettleSpiritsConfig.minPrice,
    Math.floor(bank * fatesealUnsettleSpiritsConfig.costRatioOfBank),
  );
}

/** Activate "Unsettle the Spirits" */
export function applyCrossroadsUnsettleSpirits(state: FatesealEngineState): ApplyShopResult {
  const cost = unsettleSpiritsCost(state.sessionWallet);
  const spins = fatesealUnsettleSpiritsConfig.durationSpins;
  if (state.wildReelPaidSpinTimers.length >= 1) {
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
      wildReelPaidSpinTimers: [spins],
    },
  };
}

/** "Faustian Bargain" (Dead Reel) Grant */
export function faustianBargainGrant(buyIn: number): number {
  return Math.max(0, Math.floor(buyIn * fatesealFaustianBargainConfig.creditRatioOfBuyIn));
}

/** Accept "Faustian Bargain" level */
export function applyCrossroadsFaustianBargain(state: FatesealEngineState): ApplyShopResult {
  const grant = faustianBargainGrant(state.buyIn);
  const spins = fatesealFaustianBargainConfig.durationSpinsPerLevel;
  const maxActive = fatesealFaustianBargainConfig.maxLevel;
  if (state.deadReelPaidSpinTimers.length >= maxActive) {
    return { ok: false, reason: "at_capacity" };
  }
  return {
    ok: true,
    creditsDelta: grant,
    nextState: {
      ...state,
      sessionWallet: state.sessionWallet + grant,
      deadReelPaidSpinTimers: [...state.deadReelPaidSpinTimers, spins],
    },
  };
}

/** "Vassago's Gambit" Cost */
export function vassagoGambitCost(bank: number): number {
  return Math.max(
    fatesealVassagoGambitConfig.minPrice,
    Math.floor(bank * fatesealVassagoGambitConfig.costRatioOfBank),
  );
}

/** Activate "Vassago's Gambit" */
export function applyCrossroadsVassagoGambit(state: FatesealEngineState): ApplyShopResult {
  if (state.vassagoActive) {
    return { ok: false, reason: "at_capacity" };
  }
  const cost = vassagoGambitCost(state.sessionWallet);
  if (state.sessionWallet < cost) {
    return { ok: false, reason: "insufficient_credits" };
  }
  return {
    ok: true,
    creditsDelta: -cost,
    nextState: {
      ...state,
      sessionWallet: state.sessionWallet - cost,
      vassagoActive: true,
    },
  };
}
