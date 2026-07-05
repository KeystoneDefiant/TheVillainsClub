import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ClubButton } from "@/components/ui/ClubButton";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import {
  buildFatesealSettlementProfile,
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  buildMastersonSettlementProfile,
  buildLigneeRoyaleSettlementProfile,
  getFatesealBaseReturnCeiling,
  getOublietteBaseReturnCeiling,
  getSevenYearItchBaseReturnCeiling,
  getMastersonBaseReturnCeiling,
  getLigneeRoyaleBaseReturnCeiling,
} from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import { clubTokens } from "@/theme/clubTokens";
import { resolveLigneeRoyaleGameMode } from "@/config/minigames/ligneeRoyaleConfig";

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
  const forfeitActiveSession = useClubWallet((s) => s.forfeitActiveSession);
  const [abandonOpened, { open: openAbandon, close: closeAbandon }] = useDisclosure(false);
  const [startingOubliette, setStartingOubliette] = useState(false);
  const [starting7yi, setStarting7yi] = useState(false);
  const [startingFateseal, setStartingFateseal] = useState(false);
  const [startingMasterson, setStartingMasterson] = useState(false);
  const [startingLigneeRoyale, setStartingLigneeRoyale] = useState(false);
  const [ligneeRoyaleMode, setLigneeRoyaleMode] = useState<"normalGame" | "highStakes">("normalGame");
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

  const fatesealBuyIn = villainsGameDefaults.fatesealSilver.defaultBuyIn;
  const fatesealSettlementPreview = useMemo(() => buildFatesealSettlementProfile(fatesealBuyIn), [fatesealBuyIn]);
  const fatesealReturnCeiling = useMemo(
    () => getFatesealBaseReturnCeiling(fatesealSettlementPreview),
    [fatesealSettlementPreview],
  );

  const mastersonBuyIn = villainsGameDefaults.masterson1881.defaultBuyIn;
  const mastersonSettlementPreview = useMemo(
    () => buildMastersonSettlementProfile(mastersonBuyIn),
    [mastersonBuyIn],
  );
  const mastersonReturnCeiling = useMemo(
    () => getMastersonBaseReturnCeiling(mastersonSettlementPreview),
    [mastersonSettlementPreview],
  );

  const ligneeRoyaleBuyIn =
    ligneeRoyaleMode === "highStakes"
      ? resolveLigneeRoyaleGameMode("highStakes").buyIn
      : villainsGameDefaults.ligneeRoyale.defaultBuyIn;
  const ligneeRoyaleSettlementPreview = useMemo(
    () => buildLigneeRoyaleSettlementProfile(ligneeRoyaleBuyIn, ligneeRoyaleMode),
    [ligneeRoyaleBuyIn, ligneeRoyaleMode],
  );
  const ligneeRoyaleReturnCeiling = useMemo(
    () => getLigneeRoyaleBaseReturnCeiling(ligneeRoyaleSettlementPreview),
    [ligneeRoyaleSettlementPreview],
  );

  const startOubliette = () => {
    setSessionError(null);
    if (activeSession?.gameId === "oubliette_no9") {
      navigate("/minigames/oubliette-no9");
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    if (clubBalance < oublietteBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    setStartingOubliette(true);
    const settlement = buildOublietteSettlementProfile(oublietteBuyIn);
    const result = startSession({
      gameId: "oubliette_no9",
      drinkId: "club_table",
      buyIn: oublietteBuyIn,
      settlement,
      gameModeId: villainsGameDefaults.oublietteNo9.defaultGameModeId,
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
    if (activeSession?.gameId === "seven_year_itch") {
      navigate("/minigames/seven-year-itch");
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    if (clubBalance < sevenYearItchBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    setStarting7yi(true);
    const settlement = buildSevenYearItchSettlementProfile(sevenYearItchBuyIn);
    const result = startSession({
      gameId: "seven_year_itch",
      drinkId: "seven_year_itch",
      buyIn: sevenYearItchBuyIn,
      settlement,
      gameModeId: villainsGameDefaults.sevenYearItch.defaultGameModeId,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStarting7yi(false);
      return;
    }
    navigate("/minigames/seven-year-itch");
  };

  const startFateseal = () => {
    setSessionError(null);
    if (activeSession?.gameId === "fateseal_silver") {
      navigate("/minigames/fateseal-silver");
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    if (clubBalance < fatesealBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    setStartingFateseal(true);
    const settlement = buildFatesealSettlementProfile(fatesealBuyIn);
    const result = startSession({
      gameId: "fateseal_silver",
      drinkId: "fateseal_silver",
      buyIn: fatesealBuyIn,
      settlement,
      gameModeId: villainsGameDefaults.fatesealSilver.defaultGameModeId,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStartingFateseal(false);
      return;
    }
    navigate("/minigames/fateseal-silver");
  };

  const startMasterson = () => {
    setSessionError(null);
    if (activeSession?.gameId === "masterson_1881") {
      navigate("/minigames/masterson-1881");
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    if (clubBalance < mastersonBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    setStartingMasterson(true);
    const settlement = buildMastersonSettlementProfile(mastersonBuyIn);
    const result = startSession({
      gameId: "masterson_1881",
      drinkId: "masterson_1881",
      buyIn: mastersonBuyIn,
      settlement,
      gameModeId: villainsGameDefaults.masterson1881.defaultGameModeId,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStartingMasterson(false);
      return;
    }
    navigate("/minigames/masterson-1881");
  };

  const startLigneeRoyale = () => {
    setSessionError(null);
    if (activeSession?.gameId === "lignee_royale") {
      navigate("/minigames/lignee-royale");
      return;
    }
    if (activeSession) {
      setSessionError(startSessionErrorMessage("session_active"));
      return;
    }
    if (clubBalance < ligneeRoyaleBuyIn) {
      setSessionError(startSessionErrorMessage("insufficient_funds"));
      return;
    }
    setStartingLigneeRoyale(true);
    const settlement = buildLigneeRoyaleSettlementProfile(ligneeRoyaleBuyIn, ligneeRoyaleMode);
    const result = startSession({
      gameId: "lignee_royale",
      drinkId: "lignee_royale",
      buyIn: ligneeRoyaleBuyIn,
      settlement,
      gameModeId: ligneeRoyaleMode,
    });
    if (!result.ok) {
      setSessionError(startSessionErrorMessage(result.reason));
      setStartingLigneeRoyale(false);
      return;
    }
    navigate("/minigames/lignee-royale");
  };

  const canAffordOubliette = clubBalance >= oublietteBuyIn;
  const canAfford7yi = clubBalance >= sevenYearItchBuyIn;
  const canAffordFateseal = clubBalance >= fatesealBuyIn;
  const canAffordMasterson = clubBalance >= mastersonBuyIn;
  const canAffordLigneeRoyale = clubBalance >= ligneeRoyaleBuyIn;
  const oublietteSessionOpen = activeSession?.gameId === "oubliette_no9";
  const sevenYearItchSessionOpen = activeSession?.gameId === "seven_year_itch";
  const fatesealSessionOpen = activeSession?.gameId === "fateseal_silver";
  const mastersonSessionOpen = activeSession?.gameId === "masterson_1881";
  const ligneeRoyaleSessionOpen = activeSession?.gameId === "lignee_royale";
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
          <ClubButton fullWidth mt="xs" variant="subtle" color="red" onClick={openAbandon}>
            Abandon table…
          </ClubButton>
        </Alert>
      ) : null}

      {sevenYearItchSessionOpen ? (
        <Alert color="orange" variant="light" title="Table still open">
          You have an active 7 Year Itch session. The dice are still warm.
          <ClubButton fullWidth mt="sm" variant="filled" onClick={() => navigate("/minigames/seven-year-itch")}>
            Resume 7 Year Itch
          </ClubButton>
          <ClubButton fullWidth mt="xs" variant="subtle" color="red" onClick={openAbandon}>
            Abandon table…
          </ClubButton>
        </Alert>
      ) : null}

      {fatesealSessionOpen ? (
        <Alert color="grape" variant="light" title="Table still open">
          The seal still hungers. Resume Fateseal Silver?
          <ClubButton fullWidth mt="sm" variant="filled" color="grape" onClick={() => navigate("/minigames/fateseal-silver")}>
            Resume Fateseal Silver
          </ClubButton>
          <ClubButton fullWidth mt="xs" variant="subtle" color="red" onClick={openAbandon}>
            Abandon table…
          </ClubButton>
        </Alert>
      ) : null}

      {mastersonSessionOpen ? (
        <Alert color="yellow" variant="light" title="Table still open">
          You have an active Masterton 1881 session. Step back in or settle it.
          <ClubButton fullWidth mt="sm" variant="filled" color="yellow" onClick={() => navigate("/minigames/masterson-1881")}>
            Resume Masterton 1881
          </ClubButton>
          <ClubButton fullWidth mt="xs" variant="subtle" color="red" onClick={openAbandon}>
            Abandon table…
          </ClubButton>
        </Alert>
      ) : null}

      {ligneeRoyaleSessionOpen ? (
        <Alert color="red" variant="light" title="Table still open">
          You have an active Lignée Royale session. Step back in or settle it.
          <ClubButton fullWidth mt="sm" variant="filled" color="red" onClick={() => navigate("/minigames/lignee-royale")}>
            Resume Lignée Royale
          </ClubButton>
          <ClubButton fullWidth mt="xs" variant="subtle" color="red" onClick={openAbandon}>
            Abandon table…
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

      <ClubButton
        fullWidth
        variant="light"
        color="grape"
        disabled={!canAffordFateseal || anyTableOpen || startingFateseal}
        loading={startingFateseal}
        onClick={startFateseal}
      >
        Fateseal Silver (cascading slot)
      </ClubButton>
      <Text size="xs" c={clubTokens.text.muted} style={{ lineHeight: 1.45 }}>
        Buy-in {fatesealBuyIn.toLocaleString()} credits. Cascading ritual grid — return to the club capped near{" "}
        {fatesealReturnCeiling.toLocaleString()} credits before overachievement.
      </Text>

      <ClubButton
        fullWidth
        variant="light"
        color="yellow"
        disabled={!canAffordMasterson || anyTableOpen || startingMasterson}
        loading={startingMasterson}
        onClick={startMasterson}
      >
        Masterton 1881 (reverse roulette)
      </ClubButton>
      <Text size="xs" c={clubTokens.text.muted} style={{ lineHeight: 1.45 }}>
        Buy-in {mastersonBuyIn.toLocaleString()} credits. Croupier rigging simulator — return to the club capped near{" "}
        {mastersonReturnCeiling.toLocaleString()} credits before overachievement.
      </Text>

      <Stack gap={4}>
        <Group gap="xs" grow>
          <ClubButton
            variant={ligneeRoyaleMode === "normalGame" ? "filled" : "outline"}
            size="xs"
            disabled={anyTableOpen || startingLigneeRoyale}
            onClick={() => setLigneeRoyaleMode("normalGame")}
          >
            Normal (2,000 cr)
          </ClubButton>
          <ClubButton
            variant={ligneeRoyaleMode === "highStakes" ? "filled" : "outline"}
            color="red"
            size="xs"
            disabled={anyTableOpen || startingLigneeRoyale}
            onClick={() => setLigneeRoyaleMode("highStakes")}
          >
            High Stakes (10,000 cr)
          </ClubButton>
        </Group>
        <ClubButton
          fullWidth
          variant="light"
          color="red"
          disabled={!canAffordLigneeRoyale || anyTableOpen || startingLigneeRoyale}
          loading={startingLigneeRoyale}
          onClick={startLigneeRoyale}
        >
          Lignée Royale (card slots)
        </ClubButton>
      </Stack>
      <Text size="xs" c={clubTokens.text.muted} style={{ lineHeight: 1.45 }}>
        Buy-in {ligneeRoyaleBuyIn.toLocaleString()} credits. Card slot layout — return to the club capped near{" "}
        {ligneeRoyaleReturnCeiling.toLocaleString()} credits before overachievement.
      </Text>

      <Modal opened={abandonOpened} onClose={closeAbandon} title="Abandon this table?" centered>
        <Stack gap="md">
          <Text size="sm" c={clubTokens.text.secondary}>
            You will not receive a payout. The buy-in you moved to the table is forfeited and stays with the house.
          </Text>
          <Group grow>
            <ClubButton variant="light" onClick={closeAbandon}>
              Keep table
            </ClubButton>
            <ClubButton
              color="red"
              aria-label="Confirm abandon table"
              onClick={() => {
                forfeitActiveSession();
                closeAbandon();
              }}
            >
              Abandon — lose buy-in
            </ClubButton>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
