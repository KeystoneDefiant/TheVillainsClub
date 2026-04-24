import { useMemo } from "react";
import { Box, Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { OublietteSettlementProfile } from "@/game/sessionSettlement";
import { computeOublietteReturn, getOublietteBaseReturnCeiling } from "@/game/sessionSettlement";
import { clubTokens } from "@/theme/clubTokens";
import { formatCredits } from "../utils/format";
import { getGameOverDisplay } from "../utils/gameOverDisplay";
import { GameOverReason, GameState } from "../types";
import { GameButton } from "./GameButton";

interface GameOverProps {
  round: number;
  totalEarnings: number;
  credits: number;
  gameOverReason?: GameOverReason | null;
  gameState?: GameState | null;
  /** When embedded in the club shell, show capped return + overachievement bonus. */
  settlementProfile?: OublietteSettlementProfile | null;
  onReturnToMenu: () => void;
}

function GroupRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <Group justify="space-between" gap="sm" wrap="wrap">
      <Text size={large ? "md" : "sm"} c={clubTokens.text.primary}>
        {label}
      </Text>
      <Text size={large ? "lg" : "sm"} fw={700} c={clubTokens.text.brass}>
        {value}
      </Text>
    </Group>
  );
}

export function GameOver({
  round,
  totalEarnings,
  credits,
  gameOverReason,
  gameState,
  settlementProfile,
  onReturnToMenu,
}: GameOverProps) {
  const clubReturn = useMemo(
    () => (settlementProfile ? computeOublietteReturn(credits, settlementProfile) : null),
    [credits, settlementProfile],
  );
  const baseReturnCeiling = settlementProfile ? getOublietteBaseReturnCeiling(settlementProfile) : null;
  const averagePerRound =
    round > 0
      ? (totalEarnings / round).toLocaleString(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : '0.0';
  const display = getGameOverDisplay(
    gameOverReason ?? null,
    gameState ?? null,
    gameState ? { minimumBet: gameState.minimumBet, handCount: gameState.handCount } : undefined
  );
  const highestMultiplier = Number((gameState?.runHighestMultiplier ?? 1).toFixed(2)).toString();
  const statItems = useMemo(
    () => [
      { label: 'Rounds Survived', value: round.toLocaleString() },
      { label: 'Total Earnings', value: formatCredits(totalEarnings) },
      { label: 'Avg per Round', value: averagePerRound },
      { label: 'Final Credits', value: formatCredits(credits) },
      { label: 'Parallel Hands', value: (gameState?.handCount ?? 0).toLocaleString() },
      { label: 'Highest Combo', value: (gameState?.runHighestCombo ?? 0).toLocaleString() },
      { label: 'Highest Multiplier', value: `${highestMultiplier}x` },
    ],
    [
      averagePerRound,
      credits,
      gameState?.handCount,
      gameState?.runHighestCombo,
      highestMultiplier,
      round,
      totalEarnings,
    ]
  );
  const marqueeItems = [...statItems, ...statItems];

  return (
    <Box
      className="game-over-screen min-h-[100dvh] flex items-center justify-center"
      style={{
        background: `linear-gradient(180deg, ${clubTokens.surface.deepWalnut} 0%, #0d0a0c 50%, #120e10 100%)`,
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <Paper
        className="game-panel relative overflow-hidden max-w-6xl w-full"
        radius="2rem"
        p={{ base: "md", sm: "xl", lg: 40 }}
        style={{
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201, 162, 39, 0.08)",
          background:
            "radial-gradient(circle at top, rgba(201,162,39,0.12), transparent 30%), linear-gradient(180deg, rgba(19,14,16,0.96) 0%, rgba(10,8,10,0.98) 100%)",
        }}
      >
        <Box className="absolute inset-0 pointer-events-none opacity-60" style={{ zIndex: 0 }}>
          <Box
            className="absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: "rgba(201, 162, 39, 0.14)" }}
          />
          <Box
            className="absolute -bottom-16 right-8 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(139, 21, 32, 0.14)" }}
          />
        </Box>

        <Stack gap="xl" className="relative z-10" style={{ position: "relative" }}>
          <Box
            component="section"
            className="game-over-hero relative overflow-hidden rounded-[1.75rem] min-h-[16rem] sm:min-h-[18rem]"
            style={{
              border: `1px solid ${clubTokens.surface.brassStroke}`,
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <Box
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at center, rgba(201,162,39,0.12), transparent 52%)",
              }}
            />
            <div className="game-over-hero-glint" aria-hidden="true" />
            <Box className="relative h-full px-6 py-8 sm:px-10 sm:py-12">
              <div className="game-over-hero-copy">
                <h1
                  className="game-over-title-animate text-4xl sm:text-6xl lg:text-7xl font-bold text-center uppercase tracking-[0.08em]"
                  style={{ color: clubTokens.text.brass }}
                >
                  {display.title}
                </h1>
                <p
                  className="game-over-subtitle-animate max-w-3xl text-center text-sm sm:text-lg font-medium leading-relaxed"
                  style={{ color: clubTokens.text.primary }}
                >
                  {display.subtitle}
                </p>
              </div>
            </Box>
          </Box>

          {/* <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="game-panel-muted rounded-xl p-4 border border-[var(--game-border)]"
              >
                <p
                  className="text-[0.7rem] sm:text-xs uppercase tracking-[0.14em]"
                  style={{ color: 'var(--game-text-muted)' }}
                >
                  {item.label}
                </p>
                <p
                  className="mt-2 text-xl sm:text-2xl font-bold"
                  style={{ color: 'var(--game-accent-gold)' }}
                >
                  {item.value}
                </p>
                {item.label === 'Avg per Round' && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--game-text-dim)' }}>
                    credits/round
                  </p>
                )}
              </div>
            ))}
          </section> */}

          <Box
            component="section"
            className="overflow-hidden rounded-xl py-3"
            style={{
              border: `1px solid ${clubTokens.surface.brassStroke}`,
              backgroundColor: "rgba(255,255,255,0.025)",
            }}
          >
            <div className="game-over-marquee-track" aria-label="Run statistics marquee">
              {marqueeItems.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="inline-flex items-center gap-3 rounded-full px-4 py-2"
                  style={{
                    border: `1px solid ${clubTokens.surface.brassStroke}`,
                    backgroundColor: "rgba(10,8,10,0.7)",
                  }}
                >
                  <span
                    className="text-[0.7rem] uppercase tracking-[0.14em]"
                    style={{ color: clubTokens.text.muted }}
                  >
                    {item.label}
                  </span>
                  <span className="text-sm sm:text-base font-bold" style={{ color: clubTokens.text.brass }}>
                    {item.value}
                  </span>
                  {item.label === 'Avg per Round' && (
                    <span
                      className="text-[0.65rem] uppercase tracking-[0.12em]"
                      style={{ color: clubTokens.text.secondary }}
                    >
                      credits/round
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Box>

          <Box className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <Paper
              className="game-panel-muted rounded-2xl p-5 sm:p-6"
              style={{ border: `1px solid ${clubTokens.surface.brassStroke}`, backgroundColor: "rgba(0,0,0,0.18)" }}
            >
              {clubReturn && settlementProfile && baseReturnCeiling != null ? (
                <Stack
                  gap="xs"
                  mb="lg"
                  p="md"
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    border: `1px solid ${clubTokens.surface.brassStroke}`,
                    backgroundColor: "rgba(0,0,0,0.22)",
                  }}
                >
                  <Title order={5} tt="uppercase" fz="xs" c={clubTokens.text.muted} fw={600}>
                    Return to club wallet
                  </Title>
                  <Text size="xs" c={clubTokens.text.secondary}>
                    Buy-in for this table was{" "}
                    <Text span fw={700} c={clubTokens.text.brass}>
                      {formatCredits(settlementProfile.buyIn)}
                    </Text>
                    . The main return is capped at{" "}
                    <Text span fw={700} c={clubTokens.text.brass}>
                      {formatCredits(baseReturnCeiling)}
                    </Text>{" "}
                    (buy-in × return multiple × active specials). Overachievement adds bonuses on top of that cap
                    from uncapped table performance.
                  </Text>
                  <Divider color={clubTokens.surface.brassStroke} />
                  <GroupRow
                    label="Table payout (capped portion)"
                    value={formatCredits(clubReturn.basePayout)}
                  />
                  <GroupRow
                    label={`Overachievement bonus${clubReturn.tiers > 0 ? ` (${clubReturn.tiers} tier${clubReturn.tiers === 1 ? "" : "s"})` : ""}`}
                    value={formatCredits(clubReturn.overachievementBonus)}
                  />
                  <Divider color={clubTokens.surface.brassStroke} />
                  <GroupRow label="Total returned to club" value={formatCredits(clubReturn.totalReturn)} large />
                  <Text size="xs" c={clubTokens.text.muted}>
                    In-table credits this run: {formatCredits(clubReturn.uncappedCredits)} (club rules apply on exit,
                    not during play).
                  </Text>
                </Stack>
              ) : null}
              <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: clubTokens.text.muted }}>
                Your highball glass whispers...
              </p>
              <p className="text-lg sm:text-xl font-semibold" style={{ color: clubTokens.text.brass }}>
                {display.tip}
              </p>
            </Paper>

            <Paper
              radius="xl"
              p={{ base: "md", sm: "lg" }}
              style={{
                border: `2px solid ${display.isVoluntaryEnd ? clubTokens.text.brass : clubTokens.text.accent}`,
                background: display.isVoluntaryEnd ? "rgba(201, 162, 39, 0.12)" : "rgba(139, 21, 32, 0.2)",
              }}
            >
              <GameButton
                onClick={onReturnToMenu}
                variant="primary"
                size="lg"
                fullWidth
                aria-label="Return to main menu"
              >
                Return to Menu
              </GameButton>
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
