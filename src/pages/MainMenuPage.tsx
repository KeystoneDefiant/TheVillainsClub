import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Group, Modal, Slider, Stack, Switch, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { useClubWallet } from "@/game/clubWalletStore";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { shellMenuContainerVariants, shellMenuItemVariants } from "@/motion/shellMotion";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

export function MainMenuPage() {
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const { clubBalance, hasSave, setHasSave, activeSession } = useClubWallet();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);

  useEffect(() => {
    document.title = "Main menu — The Villains Club";
  }, []);

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

  const container = useMemo(
    () => shellMenuContainerVariants(preset, reduceMotion),
    [preset, reduceMotion],
  );
  const item = useMemo(() => shellMenuItemVariants(preset, reduceMotion), [preset, reduceMotion]);

  const oublietteOpen = activeSession?.gameId === "oubliette_no9";
  const canContinue = hasSave || oublietteOpen;

  const onContinue = () => {
    if (oublietteOpen) navigate("/minigames/oubliette-no9");
    else navigate("/bar");
  };

  return (
    <Box
      style={{
        position: "relative",
        minHeight: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <MenuHazeBackground />
      <Group
        justify="space-between"
        align="flex-start"
        wrap="nowrap"
        p={{ base: "md", sm: "xl" }}
        style={{ position: "relative", zIndex: 1, height: "100%" }}
      >
        <Stack gap="xs" maw={420} visibleFrom="sm">
          <Title order={4} c={clubTokens.text.muted} fw={500}>
            Tonight
          </Title>
          <ClubHeading order={2} size="h2" c={clubTokens.text.primary}>
            The bar is open.
          </ClubHeading>
          <Text c={clubTokens.text.secondary}>
            Order a drink, pick a table, and leave the rest of your club balance outside the game.
          </Text>
          <Text size="sm" c={clubTokens.text.muted} fs="italic" mt="xs">
            Step through the velvet—once you are inside, the floor takes your buy-ins.
          </Text>
        </Stack>

        <ClubPanel maw={440} w="100%" mx={{ base: "auto", sm: 0 }}>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ width: "100%", backfaceVisibility: "hidden" }}
          >
            <Stack gap="lg">
              <motion.div variants={item} style={{ backfaceVisibility: "hidden" }}>
                <Stack gap={4}>
                  <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={600}>
                    Club balance
                  </Text>
                  <Text size="xl" fw={700} c={clubTokens.text.brass}>
                    {clubBalance.toLocaleString()} credits
                  </Text>
                </Stack>
              </motion.div>

              <motion.div variants={item} style={{ backfaceVisibility: "hidden" }}>
                <Stack gap="sm">
                  <ClubButton
                    fullWidth
                    disabled={!canContinue}
                    variant={canContinue ? "filled" : "light"}
                    onClick={onContinue}
                    title={
                      canContinue
                        ? undefined
                        : "Nothing to resume yet—enter the club or finish a run when saves are wired."
                    }
                  >
                    {oublietteOpen ? "Resume table" : "Continue"}
                  </ClubButton>
                  <ClubButton fullWidth onClick={() => navigate("/bar")}>
                    Enter the club
                  </ClubButton>
                  <Text size="xs" c={clubTokens.text.muted} ta="center" fs="italic">
                    The host tips their hat—past this door, tables bite your balance on purpose.
                  </Text>
                  <ClubButton fullWidth variant="light" onClick={openSettings}>
                    Settings
                  </ClubButton>
                  <ClubButton fullWidth variant="subtle" color="gray" onClick={() => window.close()}>
                    Quit
                  </ClubButton>
                </Stack>
              </motion.div>

              {import.meta.env.DEV ? (
                <Text size="xs" c={clubTokens.text.muted}>
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
                </Text>
              ) : null}
            </Stack>
          </motion.div>
        </ClubPanel>
      </Group>

      <Modal opened={settingsOpened} onClose={closeSettings} title="Audio" centered size="md">
        <Stack gap="md">
          <Switch
            data-autofocus
            label="Music"
            checked={musicEnabled}
            onChange={(e) => setMusicEnabled(e.currentTarget.checked)}
          />
          <Switch
            label="Sound effects"
            checked={sfxEnabled}
            onChange={(e) => setSfxEnabled(e.currentTarget.checked)}
          />
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
            <Slider
              max={10}
              step={0.5}
              value={repeatSfxAttenuationPercent}
              onChange={setRepeatSfxAttenuationPercent}
            />
          </div>
          <Text size="xs" c="dimmed">
            These settings apply to the club shell and minigames (persisted in this build).
          </Text>
        </Stack>
      </Modal>
    </Box>
  );
}
