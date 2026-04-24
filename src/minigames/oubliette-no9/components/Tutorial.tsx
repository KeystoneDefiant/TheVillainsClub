import { useState, useEffect } from "react";
import { Box, Button, Group, Modal, Text } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { tutorialSlides } from "../config/tutorialConfig";
import "./Tutorial.css";

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = tutorialSlides[slideIndex];
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === tutorialSlides.length - 1;

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (slideIndex === 0) onClose();
        else setSlideIndex((i) => i - 1);
      }
      if (e.key === "ArrowRight") {
        if (slideIndex === tutorialSlides.length - 1) onClose();
        else setSlideIndex((i) => i + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slideIndex, onClose]);

  return (
    <Modal
      opened
      onClose={onClose}
      withCloseButton={false}
      padding={0}
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.55 }}
      styles={{
        content: {
          padding: 0,
          overflow: "hidden",
          maxHeight: "90vh",
        },
        body: { padding: 0 },
      }}
    >
      <Box
        className="tutorial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tutorial-header">
          <h2 id="tutorial-title" className="tutorial-title">
            {slide.title}
          </h2>
          <button type="button" onClick={onClose} className="tutorial-close" aria-label="Close tutorial">
            ×
          </button>
        </div>

        <div id="tutorial-content" className="tutorial-content">
          <p className="tutorial-body">{slide.content}</p>
        </div>

        <div className="tutorial-footer">
          <Text className="tutorial-progress" size="sm" c={clubTokens.text.muted} aria-live="polite">
            {slideIndex + 1} of {tutorialSlides.length}
          </Text>
          <Group gap="sm" className="tutorial-nav">
            <Button
              type="button"
              variant="default"
              className="tutorial-btn tutorial-btn-secondary"
              onClick={goBack}
            >
              {isFirst ? "Back to Menu" : "Back"}
            </Button>
            <Button
              type="button"
              variant="filled"
              color="yellow"
              className="tutorial-btn tutorial-btn-primary"
              onClick={goNext}
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </Group>
        </div>
      </Box>
    </Modal>
  );
}
