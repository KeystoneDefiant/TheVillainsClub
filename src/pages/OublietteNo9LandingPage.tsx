import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Box, Group, Stack, Text, Title } from "@mantine/core";
import { Navigate, useNavigate } from "react-router-dom";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { isOublietteStandaloneLandingEnabled, OUBLIETTE_STANDALONE_ROUTE } from "@/config/standaloneLanding";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { useClubWallet } from "@/game/clubWalletStore";
import { buildOublietteSettlementProfile, getOublietteBaseReturnCeiling } from "@/game/sessionSettlement";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

function startSessionErrorMessage(reason: "session_active" | "insufficient_funds" | "invalid_buy_in"): string {
  switch (reason) {
    case "session_active":
      return "You already have an open table. Resume it before buying another.";
    case "insufficient_funds":
      return "Not enough club balance for that buy-in.";
    case "invalid_buy_in":
      return "That buy-in could not be started.";
    default:
      return "Could not start the table.";
  }
}

export function OublietteNo9LandingPage() {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();
  const { clubBalance, activeSession, startSession } = useClubWallet();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const buyIn = villainsGameDefaults.oublietteNo9.defaultBuyIn;
  const settlement = useMemo(() => buildOublietteSettlementProfile(buyIn), [buyIn]);
  const returnCeiling = useMemo(() => getOublietteBaseReturnCeiling(settlement), [settlement]);

  useEffect(() => {
    document.title = "Oubliette No. 9 — The Villains Club";
  }, []);

  const startOubliette = useCallback(() => {
    setSessionError(null);
    if (activeSession) {
      if (activeSession.gameId === "oubliette_no9") {
        navigate("/minigames/oubliette-no9", {
          state: { fromStandaloneOubliette: true, standaloneRoute: OUBLIETTE_STANDALONE_ROUTE },
        });
        return;
      }
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    setStarting(true);
    const result = startSession({
      gameId: "oubliette_no9",
      drinkId: "standalone_oubliette",
      buyIn,
      settlement,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStarting(false);
      return;
    }
    navigate("/minigames/oubliette-no9", {
      state: { fromStandaloneOubliette: true, standaloneRoute: OUBLIETTE_STANDALONE_ROUTE },
    });
  }, [activeSession, buyIn, navigate, settlement, startSession]);

  if (!isOublietteStandaloneLandingEnabled()) {
    return <Navigate to="/menu" replace />;
  }

  return (
    <Box className={`oubliette-standalone ${reduceMotion ? "" : "shell-route-fade-in"}`}>
      <MenuHazeBackground />
      <ClubPanel maw={620} w="min(620px, calc(100vw - 2rem))" className="oubliette-standalone__card">
        <Stack gap="lg">
          <Stack gap={6} ta="center">
            <Badge color="orange" variant="light" mx="auto">
              Standalone table
            </Badge>
            <Title order={1} c={clubTokens.text.brass}>
              Oubliette No. 9
            </Title>
            <Text c={clubTokens.text.secondary}>
              A poker roguelike table for players who want the room without walking through the club.
            </Text>
          </Stack>

          <Group justify="space-between" gap="md" grow>
            <Box className="oubliette-standalone__stat">
              <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                Buy-in
              </Text>
              <Text fw={800} c={clubTokens.text.brass}>
                {buyIn.toLocaleString()} credits
              </Text>
            </Box>
            <Box className="oubliette-standalone__stat">
              <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                Base return ceiling
              </Text>
              <Text fw={800} c={clubTokens.text.brass}>
                {returnCeiling.toLocaleString()} credits
              </Text>
            </Box>
          </Group>

          <Text size="sm" c={clubTokens.text.secondary}>
            Your club balance is {clubBalance.toLocaleString()} credits. Starting here still uses the same wallet
            and settlement rules as the club table.
          </Text>

          {sessionError ? (
            <Alert color="red" variant="light" title="Cannot start table" onClose={() => setSessionError(null)} withCloseButton>
              {sessionError}
            </Alert>
          ) : null}

          <Group grow>
            <ClubButton variant="light" onClick={() => navigate("/menu")}>
              Back to club
            </ClubButton>
            <ClubButton loading={starting} onClick={startOubliette}>
              {activeSession?.gameId === "oubliette_no9" ? "Resume game" : "Start Oubliette"}
            </ClubButton>
          </Group>
        </Stack>
      </ClubPanel>
    </Box>
  );
}
