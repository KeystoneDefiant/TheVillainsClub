import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Text } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { clubTokens } from "@/theme/clubTokens";
import { useMotionPresetStore } from "@/motion/motionPresetStore";

export function IntroPage() {
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("hold"), 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "hold" || skipped) return;
    const t = window.setTimeout(() => setPhase("exit"), 2200);
    return () => window.clearTimeout(t);
  }, [phase, skipped]);

  useEffect(() => {
    if (phase !== "exit") return;
    const t = window.setTimeout(() => navigate("/menu", { replace: true }), preset.introFadeOut * 1000 + 120);
    return () => window.clearTimeout(t);
  }, [phase, navigate, preset.introFadeOut]);

  const skip = () => {
    setSkipped(true);
    setPhase("exit");
  };

  const easing = preset.easing;

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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -12,
                transition: { duration: preset.introFadeOut, ease: easing },
              }}
              transition={{ duration: preset.introTitleDuration, ease: easing }}
              style={{ textAlign: "center", maxWidth: 920 }}
            >
              <ClubHeading order={1} size="h1" c={clubTokens.text.primary}>
                The Villains Club
              </ClubHeading>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: preset.introTaglineDelay,
                  duration: preset.introTaglineDuration,
                  ease: easing,
                }}
              >
                <Text mt="md" size="lg" c={clubTokens.text.secondary} style={{ fontStyle: "italic" }}>
                  A quiet room. A loaded deck. A tab that never forgets.
                </Text>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <Text mt="xl" size="sm" c={clubTokens.text.muted}>
                  Press anywhere to continue
                </Text>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
