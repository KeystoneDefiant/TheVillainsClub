import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Box } from "@mantine/core";
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
          boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 500ms, border-color 0.2s ease, box-shadow 0.2s ease",
          borderColor: isHeld ? "var(--game-card-held-border)" : "var(--game-card-border)",
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
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          transition: "transform 500ms",
          borderColor: "var(--game-card-border)",
          transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
          transformStyle: "preserve-3d",
          zIndex: isFlipped ? 2 : 1,
          overflow: "hidden",
        }}
      >
        {/* Intricate Gold Filigree Card Back Pattern */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 80 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: "absolute",
            inset: 0,
            padding: "4px",
            boxSizing: "border-box",
          }}
          aria-hidden="true"
        >
          <rect x="3" y="3" width="74" height="114" rx="5" stroke="#c79e57" strokeWidth="0.8" strokeDasharray="2 1" opacity="0.65" />
          <rect x="5.5" y="5.5" width="69" height="109" rx="4.5" stroke="#c79e57" strokeWidth="0.5" opacity="0.4" />
          
          <path d="M5.5 5.5 L74.5 114.5 M74.5 5.5 L5.5 114.5" stroke="#c79e57" strokeWidth="0.4" opacity="0.12" />
          <path d="M5.5 32.5 L74.5 87.5 M74.5 32.5 L5.5 87.5" stroke="#c79e57" strokeWidth="0.4" opacity="0.12" />
          <path d="M5.5 60 L74.5 60 M40 5.5 L40 114.5" stroke="#c79e57" strokeWidth="0.4" opacity="0.12" />
          
          <circle cx="40" cy="60" r="15" stroke="#ffd780" strokeWidth="0.85" opacity="0.8" />
          <circle cx="40" cy="60" r="12" stroke="#c79e57" strokeWidth="0.4" strokeDasharray="1 1" opacity="0.65" />
          
          <path d="M40 48 L48 60 L40 72 L32 60 Z" fill="#ffd780" opacity="0.15" />
          <path d="M40 46 L50 60 L40 74 L30 60 Z" stroke="#ffd780" strokeWidth="1.1" opacity="0.85" />
          <circle cx="40" cy="60" r="2.5" fill="#c79e57" />
          
          <path d="M9 16 L16 9 M9 9 L16 16" stroke="#c79e57" strokeWidth="0.65" opacity="0.55" />
          <path d="M71 16 L64 9 M71 9 L64 16" stroke="#c79e57" strokeWidth="0.65" opacity="0.55" />
          <path d="M9 104 L16 111 M9 111 L16 104" stroke="#c79e57" strokeWidth="0.65" opacity="0.55" />
          <path d="M71 104 L64 111 M71 111 L64 104" stroke="#c79e57" strokeWidth="0.65" opacity="0.55" />
        </svg>
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
