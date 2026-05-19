import { useState } from "react";
import { Modal, Stack, Switch, Text, Slider, Divider, Alert, Group } from "@mantine/core";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { resetShellGameProgress } from "@/game/resetShellGameProgress";
import { ClubButton } from "./ClubButton";
import { clubTokens } from "@/theme/clubTokens";

interface GameSettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function GameSettingsModal({ opened, onClose }: GameSettingsModalProps) {
  const {
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    repeatSfxAttenuationPercent,
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
    setRepeatSfxAttenuationPercent,
  } = useClubAudioStore();

  const [resetProgressArmed, setResetProgressArmed] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Settings"
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.55 }}
      styles={{
        title: { color: clubTokens.text.brass, fontWeight: 700, fontFamily: "Georgia, serif" },
        content: {
          backgroundColor: clubTokens.surface.panel,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        },
      }}
    >
      <Stack gap="md">
        {!resetProgressArmed ? (
          <>
            <Switch
              data-autofocus
              label="Music"
              checked={musicEnabled}
              onChange={(e) => setMusicEnabled(e.currentTarget.checked)}
              color="yellow"
              styles={{ label: { color: clubTokens.text.primary } }}
            />
            <Switch
              label="Sound effects"
              checked={sfxEnabled}
              onChange={(e) => setSfxEnabled(e.currentTarget.checked)}
              color="yellow"
              styles={{ label: { color: clubTokens.text.primary } }}
            />
            <div>
              <Text size="sm" mb={6} c={clubTokens.text.secondary}>
                Global music volume
              </Text>
              <Slider
                value={Math.round(musicVolume * 100)}
                onChange={(v) => setMusicVolume(v / 100)}
                color="yellow"
              />
            </div>
            <div>
              <Text size="sm" mb={6} c={clubTokens.text.secondary}>
                Global sound effects volume
              </Text>
              <Slider
                value={Math.round(sfxVolume * 100)}
                onChange={(v) => setSfxVolume(v / 100)}
                color="yellow"
              />
            </div>
            <div>
              <Text size="sm" mb={6} c={clubTokens.text.secondary}>
                Repeating SFX attenuation floor (% of SFX volume, 0–10)
              </Text>
              <Slider
                max={10}
                step={0.5}
                value={repeatSfxAttenuationPercent}
                onChange={setRepeatSfxAttenuationPercent}
                color="yellow"
              />
            </div>
            <Text size="xs" c={clubTokens.text.muted}>
              At the door, music starts at 30% of this setting and fades to full after you enter.
            </Text>
            <Divider color={clubTokens.surface.brassStroke} />
            <Text size="sm" fw={600} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif" }}>
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
                  onClose();
                }}
              >
                Confirm reset
              </ClubButton>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
