import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, Group, Paper, Text, Title, Stack } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { ClubButton } from "./ClubButton";
import { sommelierTutorialCatalog } from "@/config/sommelierTutorialCatalog";
import { useClubWallet, getPlayerTitle } from "@/game/clubWalletStore";

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
  // One rect per highlighted element; the dim mask uses the bounding envelope.
  const [spotlightRects, setSpotlightRects] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }[]>([]);

  const guideRef = useRef<HTMLDivElement>(null);
  const retryTimerRef = useRef<number | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  // Keep a stable ref to onStepChange so effects don't need it as a dependency
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  const updateSpotlight = useCallback((retry: number | unknown = 0) => {
    const retryCount = typeof retry === "number" ? retry : 0;

    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const raw = stepsRef.current[activeStep]?.highlightSelector;
    if (!raw) {
      setSpotlightRects([]);
      return;
    }

    const guideEl = guideRef.current;
    if (!guideEl) {
      if (retryCount < 25) {
        retryTimerRef.current = window.setTimeout(() => {
          updateSpotlight(retryCount + 1);
        }, 100);
      }
      return;
    }

    const selectors = Array.isArray(raw) ? raw : [raw];
    const rects: { left: number; top: number; width: number; height: number }[] = [];

    const rectContainer = guideEl.getBoundingClientRect();
    const scale = rectContainer.width > 0 ? rectContainer.width / guideEl.offsetWidth : 1;

    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        // Check both existence and visibility to prevent highlighting hidden dummy/transitioning elements
        if (r.width > 0 || r.height > 0) {
          if (scale > 0) {
            rects.push({
              left: (r.left - rectContainer.left) / scale,
              top: (r.top - rectContainer.top) / scale,
              width: r.width / scale,
              height: r.height / scale,
            });
          } else {
            rects.push({ left: r.left - rectContainer.left, top: r.top - rectContainer.top, width: r.width, height: r.height });
          }
        }
      }
    }

    // If elements are not yet mounted or visible in the DOM (e.g. during a screen transition),
    // poll and retry measuring up to 25 times (2.5 seconds total) before giving up.
    if (rects.length === 0 && retryCount < 25) {
      retryTimerRef.current = window.setTimeout(() => {
        updateSpotlight(retryCount + 1);
      }, 100);
      return;
    }

    setSpotlightRects(rects);
  }, [activeStep]);

  // Sync mock state & spotlight on step change.
  useEffect(() => {
    const currentStep = steps[activeStep];
    if (currentStep) {
      onStepChangeRef.current?.(currentStep.mockState || {});
      // Reset any active timers and start measuring
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      updateSpotlight(0);
    }
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [activeStep, steps, updateSpotlight]);

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
      onStepChangeRef.current?.(null);
      onClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleExit = () => {
    onStepChangeRef.current?.(null);
    onClose();
  };

  const currentStep = steps[activeStep];
  const {
    playerName,
    clubBalance,
    hasPlayedFirstGame,
    isBum,
    customPlayerTitle,
  } = useClubWallet();

  const playerTitle = useMemo(() => {
    return getPlayerTitle({
      clubBalance,
      hasPlayedFirstGame,
      isBum,
      customPlayerTitle,
    });
  }, [clubBalance, hasPlayedFirstGame, isBum, customPlayerTitle]);

  const dialogueText = useMemo(() => {
    if (!currentStep) return "";
    const raw = currentStep.dialogue;
    const name = playerName || "friend";
    return raw
      .replace(/{playerName}/g, name)
      .replace(/{playerTitle}/g, playerTitle);
  }, [currentStep, playerName, playerTitle]);

  if (!currentStep) return null;

  return (
    <Box
      ref={guideRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9000,
        pointerEvents: "none",
      }}
    >
      {/* 1. Viewport dimming mask with bounding-envelope cutout */}
      {(() => {
        // Compute bounding envelope across all highlighted rects
        const envelope =
          spotlightRects.length > 0
            ? spotlightRects.reduce(
                (acc, r) => ({
                  left: Math.min(acc.left, r.left),
                  top: Math.min(acc.top, r.top),
                  right: Math.max(acc.right, r.left + r.width),
                  bottom: Math.max(acc.bottom, r.top + r.height),
                }),
                { left: spotlightRects[0].left, top: spotlightRects[0].top, right: spotlightRects[0].left + spotlightRects[0].width, bottom: spotlightRects[0].top + spotlightRects[0].height },
              )
            : null;
        const env = envelope
          ? { left: envelope.left, top: envelope.top, width: envelope.right - envelope.left, height: envelope.bottom - envelope.top }
          : null;

        return (
          <div
            style={{
              position: "absolute",
              zIndex: 9001,
              pointerEvents: "none",
              left: env ? env.left : -9999,
              top: env ? env.top : -9999,
              width: env ? env.width : 0,
              height: env ? env.height : 0,
              borderRadius: 8,
              boxShadow: env
                ? `0 0 0 9999px rgba(5, 5, 8, 0.78), 0 0 0 2px ${clubTokens.surface.brassStroke}, 0 0 16px 4px rgba(199, 158, 87, 0.45)`
                : "0 0 0 9999px rgba(5, 5, 8, 0.78)",
              transition: "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        );
      })()}

      {/* 1b. Individual bright rings for each highlighted element (when >1) */}
      {spotlightRects.length > 1 &&
        spotlightRects.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              zIndex: 9002,
              pointerEvents: "none",
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
              borderRadius: 8,
              boxShadow: `0 0 0 2px ${clubTokens.surface.brassStroke}, 0 0 12px 2px rgba(199, 158, 87, 0.55)`,
              transition: "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        ))}

      {/* 2. Pazillus Dialogue Card */}
      <Box
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 600,
          zIndex: 9003,
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
                whiteSpace: "pre-line",
              }}
            >
              "{dialogueText}"
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
