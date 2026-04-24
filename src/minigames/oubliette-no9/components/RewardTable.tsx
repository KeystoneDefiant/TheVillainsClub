import { useMemo } from "react";
import { Paper, Stack, Group, Text, ScrollArea } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { formatCredits } from "../utils/format";
import type { RewardTable as GameRewardTable } from "../types";

interface RewardTableProps {
  rewardTable: GameRewardTable;
  wildCardCount: number;
  /** Optional: highlight a specific rank key (e.g. current hand) */
  highlightRank?: string | null;
}

/** Display order for known rank keys; unknown keys append at end sorted alphabetically. */
const DISPLAY_ORDER: string[] = [
  "royal-flush",
  "straight-flush",
  "five-of-a-kind",
  "four-of-a-kind",
  "full-house",
  "flush",
  "straight",
  "three-of-a-kind",
  "two-pair",
  "one-pair",
  "high-card",
];

function formatRankLabel(rankKey: string): string {
  return rankKey
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function RewardTable({ rewardTable, wildCardCount, highlightRank }: RewardTableProps) {
  const orderedKeys = useMemo(() => {
    const keys = Object.keys(rewardTable).filter((k) => (rewardTable[k] ?? 0) > 0);
    const known = DISPLAY_ORDER.filter((k) => keys.includes(k));
    const rest = keys.filter((k) => !DISPLAY_ORDER.includes(k)).sort();
    return [...known, ...rest];
  }, [rewardTable]);

  return (
    <Paper
      p="md"
      radius="md"
      className="relative"
      style={{
        border: `1px solid ${clubTokens.surface.brassStroke}`,
        backgroundColor: "rgba(0,0,0,0.22)",
      }}
    >
      <Text fw={700} fz="sm" tt="uppercase" c={clubTokens.text.brass} mb="sm">
        Payout table
      </Text>
      <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
        <Stack gap={6}>
          {orderedKeys.map((rankKey) => {
            const payout = rewardTable[rankKey] ?? 0;
            const isFoak = rankKey === "five-of-a-kind";
            const wildLocked = isFoak && wildCardCount === 0;
            const isHighlight = highlightRank === rankKey;
            return (
              <Paper
                key={rankKey}
                p="xs"
                radius="sm"
                className={`game-panel-muted${isHighlight ? " payout-highlight" : ""}`}
                style={{
                  border: `1px solid ${isHighlight ? clubTokens.text.brass : clubTokens.surface.brassStroke}`,
                  backgroundColor: isHighlight ? "rgba(201, 162, 39, 0.12)" : "rgba(255,255,255,0.04)",
                  opacity: wildLocked ? 0.55 : 1,
                }}
              >
                <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={600} c={clubTokens.text.secondary}>
                      {formatRankLabel(rankKey)}
                    </Text>
                    {wildLocked ? (
                      <Text size="xs" c={clubTokens.text.muted}>
                        Requires at least one wild card in the deck
                      </Text>
                    ) : null}
                  </Stack>
                  <Text
                    size="sm"
                    fw={700}
                    c={clubTokens.text.brass}
                    className={isHighlight ? "credit-popup" : undefined}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {formatCredits(payout)}
                  </Text>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>
    </Paper>
  );
}
