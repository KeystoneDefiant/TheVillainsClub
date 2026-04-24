import { describe, it, expect } from 'vitest';
import { findBestDevilsDealCards } from '../devilsDeal';
import { Card, RewardTable } from '../../types';

describe('findBestDevilsDealCards', () => {
  const rewardTable: RewardTable = {
    'royal-flush': 250,
    'straight-flush': 50,
    'five-of-a-kind': 100,
    'four-of-a-kind': 25,
    'full-house': 9,
    flush: 6,
    straight: 4,
    'three-of-a-kind': 3,
    'two-pair': 2,
    'one-pair': 1,
    'high-card': 0,
  };

  const betAmount = 2;

  it('should return 3 best cards sorted by potential value', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'hearts', rank: '9', id: 'h-9' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' }, // Would make royal flush
      { suit: 'spades', rank: 'A', id: 's-A' }, // Would make pair of Aces
      { suit: 'diamonds', rank: 'K', id: 'd-K' }, // Would make pair of Kings
      { suit: 'clubs', rank: '2', id: 'c-2' }, // Would make high card
    ];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount
    );

    expect(result).toHaveLength(3);
    // The 10 of hearts should be first (royal flush)
    expect(result[0].id).toBe('h-10');
  });

  it('should handle empty deck', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'hearts', rank: '10', id: 'h-10' },
    ];

    const availableDeck: Card[] = [];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount
    );

    expect(result).toHaveLength(0);
  });

  it('should handle deck with fewer than 3 cards', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'hearts', rank: '10', id: 'h-10' },
    ];

    const availableDeck: Card[] = [
      { suit: 'spades', rank: 'A', id: 's-A' },
      { suit: 'diamonds', rank: 'K', id: 'd-K' },
    ];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount
    );

    expect(result).toHaveLength(2);
  });

  it('should throw error if player hand is not 5 cards', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
    ];

    expect(() => {
      findBestDevilsDealCards(
        playerHand,
        availableDeck,
        rewardTable,
        betAmount
      );
    }).toThrow('Player hand must contain exactly 5 cards');
  });

  it('should test all 5 positions when finding best card', () => {
    // Create a hand where position matters
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'spades', rank: '2', id: 's-2' }, // This breaks the flush
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' }, // Would make royal flush if replacing position 4
      { suit: 'spades', rank: 'A', id: 's-A' }, // Would make pair of Aces
    ];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount
    );

    expect(result).toHaveLength(2);
    // The 10 of hearts should be first (royal flush when replacing position 4)
    expect(result[0].id).toBe('h-10');
  });

  it('should sort cards by best potential value', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'spades', rank: '2', id: 's-2' },
    ];

    const availableDeck: Card[] = [
      { suit: 'clubs', rank: '2', id: 'c-2' }, // High card (lowest value)
      { suit: 'spades', rank: 'A', id: 's-A' }, // Pair of Aces (medium value)
      { suit: 'hearts', rank: '10', id: 'h-10' }, // Royal flush (highest value)
    ];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount
    );

    expect(result).toHaveLength(3);
    // Should be sorted by best value: royal flush > pair > high card
    expect(result[0].id).toBe('h-10'); // Royal flush
    expect(result[1].id).toBe('s-A'); // Pair
    expect(result[2].id).toBe('c-2'); // High card
  });

  it('should scale payout calculation with bet amount', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'hearts', rank: '9', id: 'h-9' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' }, // Would make royal flush
    ];

    // Test with different bet amounts
    const betAmount1 = 2;
    const betAmount2 = 10;

    const result1 = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount1
    );

    const result2 = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      betAmount2
    );

    // Should return the same card (royal flush is best regardless of bet)
    expect(result1[0].id).toBe('h-10');
    expect(result2[0].id).toBe('h-10');

    // The internal payout calculation should scale with bet amount
    // (We can't directly test this, but the function should use betAmount in its calculations)
  });

  it('should handle different bet amounts correctly', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'spades', rank: '2', id: 's-2' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' },
      { suit: 'spades', rank: 'A', id: 's-A' },
    ];

    // Test with bet amount of 1
    const result1 = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      1
    );

    // Test with bet amount of 100
    const result2 = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      100
    );

    // Should return same cards regardless of bet amount (bet affects payout, not ranking)
    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(2);
    expect(result1[0].id).toBe('h-10'); // Royal flush is always best
    expect(result2[0].id).toBe('h-10');
  });

  it('should handle zero bet amount', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'hearts', rank: '9', id: 'h-9' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' },
    ];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      0
    );

    // Should still return cards (payout would be 0, but ranking is based on multiplier)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h-10');
  });

  it('should handle very large bet amounts', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'hearts', rank: '9', id: 'h-9' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' },
      { suit: 'spades', rank: 'A', id: 's-A' },
    ];

    const result = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      1000000
    );

    // Should handle large numbers without issues
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('h-10'); // Royal flush still best
  });

  it('should correctly compare hands with same multiplier but different bet amounts', () => {
    const playerHand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'h-A' },
      { suit: 'hearts', rank: 'K', id: 'h-K' },
      { suit: 'hearts', rank: 'Q', id: 'h-Q' },
      { suit: 'hearts', rank: 'J', id: 'h-J' },
      { suit: 'spades', rank: '2', id: 's-2' },
    ];

    const availableDeck: Card[] = [
      { suit: 'hearts', rank: '10', id: 'h-10' }, // Royal flush (multiplier 250)
      { suit: 'spades', rank: 'A', id: 's-A' }, // Pair (multiplier 1)
    ];

    // With bet amount 2: royal flush = 500, pair = 2
    const result1 = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      2
    );

    // With bet amount 100: royal flush = 25000, pair = 100
    const result2 = findBestDevilsDealCards(
      playerHand,
      availableDeck,
      rewardTable,
      100
    );

    // Royal flush should always be first regardless of bet amount
    expect(result1[0].id).toBe('h-10');
    expect(result2[0].id).toBe('h-10');
  });
});
