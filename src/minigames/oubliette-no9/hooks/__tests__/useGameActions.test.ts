import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameActions } from '../useGameActions';
import { GameState } from '../../types';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

vi.mock('../useThemeAudio', () => ({
  useThemeAudio: () => ({ playSound: vi.fn() }),
}));

function createMockState(overrides: Partial<GameState> = {}): GameState {
  const mode = getCurrentGameMode();
  return {
    screen: 'game',
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

describe('useGameActions', () => {
  let setState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setState = vi.fn();
  });

  it('should return dealHand, toggleHold, and drawParallelHands functions', () => {
    const state = createMockState();
    const { result } = renderHook(() => useGameActions(state, setState));

    expect(result.current.dealHand).toBeTypeOf('function');
    expect(result.current.toggleHold).toBeTypeOf('function');
    expect(result.current.drawParallelHands).toBeTypeOf('function');
  });

  it('should call setState when dealHand is invoked with sufficient credits', () => {
    const state = createMockState({ credits: 10000, betAmount: 5, selectedHandCount: 10 });
    const { result } = renderHook(() => useGameActions(state, setState));

    act(() => {
      result.current.dealHand();
    });

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0];
    expect(updater).toBeTypeOf('function');
    const nextState = updater(state);
    expect(nextState.gamePhase).toBe('playing');
    expect(nextState.playerHand.length).toBeGreaterThan(0);
    expect(nextState.credits).toBe(state.credits - 5 * 10);
  });

  it('should not update state when dealHand is called with insufficient credits', () => {
    const state = createMockState({ credits: 10, betAmount: 5, selectedHandCount: 10 });
    const { result } = renderHook(() => useGameActions(state, setState));

    act(() => {
      result.current.dealHand();
    });

    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState).toBe(state);
  });

  it('should toggle hold when toggleHold is called', () => {
    const state = createMockState({
      playerHand: [
        { suit: 'hearts' as const, rank: 'A' as const, id: '1', isDead: false, isWild: false },
        { suit: 'hearts' as const, rank: 'K' as const, id: '2', isDead: false, isWild: false },
        { suit: 'hearts' as const, rank: 'Q' as const, id: '3', isDead: false, isWild: false },
        { suit: 'hearts' as const, rank: 'J' as const, id: '4', isDead: false, isWild: false },
        { suit: 'hearts' as const, rank: '10' as const, id: '5', isDead: false, isWild: false },
      ],
      heldIndices: [],
    });
    const { result } = renderHook(() => useGameActions(state, setState));

    act(() => {
      result.current.toggleHold(0);
    });

    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState.heldIndices).toEqual([0]);
  });

  it('should not update when drawParallelHands is called with no player hand', () => {
    const state = createMockState({ playerHand: [], gamePhase: 'playing' });
    const { result } = renderHook(() => useGameActions(state, setState));

    act(() => {
      result.current.drawParallelHands();
    });

    const updater = setState.mock.calls[0][0];
    const nextState = updater(state);
    expect(nextState).toBe(state);
  });
});
