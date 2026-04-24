import { List, Modal, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { GameButton } from "./GameButton";

interface CreditsProps {
  onClose: () => void;
}

export function Credits({ onClose }: CreditsProps) {
  return (
    <Modal
      opened
      onClose={onClose}
      title="Oubliette No. 9"
      centered
      size="lg"
      overlayProps={{ backgroundOpacity: 0.55 }}
      styles={{
        title: { color: clubTokens.text.brass, fontWeight: 700 },
        content: {
          backgroundColor: clubTokens.surface.panel,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
        },
      }}
    >
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={4} size="h5" c={clubTokens.text.brass}>
            Game design & development
          </Title>
          <Text c={clubTokens.text.secondary}>Chris Flohr</Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4} size="h5" c={clubTokens.text.brass}>
            Special thanks
          </Title>
          <List size="sm" c={clubTokens.text.muted} spacing="xs">
            <List.Item>You, for taking a peek at this nonsense.</List.Item>
            <List.Item>Kristen, for actually enjoying this mess of a game.</List.Item>
            <List.Item>Kelsey, for the Devil&apos;s Deal idea. Blame her.</List.Item>
          </List>
        </Stack>

        <GameButton onClick={onClose} variant="primary" size="md" fullWidth>
          Close
        </GameButton>
      </Stack>
    </Modal>
  );
}
