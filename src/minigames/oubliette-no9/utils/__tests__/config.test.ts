import { describe, it, expect } from 'vitest';
import {
  getCreditsNeededForDisplayedRound,
  getCreditsNeededForNextRound,
  getCreditsNeededForUpcomingRound,
} from '../config';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

describe('getCreditsNeededForNextRound', () => {
  const mode = getCurrentGameMode();

  it('should apply bet increase when next round triggers increase (round % 3 === 0)', () => {
    const prevMinBet = 10;
    const betAmount = 10;
    const selectedHandCount = 5;
    const handCount = 50;

    const costRound6 = getCreditsNeededForNextRound(6, prevMinBet, betAmount, selectedHandCount, handCount);
    const costRound5 = getCreditsNeededForNextRound(5, prevMinBet, betAmount, selectedHandCount, handCount);

    expect(costRound5).toBe(10 * 5);
    const newMinBet = Math.floor(prevMinBet * (1 + mode.minimumBetIncreasePercent / 100));
    expect(costRound6).toBe(newMinBet * 5);
  });

  it('should calculate displayed round cost from the completed-round bet snapshot', () => {
    expect(getCreditsNeededForDisplayedRound(12, 5, 50)).toBe(60);
  });

  it('should calculate upcoming round cost from already-advanced state', () => {
    const upcomingMinimumBet = Math.floor(82 * (1 + mode.minimumBetIncreasePercent / 100));

    expect(getCreditsNeededForUpcomingRound(upcomingMinimumBet, upcomingMinimumBet, 10, 10)).toBe(
      upcomingMinimumBet * 10,
    );
  });
});
