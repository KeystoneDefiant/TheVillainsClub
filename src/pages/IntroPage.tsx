import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { VcLogoIntroMark } from "@/components/intro/VcLogoIntroMark";
import { VC_LOGO_GREY_LETTER_COUNT } from "@/components/intro/vcLogoIntroPaths";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubButton } from "@/components/ui/ClubButton";
import { useClubFlowStore } from "@/game/clubFlowStore";
import { useIntroToBarTransition } from "@/game/introToBarTransitionStore";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { useClubWallet } from "@/game/clubWalletStore";

import rawQuips from "../../content/quips.json";

export function IntroPage() {
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const setHasEnteredClub = useClubFlowStore((s) => s.setHasEnteredClub);
  const beginIntroToBar = useIntroToBarTransition((s) => s.begin);
  const [phase, setPhase] = useState<"enter" | "hold" | "prompt">("enter");
  const [skipped, setSkipped] = useState(false);
  const [variant] = useState<"A" | "B">(() => (Math.random() > 0.5 ? "A" : "B"));

  const entryMessage = useMemo(() => {
    try {
      const q = rawQuips as Record<string, unknown>;
      const messages = (q.entry_messaage || q.entry_message) as string[] | undefined;
      if (Array.isArray(messages) && messages.length > 0) {
        const idx = Math.floor(Math.random() * messages.length);
        return messages[idx];
      }
    } catch {
      // Fallback
    }
    return "You have been expected.";
  }, []);

  const greyCount = VC_LOGO_GREY_LETTER_COUNT;
  const greyRevealDelaySec = useMemo(
    () => preset.introRedDrawSec + preset.introRedNeonSec + preset.introRedGlowFadeSec,
    [preset.introRedDrawSec, preset.introRedNeonSec, preset.introRedGlowFadeSec],
  );
  const greySequenceSec = useMemo(
    () => greyCount * preset.introLogoLetterDrawSec + preset.introLogoSettleSec,
    [greyCount, preset.introLogoLetterDrawSec, preset.introLogoSettleSec],
  );
  const logoZoomSec = greySequenceSec;
  const enterToHoldMs = useMemo(
    () => Math.round((greyRevealDelaySec + greySequenceSec) * 1000) + (reduceMotion ? 0 : 80),
    [greyRevealDelaySec, greySequenceSec, reduceMotion],
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
    const dest = useClubWallet.getState().playerName ? "/bar" : "/onboarding";
    if (reduceMotion) {
      navigate(dest, { replace: true });
      return;
    }
    beginIntroToBar();
    navigate(dest, { replace: true });
  }, [navigate, reduceMotion, setHasEnteredClub, beginIntroToBar]);

  const easing = preset.easing;
  const instant = reduceMotion;

  const textVariants = {
    hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0.5 },
    visible: {
      clipPath: "inset(0 0% 0 0)",
      opacity: 1,
      transition: {
        duration: 1.4,
        ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.0,
        ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
        delay: 1.0,
      },
    },
  };

  const introShellStyle: CSSProperties = instant
    ? { textAlign: "center", maxWidth: 920, backfaceVisibility: "hidden", position: "relative" }
    : {
      textAlign: "center",
      maxWidth: 920,
      backfaceVisibility: "hidden",
      position: "relative",
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
          <motion.div
            key="intro"
            initial={instant ? { opacity: 1, y: 0, z: 0 } : { opacity: 0, y: 16, z: 0 }}
            animate={
              phase === "prompt"
                ? { opacity: 1, y: -90, z: 0 }
                : { opacity: 1, y: 0, z: 0 }
            }
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
            transition={
              instant
                ? { duration: 0 }
                : phase === "prompt"
                  ? { duration: 1.2, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] }
                  : { duration: preset.introTitleDuration, ease: easing }
            }
            style={introShellStyle}
          >
            <Box mb="sm" className="shell-intro-logo">
              {variant === "A" ? (
                <VcLogoIntroMark
                  scale={1}
                  zoomDurationSec={logoZoomSec}
                  letterDrawSec={preset.introLogoLetterDrawSec}
                  easing={easing}
                  greyRevealDelaySec={greyRevealDelaySec}
                  introRedDrawSec={preset.introRedDrawSec}
                  introRedNeonSec={preset.introRedNeonSec}
                  introRedGlowFadeSec={preset.introRedGlowFadeSec}
                />
              ) : (
                <motion.img
                  src={`${import.meta.env.BASE_URL || "/"}images/logos/VC Logo - Color.svg`}
                  alt="The Villains Club"
                  style={{ width: "100%", maxWidth: 600, height: "auto" }}
                  initial={{ opacity: 0, scale: 0.95, filter: "drop-shadow(0 0 0px rgba(214, 97, 102, 0))" }}
                  animate={
                    phase === "enter"
                      ? { opacity: 1, scale: 1, filter: "drop-shadow(0 0 15px rgba(214, 97, 102, 0.4))" }
                      : phase === "hold"
                        ? {
                          opacity: 1,
                          scale: [1, 1.02, 1],
                          filter: [
                            "drop-shadow(0 0 15px rgba(214, 97, 102, 0.4))",
                            "drop-shadow(0 0 30px rgba(214, 97, 102, 0.7))",
                            "drop-shadow(0 0 15px rgba(214, 97, 102, 0.4))",
                          ],
                        }
                        : { opacity: 1, scale: 1, filter: "drop-shadow(0 0 15px rgba(214, 97, 102, 0.4))" }
                  }
                  transition={
                    phase === "hold"
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 1.5, ease: easing }
                  }
                />
              )}
            </Box>
            {phase === "prompt" ? (
              <motion.div
                initial={instant ? "visible" : "hidden"}
                animate="visible"
                style={{
                  position: "absolute",
                  top: "calc(100% + 2.5rem)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1.5rem",
                  width: "100vw",
                }}
              >
                <motion.p
                  className="text-center"
                  variants={instant ? {} : textVariants}
                  style={{
                    margin: 0,
                    fontSize: "1.4rem",
                    color: "rgba(248, 231, 183, 0.9)",
                    letterSpacing: "0.08em",
                    fontFamily: "Cinzel, Georgia, Times New Roman, serif",
                    textShadow: "0 0 10px rgba(248, 231, 183, 0.3)",
                    fontWeight: 500,
                  }}
                >
                  {entryMessage}
                </motion.p>
                <motion.div variants={instant ? {} : buttonVariants}>
                  <ClubButton
                    onClick={enterClub}
                    size="lg"
                    style={{
                      minWidth: 200,
                    }}
                  >
                    Enter the Club
                  </ClubButton>
                </motion.div>
              </motion.div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
