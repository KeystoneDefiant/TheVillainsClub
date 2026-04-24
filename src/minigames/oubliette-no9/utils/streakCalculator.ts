import { gameConfig } from '@/config/minigames/oublietteNo9GameRules';
import { Hand, RewardTable } from '../types';
import { PokerEvaluator } from './pokerEvaluator';

export interface StreakMultiplierConfig {
  enabled: boolean;
  baseThreshold: number;
  thresholdIncrement: number;
  exponentialGrowth: number;
  baseMultiplier: number;
  multiplierIncrement: number;
}

export interface RoundRankSummary {
  rank: string;
  totalPayout: number;
  count: number;
}

export interface RoundComboSummary {
  comboProgression: number[];
  handsPlayed: number;
  handsWon: number;
  highestCombo: number;
  highestMultiplier: number;
  rankData: RoundRankSummary[];
  streakMultipliers: number[];
  totalPayout: number;
  winPercent: number;
}

/**
 * Calculate the threshold for reaching a specific tier with exponential growth
 * 
 * Formula for exponential growth:
 * - Tier 0 threshold: baseThreshold
 * - Tier N threshold: baseThreshold + sum of (thresholdIncrement * exponentialGrowth^i) for i=0 to N-1
 * 
 * For example, with baseThreshold=5, thresholdIncrement=5, exponentialGrowth=1.3:
 * - Tier 0: 5 (needs 5 wins)
 * - Tier 1: 5 + 5 = 10 (needs 5 more wins)
 * - Tier 2: 10 + 6.5 = 16.5 ≈ 17 (needs 7 more wins)
 * - Tier 3: 17 + 8.45 = 25.45 ≈ 26 (needs 9 more wins)
 * - Tier 4: 26 + 10.985 = 36.985 ≈ 37 (needs 11 more wins)
 * 
 * @param tier - The tier level (0-based)
 * @param config - Streak multiplier configuration
 * @returns The minimum streak count needed to reach this tier
 */
function calculateTierThreshold(tier: number, config: StreakMultiplierConfig): number {
  if (tier === 0) {
    return config.baseThreshold;
  }
  
  let threshold = config.baseThreshold;
  for (let i = 0; i < tier; i++) {
    const increment = config.thresholdIncrement * Math.pow(config.exponentialGrowth, i);
    threshold += increment;
  }
  
  return Math.ceil(threshold);
}

/**
 * Calculate which tier a given streak count falls into with exponential growth
 * 
 * @param streakCount - Current streak count
 * @param config - Streak multiplier configuration
 * @returns The tier level (0-based), or -1 if below base threshold
 */
function calculateTierFromStreak(streakCount: number, config: StreakMultiplierConfig): number {
  if (streakCount < config.baseThreshold) {
    return -1;
  }
  
  // Find the tier by checking thresholds
  let tier = 0;
  const maxTier = 100; // Safety limit to prevent infinite loop
  while (tier < maxTier) {
    const nextTierThreshold = calculateTierThreshold(tier + 1, config);
    if (streakCount < nextTierThreshold) {
      return tier;
    }
    tier++;
  }
  
  return tier;
}

/**
 * Calculate the streak multiplier based on current streak count
 * 
 * Uses exponential growth to determine tier level instead of flat increments.
 * Formula: baseMultiplier + (tierLevel * multiplierIncrement)
 * 
 * With exponential growth, each tier requires more wins than the previous tier.
 * 
 * @param streakCount - Current streak count
 * @param config - Streak multiplier configuration
 * @returns Multiplier value (1.0 if below threshold, or calculated tier multiplier)
 * 
 * @example
 * // With baseThreshold=5, thresholdIncrement=5, exponentialGrowth=1.3,
 * // baseMultiplier=1.5, multiplierIncrement=0.5:
 * calculateStreakMultiplier(0, config)  // 1.0 (below threshold)
 * calculateStreakMultiplier(4, config)  // 1.0 (below threshold)
 * calculateStreakMultiplier(5, config)  // 1.5 (tier 0: needs 5 total)
 * calculateStreakMultiplier(10, config) // 2.0 (tier 1: needs 10 total)
 * calculateStreakMultiplier(17, config) // 2.5 (tier 2: needs 17 total)
 * calculateStreakMultiplier(26, config) // 3.0 (tier 3: needs 26 total)
 */
export function calculateStreakMultiplier(
  streakCount: number,
  config: StreakMultiplierConfig = gameConfig.streakMultiplier
): number {
  if (!config.enabled || streakCount < config.baseThreshold) {
    return 1.0;
  }
  
  // Calculate which tier we're in using exponential growth
  const tierLevel = calculateTierFromStreak(streakCount, config);
  
  if (tierLevel < 0) {
    return 1.0;
  }
  
  return config.baseMultiplier + (tierLevel * config.multiplierIncrement);
}

/**
 * Get the next threshold milestone for the progress bar
 * 
 * With exponential growth, each threshold is calculated based on the tier.
 * 
 * @param currentStreak - Current streak count
 * @param config - Streak multiplier configuration
 * @returns Next threshold value
 * 
 * @example
 * // With exponential growth factor 1.3:
 * getNextThreshold(0, config)  // 5 (tier 0)
 * getNextThreshold(4, config)  // 5 (tier 0)
 * getNextThreshold(5, config)  // 10 (tier 1)
 * getNextThreshold(12, config) // 17 (tier 2)
 * getNextThreshold(20, config) // 26 (tier 3)
 */
export function getNextThreshold(
  currentStreak: number,
  config: StreakMultiplierConfig = gameConfig.streakMultiplier
): number {
  if (!config.enabled) {
    return config.baseThreshold;
  }

  // If below base threshold, next is base threshold
  if (currentStreak < config.baseThreshold) {
    return config.baseThreshold;
  }

  // Find current tier and return next tier's threshold
  const currentTier = calculateTierFromStreak(currentStreak, config);
  return calculateTierThreshold(currentTier + 1, config);
}

/**
 * Get progress percentage towards next threshold
 * 
 * @param currentStreak - Current streak count
 * @param config - Streak multiplier configuration
 * @returns Progress percentage (0-100)
 */
export function getStreakProgress(
  currentStreak: number,
  config: StreakMultiplierConfig = gameConfig.streakMultiplier
): number {
  const nextThreshold = getNextThreshold(currentStreak, config);
  
  if (currentStreak < config.baseThreshold) {
    // Progress towards first threshold
    return (currentStreak / config.baseThreshold) * 100;
  }
  
  // Progress within current tier - calculate the previous threshold
  const currentTier = calculateTierFromStreak(currentStreak, config);
  const previousThreshold = calculateTierThreshold(currentTier, config);
  const progressInTier = currentStreak - previousThreshold;
  const tierRange = nextThreshold - previousThreshold;
  
  return (progressInTier / tierRange) * 100;
}

export function summarizeRoundCombos(
  parallelHands: Hand[],
  rewardTable: RewardTable,
  betAmount: number,
  initialStreak = 0,
  config: StreakMultiplierConfig = gameConfig.streakMultiplier
): RoundComboSummary {
  const rankMap = new Map<string, RoundRankSummary>();
  const streakMultipliers: number[] = [];
  const comboProgression: number[] = [];
  const payouts: number[] = [];
  let handsWon = 0;
  let highestCombo = initialStreak;
  let highestMultiplier = calculateStreakMultiplier(initialStreak, config);
  let streak = initialStreak;

  for (let index = 0; index < parallelHands.length; index += 1) {
    const hand = parallelHands[index];
    const result = PokerEvaluator.evaluate(hand.cards);
    const withRewards = PokerEvaluator.applyRewards(result, rewardTable);
    const streakMultiplier = calculateStreakMultiplier(streak, config);
    const handPayout = Math.round(betAmount * withRewards.multiplier * streakMultiplier);

    streakMultipliers.push(streakMultiplier);
    payouts.push(handPayout);

    if (handPayout > 0) {
      handsWon += 1;
    }

    const existing = rankMap.get(result.rank);
    if (existing) {
      existing.totalPayout += handPayout;
      existing.count += 1;
    } else {
      rankMap.set(result.rank, {
        rank: result.rank,
        totalPayout: handPayout,
        count: 1,
      });
    }

    streak = withRewards.multiplier > 0 ? streak + 1 : Math.max(0, streak - 1);
    comboProgression.push(streak);
    highestCombo = Math.max(highestCombo, streak);
    highestMultiplier = Math.max(highestMultiplier, streakMultiplier);
  }

  const handsPlayed = parallelHands.length;

  return {
    comboProgression,
    handsPlayed,
    handsWon,
    highestCombo,
    highestMultiplier,
    rankData: Array.from(rankMap.values()),
    streakMultipliers,
    totalPayout: payouts.reduce((sum, payout) => sum + payout, 0),
    winPercent: handsPlayed > 0 ? (handsWon / handsPlayed) * 100 : 0,
  };
}
