import { useState, useEffect } from "react";
import { Box, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { clubTokens } from "@/theme/clubTokens";
import type { Card as CardType, Hand, FailureStateType, GameState } from "../types";
import { Card } from "./Card";
import { GameHeader } from "./GameHeader";
import { DevilsDealCard } from "./DevilsDealCard";
import { GameButton } from "./GameButton";
import { gameConfig } from "@/config/minigames/oublietteNo9GameRules";
import { oubliettePlayAreaStyle } from "../layout/playAreaStyle";

interface GameTableProps {
  playerHand: CardType[];
  heldIndices: number[];
  parallelHands: Hand[];
  credits: number;
  selectedHandCount: number;
  round: number;
  totalEarnings: number;
  firstDrawComplete: boolean;
  nextActionIsDraw: boolean;
  failureState?: FailureStateType;
  gameState?: GameState;
  onToggleHold: (index: number) => void;
  onToggleDevilsDealHold: () => void;
  onDraw: () => void;
  onShowPayoutTable?: () => void;
  onShowSettings?: () => void;
}

export function GameTable({
  playerHand,
  heldIndices,
  parallelHands,
  credits,
  totalEarnings: _totalEarnings,
  selectedHandCount,
  round,
  firstDrawComplete,
  failureState,
  gameState,
  onToggleHold,
  onToggleDevilsDealHold,
  onDraw,
  onShowPayoutTable,
  onShowSettings,
}: GameTableProps) {
  void _totalEarnings;
  const useLargeCards = useMediaQuery("(min-width: 36em)");
  const canDraw = parallelHands.length === 0 && playerHand.length >= 5;

  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const cardCount = playerHand.length + (gameState?.devilsDealCard ? 1 : 0);
  const maxIndex = cardCount;

  useEffect(() => {
    setFocusedIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cardCount === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(maxIndex, prev + 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusedIndex < playerHand.length) {
          onToggleHold(focusedIndex);
        } else if (focusedIndex < cardCount && gameState?.devilsDealCard && heldIndices.length < 5) {
          onToggleDevilsDealHold();
        } else if (focusedIndex === cardCount && canDraw) {
          onDraw();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    focusedIndex,
    cardCount,
    maxIndex,
    playerHand.length,
    canDraw,
    onToggleHold,
    onToggleDevilsDealHold,
    onDraw,
    gameState?.devilsDealCard,
    heldIndices.length,
  ]);

  const [devilsDealQuip, setDevilsDealQuip] = useState<string>("");
  useEffect(() => {
    if (gameState?.devilsDealCard) {
      const quips = gameConfig.quips.devilsDeal;
      setDevilsDealQuip(quips[Math.floor(Math.random() * quips.length)]!);
    }
  }, [gameState?.devilsDealCard]);

  const drawsLeft = Math.max(
    0,
    (gameState?.maxDraws ?? 0) - (gameState?.drawsCompletedThisRound ?? 0) - 1,
  );

  return (
    <Box id="gameTable-screen" style={oubliettePlayAreaStyle}>
      <Stack maw={896} w="100%" mx="auto" gap="md" pb="md">
        <GameHeader
          credits={credits}
          round={round}
          failureState={failureState}
          gameState={gameState}
          onShowPayoutTable={onShowPayoutTable}
          onShowSettings={onShowSettings}
        />

        <Paper
          p={{ base: "md", sm: "lg" }}
          radius="lg"
          style={{
            flex: 1,
            display: "flex",
            backgroundColor: clubTokens.surface.panel,
            border: `1px solid ${clubTokens.surface.brassStroke}`,
            backdropFilter: "blur(6px)",
          }}
        >
          <Stack gap="md" style={{ flex: 1, width: "100%" }}>
            <Title order={3} c={clubTokens.text.brass} fz={{ base: "1.05rem", sm: "1.25rem" }}>
              Your hand
            </Title>

            <Group
              justify="center"
              gap="md"
              wrap="wrap"
              style={{ minHeight: 140, position: "relative" }}
              role="group"
              aria-label="Your hand - use arrow keys to select, Enter or Space to hold"
            >
              {playerHand.map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  isHeld={heldIndices.includes(index)}
                  onClick={() => {
                    setFocusedIndex(index);
                    onToggleHold(index);
                  }}
                  size={useLargeCards ? "large" : "medium"}
                  showBack={!firstDrawComplete}
                  flipDelay={index * 100}
                  tabIndex={index === focusedIndex ? 0 : -1}
                  data-focused={index === focusedIndex}
                />
              ))}
            </Group>

            <Stack gap="sm" align="center">
              {drawsLeft > 0 ? (
                <>
                  <Text size="sm" c={clubTokens.text.muted} ta="center">
                    Hold the cards you want to keep, then draw. Draws left: {drawsLeft}
                  </Text>
                  <GameButton
                    onClick={onDraw}
                    disabled={!canDraw}
                    tabIndex={focusedIndex === cardCount ? 0 : -1}
                    variant={canDraw ? "primary" : "ghost"}
                    size="lg"
                    className={
                      focusedIndex === cardCount
                        ? "ring-2 ring-[var(--game-accent-gold)] ring-offset-2 ring-offset-[var(--game-bg-card)]"
                        : ""
                    }
                  >
                    Draw
                  </GameButton>
                </>
              ) : (
                <>
                  <Text size="sm" c={clubTokens.text.muted} ta="center">
                    Hold the cards you want to keep, then play parallel hands.
                  </Text>
                  <GameButton
                    onClick={onDraw}
                    disabled={!canDraw}
                    tabIndex={focusedIndex === cardCount ? 0 : -1}
                    variant={canDraw ? "secondary" : "ghost"}
                    size="lg"
                    className={
                      focusedIndex === cardCount
                        ? "ring-2 ring-[var(--game-accent-gold)] ring-offset-2 ring-offset-[var(--game-bg-card)]"
                        : ""
                    }
                  >
                    Play {selectedHandCount} Parallel Hands
                  </GameButton>
                </>
              )}
            </Stack>

            {gameState?.devilsDealCard ? (
              <Group justify="center" mt="md">
                <DevilsDealCard
                  card={gameState.devilsDealCard}
                  cost={gameState.devilsDealCost}
                  quip={devilsDealQuip}
                  isHeld={gameState.devilsDealHeld}
                  isDisabled={heldIndices.length >= 5 && !gameState.devilsDealHeld}
                  onHold={onToggleDevilsDealHold}
                />
              </Group>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
