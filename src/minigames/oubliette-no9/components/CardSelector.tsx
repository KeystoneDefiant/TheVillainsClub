import { Box, Paper, ScrollArea, SimpleGrid } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { Card as CardType } from "../types";
import { Card } from "./Card";

interface CardSelectorProps {
  cards: CardType[];
  selectedCard: CardType | null;
  onSelectCard: (card: CardType) => void;
  removedCards: CardType[];
}

export function CardSelector({ cards, selectedCard, onSelectCard, removedCards }: CardSelectorProps) {
  const removedCardIds = new Set(removedCards.map((c) => c.id));

  return (
    <Paper
      p="xs"
      radius="md"
      style={{
        border: `1px solid ${clubTokens.surface.brassStroke}`,
        backgroundColor: "rgba(0,0,0,0.2)",
      }}
    >
      <ScrollArea.Autosize mah={256} type="auto" offsetScrollbars>
        <SimpleGrid cols={4} spacing="xs" verticalSpacing="xs">
          {cards.map((card) => {
            const isRemoved = removedCardIds.has(card.id);
            const isSelected = selectedCard?.id === card.id;

            return (
              <Box
                key={card.id}
                data-testid={`card-select-${card.id}`}
                onClick={() => !isRemoved && onSelectCard(card)}
                style={{
                  cursor: isRemoved ? "not-allowed" : "pointer",
                  opacity: isRemoved ? 0.35 : 1,
                  borderRadius: "var(--mantine-radius-sm)",
                  outline: isSelected ? `2px solid ${clubTokens.text.brass}` : undefined,
                  outlineOffset: 2,
                  transition: "outline-color 120ms ease, opacity 120ms ease",
                }}
              >
                <Card card={card} size="small" />
              </Box>
            );
          })}
        </SimpleGrid>
      </ScrollArea.Autosize>
    </Paper>
  );
}
