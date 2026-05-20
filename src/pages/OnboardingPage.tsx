import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Stack, TextInput, Title, Text } from "@mantine/core";
import { useClubWallet } from "@/game/clubWalletStore";
import { clubTokens } from "@/theme/clubTokens";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";

export function OnboardingPage() {
  const navigate = useNavigate();
  const setPlayerName = useClubWallet((s) => s.setPlayerName);
  const [name, setName] = useState("");
  const reduceMotion = usePrefersReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setPlayerName(name.trim());
    navigate("/bar", { replace: true });
  };

  return (
    <Box
      style={{
        minHeight: "100dvh",
        background: `linear-gradient(to bottom, #2b0b10 0%, #0a0a0a 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container size="sm" w="100%">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <Stack align="center" gap="xl">
              <Stack gap="xs" align="center">
                <Title
                  order={1}
                  c={clubTokens.text.accent}
                  style={{
                    fontFamily: "Georgia, serif",
                    fontWeight: 400,
                    fontSize: "2.5rem",
                    letterSpacing: "0.05em",
                    textAlign: "center",
                  }}
                >
                  Welcome to The Villains Club.
                </Title>
                <Text
                  c={clubTokens.text.muted}
                  size="lg"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  By what name shall we call you?
                </Text>
              </Stack>

              <TextInput
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Your name..."
                size="lg"
                w="100%"
                maw={400}
                autoFocus
                styles={{
                  input: {
                    background: "rgba(0, 0, 0, 0.4)",
                    border: `1px solid ${clubTokens.surface.brassStroke}`,
                    color: clubTokens.text.primary,
                    fontFamily: "Georgia, serif",
                    textAlign: "center",
                    fontSize: "1.25rem",
                  },
                }}
              />

              <Button
                type="submit"
                size="lg"
                variant="filled"
                color="red"
                radius="md"
                disabled={!name.trim()}
                style={{
                  fontFamily: "Georgia, serif",
                  minWidth: 200,
                  background: clubTokens.text.accent,
                  color: "#fff",
                }}
              >
                Enter the Club
              </Button>
            </Stack>
          </form>
        </motion.div>
      </Container>
    </Box>
  );
}
