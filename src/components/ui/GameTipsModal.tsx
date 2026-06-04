import { useState, useEffect } from "react";
import { Box, Group, Modal, Text, Stack, Title } from "@mantine/core";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
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
  const reduceMotion = usePrefersReducedMotion();

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
      <Box
        className="tips-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tips-title"
        aria-describedby="tips-content"
      >
        {/* Speaker Header mimicking Sommelier Live Guide */}
        <div className="tips-header" style={{ borderBottom: `1px solid ${clubTokens.surface.brassStroke}3b` }}>
          <Group justify="space-between" align="center" wrap="nowrap" style={{ width: "100%" }}>
            <Group gap="xs" wrap="nowrap">
              <span
                style={{
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  filter: "drop-shadow(0 0 4px rgba(199,158,87,0.5))",
                }}
                aria-hidden
              >
                🎲
              </span>
              <Stack gap={1}>
                <h2 id="tips-title" className="tips-speaker-name" style={{ margin: 0, color: clubTokens.text.brass, fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 700 }}>
                  Claudius L'Ausula
                </h2>
                <Text size="10px" c={clubTokens.text.muted} tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
                  Club Pit Boss — {gameName} Tips
                </Text>
              </Stack>
            </Group>
            <Group gap="sm" wrap="nowrap" align="center">
              <Text className="tips-progress" size="xs" c={clubTokens.text.muted} fw={700}>
                Tip {slideIndex + 1} of {slides.length}
              </Text>
              <button
                type="button"
                onClick={onClose}
                className="tips-close"
                aria-label="Close tips"
                style={{ color: clubTokens.text.muted }}
              >
                ×
              </button>
            </Group>
          </Group>
        </div>

        {/* Content Container animating size differences */}
        <motion.div
          id="tips-content"
          className="tips-content"
          layout={!reduceMotion}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -15 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <Title
                order={3}
                c={clubTokens.text.brass}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                {slide.title}
              </Title>
              <div className="tips-quote-block">
                <Text
                  size="sm"
                  className="tips-body"
                  c={clubTokens.text.primary}
                  style={{
                    fontStyle: "italic",
                    lineHeight: 1.55,
                    minHeight: 48,
                    whiteSpace: "pre-line",
                  }}
                >
                  “{slide.content}”
                </Text>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation Footer */}
        <div className="tips-footer" style={{ borderTop: `1px solid ${clubTokens.surface.brassStroke}3b` }}>
          <ClubButton
            type="button"
            variant="subtle"
            size="xs"
            onClick={onClose}
            style={{ color: clubTokens.text.accent }}
          >
            Close Guide
          </ClubButton>
          <Group gap="xs" className="tips-nav">
            <ClubButton
              type="button"
              variant="outline"
              size="xs"
              onClick={goBack}
              disabled={isFirst}
            >
              Back
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
