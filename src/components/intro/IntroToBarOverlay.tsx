import { useEffect, useMemo, useRef, useCallback } from "react";
import { Box } from "@mantine/core";
import { motion } from "framer-motion";
import { VC_LOGO_INTRO_VIEWBOX, vcLogoRedPaths } from "@/components/intro/vcLogoIntroPaths";
import { useIntroToBarTransition } from "@/game/introToBarTransitionStore";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";

const RED_FILL = "#c0272d";
/** Zoom in on the red mark (seconds). */
const RED_ZOOM_SEC = 0.88;
/** Hold solid club red before fade (seconds). */
const RED_SOLID_HOLD_SEC = 0.2;

function RedOnlyMark() {
  return (
    <svg
      viewBox={VC_LOGO_INTRO_VIEWBOX}
      style={{ display: "block", width: "100%", height: "auto" }}
      aria-hidden
    >
      <title> </title>
      <g fill={RED_FILL}>
        {vcLogoRedPaths.map((p) => (
          <path key={p.id} d={p.d} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Covers the shell after navigating to `/bar` so the club menu can paint under this layer,
 * then zooms the red mark to fill the frame and fades out.
 */
export function IntroToBarOverlay() {
  const active = useIntroToBarTransition((s) => s.active);
  const end = useIntroToBarTransition((s) => s.end);
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const easing = preset.easing;
  const finished = useRef(false);

  const { totalSec, zoomSolidFrac } = useMemo(() => {
    const zoomSolid = RED_ZOOM_SEC + RED_SOLID_HOLD_SEC;
    const total = zoomSolid + preset.introFadeOut;
    return { totalSec: total, zoomSolidFrac: zoomSolid / total };
  }, [preset.introFadeOut]);

  const safeEnd = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    end();
  }, [end]);

  useEffect(() => {
    finished.current = false;
  }, [active]);

  useEffect(() => {
    if (!active || !reduceMotion) return;
    const t = window.setTimeout(() => safeEnd(), Math.round(320 + preset.introFadeOut * 1000));
    return () => window.clearTimeout(t);
  }, [active, reduceMotion, safeEnd, preset.introFadeOut]);

  if (!active) return null;

  if (reduceMotion) {
    return (
      <motion.div
        role="presentation"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: Math.max(0.2, preset.introFadeOut), ease: easing }}
        onAnimationComplete={safeEnd}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3200,
          background: RED_FILL,
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <motion.div
      role="presentation"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{
        duration: totalSec,
        times: [0, zoomSolidFrac, 1],
        ease: easing,
      }}
      onAnimationComplete={safeEnd}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3200,
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 55%, rgba(26, 10, 18, 0.35) 0%, rgba(8, 4, 10, 0.92) 65%)",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Box className="shell-intro-logo shell-intro-logo--raised" style={{ flexShrink: 0 }}>
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 35 }}
          transition={{ duration: RED_ZOOM_SEC, ease: easing }}
          style={{ transformOrigin: "36% 46%", width: "100%" }}
        >
          <RedOnlyMark />
        </motion.div>
      </Box>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1] }}
        transition={{
          duration: RED_ZOOM_SEC + RED_SOLID_HOLD_SEC,
          times: [0, Math.min(0.92, RED_ZOOM_SEC / (RED_ZOOM_SEC + RED_SOLID_HOLD_SEC)), 1],
          ease: easing,
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: RED_FILL,
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
