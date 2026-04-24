import { Card, HandResult } from '../types';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

const RANK_VALUES: { [key: string]: number } = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export class PokerEvaluator {
  /**
   * Evaluates a 5-card hand and returns the hand result
   */
  static evaluate(hand: Card[]): HandResult {
    if (hand.length !== 5) {
      throw new Error('Hand must contain exactly 5 cards');
    }

    // Filter out dead cards before evaluation - dead cards don't invalidate the hand,
    // they're simply ignored and don't count toward hand calculation
    const activeHand = hand.filter((card) => !card.isDead);

    // If we have no active cards, return high card
    if (activeHand.length === 0) {
      return {
        rank: 'high-card',
        multiplier: 0,
        score: 0,
        winningCards: [],
      };
    }

    // Separate wild cards from regular cards
    const wildCards = activeHand.filter((card) => card.isWild);
    const regularCards = activeHand.filter((card) => !card.isWild);

    // If we have wild cards, evaluate with best possible hand
    if (wildCards.length > 0) {
      return this.evaluateWithWildCards(regularCards, wildCards);
    }

    const sortedHand = [...activeHand].sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);

    const rankCounts = this.getRankCounts(sortedHand);
    const suitCounts = this.getSuitCounts(sortedHand);
    const ranks = sortedHand.map((c) => RANK_VALUES[c.rank]);
    // Flush requires all cards to be same suit (only check if we have 5 active cards)
    const isFlush =
      activeHand.length === 5 && Object.values(suitCounts).some((count) => count === 5);
    // Straight requires 5 cards in sequence (only check if we have 5 active cards)
    const isStraight = activeHand.length === 5 && this.isStraight(ranks);
    const isRoyal = isStraight && ranks.length === 5 && ranks[0] === 10 && ranks[4] === 14;

    // Royal Flush
    if (isRoyal && isFlush) {
      return {
        rank: 'royal-flush',
        multiplier: 0, // Set by reward table
        score: 10000,
        winningCards: sortedHand,
      };
    }

    // Straight Flush
    if (isStraight && isFlush) {
      return {
        rank: 'straight-flush',
        multiplier: 0,
        score: 9000 + ranks[4],
        winningCards: sortedHand,
      };
    }

    // Five of a Kind (only possible with wild cards)
    const fiveKind = Object.entries(rankCounts).find(([, count]) => count === 5);
    if (fiveKind) {
      const quintRank = parseInt(fiveKind[0]);
      return {
        rank: 'five-of-a-kind',
        multiplier: 0,
        score: 8500 + quintRank,
        winningCards: sortedHand,
      };
    }

    // Four of a Kind
    const fourKind = Object.entries(rankCounts).find(([, count]) => count === 4);
    if (fourKind) {
      const quadRank = parseInt(fourKind[0]);
      return {
        rank: 'four-of-a-kind',
        multiplier: 0,
        score: 8000 + quadRank,
        winningCards: sortedHand,
      };
    }

    // Full House
    const threeKind = Object.entries(rankCounts).find(([, count]) => count === 3);
    const pair = Object.entries(rankCounts).find(([, count]) => count === 2);
    if (threeKind && pair) {
      return {
        rank: 'full-house',
        multiplier: 0,
        score: 7000 + parseInt(threeKind[0]),
        winningCards: sortedHand,
      };
    }

    // Flush
    if (isFlush) {
      return {
        rank: 'flush',
        multiplier: 0,
        score: 6000 + ranks[4],
        winningCards: sortedHand,
      };
    }

    // Straight
    if (isStraight) {
      return {
        rank: 'straight',
        multiplier: 0,
        score: 5000 + ranks[4],
        winningCards: sortedHand,
      };
    }

    // Three of a Kind
    if (threeKind) {
      return {
        rank: 'three-of-a-kind',
        multiplier: 0,
        score: 4000 + parseInt(threeKind[0]),
        winningCards: sortedHand,
      };
    }

    // Two Pair
    const pairs = Object.entries(rankCounts).filter(([, count]) => count === 2);
    if (pairs.length === 2) {
      const highPair = Math.max(parseInt(pairs[0][0]), parseInt(pairs[1][0]));
      return {
        rank: 'two-pair',
        multiplier: 0,
        score: 3000 + highPair,
        winningCards: sortedHand,
      };
    }

    // One Pair (jacks or better only)
    if (pair) {
      const pairRank = parseInt(pair[0]);
      // Only score pairs at or above the minimum pair rank (e.g., Jacks or Better)
      if (pairRank >= getCurrentGameMode().minimumPairRank) {
        return {
          rank: 'one-pair',
          multiplier: 0,
          score: 2000 + pairRank,
          winningCards: sortedHand,
        };
      }
      // Lower pairs fall through to high card
    }

    // High Card
    const highestRank = ranks.length > 0 ? ranks[ranks.length - 1] : 0;
    return {
      rank: 'high-card',
      multiplier: 0,
      score: 1000 + highestRank,
      winningCards: sortedHand,
    };
  }

  /**
   * Evaluates a regular hand (no wild cards)
   */
  private static evaluateRegularHand(hand: Card[]): HandResult {
    const sortedHand = [...hand].sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);

    const rankCounts = this.getRankCounts(sortedHand);
    const suitCounts = this.getSuitCounts(sortedHand);
    const ranks = sortedHand.map((c) => RANK_VALUES[c.rank]);
    const isFlush = Object.values(suitCounts).some((count) => count === 5);
    const isStraight = this.isStraight(ranks);
    const isRoyal = isStraight && ranks[0] === 10 && ranks[4] === 14;

    // Royal Flush
    if (isRoyal && isFlush) {
      return {
        rank: 'royal-flush',
        multiplier: 0,
        score: 10000,
        winningCards: sortedHand,
      };
    }

    // Straight Flush
    if (isStraight && isFlush) {
      return {
        rank: 'straight-flush',
        multiplier: 0,
        score: 9000 + ranks[4],
        winningCards: sortedHand,
      };
    }

    // Five of a Kind (only possible with wild cards)
    const fiveKind = Object.entries(rankCounts).find(([, count]) => count === 5);
    if (fiveKind) {
      const quintRank = parseInt(fiveKind[0]);
      return {
        rank: 'five-of-a-kind',
        multiplier: 0,
        score: 8500 + quintRank,
        winningCards: sortedHand,
      };
    }

    // Four of a Kind
    const fourKind = Object.entries(rankCounts).find(([, count]) => count === 4);
    if (fourKind) {
      const quadRank = parseInt(fourKind[0]);
      return {
        rank: 'four-of-a-kind',
        multiplier: 0,
        score: 8000 + quadRank,
        winningCards: sortedHand,
      };
    }

    // Full House
    const threeKind = Object.entries(rankCounts).find(([, count]) => count === 3);
    const pair = Object.entries(rankCounts).find(([, count]) => count === 2);
    if (threeKind && pair) {
      return {
        rank: 'full-house',
        multiplier: 0,
        score: 7000 + parseInt(threeKind[0]),
        winningCards: sortedHand,
      };
    }

    // Flush
    if (isFlush) {
      return {
        rank: 'flush',
        multiplier: 0,
        score: 6000 + ranks[4],
        winningCards: sortedHand,
      };
    }

    // Straight
    if (isStraight) {
      return {
        rank: 'straight',
        multiplier: 0,
        score: 5000 + ranks[4],
        winningCards: sortedHand,
      };
    }

    // Three of a Kind
    if (threeKind) {
      return {
        rank: 'three-of-a-kind',
        multiplier: 0,
        score: 4000 + parseInt(threeKind[0]),
        winningCards: sortedHand,
      };
    }

    // Two Pair
    const pairs = Object.entries(rankCounts).filter(([, count]) => count === 2);
    if (pairs.length === 2) {
      const highPair = Math.max(parseInt(pairs[0][0]), parseInt(pairs[1][0]));
      return {
        rank: 'two-pair',
        multiplier: 0,
        score: 3000 + highPair,
        winningCards: sortedHand,
      };
    }

    // One Pair (jacks or better only)
    if (pair) {
      const pairRank = parseInt(pair[0]);
      if (pairRank >= 11) {
        return {
          rank: 'one-pair',
          multiplier: 0,
          score: 2000 + pairRank,
          winningCards: sortedHand,
        };
      }
    }

    // High Card
    return {
      rank: 'high-card',
      multiplier: 0,
      score: 1000 + ranks[4],
      winningCards: sortedHand,
    };
  }

  private static getRankCounts(hand: Card[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    for (const card of hand) {
      const rankValue = RANK_VALUES[card.rank].toString();
      counts[rankValue] = (counts[rankValue] || 0) + 1;
    }
    return counts;
  }

  private static getSuitCounts(hand: Card[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    for (const card of hand) {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
    }
    return counts;
  }

  private static isStraight(ranks: number[]): boolean {
    // Check for regular straight
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] !== ranks[i - 1] + 1) {
        // Check for A-2-3-4-5 straight (wheel)
        if (
          ranks[0] === 2 &&
          ranks[1] === 3 &&
          ranks[2] === 4 &&
          ranks[3] === 5 &&
          ranks[4] === 14
        ) {
          return true;
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Applies reward table multipliers to hand results
   */
  static applyRewards(result: HandResult, rewardTable: { [key: string]: number }): HandResult {
    return {
      ...result,
      multiplier: rewardTable[result.rank] || 0,
    };
  }

  /**
   * Evaluates hand with wild cards by trying to form the best possible hand
   * Wild cards can be any suit, rank, and face value
   */
  private static evaluateWithWildCards(regularCards: Card[], wildCards: Card[]): HandResult {
    const numWilds = wildCards.length;
    const numRegular = regularCards.length;
    const allRanks = Object.keys(RANK_VALUES) as Array<keyof typeof RANK_VALUES>;
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = [
      'hearts',
      'diamonds',
      'clubs',
      'spades',
    ];

    // Helper to rank hands - higher score = better hand
    const scoreHand = (result: HandResult): number => {
      const rankScore: { [key: string]: number } = {
        'royal-flush': 10000,
        'straight-flush': 9000,
        'five-of-a-kind': 8500,
        'four-of-a-kind': 8000,
        'full-house': 7000,
        flush: 6000,
        straight: 5000,
        'three-of-a-kind': 4000,
        'two-pair': 3000,
        'one-pair': 2000,
        'high-card': 1000,
      };
      return rankScore[result.rank] || 0;
    };

    let bestHand: HandResult | null = null;

    // Try Royal Flush (10, J, Q, K, A of same suit)
    if (numRegular + numWilds === 5) {
      const royalRanks: Array<keyof typeof RANK_VALUES> = ['10', 'J', 'Q', 'K', 'A'];
      for (const suit of suits) {
        const needed = royalRanks.filter(
          (r) => !regularCards.some((c) => c.rank === r && c.suit === suit)
        );
        if (needed.length <= numWilds) {
          const expanded = [...regularCards];
          for (let i = 0; i < needed.length; i++) {
            expanded.push({
              suit,
              rank: needed[i] as Card['rank'],
              id: `wild-royal-${i}`,
              isWild: true,
            });
          }
          // Fill remaining wilds
          for (let i = needed.length; i < numWilds; i++) {
            expanded.push({
              suit,
              rank: 'A' as Card['rank'],
              id: `wild-royal-fill-${i}`,
              isWild: true,
            });
          }
          const result = this.evaluateRegularHand(expanded);
          if (result.rank === 'royal-flush') {
            return result;
          }
        }
      }
    }

    // Try Straight Flush
    for (const suit of suits) {
      for (let startRank = 2; startRank <= 10; startRank++) {
        const needed: Array<keyof typeof RANK_VALUES> = [];
        for (let i = 0; i < 5; i++) {
          const rankValue = startRank + i;
          const rankStr = allRanks.find((r) => RANK_VALUES[r] === rankValue);
          if (rankStr && !regularCards.some((c) => c.rank === rankStr && c.suit === suit)) {
            needed.push(rankStr);
          }
        }
        if (needed.length <= numWilds) {
          const expanded = [...regularCards];
          for (const rank of needed) {
            expanded.push({
              suit,
              rank: rank as Card['rank'],
              id: `wild-sf-${rank}`,
              isWild: true,
            });
          }
          // Fill remaining wilds
          for (let i = needed.length; i < numWilds; i++) {
            expanded.push({
              suit,
              rank: 'A' as Card['rank'],
              id: `wild-sf-fill-${i}`,
              isWild: true,
            });
          }
          if (expanded.length === 5) {
            const result = this.evaluateRegularHand(expanded);
            if (result.rank === 'straight-flush') {
              if (!bestHand || scoreHand(result) > scoreHand(bestHand)) {
                bestHand = result;
              }
            }
          }
        }
      }
    }
    if (bestHand && bestHand.rank === 'straight-flush') {
      return bestHand;
    }

    // Try 5 of a kind (needs count + numWilds >= 5 for some rank)
    const rankCounts = this.getRankCounts(regularCards);
    for (const [rank, count] of Object.entries(rankCounts)) {
      if (count + numWilds >= 5) {
        const rankValue = parseInt(rank);
        const rankStr = allRanks.find((r) => RANK_VALUES[r] === rankValue) as Card['rank'] | undefined;
        if (rankStr) {
          const needed = 5 - count;
          const expanded = [...regularCards];
          for (let i = 0; i < needed; i++) {
            expanded.push({
              suit: 'hearts',
              rank: rankStr as Card['rank'],
              id: `wild-5k-${i}`,
              isWild: true,
            });
          }
          const result = this.evaluateRegularHand(expanded);
          if (result.rank === 'four-of-a-kind' || result.rank === 'five-of-a-kind') {
            const fiveKindResult: HandResult = {
              ...result,
              rank: 'five-of-a-kind',
              score: 8500 + rankValue,
            };
            if (!bestHand || scoreHand(fiveKindResult) > scoreHand(bestHand)) {
              bestHand = fiveKindResult;
            }
          }
        }
      }
    }
    if (bestHand && bestHand.rank === 'five-of-a-kind') {
      return bestHand;
    }

    // Try Four of a Kind
    for (const rank of allRanks) {
      const count = regularCards.filter((c) => c.rank === rank).length;
      if (count + numWilds >= 4) {
        const needed = Math.max(0, 4 - count);
        const expanded = [...regularCards];
        for (let i = 0; i < needed; i++) {
          expanded.push({
            suit: 'hearts',
            rank: rank as Card['rank'],
            id: `wild-4k-${i}`,
            isWild: true,
          });
        }
        // Fill remaining wilds
        for (let i = needed; i < numWilds; i++) {
          expanded.push({
            suit: 'hearts',
            rank: 'A',
            id: `wild-4k-fill-${i}`,
            isWild: true,
          });
        }
        // Add kicker if needed (e.g. 3 fives + 1 wild = 4 cards; need 5th for evaluation)
        const kickerRank = allRanks.find((r) => r !== rank) ?? '2';
        while (expanded.length < 5) {
          expanded.push({
            suit: 'hearts',
            rank: kickerRank as Card['rank'],
            id: `wild-4k-kicker-${expanded.length}`,
            isWild: false,
          });
        }
        if (expanded.length === 5) {
          const result = this.evaluateRegularHand(expanded);
          if (result.rank === 'four-of-a-kind' || result.rank === 'five-of-a-kind') {
            return result;
          }
        }
      }
    }

    // Try Full House (3 of a kind + pair)
    for (const rank1 of allRanks) {
      const count1 = regularCards.filter((c) => c.rank === rank1).length;
      if (count1 + numWilds >= 3) {
        const needed1 = Math.max(0, 3 - count1);
        for (const rank2 of allRanks) {
          if (rank2 === rank1) continue;
          const count2 = regularCards.filter((c) => c.rank === rank2).length;
          const remaining = numWilds - needed1;
          if (count2 + remaining >= 2) {
            const needed2 = Math.max(0, 2 - count2);
            if (needed2 <= remaining) {
              const expanded = [...regularCards];
              for (let i = 0; i < needed1; i++) {
                expanded.push({
                  suit: 'hearts',
                  rank: rank1 as Card['rank'],
                  id: `wild-fh-3k-${i}`,
                  isWild: true,
                });
              }
              for (let i = 0; i < needed2; i++) {
                expanded.push({
                  suit: 'diamonds',
                  rank: rank2 as Card['rank'],
                  id: `wild-fh-2k-${i}`,
                  isWild: true,
                });
              }
              // Fill remaining
              const filled = needed1 + needed2;
              for (let i = filled; i < numWilds; i++) {
                expanded.push({
                  suit: 'clubs',
                  rank: 'A',
                  id: `wild-fh-fill-${i}`,
                  isWild: true,
                });
              }
              if (expanded.length === 5) {
                const result = this.evaluateRegularHand(expanded);
                if (result.rank === 'full-house') {
                  return result;
                }
              }
            }
          }
        }
      }
    }

    // Try Flush
    for (const suit of suits) {
      const count = regularCards.filter((c) => c.suit === suit).length;
      if (count + numWilds >= 5) {
        const needed = 5 - count;
        const expanded = regularCards.filter((c) => c.suit === suit);
        const usedRanks = new Set<Card['rank']>(expanded.map((c) => c.rank));
        for (let i = 0; i < needed; i++) {
          const availableRank = allRanks.find((r) => !usedRanks.has(r as Card['rank'])) as Card['rank'] | undefined;
          if (availableRank) {
            const rankToUse = availableRank as Card['rank'];
            expanded.push({
              suit,
              rank: rankToUse,
              id: `wild-flush-${i}`,
              isWild: true,
            });
            usedRanks.add(rankToUse);
          }
        }
        // Fill remaining
        const filled = needed;
        for (let i = filled; i < numWilds; i++) {
          expanded.push({
            suit,
            rank: 'A',
            id: `wild-flush-fill-${i}`,
            isWild: true,
          });
        }
        if (expanded.length === 5) {
          const result = this.evaluateRegularHand(expanded);
          if (
            result.rank === 'flush' ||
            result.rank === 'straight-flush' ||
            result.rank === 'royal-flush'
          ) {
            return result;
          }
        }
      }
    }

    // Try Straight (including wheel A-2-3-4-5)
    // Wheel: ranks 2, 3, 4, 5, A (Ace low)
    const wheelRanks: Array<keyof typeof RANK_VALUES> = ['2', '3', '4', '5', 'A'];
    const wheelNeeded = wheelRanks.filter((r) => !regularCards.some((c) => c.rank === r));
    if (wheelNeeded.length <= numWilds) {
      const expanded = [...regularCards];
      for (const rank of wheelNeeded) {
        expanded.push({
          suit: 'hearts',
          rank: rank as Card['rank'],
          id: `wild-straight-wheel-${rank}`,
          isWild: true,
        });
      }
      for (let i = wheelNeeded.length; i < numWilds; i++) {
        expanded.push({
          suit: 'hearts',
          rank: 'A' as Card['rank'],
          id: `wild-straight-wheel-fill-${i}`,
          isWild: true,
        });
      }
      if (expanded.length === 5) {
        const result = this.evaluateRegularHand(expanded);
        if (result.rank === 'straight') {
          if (!bestHand || scoreHand(result) > scoreHand(bestHand)) {
            bestHand = result;
          }
        }
      }
    }

    for (let startRank = 2; startRank <= 10; startRank++) {
      const needed: Array<keyof typeof RANK_VALUES> = [];
      for (let i = 0; i < 5; i++) {
        const rankValue = startRank + i;
        const rankStr = allRanks.find((r) => RANK_VALUES[r] === rankValue);
        if (rankStr && !regularCards.some((c) => c.rank === rankStr)) {
          needed.push(rankStr);
        }
      }
      if (needed.length <= numWilds) {
        const expanded = [...regularCards];
        for (const rank of needed) {
          expanded.push({
            suit: 'hearts',
            rank: rank as Card['rank'],
            id: `wild-straight-${rank}`,
            isWild: true,
          });
        }
        // Fill remaining
        for (let i = needed.length; i < numWilds; i++) {
          expanded.push({
            suit: 'hearts',
            rank: 'A' as Card['rank'],
            id: `wild-straight-fill-${i}`,
            isWild: true,
          });
        }
        if (expanded.length === 5) {
          const result = this.evaluateRegularHand(expanded);
          if (result.rank === 'straight') {
            if (!bestHand || scoreHand(result) > scoreHand(bestHand)) {
              bestHand = result;
            }
          }
        }
      }
    }
    if (bestHand && bestHand.rank === 'straight') {
      return bestHand;
    }

    // Try Three of a Kind
    for (const rank of allRanks) {
      const count = regularCards.filter((c) => c.rank === rank).length;
      if (count + numWilds >= 3) {
        const needed = Math.max(0, 3 - count);
        const expanded = [...regularCards];
        for (let i = 0; i < needed; i++) {
          expanded.push({
            suit: 'hearts',
            rank: rank as Card['rank'],
            id: `wild-3k-${i}`,
            isWild: true,
          });
        }
        // Fill remaining wilds to reach 5 cards if possible
        while (expanded.length < 5 && expanded.length - regularCards.length < numWilds) {
          expanded.push({
            suit: 'hearts',
            rank: 'A',
            id: `wild-3k-fill-${expanded.length}`,
            isWild: true,
          });
        }
        // Evaluate if we have at least 3 cards
        if (expanded.length >= 3) {
          const result = this.evaluateRegularHand(expanded);
          if (result.rank === 'three-of-a-kind') {
            return result;
          }
        }
      }
    }

    // Try Two Pair
    for (let i = 0; i < allRanks.length; i++) {
      const rank1 = allRanks[i];
      const count1 = regularCards.filter((c) => c.rank === rank1).length;
      if (count1 + numWilds < 2) continue;

      const needed1 = Math.max(0, 2 - count1);
      for (let j = i + 1; j < allRanks.length; j++) {
        const rank2 = allRanks[j];
        const count2 = regularCards.filter((c) => c.rank === rank2).length;
        const remaining = numWilds - needed1;
        if (count2 + remaining >= 2) {
          const needed2 = Math.max(0, 2 - count2);
          if (needed2 <= remaining) {
            const expanded = [...regularCards];
            for (let k = 0; k < needed1; k++) {
              expanded.push({
                suit: 'hearts',
                rank: rank1 as Card['rank'],
                id: `wild-2p-1-${k}`,
                isWild: true,
              });
            }
            for (let k = 0; k < needed2; k++) {
              expanded.push({
                suit: 'diamonds',
                rank: rank2 as Card['rank'],
                id: `wild-2p-2-${k}`,
                isWild: true,
              });
            }
            // Fill remaining wilds to reach 5 cards if possible
            while (expanded.length < 5 && expanded.length - regularCards.length < numWilds) {
              expanded.push({
                suit: 'clubs',
                rank: 'A',
                id: `wild-2p-fill-${expanded.length}`,
                isWild: true,
              });
            }
            // Evaluate if we have at least 4 cards (two pairs)
            if (expanded.length >= 4) {
              const result = this.evaluateRegularHand(expanded);
              if (result.rank === 'two-pair') {
                return result;
              }
            }
          }
        }
      }
    }

    // Try One Pair (Jacks or better with wilds)
    for (const rank of allRanks) {
      const rankValue = RANK_VALUES[rank];
      if (rankValue < getCurrentGameMode().minimumPairRank) continue;

      const count = regularCards.filter((c) => c.rank === rank).length;
      if (count + numWilds >= 2) {
        const needed = Math.max(0, 2 - count);
        const expanded = [...regularCards];
        for (let i = 0; i < needed; i++) {
          expanded.push({
            suit: 'hearts',
            rank: rank as Card['rank'],
            id: `wild-pair-${i}`,
            isWild: true,
          });
        }
        // Fill remaining wilds to reach 5 cards if possible
        while (expanded.length < 5 && expanded.length - regularCards.length < numWilds) {
          expanded.push({
            suit: 'hearts',
            rank: 'A',
            id: `wild-pair-fill-${expanded.length}`,
            isWild: true,
          });
        }
        // Evaluate if we have at least 2 cards (one pair)
        if (expanded.length >= 2) {
          const result = this.evaluateRegularHand(expanded);
          if (result.rank === 'one-pair') {
            return result;
          }
        }
      }
    }

    // Default: use wilds as high cards (Aces)
    const expanded: Card[] = [...regularCards];
    for (let i = 0; i < numWilds; i++) {
      expanded.push({
        suit: 'hearts',
        rank: 'A',
        id: `wild-default-${i}`,
        isWild: true,
      });
    }
    return this.evaluateRegularHand(expanded);
  }
}
