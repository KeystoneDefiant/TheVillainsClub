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
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { barDateKey, activeBandIndexForBarDate } from "@/audio/barBandSchedule";
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
import { StatsTicker } from "@/components/club/StatsTicker";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { isBarRouteState } from "@/game/barRouteState";
import { useClubFlowStore } from "@/game/clubFlowStore";
import { useClubWallet, getPlayerTitle } from "@/game/clubWalletStore";
import { resetShellGameProgress } from "@/game/resetShellGameProgress";
import { resolveActiveClubSpecial, resolveSpecialDefinitionRow } from "@/game/specialsResolver";
import {
  buildFatesealSettlementProfile,
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  buildMastersonSettlementProfile,
  getFatesealBaseReturnCeiling,
  getOublietteBaseReturnCeiling,
  getSevenYearItchBaseReturnCeiling,
  getMastersonBaseReturnCeiling,
} from "@/game/sessionSettlement";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

type GameKey = "oubliette_no9" | "seven_year_itch" | "fateseal_silver" | "masterson_1881";

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
  {
    id: "masterson_1881",
    title: "Masterton 1881",
    subtitle: "Run a Roulette Game or Run a Scam - It's All The Same.",
    route: "/minigames/masterson-1881",
    buyIn: villainsGameDefaults.masterson1881.defaultBuyIn,
    rulesets: [{ value: "normalGame", label: "House rules" }],
  },
];

function gameReturnCeiling(game: GameMenuEntry): number {
  if (game.id === "oubliette_no9") {
    return getOublietteBaseReturnCeiling(buildOublietteSettlementProfile(game.buyIn));
  }
  if (game.id === "fateseal_silver") {
    return getFatesealBaseReturnCeiling(buildFatesealSettlementProfile(game.buyIn));
  }
  if (game.id === "masterson_1881") {
    return getMastersonBaseReturnCeiling(buildMastersonSettlementProfile(game.buyIn));
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
  const {
    clubBalance,
    hasSave,
    setHasSave,
    activeSession,
    startSession,
    forfeitActiveSession,
    startTutorialSession,
    hasPlayedFirstGame,
    isBum,
    customPlayerTitle,
    showBankruptcyDialogue,
    dismissBankruptcyDialogue,
    selectPlayerTitle,
    payBumFee,
    playedGames,
    playerName,
  } = useClubWallet();
  const hasEnteredClub = useClubFlowStore((s) => s.hasEnteredClub);
  const setHasEnteredClub = useClubFlowStore((s) => s.setHasEnteredClub);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [abandonOpened, { open: openAbandon, close: closeAbandon }] = useDisclosure(false);
  const [titlesOpened, { open: openTitles, close: closeTitles }] = useDisclosure(false);
  const [bandScheduleOpened, { open: openBandSchedule, close: closeBandSchedule }] = useDisclosure(false);
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
  const activeBandObj = useMemo(() => {
    const idx = effectiveBandIndexForBarDate(barDateKey(new Date()));
    return bandsCatalog.bands[idx] ?? null;
  }, []);

  const next5DaysSchedule = useMemo(() => {
    const list = [];
    const baseDate = new Date();
    for (let i = 0; i < 5; i++) {
      const target = new Date(baseDate.getTime());
      target.setDate(baseDate.getDate() + i);
      const dateKey = barDateKey(target);
      const bandIdx =
        i === 0
          ? effectiveBandIndexForBarDate(dateKey)
          : activeBandIndexForBarDate(dateKey, bandsCatalog);
      const band = bandsCatalog.bands[bandIdx] ?? null;

      let label = "";
      if (i === 0) label = "Tonight’s Performance";
      else if (i === 1) label = "Tomorrow";
      else label = target.toLocaleDateString("en-US", { weekday: "long" });

      const dateLabel = target.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      list.push({
        label,
        dateLabel,
        band,
        isTonight: i === 0,
      });
    }
    return list;
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

      // Automatically trigger the tutorial on the first time playing
      if (!playedGames[game.id]) {
        startTutorialSession(game.id);
        navigate(game.route);
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
            : game.id === "masterson_1881"
              ? buildMastersonSettlementProfile(game.buyIn)
              : buildSevenYearItchSettlementProfile(game.buyIn);
      const drinkId =
        game.id === "oubliette_no9"
          ? "club_table"
          : game.id === "fateseal_silver"
            ? "fateseal_silver"
            : game.id === "masterson_1881"
              ? "masterson_1881"
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
    [activeSession, clubBalance, navigate, startSession, playedGames, startTutorialSession],
  );

  const tone = useMemo(() => {
    if (!settlementFlash?.lastTable) return "break_even";
    return barSettlementTone(settlementFlash.lastTable);
  }, [settlementFlash]);

  const currentTitle = useMemo(() => {
    return getPlayerTitle({ clubBalance, hasPlayedFirstGame, isBum, customPlayerTitle });
  }, [clubBalance, hasPlayedFirstGame, isBum, customPlayerTitle]);

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
      masterson_1881: "Masterton 1881",
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
                    {settlementFlash.lastTable.endReason ? (
                      <Text size="sm" fs="italic" c={clubTokens.text.secondary} mt={2}>
                        {settlementFlash.lastTable.endReason}
                      </Text>
                    ) : null}
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

                  {settlementFlash.lastTable.stats && settlementFlash.lastTable.stats.length > 0 ? (
                    <StatsTicker
                      stats={settlementFlash.lastTable.stats}
                      reduceMotion={reduceMotion}
                    />
                  ) : null}

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
                                    : activeSession.gameId === "fateseal_silver"
                                      ? "grape"
                                      : "yellow"
                              }
                              variant="light"
                              title="Table still open"
                              mt="xs"
                            >
                              <Text size="sm" c={clubTokens.text.secondary} mb="xs">
                                You have an active {
                                  activeSession.gameId === "oubliette_no9"
                                    ? "Oubliette No. 9"
                                    : activeSession.gameId === "seven_year_itch"
                                      ? "7 Year Itch"
                                      : activeSession.gameId === "fateseal_silver"
                                        ? "Fateseal Silver"
                                        : "Masterton 1881"
                                } session.
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
                                          : activeSession.gameId === "fateseal_silver"
                                            ? "/minigames/fateseal-silver"
                                            : "/minigames/masterson-1881";
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
                                  <ClubButton
                                    variant="light"
                                    size="xs"
                                    disabled={Boolean(activeSession)}
                                    onClick={() => {
                                      startTutorialSession(game.id);
                                      navigate(game.route);
                                    }}
                                    fullWidth
                                  >
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
                                        : activeSession.gameId === "fateseal_silver"
                                          ? "Fateseal Silver"
                                          : "Masterton 1881"
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
                <ClubPanel
                  maw={360}
                  w="min(360px, 100%)"
                  px="md"
                  py="md"
                  className="players-card-hover-gold-sheen"
                  styles={{
                    root: {
                      outline: "none",
                      "&:hover, &:focus, &:focus-visible, &:active": {
                        outline: "none !important",
                      },
                    },
                  }}
                  onClick={openTitles}
                >
                  <Stack gap="xs">
                    <Text size="xs" tt="uppercase" fw={800} c={clubTokens.text.muted} style={{ letterSpacing: "0.05em" }}>
                      Player's Card
                    </Text>
                    <Divider color={clubTokens.surface.brassStroke} opacity={0.2} />
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Stack gap={2}>
                        <Text size="sm" fw={700} c={clubTokens.text.primary}>
                          {playerName || "Anonymous"}
                        </Text>
                        <Text size="10px" fw={700} c={isBum ? "#ef5350" : clubTokens.text.brass} style={{ letterSpacing: "0.04em" }}>
                          {currentTitle}
                        </Text>
                      </Stack>
                      <Text fw={700} c={clubTokens.text.brass}>
                        {clubBalance.toLocaleString()} credits
                      </Text>
                    </Group>
                  </Stack>
                </ClubPanel>

                <ClubPanel
                  maw={360}
                  w="min(360px, 100%)"
                  px="md"
                  py="md"
                  className="players-card-hover-gold-sheen"
                  styles={{
                    root: {
                      cursor: "pointer",
                      outline: "none",
                      "&:hover, &:focus, &:focus-visible, &:active": {
                        outline: "none !important",
                      },
                    },
                  }}
                  onClick={openBandSchedule}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" gap="xs">
                      <Text size="sm" c={clubTokens.text.secondary}>
                        Tonight’s band
                      </Text>
                      <Text size="sm" fw={600}>
                        {activeBandObj?.display_name ?? "House band"}
                      </Text>
                    </Group>
                    {activeBandObj?.modifier ? (
                      <Text size="xs" c="dimmed" style={{ fontStyle: "italic", textAlign: "center" }}>
                        {activeBandObj.modifier.description}
                      </Text>
                    ) : null}
                  </Stack>
                </ClubPanel>


                <Group justify="space-between" gap="xs">
                  <button type="button" className="club-menu-card__entry" onClick={openSettings}>
                    <span>
                      <strong>Settings</strong>
                      <small>Music, sound, progress</small>
                    </span>
                  </button>
                </Group>


              </Stack>
            </div>
          </motion.section>
        )}
      </AnimatePresence>



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

      {/* Club Credits & Titles Dossier Modal */}
      <Modal
        opened={titlesOpened}
        onClose={closeTitles}
        title={
          <Text fw={700} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
            Villainous Dossier &amp; Titles
          </Text>
        }
        centered
        size="md"
        styles={{
          content: {
            background: "radial-gradient(circle at top, #2e1d13 0%, #140d08 100%)",
            border: `2px solid ${clubTokens.surface.brassStroke}`,
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.9)",
            color: "#ffffff",
          },
          header: {
            background: "transparent",
            borderBottom: "1px solid rgba(230, 184, 52, 0.25)",
            paddingBottom: "10px",
          },
          close: {
            color: clubTokens.text.brass,
            "&:hover": {
              background: "rgba(255, 255, 255, 0.05)",
            },
          },
        }}
      >
        <Stack gap="md" p="xs" style={{ position: "relative" }}>
          {/* Ornate inner dashed border */}
          <Box
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              border: "1px dashed rgba(230, 184, 52, 0.1)",
              borderRadius: "10px",
              pointerEvents: "none",
            }}
          />

          <Stack gap={2} ta="center" py="xs">
            <Text size="xs" tt="uppercase" fw={800} c={clubTokens.text.muted} style={{ letterSpacing: "0.05em" }}>
              Active Title
            </Text>
            <Text size="xl" fw={900} c={isBum ? "#ef5350" : clubTokens.text.brass} style={{ textShadow: "0 0 8px rgba(230,184,52,0.25)" }}>
              {currentTitle}
            </Text>
            <Text size="xs" c="dimmed">
              Current wallet balance: <strong>{clubBalance.toLocaleString()} credits</strong>
            </Text>
          </Stack>

          {!isBum && (
            <>
              <Divider color={clubTokens.surface.brassStroke} opacity={0.2} label="SELECTABLE TITLES" labelPosition="center" />

              <Stack gap="sm">
                {villainsGameDefaults.playerTitles.map((t) => {
                  const qualifies = (id: string): boolean => {
                    if (id === "new_villain") return true;
                    if (id === "villain") return hasPlayedFirstGame;
                    if (id === "known_villain") return clubBalance >= 30000;
                    if (id === "notorious_villain") return clubBalance >= 1000000;
                    return false;
                  };

                  const isQualified = qualifies(t.id);
                  const isActive = !isBum && currentTitle === t.title;

                  return (
                    <Group
                      key={t.id}
                      justify="space-between"
                      p="sm"
                      style={{
                        background: isActive ? "rgba(230, 184, 52, 0.08)" : "rgba(0,0,0,0.25)",
                        border: isActive ? `1.5px solid ${clubTokens.surface.brassStroke}` : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        cursor: isQualified ? "pointer" : "not-allowed",
                        opacity: isQualified ? 1 : 0.45,
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => {
                        if (isQualified) {
                          selectPlayerTitle(t.id);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (isQualified && !isActive) {
                          e.currentTarget.style.borderColor = "rgba(230, 184, 52, 0.4)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                          e.currentTarget.style.background = "rgba(0,0,0,0.25)";
                        }
                      }}
                    >
                      <Stack gap={2}>
                        <Text size="sm" fw={700} c={isActive ? clubTokens.text.brass : "white"}>
                          {t.title}
                        </Text>
                        <Text size="10px" c="dimmed">
                          {t.id === "new_villain"
                            ? "Default starting title"
                            : t.id === "villain"
                            ? "Unlocked after playing your first game"
                            : t.id === "known_villain"
                            ? "Requires 30,000+ club credits"
                            : "Requires 1,000,000+ club credits"}
                        </Text>
                      </Stack>
                      <Group gap="xs">
                        {isActive && (
                          <Text size="xs" fw={800} c={clubTokens.text.brass} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span>✓</span> ACTIVE
                          </Text>
                        )}
                        {!isActive && isQualified && (
                          <Text size="10px" c={clubTokens.text.brass} tt="uppercase" fw={700}>
                            Select
                          </Text>
                        )}
                        {!isQualified && (
                          <Text size="10px" c="#ef5350" tt="uppercase" fw={700}>
                            Locked
                          </Text>
                        )}
                      </Group>
                    </Group>
                  );
                })}
              </Stack>
            </>
          )}

          {isBum && (
            <Stack
              gap="xs"
              p="md"
              style={{
                background: "rgba(239, 83, 80, 0.05)",
                border: "1px solid rgba(239, 83, 80, 0.2)",
                borderRadius: "8px",
                marginTop: "12px",
              }}
            >
              <Title order={5} c="#ef5350" style={{ fontFamily: "Georgia, serif" }}>
                Get Square with the Club
              </Title>
              <Text size="xs" c="rgba(255, 255, 255, 0.8)" lh={1.4}>
                The house has covered your bankruptcy, but your reputation is currently set to <strong>Smelly Bum</strong>. 
                To settle your debt and restore your villainous title, you must pay the house a fee of <strong>10,000 credits</strong>. 
                This requires having at least <strong>30,000 credits</strong> in hand.
              </Text>
              <Group justify="space-between" mt="xs" align="center">
                <Text size="xs" c="dimmed">
                  Required: $30,000 • Fee: $10,000
                </Text>
                <ClubButton
                  size="sm"
                  variant="filled"
                  color="red"
                  disabled={clubBalance < 30000}
                  onClick={() => {
                    const success = payBumFee();
                    if (success) {
                      closeTitles();
                    }
                  }}
                >
                  PAY DEBT ($10,000)
                </ClubButton>
              </Group>
            </Stack>
          )}

          <ClubButton
            onClick={closeTitles}
            variant="fancy"
            size="sm"
            fullWidth
            mt="xs"
          >
            DISMISS DOSSIER
          </ClubButton>
        </Stack>
      </Modal>

      {/* Bar Band Schedule Modal */}
      <Modal
        opened={bandScheduleOpened}
        onClose={closeBandSchedule}
        title={
          <Text fw={700} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
            Bar Band Schedule
          </Text>
        }
        centered
        size="md"
        styles={{
          content: {
            background: "radial-gradient(circle at top, #2e1d13 0%, #140d08 100%)",
            border: `2px solid ${clubTokens.surface.brassStroke}`,
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.9)",
            color: "#ffffff",
          },
          header: {
            background: "transparent",
            borderBottom: "1px solid rgba(230, 184, 52, 0.25)",
            paddingBottom: "10px",
          },
          close: {
            color: clubTokens.text.brass,
            "&:hover": {
              background: "rgba(255, 255, 255, 0.05)",
            },
          },
        }}
      >
        <Stack gap="md" p="xs" style={{ position: "relative" }}>
          {/* Ornate inner dashed border */}
          <Box
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              border: "1px dashed rgba(230, 184, 52, 0.1)",
              borderRadius: "10px",
              pointerEvents: "none",
            }}
          />

          <Stack gap="sm">
            {next5DaysSchedule.map(({ label, dateLabel, band, isTonight }) => (
              <Box
                key={label}
                p="sm"
                style={{
                  background: isTonight ? "rgba(230, 184, 52, 0.08)" : "rgba(0, 0, 0, 0.25)",
                  border: isTonight ? `1.5px solid ${clubTokens.surface.brassStroke}` : "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                  boxShadow: isTonight ? "0 0 12px rgba(230, 184, 52, 0.15)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Stack gap={2}>
                    <Group gap="xs" align="center">
                      <Text size="xs" tt="uppercase" fw={800} c={isTonight ? clubTokens.text.brass : clubTokens.text.muted} style={{ letterSpacing: "0.05em" }}>
                        {label}
                      </Text>
                      {isTonight && (
                        <Box
                          px={6}
                          py={1}
                          style={{
                            background: clubTokens.text.brass,
                            borderRadius: "4px",
                          }}
                        >
                          <Text size="9px" fw={800} c="#000000" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                            Tonight
                          </Text>
                        </Box>
                      )}
                    </Group>
                    <Text size="sm" fw={700} c={isTonight ? "white" : "rgba(255, 255, 255, 0.9)"}>
                      {band?.display_name ?? "House band"}
                    </Text>
                  </Stack>
                  <Text size="11px" c={clubTokens.text.muted}>
                    {dateLabel}
                  </Text>
                </Group>
                {band?.modifier ? (
                  <>
                    <Divider color={isTonight ? clubTokens.surface.brassStroke : "rgba(255,255,255,0.05)"} opacity={isTonight ? 0.35 : 0.2} my={8} />
                    <Text size="xs" c={isTonight ? clubTokens.text.brass : "dimmed"} style={{ fontStyle: "italic" }}>
                      Modifier: {band.modifier.description}
                    </Text>
                  </>
                ) : null}
              </Box>
            ))}
          </Stack>

          <ClubButton
            onClick={closeBandSchedule}
            variant="fancy"
            size="sm"
            fullWidth
            mt="xs"
          >
            DISMISS SCHEDULE
          </ClubButton>
        </Stack>
      </Modal>

      {/* Squeezed Out / Bankruptcy Dialogue Overlay */}
      <AnimatePresence>
        {showBankruptcyDialogue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(5, 5, 8, 0.88)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              style={{
                width: "100%",
                maxWidth: 550,
                position: "relative",
              }}
            >
              <Paper
                p="xl"
                radius="md"
                style={{
                  background: `linear-gradient(135deg, ${clubTokens.surface.walnutHi} 0%, ${clubTokens.surface.panel} 100%)`,
                  border: `2px solid ${clubTokens.surface.brassStroke}`,
                  boxShadow: "0 12px 48px rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  color: "#ffffff",
                }}
              >
                {/* Ornate dashed border */}
                <Box
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    right: 10,
                    bottom: 10,
                    border: "1px dashed rgba(230, 184, 52, 0.15)",
                    borderRadius: "8px",
                    pointerEvents: "none",
                  }}
                />

                {/* Header */}
                <Group justify="space-between" align="center" wrap="nowrap" style={{ zIndex: 1 }}>
                  <Group gap="sm" wrap="nowrap">
                    <span
                      style={{
                        fontSize: "1.5rem",
                        lineHeight: 1,
                        filter: "drop-shadow(0 0 6px rgba(199,158,87,0.6))",
                      }}
                      aria-hidden
                    >
                      🤵
                    </span>
                    <Stack gap={1}>
                      <Title
                        order={4}
                        fz="sm"
                        c={clubTokens.text.brass}
                        style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
                      >
                        The Bartender
                      </Title>
                      <Text size="10px" c={clubTokens.text.muted} tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
                        Sobering Intervention
                      </Text>
                    </Stack>
                  </Group>
                </Group>

                <hr style={{ margin: 0, border: 0, borderTop: `1px solid ${clubTokens.surface.brassStroke}`, opacity: 0.3, zIndex: 1 }} />

                {/* Dialogue */}
                <Stack gap={4} style={{ zIndex: 1 }}>
                  <Text
                    size="xs"
                    fw={700}
                    c="#ef5350"
                    tt="uppercase"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    Bankruptcy Alert
                  </Text>
                  <Text
                    size="sm"
                    c={clubTokens.text.primary}
                    style={{
                      fontStyle: "italic",
                      lineHeight: 1.5,
                      minHeight: 64,
                      whiteSpace: "pre-line",
                    }}
                  >
                    "Squeezed out to the last drop, are we? The house doesn't like broke guests cluttering the velvet, but we aren't completely heartless.

                    We've reset your credits to 10,000, but it comes at a steep price: until you pay back the house fee of 10,000 credits (which requires having at least 30,000 credits in hand), you will carry the mark of a 'Smelly Bum'. Step lively and get square."
                  </Text>
                </Stack>

                <hr style={{ margin: 0, border: 0, borderTop: `1px solid ${clubTokens.surface.brassStroke}`, opacity: 0.3, zIndex: 1 }} />

                {/* Action button */}
                <Group justify="flex-end" style={{ zIndex: 1 }}>
                  <ClubButton
                    size="md"
                    variant="filled"
                    color="red"
                    onClick={dismissBankruptcyDialogue}
                  >
                    Accept the Humiliation
                  </ClubButton>
                </Group>
              </Paper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box >
  );
}
