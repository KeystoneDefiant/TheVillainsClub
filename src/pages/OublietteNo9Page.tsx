import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Box, Loader, Text } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { MinigameLazyErrorBoundary } from "@/components/errors/MinigameLazyErrorBoundary";
import { buildBarRouteStateFromReturn } from "@/game/barRouteState";
import type { ClubTableReturnDetail, OublietteShellBinding } from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import type { GameState as OublietteGameState } from "@/minigames/oubliette-no9/types";
import { disposeOublietteAudio } from "@/minigames/oubliette-no9/hooks/useThemeAudio";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";
import { OUBLIETTE_STANDALONE_ROUTE } from "@/config/standaloneLanding";

import "@/minigames/oubliette-no9/styles/global.css";

const OublietteNo9Root = lazy(() => import("@/minigames/oubliette-no9/App"));

type OublietteNo9PageProps = {
  standalone?: boolean;
};

export function OublietteNo9Page({ standalone = false }: OublietteNo9PageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = usePrefersReducedMotion();
  const activeSession = useClubWallet((s) => s.activeSession);
  const isReturningToClubRef = useRef(false);
  const launchedStandalone =
    standalone ||
    (typeof location.state === "object" &&
      location.state !== null &&
      "fromStandaloneOubliette" in location.state &&
      location.state.fromStandaloneOubliette === true);

  useEffect(() => {
    document.title = "Oubliette No. 9 — The Villains Club";
  }, []);

  useEffect(() => {
    if (isReturningToClubRef.current) return;
    if (!activeSession || activeSession.gameId !== "oubliette_no9") {
      navigate(launchedStandalone ? OUBLIETTE_STANDALONE_ROUTE : "/menu", { replace: true });
    }
  }, [activeSession, launchedStandalone, navigate]);

  const endSession = useClubWallet((s) => s.endSession);

  const handleReturnToClub = useCallback(
    (detail: ClubTableReturnDetail) => {
      isReturningToClubRef.current = true;
      const snap = useClubWallet.getState().activeSession;
      const buyIn = snap?.buyIn ?? 0;
      const gameId = snap?.gameId ?? "oubliette_no9";
      endSession(detail);
      if (launchedStandalone) {
        navigate(OUBLIETTE_STANDALONE_ROUTE, { replace: true });
        return;
      }
      navigate("/bar", { replace: true, state: buildBarRouteStateFromReturn(gameId, buyIn, detail) });
    },
    [endSession, launchedStandalone, navigate],
  );

  const shellProps = useMemo((): OublietteShellBinding | null => {
    if (!activeSession || activeSession.gameId !== "oubliette_no9") return null;
    const savedState =
      activeSession.oublietteState ??
      (activeSession.progressRound != null ? ({ round: activeSession.progressRound } satisfies Partial<OublietteGameState>) : undefined);
    return {
      sessionCredits: activeSession.sessionWallet,
      settlement: activeSession.settlement,
      savedState,
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
      <MinigameLazyErrorBoundary onLeave={() => navigate(launchedStandalone ? OUBLIETTE_STANDALONE_ROUTE : "/bar", { replace: true })}>
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
