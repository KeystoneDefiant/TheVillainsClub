import { Box, Center, Paper, Stack, Title, Text, Code } from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import { clubTokens } from "@/theme/clubTokens";

interface ErrorScreenProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorScreen({ error, resetErrorBoundary }: ErrorScreenProps) {
  return (
    <Center style={{ minHeight: "100vh", padding: "var(--mantine-spacing-md)" }}>
      <Paper
        p="xl"
        maw={520}
        w="100%"
        radius="md"
        style={{
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          backgroundColor: clubTokens.surface.panel,
        }}
      >
        <Stack gap="md" align="center">
          <Title order={3} ta="center" c={clubTokens.text.brass}>
            Something went wrong
          </Title>
          <Text size="sm" ta="center" c={clubTokens.text.secondary}>
            The minigame hit an unexpected error. You can try again, or return to the club.
          </Text>
          <Box
            p="sm"
            w="100%"
            style={{
              borderRadius: "var(--mantine-radius-sm)",
              backgroundColor: "rgba(0,0,0,0.35)",
              border: `1px solid ${clubTokens.surface.brassStroke}`,
            }}
          >
            <Code block style={{ color: clubTokens.text.muted, background: "transparent", fontSize: "0.75rem" }}>
              {error.message}
            </Code>
          </Box>
          <ClubButton variant="filled" onClick={resetErrorBoundary} fullWidth>
            Try again
          </ClubButton>
        </Stack>
      </Paper>
    </Center>
  );
}
