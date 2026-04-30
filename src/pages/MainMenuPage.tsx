import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Badge,
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
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { isBarRouteState, tableReturnTagline } from "@/game/barRouteState";
import { useClubFlowStore } from "@/game/clubFlowStore";
import { useClubWallet } from "@/game/clubWalletStore";
import { resetShellGameProgress } from "@/game/resetShellGameProgress";
import { resolveActiveClubSpecial, resolveSpecialDefinitionRow } from "@/game/specialsResolver";
import {
  buildOublietteSettlementProfile,
  buildSevenYearItchSettlementProfile,
  getOublietteBaseReturnCeiling,
  getSevenYearItchBaseReturnCeiling,
} from "@/game/sessionSettlement";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

type GameKey = "oubliette_no9" | "seven_year_itch";

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
    title: "Oubliette No. 9",
    subtitle: "Poker roguelike table",
    route: "/minigames/oubliette-no9",
    buyIn: villainsGameDefaults.oublietteNo9.defaultBuyIn,
    rulesets: [{ value: "house", label: "House rules" }],
  },
  {
    id: "seven_year_itch",
    title: "7 Year Itch",
    subtitle: "Crapless business racket",
    route: "/minigames/seven-year-itch",
    buyIn: villainsGameDefaults.sevenYearItch.defaultBuyIn,
    rulesets: [{ value: "nv-crapless", label: "NV crapless" }],
  },
];

function gameReturnCeiling(game: GameMenuEntry): number {
  if (game.id === "oubliette_no9") {
    return getOublietteBaseReturnCeiling(buildOublietteSettlementProfile(game.buyIn));
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
  const { clubBalance, hasSave, setHasSave, activeSession, startSession } = useClubWallet();
  const hasEnteredClub = useClubFlowStore((s) => s.hasEnteredClub);
  const setHasEnteredClub = useClubFlowStore((s) => s.setHasEnteredClub);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [rulesOpened, { open: openRules, close: closeRules }] = useDisclosure(false);
  const [resetProgressArmed, setResetProgressArmed] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameMenuEntry | null>(null);
  const [ruleset, setRuleset] = useState("house");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState<GameKey | null>(null);
  const [settlementFlash] = useState(() => (isBarRouteState(location.state) ? location.state : null));

  useEffect(() => {
    document.title = "The Villains Club";
  }, []);

  useEffect(() => {
    if (forceEntered && !hasEnteredClub) {
      setHasEnteredClub(true);
    }
  }, [forceEntered, hasEnteredClub, setHasEnteredClub]);

  useLayoutEffect(() => {
    if (isBarRouteState(location.state)) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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
          : buildSevenYearItchSettlementProfile(game.buyIn);
      const result = startSession({
        gameId: game.id,
        drinkId: game.id === "oubliette_no9" ? "club_table" : "seven_year_itch",
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

  const activeGame = selectedGame ?? GAME_ENTRIES[0];
  const entered = forceEntered || hasEnteredClub;

  return (
    <Box className={`club-landing ${entered ? "club-landing--entered" : ""}`}>
      <MenuHazeBackground />
      <div className="club-landing__shelves" aria-hidden="true" />
      <motion.div
        className="club-landing__bar"
        initial={reduceMotion ? false : { y: entered ? 0 : 160 }}
        animate={reduceMotion ? { y: 0 } : { y: entered ? 0 : 160 }}
        transition={{ duration: 0.72, ease: preset.easing }}
        aria-hidden="true"
      />

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
        ) : selectedGame ? (
          <motion.section
            key={`game-${selectedGame.id}`}
            className="club-landing__game"
            initial={reduceMotion ? false : { x: -90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 120, opacity: 0 }}
            transition={{ duration: 0.45, ease: preset.easing }}
          >
            <ClubPanel maw={560} w="min(560px, calc(100vw - 2rem))">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Badge color="orange" variant="light">
                      {selectedGame.subtitle}
                    </Badge>
                    <Title order={2} c={clubTokens.text.brass}>
                      {selectedGame.title}
                    </Title>
                  </Stack>
                  <ClubButton variant="subtle" size="xs" onClick={() => setSelectedGame(null)}>
                    Menu
                  </ClubButton>
                </Group>
                <Text size="sm" c={clubTokens.text.secondary}>
                  Buy-in {selectedGame.buyIn.toLocaleString()} credits. Base return ceiling{" "}
                  {gameReturnCeiling(selectedGame).toLocaleString()} credits before tonight’s specials.
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
                  data={selectedGame.rulesets}
                  value={ruleset}
                  onChange={(value) => setRuleset(value ?? selectedGame.rulesets[0]?.value ?? "")}
                  allowDeselect={false}
                />
                {sessionError ? (
                  <Alert color="red" variant="light" title="Cannot start table" onClose={() => setSessionError(null)} withCloseButton>
                    {sessionError}
                  </Alert>
                ) : null}
                <Group grow>
                  <ClubButton variant="light" onClick={openRules}>
                    How to play / rules
                  </ClubButton>
                  <ClubButton loading={startingGame === selectedGame.id} onClick={() => startGame(selectedGame)}>
                    {activeSession?.gameId === selectedGame.id ? "Resume game" : "Start game"}
                  </ClubButton>
                </Group>
              </Stack>
            </ClubPanel>
          </motion.section>
        ) : (
          <motion.section
            key="bar-menu"
            className="club-landing__menu"
            initial={reduceMotion ? false : { x: -110, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 140, opacity: 0 }}
            transition={{ duration: 0.48, ease: preset.easing }}
          >
            <ClubPanel maw={470} w="min(470px, calc(100vw - 2rem))" className="club-menu-card">
              <Stack gap="md">
                <Stack gap={3} ta="center">
                  <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={700}>
                    Tonight’s menu
                  </Text>
                  <ClubHeading order={2} size="h3" c={clubTokens.text.brass}>
                    The bar is open.
                  </ClubHeading>
                </Stack>

                {settlementFlash?.lastTable ? (
                  <Alert color="teal" variant="light" title="Table settled">
                    <Text size="sm">{tableReturnTagline(settlementFlash.lastTable)}</Text>
                    <Text size="xs" mt={6} c="dimmed">
                      Returned {settlementFlash.lastTable.totalReturn.toLocaleString()} credits.
                    </Text>
                  </Alert>
                ) : null}

                <Group justify="space-between">
                  <Text size="sm" c={clubTokens.text.secondary}>
                    Club balance
                  </Text>
                  <Text fw={700} c={clubTokens.text.brass}>
                    {clubBalance.toLocaleString()} credits
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c={clubTokens.text.secondary}>
                    Tonight’s band
                  </Text>
                  <Text size="sm" fw={600}>
                    {band}
                  </Text>
                </Group>
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

                <Divider />

                {GAME_ENTRIES.map((game) => (
                  <button key={game.id} type="button" className="club-menu-card__entry" onClick={() => openGameLanding(game)}>
                    <span>
                      <strong>{game.title}</strong>
                      <small>{game.subtitle}</small>
                    </span>
                    <em>{game.buyIn.toLocaleString()}</em>
                  </button>
                ))}

                <button type="button" className="club-menu-card__entry" onClick={openSettings}>
                  <span>
                    <strong>Settings</strong>
                    <small>Music, sound, progress</small>
                  </span>
                </button>
                <button type="button" className="club-menu-card__entry" onClick={() => {}} aria-disabled="true">
                  <span>
                    <strong>Loans</strong>
                    <small>Coming soon</small>
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
    </Box>
  );
}
