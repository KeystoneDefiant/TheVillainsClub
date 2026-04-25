import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Stack, Text } from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import {
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  getOublietteBaseReturnCeiling,
  getSevenYearItchBaseReturnCeiling,
} from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import { clubTokens } from "@/theme/clubTokens";

function startSessionErrorMessage(reason: "session_active" | "insufficient_funds" | "invalid_buy_in"): string {
  switch (reason) {
    case "session_active":
      return "You already have an open table. Finish or settle it before buying another.";
    case "insufficient_funds":
      return "Not enough club balance for that buy-in.";
    case "invalid_buy_in":
      return "That buy-in could not be started. Try again from the menu.";
    default:
      return "Could not start the table.";
  }
}

/** Table buy-ins and minigame launches available after entering the club (`/bar`). */
export function ClubTableGamesSection() {
  const navigate = useNavigate();
  const clubBalance = useClubWallet((s) => s.clubBalance);
  const activeSession = useClubWallet((s) => s.activeSession);
  const startSession = useClubWallet((s) => s.startSession);
  const [startingOubliette, setStartingOubliette] = useState(false);
  const [starting7yi, setStarting7yi] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const oublietteBuyIn = villainsGameDefaults.oublietteNo9.defaultBuyIn;
  const oublietteSettlementPreview = useMemo(
    () => buildOublietteSettlementProfile(oublietteBuyIn),
    [oublietteBuyIn],
  );
  const oublietteReturnCeiling = useMemo(
    () => getOublietteBaseReturnCeiling(oublietteSettlementPreview),
    [oublietteSettlementPreview],
  );

  const sevenYearItchBuyIn = villainsGameDefaults.sevenYearItch.defaultBuyIn;
  const sevenYearItchSettlementPreview = useMemo(
    () => buildSevenYearItchSettlementProfile(sevenYearItchBuyIn),
    [sevenYearItchBuyIn],
  );
  const sevenYearItchReturnCeiling = useMemo(
    () => getSevenYearItchBaseReturnCeiling(sevenYearItchSettlementPreview),
    [sevenYearItchSettlementPreview],
  );

  const startOubliette = () => {
    setSessionError(null);
    if (clubBalance < oublietteBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    setStartingOubliette(true);
    const settlement = buildOublietteSettlementProfile(oublietteBuyIn);
    const result = startSession({
      gameId: "oubliette_no9",
      drinkId: "club_table",
      buyIn: oublietteBuyIn,
      settlement,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStartingOubliette(false);
      return;
    }
    navigate("/minigames/oubliette-no9");
  };

  const startSevenYearItch = () => {
    setSessionError(null);
    if (clubBalance < sevenYearItchBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    setStarting7yi(true);
    const settlement = buildSevenYearItchSettlementProfile(sevenYearItchBuyIn);
    const result = startSession({
      gameId: "seven_year_itch",
      drinkId: "seven_year_itch",
      buyIn: sevenYearItchBuyIn,
      settlement,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStarting7yi(false);
      return;
    }
    navigate("/minigames/seven-year-itch");
  };

  const canAffordOubliette = clubBalance >= oublietteBuyIn;
  const canAfford7yi = clubBalance >= sevenYearItchBuyIn;
  const oublietteSessionOpen = activeSession?.gameId === "oubliette_no9";
  const sevenYearItchSessionOpen = activeSession?.gameId === "seven_year_itch";
  const anyTableOpen = Boolean(activeSession);

  return (
    <Stack gap="sm">
      <Stack gap={4}>
        <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={600}>
          Club balance
        </Text>
        <Text size="xl" fw={700} c={clubTokens.text.brass}>
          {clubBalance.toLocaleString()} credits
        </Text>
        <Text size="xs" c={clubTokens.text.secondary} style={{ lineHeight: 1.45 }}>
          Only the buy-in leaves your club wallet; table play uses session credits until you settle.
        </Text>
      </Stack>

      <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={600}>
        Tables
      </Text>

      {oublietteSessionOpen ? (
        <Alert color="yellow" variant="light" title="Table still open">
          You have an active Oubliette session. Step back in or finish from the game menu.
          <ClubButton fullWidth mt="sm" variant="filled" onClick={() => navigate("/minigames/oubliette-no9")}>
            Resume Oubliette No. 9
          </ClubButton>
        </Alert>
      ) : null}

      {sevenYearItchSessionOpen ? (
        <Alert color="orange" variant="light" title="Table still open">
          You have an active 7 Year Itch session. The dice are still warm.
          <ClubButton fullWidth mt="sm" variant="filled" onClick={() => navigate("/minigames/seven-year-itch")}>
            Resume 7 Year Itch
          </ClubButton>
        </Alert>
      ) : null}

      {sessionError ? (
        <Alert color="red" variant="light" title="Cannot start table" onClose={() => setSessionError(null)} withCloseButton>
          {sessionError}
        </Alert>
      ) : null}

      <ClubButton
        fullWidth
        variant="light"
        disabled={!canAffordOubliette || anyTableOpen || startingOubliette}
        loading={startingOubliette}
        onClick={startOubliette}
      >
        Oubliette No. 9 (table)
      </ClubButton>
      <Text size="xs" c={clubTokens.text.muted} style={{ lineHeight: 1.45 }}>
        Buy-in {oublietteBuyIn.toLocaleString()} credits from club balance. Main return to the club is capped near{" "}
        {oublietteReturnCeiling.toLocaleString()} credits before overachievement (active specials can change the cap).
      </Text>

      <ClubButton
        fullWidth
        variant="light"
        color="orange"
        disabled={!canAfford7yi || anyTableOpen || starting7yi}
        loading={starting7yi}
        onClick={startSevenYearItch}
      >
        7 Year Itch (crapless)
      </ClubButton>
      <Text size="xs" c={clubTokens.text.muted} style={{ lineHeight: 1.45 }}>
        Buy-in {sevenYearItchBuyIn.toLocaleString()} credits. Crapless layout — return to the club capped near{" "}
        {sevenYearItchReturnCeiling.toLocaleString()} credits before overachievement.
      </Text>
    </Stack>
  );
}
