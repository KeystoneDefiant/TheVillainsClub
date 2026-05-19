import { Button } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import type { FailureStateType, GameState } from "../types";
import { LOGO_URL } from "../config/assets";
import { getFailureStateDescription } from "../utils/failureConditions";
import { UnifiedGameHeader } from "@/components/ui/UnifiedGameHeader";

interface GameHeaderProps {
  credits: number;
  round?: number;
  failureState?: FailureStateType;
  gameState?: GameState;
  hideFailureInHeader?: boolean;
  onShowPayoutTable?: () => void;
  onShowSettings?: () => void;
}

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

  const extraButtons = onShowPayoutTable ? (
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
  ) : null;

  return (
    <UnifiedGameHeader
      gameTitle="Oubliette No. 9"
      gameLogo={LOGO_URL}
      walletAmount={credits}
      currentRound={round}
      roundLabel="Round"
      onShowSettings={onShowSettings}
      failureMessage={!hideFailureInHeader ? failureDescription : null}
      extraButtons={extraButtons}
    />
  );
}
