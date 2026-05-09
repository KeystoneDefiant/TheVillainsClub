import { motion } from "framer-motion";
import { Divider, Stack, Text, Title } from "@mantine/core";
import { useMemo } from "react";
import { ClubPanel } from "@/components/ui/ClubPanel";
import type { BarRouteState } from "@/game/barRouteState";
import {
  barSettlementTone,
  netClubDeltaFromSettlement,
  pickSettlementQuip,
} from "@/game/barSettlementQuips";
import { defaultMotionPreset } from "@/motion/presets";
import { clubTokens } from "@/theme/clubTokens";

const GAME_TITLE: Record<string, string> = {
  oubliette_no9: "Oubliette No. 9",
  seven_year_itch: "7 Year Itch",
  fateseal_silver: "Fateseal Silver",
};

function formatSignedCredits(n: number): string {
  const abs = Math.abs(Math.round(n));
  const s = abs.toLocaleString();
  return n >= 0 ? `+${s}` : `−${s}`;
}

type ClubSettlementDockProps = {
  lastTable: BarRouteState["lastTable"];
  reduceMotion: boolean;
};

export function ClubSettlementDock({ lastTable, reduceMotion }: ClubSettlementDockProps) {
  const tone = barSettlementTone(lastTable);
  const delta = netClubDeltaFromSettlement(lastTable);
  const quip = useMemo(() => pickSettlementQuip(tone, lastTable), [tone, lastTable]);
  const gameTitle = GAME_TITLE[lastTable.gameId] ?? lastTable.gameId.replace(/_/g, " ");

  const positive = delta > 0;
  const muted = delta === 0;

  const deltaColor =
    muted ? clubTokens.text.muted : positive ? clubTokens.text.dimGreen : clubTokens.text.accent;

  const receiptMood =
    tone === "extreme_win"
      ? "Rare air"
      : tone === "win"
        ? "House winced politely"
        : tone === "extreme_loss"
          ? "Bleeding varnish"
          : "Honest abrasion";

  return (
    <motion.aside
      className="club-settlement-dock"
      aria-label="Settlement summary"
      initial={reduceMotion ? false : { opacity: 0, y: 10, z: 0 }}
      animate={{ opacity: 1, y: 0, z: 0 }}
      transition={{
        duration: defaultMotionPreset.menuItemDuration,
        ease: [...defaultMotionPreset.easing],
      }}
    >
      <ClubPanel maw={360} w="min(360px, 100%)" px="md" py="md">
        <Stack gap="sm">
          <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
            Bar settlement
          </Text>
          <Title order={3} size="h4" c={clubTokens.text.primary} style={{ fontFamily: "Georgia, serif" }}>
            {gameTitle}
          </Title>
          <Text size="sm" c={clubTokens.text.secondary}>
            Returned {Math.round(lastTable.totalReturn).toLocaleString()} credits from the table • Buy-in{" "}
            {Math.round(lastTable.buyIn).toLocaleString()}
          </Text>

          <Divider color={clubTokens.surface.brassStroke} opacity={0.45} />

          <div>
            <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
              Net vs buy-in (club wallet)
            </Text>
            <Text size="xl" fw={900} lh={1.2} style={{ letterSpacing: "0.02em", color: deltaColor }}>
              {formatSignedCredits(delta)} credits
            </Text>
            <Text size="xs" mt={6} c="dimmed">
              Compared with what left your club balance at table open.
            </Text>
          </div>

          <Divider color={clubTokens.surface.brassStroke} opacity={0.45} />

          <blockquote className="club-settlement-dock__quip">
            <Text size="sm" fs="italic" c={clubTokens.text.secondary}>
              “{quip}”
            </Text>
            <Text size="xs" mt={6} c={clubTokens.text.muted}>
              — the bar
            </Text>
          </blockquote>
          <Text size="10px" c="dimmed" ta="center" tt="uppercase">
            Receipt mood: {receiptMood}
          </Text>
        </Stack>
      </ClubPanel>
    </motion.aside>
  );
}
