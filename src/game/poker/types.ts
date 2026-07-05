export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique identifier for React keys
  isWild?: boolean; // Wild card flag
  isDead?: boolean; // Dead card flag
  wildMultiplier?: number; // Optional wild multiplier (e.g. 2, 3, 5)
}

export type HandRank =
  | 'royal-flush'
  | 'straight-flush'
  | 'five-of-a-kind'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'one-pair'
  | 'high-card';

export interface HandResult {
  rank: HandRank;
  multiplier: number;
  score: number;
  winningCards: Card[];
}
