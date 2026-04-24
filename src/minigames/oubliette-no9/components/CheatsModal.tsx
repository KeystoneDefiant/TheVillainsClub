import { Modal, Stack } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { GameButton } from "./GameButton";

interface CheatsModalProps {
  onClose: () => void;
  onAddCredits: (amount: number) => void;
  onAddHands: (amount: number) => void;
  onSetDevilsDealCheat?: () => void;
}

export function CheatsModal({ onClose, onAddCredits, onAddHands, onSetDevilsDealCheat }: CheatsModalProps) {
  return (
    <Modal
      opened
      onClose={onClose}
      title="Cheats"
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.55 }}
      styles={{
        title: { color: clubTokens.text.brass, fontWeight: 700 },
        content: {
          backgroundColor: clubTokens.surface.panel,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
        },
      }}
    >
      <Stack gap="md">
        <GameButton
          onClick={() => {
            onAddCredits(1000);
            onClose();
          }}
          variant="secondary"
          size="md"
          fullWidth
        >
          Add 1000 Credits
        </GameButton>
        <GameButton
          onClick={() => {
            onAddCredits(10000);
            onClose();
          }}
          variant="secondary"
          size="md"
          fullWidth
        >
          Add 10000 Credits
        </GameButton>
        <GameButton
          onClick={() => {
            onAddHands(10);
            onClose();
          }}
          variant="secondary"
          size="md"
          fullWidth
        >
          Add 10 Parallel Hands
        </GameButton>
        <GameButton
          onClick={() => {
            onAddHands(50);
            onClose();
          }}
          variant="secondary"
          size="md"
          fullWidth
        >
          Add 50 Parallel Hands
        </GameButton>
        {onSetDevilsDealCheat ? (
          <GameButton
            onClick={() => {
              onSetDevilsDealCheat();
              onClose();
            }}
            variant="secondary"
            size="md"
            fullWidth
          >
            Devil&apos;s Deal: 100% Chance, 1% Cost
          </GameButton>
        ) : null}

        <GameButton onClick={onClose} variant="ghost" size="md" fullWidth>
          Close
        </GameButton>
      </Stack>
    </Modal>
  );
}
