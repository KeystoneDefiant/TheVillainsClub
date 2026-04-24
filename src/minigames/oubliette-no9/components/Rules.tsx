import { Modal, ScrollArea, Stack, Title, Text, List } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

interface RulesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Rules({ isOpen, onClose }: RulesProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="How to Play"
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      styles={{
        header: { backgroundColor: clubTokens.surface.panel },
        title: { color: clubTokens.text.brass, fontWeight: 700 },
        body: { backgroundColor: clubTokens.surface.panel },
        content: { border: `1px solid ${clubTokens.surface.brassStroke}` },
      }}
    >
      <ScrollArea.Autosize mah="70vh" type="auto">
        <Stack gap="md" pr="xs">
          <Text size="sm" c={clubTokens.text.secondary}>
            Oubliette No. 9 is a high-stakes video poker experience. Your goal is to build the strongest possible
            poker hand from five cards.
          </Text>

          <div>
            <Title order={5} tt="uppercase" fz="xs" c={clubTokens.text.muted} fw={600} mb="xs">
              Gameplay
            </Title>
            <List size="sm" c={clubTokens.text.secondary} spacing="xs">
              <List.Item>You are dealt five cards initially.</List.Item>
              <List.Item>Select cards to hold (tap/click to toggle).</List.Item>
              <List.Item>Draw new cards to replace the ones you did not hold.</List.Item>
              <List.Item>Your final hand is evaluated against the payout table.</List.Item>
            </List>
          </div>

          <div>
            <Title order={5} tt="uppercase" fz="xs" c={clubTokens.text.muted} fw={600} mb="xs">
              Hand Rankings
            </Title>
            <Text size="sm" c={clubTokens.text.secondary}>
              Standard poker hand rankings apply, from Royal Flush (highest) down to high card. Payouts follow the
              active payout table for this table.
            </Text>
          </div>

          <div>
            <Title order={5} tt="uppercase" fz="xs" c={clubTokens.text.muted} fw={600} mb="xs">
              Strategy Tips
            </Title>
            <List size="sm" c={clubTokens.text.secondary} spacing="xs">
              <List.Item>Always hold a winning hand if you are dealt one.</List.Item>
              <List.Item>Four to a Royal Flush is often worth pursuing over a smaller made hand.</List.Item>
              <List.Item>Low pairs can be tricky; sometimes keep them, sometimes chase a straight or flush.</List.Item>
            </List>
          </div>
        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  );
}
