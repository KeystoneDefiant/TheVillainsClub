import { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }
  return deck;
}

export function createFullDeck(deadCards: Card[] = [], removedCards: Card[] = [], wildCards: Card[] = []): Card[] {
  const deck = createDeck();
  const removedCardIds = new Set(removedCards.map(card => card.id));
  const filteredDeck = deck.filter(card => !removedCardIds.has(card.id));
  
  // Add dead cards and wild cards to the deck, but filter out any that are in removedCards
  const filteredDeadCards = deadCards.filter(card => !removedCardIds.has(card.id));
  const filteredWildCards = wildCards.filter(card => !removedCardIds.has(card.id));
  
  return [...filteredDeck, ...filteredDeadCards, ...filteredWildCards];
}

/**
 * Fisher-Yates shuffle algorithm
 * Deterministic if seed is provided
 */
export function shuffleDeck<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  let random: () => number;
  
  if (seed !== undefined) {
    // Simple seeded random number generator (Linear Congruential Generator)
    let seedValue = seed;
    random = () => {
      seedValue = (seedValue * 1664525 + 1013904223) % 2 ** 32;
      return seedValue / 2 ** 32;
    };
  } else {
    random = Math.random;
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Remove cards from deck (immutable)
 */
export function removeCardsFromDeck(deck: Card[], cardsToRemove: Card[]): Card[] {
  const cardIds = new Set(cardsToRemove.map(card => card.id));
  return deck.filter(card => !cardIds.has(card.id));
}
