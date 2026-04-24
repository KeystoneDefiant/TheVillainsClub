import type { Card as CardType } from "../types";
import { gameConfig } from "@/config/minigames/oublietteNo9GameRules";
import { PlayingCard } from "@/ui/cards";

interface CardProps {
  card: CardType;
  isHeld?: boolean;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  showBack?: boolean;
  flipDelay?: number;
  tabIndex?: number;
  "data-focused"?: boolean;
}

export function Card(props: CardProps) {
  return (
    <PlayingCard
      {...props}
      flipDurationMs={gameConfig.animation.cardFlip}
    />
  );
}
