export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique identifier for React keys
  isWild?: boolean; // Wild card flag
  isDead?: boolean; // Dead card flag
}

export interface Hand {
  cards: Card[];
  id: string;
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

export interface RewardTable {
  [key: string]: number; // HandRank -> multiplier
}

export type GameScreen =
  | 'menu'
  | 'game'
  | 'shop'
  | 'parallelHandsAnimation'
  | 'gameOver'
  | 'credits'
  | 'rules';

export type ShopOptionType =
  | 'parallel-hands-bundle-5'
  | 'parallel-hands-bundle-10'
  | 'parallel-hands-bundle-25'
  | 'parallel-hands-bundle-50'
  | 'parallel-hands-bundle-100'
  | 'parallel-hands-bundle-250'
  | 'parallel-hands-bundle-500'
  | 'parallel-hands-bundle-1000'
  | 'dead-card'
  | 'wild-card'
  | 'extra-draw'
  | 'remove-single-dead-card'
  | 'remove-all-dead-cards'
  | 'devils-deal-chance'
  | 'devils-deal-cost-reduction'
  | 'extra-card-in-hand';

export type GamePhase = 'preDraw' | 'playing' | 'parallelHandsAnimation' | 'results';

export interface DeckModifications {
  deadCards: Card[];
  wildCards: Card[];
  removedCards: Card[];
  deadCardRemovalCount: number; // Track total dead card removals (single + bulk) for cost calculation
}

export type FailureStateType =
  | 'minimum-bet-multiplier'
  | 'minimum-credit-efficiency'
  | 'minimum-winning-hands'
  | 'minimum-win-percent'
  | null;

/** Reason the run ended; used for game over screen messaging. */
export type GameOverReason =
  | 'voluntary'
  | 'insufficient-credits'
  | Exclude<FailureStateType, null>;

export interface GameState {
  screen: GameScreen;
  gamePhase: GamePhase;
  isGeneratingHands: boolean; // Loading state for parallel hands generation
  playerHand: Card[];
  heldIndices: number[];
  parallelHands: Hand[];
  handCount: number;
  rewardTable: RewardTable;
  credits: number;
  currentRun: number;
  additionalHandsBought: number;
  betAmount: number;
  selectedHandCount: number;
  minimumBet: number;
  baseMinimumBet: number; // Base minimum bet for endless mode multiplier calculations
  round: number;
  totalEarnings: number;
  deckModifications: DeckModifications;
  extraDrawPurchased: boolean;
  /** Max number of draw steps allowed this hand (1 or 2 from config/shop). */
  maxDraws: number;
  /** Number of draw steps completed this hand (0, 1, or 2). */
  drawsCompletedThisRound: number;
  wildCardCount: number;
  gameOver: boolean;
  /** Why the run ended; set when transitioning to game over screen. */
  gameOverReason: GameOverReason | null;
  showShopNextRound: boolean; // Flag to show shop after results
  selectedShopOptions: ShopOptionType[]; // Selected shop options for this round
  /** Credits when shop was opened; used for pricing so prices don't change mid-visit. */
  creditsAtShopOpen: number | null;
  /** Minimum bet from the round we just finished; used to compute next-round cost when bet increases. */
  prevRoundMinimumBet: number | null;
  /** Bet size from the round just completed; used for shop affordability display after round transitions. */
  shopDisplayBetAmount: number | null;
  isEndlessMode: boolean; // Whether endless mode is active
  currentFailureState: FailureStateType; // Current active failure condition
  winningHandsLastRound: number; // Number of winning hands from last round
  devilsDealCard: Card | null; // The offered card (null if no deal)
  devilsDealCost: number; // Calculated cost for this deal
  devilsDealHeld: boolean; // Whether the deal card is currently held
  devilsDealChancePurchases: number; // Number of chance upgrades purchased
  devilsDealCostReductionPurchases: number; // Number of cost reduction upgrades purchased
  extraCardsInHand: number; // 0 = deal 5, 1 = deal 6, etc. (still play 5)
  streakCounter: number; // Current streak count (+1 for scoring hand, -1 for non-scoring, min 0)
  currentStreakMultiplier: number; // Current active streak multiplier (1.0, 1.5, 2.0, etc.)
  runHighestCombo: number; // Best combo streak reached during the current run
  runHighestMultiplier: number; // Best streak multiplier reached during the current run
  audioSettings: {
    musicEnabled: boolean;
    soundEffectsEnabled: boolean;
    musicVolume: number; // 0.0 to 1.0
    soundEffectsVolume: number; // 0.0 to 1.0
    /** Min volume when scoring many same-rank hands in a row (0–10%). 0 = can go silent. */
    handScoringMinVolumePercent: number;
  };
  /** Animation speed: 0.5 to 7 (multiplier), or 'skip' to skip animations */
  animationSpeedMode: number | 'skip';
  /** Card visual theme: 'light' (white cards) or 'dark' (dark cards) */
  cardTheme: 'light' | 'dark';
}
