import { gameConfig } from '@/config/minigames/oublietteNo9GameRules';
import { GameOverReason, GameState } from '../types';
import { getFailureStateDescription } from './failureConditions';
import { formatCredits } from './format';

export interface GameOverDisplay {
  /** Main heading (e.g. "Game Over", "Run Complete!") */
  title: string;
  /** Subtitle explaining why the run ended */
  subtitle: string;
  /** Optional tip for the player */
  tip?: string;
  /** Whether this was a voluntary/successful end (vs forced failure) */
  isVoluntaryEnd: boolean;
}

export interface GameOverDisplayContext {
  minimumBet?: number;
  handCount?: number;
}

/**
 * Returns unified display content for the game over screen based on the reason.
 * Single source of truth for all game over messaging.
 */
export function getGameOverDisplay(
  reason: GameOverReason | null,
  state: GameState | null,
  context?: GameOverDisplayContext
): GameOverDisplay {
  const resolvedReason = reason ?? 'voluntary';

  const insufficientCreditsSubtitle =
    context?.minimumBet != null && context?.handCount != null
      ? getInsufficientCreditsSubtitle(context.minimumBet, context.handCount)
      : 'You cannot afford the minimum bet for the next round.';

  const config: Record<GameOverReason, Omit<GameOverDisplay, 'isVoluntaryEnd'>> = {
    voluntary: {
      title: 'Run Complete!',
      subtitle: 'You walked away from the table.',
      tip: getRandomGameOverQuip(),
    },
    'insufficient-credits': {
      title: 'Game Over',
      subtitle: insufficientCreditsSubtitle,
      tip: getRandomGameOverQuip(),
    },
    'minimum-bet-multiplier': {
      title: 'Game Over',
      subtitle: state
        ? getFailureStateDescription('minimum-bet-multiplier', state)
        : 'You did not meet the minimum bet requirement for the end game.',
      tip: getRandomGameOverQuip(),
    },
    'minimum-credit-efficiency': {
      title: 'Game Over',
      subtitle: state
        ? getFailureStateDescription('minimum-credit-efficiency', state)
        : 'Your credit efficiency fell below the end game requirement.',
      tip: getRandomGameOverQuip(),
    },
    'minimum-winning-hands': {
      title: 'Game Over',
      subtitle: state
        ? getFailureStateDescription('minimum-winning-hands', state)
        : 'You did not win enough hands to meet the end game requirement.',
      tip: getRandomGameOverQuip(),
    },
    'minimum-win-percent': {
      title: 'Game Over',
      subtitle: state
        ? getFailureStateDescription('minimum-win-percent', state)
        : 'You did not win the required percentage of hands for the end game.',
      tip: getRandomGameOverQuip(),
    },
  };

  const entry = config[resolvedReason];
  const isVoluntaryEnd = resolvedReason === 'voluntary';

  return {
    ...entry,
    isVoluntaryEnd,
  };
}

export function getRandomGameOverQuip(): string {
  const quips = gameConfig.quips.gameOver;
  return quips[Math.floor(Math.random() * quips.length)] ?? 'The table is not done with you yet.';
}

/**
 * Formats the insufficient-credits subtitle with actual values.
 */
function getInsufficientCreditsSubtitle(minimumBet: number, handCount: number): string {
  const required = minimumBet * handCount;
  return `You need at least ${formatCredits(required)} credits to play the next round (${formatCredits(minimumBet)} × ${handCount} hands).`;
}
