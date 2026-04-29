import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import { Box, Loader, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { MinigameLazyErrorBoundary } from "@/components/errors/MinigameLazyErrorBoundary";
import { buildBarRouteStateFromReturn } from "@/game/barRouteState";
import type { ClubTableReturnDetail, OublietteShellBinding } from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import { disposeOublietteAudio } from "@/minigames/oubliette-no9/hooks/useThemeAudio";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

import "@/minigames/oubliette-no9/styles/global.css";

const OublietteNo9Root = lazy(() => import("@/minigames/oubliette-no9/App"));

export function OublietteNo9Page() {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();
  const activeSession = useClubWallet((s) => s.activeSession);

  useEffect(() => {
    document.title = "Oubliette No. 9 — The Villains Club";
  }, []);

  useEffect(() => {
    if (!activeSession || activeSession.gameId !== "oubliette_no9") {
      navigate("/menu", { replace: true });
    }
  }, [activeSession, navigate]);

  const endSession = useClubWallet((s) => s.endSession);

  const handleReturnToClub = useCallback(
    (detail: ClubTableReturnDetail) => {
      const snap = useClubWallet.getState().activeSession;
      const buyIn = snap?.buyIn ?? 0;
      const gameId = snap?.gameId ?? "oubliette_no9";
      endSession(detail);
      navigate("/bar", { replace: true, state: buildBarRouteStateFromReturn(gameId, buyIn, detail) });
    },
    [endSession, navigate],
  );

  const shellProps = useMemo((): OublietteShellBinding | null => {
    if (!activeSession || activeSession.gameId !== "oubliette_no9") return null;
    return {
      sessionCredits: activeSession.sessionWallet,
      settlement: activeSession.settlement,
      onReturnToClubMenu: handleReturnToClub,
    };
  }, [activeSession, handleReturnToClub]);

  useEffect(() => {
    return () => {
      disposeOublietteAudio();
    };
  }, []);

  if (!shellProps) {
    return null;
  }

  return (
    <Box
      className={reduceMotion ? undefined : "shell-route-fade-in"}
      style={{
        height: "100%",
        overflow: "hidden",
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
              <Loader color="yellow" size="lg" />
              <Text size="sm" c={clubTokens.text.muted} ta="center">
                Loading Oubliette No. 9…
              </Text>
            </Box>
          }
        >
          <OublietteNo9Root {...shellProps} />
        </Suspense>
      </MinigameLazyErrorBoundary>
    </Box>
  );
}
