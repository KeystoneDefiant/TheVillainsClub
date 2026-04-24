import { describe, it, expect, vi, afterEach } from 'vitest';
import { gameConfig } from '@/config/minigames/oublietteNo9GameRules';
import { getGameOverDisplay } from '../gameOverDisplay';
import { createTestGameState } from '../../test/testHelpers';

describe('getGameOverDisplay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return voluntary end display when reason is voluntary', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = getGameOverDisplay('voluntary', null);
    expect(result.title).toBe('Run Complete!');
    expect(result.subtitle).toBe('You walked away from the table.');
    expect(result.isVoluntaryEnd).toBe(true);
    expect(result.tip).toBe(gameConfig.quips.gameOver[0]);
  });

  it('should return voluntary when reason is null', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = getGameOverDisplay(null, null);
    expect(result.title).toBe('Run Complete!');
    expect(result.isVoluntaryEnd).toBe(true);
    expect(gameConfig.quips.gameOver).toContain(result.tip);
  });

  it('should return insufficient-credits display with context', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const result = getGameOverDisplay('insufficient-credits', null, {
      minimumBet: 10,
      handCount: 20,
    });
    expect(result.title).toBe('Game Over');
    expect(result.subtitle).toContain('200');
    expect(result.subtitle).toContain('10');
    expect(result.subtitle).toContain('20');
    expect(result.isVoluntaryEnd).toBe(false);
    expect(gameConfig.quips.gameOver).toContain(result.tip);
  });

  it('should return failure condition display with state', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    const state = createTestGameState({
      baseMinimumBet: 10,
      round: 31,
      totalEarnings: 500,
      winningHandsLastRound: 5,
    });
    const result = getGameOverDisplay('minimum-bet-multiplier', state);
    expect(result.title).toBe('Game Over');
    expect(result.subtitle).toMatch(/Bet must be|multiplier/);
    expect(result.isVoluntaryEnd).toBe(false);
    expect(gameConfig.quips.gameOver).toContain(result.tip);
  });
});
