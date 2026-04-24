import { describe, it, expect } from 'vitest';
import { selectRandomShopOptions, selectShopOptionsByRarity } from '../shopSelection';
import type { ShopRarityMode } from '../shopSelection';

describe('selectShopOptionsByRarity', () => {
  it('returns one option per slot', () => {
    const mode: ShopRarityMode = {
      shopSlots: [
        { maxRarity: 1 },
        { maxRarity: 1 },
        { maxRarity: 1 },
      ],
      shopItems: {
        'dead-card': { rarity: 1 },
        'wild-card': { rarity: 1 },
        'extra-draw': { rarity: 1 },
      },
    };
    const result = selectShopOptionsByRarity(mode);
    expect(result).toHaveLength(3);
  });

  it('returns empty when no shopSlots or shopItems', () => {
    expect(selectShopOptionsByRarity({})).toEqual([]);
    expect(selectShopOptionsByRarity({ shopSlots: [] })).toEqual([]);
    expect(selectShopOptionsByRarity({ shopItems: {} })).toEqual([]);
  });

  it('respects slot maxRarity and picks only items of that rarity', () => {
    const mode: ShopRarityMode = {
      shopSlots: [{ maxRarity: 1 }],
      shopItems: {
        'dead-card': { rarity: 1 },
        'wild-card': { rarity: 2 },
      },
    };
    for (let i = 0; i < 20; i++) {
      const result = selectShopOptionsByRarity(mode);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('dead-card');
    }
  });

  it('can pick from multiple rarities when slot allows', () => {
    const mode: ShopRarityMode = {
      shopSlots: [
        { maxRarity: 2, rarityChances: [0, 1] }, // 100% rarity 2
        { maxRarity: 2, rarityChances: [1, 0] }, // 100% rarity 1
      ],
      shopItems: {
        'dead-card': { rarity: 1 },
        'wild-card': { rarity: 2 },
      },
    };
    const result = selectShopOptionsByRarity(mode);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('wild-card');
    expect(result[1]).toBe('dead-card');
  });

  it('avoids duplicates when possible', () => {
    const mode: ShopRarityMode = {
      shopSlots: [
        { maxRarity: 1 },
        { maxRarity: 1 },
        { maxRarity: 1 },
      ],
      shopItems: {
        'dead-card': { rarity: 1 },
        'wild-card': { rarity: 1 },
        'extra-draw': { rarity: 1 },
      },
    };
    const result = selectShopOptionsByRarity(mode);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  it('returns exactly shopOptionCount items when set (more than slots)', () => {
    const mode: ShopRarityMode = {
      shopOptionCount: 5,
      shopSlots: [{ maxRarity: 1 }, { maxRarity: 1 }],
      shopItems: {
        'dead-card': { rarity: 1 },
        'wild-card': { rarity: 1 },
      },
    };
    const result = selectShopOptionsByRarity(mode);
    expect(result).toHaveLength(5);
    // All items must be one of the two options (repeats allowed)
    expect(result.every((opt) => opt === 'dead-card' || opt === 'wild-card')).toBe(true);
  });

  it('returns exactly shopOptionCount items when set (fewer than slots)', () => {
    const mode: ShopRarityMode = {
      shopOptionCount: 2,
      shopSlots: [
        { maxRarity: 1 },
        { maxRarity: 1 },
        { maxRarity: 1 },
        { maxRarity: 1 },
      ],
      shopItems: {
        'dead-card': { rarity: 1 },
        'wild-card': { rarity: 1 },
        'extra-draw': { rarity: 1 },
      },
    };
    const result = selectShopOptionsByRarity(mode);
    expect(result).toHaveLength(2);
  });

  it('returns empty when shopItems has no keys', () => {
    const result = selectShopOptionsByRarity({
      shopSlots: [{ maxRarity: 1 }],
      shopItems: {},
    });
    expect(result).toEqual([]);
  });
});

describe('selectRandomShopOptions', () => {
  it('should return exactly the requested count when enough options available', () => {
    const weights = {
      'option-a': 10,
      'option-b': 20,
      'option-c': 30,
      'option-d': 40,
    };
    const result = selectRandomShopOptions(weights, 3);
    expect(result).toHaveLength(3);
  });

  it('should return exactly the requested count even with fewer unique options', () => {
    const weights = {
      'option-a': 10,
      'option-b': 20,
    };
    // Request 5 items but only 2 unique options available
    const result = selectRandomShopOptions(weights, 5);
    expect(result).toHaveLength(5);
  });

  it('should return exactly the requested count with single option', () => {
    const weights = {
      'option-a': 100,
    };
    const result = selectRandomShopOptions(weights, 3);
    expect(result).toHaveLength(3);
    // All should be the same option
    expect(result.every((opt) => opt === 'option-a')).toBe(true);
  });

  it('should return unique options when possible', () => {
    const weights = {
      'option-a': 10,
      'option-b': 20,
      'option-c': 30,
    };
    const result = selectRandomShopOptions(weights, 3);
    const uniqueOptions = new Set(result);
    expect(uniqueOptions.size).toBe(3);
  });

  it('should handle requesting more items than unique options', () => {
    const weights = {
      'option-a': 10,
      'option-b': 20,
      'option-c': 30,
    };
    const result = selectRandomShopOptions(weights, 5);
    expect(result).toHaveLength(5);
    // Should have at least the 3 unique options
    const uniqueOptions = new Set(result);
    expect(uniqueOptions.size).toBeGreaterThanOrEqual(1);
    expect(uniqueOptions.size).toBeLessThanOrEqual(3);
  });

  it('should prioritize higher weight options when duplicating', () => {
    const weights = {
      'low-weight': 1,
      'high-weight': 100,
    };
    // Run multiple times to check statistical behavior
    let highWeightCount = 0;
    for (let i = 0; i < 10; i++) {
      const result = selectRandomShopOptions(weights, 3);
      // Should have at least 2 duplicates since only 2 unique options
      highWeightCount += result.filter((opt) => opt === 'high-weight').length;
    }
    // High weight should appear more often in duplicates
    expect(highWeightCount).toBeGreaterThan(15); // Out of 30 total
  });

  it('should guarantee minimum shop items equal to config', () => {
    // This simulates the actual game config scenario
    const gameShopWeights = {
      'dead-card': 20,
      'single-dead-card-removal': 15,
      'all-dead-cards-removal': 15,
      'parallel-hands-bundle-5': 10,
      'parallel-hands-bundle-10': 15,
      'parallel-hands-bundle-25': 12,
      'parallel-hands-bundle-50': 8,
      'wild-card': 15,
      'reward-upgrade': 10,
      'devils-deal-chance': 8,
      'devils-deal-cost-reduction': 8,
    };
    const shopOptionCount = 3; // From gameConfig
    
    // Run 100 times to ensure consistency
    for (let i = 0; i < 100; i++) {
      const result = selectRandomShopOptions(gameShopWeights, shopOptionCount);
      expect(result).toHaveLength(shopOptionCount);
    }
  });

  it('should handle edge case with empty weights', () => {
    const weights = {};
    const result = selectRandomShopOptions(weights, 3);
    expect(result).toHaveLength(0);
  });

  it('should handle requesting zero items', () => {
    const weights = {
      'option-a': 10,
      'option-b': 20,
    };
    const result = selectRandomShopOptions(weights, 0);
    expect(result).toHaveLength(0);
  });
});
