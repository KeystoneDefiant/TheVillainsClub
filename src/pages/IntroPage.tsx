import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Text } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { VcLogoIntroMark } from "@/components/intro/VcLogoIntroMark";
import { VC_LOGO_GREY_LETTER_COUNT } from "@/components/intro/vcLogoIntroPaths";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { useClubFlowStore } from "@/game/clubFlowStore";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";

export function IntroPage() {
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const setHasEnteredClub = useClubFlowStore((s) => s.setHasEnteredClub);
  const [phase, setPhase] = useState<"enter" | "hold" | "prompt" | "exit">("enter");
  const [skipped, setSkipped] = useState(false);

  const greyCount = VC_LOGO_GREY_LETTER_COUNT;
  const logoZoomSec = useMemo(
    () => greyCount * preset.introLogoLetterDrawSec,
    [greyCount, preset.introLogoLetterDrawSec],
  );
  const logoSequenceSec = logoZoomSec + preset.introLogoSettleSec;
  const enterToHoldMs = useMemo(
    () => Math.round(logoSequenceSec * 1000) + (reduceMotion ? 0 : 80),
    [logoSequenceSec, reduceMotion],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setTimeout(() => setPhase("hold"), enterToHoldMs);
    return () => window.clearTimeout(t);
  }, [enterToHoldMs, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase !== "hold" || skipped) return;
    const t = window.setTimeout(() => setPhase("prompt"), preset.introHoldSec * 1000);
    return () => window.clearTimeout(t);
  }, [phase, skipped, reduceMotion, preset.introHoldSec]);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase !== "exit") return;
    const t = window.setTimeout(() => navigate("/bar", { replace: true }), preset.introFadeOut * 1000 + 120);
    return () => window.clearTimeout(t);
  }, [phase, navigate, preset.introFadeOut, reduceMotion]);

  useEffect(() => {
    if (!reduceMotion) return;
    const t = window.setTimeout(() => setPhase("prompt"), 650);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  const skip = useCallback(() => {
    setSkipped(true);
    setPhase("prompt");
  }, []);

  const enterClub = useCallback(() => {
    setHasEnteredClub(true);
    if (reduceMotion) {
      navigate("/bar", { replace: true });
      return;
    }
    setPhase("exit");
  }, [navigate, reduceMotion, setHasEnteredClub]);

  const easing = preset.easing;
  const instant = reduceMotion;

  const introShellStyle: CSSProperties = instant
    ? { textAlign: "center", maxWidth: 920, backfaceVisibility: "hidden" }
    : {
        textAlign: "center",
        maxWidth: 920,
        backfaceVisibility: "hidden",
        ["--shell-intro-ease" as string]: `cubic-bezier(${preset.easing.join(",")})`,
      };

  return (
    <Box
      onPointerDown={phase === "hold" ? skip : undefined}
      onKeyDown={(e) => {
        if (phase === "hold" && (e.key === "Enter" || e.key === " ")) skip();
      }}
      tabIndex={phase === "hold" ? 0 : undefined}
      role={phase === "hold" ? "button" : undefined}
      aria-label={phase === "hold" ? "Continue" : undefined}
      style={{
        position: "relative",
        height: "100%",
        outline: "none",
        cursor: phase === "hold" ? "pointer" : "default",
        ["--shell-intro-ease" as string]: `cubic-bezier(${preset.easing.join(",")})`,
      }}
    >
      <MenuHazeBackground />
      <Stack
        align="center"
        justify="center"
        gap="md"
        style={{ position: "relative", zIndex: 1, height: "100%", padding: "2rem" }}
      >
        <AnimatePresence mode="wait">
          {phase !== "exit" ? (
            <motion.div
              key="intro"
              initial={instant ? { opacity: 1, y: 0, z: 0 } : { opacity: 0, y: 16, z: 0 }}
              animate={{ opacity: 1, y: 0, z: 0 }}
              exit={
                instant
                  ? { opacity: 1, y: 0, z: 0, transition: { duration: 0 } }
                  : {
                      opacity: 0,
                      y: -12,
                      z: 0,
                      transition: { duration: preset.introFadeOut, ease: easing },
                    }
              }
              transition={instant ? { duration: 0 } : { duration: preset.introTitleDuration, ease: easing }}
              style={introShellStyle}
            >
              <Box mb="sm" className={`shell-intro-logo ${phase === "prompt" ? "shell-intro-logo--raised" : ""}`}>
                <VcLogoIntroMark
                  scale={1}
                  zoomDurationSec={logoZoomSec}
                  letterDrawSec={preset.introLogoLetterDrawSec}
                  easing={easing}
                />
              </Box>
              {phase === "prompt" ? (
                <motion.button
                  type="button"
                  className="shell-intro-entry"
                  onClick={enterClub}
                  initial={instant ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={instant ? { duration: 0 } : { duration: 0.55, ease: easing }}
                >
                  <Text component="span" fz={{ base: "1rem", sm: "1.15rem" }}>
                    Enter the Club
                  </Text>
                  <span className="shell-intro-entry__hint">Tap to step inside</span>
                </motion.button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
