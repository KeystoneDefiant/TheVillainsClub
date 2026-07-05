import { Suit, Rank } from '@/game/poker/types';

export interface LigneeRoyaleGameModeConfig {
  displayName: string;
  buyIn: number;
  maxReturnMultipleOfBuyIn: number;
  startingCredits: number;
  minBet: number;
  maxBet: number;
  maxPayout: number;

  maxWildCards: number;
  maxWild2xCards: number;
  maxWild3xCards: number;
  maxWild5xCards: number;
  maxDeadCards: number;

  deckComposition: {
    suits: Suit[];
    ranks: Rank[];
  };

  rewards: Record<string, number>;
  minimumPairRank: number;
}

export const ligneeRoyaleGameConfig = {
  defaultGameMode: {
    displayName: "Normal Game",
    buyIn: 2000,
    maxReturnMultipleOfBuyIn: 50,
    startingCredits: 2000,
    minBet: 10,
    maxBet: 200,
    maxPayout: 100000,

    // Adjusted special card settings for balanced slot machine RTP (~95%)
    maxWildCards: 3,      // 1x standard wild
    maxWild2xCards: 1,    // 2x multiplier wild
    maxWild3xCards: 0,    // 3x multiplier wild (0 by default)
    maxWild5xCards: 0,    // 5x multiplier wild (0 by default)
    maxDeadCards: 4,      // dead cards

    deckComposition: {
      suits: ['hearts', 'diamonds', 'clubs', 'spades'] as Suit[],
      ranks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as Rank[],
    },

    // Lower payouts to balance slots RTP since we deal 15 cards directly without discards
    rewards: {
      'royal-flush': 150,
      'five-of-a-kind': 80,
      'straight-flush': 40,
      'four-of-a-kind': 15,
      'full-house': 7,
      'flush': 5,
      'straight': 3,
      'three-of-a-kind': 2,
      'two-pair': 1,
      'one-pair': 1, // Jacks or Better
      'high-card': 0,
    },
    minimumPairRank: 11, // Jacks or Better
  },
  gameModes: {
    normalGame: {},
    highStakes: {
      displayName: "High Stakes",
      buyIn: 10000,
      startingCredits: 10000,
      maxReturnMultipleOfBuyIn: 100,
      minBet: 25,
      maxBet: 2500,
      maxWildCards: 0,
      maxWild2xCards: 1,
      maxWild3xCards: 1,
      maxWild5xCards: 1,
      maxDeadCards: 14,
    }
  }
} as const;

export type LigneeRoyaleGameConfig = typeof ligneeRoyaleGameConfig;

// Standard merge logic to get resolved configurations
export function resolveLigneeRoyaleGameMode(modeId: string | undefined): LigneeRoyaleGameModeConfig {
  const base = ligneeRoyaleGameConfig.defaultGameMode;
  if (modeId === "highStakes") {
    const override = ligneeRoyaleGameConfig.gameModes.highStakes;
    return {
      displayName: override.displayName,
      buyIn: override.buyIn,
      maxReturnMultipleOfBuyIn: base.maxReturnMultipleOfBuyIn,
      startingCredits: override.startingCredits,
      minBet: override.minBet,
      maxBet: override.maxBet,
      maxPayout: base.maxPayout,
      maxWildCards: (override as { maxWildCards?: number }).maxWildCards ?? base.maxWildCards,
      maxWild2xCards: (override as { maxWild2xCards?: number }).maxWild2xCards ?? base.maxWild2xCards,
      maxWild3xCards: (override as { maxWild3xCards?: number }).maxWild3xCards ?? base.maxWild3xCards,
      maxWild5xCards: (override as { maxWild5xCards?: number }).maxWild5xCards ?? base.maxWild5xCards,
      maxDeadCards: (override as { maxDeadCards?: number }).maxDeadCards ?? base.maxDeadCards,
      deckComposition: {
        suits: [...base.deckComposition.suits],
        ranks: [...base.deckComposition.ranks],
      },
      rewards: { ...base.rewards },
      minimumPairRank: base.minimumPairRank,
    };
  }
  return {
    displayName: base.displayName,
    buyIn: base.buyIn,
    maxReturnMultipleOfBuyIn: base.maxReturnMultipleOfBuyIn,
    startingCredits: base.startingCredits,
    minBet: base.minBet,
    maxBet: base.maxBet,
    maxPayout: base.maxPayout,
    maxWildCards: base.maxWildCards,
    maxWild2xCards: base.maxWild2xCards,
    maxWild3xCards: base.maxWild3xCards,
    maxWild5xCards: base.maxWild5xCards,
    maxDeadCards: base.maxDeadCards,
    deckComposition: {
      suits: [...base.deckComposition.suits],
      ranks: [...base.deckComposition.ranks],
    },
    rewards: { ...base.rewards },
    minimumPairRank: base.minimumPairRank,
  };
}
