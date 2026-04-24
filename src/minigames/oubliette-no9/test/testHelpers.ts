/**
 * Shared test helpers for Pokerthing tests.
 * Uses getCurrentGameMode() for config-derived values to keep tests in sync with game config.
 */
import { GameState, Card, Hand } from '../types';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

const mode = getCurrentGameMode();

/** Returns the reward table from the current game mode config. */
export function getTestRewardTable(): Record<string, number> {
  return { ...mode.rewards };
}

export const testFailureConfig = {
  betMultiplier: mode.endlessMode?.failureConditions.minimumBetMultiplier?.value ?? 2.0,
  minEfficiency: mode.endlessMode?.failureConditions.minimumCreditEfficiency?.value ?? 100,
  minWinningHands: mode.endlessMode?.failureConditions.minimumWinningHandsPerRound?.value ?? 20,
};

/** Creates a minimal game state with config-derived defaults. Override with partial. */
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  const baseState: GameState = {
    screen: 'game',
    gamePhase: 'preDraw',
    isGeneratingHands: false,
    playerHand: [],
    heldIndices: [],
    parallelHands: [],
    handCount: mode.startingHandCount,
    rewardTable: getTestRewardTable(),
    credits: mode.startingCredits,
    currentRun: 1,
    additionalHandsBought: 0,
    betAmount: mode.startingBet,
    selectedHandCount: mode.startingHandCount,
    minimumBet: mode.startingBet,
    baseMinimumBet: mode.startingBet,
    round: 1,
    totalEarnings: 0,
    deckModifications: {
      deadCards: [],
      wildCards: [],
      removedCards: [],
      deadCardRemovalCount: 0,
    },
    extraDrawPurchased: false,
    maxDraws: 1,
    drawsCompletedThisRound: 0,
    wildCardCount: 0,
    gameOver: false,
    gameOverReason: null,
    showShopNextRound: false,
    selectedShopOptions: [],
    creditsAtShopOpen: null,
    prevRoundMinimumBet: null,
    shopDisplayBetAmount: null,
    isEndlessMode: false,
    currentFailureState: null,
    winningHandsLastRound: 0,
    devilsDealCard: null,
    devilsDealCost: 0,
    devilsDealHeld: false,
    devilsDealChancePurchases: 0,
    devilsDealCostReductionPurchases: 0,
    extraCardsInHand: 0,
    streakCounter: 0,
    currentStreakMultiplier: 1.0,
    runHighestCombo: 0,
    runHighestMultiplier: 1.0,
    animationSpeedMode: 1,
    cardTheme: 'dark',
  };

  return { ...baseState, ...overrides };
}

/** Creates a card for tests. */
export function createTestCard(
  rank: Card['rank'],
  suit: Card['suit'],
  options?: Partial<Card>
): Card {
  return {
    rank,
    suit,
    id: `${rank}-${suit}-${Math.random()}`,
    ...options,
  };
}

/** Creates a hand for tests. */
export function createTestHand(cards: Card[], id?: string): Hand {
  return {
    cards,
    id: id || `hand-${Math.random()}`,
  };
}
