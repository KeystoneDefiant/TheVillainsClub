import { Card, RewardTable } from '../types';
import { PokerEvaluator } from './pokerEvaluator';

/**
 * Finds the 3 best possible cards from the deck that would create
 * the best hand when combined with the current player hand
 * 
 * Tests replacing ALL 5 positions in the current hand to find the absolute
 * best possible hand, regardless of what's currently held.
 * 
 * @param playerHand Current 5-card hand
 * @param availableDeck Remaining cards in deck
 * @param rewardTable Reward multipliers
 * @param betAmount Current bet amount
 * @returns Array of 3 best cards, sorted by potential value (highest first)
 */
export function findBestDevilsDealCards(
  playerHand: Card[],
  availableDeck: Card[],
  rewardTable: RewardTable,
  betAmount: number
): Card[] {
  if (playerHand.length !== 5) {
    throw new Error('Player hand must contain exactly 5 cards');
  }

  // Track best result for each card
  const cardResults: Array<{
    card: Card;
    bestPayout: number;
    bestRank: string;
  }> = [];

  // For each card in available deck
  for (const card of availableDeck) {
    let bestPayout = 0;
    let bestRank = 'high-card';

    // Test replacing ALL 5 positions in playerHand
    for (let position = 0; position < 5; position++) {
      // Create test hand by replacing this position
      const testHand = [...playerHand];
      testHand[position] = card;

      // Evaluate the hand
      const result = PokerEvaluator.evaluate(testHand);
      const withRewards = PokerEvaluator.applyRewards(result, rewardTable);

      // Calculate potential payout per hand: multiplier * betAmount
      // (We multiply by selectedHandCount when calculating total cost, not here)
      const payout = withRewards.multiplier * betAmount;

      // Track the best result across all 5 positions for this card
      if (payout > bestPayout) {
        bestPayout = payout;
        bestRank = result.rank;
      }
    }

    cardResults.push({
      card,
      bestPayout,
      bestRank,
    });
  }

  // Sort by best potential value (highest payout first)
  cardResults.sort((a, b) => b.bestPayout - a.bestPayout);

  // Return top 3 cards
  return cardResults.slice(0, 3).map((result) => result.card);
}
