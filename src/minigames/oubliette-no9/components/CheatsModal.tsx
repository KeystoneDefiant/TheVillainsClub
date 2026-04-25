import { Modal, Stack } from "@mantine/core";
import { gameConfig } from "@/config/minigames/oublietteNo9GameRules";
import { clubTokens } from "@/theme/clubTokens";
import { GameButton } from "./GameButton";

interface CheatsModalProps {
  onClose: () => void;
  onAddCredits: (amount: number) => void;
  onAddHands: (amount: number) => void;
  onSetDevilsDealCheat?: () => void;
}

export function CheatsModal({ onClose, onAddCredits, onAddHands, onSetDevilsDealCheat }: CheatsModalProps) {
  const { creditTopUps, parallelHandTopUps } = gameConfig.cheatsModal;
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
        {creditTopUps.map((amount) => (
          <GameButton
            key={`credits-${amount}`}
            onClick={() => {
              onAddCredits(amount);
              onClose();
            }}
            variant="secondary"
            size="md"
            fullWidth
          >
            Add {amount.toLocaleString()} Credits
          </GameButton>
        ))}
        {parallelHandTopUps.map((amount) => (
          <GameButton
            key={`hands-${amount}`}
            onClick={() => {
              onAddHands(amount);
              onClose();
            }}
            variant="secondary"
            size="md"
            fullWidth
          >
            Add {amount} Parallel Hands
          </GameButton>
        ))}
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
