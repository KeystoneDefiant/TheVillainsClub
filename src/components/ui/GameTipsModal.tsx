import { useState, useEffect } from "react";
import { Box, Group, Modal, Text } from "@mantine/core";
import { ClubButton } from "./ClubButton";
import { clubTokens } from "@/theme/clubTokens";
import { gameTipsCatalog } from "@/config/gameTipsCatalog";
import "./GameTipsModal.css";

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
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = gameId ? (gameTipsCatalog[gameId] || []) : [];

  // Reset to first slide whenever the modal is opened
  useEffect(() => {
    if (opened) {
      setSlideIndex(0);
    }
  }, [opened]);

  useEffect(() => {
    if (!opened || slides.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (slideIndex === 0) {
          onClose();
        } else {
          setSlideIndex((i) => i - 1);
        }
      }
      if (e.key === "ArrowRight") {
        if (slideIndex === slides.length - 1) {
          onClose();
        } else {
          setSlideIndex((i) => i + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideIndex, opened, slides.length, onClose]);

  if (!opened || !gameId || slides.length === 0) return null;

  const slide = slides[slideIndex];
  if (!slide) return null;

  const isFirst = slideIndex === 0;
  const isLast = slideIndex === slides.length - 1;
  const gameName = GAME_NAMES[gameId] || gameId;

  const goBack = () => {
    if (isFirst) {
      onClose();
    } else {
      setSlideIndex((i) => i - 1);
    }
  };

  const goNext = () => {
    if (isLast) {
      onClose();
    } else {
      setSlideIndex((i) => i + 1);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      padding={0}
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.65 }}
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
      <Box
        className="tips-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tips-title"
        aria-describedby="tips-content"
      >
        <div className="tips-header" style={{ borderBottom: `1px solid ${clubTokens.surface.brassStroke}2b` }}>
          <div>
            <Text size="xs" tt="uppercase" fw={800} c={clubTokens.text.muted} style={{ letterSpacing: "0.08em" }}>
              {gameName} Strategy Guide
            </Text>
            <h2 id="tips-title" className="tips-title" style={{ color: clubTokens.text.brass, fontFamily: "Georgia, serif" }}>
              {slide.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tips-close"
            aria-label="Close tips"
            style={{ color: clubTokens.text.muted }}
          >
            ×
          </button>
        </div>

        <div id="tips-content" className="tips-content">
          <Text size="sm" className="tips-body" c={clubTokens.text.primary} style={{ lineHeight: 1.6 }}>
            {slide.content}
          </Text>
        </div>

        <div className="tips-footer" style={{ borderTop: `1px solid ${clubTokens.surface.brassStroke}2b` }}>
          <Text className="tips-progress" size="sm" c={clubTokens.text.muted} aria-live="polite">
            Tip {slideIndex + 1} of {slides.length}
          </Text>
          <Group gap="sm" className="tips-nav">
            <ClubButton
              type="button"
              variant="outline"
              size="xs"
              onClick={goBack}
            >
              {isFirst ? "Back to Menu" : "Back"}
            </ClubButton>
            <ClubButton
              type="button"
              variant="filled"
              size="xs"
              onClick={goNext}
            >
              {isLast ? "Done" : "Next"}
            </ClubButton>
          </Group>
        </div>
      </Box>
    </Modal>
  );
}
