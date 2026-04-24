import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';

vi.mock('../useThemeAudio', () => ({
  useThemeAudio: () => ({
    playSound: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    resetRoundSoundCounts: vi.fn(),
  }),
}));

describe('useGameState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return state and all expected action functions', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.state).toBeDefined();
    expect(result.current.state.screen).toBe('menu');
    expect(result.current.dealHand).toBeTypeOf('function');
    expect(result.current.toggleHold).toBeTypeOf('function');
    expect(result.current.drawParallelHands).toBeTypeOf('function');
    expect(result.current.returnToMenu).toBeTypeOf('function');
    expect(result.current.returnToPreDraw).toBeTypeOf('function');
    expect(result.current.startNewRun).toBeTypeOf('function');
    expect(result.current.endRun).toBeTypeOf('function');
    expect(result.current.setBetAmount).toBeTypeOf('function');
    expect(result.current.setSelectedHandCount).toBeTypeOf('function');
    expect(result.current.addDeadCard).toBeTypeOf('function');
    expect(result.current.addWildCard).toBeTypeOf('function');
  });

  it('should start with menu screen', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.state.screen).toBe('menu');
    expect(result.current.state.gamePhase).toBe('preDraw');
  });

  it('should navigate to game screen when startNewRun is called', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.startNewRun();
    });

    expect(result.current.state.screen).toBe('game');
    expect(result.current.state.gamePhase).toBe('preDraw');
  });

  it('should reset to menu when returnToMenu is called', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.startNewRun();
    });
    expect(result.current.state.screen).toBe('game');

    act(() => {
      result.current.returnToMenu();
    });
    expect(result.current.state.screen).toBe('menu');
  });

  it('should update bet amount when setBetAmount is called', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.startNewRun();
    });

    act(() => {
      result.current.setBetAmount(10);
    });

    expect(result.current.state.betAmount).toBe(10);
  });

  it('should update selected hand count when setSelectedHandCount is called', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.startNewRun();
    });

    // selectedHandCount cannot exceed handCount (default 10), so use 5
    act(() => {
      result.current.setSelectedHandCount(5);
    });

    expect(result.current.state.selectedHandCount).toBe(5);
  });
});
