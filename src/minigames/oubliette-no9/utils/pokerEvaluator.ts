import { PokerEvaluator as SharedPokerEvaluator } from '@/game/poker/pokerEvaluator';
import { Card, HandResult } from '../types';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

export class PokerEvaluator {
  /**
   * Evaluates a 5-card hand and returns the hand result
   */
  static evaluate(hand: Card[], opts?: { minimumPairRank?: number }): HandResult {
    const minimumPairRank = opts?.minimumPairRank ?? getCurrentGameMode().minimumPairRank;
    // Cast Card[] to SharedCard[] since they have matching shapes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return SharedPokerEvaluator.evaluate(hand as any, { minimumPairRank }) as any;
  }

  /**
   * Applies reward table multipliers to hand results
   */
  static applyRewards(result: HandResult, rewardTable: { [key: string]: number }): HandResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return SharedPokerEvaluator.applyRewards(result as any, rewardTable) as any;
  }
}
