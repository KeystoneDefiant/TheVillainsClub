import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Checkbox,
  Divider,
  Grid,
  Group,
  Modal,
  NumberInput,
  Progress,
  Radio,
  RingProgress,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { defaultMotionPreset } from "@/motion/presets";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { buildClubTheme } from "@/theme/clubTheme";
import { clubTokens } from "@/theme/clubTokens";
import { useThemeLab } from "@/dev/themeLabStore";

const radiusOptions = ["xs", "sm", "md", "lg", "xl"] as const;

const soundBase = () => `${import.meta.env.BASE_URL}sounds/Classic/`;

export function UiPlayground() {
  const preset = useMotionPresetStore((s) => s.preset);
  const setPartial = useMotionPresetStore((s) => s.setPartial);
  const resetMotion = useMotionPresetStore((s) => s.reset);
  const themeOverride = useThemeLab((s) => s.override);
  const setThemeOverride = useThemeLab((s) => s.setOverride);
  const resetTheme = useThemeLab((s) => s.reset);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [nestedOpened, { open: openNested, close: closeNested }] = useDisclosure(false);
  const [animCard, setAnimCard] = useState(false);
  const [introMock, setIntroMock] = useState<"enter" | "exit">("enter");

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [musicStatus, setMusicStatus] = useState<"idle" | "playing" | "error">("idle");
  const [sfxLog, setSfxLog] = useState<string[]>([]);
  const pushSfxLog = useCallback((line: string) => {
    setSfxLog((prev) => [new Date().toLocaleTimeString() + " — " + line, ...prev].slice(0, 12));
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

  const stopPreviewMusic = useCallback(() => {
    const a = musicRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    musicRef.current = null;
    setMusicStatus("idle");
  }, []);

  const playPreviewMusic = useCallback(() => {
    stopPreviewMusic();
    if (!musicEnabled) {
      pushSfxLog("Music toggle is off — enable “Music” in Audio tab or store.");
      return;
    }
    const url = `${soundBase()}bgm1.mp3`;
    const a = new Audio(url);
    a.volume = musicVolume;
    a.loop = true;
    musicRef.current = a;
    setMusicStatus("playing");
    void a.play().catch((e: unknown) => {
      setMusicStatus("error");
      pushSfxLog(`BGM failed: ${e instanceof Error ? e.message : String(e)}`);
    });
  }, [musicEnabled, musicVolume, pushSfxLog, stopPreviewMusic]);

  useEffect(() => {
    const a = musicRef.current;
    if (a) a.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    return () => stopPreviewMusic();
  }, [stopPreviewMusic]);

  const playOneShot = useCallback(
    (file: string, label: string) => {
      if (!sfxEnabled) {
        pushSfxLog(`SFX off — skipped “${label}”`);
        return;
      }
      const url = `${soundBase()}${file}`;
      const a = new Audio(url);
      a.volume = sfxVolume;
      void a.play().catch((e: unknown) => {
        pushSfxLog(`${label} failed: ${e instanceof Error ? e.message : String(e)}`);
      });
      pushSfxLog(`Played “${label}”`);
    },
    [pushSfxLog, sfxEnabled, sfxVolume],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("motion");
    if (!encoded) return;
    try {
      const parsed = JSON.parse(atob(encoded)) as Partial<typeof defaultMotionPreset>;
      setPartial(parsed);
    } catch {
      // ignore malformed playground links
    }
  }, [setPartial]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("motion", btoa(JSON.stringify(preset)));
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
  }, [preset]);

  const easing = preset.easing;

  return (
    <Box
      style={{
        position: "relative",
        minHeight: "100dvh",
        maxHeight: "100dvh",
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        boxSizing: "border-box",
      }}
    >
      <MenuHazeBackground />
      <Stack p="md" pb="xl" gap="md" style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <div>
            <Title order={2} c={clubTokens.text.primary} ff="Playfair Display, Georgia, serif">
              UI Playground
            </Title>
            <Text c={clubTokens.text.muted} size="sm" maw={560}>
              Theme lab, club primitives, motion presets, Mantine patterns we use in menus and flows, modals, and a
              small audio harness (same paths as Oubliette assets). Motion syncs into the URL for sharing.
            </Text>
          </div>
          <Group gap="xs">
            <ClubButton component={Link} to="/menu" variant="light">
              Back to menu
            </ClubButton>
            <ClubButton onClick={openModal} variant="filled">
              Open sample modal
            </ClubButton>
          </Group>
        </Group>

        <Modal
          opened={modalOpened}
          onClose={closeModal}
          title="Sample club modal"
          centered
          size="md"
          overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
          styles={{
            content: {
              background: clubTokens.surface.panel,
              border: `1px solid ${clubTokens.surface.brassStroke}`,
            },
            header: { background: "transparent" },
            title: { color: clubTokens.text.brass, fontFamily: "Playfair Display, Georgia, serif" },
          }}
        >
          <Stack gap="md">
            <Text size="sm" c={clubTokens.text.secondary}>
              Mirrors the dark glass + brass border treatment from the main menu settings dialog.
            </Text>
            <Alert color="brass" title="Heads up" variant="light">
              Nested actions and stacked controls should stay readable on this panel.
            </Alert>
            <Group justify="flex-end">
              <ClubButton variant="subtle" color="gray" onClick={closeModal}>
                Close
              </ClubButton>
              <ClubButton
                onClick={() => {
                  openNested();
                }}
              >
                Open nested…
              </ClubButton>
            </Group>
          </Stack>
        </Modal>

        <Modal
          opened={nestedOpened}
          onClose={closeNested}
          title="Nested dialog"
          centered
          size="sm"
          overlayProps={{ backgroundOpacity: 0.45, blur: 4 }}
        >
          <Text size="sm" c={clubTokens.text.secondary}>
            Stack modals sparingly in product flows; this is for layout checks only.
          </Text>
          <Group justify="flex-end" mt="md">
            <ClubButton onClick={closeNested}>Done</ClubButton>
          </Group>
        </Modal>

        <Tabs defaultValue="theme" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="theme">Theme</Tabs.Tab>
            <Tabs.Tab value="components">Components</Tabs.Tab>
            <Tabs.Tab value="overlays">Overlays &amp; chrome</Tabs.Tab>
            <Tabs.Tab value="audio">Audio lab</Tabs.Tab>
            <Tabs.Tab value="animation">Animation</Tabs.Tab>
            <Tabs.Tab value="motion">Motion tuning</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="theme" pt="md">
            <ClubPanel>
              <Stack gap="md">
                <Select
                  label="Default radius"
                  data={[...radiusOptions]}
                  value={String(themeOverride.defaultRadius ?? "md")}
                  onChange={(value) => {
                    if (!value) return;
                    setThemeOverride({ defaultRadius: value });
                  }}
                />
                <Group grow>
                  <NumberInput
                    label="Heading scale (h1)"
                    min={2}
                    max={4.5}
                    step={0.05}
                    decimalScale={2}
                    value={
                      Number(themeOverride.headings?.sizes?.h1?.fontSize?.toString().replace("rem", "")) || 2.75
                    }
                    onChange={(val) => {
                      const v = typeof val === "number" ? val : Number(val);
                      if (!Number.isFinite(v)) return;
                      setThemeOverride({
                        headings: {
                          sizes: {
                            ...buildClubTheme().headings?.sizes,
                            h1: { fontSize: `${v}rem`, lineHeight: "1.05" },
                          },
                        },
                      });
                    }}
                  />
                </Group>
                <Group>
                  <ClubButton onClick={resetTheme}>Reset theme lab</ClubButton>
                </Group>
              </Stack>
            </ClubPanel>
          </Tabs.Panel>

          <Tabs.Panel value="components" pt="md">
            <Stack gap="md">
              <ClubPanel>
                <Stack gap="sm">
                  <ClubHeading order={3}>Typography</ClubHeading>
                  <Text c={clubTokens.text.secondary}>Playfair for titles, Noto for chrome.</Text>
                  <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={600}>
                    Eyebrow label
                  </Text>
                </Stack>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  ClubButton matrix
                </ClubHeading>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                  <ClubButton fullWidth>Filled default</ClubButton>
                  <ClubButton fullWidth variant="light">
                    Light
                  </ClubButton>
                  <ClubButton fullWidth variant="subtle" color="gray">
                    Subtle gray
                  </ClubButton>
                  <ClubButton fullWidth variant="outline">
                    Outline
                  </ClubButton>
                  <ClubButton fullWidth disabled>
                    Disabled
                  </ClubButton>
                  <ClubButton fullWidth loading>
                    Loading
                  </ClubButton>
                  <Tooltip label="Tooltip on brass control">
                    <ClubButton fullWidth leftSection={<span aria-hidden>♪</span>}>
                      With icon slot
                    </ClubButton>
                  </Tooltip>
                  <ClubButton fullWidth size="xs" variant="light">
                    Compact xs
                  </ClubButton>
                  <ClubButton fullWidth size="lg" variant="filled">
                    Large lg
                  </ClubButton>
                </SimpleGrid>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Form controls
                </ClubHeading>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="sm">
                      <TextInput label="Text input" placeholder="Placeholder" description="Description line" />
                      <Textarea label="Textarea" placeholder="Longer copy…" minRows={3} />
                      <Select label="Select" data={["Option A", "Option B", "Option C"]} defaultValue="Option A" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                      <Switch label="Switch" defaultChecked />
                      <Checkbox label="Checkbox" defaultChecked />
                      <Radio.Group label="Radio group" name="pg" defaultValue="1">
                        <Group>
                          <Radio value="1" label="First" />
                          <Radio value="2" label="Second" />
                        </Group>
                      </Radio.Group>
                      <div>
                        <Text size="sm" mb={6}>
                          Progress
                        </Text>
                        <Progress value={66} color="brass" radius="xl" />
                      </div>
                      <Group>
                        <RingProgress sections={[{ value: 72, color: "brass" }]} size={80} thickness={8} label={
                          <Text size="xs" ta="center" fw={700}>
                            72%
                          </Text>
                        } />
                        <Text size="sm" c={clubTokens.text.muted} maw={200}>
                          Ring progress for compact status (loading, sync, etc.).
                        </Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Badges &amp; tags
                </ClubHeading>
                <Group gap="xs">
                  <Badge color="brass">Brass</Badge>
                  <Badge variant="light" color="gray">
                    Light
                  </Badge>
                  <Badge variant="outline" color="brass">
                    Outline
                  </Badge>
                  <Badge variant="dot" color="red">
                    Live
                  </Badge>
                </Group>
              </ClubPanel>

              <Accordion variant="contained" radius="md">
                <Accordion.Item value="a">
                  <Accordion.Control>Accordion item A</Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" c={clubTokens.text.secondary}>
                      Used for dense settings or help sections.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="b">
                  <Accordion.Control>Accordion item B</Accordion.Control>
                  <Accordion.Panel>Secondary content.</Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="overlays" pt="md">
            <Stack gap="md">
              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Alerts &amp; dividers
                </ClubHeading>
                <Stack gap="sm">
                  <Alert variant="light" color="brass" title="Informational">
                    Neutral brass-tinted surface for non-blocking notes.
                  </Alert>
                  <Alert variant="filled" color="red" title="Destructive">
                    Use sparingly for irreversible or dangerous actions.
                  </Alert>
                  <Divider label="Section" labelPosition="center" color={clubTokens.surface.brassStroke} />
                  <Text size="sm" c={clubTokens.text.muted}>
                    Dividers help separate dense stacks inside panels (settings, confirmations).
                  </Text>
                </Stack>
              </ClubPanel>
              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Modal triggers
                </ClubHeading>
                <Group>
                  <ClubButton onClick={openModal}>Primary modal</ClubButton>
                  <ClubButton variant="light" onClick={openNested}>
                    Nested only
                  </ClubButton>
                </Group>
              </ClubPanel>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="audio" pt="md">
            <Stack gap="md">
              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Global audio store
                </ClubHeading>
                <Text size="sm" c={clubTokens.text.secondary} mb="md">
                  Same Zustand slice as the main menu. Preview BGM/SFX below use raw{" "}
                  <code style={{ color: clubTokens.text.brass }}>HTMLAudioElement</code> so you can hear files without
                  loading Oubliette.
                </Text>
                <Stack gap="md">
                  <Switch label="Music enabled" checked={musicEnabled} onChange={(e) => setMusicEnabled(e.currentTarget.checked)} />
                  <Switch label="Sound effects enabled" checked={sfxEnabled} onChange={(e) => setSfxEnabled(e.currentTarget.checked)} />
                  <div>
                    <Text size="sm" mb={6}>
                      Global music volume
                    </Text>
                    <Slider value={Math.round(musicVolume * 100)} onChange={(v) => setMusicVolume(v / 100)} />
                  </div>
                  <div>
                    <Text size="sm" mb={6}>
                      Global SFX volume
                    </Text>
                    <Slider value={Math.round(sfxVolume * 100)} onChange={(v) => setSfxVolume(v / 100)} />
                  </div>
                  <div>
                    <Text size="sm" mb={6}>
                      Repeating SFX floor (0–10)
                    </Text>
                    <Slider max={10} step={0.5} value={repeatSfxAttenuationPercent} onChange={setRepeatSfxAttenuationPercent} />
                  </div>
                </Stack>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Music test (Classic / bgm1)
                </ClubHeading>
                <Group>
                  <ClubButton onClick={playPreviewMusic} disabled={musicStatus === "playing"}>
                    Play loop
                  </ClubButton>
                  <ClubButton variant="light" onClick={stopPreviewMusic}>
                    Stop
                  </ClubButton>
                </Group>
                <Text size="xs" c={clubTokens.text.muted} mt="xs">
                  Status: {musicStatus}
                  {musicStatus === "error" ? " — check devtools / asset path under public/sounds/Classic/" : ""}
                </Text>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Sound effect tests
                </ClubHeading>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                  <ClubButton variant="light" size="sm" onClick={() => playOneShot("button-click.ogg", "Button")}>
                    Button click
                  </ClubButton>
                  <ClubButton variant="light" size="sm" onClick={() => playOneShot("screen-transition.ogg", "Transition")}>
                    Screen transition
                  </ClubButton>
                  <ClubButton variant="light" size="sm" onClick={() => playOneShot("shop-purchase.ogg", "Shop")}>
                    Shop purchase
                  </ClubButton>
                  <ClubButton variant="light" size="sm" onClick={() => playOneShot("royalflush.ogg", "Royal flush")}>
                    Royal flush
                  </ClubButton>
                  <ClubButton variant="light" size="sm" onClick={() => playOneShot("onepair.ogg", "One pair")}>
                    One pair
                  </ClubButton>
                  <ClubButton variant="light" size="sm" onClick={() => playOneShot("cheater.ogg", "Cheater")}>
                    Cheater
                  </ClubButton>
                </SimpleGrid>
                <Divider my="sm" />
                <Text size="xs" c={clubTokens.text.muted} mb={4}>
                  Event log (newest first)
                </Text>
                <Stack gap={4}>
                  {sfxLog.length === 0 ? (
                    <Text size="xs" c={clubTokens.text.muted}>
                      No events yet.
                    </Text>
                  ) : (
                    sfxLog.map((line, i) => (
                      <Text key={`${i}-${line}`} size="xs" c={clubTokens.text.secondary} ff="monospace">
                        {line}
                      </Text>
                    ))
                  )}
                </Stack>
              </ClubPanel>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="animation" pt="md">
            <Stack gap="md">
              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Menu-style stagger
                </ClubHeading>
                <Group mb="sm">
                  <ClubButton size="sm" variant="light" onClick={() => setAnimCard((v) => !v)}>
                    Toggle row
                  </ClubButton>
                </Group>
                <motion.div
                  initial="hidden"
                  animate={animCard ? "show" : "hidden"}
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: preset.menuStagger, delayChildren: 0.06 },
                    },
                  }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: preset.menuItemDuration, ease: easing },
                        },
                      }}
                      style={{
                        width: 120,
                        height: 72,
                        borderRadius: 12,
                        border: `1px solid ${clubTokens.surface.brassStroke}`,
                        background: clubTokens.surface.panel,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        color: clubTokens.text.muted,
                      }}
                    >
                      Card {i}
                    </motion.div>
                  ))}
                </motion.div>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Intro-style cross-fade (mock)
                </ClubHeading>
                <Group mb="sm">
                  <ClubButton size="sm" variant="light" onClick={() => setIntroMock((p) => (p === "enter" ? "exit" : "enter"))}>
                    Toggle phase
                  </ClubButton>
                </Group>
                <Box style={{ minHeight: 120, position: "relative" }}>
                  <AnimatePresence mode="wait">
                    {introMock === "enter" ? (
                      <motion.div
                        key="in"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, transition: { duration: preset.introFadeOut, ease: easing } }}
                        transition={{ duration: preset.introTitleDuration, ease: easing }}
                        style={{ position: "absolute", inset: 0 }}
                      >
                        <ClubHeading order={3}>Title beat</ClubHeading>
                        <Text size="sm" c={clubTokens.text.secondary}>
                          Uses intro duration / fade from the motion preset.
                        </Text>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="out"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: "absolute", inset: 0 }}
                      >
                        <Text c={clubTokens.text.muted}>Exit / hold placeholder</Text>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Spring pop (decorative)
                </ClubHeading>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 16,
                    border: `1px solid ${clubTokens.surface.brassStroke}`,
                    background: `linear-gradient(145deg, ${clubTokens.surface.panel}, rgba(0,0,0,0.35))`,
                    cursor: "pointer",
                  }}
                />
              </ClubPanel>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="motion" pt="md">
            <ClubPanel>
              <Stack gap="lg">
                <Slider
                  label="Intro title duration (s)"
                  min={0.3}
                  max={2}
                  step={0.05}
                  value={preset.introTitleDuration}
                  onChange={(v) => setPartial({ introTitleDuration: v })}
                />
                <Slider
                  label="Intro logo grey letter reveal (s each, bottom→top)"
                  min={0.12}
                  max={0.55}
                  step={0.01}
                  value={preset.introLogoLetterDrawSec}
                  onChange={(v) => setPartial({ introLogoLetterDrawSec: v })}
                />
                <Slider
                  label="Intro logo settle after letters (s)"
                  min={0}
                  max={1.2}
                  step={0.02}
                  value={preset.introLogoSettleSec}
                  onChange={(v) => setPartial({ introLogoSettleSec: v })}
                />
                <Slider
                  label="Intro hold before exit (s)"
                  min={0.5}
                  max={4}
                  step={0.05}
                  value={preset.introHoldSec}
                  onChange={(v) => setPartial({ introHoldSec: v })}
                />
                <Slider
                  label="Intro tagline delay after logo (s)"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={preset.introTaglineDelay}
                  onChange={(v) => setPartial({ introTaglineDelay: v })}
                />
                <Slider
                  label="Intro tagline duration (s)"
                  min={0.2}
                  max={2}
                  step={0.05}
                  value={preset.introTaglineDuration}
                  onChange={(v) => setPartial({ introTaglineDuration: v })}
                />
                <Slider
                  label="Intro fade out (s)"
                  min={0.15}
                  max={1.5}
                  step={0.05}
                  value={preset.introFadeOut}
                  onChange={(v) => setPartial({ introFadeOut: v })}
                />
                <Slider
                  label="Menu stagger (s)"
                  min={0.02}
                  max={0.3}
                  step={0.01}
                  value={preset.menuStagger}
                  onChange={(v) => setPartial({ menuStagger: v })}
                />
                <Slider
                  label="Menu item duration (s)"
                  min={0.15}
                  max={1.2}
                  step={0.05}
                  value={preset.menuItemDuration}
                  onChange={(v) => setPartial({ menuItemDuration: v })}
                />
                <Box>
                  <Text size="sm" mb={6}>
                    Preview easing (oscillation demo)
                  </Text>
                  <motion.div
                    animate={{ x: [0, 120, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: preset.easing }}
                    style={{
                      width: 56,
                      height: 36,
                      borderRadius: 10,
                      border: `1px solid ${clubTokens.surface.brassStroke}`,
                      background: clubTokens.surface.panel,
                    }}
                  />
                </Box>
                <ClubButton onClick={resetMotion}>Reset motion preset</ClubButton>
              </Stack>
            </ClubPanel>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
}
