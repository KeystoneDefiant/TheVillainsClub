import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Box, Text } from "@mantine/core";
import { getPlayingCardSpriteStyle } from "./cardSprite";
import { PlayingCardFace } from "./PlayingCardFace";
import type { PlayingCardFaceData, PlayingCardFaceMode, PlayingCardSize } from "./types";

const SIZE_PX: Record<PlayingCardSize, { w: number; h: number }> = {
  small: { w: 48, h: 64 },
  medium: { w: 64, h: 96 },
  large: { w: 80, h: 128 },
};

export type PlayingCardProps = {
  card: PlayingCardFaceData;
  isHeld?: boolean;
  onClick?: () => void;
  size?: PlayingCardSize;
  showBack?: boolean;
  flipDelay?: number;
  flipDurationMs?: number;
  tabIndex?: number;
  "data-focused"?: boolean;
  faceMode?: PlayingCardFaceMode;
  spriteStyle?: CSSProperties;
};

export function PlayingCard({
  card,
  isHeld = false,
  onClick,
  size = "medium",
  showBack = false,
  flipDelay = 0,
  flipDurationMs = 500,
  tabIndex,
  "data-focused": dataFocused,
  faceMode,
  spriteStyle,
}: PlayingCardProps) {
  const [isFlipped, setIsFlipped] = useState(showBack);
  const { w, h } = SIZE_PX[size];

  const fromResolver = getPlayingCardSpriteStyle(card);
  const mergedSprite: CSSProperties | undefined = spriteStyle ?? fromResolver ?? undefined;
  const useSprite =
    faceMode !== "typography" &&
    mergedSprite != null &&
    (mergedSprite.background != null || mergedSprite.backgroundImage != null);
  const faceRenderMode: PlayingCardFaceMode = useSprite ? "sprite" : "typography";

  useEffect(() => {
    if (showBack) {
      setIsFlipped(true);
      const timer = window.setTimeout(() => {
        setIsFlipped(false);
      }, flipDelay + flipDurationMs);
      return () => window.clearTimeout(timer);
    }
    setIsFlipped(false);
    return undefined;
  }, [showBack, flipDelay, flipDurationMs]);

  const inner = (
    <Box
      style={{
        width: w,
        height: h,
        position: "relative",
        perspective: "1000px",
      }}
    >
      <Box
        className={isHeld ? "card-held" : undefined}
        data-held={isHeld}
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid",
          borderRadius: "var(--mantine-radius-md, 8px)",
          boxShadow: "var(--mantine-shadow-sm, 0 1px 3px rgba(0,0,0,0.35))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 500ms",
          ...(isHeld ? {} : { borderColor: "var(--game-card-border)" }),
          backgroundColor: "var(--game-card-background)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          zIndex: isFlipped ? 1 : 2,
        }}
      >
        <PlayingCardFace
          card={card}
          mode={faceRenderMode}
          spriteStyle={useSprite ? mergedSprite : undefined}
          density={size}
        />
      </Box>

      <Box
        className="card-back"
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid",
          borderRadius: "var(--mantine-radius-md, 8px)",
          boxShadow: "var(--mantine-shadow-sm, 0 1px 3px rgba(0,0,0,0.35))",
          transition: "transform 500ms",
          transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
          transformStyle: "preserve-3d",
          zIndex: isFlipped ? 2 : 1,
        }}
      >
        <Text className="card-back-text" size="xs" fw={700}>
          POKER
        </Text>
      </Box>
    </Box>
  );

  if (onClick) {
    return (
      <Box
        component="button"
        type="button"
        role="button"
        tabIndex={tabIndex}
        onClick={onClick}
        onKeyDown={
          tabIndex === 0
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        style={{
          border: "none",
          padding: 0,
          background: "none",
          cursor: "pointer",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {inner}
      </Box>
    );
  }

  void dataFocused;
  return inner;
}
