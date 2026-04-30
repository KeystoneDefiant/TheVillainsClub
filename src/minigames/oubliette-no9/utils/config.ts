import { gameConfig, getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

export type GameConfig = typeof gameConfig;
export const config = gameConfig;

// Get current game mode settings
const currentMode = getCurrentGameMode();

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
export function getParallelHandsBundleBaseCost(bundleSize: number, credits: number): number {
  const premium = gameConfig.shopOptions.premium;
  const defaultPrice = currentMode.shop.parallelHandsBundles.basePricePerHand;
  const isPremiumStore = credits >= premium.creditsThreshold;
  const useLargeBundlePrice =
    isPremiumStore &&
    premium.basePricePerHandLargeBundles != null &&
    bundleSize >= 100;
  const pricePerHand = useLargeBundlePrice
    ? premium.basePricePerHandLargeBundles
    : defaultPrice;
  return bundleSize * pricePerHand;
}

// Helper functions for cost calculations
export function calculateWildCardCost(wildCardCount: number): number {
  const baseCost = currentMode.shop.wildCard.baseCost;
  const multiplier = 1 + currentMode.shop.wildCard.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, wildCardCount));
}

export function calculateSingleDeadCardRemovalCost(removalCount: number): number {
  const baseCost = currentMode.shop.singleDeadCardRemoval.baseCost;
  const multiplier = 1 + currentMode.shop.singleDeadCardRemoval.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, removalCount));
}

export function calculateAllDeadCardsRemovalCost(
  removalCount: number,
  deadCardCount: number
): number {
  const singleCardCost = calculateSingleDeadCardRemovalCost(removalCount);
  return singleCardCost * deadCardCount;
}

export function calculateDevilsDealChanceCost(purchaseCount: number): number {
  const baseCost = currentMode.shop.devilsDealChance.baseCost;
  const multiplier = 1 + currentMode.shop.devilsDealChance.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, purchaseCount));
}

export function calculateDevilsDealCostReductionCost(purchaseCount: number): number {
  const baseCost = currentMode.shop.devilsDealCostReduction.baseCost;
  const multiplier = 1 + currentMode.shop.devilsDealCostReduction.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, purchaseCount));
}

export function calculateExtraCardInHandCost(currentCount: number): number {
  const baseCost = currentMode.shop.extraCardInHand.baseCost;
  const multiplier = 1 + currentMode.shop.extraCardInHand.increasePercent / 100;
  return Math.floor(baseCost * Math.pow(multiplier, currentCount));
}

/**
 * Returns the credits needed for the next round.
 * When round % minimumBetIncreaseInterval === 0, the bet increases before that round.
 * Uses prevRoundMinimumBet (minimum bet from the round we just finished) to compute the new minimum.
 */
export function getCreditsNeededForNextRound(
  nextRound: number,
  prevRoundMinimumBet: number,
  currentBetAmount: number,
  selectedHandCount: number,
  handCount: number
): number {
  const interval = currentMode.minimumBetIncreaseInterval;
  const percent = currentMode.minimumBetIncreasePercent;
  const shouldIncrease = nextRound % interval === 0;
  const nextRoundMinimumBet = shouldIncrease
    ? Math.floor(prevRoundMinimumBet * (1 + percent / 100))
    : prevRoundMinimumBet;
  const effectiveBet = Math.max(nextRoundMinimumBet, currentBetAmount);
  const effectiveHandCount = Math.min(selectedHandCount, handCount);
  return effectiveBet * effectiveHandCount;
}

/** Returns the next-round cost from the already-advanced round state. */
export function getCreditsNeededForUpcomingRound(
  nextRoundMinimumBet: number,
  betAmount: number,
  selectedHandCount: number,
  handCount: number
): number {
  const effectiveBet = Math.max(nextRoundMinimumBet, betAmount);
  const effectiveHandCount = Math.min(selectedHandCount, handCount);
  return effectiveBet * effectiveHandCount;
}

/** Returns the displayed round cost for the current bet snapshot and selected hands. */
export function getCreditsNeededForDisplayedRound(
  displayBetAmount: number,
  selectedHandCount: number,
  handCount: number
): number {
  const effectiveHandCount = Math.min(selectedHandCount, handCount);
  return displayBetAmount * effectiveHandCount;
}
