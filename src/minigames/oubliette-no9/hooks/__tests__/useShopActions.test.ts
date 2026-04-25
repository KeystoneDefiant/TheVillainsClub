import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShopActions } from '../useShopActions';
import { GameState } from '../../types';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

const mode = getCurrentGameMode();

vi.mock('../useThemeAudio', () => ({
  useThemeAudio: () => ({ playSound: vi.fn() }),
}));

function createMockState(overrides: Partial<GameState> = {}): GameState {
  const mode = getCurrentGameMode();
  return {
    screen: 'shop',
    gamePhase: 'preDraw',
    isGeneratingHands: false,
    playerHand: [],
    heldIndices: [],
    parallelHands: [],
    handCount: mode.startingHandCount,
    rewardTable: mode.rewards,
    credits: mode.startingCredits,
    currentRun: 0,
    additionalHandsBought: 0,
    betAmount: mode.startingBet,
    selectedHandCount: mode.startingHandCount,
    minimumBet: mode.startingBet,
    baseMinimumBet: mode.startingBet,
    round: 1,
    totalEarnings: 0,
    deckModifications: { deadCards: [], wildCards: [], removedCards: [], deadCardRemovalCount: 0 },
    extraDrawPurchased: false,
    maxDraws: 1,
    drawsCompletedThisRound: 0,
    wildCardCount: 0,
    gameOver: false,
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
    animationSpeedMode: 1,
    cardTheme: 'dark',
    ...overrides,
  } as GameState;
}

describe('useShopActions', () => {
  let setState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setState = vi.fn();
  });

  it('should return all shop action functions', () => {
    const state = createMockState();
    const { result } = renderHook(() => useShopActions(state, setState));

    expect(result.current.addDeadCard).toBeTypeOf('function');
    expect(result.current.removeSingleDeadCard).toBeTypeOf('function');
    expect(result.current.removeAllDeadCards).toBeTypeOf('function');
    expect(result.current.addWildCard).toBeTypeOf('function');
    expect(result.current.purchaseExtraDraw).toBeTypeOf('function');
    expect(result.current.addParallelHandsBundle).toBeTypeOf('function');
  });

  it('should add dead card and credit reward when addDeadCard is called', () => {
    const state = createMockState({ credits: mode.startingCredits });
    const { result } = renderHook(() => useShopActions(state, setState));

    act(() => {
      result.current.addDeadCard();
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState.deckModifications.deadCards.length).toBe(1);
    expect(nextState.credits).toBeGreaterThan(state.credits);
  });

  it('should add wild card when addWildCard is called with sufficient credits', () => {
    const state = createMockState({
      credits: mode.shop.wildCard.baseCost * 2,
      wildCardCount: 0,
    });
    const { result } = renderHook(() => useShopActions(state, setState));

    act(() => {
      result.current.addWildCard();
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState.wildCardCount).toBe(1);
    expect(nextState.deckModifications.wildCards.length).toBe(1);
  });

  it('should not add wild card when at max count', () => {
    const maxCount = mode.shop?.wildCard?.maxCount ?? 3;
    const state = createMockState({
      credits: mode.shop.wildCard.baseCost * 20,
      wildCardCount: maxCount,
    });
    const { result } = renderHook(() => useShopActions(state, setState));

    act(() => {
      result.current.addWildCard();
    });

    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState).toBe(state);
  });

  it('should add parallel hands bundle when addParallelHandsBundle is called', () => {
    const state = createMockState({ credits: mode.startingCredits * 2, handCount: 10 });
    const { result } = renderHook(() => useShopActions(state, setState));

    act(() => {
      result.current.addParallelHandsBundle(5);
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState.handCount).toBe(15);
    expect(nextState.selectedHandCount).toBe(15);
  });
});
