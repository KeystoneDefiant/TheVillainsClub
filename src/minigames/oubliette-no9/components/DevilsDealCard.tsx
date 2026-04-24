import { Box, Stack, Text } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import type { Card as CardType } from "../types";
import { formatCredits } from "../utils/format";
import { Card } from "./Card";

interface DevilsDealCardProps {
  card: CardType;
  cost: number;
  quip: string;
  isHeld: boolean;
  isDisabled: boolean;
  onHold: () => void;
}

export function DevilsDealCard({ card, cost, quip, isHeld, isDisabled, onHold }: DevilsDealCardProps) {
  return (
    <Box className={isDisabled ? "opacity-30" : undefined}>
      <Box
        className="devil-deal-container"
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={() => {
          if (!isDisabled) onHold();
        }}
        onKeyDown={(e) => {
          if (isDisabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onHold();
          }
        }}
        style={{
          cursor: isDisabled ? "not-allowed" : "pointer",
          borderRadius: "var(--mantine-radius-md)",
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          backgroundColor: "rgba(0,0,0,0.22)",
          padding: "var(--mantine-spacing-md)",
          outline: isHeld ? `2px solid ${clubTokens.text.brass}` : undefined,
          outlineOffset: 4,
        }}
        aria-pressed={isHeld}
        aria-disabled={isDisabled}
        aria-label={isHeld ? "Devil's deal card held" : "Devil's deal card"}
      >
        <Stack gap="xs" align="center">
          <Text fw={700} fz="sm" tt="uppercase" c={clubTokens.text.accent}>
            Devil&apos;s Deal
          </Text>
          <Card card={card} size="medium" />
          <Text size="sm" fw={600} c={clubTokens.text.brass}>
            Cost: {formatCredits(cost)} credits
          </Text>
          {quip ? (
            <Text size="xs" c={clubTokens.text.secondary} ta="center" lh={1.45}>
              {quip}
            </Text>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
