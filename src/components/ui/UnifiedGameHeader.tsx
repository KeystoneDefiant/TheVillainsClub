import { ReactNode } from "react";
import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

export interface UnifiedGameHeaderProps {
  gameTitle: string;
  gameLogo?: string;
  walletAmount: number;
  currentRound?: number;
  roundLabel?: string; // e.g. "Round", "Spins", "Rolls", "Rituals". Defaults to "Round"
  onShowSettings?: () => void;
  failureMessage?: string | null;
  onAbandonRun?: () => void;
  extraButtons?: ReactNode;
}

const chipStyle = {
  background: `linear-gradient(145deg, ${clubTokens.surface.walnutHi} 0%, ${clubTokens.surface.panel} 100%)`,
  border: `1px solid ${clubTokens.surface.brassStroke}`,
  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
} as const;

export function UnifiedGameHeader({
  gameTitle,
  gameLogo,
  walletAmount,
  currentRound,
  roundLabel = "Round",
  onShowSettings,
  failureMessage,
  onAbandonRun,
  extraButtons,
}: UnifiedGameHeaderProps) {
  const defaultLogo = `${import.meta.env.BASE_URL || "/"}images/logos/VC Logo - Color.svg`;

  return (
    <Stack gap="xs" mb={{ base: "xs", sm: "sm" }} style={{ minWidth: 0, width: "100%" }}>
      <Group justify="space-between" align="center" gap="sm" wrap="wrap" style={{ width: "100%" }}>
        {/* Left Side: Logo & Stats */}
        <Group gap="xs" wrap="wrap" align="center" style={{ minWidth: 0, flex: "1 1 auto" }}>
          {/* Logo container */}
          <Box
            style={{
              ...chipStyle,
              borderRadius: "var(--mantine-radius-md)",
              padding: "0.35rem 0.5rem",
              height: 40,
              width: 52,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={gameLogo || defaultLogo}
              alt=""
              width={36}
              height={28}
              style={{ objectFit: "contain" }}
            />
          </Box>

          {/* Stats & Title chip */}
          <Group
            gap="sm"
            wrap="nowrap"
            px="xs"
            py={6}
            style={{
              ...chipStyle,
              borderRadius: "var(--mantine-radius-md)",
              minWidth: 0,
              flex: "0 1 auto",
            }}
          >
            <Title
              order={2}
              size="h5"
              c={clubTokens.text.brass}
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.95rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {gameTitle}
            </Title>
            <div style={{ width: 1, height: 14, backgroundColor: clubTokens.surface.brassStroke }} />
            <Text size="xs" fw={700} c={clubTokens.text.primary} style={{ whiteSpace: "nowrap" }}>
              <Text span c={clubTokens.text.brass} inherit>
                Credits: {walletAmount.toLocaleString()}
              </Text>
            </Text>
            {currentRound !== undefined ? (
              <>
                <div style={{ width: 1, height: 14, backgroundColor: clubTokens.surface.brassStroke }} />
                <Text size="xs" fw={700} c={clubTokens.text.primary} style={{ whiteSpace: "nowrap" }}>
                  <Text span c={clubTokens.text.brass} inherit>
                    {roundLabel}: {currentRound}
                  </Text>
                </Text>
              </>
            ) : null}
          </Group>
        </Group>

        {/* Right Side: Action buttons */}
        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0, marginLeft: "auto" }}>
          {onAbandonRun ? (
            <Button
              type="button"
              size="xs"
              variant="subtle"
              color="red"
              radius="md"
              h={36}
              px="xs"
              onClick={onAbandonRun}
              title="Abandon run"
              styles={{ root: { ...chipStyle, color: clubTokens.text.accent } }}
            >
              Abandon
            </Button>
          ) : null}
          {extraButtons}
          {onShowSettings ? (
            <Button
              type="button"
              size="xs"
              variant="default"
              radius="md"
              w={36}
              h={36}
              p={0}
              onClick={onShowSettings}
              title="Settings"
              aria-label="Open settings"
              styles={{ root: { ...chipStyle, minWidth: 36 } }}
            >
              ⚙️
            </Button>
          ) : null}
        </Group>
      </Group>

      {/* Warning/Failure Banner */}
      {failureMessage ? (
        <Box
          px="xs"
          py={6}
          style={{
            ...chipStyle,
            borderRadius: "var(--mantine-radius-md)",
            borderColor: `${clubTokens.text.accent}88`,
            background: "rgba(214, 97, 102, 0.12)",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <Text size="xs" fw={600} c={clubTokens.text.primary} lineClamp={4}>
            <Text span mr={4} c={clubTokens.text.accent} inherit>
              ⚠️
            </Text>
            {failureMessage}
          </Text>
        </Box>
      ) : null}
    </Stack>
  );
}
