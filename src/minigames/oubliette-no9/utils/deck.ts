import { Card } from '../types';
import * as SharedDeck from '@/game/poker/deck';

export function createDeck(): Card[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return SharedDeck.createDeck() as any;
}

export function createFullDeck(deadCards: Card[] = [], removedCards: Card[] = [], wildCards: Card[] = []): Card[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return SharedDeck.createFullDeck(deadCards as any, removedCards as any, wildCards as any) as any;
}

/**
 * Fisher-Yates shuffle algorithm
 * Deterministic if seed is provided
 */
export function shuffleDeck<T>(array: T[], seed?: number): T[] {
  return SharedDeck.shuffleDeck(array, seed);
}

/**
 * Remove cards from deck (immutable)
 */
export function removeCardsFromDeck(deck: Card[], cardsToRemove: Card[]): Card[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return SharedDeck.removeCardsFromDeck(deck as any, cardsToRemove as any) as any;
}
