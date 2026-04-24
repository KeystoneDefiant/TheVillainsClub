import { describe, it, expect } from 'vitest';
import { PokerEvaluator } from '../pokerEvaluator';
import { Card } from '../../types';

// Helper function to create a card
function createCard(rank: Card['rank'], suit: Card['suit'], options?: Partial<Card>): Card {
  return {
    rank,
    suit,
    id: `${rank}-${suit}-${Math.random()}`,
    ...options,
  };
}

describe('PokerEvaluator', () => {
  describe('Royal Flush', () => {
    it('should identify a royal flush', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'hearts'),
        createCard('Q', 'hearts'),
        createCard('J', 'hearts'),
        createCard('10', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('royal-flush');
      expect(result.winningCards.length).toBe(5);
    });

    it('should identify royal flush in different suit', () => {
      const hand: Card[] = [
        createCard('10', 'spades'),
        createCard('J', 'spades'),
        createCard('Q', 'spades'),
        createCard('K', 'spades'),
        createCard('A', 'spades'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('royal-flush');
    });
  });

  describe('Straight Flush', () => {
    it('should identify a straight flush', () => {
      const hand: Card[] = [
        createCard('5', 'diamonds'),
        createCard('6', 'diamonds'),
        createCard('7', 'diamonds'),
        createCard('8', 'diamonds'),
        createCard('9', 'diamonds'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight-flush');
      expect(result.winningCards.length).toBe(5);
    });

    it('should identify a low straight flush (wheel)', () => {
      const hand: Card[] = [
        createCard('A', 'clubs'),
        createCard('2', 'clubs'),
        createCard('3', 'clubs'),
        createCard('4', 'clubs'),
        createCard('5', 'clubs'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight-flush');
    });
  });

  describe('Four of a Kind', () => {
    it('should identify four of a kind', () => {
      const hand: Card[] = [
        createCard('7', 'hearts'),
        createCard('7', 'diamonds'),
        createCard('7', 'clubs'),
        createCard('7', 'spades'),
        createCard('K', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('four-of-a-kind');
      expect(result.winningCards.length).toBe(5); // Returns all 5 cards
    });

    it('should identify four aces', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('A', 'diamonds'),
        createCard('A', 'clubs'),
        createCard('A', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('four-of-a-kind');
    });
  });

  describe('Full House', () => {
    it('should identify a full house', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('5', 'spades'),
        createCard('5', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('full-house');
      expect(result.winningCards.length).toBe(5);
    });

    it('should identify full house with different combinations', () => {
      const hand: Card[] = [
        createCard('2', 'hearts'),
        createCard('2', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('Q', 'spades'),
        createCard('Q', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('full-house');
    });
  });

  describe('Flush', () => {
    it('should identify a flush', () => {
      const hand: Card[] = [
        createCard('2', 'hearts'),
        createCard('5', 'hearts'),
        createCard('8', 'hearts'),
        createCard('J', 'hearts'),
        createCard('K', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('flush');
      expect(result.winningCards.length).toBe(5);
    });

    it('should identify flush in spades', () => {
      const hand: Card[] = [
        createCard('3', 'spades'),
        createCard('6', 'spades'),
        createCard('9', 'spades'),
        createCard('Q', 'spades'),
        createCard('A', 'spades'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('flush');
    });
  });

  describe('Straight', () => {
    it('should identify a straight', () => {
      const hand: Card[] = [
        createCard('5', 'hearts'),
        createCard('6', 'diamonds'),
        createCard('7', 'clubs'),
        createCard('8', 'spades'),
        createCard('9', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight');
      expect(result.winningCards.length).toBe(5);
    });

    it('should identify a low straight (wheel)', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('2', 'diamonds'),
        createCard('3', 'clubs'),
        createCard('4', 'spades'),
        createCard('5', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight');
    });

    it('should identify a high straight', () => {
      const hand: Card[] = [
        createCard('10', 'hearts'),
        createCard('J', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('K', 'spades'),
        createCard('A', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight');
    });
  });

  describe('Three of a Kind', () => {
    it('should identify three of a kind', () => {
      const hand: Card[] = [
        createCard('9', 'hearts'),
        createCard('9', 'diamonds'),
        createCard('9', 'clubs'),
        createCard('K', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('three-of-a-kind');
      expect(result.winningCards.length).toBe(5); // Returns all 5 cards
    });

    it('should identify three aces', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('A', 'diamonds'),
        createCard('A', 'clubs'),
        createCard('7', 'spades'),
        createCard('3', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('three-of-a-kind');
    });
  });

  describe('Two Pair', () => {
    it('should identify two pair', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('5', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('two-pair');
      expect(result.winningCards.length).toBe(5); // Returns all 5 cards
    });

    it('should identify two pair with aces', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('A', 'diamonds'),
        createCard('3', 'clubs'),
        createCard('3', 'spades'),
        createCard('7', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('two-pair');
    });
  });

  describe('One Pair', () => {
    it('should identify one pair', () => {
      const hand: Card[] = [
        createCard('J', 'hearts'),
        createCard('J', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('one-pair');
      expect(result.winningCards.length).toBe(5); // Returns all 5 cards
    });

    it('should identify pair of aces', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('A', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('one-pair');
    });

    it('should identify pair of queens', () => {
      const hand: Card[] = [
        createCard('Q', 'hearts'),
        createCard('Q', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('one-pair');
    });

    it('should identify pair of kings', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('one-pair');
    });

    // Tests for "Jacks or Better" rule - pairs below Jacks should be rejected
    it('should reject pair of 10s (below minimum pair rank)', () => {
      const hand: Card[] = [
        createCard('10', 'hearts'),
        createCard('10', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
    });

    it('should reject pair of 9s (below minimum pair rank)', () => {
      const hand: Card[] = [
        createCard('9', 'hearts'),
        createCard('9', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
    });

    it('should reject pair of 5s (below minimum pair rank)', () => {
      const hand: Card[] = [
        createCard('5', 'hearts'),
        createCard('5', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
    });

    it('should reject pair of 2s (below minimum pair rank)', () => {
      const hand: Card[] = [
        createCard('2', 'hearts'),
        createCard('2', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('8', 'spades'),
        createCard('A', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
    });
  });

  describe('High Card', () => {
    it('should identify high card', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('7', 'clubs'),
        createCard('5', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
      expect(result.winningCards.length).toBeGreaterThan(0);
    });

    it('should handle high card with mixed ranks', () => {
      const hand: Card[] = [
        createCard('9', 'hearts'),
        createCard('7', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('3', 'spades'),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
    });
  });

  describe('Wild Cards', () => {
    it('should use wild card to create four of a kind', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('A', 'spades', { isWild: true }),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('four-of-a-kind');
    });

    it('should use wild card with three 5s to create four of a kind (not three of a kind)', () => {
      const hand: Card[] = [
        createCard('5', 'hearts'),
        createCard('5', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('A', 'spades', { isWild: true }),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('four-of-a-kind');
    });

    it('should use wild card to create royal flush', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'hearts'),
        createCard('Q', 'hearts'),
        createCard('J', 'hearts'),
        createCard('2', 'spades', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('royal-flush');
    });

    it('should use wild card to create straight flush', () => {
      const hand: Card[] = [
        createCard('5', 'diamonds'),
        createCard('6', 'diamonds'),
        createCard('7', 'diamonds'),
        createCard('8', 'diamonds'),
        createCard('A', 'spades', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight-flush');
    });

    it('should handle multiple wild cards', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('A', 'spades', { isWild: true }),
        createCard('2', 'clubs', { isWild: true }),
        createCard('3', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('four-of-a-kind');
    });

    it('should create five of a kind with wild cards', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('K', 'spades'),
        createCard('A', 'hearts', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('five-of-a-kind');
    });

    it('should create five of a kind with 3 wilds and 2 matching cards', () => {
      const hand: Card[] = [
        createCard('Q', 'hearts'),
        createCard('Q', 'diamonds'),
        createCard('2', 'spades', { isWild: true }),
        createCard('3', 'clubs', { isWild: true }),
        createCard('4', 'hearts', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('five-of-a-kind');
    });

    it('should create one pair with wild card (Jacks or better)', () => {
      const hand: Card[] = [
        createCard('J', 'hearts'),
        createCard('5', 'diamonds'),
        createCard('8', 'clubs'),
        createCard('2', 'spades'),
        createCard('A', 'hearts', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('one-pair');
    });

    it('should reject pair below minimum with wild card (10s)', () => {
      const hand: Card[] = [
        createCard('10', 'hearts'),
        createCard('5', 'diamonds'),
        createCard('8', 'clubs'),
        createCard('2', 'spades'),
        createCard('A', 'hearts', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      // Should not be one-pair because 10s are below minimum (Jacks or Better)
      expect(result.rank).not.toBe('one-pair');
      // Should fall back to a better hand if possible, or high card
      expect(['high-card', 'straight', 'flush', 'straight-flush']).toContain(result.rank);
    });

    it('should reject pair below minimum with wild card (9s)', () => {
      const hand: Card[] = [
        createCard('9', 'hearts'),
        createCard('5', 'diamonds'),
        createCard('8', 'clubs'),
        createCard('2', 'spades'),
        createCard('A', 'hearts', { isWild: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      // Should not be one-pair because 9s are below minimum (Jacks or Better)
      expect(result.rank).not.toBe('one-pair');
    });

    describe('Multiple Wild Cards Verification', () => {
      it('should create royal flush with J, K, A same suit + 2 wilds (TODO verification)', () => {
        const hand: Card[] = [
          createCard('J', 'hearts'),
          createCard('K', 'hearts'),
          createCard('A', 'hearts'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'clubs', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('royal-flush');
        expect(result.score).toBeGreaterThan(9000); // Royal flush has high score
      });

      it('should create royal flush with Q, K + 3 wilds', () => {
        const hand: Card[] = [
          createCard('Q', 'diamonds'),
          createCard('K', 'diamonds'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'clubs', { isWild: true }),
          createCard('4', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('royal-flush');
      });

      it('should create royal flush with 10, J same suit + 3 wilds', () => {
        const hand: Card[] = [
          createCard('10', 'spades'),
          createCard('J', 'spades'),
          createCard('2', 'hearts', { isWild: true }),
          createCard('3', 'clubs', { isWild: true }),
          createCard('4', 'diamonds', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('royal-flush');
      });

      it('should create straight flush with 2 wilds', () => {
        const hand: Card[] = [
          createCard('5', 'clubs'),
          createCard('6', 'clubs'),
          createCard('7', 'clubs'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('straight-flush');
      });

      it('should create straight flush with 3 wilds', () => {
        const hand: Card[] = [
          createCard('8', 'spades'),
          createCard('9', 'spades'),
          createCard('2', 'hearts', { isWild: true }),
          createCard('3', 'clubs', { isWild: true }),
          createCard('4', 'diamonds', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('straight-flush');
      });

      it('should create four of a kind with 2 wilds', () => {
        const hand: Card[] = [
          createCard('10', 'hearts'),
          createCard('10', 'diamonds'),
          createCard('5', 'clubs'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('four-of-a-kind');
      });

      it('should score wheel (A-2-3-4-5) when wild acts as 3', () => {
        const hand: Card[] = [
          createCard('A', 'hearts'),
          createCard('2', 'diamonds'),
          createCard('4', 'clubs'),
          createCard('5', 'spades'),
          createCard('K', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(result.rank).toBe('straight');
      });

      it('should score four of a kind (not full house) for A, A, Wild, Wild + kicker', () => {
        const hand: Card[] = [
          createCard('A', 'hearts'),
          createCard('A', 'diamonds'),
          createCard('K', 'clubs'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        expect(['four-of-a-kind', 'five-of-a-kind']).toContain(result.rank);
        expect(result.rank).not.toBe('full-house');
      });

      it('should create optimal hand with 2 pair + 2 wilds', () => {
        const hand: Card[] = [
          createCard('K', 'hearts'),
          createCard('K', 'diamonds'),
          createCard('J', 'clubs'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        // With 2 pair cards and 2 wilds, should make four of a kind (better than full house)
        expect(result.rank).toBe('four-of-a-kind');
      });

      it('should handle 4 wilds optimally', () => {
        const hand: Card[] = [
          createCard('A', 'hearts'),
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'clubs', { isWild: true }),
          createCard('4', 'diamonds', { isWild: true }),
          createCard('5', 'hearts', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        // With 1 Ace and 4 wilds, should make royal flush (best possible hand)
        expect(result.rank).toBe('royal-flush');
      });

      it('should handle all 5 wilds', () => {
        const hand: Card[] = [
          createCard('2', 'spades', { isWild: true }),
          createCard('3', 'clubs', { isWild: true }),
          createCard('4', 'diamonds', { isWild: true }),
          createCard('5', 'hearts', { isWild: true }),
          createCard('6', 'spades', { isWild: true }),
        ];
        const result = PokerEvaluator.evaluate(hand);
        // All wilds should make royal flush (best possible hand)
        expect(result.rank).toBe('royal-flush');
      });
    });
  });

  describe('Dead Cards', () => {
    it('should ignore dead cards in evaluation', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('K', 'clubs'),
        createCard('5', 'spades', { isDead: true }),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('three-of-a-kind');
    });

    it('should handle multiple dead cards', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('A', 'diamonds'),
        createCard('5', 'clubs', { isDead: true }),
        createCard('8', 'spades', { isDead: true }),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('one-pair');
    });

    it('should handle all cards being dead', () => {
      const hand: Card[] = [
        createCard('A', 'hearts', { isDead: true }),
        createCard('K', 'diamonds', { isDead: true }),
        createCard('Q', 'clubs', { isDead: true }),
        createCard('J', 'spades', { isDead: true }),
        createCard('10', 'hearts', { isDead: true }),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('high-card');
      expect(result.score).toBe(0);
      expect(result.winningCards.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for hands with less than 5 cards', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
      ];
      expect(() => PokerEvaluator.evaluate(hand)).toThrow('Hand must contain exactly 5 cards');
    });

    it('should throw error for hands with more than 5 cards', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
        createCard('9', 'diamonds'),
      ];
      expect(() => PokerEvaluator.evaluate(hand)).toThrow('Hand must contain exactly 5 cards');
    });

    it('should handle combination of wild and dead cards', () => {
      const hand: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('5', 'clubs', { isDead: true }),
        createCard('A', 'spades', { isWild: true }),
        createCard('2', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('three-of-a-kind');
    });

    it('should evaluate hand with sequential ranks correctly', () => {
      const hand: Card[] = [
        createCard('2', 'hearts'),
        createCard('3', 'diamonds'),
        createCard('4', 'clubs'),
        createCard('5', 'spades'),
        createCard('6', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.rank).toBe('straight');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate higher score for better hands', () => {
      const royalFlush: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'hearts'),
        createCard('Q', 'hearts'),
        createCard('J', 'hearts'),
        createCard('10', 'hearts'),
      ];
      const pair: Card[] = [
        createCard('K', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('8', 'spades'),
        createCard('2', 'hearts'),
      ];
      
      const royalResult = PokerEvaluator.evaluate(royalFlush);
      const pairResult = PokerEvaluator.evaluate(pair);
      
      expect(royalResult.score).toBeGreaterThan(pairResult.score);
    });

    it('should calculate score for high card', () => {
      const hand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('9', 'hearts'),
      ];
      const result = PokerEvaluator.evaluate(hand);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
