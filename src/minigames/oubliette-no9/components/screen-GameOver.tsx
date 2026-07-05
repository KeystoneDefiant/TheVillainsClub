import { useMemo } from "react";
import { Box, Paper, Stack } from "@mantine/core";
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
      className="game-over-screen"
      style={{
        background: `linear-gradient(180deg, ${clubTokens.surface.deepWalnut} 0%, #0d0a0c 50%, #120e10 100%)`,
        height: "100dvh",
        minHeight: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
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
          flexShrink: 0,
          marginBlock: "auto",
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
            <div className="flex flex-col gap-4">
              {clubReturn && settlementProfile && baseReturnCeiling != null ? (
                <div className="oubliette-receipt-panel">
                  <div className="receipt-header">
                    Return to Club Wallet
                  </div>
                  <div className="receipt-row">
                    <span>Table Buy-in:</span>
                    <span>{formatCredits(settlementProfile.buyIn)}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Main Return Cap (Buy-in × Mult):</span>
                    <span>{formatCredits(baseReturnCeiling)}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Table Payout (Capped):</span>
                    <span>{formatCredits(clubReturn.basePayout)}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Overachievement Bonus{clubReturn.tiers > 0 ? ` (${clubReturn.tiers} Tiers)` : ""}:</span>
                    <span>{formatCredits(clubReturn.overachievementBonus)}</span>
                  </div>
                  <div className="receipt-total">
                    <span>Total Club Return:</span>
                    <span>{formatCredits(clubReturn.totalReturn)}</span>
                  </div>
                  <p className="text-[0.68rem] text-center mt-3" style={{ color: "var(--game-text-dim)", fontFamily: "sans-serif" }}>
                    In-table Credits: {formatCredits(clubReturn.uncappedCredits)} (club rules apply on exit)
                  </p>
                </div>
              ) : null}

              <div className="oubliette-whisper-card">
                <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: clubTokens.text.muted }}>
                  Your highball glass whispers...
                </p>
                <p className="text-base sm:text-lg font-semibold" style={{ color: clubTokens.text.brass, fontStyle: "italic" }}>
                  "{display.tip}"
                </p>
              </div>
            </div>

            <Paper
              radius="xl"
              p={{ base: "md", sm: "lg" }}
              style={{
                border: `2px solid ${display.isVoluntaryEnd ? clubTokens.text.brass : clubTokens.text.accent}`,
                background: display.isVoluntaryEnd ? "rgba(201, 162, 39, 0.12)" : "rgba(139, 21, 32, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
