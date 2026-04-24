import { Center, Loader, Stack, Text } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
}

const loaderSize = {
  small: "sm" as const,
  medium: "md" as const,
  large: "xl" as const,
};

export function LoadingSpinner({
  message = "Loading...",
  size = "medium",
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <Center
      style={{
        minHeight: fullScreen ? "100dvh" : undefined,
        padding: fullScreen ? "clamp(1rem, 4vw, 2rem)" : "2rem",
        background: fullScreen
          ? `linear-gradient(180deg, ${clubTokens.surface.deepWalnut} 0%, ${clubTokens.surface.walnut} 100%)`
          : undefined,
      }}
    >
      <Stack align="center" gap="md">
        <Loader size={loaderSize[size]} color="yellow" type="oval" />
        {message ? (
          <Text size="sm" c={clubTokens.text.muted} ta="center">
            {message}
          </Text>
        ) : null}
      </Stack>
    </Center>
  );
}
