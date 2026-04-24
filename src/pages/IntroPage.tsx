import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Text } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { clubTokens } from "@/theme/clubTokens";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";

export function IntroPage() {
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setTimeout(() => setPhase("hold"), 1200);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase !== "hold" || skipped) return;
    const t = window.setTimeout(() => setPhase("exit"), 2200);
    return () => window.clearTimeout(t);
  }, [phase, skipped, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (phase !== "exit") return;
    const t = window.setTimeout(() => navigate("/menu", { replace: true }), preset.introFadeOut * 1000 + 120);
    return () => window.clearTimeout(t);
  }, [phase, navigate, preset.introFadeOut, reduceMotion]);

  useEffect(() => {
    if (!reduceMotion) return;
    const t = window.setTimeout(() => navigate("/menu", { replace: true }), 650);
    return () => window.clearTimeout(t);
  }, [reduceMotion, navigate]);

  const skip = useCallback(() => {
    setSkipped(true);
    setPhase("exit");
    if (reduceMotion) {
      navigate("/menu", { replace: true });
    }
  }, [navigate, reduceMotion]);

  const easing = preset.easing;
  const instant = reduceMotion;

  const introShellStyle: CSSProperties = instant
    ? { textAlign: "center", maxWidth: 920, backfaceVisibility: "hidden" }
    : {
        textAlign: "center",
        maxWidth: 920,
        backfaceVisibility: "hidden",
        ["--shell-intro-tag-dur" as string]: `${preset.introTaglineDuration}s`,
        ["--shell-intro-tag-delay" as string]: `${preset.introTaglineDelay}s`,
        ["--shell-intro-hint-dur" as string]: "0.6s",
        ["--shell-intro-hint-delay" as string]: "1.1s",
        ["--shell-intro-ease" as string]: `cubic-bezier(${preset.easing.join(",")})`,
      };

  return (
    <Box
      onPointerDown={skip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") skip();
      }}
      tabIndex={0}
      role="button"
      aria-label="Continue"
      style={{
        position: "relative",
        height: "100%",
        outline: "none",
        cursor: "pointer",
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
              <ClubHeading order={1} size="h1" c={clubTokens.text.primary}>
                The Villains Club
              </ClubHeading>
              <Box className={instant ? undefined : "shell-intro-tagline"}>
                <Text mt="md" size="lg" c={clubTokens.text.secondary} style={{ fontStyle: "italic" }}>
                  A quiet room. A loaded deck. A tab that never forgets.
                </Text>
              </Box>
              <Box className={instant ? undefined : "shell-intro-hint"}>
                <Text mt="xl" size="sm" c={clubTokens.text.muted}>
                  {reduceMotion ? "Continuing…" : "Press anywhere to continue"}
                </Text>
              </Box>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
