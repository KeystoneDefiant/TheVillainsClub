import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Divider,
  Group,
  Modal,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { barDateKey } from "@/audio/barBandSchedule";
import { effectiveBandIndexForBarDate } from "@/audio/barBandOverrideStore";
import { bandsCatalog } from "@/config/bandsCatalog";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import {
  barSettlementTone,
  netClubDeltaFromSettlement,
  pickSettlementQuip,
} from "@/game/barSettlementQuips";
import { VcLogoBarMark } from "@/components/club/VcLogoBarMark";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { isBarRouteState } from "@/game/barRouteState";
import { useClubFlowStore } from "@/game/clubFlowStore";
import { useClubWallet } from "@/game/clubWalletStore";
import { resetShellGameProgress } from "@/game/resetShellGameProgress";
import { resolveActiveClubSpecial, resolveSpecialDefinitionRow } from "@/game/specialsResolver";
import {
  buildFatesealSettlementProfile,
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  getFatesealBaseReturnCeiling,
  getOublietteBaseReturnCeiling,
  getSevenYearItchBaseReturnCeiling,
} from "@/game/sessionSettlement";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

type GameKey = "oubliette_no9" | "seven_year_itch" | "fateseal_silver";

type GameMenuEntry = {
  id: GameKey;
  title: string;
  subtitle: string;
  route: string;
  buyIn: number;
  rulesets: { value: string; label: string }[];
};

const GAME_ENTRIES: GameMenuEntry[] = [
  {
    id: "oubliette_no9",
    title: "Oubliette Number 9",
    subtitle: "Why Play One Hand of Poker When You Can Play Hundreds",
    route: "/minigames/oubliette-no9",
    buyIn: villainsGameDefaults.oublietteNo9.defaultBuyIn,
    rulesets: [{ value: "house", label: "House rules" }],
  },
  {
    id: "seven_year_itch",
    title: "7 Year Itch",
    subtitle: "Illicit Business Dealings at the Roll of the Dice",
    route: "/minigames/seven-year-itch",
    buyIn: villainsGameDefaults.sevenYearItch.defaultBuyIn,
    rulesets: [{ value: "nv-crapless", label: "NV crapless" }],
  },
  {
    id: "fateseal_silver",
    title: "Fateseal Silver",
    subtitle: "See the Future, for a Price",
    route: "/minigames/fateseal-silver",
    buyIn: villainsGameDefaults.fatesealSilver.defaultBuyIn,
    rulesets: [{ value: "silver", label: "House Fateseal" }],
  },
];

function gameReturnCeiling(game: GameMenuEntry): number {
  if (game.id === "oubliette_no9") {
    return getOublietteBaseReturnCeiling(buildOublietteSettlementProfile(game.buyIn));
  }
  if (game.id === "fateseal_silver") {
    return getFatesealBaseReturnCeiling(buildFatesealSettlementProfile(game.buyIn));
  }
  return getSevenYearItchBaseReturnCeiling(buildSevenYearItchSettlementProfile(game.buyIn));
}

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

type MainMenuPageProps = {
  forceEntered?: boolean;
};

export function MainMenuPage({ forceEntered = false }: MainMenuPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const { clubBalance, hasSave, setHasSave, activeSession, startSession, forfeitActiveSession } = useClubWallet();
  const hasEnteredClub = useClubFlowStore((s) => s.hasEnteredClub);
  const setHasEnteredClub = useClubFlowStore((s) => s.setHasEnteredClub);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [rulesOpened, { open: openRules, close: closeRules }] = useDisclosure(false);
  const [abandonOpened, { open: openAbandon, close: closeAbandon }] = useDisclosure(false);
  const [resetProgressArmed, setResetProgressArmed] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameMenuEntry | null>(null);
  const [ruleset, setRuleset] = useState("house");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState<GameKey | null>(null);
  const [settlementFlash] = useState(() => (isBarRouteState(location.state) ? location.state : null));
  const [activeScreen, setActiveScreen] = useState<"menu" | "settlement">(() =>
    isBarRouteState(location.state) && location.state.lastTable ? "settlement" : "menu"
  );

  useEffect(() => {
    document.title = "The Villains Club";
  }, []);

  useEffect(() => {
    if (forceEntered && !hasEnteredClub) {
      setHasEnteredClub(true);
    }
  }, [forceEntered, hasEnteredClub, setHasEnteredClub]);



  useEffect(() => {
    if (!settingsOpened) {
      setResetProgressArmed(false);
    }
  }, [settingsOpened]);

  const musicEnabled = useClubAudioStore((s) => s.musicEnabled);
  const sfxEnabled = useClubAudioStore((s) => s.sfxEnabled);
  const musicVolume = useClubAudioStore((s) => s.musicVolume);
  const sfxVolume = useClubAudioStore((s) => s.sfxVolume);
  const repeatSfxAttenuationPercent = useClubAudioStore((s) => s.repeatSfxAttenuationPercent);
  const setMusicEnabled = useClubAudioStore((s) => s.setMusicEnabled);
  const setSfxEnabled = useClubAudioStore((s) => s.setSfxEnabled);
  const setMusicVolume = useClubAudioStore((s) => s.setMusicVolume);
  const setSfxVolume = useClubAudioStore((s) => s.setSfxVolume);
  const setRepeatSfxAttenuationPercent = useClubAudioStore((s) => s.setRepeatSfxAttenuationPercent);

  const activeSpecial = useMemo(() => resolveActiveClubSpecial(), []);
  const specialRow = useMemo(() => resolveSpecialDefinitionRow(activeSpecial), [activeSpecial]);
  const band = useMemo(() => {
    const idx = effectiveBandIndexForBarDate(barDateKey(new Date()));
    return bandsCatalog.bands[idx]?.display_name ?? "House band";
  }, []);

  const activeModifierLines = useMemo(() => {
    const lines: string[] = [];
    if (activeSpecial) {
      const value = typeof activeSpecial.modifier.value === "number" ? ` x${activeSpecial.modifier.value}` : "";
      lines.push(`${activeSpecial.title}: ${activeSpecial.modifier.type.replace(/_/g, " ")}${value}`);
    }
    if (specialRow?.all_minigames_cap_mult) lines.push(`All table cap x${specialRow.all_minigames_cap_mult}`);
    if (specialRow?.oubliette_cap_mult) lines.push(`Oubliette cap x${specialRow.oubliette_cap_mult}`);
    if (specialRow?.seven_year_itch_cap_mult) lines.push(`7 Year Itch cap x${specialRow.seven_year_itch_cap_mult}`);
    if (specialRow?.fateseal_cap_mult) lines.push(`Fateseal cap x${specialRow.fateseal_cap_mult}`);
    return lines.length > 0 ? lines : ["No club modifiers tonight"];
  }, [activeSpecial, specialRow]);

  const enterClub = () => {
    setHasEnteredClub(true);
    if (location.pathname !== "/bar") {
      navigate("/bar", { replace: true });
    }
  };

  const openGameLanding = (game: GameMenuEntry) => {
    setSelectedGame(game);
    setRuleset(game.rulesets[0]?.value ?? "");
    setSessionError(null);
  };

  const startGame = useCallback(
    (game: GameMenuEntry) => {
      setSessionError(null);
      if (activeSession) {
        if (activeSession.gameId === game.id) {
          navigate(game.route);
          return;
        }
        setSessionError(startSessionErrorMessage("session_active"));
        return;
      }
      if (clubBalance < game.buyIn) {
        setSessionError(startSessionErrorMessage("insufficient_funds"));
        return;
      }
      setStartingGame(game.id);
      const settlement =
        game.id === "oubliette_no9"
          ? buildOublietteSettlementProfile(game.buyIn)
          : game.id === "fateseal_silver"
            ? buildFatesealSettlementProfile(game.buyIn)
            : buildSevenYearItchSettlementProfile(game.buyIn);
      const drinkId =
        game.id === "oubliette_no9"
          ? "club_table"
          : game.id === "fateseal_silver"
            ? "fateseal_silver"
            : "seven_year_itch";
      const result = startSession({
        gameId: game.id,
        drinkId,
        buyIn: game.buyIn,
        settlement,
      });
      if (!result.ok) {
        setSessionError(startSessionErrorMessage(result.reason));
        setStartingGame(null);
        return;
      }
      navigate(game.route);
    },
    [activeSession, clubBalance, navigate, startSession],
  );

  const tone = useMemo(() => {
    if (!settlementFlash?.lastTable) return "break_even";
    return barSettlementTone(settlementFlash.lastTable);
  }, [settlementFlash]);

  const delta = useMemo(() => {
    if (!settlementFlash?.lastTable) return 0;
    return netClubDeltaFromSettlement(settlementFlash.lastTable);
  }, [settlementFlash]);

  const quip = useMemo(() => {
    if (!settlementFlash?.lastTable) return "";
    return pickSettlementQuip(tone, settlementFlash.lastTable);
  }, [tone, settlementFlash]);

  const gameTitle = useMemo(() => {
    if (!settlementFlash?.lastTable) return "";
    const GAME_TITLE: Record<string, string> = {
      oubliette_no9: "Oubliette Number 9",
      seven_year_itch: "7 Year Itch",
      fateseal_silver: "Fateseal Silver",
    };
    return GAME_TITLE[settlementFlash.lastTable.gameId] ?? settlementFlash.lastTable.gameId.replace(/_/g, " ");
  }, [settlementFlash]);

  const positive = delta > 0;
  const muted = delta === 0;

  const deltaColor =
    muted ? clubTokens.text.muted : positive ? clubTokens.text.dimGreen : clubTokens.text.accent;

  const receiptMood = useMemo(() => {
    return tone === "extreme_win"
      ? "Rare air"
      : tone === "win"
        ? "House winced politely"
        : tone === "break_even"
          ? "Stalemate poured neat"
          : tone === "extreme_loss"
            ? "Bleeding varnish"
            : "Honest abrasion";
  }, [tone]);

  const formatDeltaCredits = useCallback((n: number): string => {
    if (n === 0) return "Even";
    const abs = Math.abs(Math.round(n));
    const s = abs.toLocaleString();
    return n > 0 ? `+${s}` : `−${s}`;
  }, []);

  const activeGame = selectedGame ?? GAME_ENTRIES[0];
  const entered = forceEntered || hasEnteredClub;

  return (
    <Box className={`club-landing ${entered ? "club-landing--entered" : ""}`}>
      <MenuHazeBackground />
      <div className="club-landing__backsplash" aria-hidden="true" />
      <motion.div
        className="club-landing__bar"
        initial={reduceMotion ? false : { y: entered ? 0 : 160 }}
        animate={reduceMotion ? { y: 0 } : { y: entered ? 0 : 160 }}
        transition={{ duration: 0.72, ease: preset.easing }}
        aria-hidden="true"
      >
        <div className="bar-apron-glow" />
        <div className="club-landing__bar-apron">
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
          <div className="bar-apron-panel" />
        </div>
        <div className="bar-brass-footrest">
          <div className="footrest-support footrest-support--left" />
          <div className="footrest-support footrest-support--mid-left" />
          <div className="footrest-support footrest-support--mid-right" />
          <div className="footrest-support footrest-support--right" />
          <div className="footrest-bar" />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.section
            key="threshold"
            className="club-landing__threshold"
            initial={reduceMotion ? false : { y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: -42, opacity: 0 }}
            transition={{ duration: 0.45, ease: preset.easing }}
          >
            <ClubPanel maw={460} w="100%">
              <Stack gap="lg" align="stretch">
                <Stack gap={4} ta="center">
                  <ClubHeading order={1} size="h2" c={clubTokens.text.primary}>
                    The Villains Club
                  </ClubHeading>
                  <Text size="sm" c={clubTokens.text.muted}>
                    The band is warming up. The bartender already knows what you owe.
                  </Text>
                </Stack>
                <ClubButton size="lg" fullWidth onClick={enterClub}>
                  Enter the Club
                </ClubButton>
                <ClubButton fullWidth variant="light" onClick={openSettings}>
                  Settings
                </ClubButton>
              </Stack>
            </ClubPanel>
          </motion.section>
        ) : activeScreen === "settlement" && settlementFlash?.lastTable ? (
          <motion.section
            key="settlement-screen"
            className="club-landing__settlement"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.42, ease: preset.easing }}
            style={{ width: "100%", flexDirection: "column" }}
          >
            <motion.div
              initial={reduceMotion ? false : { y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.48, ease: preset.easing }}
              style={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <ClubPanel maw={480} w="100%" px="xl" py="xl">
                <Stack gap="sm">
                  <Stack gap="xs" align="center" ta="center">
                    <Text size="xs" tt="uppercase" fw={800} c={clubTokens.text.muted} style={{ letterSpacing: "0.1em" }}>
                      Bar Ledger Settlement
                    </Text>
                    <Title order={2} size="h3" c={clubTokens.text.primary} style={{ fontFamily: "Georgia, serif", letterSpacing: "0.03em" }}>
                      {gameTitle}
                    </Title>
                  </Stack>

                  <Divider color={clubTokens.surface.brassStroke} opacity={0.3} my="sm" />

                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c={clubTokens.text.secondary}>Table Buy-in Stake</Text>
                      <Text size="sm" fw={600} c={clubTokens.text.primary}>
                        {Math.round(settlementFlash.lastTable.buyIn).toLocaleString()} credits
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c={clubTokens.text.secondary}>Closing Table Return</Text>
                      <Text size="sm" fw={600} c={clubTokens.text.primary}>
                        {Math.round(settlementFlash.lastTable.totalReturn).toLocaleString()} credits
                      </Text>
                    </Group>
                  </Stack>

                  <Divider color={clubTokens.surface.brassStroke} opacity={0.3} my="sm" />

                  <Stack gap={4} align="center" ta="center" py="xs">
                    <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted} style={{ letterSpacing: "0.05em" }}>
                      Net Outcome
                    </Text>
                    <Text size="32px" fw={900} style={{ letterSpacing: "0.01em", color: deltaColor, textShadow: `0 0 16px ${deltaColor}33` }}>
                      {formatDeltaCredits(delta)} credits
                    </Text>
                    <Text size="11px" c={clubTokens.text.muted}>
                      {positive ? "Winnings transferred to your global wallet" : muted ? "Even break returned to your global wallet" : "Losses deducted from your global wallet"}
                    </Text>
                  </Stack>

                  <Divider color={clubTokens.surface.brassStroke} opacity={0.3} my="sm" />

                  <blockquote style={{
                    margin: "0.5rem 0",
                    padding: "1rem",
                    background: "rgba(0, 0, 0, 0.25)",
                    borderLeft: `3px solid ${clubTokens.surface.brassStroke}`,
                    borderRadius: "0 8px 8px 0"
                  }}>
                    <Text size="sm" fs="italic" c={clubTokens.text.secondary} lh={1.5}>
                      “{quip}”
                    </Text>
                    <Text size="xs" mt={8} ta="right" fw={700} c={clubTokens.text.brass} style={{ letterSpacing: "0.05em" }}>
                      — THE BARTENDER
                    </Text>
                  </blockquote>

                  <Divider color={clubTokens.surface.brassStroke} opacity={0.3} my="sm" />

                  <ClubButton
                    size="lg"
                    fullWidth
                    variant="fancy"
                    onClick={() => {
                      navigate(location.pathname, { replace: true, state: null });
                      setActiveScreen("menu");
                    }}
                  >
                    {positive ? "Pocket Winnings & Step to Bar" : muted ? "Retrieve Stake & Step to Bar" : "Accept Losses & Step to Bar"}
                  </ClubButton>

                  <Text size="9px" c="dimmed" ta="center" tt="uppercase" mt="sm" style={{ letterSpacing: "0.05em" }}>
                    Receipt Mood: {receiptMood} • Ledger Ref #{(Math.floor(Math.random() * 90000) + 10000)}
                  </Text>
                </Stack>
              </ClubPanel>
            </motion.div>
          </motion.section>
        ) : (
          <motion.section
            key="bar-menu"
            className="club-landing__menu"
            initial={reduceMotion ? false : { x: -110, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 140, opacity: 0 }}
            transition={{ duration: 0.48, ease: preset.easing }}
            style={{ flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "2rem", width: "100%" }}
          >

            <div className="club-landing__menu-inner">
              <Box style={{ flex: "1 1 min(470px, 100%)", maxWidth: "min(470px, 100%)", perspective: 1200, width: "100%" }}>
                <AnimatePresence mode="wait" initial={false}>
                  {!selectedGame ? (
                    <motion.div
                      key="main-menu"
                      initial={reduceMotion ? {} : { rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.45, ease: "easeInOut" }}
                      style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden", width: "100%" }}
                    >
                      <ClubPanel maw={470} w="100%" className="club-menu-card">
                        <Stack gap="md">
                          <Stack gap={3} ta="center">
                            <Box style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                              <VcLogoBarMark width={180} />
                            </Box>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                              Club modifiers
                            </Text>
                            {activeModifierLines.map((line) => (
                              <Text key={line} size="xs" c={clubTokens.text.secondary}>
                                {line}
                              </Text>
                            ))}
                          </Stack>
                          {activeSession ? (
                            <Alert
                              color={
                                activeSession.gameId === "oubliette_no9"
                                  ? "yellow"
                                  : activeSession.gameId === "seven_year_itch"
                                    ? "orange"
                                    : "grape"
                              }
                              variant="light"
                              title="Table still open"
                              mt="xs"
                            >
                              <Text size="sm" c={clubTokens.text.secondary} mb="xs">
                                You have an active {activeSession.gameId === "oubliette_no9" ? "Oubliette No. 9" : activeSession.gameId === "seven_year_itch" ? "7 Year Itch" : "Fateseal Silver"} session.
                              </Text>
                              <Group gap="xs" grow>
                                <ClubButton
                                  size="xs"
                                  variant="filled"
                                  onClick={() => {
                                    const gameRoute =
                                      activeSession.gameId === "oubliette_no9"
                                        ? "/minigames/oubliette-no9"
                                        : activeSession.gameId === "seven_year_itch"
                                          ? "/minigames/seven-year-itch"
                                          : "/minigames/fateseal-silver";
                                    navigate(gameRoute);
                                  }}
                                >
                                  Resume
                                </ClubButton>
                                <ClubButton size="xs" variant="subtle" color="red" onClick={openAbandon}>
                                  Abandon
                                </ClubButton>
                              </Group>
                            </Alert>
                          ) : null}

                          <Divider color={clubTokens.surface.brassStroke} opacity={0.45} />

                          {GAME_ENTRIES.map((game) => (
                            <button key={game.id} type="button" className="club-menu-card__entry" onClick={() => openGameLanding(game)}>
                              <span>
                                <strong>{game.title}</strong>
                                <small>{game.subtitle}</small>
                              </span>
                            </button>
                          ))}

                          <button type="button" className="club-menu-card__entry" onClick={openSettings}>
                            <span>
                              <strong>Settings</strong>
                              <small>Music, sound, progress</small>
                            </span>
                          </button>

                          <Text size="xs" c={clubTokens.text.muted} ta="center">
                            {import.meta.env.DEV ? (
                              <>
                                Dev:{" "}
                                <Link to="/__playground" style={{ color: clubTokens.text.brass }}>
                                  UI playground
                                </Link>
                                {" · "}
                                <Text
                                  component="button"
                                  type="button"
                                  c="brass"
                                  td="underline"
                                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                                  onClick={() => setHasSave(!hasSave)}
                                >
                                  Toggle save stub
                                </Text>
                              </>
                            ) : (
                              <Link to="/__playground" style={{ color: clubTokens.text.brass }}>
                                UI playground
                              </Link>
                            )}
                          </Text>
                        </Stack>
                      </ClubPanel>
                    </motion.div>
                  ) : (
                    (() => {
                      const game = selectedGame!;
                      return (
                        <motion.div
                          key={`game-${game.id}`}
                          initial={reduceMotion ? {} : { rotateY: -90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={reduceMotion ? { opacity: 0 } : { rotateY: 90, opacity: 0 }}
                          transition={{ duration: 0.45, ease: "easeInOut" }}
                          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden", width: "100%" }}
                        >
                          <ClubPanel maw={470} w="100%" className="club-menu-card">
                            <Stack gap="md">
                              <Group justify="space-between" align="flex-start">
                                <Stack gap={2}>
                                  <Title order={2} c={clubTokens.text.brass} style={{ fontFamily: "Cinzel, Georgia, Times New Roman, serif", fontSize: "1.6rem" }}>
                                    {game.title}
                                  </Title>
                                </Stack>
                                <Group grow wrap="nowrap" gap="xs" style={{ width: "100%" }}>
                                  <ClubButton variant="light" size="xs" onClick={openRules} fullWidth>
                                    Tutorial
                                  </ClubButton>
                                  <ClubButton variant="light" size="xs" onClick={() => setSelectedGame(null)} fullWidth>
                                    Menu
                                  </ClubButton>
                                </Group>

                              </Group>
                              <Text size="sm" c={clubTokens.text.secondary}>
                                Buy-in {game.buyIn.toLocaleString()} credits. Base return ceiling{" "}
                                {gameReturnCeiling(game).toLocaleString()} credits before tonight’s specials.
                              </Text>
                              <Stack gap={4}>
                                <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                                  Current modifiers
                                </Text>
                                {activeModifierLines.map((line) => (
                                  <Text key={line} size="xs" c={clubTokens.text.secondary}>
                                    {line}
                                  </Text>
                                ))}
                              </Stack>
                              <Select
                                label="Ruleset"
                                data={game.rulesets}
                                value={ruleset}
                                onChange={(value) => setRuleset(value ?? game.rulesets[0]?.value ?? "")}
                                allowDeselect={false}
                              />
                              {sessionError ? (
                                <Alert color="red" variant="light" title="Cannot start table" onClose={() => setSessionError(null)} withCloseButton>
                                  {sessionError}
                                </Alert>
                              ) : null}
                              {activeSession && activeSession.gameId !== game.id ? (
                                <Alert color="red" variant="light" title="Active session exists">
                                  You have an active session in {
                                    activeSession.gameId === "oubliette_no9"
                                      ? "Oubliette No. 9"
                                      : activeSession.gameId === "seven_year_itch"
                                        ? "7 Year Itch"
                                        : "Fateseal Silver"
                                  }. You must resume or abandon it before starting a new game.
                                </Alert>
                              ) : null}
                              <Group grow>
                                <ClubButton
                                  loading={startingGame === game.id}
                                  disabled={Boolean(activeSession && activeSession.gameId !== game.id)}
                                  onClick={() => startGame(game)}
                                >
                                  {activeSession?.gameId === game.id ? "Resume game" : "Start game"}
                                </ClubButton>
                              </Group>
                              {activeSession && activeSession.gameId === game.id ? (
                                <ClubButton fullWidth variant="subtle" color="red" onClick={openAbandon}>
                                  Abandon table…
                                </ClubButton>
                              ) : null}
                            </Stack>
                          </ClubPanel>
                        </motion.div>
                      );
                    })()
                  )}
                </AnimatePresence>
              </Box>

              <Stack gap="md" className="club-settlement-dock">
                <ClubPanel maw={360} w="min(360px, 100%)" px="md" py="md">
                  <Group justify="space-between" gap="md">
                    <Text size="sm" c={clubTokens.text.secondary}>
                      Club balance
                    </Text>
                    <Text fw={700} c={clubTokens.text.brass}>
                      {clubBalance.toLocaleString()} credits
                    </Text>
                  </Group>
                </ClubPanel>

                <ClubPanel maw={360} w="min(360px, 100%)" px="md" py="md">
                  <Group justify="space-between" gap="xs">
                    <Text size="sm" c={clubTokens.text.secondary}>
                      Tonight’s band
                    </Text>
                    <Text size="sm" fw={600}>
                      {band}
                    </Text>
                  </Group>
                </ClubPanel>

              </Stack>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <Modal opened={rulesOpened} onClose={closeRules} title={`${activeGame.title} rules`} centered>
        <Stack gap="sm">
          <Text size="sm">
            Buy in once from your club balance. Table credits stay inside the session until the game reaches a settlement.
          </Text>
          <Text size="sm">
            {activeGame.id === "seven_year_itch"
              ? "7 Year Itch uses crapless rules: 7 wins on come-out, any other total opens the case, and heat builds every four rolls."
              : activeGame.id === "fateseal_silver"
                ? "Fateseal Silver is a 5×5 cascading slot: seal a prophecy, watch the stone tablet shatter and refill, and bargain at the Crossroads every third spin."
                : "Oubliette No. 9 is the club’s poker roguelike table: build hands, survive rounds, and cash out when the run resolves."}
          </Text>
        </Stack>
      </Modal>

      <Modal opened={settingsOpened} onClose={closeSettings} title="Settings" centered size="md">
        <Stack gap="md">
          {!resetProgressArmed ? (
            <>
              <Switch data-autofocus label="Music" checked={musicEnabled} onChange={(e) => setMusicEnabled(e.currentTarget.checked)} />
              <Switch label="Sound effects" checked={sfxEnabled} onChange={(e) => setSfxEnabled(e.currentTarget.checked)} />
              <div>
                <Text size="sm" mb={6}>
                  Global music volume
                </Text>
                <Slider value={Math.round(musicVolume * 100)} onChange={(v) => setMusicVolume(v / 100)} />
              </div>
              <div>
                <Text size="sm" mb={6}>
                  Global sound effects volume
                </Text>
                <Slider value={Math.round(sfxVolume * 100)} onChange={(v) => setSfxVolume(v / 100)} />
              </div>
              <div>
                <Text size="sm" mb={6}>
                  Repeating SFX attenuation floor (% of SFX volume, 0–10)
                </Text>
                <Slider max={10} step={0.5} value={repeatSfxAttenuationPercent} onChange={setRepeatSfxAttenuationPercent} />
              </div>
              <Text size="xs" c="dimmed">
                At the door, music starts at 30% of this setting and fades to full after you enter.
              </Text>
              <Divider />
              <Text size="sm" fw={600}>
                Progress
              </Text>
              <ClubButton variant="light" color="red" fullWidth onClick={() => setResetProgressArmed(true)}>
                Reset game progress…
              </ClubButton>
            </>
          ) : (
            <>
              <Alert color="red" variant="light" title="Reset all progress?">
                This cannot be undone. Audio levels, motion, and minigame UI preferences are kept.
              </Alert>
              <Group grow>
                <ClubButton variant="light" onClick={() => setResetProgressArmed(false)}>
                  Back
                </ClubButton>
                <ClubButton
                  variant="filled"
                  color="red"
                  onClick={() => {
                    resetShellGameProgress();
                    setResetProgressArmed(false);
                    closeSettings();
                  }}
                >
                  Confirm reset
                </ClubButton>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

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
                setSelectedGame(null);
              }}
            >
              Abandon — lose buy-in
            </ClubButton>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
