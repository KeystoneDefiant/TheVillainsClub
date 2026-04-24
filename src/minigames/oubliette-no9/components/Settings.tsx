import { useState } from "react";
import {
  Collapse,
  Divider,
  Group,
  Modal,
  Paper,
  Radio,
  Slider,
  Stack,
  Switch,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { gameConfig } from "@/config/minigames/oublietteNo9GameRules";
import { clubTokens } from "@/theme/clubTokens";
import { GameButton } from "./GameButton";

type AnimationSpeedMode = number | "skip";

interface SettingsProps {
  onClose: () => void;
  audioSettings?: {
    musicEnabled: boolean;
    soundEffectsEnabled: boolean;
    musicVolume: number;
    soundEffectsVolume: number;
    handScoringMinVolumePercent: number;
  };
  onMusicVolumeChange?: (value: number) => void;
  onSoundEffectsVolumeChange?: (value: number) => void;
  onHandScoringMinVolumeChange?: (value: number) => void;
  onToggleMusic?: () => void;
  onToggleSoundEffects?: () => void;
  animationSpeedMode?: AnimationSpeedMode;
  onAnimationSpeedChange?: (speed: number | "skip") => void;
  cardTheme?: "light" | "dark";
  onCardThemeChange?: (theme: "light" | "dark") => void;
  onCheatAddCredits?: (amount: number) => void;
  onCheatAddHands?: (amount: number) => void;
  onCheatSetDevilsDeal?: () => void;
}

const ANIMATION_SPEED_MIN = 0.5;
const ANIMATION_SPEED_MAX = 7;
const ANIMATION_SPEED_STEP = 0.5;

const sectionPaper = {
  p: "md" as const,
  radius: "md" as const,
  withBorder: true,
  style: {
    backgroundColor: clubTokens.surface.walnut,
    borderColor: clubTokens.surface.brassStroke,
  },
};

export function Settings({
  onClose,
  audioSettings,
  onMusicVolumeChange,
  onSoundEffectsVolumeChange,
  onHandScoringMinVolumeChange,
  onToggleMusic,
  onToggleSoundEffects,
  animationSpeedMode = 1,
  onAnimationSpeedChange,
  cardTheme = "dark",
  onCardThemeChange,
  onCheatAddCredits,
  onCheatAddHands,
  onCheatSetDevilsDeal,
}: SettingsProps) {
  const [cheatsExpanded, setCheatsExpanded] = useState(false);
  const musicVolume = audioSettings?.musicVolume ?? 0.7;
  const soundEffectsVolume = audioSettings?.soundEffectsVolume ?? 1.0;
  const handScoringMinVolumePercent = audioSettings?.handScoringMinVolumePercent ?? 0;
  const musicEnabled = audioSettings?.musicEnabled ?? true;
  const soundEffectsEnabled = audioSettings?.soundEffectsEnabled ?? true;

  const speedValue =
    animationSpeedMode === "skip"
      ? ANIMATION_SPEED_MAX
      : Math.min(ANIMATION_SPEED_MAX, Math.max(ANIMATION_SPEED_MIN, animationSpeedMode));

  const hasCheats =
    onCheatAddCredits != null || onCheatAddHands != null || onCheatSetDevilsDeal != null;

  return (
    <Modal
      opened
      onClose={onClose}
      title="Settings"
      centered
      size="lg"
      overlayProps={{ backgroundOpacity: 0.55 }}
      styles={{
        title: { color: clubTokens.text.brass, fontWeight: 700 },
        content: {
          backgroundColor: clubTokens.surface.panel,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          maxHeight: "90vh",
        },
        body: { maxHeight: "calc(90vh - 4rem)", overflowY: "auto" },
      }}
    >
      <Stack gap="lg">
        {(onMusicVolumeChange != null ||
          onSoundEffectsVolumeChange != null ||
          onHandScoringMinVolumeChange != null ||
          onToggleMusic != null ||
          onToggleSoundEffects != null) && (
          <Paper {...sectionPaper}>
            <Stack gap="md">
              <Title order={5} c={clubTokens.text.brass} tt="uppercase" fz="sm">
                Audio
              </Title>
              {onToggleMusic != null && (
                <Switch
                  label="Music"
                  checked={musicEnabled}
                  onChange={() => onToggleMusic()}
                  color="yellow"
                />
              )}
              {onMusicVolumeChange != null && (
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="sm" c={clubTokens.text.secondary}>
                      Music volume
                    </Text>
                    <Text size="sm" c={clubTokens.text.muted}>
                      {Math.round(musicVolume * 100)}%
                    </Text>
                  </Group>
                  <Slider
                    min={0}
                    max={100}
                    value={Math.round(musicVolume * 100)}
                    onChange={(v) => onMusicVolumeChange(v / 100)}
                    color="yellow"
                    aria-label="Music volume"
                  />
                </Stack>
              )}
              {onToggleSoundEffects != null && (
                <Switch
                  label="Sound effects"
                  checked={soundEffectsEnabled}
                  onChange={() => onToggleSoundEffects()}
                  color="yellow"
                />
              )}
              {onSoundEffectsVolumeChange != null && (
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="sm" c={clubTokens.text.secondary}>
                      SFX volume
                    </Text>
                    <Text size="sm" c={clubTokens.text.muted}>
                      {Math.round(soundEffectsVolume * 100)}%
                    </Text>
                  </Group>
                  <Slider
                    min={0}
                    max={100}
                    value={Math.round(soundEffectsVolume * 100)}
                    onChange={(v) => onSoundEffectsVolumeChange(v / 100)}
                    color="yellow"
                    aria-label="Sound effects volume"
                  />
                </Stack>
              )}
              {onHandScoringMinVolumeChange != null && (
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="sm" c={clubTokens.text.secondary}>
                      Min volume (repeated hands)
                    </Text>
                    <Text size="sm" c={clubTokens.text.muted}>
                      {handScoringMinVolumePercent}%
                    </Text>
                  </Group>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={handScoringMinVolumePercent}
                    onChange={onHandScoringMinVolumeChange}
                    color="yellow"
                    aria-label="Minimum volume when scoring multiple hands in a row"
                  />
                  <Text size="xs" c={clubTokens.text.muted}>
                    Floor when scoring many same-rank hands. 0 = can go silent.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Paper>
        )}

        {onAnimationSpeedChange != null && (
          <Paper {...sectionPaper}>
            <Stack gap="md">
              <Title order={5} c={clubTokens.text.brass} tt="uppercase" fz="sm">
                Animation speed
              </Title>
              <Group justify="space-between">
                <Text size="sm" c={clubTokens.text.secondary}>
                  Speed
                </Text>
                <Text size="sm" fw={700} c={clubTokens.text.brass}>
                  {animationSpeedMode === "skip" ? "Skip" : `${speedValue}×`}
                </Text>
              </Group>
              <Slider
                min={ANIMATION_SPEED_MIN}
                max={ANIMATION_SPEED_MAX}
                step={ANIMATION_SPEED_STEP}
                value={speedValue}
                onChange={(v) => onAnimationSpeedChange(v)}
                disabled={animationSpeedMode === "skip"}
                color="yellow"
                aria-label="Animation speed"
              />
              <Group justify="space-between">
                <Text size="xs" c={clubTokens.text.muted}>
                  0.5×
                </Text>
                <Text size="xs" c={clubTokens.text.muted}>
                  7×
                </Text>
              </Group>
              <Switch
                label="Skip animations"
                checked={animationSpeedMode === "skip"}
                onChange={(e) => onAnimationSpeedChange(e.currentTarget.checked ? "skip" : 1)}
                color="yellow"
              />
            </Stack>
          </Paper>
        )}

        {onCardThemeChange != null && (
          <Paper {...sectionPaper}>
            <Stack gap="sm">
              <Title order={5} c={clubTokens.text.brass} tt="uppercase" fz="sm">
                Card style
              </Title>
              <Radio.Group
                value={cardTheme}
                onChange={(value) => onCardThemeChange(value as "light" | "dark")}
                name="cardTheme"
              >
                <Stack gap="sm">
                  <Radio
                    value="light"
                    label="Light"
                    description="White cards, traditional red and black"
                    styles={{ label: { color: clubTokens.text.primary } }}
                  />
                  <Radio
                    value="dark"
                    label="Dark"
                    description="Dark cards with red and light suit text"
                    styles={{ label: { color: clubTokens.text.primary } }}
                  />
                </Stack>
              </Radio.Group>
            </Stack>
          </Paper>
        )}

        {hasCheats && (
          <Paper {...sectionPaper} p={0} style={{ ...sectionPaper.style, overflow: "hidden" }}>
            <UnstyledButton
              type="button"
              onClick={() => setCheatsExpanded((p) => !p)}
              w="100%"
              p="md"
              aria-expanded={cheatsExpanded}
            >
              <Group justify="space-between">
                <Title order={5} c={clubTokens.text.brass} tt="uppercase" fz="sm">
                  Cheats
                </Title>
                <Text c={clubTokens.text.muted}>{cheatsExpanded ? "▼" : "▶"}</Text>
              </Group>
            </UnstyledButton>
            <Collapse in={cheatsExpanded}>
              <Stack gap="xs" px="md" pb="md">
                {onCheatAddCredits != null &&
                  gameConfig.cheatsModal.creditTopUps.map((amount) => (
                    <GameButton
                      key={`cheat-credits-${amount}`}
                      onClick={() => onCheatAddCredits(amount)}
                      variant="secondary"
                      size="sm"
                      fullWidth
                    >
                      Add {amount.toLocaleString()} Credits
                    </GameButton>
                  ))}
                {onCheatAddHands != null &&
                  gameConfig.cheatsModal.parallelHandTopUps.map((amount) => (
                    <GameButton
                      key={`cheat-hands-${amount}`}
                      onClick={() => onCheatAddHands(amount)}
                      variant="secondary"
                      size="sm"
                      fullWidth
                    >
                      Add {amount} Parallel Hands
                    </GameButton>
                  ))}
                {onCheatSetDevilsDeal != null && (
                  <GameButton onClick={onCheatSetDevilsDeal} variant="secondary" size="sm" fullWidth>
                    Devil&apos;s Deal: 100% Chance, 1% Cost
                  </GameButton>
                )}
              </Stack>
            </Collapse>
          </Paper>
        )}

        <Divider color={clubTokens.surface.brassStroke} />

        <GameButton onClick={onClose} variant="primary" size="md" fullWidth>
          Close
        </GameButton>
      </Stack>
    </Modal>
  );
}
