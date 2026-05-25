import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, Group, Paper, Text, Title, Stack } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { ClubButton } from "./ClubButton";
import { sommelierTutorialCatalog } from "@/config/sommelierTutorialCatalog";

export interface SommelierLiveGuideProps {
  gameId: string;
  onStepChange?: (mockState: Record<string, unknown> | null) => void;
  onClose: () => void;
}

export function SommelierLiveGuide({
  gameId,
  onStepChange,
  onClose,
}: SommelierLiveGuideProps) {
  const steps = useMemo(() => sommelierTutorialCatalog[gameId] || [], [gameId]);
  const [activeStep, setActiveStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const updateSpotlight = useCallback(() => {
    const selector = stepsRef.current[activeStep]?.highlightSelector;
    if (!selector) {
      setSpotlightRect(null);
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setSpotlightRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [activeStep]);

  // Sync mock state & spotlight on step change
  useEffect(() => {
    const currentStep = steps[activeStep];
    if (currentStep) {
      if (onStepChange) {
        onStepChange(currentStep.mockState || {});
      }
      // Wait a frame for React to render mock layouts before measuring spotlight coordinates
      const timer = window.setTimeout(updateSpotlight, 50);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [activeStep, steps, onStepChange, updateSpotlight]);

  // Listen to resize and scroll to keep spotlight aligned
  useEffect(() => {
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [updateSpotlight]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      if (onStepChange) onStepChange(null);
      onClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleExit = () => {
    if (onStepChange) onStepChange(null);
    onClose();
  };

  const currentStep = steps[activeStep];
  if (!currentStep) return null;

  return (
    <Box
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9000,
        pointerEvents: "none",
      }}
    >
      {/* 1. Viewport dimming mask with gold cutout spotlight */}
      <div
        style={{
          position: "absolute",
          zIndex: 9001,
          pointerEvents: "none",
          left: spotlightRect ? spotlightRect.left : -9999,
          top: spotlightRect ? spotlightRect.top : -9999,
          width: spotlightRect ? spotlightRect.width : 0,
          height: spotlightRect ? spotlightRect.height : 0,
          borderRadius: 8,
          boxShadow: spotlightRect
            ? `0 0 0 9999px rgba(5, 5, 8, 0.78), 0 0 0 2px ${clubTokens.surface.brassStroke}, 0 0 16px 4px rgba(199, 158, 87, 0.45)`
            : "0 0 0 9999px rgba(5, 5, 8, 0.78)",
          transition: "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      {/* 2. Pazillus Dialogue Card */}
      <Box
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 600,
          zIndex: 9002,
          pointerEvents: "auto",
        }}
      >
        <Paper
          p="md"
          radius="md"
          style={{
            background: `linear-gradient(135deg, ${clubTokens.surface.walnutHi} 0%, ${clubTokens.surface.panel} 100%)`,
            border: `2px solid ${clubTokens.surface.brassStroke}`,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Header */}
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <span
                style={{
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  filter: "drop-shadow(0 0 4px rgba(199,158,87,0.5))",
                }}
                aria-hidden
              >
                🍷
              </span>
              <Stack gap={1}>
                <Title
                  order={4}
                  fz="sm"
                  c={clubTokens.text.brass}
                  style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
                >
                  Pazillus A. Rabellum
                </Title>
                <Text size="10px" c={clubTokens.text.muted} tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
                  Club Sommelier
                </Text>
              </Stack>
            </Group>
            <Text size="xs" c={clubTokens.text.muted} fw={700}>
              Step {activeStep + 1} of {steps.length}
            </Text>
          </Group>

          <hr style={{ margin: 0, border: 0, borderTop: `1px solid ${clubTokens.surface.brassStroke}`, opacity: 0.35 }} />

          {/* Dialogue Bubble */}
          <Stack gap={2}>
            <Text
              size="xs"
              fw={700}
              c={clubTokens.text.brass}
              tt="uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              {currentStep.title}
            </Text>
            <Text
              size="sm"
              c={clubTokens.text.primary}
              style={{
                fontStyle: "italic",
                lineHeight: 1.45,
                minHeight: 48,
              }}
            >
              "{currentStep.dialogue}"
            </Text>
          </Stack>

          <hr style={{ margin: 0, border: 0, borderTop: `1px solid ${clubTokens.surface.brassStroke}`, opacity: 0.35 }} />

          {/* Actions */}
          <Group justify="space-between" wrap="nowrap">
            <ClubButton
              size="xs"
              variant="subtle"
              onClick={handleExit}
              style={{ color: clubTokens.text.accent }}
            >
              Exit Tutorial
            </ClubButton>
            <Group gap="xs" wrap="nowrap">
              <ClubButton
                size="xs"
                variant="outline"
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </ClubButton>
              <ClubButton
                size="xs"
                variant="filled"
                color="yellow"
                onClick={handleNext}
                styles={{ label: { fontWeight: 700 } }}
              >
                {activeStep === steps.length - 1 ? "Finish" : "Next"}
              </ClubButton>
            </Group>
          </Group>
        </Paper>
      </Box>
    </Box>
  );
}
