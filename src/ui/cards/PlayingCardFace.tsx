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

  const suitSymbol = SUIT_SYMBOLS[card.suit] || "";
  const suitColor = SUIT_COLOR_CLASS[card.suit] || "card-suit-black";

  if (card.isDead) {
    return (
      <Box
        className={`card-face-front card-face-dead ${className || ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          padding: "4px",
          position: "relative",
          ...style,
        }}
      >
        <div className="card-face-inner-border" />
        <div className="card-index-top-left" style={{ color: "var(--game-card-suit-red)", fontSize: density === "small" ? "7px" : "9px" }}>💀</div>
        <div className="card-index-bottom-right" style={{ color: "var(--game-card-suit-red)", fontSize: density === "small" ? "7px" : "9px", transform: "rotate(180deg)" }}>💀</div>

        <div className="card-center-symbol card-dead-skull" style={{ fontSize: density === "small" ? "1.6rem" : density === "medium" ? "2.3rem" : "2.8rem" }}>
          💀
        </div>
        <Text fz={density === "small" ? "8px" : "9px"} fw={900} c="red" tt="uppercase" style={{ letterSpacing: "1px", position: "absolute", bottom: density === "small" ? "6px" : "12px", zIndex: 2 }}>
          DEAD
        </Text>
      </Box>
    );
  }

  if (card.isWild) {
    return (
      <Box
        className={`card-face-front card-face-wild ${className || ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          padding: "4px",
          position: "relative",
          ...style,
        }}
      >
        <div className="card-face-inner-border" style={{ borderColor: "rgba(249, 115, 22, 0.25)" }} />
        <div className="card-index-top-left" style={{ color: "var(--game-card-wild-color)", fontSize: density === "small" ? "8px" : "10px" }}>✦</div>
        <div className="card-index-bottom-right" style={{ color: "var(--game-card-wild-color)", fontSize: density === "small" ? "8px" : "10px", transform: "rotate(180deg)" }}>✦</div>

        <div className="card-center-symbol card-wild" style={{ fontSize: density === "small" ? "1.6rem" : density === "medium" ? "2.4rem" : "3.0rem" }}>
          ✦
        </div>
        <Text fz={density === "small" ? "8px" : "9px"} fw={900} className="card-wild" tt="uppercase" style={{ letterSpacing: "1px", position: "absolute", bottom: density === "small" ? "6px" : "12px", zIndex: 2 }}>
          WILD
        </Text>
      </Box>
    );
  }

  return (
    <Box
      className={`card-face-front ${className || ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        padding: "4px",
        position: "relative",
        ...style,
      }}
    >
      <div className="card-face-inner-border" />

      {density === "small" ? (
        <>
          {/* Mobile Split Layout: Large Rank in Top-Left */}
          <div className={`card-face-small-rank ${suitColor}`}>
            {card.rank}
          </div>

          {/* Mobile Split Layout: Large Suit in Bottom-Right */}
          <div className={`card-face-small-suit ${suitColor}`}>
            {suitSymbol}
          </div>
        </>
      ) : (
        <>
          {/* Top-Left Index (Clean Rank Only) */}
          <div className={`card-index-top-left ${suitColor}`} style={{ fontSize: density === "large" ? "20px" : "15px" }}>
            <div className="card-index-rank" style={{ fontWeight: 900 }}>{card.rank}</div>
          </div>

          {/* Bottom-Right Index (Clean Rank Only, Rotated 180) */}
          <div className={`card-index-bottom-right ${suitColor}`} style={{ fontSize: density === "large" ? "20px" : "15px", transform: "rotate(180deg)" }}>
            <div className="card-index-rank" style={{ fontWeight: 900 }}>{card.rank}</div>
          </div>

          {/* Large Center Pip */}
          <div 
            className={`card-center-symbol ${suitColor}`}
            style={{ 
              fontSize: density === "medium" ? "2.2rem" : "2.8rem",
              opacity: 0.9,
            }}
          >
            {suitSymbol}
          </div>
        </>
      )}
    </Box>
  );
}
