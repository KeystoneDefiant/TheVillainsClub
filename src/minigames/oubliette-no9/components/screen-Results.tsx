import { useMemo, type PointerEvent } from "react";
import { Box, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import type { Card as CardType, Hand, FailureStateType, GameState } from "../types";
import { Card } from "./Card";
import { GameHeader } from "./GameHeader";
import { GameButton } from "./GameButton";
import { summarizeRoundCombos } from "../utils/streakCalculator";
import { oubliettePlayAreaStyle } from "../layout/playAreaStyle";
import { formatCredits } from "../utils/format";

interface ResultsProps {
  playerHand: CardType[];
  heldIndices: number[];
  parallelHands: Hand[];
  rewardTable: { [key: string]: number };
  betAmount: number;
  credits: number;
  round: number;
  totalEarnings: number;
  selectedHandCount: number;
  failureState?: FailureStateType;
  gameState?: GameState;
  onReturnToPreDraw: (payout: number) => void;
  showShopNextRound?: boolean;
  onShowPayoutTable?: () => void;
  onShowSettings?: () => void;
  onAbandonRun?: () => void;
}

function formatMultiplier(multiplier: number): string {
  return `${Number(multiplier.toFixed(2)).toString()}x`;
}

function getComboGraphPoints(comboProgression: number[], width: number, height: number): string {
  if (comboProgression.length === 0) {
    return "";
  }

  const maxCombo = Math.max(1, ...comboProgression);
  const stepX = comboProgression.length > 1 ? width / (comboProgression.length - 1) : width / 2;

  return comboProgression
    .map((combo, index) => {
      const x = comboProgression.length > 1 ? index * stepX : width / 2;
      const y = height - (combo / maxCombo) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

const panelBase = {
  radius: "lg" as const,
  p: { base: "xs", sm: "md" } as const,
  style: {
    backgroundColor: clubTokens.surface.panel,
    border: `1px solid ${clubTokens.surface.brassStroke}`,
    backdropFilter: "blur(6px)",
  },
};

export function Results({
  playerHand,
  heldIndices,
  parallelHands,
  rewardTable,
  betAmount,
  credits,
  round,
  totalEarnings: _totalEarnings,
  selectedHandCount,
  failureState,
  gameState,
  onReturnToPreDraw,
  showShopNextRound = false,
  onShowPayoutTable,
  onShowSettings,
  onAbandonRun,
}: ResultsProps) {
  const {
    comboProgression,
    totalPayout,
    rankData,
    handsPlayed,
    handsWon,
    winPercent,
    highestCombo,
    highestMultiplier,
  } = useMemo(() => {
    return summarizeRoundCombos(parallelHands, rewardTable, betAmount);
  }, [parallelHands, rewardTable, betAmount]);

  const continueLabel = showShopNextRound ? "Continue to Shop" : "Continue";
  const handleContinue = () => onReturnToPreDraw(totalPayout);
  const handleSummaryTap = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch") return;
    handleContinue();
  };
  const profit =
    totalPayout -
    betAmount * selectedHandCount -
    (gameState?.devilsDealHeld && gameState?.devilsDealCost
      ? Math.abs(gameState.devilsDealCost)
      : 0);
  const comboGraphPoints = useMemo(
    () => getComboGraphPoints(comboProgression, 100, 44),
    [comboProgression],
  );

  void _totalEarnings;

  return (
    <Box
      component="main"
      id="results-screen"
      className="oubliette-play-area"
      onPointerUp={handleSummaryTap}
      style={{
        ...oubliettePlayAreaStyle,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <Stack className="oubliette-play-stack" maw={896} w="100%" mx="auto" gap="xs">
        <GameHeader
          credits={credits}
          round={round}
          failureState={failureState}
          gameState={gameState}
          onShowPayoutTable={onShowPayoutTable}
          onShowSettings={onShowSettings}
          onAbandonRun={onAbandonRun}
        />

        <Stack className="oubliette-scroll-section" gap="xs" style={{ flex: 1 }}>
          <Group gap="xs" align="stretch" grow wrap="wrap">
            <Paper
              {...panelBase}
              className="oubliette-results-hand-summary oubliette-compact-panel"
              visibleFrom="sm"
              style={{ ...panelBase.style, flex: "1 1 340px" }}
            >
              <Title order={3} mb="xs" c={clubTokens.text.brass} fz={{ base: "1.05rem", sm: "1.25rem" }}>
                Hand summary
              </Title>
              {heldIndices.length > 0 ? (
                <Stack gap="xs">
                  <Text size="xs" fw={500} c={clubTokens.text.muted}>
                    Cards held:
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    {heldIndices.map((index) => (
                      <Card key={playerHand[index]!.id} card={playerHand[index]!} size="small" />
                    ))}
                  </Group>
                </Stack>
              ) : null}
            </Paper>

            <Paper
              {...panelBase}
              className="oubliette-compact-panel"
              style={{ ...panelBase.style, flex: "1 1 340px" }}
            >
              <Title order={3} mb="xs" c={clubTokens.text.brass} fz={{ base: "1.05rem", sm: "1.25rem" }}>
                Win stats
              </Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" fw={500} c={clubTokens.text.muted}>
                    Hands played
                  </Text>
                  <Text size="sm" fw={700} c={clubTokens.text.primary}>
                    {handsPlayed}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" fw={500} c={clubTokens.text.muted}>
                    Hands won
                  </Text>
                  <Text size="sm" fw={700} c={clubTokens.text.brass}>
                    {handsWon}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" fw={500} c={clubTokens.text.muted}>
                    Win %
                  </Text>
                  <Text size="sm" fw={700} c={clubTokens.text.brass}>
                    {winPercent.toFixed(1)}%
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Paper
              radius="lg"
              p={{ base: "xs", sm: "md" }}
              className="animate-fadeIn oubliette-compact-panel"
              style={{
                ...panelBase.style,
                borderColor: clubTokens.text.brass,
                boxShadow: `0 0 24px rgba(201, 162, 39, 0.2)`,
              }}
            >
              <Title order={2} mb={{ base: "xs", sm: "sm" }} c={clubTokens.text.brass} fz={{ base: "1.15rem", sm: "1.35rem" }}>
                Round summary
              </Title>
              <Box style={{ maxHeight: 120, overflowY: "auto", paddingRight: 4 }}>
                <Stack gap="xs">
                  {rankData.map((item) => (
                    <Group key={item.rank} justify="space-between" wrap="nowrap">
                      <Text size="sm" fw={500} c={clubTokens.text.primary} tt="capitalize" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.rank.replace(/-/g, " ")} ×{item.count}
                      </Text>
                      <Text
                        size="sm"
                        fw={700}
                        c={item.totalPayout > 0 ? clubTokens.text.brass : clubTokens.text.muted}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        = {formatCredits(Math.round(item.totalPayout))} credit
                        {Math.round(item.totalPayout) !== 1 ? "s" : ""}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            </Paper>

            <Paper className="game-panel-muted animate-fadeIn oubliette-compact-panel" radius="lg" p={{ base: "xs", sm: "md" }}>
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm" fw={600} c={clubTokens.text.primary}>
                    Round cost:
                  </Text>
                  <Text size="md" fw={700} c={clubTokens.text.accent}>
                    {formatCredits(betAmount * selectedHandCount)} credits
                  </Text>
                </Group>
                {gameState?.devilsDealCard &&
                  gameState?.devilsDealHeld &&
                  gameState?.devilsDealCost > 0 && (
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="sm" fw={600} c={clubTokens.text.primary}>
                        Devil&apos;s deal:
                      </Text>
                      <Text size="md" fw={700} c={clubTokens.text.accent}>
                        -{formatCredits(Math.abs(gameState.devilsDealCost))} credits
                      </Text>
                    </Group>
                  )}
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm" fw={600} c={clubTokens.text.primary}>
                    Total payout:
                  </Text>
                  <Text size="md" fw={700} c={clubTokens.text.brass}>
                    {formatCredits(totalPayout)} credits
                  </Text>
                </Group>
                <Group
                  justify="space-between"
                  wrap="nowrap"
                  pt="xs"
                  style={{ borderTop: `1px solid ${clubTokens.surface.brassStroke}` }}
                >
                  <Text size="md" fw={700} c={clubTokens.text.primary}>
                    Profit:
                  </Text>
                  <Text
                    size="md"
                    fw={800}
                    c={profit >= 0 ? profit > 0 ? clubTokens.text.brass : clubTokens.text.primary : clubTokens.text.accent}
                  >
                    {formatCredits(profit)} credit{Math.abs(profit) !== 1 ? "s" : ""}
                  </Text>
                </Group>

                <Stack
                  gap="xs"
                  pt="xs"
                  style={{ borderTop: `1px solid ${clubTokens.surface.brassStroke}` }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" fw={600} c={clubTokens.text.muted}>
                      Highest combo
                    </Text>
                    <Text size="sm" fw={700} c={clubTokens.text.brass}>
                      {highestCombo}
                    </Text>
                  </Group>
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" fw={600} c={clubTokens.text.muted}>
                      Highest multiplier
                    </Text>
                    <Text size="sm" fw={700} c={clubTokens.text.brass}>
                      {formatMultiplier(highestMultiplier)}
                    </Text>
                  </Group>
                  <Paper p="xs" radius="md" withBorder style={{ borderColor: clubTokens.surface.brassStroke, background: "rgba(0,0,0,0.2)" }} visibleFrom="sm">
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" tt="uppercase" fw={600} c={clubTokens.text.muted}>
                        Combo progression
                      </Text>
                      <Text size="xs" c={clubTokens.text.dimGreen}>
                        Round trend
                      </Text>
                    </Group>
                    {comboProgression.length > 0 ? (
                      <svg
                        viewBox="0 0 100 44"
                        style={{ width: "100%", height: 44 }}
                        role="img"
                        aria-label="Combo progression graph"
                      >
                        <title>Combo progression graph</title>
                        <line
                          x1="0"
                          y1="43"
                          x2="100"
                          y2="43"
                          stroke="var(--game-border)"
                          strokeWidth="1"
                        />
                        <polyline
                          fill="none"
                          stroke="var(--game-accent-gold)"
                          strokeWidth="1"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points={comboGraphPoints}
                        />
                      </svg>
                    ) : (
                      <Text size="xs" c={clubTokens.text.dimGreen} style={{ fontStyle: "italic" }}>
                        No combo data this round yet.
                      </Text>
                    )}
                  </Paper>
                </Stack>
              </Stack>
            </Paper>
          </SimpleGrid>

          <GameButton
            onClick={handleContinue}
            onPointerUp={(event) => event.stopPropagation()}
            variant={showShopNextRound ? "secondary" : "primary"}
            size="lg"
            fullWidth
            className="oubliette-action-button"
          >
            {continueLabel}
          </GameButton>
        </Stack>
      </Stack>
    </Box>
  );
}
