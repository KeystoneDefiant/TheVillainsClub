import type { CSSProperties } from "react";
import type { PlayingCardFaceData } from "./types";

/**
 * Map a card to CSS for a sprite atlas. Returns `null` to use typography ({@link PlayingCardFace}).
 * When you add an atlas, return e.g. `{ backgroundImage: url(...), backgroundPosition, width, height }`.
 */
export function getPlayingCardSpriteStyle(_card: PlayingCardFaceData): CSSProperties | null {
  void _card;
  return null;
}
