import { describe, it, expect } from 'vitest';
import { calculateStreakMultiplier, getNextThreshold, getStreakProgress } from '../streakCalculator';
import type { StreakMultiplierConfig } from '../streakCalculator';

describe('streakCalculator', () => {
  const mockConfig: StreakMultiplierConfig = {
    enabled: true,
    baseThreshold: 5,
    thresholdIncrement: 5,
    exponentialGrowth: 1.3,
    baseMultiplier: 1.5,
    multiplierIncrement: 0.5,
  };

  describe('calculateStreakMultiplier', () => {
    it('should return 1.0 when below base threshold', () => {
      expect(calculateStreakMultiplier(0, mockConfig)).toBe(1.0);
      expect(calculateStreakMultiplier(4, mockConfig)).toBe(1.0);
    });

    it('should return 1.0 when disabled', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      expect(calculateStreakMultiplier(10, disabledConfig)).toBe(1.0);
    });

    it('should calculate tier 0 multiplier correctly (5 wins)', () => {
      // At exactly 5, should be tier 0: 1.5x
      expect(calculateStreakMultiplier(5, mockConfig)).toBe(1.5);
      expect(calculateStreakMultiplier(9, mockConfig)).toBe(1.5);
    });

    it('should calculate tier 1 multiplier correctly (10 wins)', () => {
      // At 10, should be tier 1: 2.0x
      expect(calculateStreakMultiplier(10, mockConfig)).toBe(2.0);
      expect(calculateStreakMultiplier(16, mockConfig)).toBe(2.0);
    });

    it('should calculate tier 2 multiplier with exponential growth (17 wins)', () => {
      // With exponential growth 1.3:
      // Tier 0: 5 wins
      // Tier 1: 5 + 5 = 10 wins (5 more)
      // Tier 2: 10 + 6.5 = 16.5 ≈ 17 wins (7 more)
      expect(calculateStreakMultiplier(17, mockConfig)).toBe(2.5);
      expect(calculateStreakMultiplier(24, mockConfig)).toBe(2.5);
    });

    it('should calculate tier 3 multiplier with exponential growth (25 wins)', () => {
      // Tier 3: 17 + 8.45 = 25.45 ≈ 25 wins (8 more)
      expect(calculateStreakMultiplier(25, mockConfig)).toBe(3.0);
      expect(calculateStreakMultiplier(35, mockConfig)).toBe(3.0);
    });

    it('should handle very high streak counts', () => {
      // Should continue growing exponentially
      const highStreak = calculateStreakMultiplier(100, mockConfig);
      expect(highStreak).toBeGreaterThan(3.0);
      expect(highStreak).toBeLessThan(10.0); // Reasonable upper bound
    });
  });

  describe('getNextThreshold', () => {
    it('should return base threshold when below it', () => {
      expect(getNextThreshold(0, mockConfig)).toBe(5);
      expect(getNextThreshold(4, mockConfig)).toBe(5);
    });

    it('should return next tier threshold with exponential growth', () => {
      // At tier 0 (5), next is tier 1 (10)
      expect(getNextThreshold(5, mockConfig)).toBe(10);
      expect(getNextThreshold(9, mockConfig)).toBe(10);

      // At tier 1 (10), next is tier 2 (17)
      expect(getNextThreshold(10, mockConfig)).toBe(17);
      expect(getNextThreshold(16, mockConfig)).toBe(17);

      // At tier 2 (17), next is tier 3 (25)
      expect(getNextThreshold(17, mockConfig)).toBe(25);
      expect(getNextThreshold(24, mockConfig)).toBe(25);
    });

    it('should handle disabled config', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      expect(getNextThreshold(10, disabledConfig)).toBe(5);
    });
  });

  describe('getStreakProgress', () => {
    it('should calculate progress towards first threshold', () => {
      expect(getStreakProgress(0, mockConfig)).toBe(0);
      expect(getStreakProgress(2, mockConfig)).toBeCloseTo(40, 0); // 2/5 = 40%
      expect(getStreakProgress(4, mockConfig)).toBeCloseTo(80, 0); // 4/5 = 80%
    });

    it('should calculate progress within tier 0', () => {
      // Tier 0: 5 to 9 (range of 5)
      expect(getStreakProgress(5, mockConfig)).toBe(0); // At start of tier
      expect(getStreakProgress(7, mockConfig)).toBeCloseTo(40, 0); // 2/5 = 40%
      expect(getStreakProgress(9, mockConfig)).toBeCloseTo(80, 0); // 4/5 = 80%
    });

    it('should calculate progress within tier 1', () => {
      // Tier 1: 10 to 16 (range of 7 due to exponential growth)
      expect(getStreakProgress(10, mockConfig)).toBeCloseTo(0, 0); // At start
      expect(getStreakProgress(13, mockConfig)).toBeCloseTo(42.86, 0); // ~3/7
    });

    it('should handle progress at exact threshold', () => {
      // At exact threshold, should be at 0% of next tier
      expect(getStreakProgress(10, mockConfig)).toBeCloseTo(0, 0);
      expect(getStreakProgress(17, mockConfig)).toBeCloseTo(0, 0);
    });
  });

  describe('exponential growth verification', () => {
    it('should require more wins for each successive tier', () => {
      // Calculate the gap between consecutive tiers
      const tier0To1Gap = getNextThreshold(5, mockConfig) - 5; // 10 - 5 = 5
      const tier1To2Gap = getNextThreshold(10, mockConfig) - 10; // 17 - 10 = 7
      const tier2To3Gap = getNextThreshold(17, mockConfig) - 17; // 25 - 17 = 8

      // Each gap should be larger than the previous
      expect(tier1To2Gap).toBeGreaterThan(tier0To1Gap);
      expect(tier2To3Gap).toBeGreaterThan(tier1To2Gap);
    });

    it('should follow exponential growth formula', () => {
      // With growth factor 1.3, each tier increment should be ~1.3x the previous
      const tier0To1Gap = 5; // Base increment
      const tier1To2Gap = getNextThreshold(10, mockConfig) - 10; // Should be ~6.5 → 7
      const tier2To3Gap = getNextThreshold(17, mockConfig) - 17; // Should be ~8.45 → 8

      // Verify approximate exponential relationship (allow some rounding error)
      expect(tier1To2Gap / tier0To1Gap).toBeCloseTo(1.4, 1); // 7/5 = 1.4
      expect(tier2To3Gap / tier1To2Gap).toBeCloseTo(1.14, 1); // 8/7 = 1.14
    });

    it('should handle linear growth when exponentialGrowth = 1.0', () => {
      const linearConfig: StreakMultiplierConfig = {
        ...mockConfig,
        exponentialGrowth: 1.0,
      };

      // With growth factor 1.0, should be flat increments
      expect(getNextThreshold(5, linearConfig)).toBe(10); // +5
      expect(getNextThreshold(10, linearConfig)).toBe(15); // +5
      expect(getNextThreshold(15, linearConfig)).toBe(20); // +5
    });
  });
});
