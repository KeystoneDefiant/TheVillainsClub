import { Box, Image, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { GameButton } from "./GameButton";
import { LOGO_URL } from "../config/assets";

interface MainMenuProps {
  onStartRun: () => void;
  onTutorial: () => void;
  onCredits: () => void;
  onSettings: () => void;
}

export function MainMenu({ onStartRun, onTutorial, onCredits, onSettings }: MainMenuProps) {
  return (
    <Box
      component="main"
      id="mainMenu-screen"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px))",
        background: `linear-gradient(180deg, ${clubTokens.surface.deepWalnut} 0%, ${clubTokens.surface.walnut} 45%, ${clubTokens.surface.walnutHi} 100%)`,
      }}
    >
      <Box style={{ flexShrink: 0, marginBottom: "clamp(1rem, 3vw, 2.5rem)" }}>
        <Image
          src={LOGO_URL}
          alt="Oubliette Number 9"
          w={{ base: 128, sm: 160, md: 192 }}
          maw="90vw"
          fit="contain"
        />
      </Box>

      <Stack
        gap="lg"
        maw={440}
        w="100%"
        justify="center"
        p={{ base: "lg", sm: "xl" }}
        style={{
          flex: 1,
          borderRadius: "var(--mantine-radius-xl)",
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          backgroundColor: clubTokens.surface.panel,
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Title
          order={1}
          ta="center"
          fz={{ base: "1.5rem", sm: "1.75rem", md: "2rem" }}
          c={clubTokens.text.brass}
          fw={700}
        >
          Oubliette Number 9
        </Title>

        <Stack gap="sm">
          <GameButton onClick={onStartRun} variant="primary" size="lg" fullWidth>
            Start Run
          </GameButton>
          <GameButton onClick={onTutorial} variant="ghost" size="lg" fullWidth>
            How to Play
          </GameButton>
          <GameButton onClick={onCredits} variant="ghost" size="md" fullWidth>
            Credits
          </GameButton>
          <GameButton onClick={onSettings} variant="ghost" size="md" fullWidth>
            Settings
          </GameButton>
        </Stack>

        <Text ta="center" size="sm" c={clubTokens.text.muted}>
          It&apos;s video poker. But not.
        </Text>
      </Stack>
    </Box>
  );
}
