import { Card, Hand } from '../types';
import { createFullDeck, shuffleDeck, removeCardsFromDeck } from './deck';

/**
 * Generates N parallel hands from a base hand and held indices.
 * Each hand draws from a fresh 52-card deck minus the original 5 cards dealt.
 * 
 * @param baseHand - The original 5 cards dealt to the player
 * @param heldIndices - Indices of cards to hold (0-4)
 * @param handCount - Number of parallel hands to generate
 * @param deadCards - Dead cards to include in deck
 * @param removedCards - Cards removed from deck
 * @returns Array of parallel hands
 */
export function generateParallelHands(
  baseHand: Card[],
  heldIndices: number[],
  handCount: number,
  deadCards: Card[] = [],
  removedCards: Card[] = [],
  wildCards: Card[] = []
): Hand[] {
  if (baseHand.length !== 5) {
    throw new Error('Base hand must contain exactly 5 cards');
  }

  const parallelHands: Hand[] = [];

  for (let i = 0; i < handCount; i++) {
    // Create a fresh deck for each hand
    const fullDeck = createFullDeck(deadCards, removedCards, wildCards);
    
    // Remove the original 5 cards from the deck
    const availableDeck = removeCardsFromDeck(fullDeck, baseHand);
    
    // Shuffle with a seed based on hand index for determinism (optional)
    const shuffledDeck = shuffleDeck(availableDeck, i);
    
    // Build the parallel hand: held cards + new draws
    const newHand: Card[] = [...baseHand];
    
    // Track how many cards we've drawn
    let drawIndex = 0;
    
    // Replace non-held cards with draws from the shuffled deck
    for (let j = 0; j < 5; j++) {
      if (!heldIndices.includes(j)) {
        const drawnCard = shuffledDeck[drawIndex];
        if (drawnCard) {
          newHand[j] = drawnCard;
          drawIndex++;
        }
      }
    }

    parallelHands.push({
      cards: newHand,
      id: `parallel-hand-${i}`,
    });
  }

  return parallelHands;
}
