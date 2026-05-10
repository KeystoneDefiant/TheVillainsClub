import { gameConfig, getCurrentGameMode, type GameModeConfig } from "@/config/minigames/oublietteNo9GameRules";

export type GameConfig = typeof gameConfig;
export const config = gameConfig;

/**
 * Returns the cost multiplier for shop items when in premium store (credits >= threshold).
 * Returns 1 when below threshold.
 */
export function getShopCostMultiplier(credits: number): number {
  const premium = gameConfig.shopOptions.premium;
  if (credits < premium.creditsThreshold) return 1;
  return 1 + (premium.costPercentIncrease ?? 0) / 100;
}

/** Applies premium store cost multiplier when applicable. Use for all purchasable shop items. */
export function applyShopCostMultiplier(baseCost: number, credits: number): number {
  return Math.floor(baseCost * getShopCostMultiplier(credits));
}

/**
 * Returns the base cost for a parallel hands bundle (before premium multiplier).
 * Premium store uses higher base price for 100+ hand bundles.
 */
export function getParallelHandsBundleBaseCost(
  bundleSize: number,
  credits: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const premium = gameConfig.shopOptions.premium;
  const defaultPrice = mode.shop.parallelHandsBundles.basePricePerHand;
  const isPremiumStore = credits >= premium.creditsThreshold;
  const useLargeBundlePrice =
    isPremiumStore && premium.basePricePerHandLargeBundles != null && bundleSize >= 100;
  const pricePerHand = useLargeBundlePrice ? premium.basePricePerHandLargeBundles : defaultPrice;
  return bundleSize * pricePerHand;
}

export function calculateWildCardCost(wildCardCount: number, mode: GameModeConfig = getCurrentGameMode()): number {
  const baseCost = mode.shop.wildCard.baseCost;
  const multiplier = 1 + mode.shop.wildCard.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, wildCardCount));
}

export function calculateSingleDeadCardRemovalCost(
  removalCount: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const baseCost = mode.shop.singleDeadCardRemoval.baseCost;
  const multiplier = 1 + mode.shop.singleDeadCardRemoval.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, removalCount));
}

export function calculateAllDeadCardsRemovalCost(
  removalCount: number,
  deadCardCount: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const singleCardCost = calculateSingleDeadCardRemovalCost(removalCount, mode);
  return singleCardCost * deadCardCount;
}

export function calculateDevilsDealChanceCost(
  purchaseCount: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const baseCost = mode.shop.devilsDealChance.baseCost;
  const multiplier = 1 + mode.shop.devilsDealChance.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, purchaseCount));
}

export function calculateDevilsDealCostReductionCost(
  purchaseCount: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const baseCost = mode.shop.devilsDealCostReduction.baseCost;
  const multiplier = 1 + mode.shop.devilsDealCostReduction.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, purchaseCount));
}

export function calculateExtraCardInHandCost(
  currentCount: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const baseCost = mode.shop.extraCardInHand.baseCost;
  const multiplier = 1 + mode.shop.extraCardInHand.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, currentCount));
}

export function getCreditsNeededForNextRound(
  nextRound: number,
  prevRoundMinimumBet: number,
  currentBetAmount: number,
  selectedHandCount: number,
  handCount: number,
  mode: GameModeConfig = getCurrentGameMode(),
): number {
  const interval = mode.minimumBetIncreaseInterval;
  const percent = mode.minimumBetIncreasePercent;
  const shouldIncrease = nextRound % interval === 0;
  const nextRoundMinimumBet = shouldIncrease
    ? Math.floor(prevRoundMinimumBet * (1 + percent / 100))
    : prevRoundMinimumBet;
  const effectiveBet = Math.max(nextRoundMinimumBet, currentBetAmount);
  const effectiveHandCount = Math.min(selectedHandCount, handCount);
  return effectiveBet * effectiveHandCount;
}

export function getCreditsNeededForUpcomingRound(
  nextRoundMinimumBet: number,
  betAmount: number,
  selectedHandCount: number,
  handCount: number,
): number {
  const effectiveBet = Math.max(nextRoundMinimumBet, betAmount);
  const effectiveHandCount = Math.min(selectedHandCount, handCount);
  return effectiveBet * effectiveHandCount;
}

export function getCreditsNeededForDisplayedRound(
  displayBetAmount: number,
  selectedHandCount: number,
  handCount: number,
): number {
  const effectiveHandCount = Math.min(selectedHandCount, handCount);
  return displayBetAmount * effectiveHandCount;
}
