import { GameState, FailureStateType } from '../types';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

export function getMinimumWinPercentForRound(round: number): number | null {
  const mode = getCurrentGameMode();
  const endlessConfig = mode.endlessMode;
  const minWinPct = endlessConfig?.failureConditions.minimumWinPercent;

  if (!endlessConfig || !minWinPct?.enabled || round < endlessConfig.startRound) {
    return null;
  }

  const roundsCompletedInEndless = Math.max(0, round - endlessConfig.startRound);
  return Math.min(
    minWinPct.startPercent + roundsCompletedInEndless * minWinPct.incrementPerRound,
    minWinPct.maxPercent
  );
}

/**
 * Checks all enabled failure conditions and returns the first failing condition
 * This is designed to be extensible - new failure conditions can be added here
 * 
 * @param state - Current game state
 * @returns The type of failure condition that is failing, or null if all conditions pass
 */
export function checkFailureConditions(state: GameState): FailureStateType {
  const mode = getCurrentGameMode();
  const endlessConfig = mode.endlessMode;

  // Only check failure conditions if endless mode is active
  if (!state.isEndlessMode || !endlessConfig) {
    return null;
  }

  const conditions = endlessConfig.failureConditions;
  const lastCompletedRound = state.round - 1;

  // Check minimum bet multiplier condition
  if (conditions.minimumBetMultiplier?.enabled) {
    const requiredBet = Math.ceil(state.baseMinimumBet * conditions.minimumBetMultiplier.value);
    if (state.betAmount < requiredBet) {
      return 'minimum-bet-multiplier';
    }
  }

  // Check minimum credit efficiency condition
  if (conditions.minimumCreditEfficiency?.enabled) {
    const efficiency = state.round > 0 ? state.totalEarnings / state.round : 0;
    if (efficiency < conditions.minimumCreditEfficiency.value) {
      return 'minimum-credit-efficiency';
    }
  }

  // Check minimum winning hands per round condition
  if (
    conditions.minimumWinningHandsPerRound?.enabled &&
    lastCompletedRound >= endlessConfig.startRound
  ) {
    if (state.winningHandsLastRound < conditions.minimumWinningHandsPerRound.value) {
      return 'minimum-winning-hands';
    }
  }

  // Check minimum win percentage (only increments from when endless mode started)
  const requiredPercent = getMinimumWinPercentForRound(lastCompletedRound);
  if (requiredPercent != null) {
    const minRequiredWins = Math.ceil(
      (state.selectedHandCount * requiredPercent) / 100
    );
    if (state.winningHandsLastRound < minRequiredWins) {
      return 'minimum-win-percent';
    }
  }

  // All conditions passed
  return null;
}

/**
 * Gets a human-readable description of a failure state
 * 
 * @param failureState - The failure state type
 * @param state - Current game state (for context)
 * @returns Human-readable description
 */
export function getFailureStateDescription(
  failureState: FailureStateType,
  state: GameState
): string {
  const mode = getCurrentGameMode();
  const endlessConfig = mode.endlessMode;

  if (!failureState || !endlessConfig) {
    return '';
  }

  switch (failureState) {
    case 'minimum-bet-multiplier': {
      const requiredBet = Math.ceil(
        state.baseMinimumBet * endlessConfig.failureConditions.minimumBetMultiplier!.value
      );
      return `Bet must be ≥ ${requiredBet} (${endlessConfig.failureConditions.minimumBetMultiplier!.value}x base)`;
    }
    case 'minimum-credit-efficiency': {
      const efficiency = state.round > 0 ? (state.totalEarnings / state.round).toFixed(1) : '0.0';
      const required = endlessConfig.failureConditions.minimumCreditEfficiency!.value;
      return `Efficiency: ${efficiency}/${required} credits/round`;
    }
    case 'minimum-winning-hands': {
      const required = endlessConfig.failureConditions.minimumWinningHandsPerRound!.value;
      return `Win ≥ ${required} hands/round (last: ${state.winningHandsLastRound})`;
    }
    case 'minimum-win-percent': {
      const requiredPercent =
        getMinimumWinPercentForRound(Math.max(endlessConfig.startRound, state.round - 1)) ?? 0;
      return `You must win at least ${requiredPercent}% of the hands played this round`;
    }
    default:
      return '';
  }
}

/**
 * Gets human-readable descriptions of all enabled end-game conditions.
 * Used to inform the player what they must meet to survive when endless mode is active.
 *
 * @param state - Current game state
 * @returns Array of condition descriptions, or empty if endless mode is not active
 */
export function getEndlessModeConditions(state: GameState): string[] {
  const mode = getCurrentGameMode();
  const endlessConfig = mode.endlessMode;

  if (!state.isEndlessMode || !endlessConfig) {
    return [];
  }

  const conditions = endlessConfig.failureConditions;
  const result: string[] = [];

  if (conditions.minimumBetMultiplier?.enabled) {
    const requiredBet = Math.ceil(state.baseMinimumBet * conditions.minimumBetMultiplier!.value);
    result.push(
      `Bet must be ≥ ${requiredBet} (${conditions.minimumBetMultiplier!.value}x base minimum)`
    );
  }

  if (conditions.minimumCreditEfficiency?.enabled) {
    result.push(
      `Efficiency must be ≥ ${conditions.minimumCreditEfficiency!.value} credits/round`
    );
  }

  if (conditions.minimumWinningHandsPerRound?.enabled) {
    result.push(
      `Win ≥ ${conditions.minimumWinningHandsPerRound!.value} hands per round`
    );
  }

  if (conditions.minimumWinPercent?.enabled) {
    const requiredPercent = getMinimumWinPercentForRound(state.round);
    if (requiredPercent != null) {
      result.push(`Win at least ${requiredPercent}% of hands this round`);
    }
  }

  return result;
}
