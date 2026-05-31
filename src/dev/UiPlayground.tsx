import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { activeBandIndexForBarDate, barDateKey } from "@/audio/barBandSchedule";
import { useBarBandOverrideStore } from "@/audio/barBandOverrideStore";
import { bandPublicUrl, bandsCatalog } from "@/config/bandsCatalog";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { GameButton } from "@/minigames/oubliette-no9/components/GameButton";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { defaultMotionPreset } from "@/motion/presets";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { clubTokens } from "@/theme/clubTokens";
import { useClubWallet, getPlayerTitle } from "@/game/clubWalletStore";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import "@/minigames/oubliette-no9/styles/global.css";




const soundBase = () => `${import.meta.env.BASE_URL}sounds/Classic/`;

export function UiPlayground() {
  const {
    clubBalance,
    hasPlayedFirstGame,
    isBum,
    customPlayerTitle,
    setDevTitleStates,
    creditClub,
    playedGames,
  } = useClubWallet();

  const resolvedTitle = getPlayerTitle({
    clubBalance,
    hasPlayedFirstGame,
    isBum,
    customPlayerTitle,
  });

  const preset = useMotionPresetStore((s) => s.preset);
  const setPartial = useMotionPresetStore((s) => s.setPartial);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [nestedOpened, { open: openNested, close: closeNested }] = useDisclosure(false);
  const [animCard, setAnimCard] = useState(false);
  const [introMock, setIntroMock] = useState<"enter" | "exit">("enter");

  const [genText, setGenText] = useState("Interact");
  const [genVariant, setGenVariant] = useState<"filled" | "light" | "outline" | "subtle" | "sheen">("filled");
  const [genSize, setGenSize] = useState<"xs" | "sm" | "md" | "lg">("md");
  const [genFancy, setGenFancy] = useState(false);
  const [genDisabled, setGenDisabled] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genFullWidth, setGenFullWidth] = useState(false);
  const [genLeftSection, setGenLeftSection] = useState(false);
  const [genCopied, setGenCopied] = useState(false);

  const generatedCodeString = useMemo(() => {
    const parts = [];
    parts.push(`<ClubButton`);
    if (genVariant !== "filled") parts.push(`  variant="${genVariant}"`);
    if (genSize !== "md") parts.push(`  size="${genSize}"`);
    if (genFancy) parts.push(`  fancy`);
    if (genDisabled) parts.push(`  disabled`);
    if (genLoading) parts.push(`  loading`);
    if (genFullWidth) parts.push(`  fullWidth`);
    if (genLeftSection) parts.push(`  leftSection={<span aria-hidden>✦</span>}`);
    parts.push(`>`);
    parts.push(`  ${genText}`);
    parts.push(`</ClubButton>`);
    return parts.join("\n");
  }, [genText, genVariant, genSize, genFancy, genDisabled, genLoading, genFullWidth, genLeftSection]);

  const handleCopyGenCode = () => {
    navigator.clipboard.writeText(generatedCodeString).then(() => {
      setGenCopied(true);
      setTimeout(() => setGenCopied(false), 2000);
    });
  };

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

  const eveningBandOverride = useBarBandOverrideStore((s) => s.eveningBandIndexOverride);
  const setEveningBandIndexOverride = useBarBandOverrideStore((s) => s.setEveningBandIndexOverride);
  const barKey = barDateKey(new Date());
  const scheduledBandIndex = activeBandIndexForBarDate(barKey, bandsCatalog);
  const previewBandIndex = eveningBandOverride ?? scheduledBandIndex;
  const previewBand = bandsCatalog.bands[previewBandIndex] ?? bandsCatalog.bands[0];

  const bandPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [bandPreviewLabel, setBandPreviewLabel] = useState<string | null>(null);

  const stopBandPreview = useCallback(() => {
    const a = bandPreviewRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    bandPreviewRef.current = null;
    setBandPreviewLabel(null);
  }, []);

  const playBandClip = useCallback(
    (relativePath: string, label: string) => {
      stopBandPreview();
      if (!musicEnabled) {
        pushSfxLog("Music toggle is off — enable “Music” in Audio lab.");
        return;
      }
      const url = bandPublicUrl(previewBand, relativePath);
      const a = new Audio(url);
      a.volume = musicVolume;
      bandPreviewRef.current = a;
      setBandPreviewLabel(label);
      void a.play().catch((e: unknown) => {
        setBandPreviewLabel(null);
        pushSfxLog(`${label} failed: ${e instanceof Error ? e.message : String(e)} (${url})`);
      });
      a.addEventListener(
        "ended",
        () => {
          setBandPreviewLabel((cur) => (cur === label ? null : cur));
        },
        { once: true },
      );
    },
    [musicEnabled, musicVolume, previewBand, pushSfxLog, stopBandPreview],
  );

  useEffect(() => {
    return () => stopBandPreview();
  }, [stopBandPreview]);

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
            <Title order={2} c={clubTokens.text.primary} ff="Cinzel, Georgia, serif">
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
            title: { color: clubTokens.text.brass, fontFamily: "Cinzel, Georgia, serif" },
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

        <Tabs defaultValue="components" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="components">Components</Tabs.Tab>
            <Tabs.Tab value="overlays">Overlays &amp; chrome</Tabs.Tab>
            <Tabs.Tab value="audio">Audio lab</Tabs.Tab>
            <Tabs.Tab value="bands">House bands</Tabs.Tab>
            <Tabs.Tab value="titles">Titles &amp; Wallet</Tabs.Tab>
          </Tabs.List>

          {/* Theme panel removed */}

          <Tabs.Panel value="components" pt="md">
            <Stack gap="md">
              <ClubPanel>
                <Stack gap="sm">
                  <ClubHeading order={3}>Typography</ClubHeading>
                  <Text c={clubTokens.text.secondary}>Cinzel for titles, Montserrat for chrome.</Text>
                  <Text size="xs" tt="uppercase" c={clubTokens.text.muted} fw={600}>
                    Eyebrow label
                  </Text>
                </Stack>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  ClubButton matrix (Active vs. Disabled)
                </ClubHeading>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="md">
                  {/* Row 1 Headers */}
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Filled Variant</Text>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Light Variant</Text>
                  
                  {/* Row 1 Buttons */}
                  <ClubButton fullWidth variant="filled">Filled (Active)</ClubButton>
                  <ClubButton fullWidth variant="filled" disabled>Filled (Disabled)</ClubButton>
                  <ClubButton fullWidth variant="light">Light (Active)</ClubButton>
                  <ClubButton fullWidth variant="light" disabled>Light (Disabled)</ClubButton>
                  
                  {/* Row 2 Headers */}
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Outline Variant</Text>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Subtle Variant</Text>
                  
                  {/* Row 2 Buttons */}
                  <ClubButton fullWidth variant="outline">Outline (Active)</ClubButton>
                  <ClubButton fullWidth variant="outline" disabled>Outline (Disabled)</ClubButton>
                  <ClubButton fullWidth variant="subtle" color="gray">Subtle (Active)</ClubButton>
                  <ClubButton fullWidth variant="subtle" color="gray" disabled>Subtle (Disabled)</ClubButton>

                  {/* Row 3 Headers */}
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Sheen Variant (Gold Sheen)</Text>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}></Text>
                  
                  {/* Row 3 Buttons */}
                  <ClubButton fullWidth variant="sheen">Sheen (Active)</ClubButton>
                  <ClubButton fullWidth variant="sheen" disabled>Sheen (Disabled)</ClubButton>
                  <div />
                  <div />
                </SimpleGrid>

                <Divider my="md" label="Other States & Sizes" labelPosition="center" color={clubTokens.surface.brassStroke} opacity={0.25} />

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
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
                  Unified Fancy Button (Larger Oubliette Style) Matrix
                </ClubHeading>
                <Text size="sm" c={clubTokens.text.muted} mb="md">
                  We have unified the Oubliette button design under the core polymorphic <code>ClubButton</code> using the <code>fancy</code> prop. All pages and games can now access this style. Below is a comparison of the legacy <code>GameButton</code> wrapper and the native <code>ClubButton fancy</code>.
                </Text>
                
                <Stack gap="lg">
                  <div>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">Button Sizing Comparison: GameButton wrapper vs. ClubButton fancy</Text>
                    <Grid gutter="md" align="center">
                      {/* Headers */}
                      <Grid.Col span={4}>
                        <Text size="xs" fw={700} c="dimmed">Size</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Text size="xs" fw={700} c="dimmed">GameButton Wrapper</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Text size="xs" fw={700} c="dimmed">ClubButton fancy</Text>
                      </Grid.Col>

                      {/* Large Row */}
                      <Grid.Col span={4}>
                        <Text size="sm" fw={600} c={clubTokens.text.secondary}>Large (Lg)</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <GameButton size="lg" fullWidth variant="primary">GameButton Lg</GameButton>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <ClubButton fancy size="lg" fullWidth variant="filled">ClubButton fancy Lg</ClubButton>
                      </Grid.Col>

                      {/* Medium Row */}
                      <Grid.Col span={4}>
                        <Text size="sm" fw={600} c={clubTokens.text.secondary}>Medium (Md)</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <GameButton size="md" fullWidth variant="secondary">GameButton Md</GameButton>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <ClubButton fancy size="md" fullWidth variant="light">ClubButton fancy Md</ClubButton>
                      </Grid.Col>

                      {/* Small Row */}
                      <Grid.Col span={4}>
                        <Text size="sm" fw={600} c={clubTokens.text.secondary}>Small (Sm)</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <GameButton size="sm" fullWidth variant="ghost">GameButton Sm</GameButton>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <ClubButton fancy size="sm" fullWidth variant="outline">ClubButton fancy Sm</ClubButton>
                      </Grid.Col>

                      {/* Disabled Row */}
                      <Grid.Col span={4}>
                        <Text size="sm" fw={600} c={clubTokens.text.secondary}>Disabled (Md)</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <GameButton size="md" fullWidth variant="primary" disabled>Wrapper Disabled</GameButton>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <ClubButton fancy size="md" fullWidth variant="filled" disabled>Fancy Disabled</ClubButton>
                      </Grid.Col>
                    </Grid>
                  </div>

                  <Divider color={clubTokens.surface.brassStroke} opacity={0.15} />

                  <div>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">ClubButton fancy Variants (Active vs. Disabled)</Text>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Filled Variant (Crimson)</Text>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2" }}>Light Variant (Gold)</Text>

                      <ClubButton fancy fullWidth variant="filled" size="md">Filled Active</ClubButton>
                      <ClubButton fancy fullWidth variant="filled" size="md" disabled>Filled Disabled</ClubButton>
                      <ClubButton fancy fullWidth variant="light" size="md">Light Active</ClubButton>
                      <ClubButton fancy fullWidth variant="light" size="md" disabled>Light Disabled</ClubButton>

                      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2", marginTop: "8px" }}>Outline Variant</Text>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ gridColumn: "span 2", marginTop: "8px" }}>Subtle Variant</Text>

                      <ClubButton fancy fullWidth variant="outline" size="md">Outline Active</ClubButton>
                      <ClubButton fancy fullWidth variant="outline" size="md" disabled>Outline Disabled</ClubButton>
                      <ClubButton fancy fullWidth variant="subtle" size="md">Subtle Active</ClubButton>
                      <ClubButton fancy fullWidth variant="subtle" size="md" disabled>Subtle Disabled</ClubButton>
                    </SimpleGrid>
                  </div>
                </Stack>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="xs">
                  ClubButton Code Generator
                </ClubHeading>
                <Text size="sm" c={clubTokens.text.muted} mb="md">
                  Interactively configure a <code>ClubButton</code> component, see a live preview of its active and disabled states, and copy the generated React/TypeScript code block.
                </Text>

                <Grid gutter="md" align="stretch">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="sm">
                      <TextInput
                        label="Button Text"
                        value={genText}
                        onChange={(e) => setGenText(e.currentTarget.value)}
                        placeholder="e.g. Enter the Club"
                      />
                      <Select
                        label="Variant"
                        data={[
                          { value: "filled", label: "Filled (Crimson / Default)" },
                          { value: "light", label: "Light (Gold)" },
                          { value: "outline", label: "Outline (Brass)" },
                          { value: "subtle", label: "Subtle (Transparent / Gray)" },
                          { value: "sheen", label: "Sheen (Gold Sheen)" },
                        ]}
                        value={genVariant}
                        onChange={(val) => setGenVariant((val || "filled") as "filled" | "light" | "outline" | "subtle" | "sheen")}
                        allowDeselect={false}
                      />
                      <Select
                        label="Size"
                        data={[
                          { value: "xs", label: "Extra Small (xs)" },
                          { value: "sm", label: "Small (sm)" },
                          { value: "md", label: "Medium (md)" },
                          { value: "lg", label: "Large (lg)" },
                        ]}
                        value={genSize}
                        onChange={(val) => setGenSize((val || "md") as "xs" | "sm" | "md" | "lg")}
                        allowDeselect={false}
                      />
                      <SimpleGrid cols={2} spacing="xs" mt="xs">
                        <Switch
                          label="Fancy (Oubliette Side-caps)"
                          checked={genFancy}
                          onChange={(e) => setGenFancy(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Full Width"
                          checked={genFullWidth}
                          onChange={(e) => setGenFullWidth(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Disabled State"
                          checked={genDisabled}
                          onChange={(e) => setGenDisabled(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Loading State"
                          checked={genLoading}
                          onChange={(e) => setGenLoading(e.currentTarget.checked)}
                        />
                        <Switch
                          label="Left Section Icon"
                          checked={genLeftSection}
                          onChange={(e) => setGenLeftSection(e.currentTarget.checked)}
                        />
                      </SimpleGrid>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md" justify="space-between" style={{ height: "100%" }}>
                      <Box>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
                          Live Preview
                        </Text>
                        <Box
                          p="md"
                          style={{
                            background: "rgba(0, 0, 0, 0.2)",
                            border: "1px dashed rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 80,
                          }}
                        >
                          <ClubButton
                            variant={genVariant}
                            size={genSize}
                            fancy={genFancy}
                            disabled={genDisabled}
                            loading={genLoading}
                            fullWidth={genFullWidth}
                            leftSection={genLeftSection ? <span aria-hidden>✦</span> : undefined}
                          >
                            {genText}
                          </ClubButton>
                        </Box>
                      </Box>

                      <Box>
                        <Group justify="space-between" align="center" mb={6}>
                          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            Generated React Code
                          </Text>
                          <ClubButton
                            size="xs"
                            variant="light"
                            onClick={handleCopyGenCode}
                            style={{ minWidth: 80 }}
                          >
                            {genCopied ? "✓ COPIED" : "COPY CODE"}
                          </ClubButton>
                        </Group>
                        <pre
                          style={{
                            margin: 0,
                            padding: "10px 14px",
                            background: "rgba(0, 0, 0, 0.4)",
                            border: `1px solid ${clubTokens.surface.brassStroke}`,
                            borderRadius: "6px",
                            fontSize: "11px",
                            color: clubTokens.text.brass,
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            overflowX: "auto",
                          }}
                        >
                          {generatedCodeString}
                        </pre>
                      </Box>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="xs">
                  Club Primitives Code References
                </ClubHeading>
                <Text size="sm" c={clubTokens.text.muted} mb="md">
                  A reference index of import paths and standard layouts for our core UI components.
                </Text>

                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={700} c={clubTokens.text.primary} mb={4}>
                      1. Polymorphic ClubButton
                    </Text>
                    <Text size="xs" c={clubTokens.text.secondary} mb={6}>
                      Supports active, disabled, loading, custom sizing, side-cap chevron ornaments (<code>fancy</code>), and side-pip indicator (<code>sheen</code>) variants.
                    </Text>
                    <pre style={{ margin: 0, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "11px", color: "#f2e7d5", overflowX: "auto" }}>
{`import { ClubButton } from "@/components/ui/ClubButton";

// Standard filled button
<ClubButton onClick={handleClick}>
  Interact
</ClubButton>

// Large Oubliette-themed fancy button
<ClubButton fancy variant="filled" size="lg">
  Play Game
</ClubButton>`}
                    </pre>
                  </Box>

                  <Box>
                    <Text size="sm" fw={700} c={clubTokens.text.primary} mb={4}>
                      2. ClubHeading
                    </Text>
                    <Text size="xs" c={clubTokens.text.secondary} mb={6}>
                      Polymorphic heading component defaulting to <code>Cinzel</code> serif typography.
                    </Text>
                    <pre style={{ margin: 0, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "11px", color: "#f2e7d5", overflowX: "auto" }}>
{`import { ClubHeading } from "@/components/ui/ClubHeading";

<ClubHeading order={2} size="h3">
  The Crimson Altar
</ClubHeading>`}
                    </pre>
                  </Box>

                  <Box>
                    <Text size="sm" fw={700} c={clubTokens.text.primary} mb={4}>
                      3. ClubPanel
                    </Text>
                    <Text size="xs" c={clubTokens.text.secondary} mb={6}>
                      Container surface implementing the luxurious Walnut dark wood texture paneling.
                    </Text>
                    <pre style={{ margin: 0, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "11px", color: "#f2e7d5", overflowX: "auto" }}>
{`import { ClubPanel } from "@/components/ui/ClubPanel";

<ClubPanel px="md" py="md">
  <Text>Walnut panel content goes here.</Text>
</ClubPanel>`}
                    </pre>
                  </Box>

                  <Box>
                    <Text size="sm" fw={700} c={clubTokens.text.primary} mb={4}>
                      4. GameScaleContainer
                    </Text>
                    <Text size="xs" c={clubTokens.text.secondary} mb={6}>
                      Viewport auto-scaling wrapper designed to dynamically fit game frames into bounding viewports.
                    </Text>
                    <pre style={{ margin: 0, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "11px", color: "#f2e7d5", overflowX: "auto" }}>
{`import { GameScaleContainer } from "@/components/ui/GameScaleContainer";

<GameScaleContainer width={1280} height={720}>
  <div style={{ width: 1280, height: 720 }}>
    Scaling Game Content
  </div>
</GameScaleContainer>`}
                    </pre>
                  </Box>
                </Stack>
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

          <Tabs.Panel value="bands" pt="md">
            <Stack gap="md">
              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Tonight’s band (menu / bar)
                </ClubHeading>
                <Text size="sm" c={clubTokens.text.secondary} mb="md">
                  The shell picks one catalog band per local bar night (4:00 boundary). Override here to hear a
                  specific lineup on <code style={{ color: clubTokens.text.brass }}>/menu</code> and{" "}
                  <code style={{ color: clubTokens.text.brass }}>/bar</code>. URLs use a root-absolute path so tracks
                  load on nested routes (e.g. GitHub Pages).
                </Text>
                <Stack gap="sm">
                  <Text size="sm" c={clubTokens.text.muted}>
                    Bar day key: <span style={{ color: clubTokens.text.brass }}>{barKey}</span> — scheduled band:{" "}
                    <strong>{bandsCatalog.bands[scheduledBandIndex]?.display_name}</strong>
                    {eveningBandOverride !== null ? (
                      <>
                        {" "}
                        — override: <strong>{bandsCatalog.bands[eveningBandOverride]?.display_name}</strong>
                      </>
                    ) : null}
                  </Text>
                  <Select
                    label="Band for this session"
                    description="Preview clips use this band; override also drives shell house music when enabled."
                    data={bandsCatalog.bands.map((b, i) => ({ value: String(i), label: b.display_name }))}
                    value={String(previewBandIndex)}
                    onChange={(v) => {
                      if (!v) return;
                      setEveningBandIndexOverride(Number(v));
                    }}
                  />
                  <Group>
                    <ClubButton
                      variant="light"
                      onClick={() => {
                        setEveningBandIndexOverride(null);
                        pushSfxLog("Cleared evening band override — shell uses scheduled band.");
                      }}
                    >
                      Use scheduled band
                    </ClubButton>
                    {bandPreviewLabel ? (
                      <Text size="xs" c={clubTokens.text.muted}>
                        Playing: {bandPreviewLabel}
                      </Text>
                    ) : null}
                  </Group>
                </Stack>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Music tracks ({previewBand.display_name})
                </ClubHeading>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                  {previewBand.music_files.map((rel) => (
                    <ClubButton
                      key={rel}
                      variant="light"
                      size="sm"
                      onClick={() => playBandClip(rel, rel)}
                    >
                      Play {rel.replace(/^music\//, "")}
                    </ClubButton>
                  ))}
                </SimpleGrid>
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Interludes ({previewBand.display_name})
                </ClubHeading>
                {previewBand.interlude_files.length === 0 ? (
                  <Text size="sm" c={clubTokens.text.muted}>
                    No interludes listed for this band.
                  </Text>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                    {previewBand.interlude_files.map((rel) => (
                      <ClubButton
                        key={rel}
                        variant="light"
                        size="sm"
                        onClick={() => playBandClip(rel, rel)}
                      >
                        Play {rel.replace(/^interludes\//, "")}
                      </ClubButton>
                    ))}
                  </SimpleGrid>
                )}
              </ClubPanel>

              <ClubPanel>
                <ClubHeading order={4} mb="sm">
                  Resolved URLs (first track)
                </ClubHeading>
                <Text size="xs" c={clubTokens.text.secondary} ff="monospace" style={{ wordBreak: "break-all" }}>
                  {bandPublicUrl(previewBand, previewBand.music_files[0] ?? "")}
                </Text>
              </ClubPanel>
            </Stack>
          </Tabs.Panel>

          {/* Animation and Motion panels removed */}

          <Tabs.Panel value="titles" pt="md">
            <ClubPanel>
              <Stack gap="md">
                <Title order={4} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif" }}>
                  Dossier &amp; Title Testing Controls
                </Title>
                <Text size="sm" c={clubTokens.text.secondary}>
                  Control and simulate wallet balances, play history, and bankruptcy states. Check how they alter the active title and dossier list.
                </Text>

                <Divider color={clubTokens.surface.brassStroke} opacity={0.2} />

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="sm">
                      <NumberInput
                        label="Club Wallet Balance (Credits)"
                        value={clubBalance}
                        onChange={(v) => {
                          const num = typeof v === "number" ? v : Number(v);
                          if (Number.isFinite(num)) {
                            setDevTitleStates({ clubBalance: num });
                          }
                        }}
                        min={0}
                      />

                      <Select
                        label="Active Title Override"
                        description="Manually select one of your unlocked titles (setting this simulates manual choice in the dossier)."
                        data={[
                          { value: "clear", label: "No Override (Auto highest-unlocked)" },
                          ...villainsGameDefaults.playerTitles.map((t) => ({
                            value: t.id,
                            label: t.title,
                          })),
                        ]}
                        value={customPlayerTitle ?? "clear"}
                        onChange={(v) => {
                          setDevTitleStates({
                            customPlayerTitle: v === "clear" ? null : v,
                          });
                        }}
                      />

                      <Group gap="md" mt="xs">
                        <Switch
                          label="Has Played First Game"
                          checked={hasPlayedFirstGame}
                          onChange={(e) => setDevTitleStates({ hasPlayedFirstGame: e.currentTarget.checked })}
                        />
                        <Switch
                          label="Is Bum (Smelly Bum)"
                          checked={isBum}
                          onChange={(e) => setDevTitleStates({ isBum: e.currentTarget.checked })}
                        />
                      </Group>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="sm">
                      <Text size="sm" fw={700} c={clubTokens.text.brass}>
                        Quick Action Presets
                      </Text>
                      <SimpleGrid cols={2} spacing="xs">
                        <ClubButton
                          variant="light"
                          size="sm"
                          onClick={() => {
                            setDevTitleStates({
                              clubBalance: 1500,
                              isBum: false,
                            });
                            // Force bankruptcy check immediately
                            creditClub(0);
                          }}
                        >
                          Force Bankruptcy
                        </ClubButton>
                        <ClubButton
                          variant="light"
                          size="sm"
                          onClick={() => {
                            setDevTitleStates({
                              clubBalance: villainsGameDefaults.defaultClubBalance,
                              hasPlayedFirstGame: false,
                              isBum: false,
                              customPlayerTitle: null,
                              playedGames: {
                                oubliette_no9: false,
                                seven_year_itch: false,
                                fateseal_silver: false,
                                masterson_1881: false,
                              },
                            });
                          }}
                        >
                          Reset to New Villain
                        </ClubButton>
                        <ClubButton
                          variant="light"
                          size="sm"
                          onClick={() => {
                            setDevTitleStates({
                              clubBalance: 500000,
                              hasPlayedFirstGame: true,
                              isBum: false,
                            });
                          }}
                        >
                          Make Rich Villain (500k)
                        </ClubButton>
                        <ClubButton
                          variant="light"
                          size="sm"
                          onClick={() => {
                            setDevTitleStates({
                              clubBalance: 1500000,
                              hasPlayedFirstGame: true,
                              isBum: false,
                            });
                          }}
                        >
                          Make Notorious (1.5M)
                        </ClubButton>
                      </SimpleGrid>
                    </Stack>
                  </Grid.Col>
                </Grid>

                <Divider color={clubTokens.surface.brassStroke} opacity={0.2} />

                <Grid gutter="md">
                  <Grid.Col span={12}>
                    <Stack gap="sm">
                      <Text size="sm" fw={700} c={clubTokens.text.brass}>
                        Played Games Toggles
                      </Text>
                      <Text size="xs" c={clubTokens.text.secondary}>
                        Toggle whether the player has played each game. If a game is unchecked (not played), launching it from the main menu will automatically trigger its tutorial!
                      </Text>
                      <Group gap="md" wrap="wrap">
                        <Switch
                          label="Oubliette Number 9"
                          checked={playedGames.oubliette_no9}
                          onChange={(e) =>
                            setDevTitleStates({
                              playedGames: {
                                ...playedGames,
                                oubliette_no9: e.currentTarget.checked,
                              },
                            })
                          }
                        />
                        <Switch
                          label="7 Year Itch"
                          checked={playedGames.seven_year_itch}
                          onChange={(e) =>
                            setDevTitleStates({
                              playedGames: {
                                ...playedGames,
                                seven_year_itch: e.currentTarget.checked,
                              },
                            })
                          }
                        />
                        <Switch
                          label="Fateseal Silver"
                          checked={playedGames.fateseal_silver}
                          onChange={(e) =>
                            setDevTitleStates({
                              playedGames: {
                                ...playedGames,
                                fateseal_silver: e.currentTarget.checked,
                              },
                            })
                          }
                        />
                        <Switch
                          label="Masterton 1881"
                          checked={playedGames.masterson_1881}
                          onChange={(e) =>
                            setDevTitleStates({
                              playedGames: {
                                ...playedGames,
                                masterson_1881: e.currentTarget.checked,
                              },
                            })
                          }
                        />
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>

                <Divider color={clubTokens.surface.brassStroke} opacity={0.2} />

                <Stack gap={2}>
                  <Text size="xs" tt="uppercase" fw={800} c={clubTokens.text.muted}>
                    Active Resolved Title (Output)
                  </Text>
                  <Text size="lg" fw={900} c={isBum ? "#ef5350" : clubTokens.text.brass}>
                    {resolvedTitle}
                  </Text>
                </Stack>
              </Stack>
            </ClubPanel>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
}
