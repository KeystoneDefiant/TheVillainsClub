import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Box, Group, NumberInput, Select, Slider, Stack, Tabs, Text, Title } from "@mantine/core";
import { motion } from "framer-motion";
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

export function UiPlayground() {
  const preset = useMotionPresetStore((s) => s.preset);
  const setPartial = useMotionPresetStore((s) => s.setPartial);
  const resetMotion = useMotionPresetStore((s) => s.reset);
  const themeOverride = useThemeLab((s) => s.override);
  const setThemeOverride = useThemeLab((s) => s.setOverride);
  const resetTheme = useThemeLab((s) => s.reset);

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

  return (
    <Box style={{ position: "relative", minHeight: "100%" }}>
      <MenuHazeBackground />
      <Stack p="md" gap="md" style={{ position: "relative", zIndex: 1 }}>
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2} c={clubTokens.text.primary} ff="Playfair Display, Georgia, serif">
              UI Playground
            </Title>
            <Text c={clubTokens.text.muted} size="sm">
              Tune theme tokens, primitives, and motion presets. Motion settings sync into the URL for quick sharing.
            </Text>
          </div>
          <ClubButton component={Link} to="/menu" variant="light">
            Back to menu
          </ClubButton>
        </Group>

        <Tabs defaultValue="theme" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="theme">Theme</Tabs.Tab>
            <Tabs.Tab value="components">Components</Tabs.Tab>
            <Tabs.Tab value="motion">Motion</Tabs.Tab>
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
                  <ClubHeading order={3}>Headings</ClubHeading>
                  <Text c={clubTokens.text.secondary}>Playfair for titles, Noto for chrome.</Text>
                </Stack>
              </ClubPanel>
              <Group>
                <ClubButton>Filled</ClubButton>
                <ClubButton variant="light">Light</ClubButton>
                <ClubButton variant="subtle" color="gray">
                  Subtle
                </ClubButton>
              </Group>
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
                  label="Intro tagline delay (s)"
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
