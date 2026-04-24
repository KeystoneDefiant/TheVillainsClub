import { Box, Text } from "@mantine/core";
import type { CSSProperties } from "react";
import type { PlayingCardFaceData, PlayingCardFaceMode, PlayingCardSize } from "./types";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLOR_CLASS: Record<string, string> = {
  hearts: "card-suit-red",
  diamonds: "card-suit-red",
  clubs: "card-suit-black",
  spades: "card-suit-black",
};

const DENSITY_TEXT: Record<
  PlayingCardSize,
  { dead: string; wild: string; rank: string; suit: string }
> = {
  small: { dead: "1.5rem", wild: "0.65rem", rank: "0.7rem", suit: "1.1rem" },
  medium: { dead: "2rem", wild: "0.8rem", rank: "0.85rem", suit: "1.35rem" },
  large: { dead: "2.25rem", wild: "0.95rem", rank: "1rem", suit: "1.5rem" },
};

export type PlayingCardFaceProps = {
  card: PlayingCardFaceData;
  mode?: PlayingCardFaceMode;
  /** When `mode` is `sprite`, use CSS background / mask from a sheet (optional for now). */
  spriteStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  /** Matches {@link PlayingCard} size presets for typography scale. */
  density?: PlayingCardSize;
};

/**
 * Renders a single card face. Default is typography (rank + suit).
 * When sprite assets exist, pass `mode="sprite"` and `spriteStyle` with background image + position.
 * If `mode` is `sprite` but `spriteStyle` is missing or empty, typography is used as fallback.
 */
export function PlayingCardFace({
  card,
  mode = "typography",
  spriteStyle,
  className,
  style,
  density = "medium",
}: PlayingCardFaceProps) {
  const useSprite =
    mode === "sprite" &&
    spriteStyle &&
    Object.keys(spriteStyle).length > 0 &&
    (spriteStyle.backgroundImage != null || spriteStyle.background != null);

  if (useSprite) {
    return (
      <Box
        className={className}
        style={{ ...style, ...spriteStyle }}
        aria-hidden
      />
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = SUIT_COLOR_CLASS[card.suit];
  const t = DENSITY_TEXT[density];

  return (
    <Box
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        ...style,
      }}
    >
      {card.isDead ? (
        <Text fz={t.dead}>💀</Text>
      ) : card.isWild ? (
        <Text fz={t.wild} fw={700} className="card-wild">
          WILD
        </Text>
      ) : (
        <>
          <Text fw={700} fz={t.rank} className={suitColor} lh={1.1}>
            {card.rank}
          </Text>
          <Text fz={t.suit} className={`suit ${suitColor}`} lh={1}>
            {suitSymbol}
          </Text>
        </>
      )}
    </Box>
  );
}
