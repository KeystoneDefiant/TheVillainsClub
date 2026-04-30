import { useState, useEffect, useMemo } from "react";
import {
  Box,
  List,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { GameHeader } from "./GameHeader";
import { GameButton } from "./GameButton";
import type { FailureStateType, GameOverReason, GameState } from "../types";
import { formatCredits } from "../utils/format";
import { getFailureStateDescription, getEndlessModeConditions } from "../utils/failureConditions";
import { oubliettePlayAreaStyle } from "../layout/playAreaStyle";

interface PreDrawProps {
  credits: number;
  handCount: number;
  selectedHandCount: number;
  betAmount: number;
  minimumBet: number;
  rewardTable: { [key: string]: number };
  gameOver: boolean;
  round: number;
  totalEarnings: number;
  failureState?: FailureStateType;
  gameState?: GameState;
  onSetBetAmount: (amount: number) => void;
  onSetSelectedHandCount: (count: number) => void;
  onDealHand: () => void;
  onEndRun: (reason?: GameOverReason) => void;
  onShowPayoutTable?: () => void;
  onShowSettings?: () => void;
}

const panelPaper = {
  styles: {
    root: {
      backgroundColor: clubTokens.surface.panel,
      border: `1px solid ${clubTokens.surface.brassStroke}`,
      backdropFilter: "blur(6px)",
    },
  },
} as const;

export function PreDraw({
  credits,
  handCount,
  selectedHandCount,
  betAmount,
  minimumBet,
  gameOver,
  round,
  failureState,
  gameState,
  onSetBetAmount,
  onSetSelectedHandCount,
  onDealHand,
  onEndRun,
  onShowPayoutTable,
  onShowSettings,
}: PreDrawProps) {
  const [showEndRunConfirm, setShowEndRunConfirm] = useState(false);

  useEffect(() => {
    if (selectedHandCount !== handCount) onSetSelectedHandCount(handCount);
    if (betAmount !== minimumBet) onSetBetAmount(minimumBet);
  }, [handCount, minimumBet, selectedHandCount, betAmount, onSetSelectedHandCount, onSetBetAmount]);

  useEffect(() => {
    if (gameOver) {
      onEndRun();
      return;
    }
    const minCost = minimumBet * handCount;
    if (credits < minCost) onEndRun("insufficient-credits");
  }, [credits, minimumBet, handCount, gameOver, onEndRun]);

  const totalBetCost = useMemo(() => minimumBet * handCount, [minimumBet, handCount]);
  const canAffordBet = useMemo(() => credits >= totalBetCost, [credits, totalBetCost]);
  const canPlayRound = useMemo(() => !gameOver && canAffordBet, [gameOver, canAffordBet]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEndRunConfirm) return;
      if ((e.key === "Enter" || e.key === " ") && canPlayRound) {
        const target = e.target as HTMLElement;
        if (!target.matches("input, textarea, [contenteditable]")) {
          e.preventDefault();
          onDealHand();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPlayRound, onDealHand, showEndRunConfirm]);

  return (
    <Box component="main" id="preDraw-screen" className="oubliette-play-area" style={oubliettePlayAreaStyle}>
      <Stack className="oubliette-play-stack" maw={896} w="100%" mx="auto" gap="md" pb="md">
        <GameHeader
          credits={credits}
          round={round}
          failureState={failureState}
          gameState={gameState}
          hideFailureInHeader
          onShowPayoutTable={onShowPayoutTable}
          onShowSettings={onShowSettings}
        />

        <Paper p={{ base: "sm", sm: "lg" }} radius="lg" {...panelPaper} style={{ flex: 1, display: "flex" }}>
          <Stack className="oubliette-compact-stack" gap="lg" style={{ flex: 1 }}>
            <Title order={2} ta="center" c={clubTokens.text.brass} fz={{ base: "1.35rem", sm: "1.75rem" }}>
              {gameOver ? "Game Over" : "Ready to Play?"}
            </Title>

            {gameState?.isEndlessMode && !gameOver && (() => {
              const conditions = getEndlessModeConditions(gameState);
              if (conditions.length === 0) return null;
              return (
                <Paper p="md" radius="md" withBorder style={{ borderColor: clubTokens.text.brass }}>
                  <Stack gap="xs">
                    <Text fw={600} c={clubTokens.text.brass}>
                      End game active
                    </Text>
                    <Text size="sm" c={clubTokens.text.primary}>
                      You must meet these conditions to survive each round:
                    </Text>
                    <List size="sm" c={clubTokens.text.primary} spacing={4}>
                      {conditions.map((condition, i) => (
                        <List.Item key={i}>{condition}</List.Item>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              );
            })()}

            {failureState && gameState && !gameOver && (
              <Paper p="md" radius="md" withBorder style={{ borderColor: `${clubTokens.text.accent}99` }}>
                <Stack gap={4}>
                  <Text size="sm" fw={600} c={clubTokens.text.accent}>
                    Failure condition
                  </Text>
                  <Text size="sm" c={clubTokens.text.primary}>
                    {getFailureStateDescription(failureState, gameState)}
                  </Text>
                </Stack>
              </Paper>
            )}

            {gameOver && (
              <Paper p="md" radius="md" withBorder style={{ borderColor: `${clubTokens.text.accent}99` }}>
                <Stack gap="xs">
                  <Text fw={600} c={clubTokens.text.accent}>
                    Insufficient credits
                  </Text>
                  <Text size="sm" c={clubTokens.text.primary}>
                    You need at least {formatCredits(minimumBet * handCount)} credits to play.
                  </Text>
                  <Text size="sm" c={clubTokens.text.secondary}>
                    The game has ended because you cannot afford the next round.
                  </Text>
                </Stack>
              </Paper>
            )}

            <Stack gap="md" style={{ flex: 1 }}>
              <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
                <Paper p={{ base: 6, sm: "sm" }} radius="md" ta="center" className="game-panel-muted">
                  <Text size="xs" c={clubTokens.text.muted} tt="uppercase" fw={600}>
                    Bet
                  </Text>
                  <Text fz={{ base: "0.95rem", sm: "1.125rem" }} fw={700} c={clubTokens.text.primary}>
                    {formatCredits(minimumBet)}
                  </Text>
                </Paper>
                <Paper p={{ base: 6, sm: "sm" }} radius="md" ta="center" className="game-panel-muted">
                  <Text size="xs" c={clubTokens.text.muted} tt="uppercase" fw={600}>
                    Hands
                  </Text>
                  <Text fz={{ base: "0.95rem", sm: "1.125rem" }} fw={700} c={clubTokens.text.primary}>
                    {handCount}
                  </Text>
                </Paper>
                <Paper p={{ base: 6, sm: "sm" }} radius="md" ta="center" className="game-panel-muted">
                  <Text size="xs" c={clubTokens.text.muted} tt="uppercase" fw={600}>
                    Cost
                  </Text>
                  <Text fz={{ base: "0.95rem", sm: "1.125rem" }} fw={700} c={clubTokens.text.brass}>
                    {formatCredits(totalBetCost)}
                  </Text>
                </Paper>
              </SimpleGrid>

              <GameButton
                onClick={onDealHand}
                disabled={!canPlayRound}
                variant="primary"
                size="md"
                fullWidth
                aria-label={
                  gameOver
                    ? "Cannot play - game over"
                    : `Run round with ${handCount} hands at ${formatCredits(minimumBet)} credits per hand`
                }
                aria-disabled={!canPlayRound}
              >
                {gameOver ? "Cannot Play - Game Over" : "Run Round"}
              </GameButton>

              <GameButton
                onClick={() => setShowEndRunConfirm(true)}
                variant="ghost"
                size="md"
                fullWidth
                aria-label="End current run and return to main menu"
              >
                End Run
              </GameButton>
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <Modal
        opened={showEndRunConfirm}
        onClose={() => setShowEndRunConfirm(false)}
        title="End run?"
        centered
        overlayProps={{ backgroundOpacity: 0.55 }}
        styles={{
          title: { color: clubTokens.text.brass, fontWeight: 700 },
          content: {
            backgroundColor: clubTokens.surface.panel,
            border: `1px solid ${clubTokens.surface.brassStroke}`,
          },
        }}
      >
        <Stack gap="md">
          <Text size="sm" c={clubTokens.text.muted}>
            Are you sure you want to end your run? You will return to the main menu.
          </Text>
          <SimpleGrid cols={2} spacing="sm">
            <GameButton onClick={() => setShowEndRunConfirm(false)} variant="ghost" size="md" fullWidth>
              Cancel
            </GameButton>
            <GameButton
              onClick={() => {
                setShowEndRunConfirm(false);
                onEndRun();
              }}
              variant="primary"
              size="md"
              fullWidth
            >
              Confirm End Run
            </GameButton>
          </SimpleGrid>
        </Stack>
      </Modal>
    </Box>
  );
}
