import { useEffect } from "react";
import { Modal, Box } from "@mantine/core";
import { useGuideNavigator } from "@/hooks/useGuideNavigator";
import { ClubGuidePanel } from "./ClubGuidePanel";
import { clubTokens } from "@/theme/clubTokens";
import { gameTipsCatalog } from "@/config/gameTipsCatalog";
import "./GameTipsModal.scss";

interface GameTipsModalProps {
  opened: boolean;
  onClose: () => void;
  gameId: string | null;
}

const GAME_NAMES: Record<string, string> = {
  oubliette_no9: "Oubliette Number 9",
  seven_year_itch: "7 Year Itch",
  fateseal_silver: "Fateseal Silver",
  masterson_1881: "Masterton 1881",
};

export function GameTipsModal({ opened, onClose, gameId }: GameTipsModalProps) {
  const slides = gameId ? (gameTipsCatalog[gameId] || []) : [];

  const {
    slideIndex,
    isFirst,
    isLast,
    goBack,
    goNext,
    reduceMotion,
    reset,
  } = useGuideNavigator({
    stepsCount: slides.length,
    onClose,
    opened,
  });

  // Reset to first slide whenever the modal is opened
  useEffect(() => {
    if (opened) {
      reset();
    }
  }, [opened, reset]);

  if (!opened || !gameId || slides.length === 0) return null;

  const slide = slides[slideIndex];
  if (!slide) return null;

  const gameName = GAME_NAMES[gameId] || gameId;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      padding={0}
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
      styles={{
        content: {
          backgroundColor: clubTokens.surface.walnut,
          border: `2px solid ${clubTokens.surface.brassStroke}`,
          borderRadius: "12px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          maxHeight: "90vh",
        },
        body: { padding: 0 },
      }}
    >
      <Box className="tips-modal" role="dialog" aria-modal="true" aria-labelledby="tips-title" aria-describedby="tips-content">
        <ClubGuidePanel
          speakerIcon="🎲"
          speakerName="Claudius L'Ausula"
          speakerRole={`Club Pit Boss — ${gameName} Tips`}
          progressText={`Tip ${slideIndex + 1} of ${slides.length}`}
          onClose={onClose}
          closeLabel="Close Guide"
          closeAriaLabel="Close tips"
          title={slide.title}
          dialogue={slide.content}
          isFirst={isFirst}
          isLast={isLast}
          onBack={goBack}
          onNext={goNext}
          slideIndex={slideIndex}
          reduceMotion={reduceMotion}
          style={{ border: "none", background: "none", boxShadow: "none" }}
        />
      </Box>
    </Modal>
  );
}
