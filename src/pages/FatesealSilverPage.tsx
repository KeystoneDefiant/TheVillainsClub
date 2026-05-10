import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Box, Loader, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { MinigameLazyErrorBoundary } from "@/components/errors/MinigameLazyErrorBoundary";
import { buildBarRouteStateFromReturn } from "@/game/barRouteState";
import type { ClubTableReturnDetail, FatesealShellBinding } from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

import "@/minigames/fateseal-silver/fatesealSilver.css";

const FatesealSilverRoot = lazy(() =>
  import("@/minigames/fateseal-silver/App").then((m) => ({ default: m.FatesealSilverRoot })),
);

export function FatesealSilverPage() {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();
  const activeSession = useClubWallet((s) => s.activeSession);
  /**
   * Guards the "no active session → redirect to /menu" effect so that calling
   * `endSession` during cash-out does not trample the immediate `navigate("/bar", { state })`
   * with the settlement quip dock state.
   */
  const isReturningToClubRef = useRef(false);

  useEffect(() => {
    document.title = "Fateseal Silver — The Villains Club";
  }, []);

  useEffect(() => {
    if (isReturningToClubRef.current) return;
    if (!activeSession || activeSession.gameId !== "fateseal_silver") {
      navigate("/menu", { replace: true });
    }
  }, [activeSession, navigate]);

  const endSession = useClubWallet((s) => s.endSession);

  const handleReturnToClub = useCallback(
    (detail: ClubTableReturnDetail) => {
      isReturningToClubRef.current = true;
      const snap = useClubWallet.getState().activeSession;
      const buyIn = snap?.buyIn ?? 0;
      const gameId = snap?.gameId ?? "fateseal_silver";
      endSession(detail);
      navigate("/bar", { replace: true, state: buildBarRouteStateFromReturn(gameId, buyIn, detail) });
    },
    [endSession, navigate],
  );

  const shellProps = useMemo((): FatesealShellBinding | null => {
    if (!activeSession || activeSession.gameId !== "fateseal_silver") return null;
    return {
      sessionCredits: activeSession.sessionWallet,
      settlement: activeSession.settlement,
      gameModeId: activeSession.gameModeId,
      onReturnToClubMenu: handleReturnToClub,
      onPauseToClub: () => navigate("/bar", { replace: true }),
    };
  }, [activeSession, handleReturnToClub, navigate]);

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
              <Loader color="grape" size="lg" />
              <Text size="sm" c={clubTokens.text.muted} ta="center">
                Loading Fateseal Silver…
              </Text>
            </Box>
          }
        >
          <FatesealSilverRoot {...shellProps} />
        </Suspense>
      </MinigameLazyErrorBoundary>
    </Box>
  );
}
