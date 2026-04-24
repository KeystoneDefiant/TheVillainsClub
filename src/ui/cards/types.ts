export type PlayingCardSuit = "hearts" | "diamonds" | "clubs" | "spades";

export type PlayingCardRank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

/** Minimal data for drawing a face (typography or future sprite). */
export interface PlayingCardFaceData {
  suit: PlayingCardSuit;
  rank: PlayingCardRank;
  isWild?: boolean;
  isDead?: boolean;
}

/** `sprite` reserved for a future atlas; until then, typography is used as fallback. */
export type PlayingCardFaceMode = "typography" | "sprite";

export type PlayingCardSize = "small" | "medium" | "large";
