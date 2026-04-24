import { describe, it, expect } from 'vitest';
import { createDeck, createFullDeck, shuffleDeck, removeCardsFromDeck } from '../deck';
import { Card } from '../../types';

// Helper function to create a card
function createCard(rank: Card['rank'], suit: Card['suit'], options?: Partial<Card>): Card {
  return {
    rank,
    suit,
    id: `${suit}-${rank}`,
    ...options,
  };
}

describe('Deck Operations', () => {
  describe('createDeck', () => {
    it('should create a standard 52-card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 13 cards of each suit', () => {
      const deck = createDeck();
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      
      suits.forEach(suit => {
        const cardsOfSuit = deck.filter(card => card.suit === suit);
        expect(cardsOfSuit).toHaveLength(13);
      });
    });

    it('should have 4 cards of each rank', () => {
      const deck = createDeck();
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      
      ranks.forEach(rank => {
        const cardsOfRank = deck.filter(card => card.rank === rank);
        expect(cardsOfRank).toHaveLength(4);
      });
    });

    it('should assign unique IDs to each card', () => {
      const deck = createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(52);
    });

    it('should have cards in expected order', () => {
      const deck = createDeck();
      
      // First card should be 2 of hearts
      expect(deck[0].rank).toBe('2');
      expect(deck[0].suit).toBe('hearts');
      
      // Last card should be A of spades
      expect(deck[51].rank).toBe('A');
      expect(deck[51].suit).toBe('spades');
    });

    it('should create new deck instance each time', () => {
      const deck1 = createDeck();
      const deck2 = createDeck();
      
      expect(deck1).not.toBe(deck2);
      expect(deck1).toEqual(deck2);
    });
  });

  describe('createFullDeck', () => {
    it('should create standard deck with no modifications', () => {
      const deck = createFullDeck();
      expect(deck).toHaveLength(52);
    });

    it('should include dead cards in the deck', () => {
      const deadCards: Card[] = [
        createCard('2', 'hearts', { isDead: true, id: 'dead-1' }),
        createCard('3', 'diamonds', { isDead: true, id: 'dead-2' }),
      ];
      
      const deck = createFullDeck(deadCards);
      
      expect(deck.length).toBe(54); // 52 + 2 dead cards
      
      const deadCardsInDeck = deck.filter(card => card.isDead);
      expect(deadCardsInDeck).toHaveLength(2);
    });

    it('should include wild cards in the deck', () => {
      const wildCards: Card[] = [
        createCard('A', 'hearts', { isWild: true, id: 'wild-1' }),
      ];
      
      const deck = createFullDeck([], [], wildCards);
      
      expect(deck.length).toBe(53); // 52 + 1 wild card
      
      const wildCardsInDeck = deck.filter(card => card.isWild);
      expect(wildCardsInDeck).toHaveLength(1);
    });

    it('should exclude removed cards from the deck', () => {
      const removedCards: Card[] = [
        createCard('2', 'hearts'),
        createCard('3', 'diamonds'),
      ];
      
      const deck = createFullDeck([], removedCards);
      
      expect(deck.length).toBe(50); // 52 - 2 removed cards
      
      // Verify removed cards are not in deck
      const has2Hearts = deck.some(card => card.rank === '2' && card.suit === 'hearts');
      const has3Diamonds = deck.some(card => card.rank === '3' && card.suit === 'diamonds');
      
      expect(has2Hearts).toBe(false);
      expect(has3Diamonds).toBe(false);
    });

    it('should handle combination of dead, wild, and removed cards', () => {
      const deadCards: Card[] = [
        createCard('2', 'hearts', { isDead: true, id: 'dead-1' }),
      ];
      const removedCards: Card[] = [
        createCard('3', 'diamonds'),
      ];
      const wildCards: Card[] = [
        createCard('A', 'hearts', { isWild: true, id: 'wild-1' }),
      ];
      
      const deck = createFullDeck(deadCards, removedCards, wildCards);
      
      // 52 - 1 removed + 1 dead + 1 wild = 53
      expect(deck.length).toBe(53);
    });

    it('should not include dead cards that are also removed', () => {
      const deadCard = createCard('2', 'hearts', { isDead: true, id: 'dead-1' });
      const deadCards: Card[] = [deadCard];
      const removedCards: Card[] = [deadCard];
      
      const deck = createFullDeck(deadCards, removedCards);
      
      // Dead card should be filtered out because it's also removed
      const deadCardsInDeck = deck.filter(card => card.id === 'dead-1');
      expect(deadCardsInDeck).toHaveLength(0);
    });

    it('should not include wild cards that are also removed', () => {
      const wildCard = createCard('A', 'hearts', { isWild: true, id: 'wild-1' });
      const wildCards: Card[] = [wildCard];
      const removedCards: Card[] = [wildCard];
      
      const deck = createFullDeck([], removedCards, wildCards);
      
      // Wild card should be filtered out because it's also removed
      const wildCardsInDeck = deck.filter(card => card.id === 'wild-1');
      expect(wildCardsInDeck).toHaveLength(0);
    });
  });

  describe('shuffleDeck', () => {
    it('should shuffle the deck', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      expect(shuffled).toHaveLength(52);
      
      // Check that shuffled deck is different from original (very high probability)
      const isDifferent = shuffled.some((card, index) => card.id !== deck[index].id);
      expect(isDifferent).toBe(true);
    });

    it('should not modify the original deck', () => {
      const deck = createDeck();
      const originalFirst = deck[0];
      
      shuffleDeck(deck);
      
      expect(deck[0]).toEqual(originalFirst);
    });

    it('should produce different results without seed', () => {
      const deck = createDeck();
      const shuffled1 = shuffleDeck(deck);
      const shuffled2 = shuffleDeck(deck);
      
      // Two shuffles should be different (very high probability)
      const isDifferent = shuffled1.some((card, index) => card.id !== shuffled2[index].id);
      expect(isDifferent).toBe(true);
    });

    it('should produce same result with same seed', () => {
      const deck = createDeck();
      const seed = 12345;
      
      const shuffled1 = shuffleDeck(deck, seed);
      const shuffled2 = shuffleDeck(deck, seed);
      
      expect(shuffled1).toEqual(shuffled2);
    });

    it('should produce different results with different seeds', () => {
      const deck = createDeck();
      
      const shuffled1 = shuffleDeck(deck, 123);
      const shuffled2 = shuffleDeck(deck, 456);
      
      const isDifferent = shuffled1.some((card, index) => card.id !== shuffled2[index].id);
      expect(isDifferent).toBe(true);
    });

    it('should maintain all cards after shuffle', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      // Check that all original cards are still present
      deck.forEach(originalCard => {
        const found = shuffled.some(card => card.id === originalCard.id);
        expect(found).toBe(true);
      });
    });

    it('should shuffle empty array', () => {
      const empty: Card[] = [];
      const shuffled = shuffleDeck(empty);
      
      expect(shuffled).toHaveLength(0);
    });

    it('should handle single card', () => {
      const singleCard = [createCard('A', 'hearts')];
      const shuffled = shuffleDeck(singleCard);
      
      expect(shuffled).toHaveLength(1);
      expect(shuffled[0]).toEqual(singleCard[0]);
    });

    it('should work with generic type', () => {
      const numbers = [1, 2, 3, 4, 5];
      const shuffled = shuffleDeck(numbers);
      
      expect(shuffled).toHaveLength(5);
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('removeCardsFromDeck', () => {
    it('should remove specified cards from deck', () => {
      const deck = createDeck();
      const cardsToRemove: Card[] = [
        createCard('A', 'hearts'),
        createCard('K', 'diamonds'),
      ];
      
      const filteredDeck = removeCardsFromDeck(deck, cardsToRemove);
      
      expect(filteredDeck).toHaveLength(50);
      
      // Verify removed cards are not in deck
      const hasAHearts = filteredDeck.some(
        card => card.rank === 'A' && card.suit === 'hearts'
      );
      const hasKDiamonds = filteredDeck.some(
        card => card.rank === 'K' && card.suit === 'diamonds'
      );
      
      expect(hasAHearts).toBe(false);
      expect(hasKDiamonds).toBe(false);
    });

    it('should not modify the original deck', () => {
      const deck = createDeck();
      const originalLength = deck.length;
      const cardsToRemove: Card[] = [createCard('A', 'hearts')];
      
      removeCardsFromDeck(deck, cardsToRemove);
      
      expect(deck).toHaveLength(originalLength);
    });

    it('should handle removing no cards', () => {
      const deck = createDeck();
      const filteredDeck = removeCardsFromDeck(deck, []);
      
      expect(filteredDeck).toHaveLength(52);
    });

    it('should handle removing cards not in deck', () => {
      const deck = createDeck();
      const cardsToRemove: Card[] = [
        createCard('A', 'hearts', { id: 'non-existent' }),
      ];
      
      const filteredDeck = removeCardsFromDeck(deck, cardsToRemove);
      
      // Should still have all 52 cards since the ID doesn't match
      expect(filteredDeck).toHaveLength(52);
    });

    it('should remove multiple copies if present', () => {
      const card1 = createCard('A', 'hearts', { id: 'card-1' });
      const card2 = createCard('K', 'diamonds', { id: 'card-2' });
      const card3 = createCard('A', 'hearts', { id: 'card-1' }); // Same ID as card1
      
      const deck = [card1, card2, card3];
      const cardsToRemove = [card1];
      
      const filteredDeck = removeCardsFromDeck(deck, cardsToRemove);
      
      // Both instances with id 'card-1' should be removed
      expect(filteredDeck).toHaveLength(1);
      expect(filteredDeck[0]).toEqual(card2);
    });

    it('should work with special cards (dead, wild)', () => {
      const normalCard = createCard('A', 'hearts');
      const deadCard = createCard('2', 'diamonds', { isDead: true, id: 'dead-1' });
      const wildCard = createCard('3', 'clubs', { isWild: true, id: 'wild-1' });
      
      const deck = [normalCard, deadCard, wildCard];
      const cardsToRemove = [deadCard];
      
      const filteredDeck = removeCardsFromDeck(deck, cardsToRemove);
      
      expect(filteredDeck).toHaveLength(2);
      expect(filteredDeck).toContainEqual(normalCard);
      expect(filteredDeck).toContainEqual(wildCard);
    });

    it('should handle removing all cards', () => {
      const deck = createDeck();
      const filteredDeck = removeCardsFromDeck(deck, deck);
      
      expect(filteredDeck).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should create, modify, and shuffle deck correctly', () => {
      const deadCards: Card[] = [
        createCard('2', 'hearts', { isDead: true, id: 'dead-1' }),
      ];
      const removedCards: Card[] = [
        createCard('3', 'diamonds'),
      ];
      const wildCards: Card[] = [
        createCard('A', 'hearts', { isWild: true, id: 'wild-1' }),
      ];
      
      // Create full deck with modifications
      const fullDeck = createFullDeck(deadCards, removedCards, wildCards);
      
      // Shuffle the deck
      const shuffled = shuffleDeck(fullDeck, 12345);
      
      expect(shuffled).toHaveLength(53);
      
      // Verify special cards are still present
      const hasDeadCard = shuffled.some(card => card.isDead);
      const hasWildCard = shuffled.some(card => card.isWild);
      
      expect(hasDeadCard).toBe(true);
      expect(hasWildCard).toBe(true);
    });

    it('should remove cards from shuffled deck', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck, 12345);
      
      const cardsToRemove = shuffled.slice(0, 5);
      const filtered = removeCardsFromDeck(shuffled, cardsToRemove);
      
      expect(filtered).toHaveLength(47);
    });
  });
});
