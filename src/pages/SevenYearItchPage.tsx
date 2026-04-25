import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import { Box, Loader, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { MinigameLazyErrorBoundary } from "@/components/errors/MinigameLazyErrorBoundary";
import { buildBarRouteStateFromReturn } from "@/game/barRouteState";
import type { ClubTableReturnDetail, SevenYearItchShellBinding } from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

import "@/minigames/seven-year-itch/sevenYearItch.css";

const SevenYearItchRoot = lazy(() =>
  import("@/minigames/seven-year-itch/App").then((m) => ({ default: m.SevenYearItchRoot })),
);

export function SevenYearItchPage() {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();
  const activeSession = useClubWallet((s) => s.activeSession);

  useEffect(() => {
    document.title = "7 Year Itch — The Villains Club";
  }, []);

  useEffect(() => {
    if (!activeSession || activeSession.gameId !== "seven_year_itch") {
      navigate("/menu", { replace: true });
    }
  }, [activeSession, navigate]);

  const endSession = useClubWallet((s) => s.endSession);

  const handleReturnToClub = useCallback(
    (detail: ClubTableReturnDetail) => {
      const snap = useClubWallet.getState().activeSession;
      const buyIn = snap?.buyIn ?? 0;
      const gameId = snap?.gameId ?? "seven_year_itch";
      endSession(detail);
      navigate("/bar", { replace: true, state: buildBarRouteStateFromReturn(gameId, buyIn, detail) });
    },
    [endSession, navigate],
  );

  const shellProps = useMemo((): SevenYearItchShellBinding | null => {
    if (!activeSession || activeSession.gameId !== "seven_year_itch") return null;
    return {
      sessionCredits: activeSession.sessionWallet,
      settlement: activeSession.settlement,
      onReturnToClubMenu: handleReturnToClub,
    };
  }, [activeSession, handleReturnToClub]);

  if (!shellProps) {
    return null;
  }

  return (
    <Box
      className={reduceMotion ? undefined : "shell-route-fade-in"}
      style={{
        height: "100%",
        overflow: "auto",
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
        opacity: reduceMotion ? 1 : undefined,
        ...(reduceMotion ? {} : { ["--shell-route-fade-dur" as string]: "0.35s" }),
      }}
    >
      <MinigameLazyErrorBoundary onLeave={() => navigate("/bar", { replace: true })}>
        <Suspense
          fallback={
            <Box
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
                minHeight: 240,
              }}
            >
              <Loader color="orange" size="lg" />
              <Text size="sm" c={clubTokens.text.muted} ta="center">
                Loading 7 Year Itch…
              </Text>
            </Box>
          }
        >
          <SevenYearItchRoot {...shellProps} />
        </Suspense>
      </MinigameLazyErrorBoundary>
    </Box>
  );
}
