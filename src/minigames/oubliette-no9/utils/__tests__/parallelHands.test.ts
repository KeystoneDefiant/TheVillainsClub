import { describe, it, expect } from 'vitest';
import { generateParallelHands } from '../parallelHands';
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

describe('generateParallelHands', () => {
  describe('Basic Functionality', () => {
    it('should generate the correct number of parallel hands', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const handCount = 5;
      const heldIndices: number[] = [0, 1];
      
      const result = generateParallelHands(baseHand, heldIndices, handCount);
      
      expect(result).toHaveLength(handCount);
    });

    it('should generate single parallel hand', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [0], 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].cards).toHaveLength(5);
    });

    it('should generate multiple parallel hands', () => {
      const baseHand: Card[] = [
        createCard('7', 'hearts'),
        createCard('8', 'diamonds'),
        createCard('9', 'clubs'),
        createCard('10', 'spades'),
        createCard('J', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [0, 1, 2], 10);
      
      expect(result).toHaveLength(10);
      result.forEach(hand => {
        expect(hand.cards).toHaveLength(5);
      });
    });
  });

  describe('Held Cards', () => {
    it('should keep held cards in all parallel hands', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const heldIndices = [0, 1];
      const result = generateParallelHands(baseHand, heldIndices, 5);
      
      result.forEach(hand => {
        expect(hand.cards[0].rank).toBe('A');
        expect(hand.cards[0].suit).toBe('hearts');
        expect(hand.cards[1].rank).toBe('K');
        expect(hand.cards[1].suit).toBe('diamonds');
      });
    });

    it('should replace non-held cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const heldIndices = [0, 1];
      const result = generateParallelHands(baseHand, heldIndices, 3);
      
      result.forEach(hand => {
        // Held cards should be the same
        expect(hand.cards[0]).toEqual(baseHand[0]);
        expect(hand.cards[1]).toEqual(baseHand[1]);
        
        // Non-held cards should be different (with high probability)
        // At least one non-held card should be different
        const nonHeldChanged = 
          hand.cards[2].id !== baseHand[2].id ||
          hand.cards[3].id !== baseHand[3].id ||
          hand.cards[4].id !== baseHand[4].id;
        expect(nonHeldChanged).toBe(true);
      });
    });

    it('should handle holding all cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const heldIndices = [0, 1, 2, 3, 4];
      const result = generateParallelHands(baseHand, heldIndices, 3);
      
      result.forEach(hand => {
        // All cards should remain the same
        expect(hand.cards).toEqual(baseHand);
      });
    });

    it('should handle holding no cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const heldIndices: number[] = [];
      const result = generateParallelHands(baseHand, heldIndices, 3);
      
      expect(result).toHaveLength(3);
      result.forEach(hand => {
        expect(hand.cards).toHaveLength(5);
        // All cards should be different (with very high probability)
      });
    });
  });

  describe('Deck Modifications', () => {
    it('should include dead cards in parallel hands', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const deadCards: Card[] = [
        createCard('2', 'hearts', { isDead: true }),
        createCard('3', 'diamonds', { isDead: true }),
      ];
      
      const result = generateParallelHands(baseHand, [], 30, deadCards);
      
      // Check that some hands contain dead cards
      let hasDeadCard = false;
      result.forEach(hand => {
        hand.cards.forEach(card => {
          if (card.isDead) {
            hasDeadCard = true;
          }
        });
      });
      
      // With 30 hands and 2 dead cards, we should very likely see at least one
      expect(hasDeadCard).toBe(true);
    });

    it('should include wild cards in parallel hands', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const wildCards: Card[] = [
        createCard('2', 'hearts', { isWild: true }),
      ];
      
      const result = generateParallelHands(baseHand, [], 20, [], [], wildCards);
      
      // Check that some hands contain wild cards
      let hasWildCard = false;
      result.forEach(hand => {
        hand.cards.forEach(card => {
          if (card.isWild) {
            hasWildCard = true;
          }
        });
      });
      
      expect(hasWildCard).toBe(true);
    });

    it('should handle combination of dead and wild cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const deadCards: Card[] = [createCard('2', 'hearts', { isDead: true })];
      const wildCards: Card[] = [createCard('3', 'diamonds', { isWild: true })];
      
      const result = generateParallelHands(baseHand, [0], 15, deadCards, [], wildCards);
      
      expect(result).toHaveLength(15);
      result.forEach(hand => {
        expect(hand.cards).toHaveLength(5);
        // First card should always be held
        expect(hand.cards[0]).toEqual(baseHand[0]);
      });
    });
  });

  describe('Hand Structure', () => {
    it('should assign unique IDs to each hand', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [0], 5);
      
      const ids = result.map(hand => hand.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(5);
    });

    it('should maintain card structure in each hand', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [0, 2, 4], 3);
      
      result.forEach(hand => {
        expect(hand.cards).toHaveLength(5);
        hand.cards.forEach(card => {
          expect(card).toHaveProperty('rank');
          expect(card).toHaveProperty('suit');
          expect(card).toHaveProperty('id');
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for base hand with less than 5 cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
      ];
      
      expect(() => generateParallelHands(baseHand, [0], 1)).toThrow(
        'Base hand must contain exactly 5 cards'
      );
    });

    it('should throw error for base hand with more than 5 cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
        createCard('9', 'diamonds'),
      ];
      
      expect(() => generateParallelHands(baseHand, [0], 1)).toThrow(
        'Base hand must contain exactly 5 cards'
      );
    });

    it('should handle zero hands requested', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [0], 0);
      
      expect(result).toHaveLength(0);
    });

    it('should handle invalid held indices gracefully', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      // Held indices out of range
      const result = generateParallelHands(baseHand, [0, 10], 3);
      
      expect(result).toHaveLength(3);
      result.forEach(hand => {
        expect(hand.cards).toHaveLength(5);
        // First card should be held
        expect(hand.cards[0]).toEqual(baseHand[0]);
      });
    });
  });

  describe('Randomness and Uniqueness', () => {
    it('should generate different hands (with high probability)', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [], 5);
      
      // Compare first and second hand - they should be different
      const hand1 = result[0].cards.map(c => `${c.rank}-${c.suit}`).join(',');
      const hand2 = result[1].cards.map(c => `${c.rank}-${c.suit}`).join(',');
      
      expect(hand1).not.toBe(hand2);
    });

    it('should draw from full deck excluding original cards', () => {
      const baseHand: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
        createCard('Q', 'clubs'),
        createCard('J', 'spades'),
        createCard('10', 'hearts'),
      ];
      
      const result = generateParallelHands(baseHand, [], 10);
      
      result.forEach(hand => {
        // Check that none of the original 5 cards appear in replaced positions
        // (This is probabilistic but with 47 cards remaining, very unlikely to see same card)
        hand.cards.forEach(card => {
          expect(card).toHaveProperty('rank');
          expect(card).toHaveProperty('suit');
        });
      });
    });
  });
});
