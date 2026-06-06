import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import { Box } from "@mantine/core";
import { useGuideNavigator } from "@/hooks/useGuideNavigator";
import { ClubGuidePanel } from "./ClubGuidePanel";
import { clubTokens } from "@/theme/clubTokens";
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
  
  const {
    slideIndex: activeStep,
    isFirst,
    isLast,
    goBack,
    goNext,
    reduceMotion,
  } = useGuideNavigator({
    stepsCount: steps.length,
    onClose: () => {
      onStepChangeRef.current?.(null);
      onClose();
    },
    opened: true,
  });

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
    let settleTimer: number | null = null;

    if (currentStep) {
      onStepChangeRef.current?.(currentStep.mockState || {});
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      
      // Calculate immediately for fast responsiveness
      updateSpotlight(0);

      // Re-run highlight positioning after 1000ms once layout transitions and animations settle
      settleTimer = window.setTimeout(() => {
        updateSpotlight(0);
      }, 1000);
    }

    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
    };
  }, [activeStep, steps, updateSpotlight]);

  useEffect(() => {
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [updateSpotlight]);

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
        <ClubGuidePanel
          speakerIcon="🍷"
          speakerName="Pazillus A. Rabellum"
          speakerRole="Club Sommelier"
          progressText={`Step ${activeStep + 1} of ${steps.length}`}
          onClose={() => {
            onStepChangeRef.current?.(null);
            onClose();
          }}
          closeLabel="Exit Tutorial"
          title={currentStep.title}
          dialogue={dialogueText}
          isFirst={isFirst}
          isLast={isLast}
          onBack={goBack}
          onNext={goNext}
          slideIndex={activeStep}
          reduceMotion={reduceMotion}
        />
      </Box>
    </Box>
  );
}
