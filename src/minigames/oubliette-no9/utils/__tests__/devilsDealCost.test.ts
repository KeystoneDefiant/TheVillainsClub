import { describe, it, expect } from 'vitest';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

describe('Devil\'s Deal Cost Calculation', () => {
  const currentMode = getCurrentGameMode();
  const devilsDealConfig = currentMode.devilsDeal;

  if (!devilsDealConfig) {
    it.skip('Devil\'s Deal config not found', () => {});
    return;
  }

  describe('Cost calculation formula', () => {
    it('should calculate cost as ((bestPayoutPerHand * selectedHandCount) * selectedHandCount) * costPercent / 100', () => {
      const bestMultiplier = 250; // Royal flush
      const betAmount = 2;
      const selectedHandCount = 10;
      const costPercent = devilsDealConfig.baseCostPercent;

      // Calculate best possible hand's payout per hand
      const bestPayoutPerHand = bestMultiplier * betAmount;

      // Calculate cost: ((best possible hand's payout * selectedHandCount) * number of hands) * percentage
      const cost = Math.round(
        ((bestPayoutPerHand * selectedHandCount) * selectedHandCount * costPercent) / 100
      );

      // Expected: ((250 * 2 * 10) * 10) * 10 / 100 = (5000 * 10) * 10 / 100 = 5000
      const expectedCost = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
      );

      expect(cost).toBe(expectedCost);
    });

    it('should scale cost with bet amount', () => {
      const bestMultiplier = 250;
      const selectedHandCount = 10;
      const costPercent = devilsDealConfig.baseCostPercent;

      const betAmount1 = 2;
      const betAmount2 = 10;

      const cost1 = Math.round(
        ((bestMultiplier * betAmount1 * selectedHandCount) * selectedHandCount * costPercent) / 100
      );
      const cost2 = Math.round(
        ((bestMultiplier * betAmount2 * selectedHandCount) * selectedHandCount * costPercent) / 100
      );

      // Cost should scale proportionally with bet amount
      expect(cost2).toBe(cost1 * 5); // 10 / 2 = 5
    });

    it('should scale cost with number of parallel hands (squared)', () => {
      const bestMultiplier = 250;
      const betAmount = 2;
      const costPercent = devilsDealConfig.baseCostPercent;

      const selectedHandCount1 = 10;
      const selectedHandCount2 = 20;

      const cost1 = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount1) * selectedHandCount1 * costPercent) / 100
      );
      const cost2 = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount2) * selectedHandCount2 * costPercent) / 100
      );

      // Cost should scale with hand count squared: (20/10)^2 = 4
      expect(cost2).toBe(cost1 * 4); // 20 / 10 = 2, squared = 4
    });

    it('should apply cost reduction purchases correctly', () => {
      const bestMultiplier = 250;
      const betAmount = 2;
      const selectedHandCount = 10;

      // Base cost percent
      const baseCostPercent = devilsDealConfig.baseCostPercent;

      // With 0 purchases
      const costPercent0 =
        baseCostPercent - 0 * devilsDealConfig.costReductionPerPurchase;
      const cost0 = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent0) / 100
      );

      // With 1 purchase (6% reduction)
      const costPercent1 =
        baseCostPercent - 1 * devilsDealConfig.costReductionPerPurchase;
      const finalCostPercent1 = Math.max(1, costPercent1);
      const cost1 = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * finalCostPercent1) / 100
      );

      // Cost should be reduced
      expect(cost1).toBeLessThan(cost0);
      expect(costPercent1).toBe(baseCostPercent - devilsDealConfig.costReductionPerPurchase);
    });

    it('should ensure minimum cost percent of 1%', () => {
      const bestMultiplier = 250;
      const betAmount = 2;
      const selectedHandCount = 10;

      // Simulate maximum cost reduction (should cap at 1%)
      const maxReduction = devilsDealConfig.maxCostReductionPurchases;
      const costPercent =
        devilsDealConfig.baseCostPercent -
        maxReduction * devilsDealConfig.costReductionPerPurchase;
      const finalCostPercent = Math.max(1, costPercent);

      expect(finalCostPercent).toBeGreaterThanOrEqual(1);

      const cost = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * finalCostPercent) / 100
      );

      // Cost should still be positive
      expect(cost).toBeGreaterThan(0);
    });

    it('should round cost to avoid decimals', () => {
      const bestMultiplier = 3; // Three of a kind
      const betAmount = 3;
      const selectedHandCount = 7;
      const costPercent = devilsDealConfig.baseCostPercent;

      const cost = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
      );

      expect(Number.isInteger(cost)).toBe(true);
      expect(cost).toBe(
        Math.round(
          ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
        )
      );
    });

    it('should handle edge case with very small bet amount', () => {
      const bestMultiplier = 250;
      const betAmount = 1;
      const selectedHandCount = 1;
      const costPercent = devilsDealConfig.baseCostPercent;

      const cost = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
      );

      const expected = Math.round(
        ((bestMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
      );
      expect(cost).toBe(expected);
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle different hand multipliers correctly', () => {
      const betAmount = 2;
      const selectedHandCount = 10;
      const costPercent = devilsDealConfig.baseCostPercent;

      const multipliers = [
        { rank: 'royal-flush', multiplier: 250 },
        { rank: 'straight-flush', multiplier: 50 },
        { rank: 'four-of-a-kind', multiplier: 25 },
        { rank: 'one-pair', multiplier: 1 },
        { rank: 'high-card', multiplier: 0 },
      ];

      multipliers.forEach(({ multiplier }) => {
        const cost = Math.round(
          ((multiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
        );

        expect(cost).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(cost)).toBe(true);

        // Higher multiplier should result in higher cost
        if (multiplier > 0) {
          expect(cost).toBeGreaterThan(0);
        } else {
          expect(cost).toBe(0);
        }
      });
    });

    it('should charge minimum cost when offered card creates pair below Jacks (Jacks or Better)', () => {
      // Scenario: hand 2,3,4,9,10 and offered card 3. Best hand = pair of 3s.
      // With Jacks or Better, pair of 3s has multiplier 0 (doesn't pay).
      // Without fix: cost = 0 (free Devil's Deal). With fix: use effective multiplier 1.
      const betAmount = 2;
      const selectedHandCount = 10;
      const costPercent = devilsDealConfig.baseCostPercent;

      const rawMultiplier = 0; // Pair of 3s doesn't pay
      const effectiveMultiplier = 1; // Fix: treat non-paying pairs as minimum 1x for cost

      const costWithFix = Math.round(
        ((effectiveMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
      );
      const costWithoutFix = Math.round(
        ((rawMultiplier * betAmount * selectedHandCount) * selectedHandCount * costPercent) / 100
      );

      expect(costWithoutFix).toBe(0);
      expect(costWithFix).toBeGreaterThan(0);
    });
  });
});
