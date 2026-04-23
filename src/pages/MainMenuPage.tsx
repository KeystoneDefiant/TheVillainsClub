import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Group, Modal, Slider, Stack, Switch, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { motion } from "framer-motion";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { useClubWallet } from "@/game/clubWalletStore";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { clubTokens } from "@/theme/clubTokens";

export function MainMenuPage() {
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const { clubBalance, hasSave, setHasSave } = useClubWallet();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [barMusic, setBarMusic] = useState(70);
  const [gameMusic, setGameMusic] = useState(70);

  const easing = preset.easing;
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: preset.menuStagger, delayChildren: 0.08 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: preset.menuItemDuration, ease: easing },
    },
  };

  return (
    <Box style={{ position: "relative", height: "100%" }}>
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
        </Stack>

        <ClubPanel maw={440} w="100%" mx={{ base: "auto", sm: 0 }}>
          <motion.div variants={container} initial="hidden" animate="show" style={{ width: "100%" }}>
            <Stack gap="lg">
              <motion.div variants={item}>
                <Stack gap={4}>
                  <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={600}>
                    Club balance
                  </Text>
                  <Text size="xl" fw={700} c={clubTokens.text.brass}>
                    {clubBalance.toLocaleString()} credits
                  </Text>
                </Stack>
              </motion.div>

              <motion.div variants={item}>
                <Stack gap="sm">
                  <ClubButton
                    fullWidth
                    disabled={!hasSave}
                    variant={hasSave ? "filled" : "light"}
                    onClick={() => navigate("/bar")}
                  >
                    Continue
                  </ClubButton>
                  <ClubButton fullWidth onClick={() => navigate("/bar")}>
                    Enter the club
                  </ClubButton>
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
            label="Sound effects"
            checked={sfxEnabled}
            onChange={(e) => setSfxEnabled(e.currentTarget.checked)}
          />
          <div>
            <Text size="sm" mb={6}>
              Bar music
            </Text>
            <Slider value={barMusic} onChange={setBarMusic} />
          </div>
          <div>
            <Text size="sm" mb={6}>
              Game music
            </Text>
            <Slider value={gameMusic} onChange={setGameMusic} />
          </div>
          <Text size="xs" c="dimmed">
            Persistence hooks up next; this panel is for layout and motion polish.
          </Text>
        </Stack>
      </Modal>
    </Box>
  );
}
