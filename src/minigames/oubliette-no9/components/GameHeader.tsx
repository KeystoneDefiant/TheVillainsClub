import { ClubButton } from "@/components/ui/ClubButton";
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
  onAbandonRun?: () => void;
  extraButtons?: React.ReactNode;
}

export function GameHeader({
  credits,
  round,
  failureState,
  gameState,
  hideFailureInHeader,
  onShowPayoutTable,
  onShowSettings,
  onAbandonRun,
  extraButtons,
}: GameHeaderProps) {
  const failureDescription =
    failureState && gameState ? getFailureStateDescription(failureState, gameState) : null;

  const defaultExtraButtons = onShowPayoutTable ? (
    <ClubButton
      type="button"
      size="xs"
      variant="filled"
      radius="md"
      px="xs"
      onClick={onShowPayoutTable}
      title="Show payout table"
      styles={{ label: { fontWeight: 700 } }}
    >
      💰
    </ClubButton>
  ) : null;

  const combinedExtraButtons = (
    <>
      {extraButtons}
      {defaultExtraButtons}
    </>
  );

  return (
    <UnifiedGameHeader
      gameTitle="Oubliette No. 9"
      gameLogo={LOGO_URL}
      walletAmount={credits}
      currentRound={round}
      roundLabel="Round"
      onShowSettings={onShowSettings}
      onAbandonRun={onAbandonRun}
      failureMessage={!hideFailureInHeader ? failureDescription : null}
      extraButtons={combinedExtraButtons}
    />
  );
}
