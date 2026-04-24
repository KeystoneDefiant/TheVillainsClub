import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import type { FailureStateType, GameState } from "../types";
import { LOGO_URL } from "../config/assets";
import { getFailureStateDescription } from "../utils/failureConditions";
import { formatCredits } from "../utils/format";

interface GameHeaderProps {
  credits: number;
  round?: number;
  failureState?: FailureStateType;
  gameState?: GameState;
  hideFailureInHeader?: boolean;
  onShowPayoutTable?: () => void;
  onShowSettings?: () => void;
}

const chipStyle = {
  background: `linear-gradient(145deg, ${clubTokens.surface.walnutHi} 0%, ${clubTokens.surface.panel} 100%)`,
  border: `1px solid ${clubTokens.surface.brassStroke}`,
  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
} as const;

export function GameHeader({
  credits,
  round,
  failureState,
  gameState,
  hideFailureInHeader,
  onShowPayoutTable,
  onShowSettings,
}: GameHeaderProps) {
  const failureDescription =
    failureState && gameState ? getFailureStateDescription(failureState, gameState) : null;

  return (
    <Stack gap="xs" mb={{ base: "sm", sm: "md" }} style={{ minWidth: 0, width: "100%" }}>
      <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap" style={{ width: "100%" }}>
        <Group gap="xs" wrap="wrap" align="center" style={{ minWidth: 0, flex: "1 1 220px" }}>
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
            <img src={LOGO_URL} alt="" width={36} height={28} style={{ objectFit: "contain" }} />
          </Box>

          <Group
            gap="sm"
            wrap="wrap"
            px="xs"
            py={6}
            style={{
              ...chipStyle,
              borderRadius: "var(--mantine-radius-md)",
              minWidth: 0,
              flex: "1 1 160px",
            }}
          >
            <Text size="xs" fw={700} c={clubTokens.text.primary} style={{ whiteSpace: "nowrap" }}>
              <Text span c={clubTokens.text.brass} inherit>
                Credits: {formatCredits(credits)}
              </Text>
            </Text>
            {round !== undefined ? (
              <Text size="xs" fw={700} c={clubTokens.text.primary} style={{ whiteSpace: "nowrap" }}>
                <Text span c={clubTokens.text.brass} inherit>
                  Round: {round}
                </Text>
              </Text>
            ) : null}
          </Group>
        </Group>

        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0, marginLeft: "auto" }}>
          {onShowPayoutTable ? (
            <Button
              type="button"
              size="xs"
              variant="filled"
              color="yellow"
              radius="md"
              px="xs"
              onClick={onShowPayoutTable}
              title="Show payout table"
              styles={{ label: { fontWeight: 700, color: clubTokens.surface.deepWalnut } }}
            >
              💰
            </Button>
          ) : null}
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

      {!hideFailureInHeader && failureState && failureDescription ? (
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
            {failureDescription}
          </Text>
        </Box>
      ) : null}
    </Stack>
  );
}
