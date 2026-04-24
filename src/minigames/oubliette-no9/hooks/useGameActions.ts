import { useCallback } from 'react';
import { GameState, Card } from '../types';
import { createFullDeck, shuffleDeck, removeCardsFromDeck } from '../utils/deck';
import { generateParallelHands } from '../utils/parallelHands';
import { findBestDevilsDealCards } from '../utils/devilsDeal';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';
import { PokerEvaluator } from '../utils/pokerEvaluator';

/**
 * Hook for game play actions (deal, hold, draw)
 * Provides functions for core gameplay mechanics
 *
 * @param _state - Current game state (unused, for future use)
 * @param setState - React state setter function
 * @returns Object containing game action functions
 *
 * @example
 * ```tsx
 * const gameActions = useGameActions(state, setState);
 * gameActions.dealHand();
 * gameActions.toggleHold(0);
 * gameActions.drawParallelHands();
 * ```
 */
export function useGameActions(
  _state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>
) {
  /**
   * Deal a new hand to the player
   * Deducts bet amount and sets up initial game state
   */
  const dealHand = useCallback(() => {
    setState((prev) => {
      const totalBet = prev.betAmount * prev.selectedHandCount;

      // Check if player can afford the bet
      if (prev.credits < totalBet) {
        return prev;
      }

      const currentMode = getCurrentGameMode();
      const maxHandSize = (currentMode as { maxHandSize?: number }).maxHandSize ?? 5 + ((currentMode.shop?.extraCardInHand as { maxPurchases?: number })?.maxPurchases ?? 3);
      const handSize = Math.min(maxHandSize, 5 + (prev.extraCardsInHand ?? 0));
      const deck = shuffleDeck(
        createFullDeck(
          prev.deckModifications.deadCards,
          prev.deckModifications.removedCards,
          prev.deckModifications.wildCards
        )
      );
      const newHand: Card[] = deck.slice(0, handSize);

      // Check for Devil's Deal
      const devilsDealConfig = currentMode.devilsDeal;
      let devilsDealCard: Card | null = null;
      let devilsDealCost = 0;

      if (devilsDealConfig) {
        // Calculate effective chance
        const effectiveChance =
          devilsDealConfig.baseChance +
          prev.devilsDealChancePurchases * devilsDealConfig.chanceIncreasePerPurchase;
        const roll = Math.random() * 100;

        if (roll < effectiveChance) {
          // Get available deck (full deck minus playerHand)
          const fullDeck = createFullDeck(
            prev.deckModifications.deadCards,
            prev.deckModifications.removedCards,
            prev.deckModifications.wildCards
          );
          const availableDeck = removeCardsFromDeck(fullDeck, newHand);

          // Devil's Deal considers first 5 cards only (same as standard hand)
          const handForDeal = newHand.slice(0, 5);
          const bestCards = findBestDevilsDealCards(
            handForDeal,
            availableDeck,
            prev.rewardTable,
            prev.betAmount
          );

          // Randomly select one from top 3
          if (bestCards.length > 0) {
            const selectedCard = bestCards[Math.floor(Math.random() * bestCards.length)];

            // Calculate best possible hand's payout (per hand) using first 5 cards only
            const currentBetAmount = prev.betAmount;
            let bestMultiplier = 0;
            let bestRank = 'high-card';
            for (let position = 0; position < 5; position++) {
              const testHand = [...handForDeal];
              testHand[position] = selectedCard;
              const result = PokerEvaluator.evaluate(testHand);
              const withRewards = PokerEvaluator.applyRewards(result, prev.rewardTable);
              if (withRewards.multiplier > bestMultiplier) {
                bestMultiplier = withRewards.multiplier;
                bestRank = result.rank;
              } else if (withRewards.multiplier === bestMultiplier && result.rank !== 'high-card') {
                bestRank = result.rank;
              }
            }

            // When card creates a pair or better that doesn't pay (Jacks or Better),
            // use minimum multiplier 1 for cost so Devil's Deal isn't free
            const effectiveMultiplier =
              bestMultiplier > 0 ? bestMultiplier : bestRank !== 'high-card' ? 1 : 0;

            // Calculate best possible hand's payout per hand
            // Formula: multiplier * betAmount
            const bestPossibleHandPayoutPerHand = effectiveMultiplier * currentBetAmount;

            // Calculate cost: (best possible hand's payout * total number of hands) * percentage
            // Formula: (multiplier * betAmount * selectedHandCount) * (costPercent / 100)
            const costPercent =
              devilsDealConfig.baseCostPercent -
              prev.devilsDealCostReductionPurchases * devilsDealConfig.costReductionPerPurchase;
            // Ensure cost is always positive (minimum 1%)
            const finalCostPercent = Math.max(1, costPercent);
            // Cost = (best possible hand's payout per hand * number of hands) * percentage
            // Round to avoid decimals
            devilsDealCost = Math.round(
              (bestPossibleHandPayoutPerHand * prev.selectedHandCount * finalCostPercent) / 100
            );
            devilsDealCard = selectedCard;
          }
        }
      }

      return {
        ...prev,
        playerHand: newHand,
        heldIndices: [],
        parallelHands: [],
        additionalHandsBought: 0,
        credits: prev.credits - totalBet,
        screen: 'game',
        gamePhase: 'playing',
        maxDraws: Math.max(1, (currentMode as { maxDraws?: number }).maxDraws ?? 1) + (prev.extraDrawPurchased ? 1 : 0),
        drawsCompletedThisRound: 0,
        selectedHandCount: prev.selectedHandCount || prev.handCount,
        devilsDealCard,
        devilsDealCost,
        devilsDealHeld: false,
      };
    });
  }, [setState]);

  /**
   * Toggle hold status of a card at the specified index
   * Enforces 5-card limit (including Devil's Deal card)
   * @param index - Card index (0-4) to toggle hold status
   */
  const toggleHold = useCallback(
    (index: number) => {
      setState((prev) => {
        const isCurrentlyHeld = prev.heldIndices.includes(index);
        const handSize = prev.playerHand.length;

        // When we have more than 5 cards (e.g. 6), we can hold at most 5 (pick 5 to keep)
        if (handSize > 5) {
          if (isCurrentlyHeld) {
            const heldIndices = prev.heldIndices.filter((i) => i !== index);
            return { ...prev, heldIndices };
          }
          if (prev.heldIndices.length >= 5) {
            // Replace oldest held with this index so we keep exactly 5
            const heldIndices = [...prev.heldIndices.slice(1), index];
            return { ...prev, heldIndices };
          }
          const heldIndices = [...prev.heldIndices, index];
          return { ...prev, heldIndices };
        }

        // Standard 5-card hand: check 5-card limit (including Devil's Deal)
        if (!isCurrentlyHeld) {
          const totalHeld = prev.heldIndices.length + (prev.devilsDealHeld ? 1 : 0);
          if (totalHeld >= 5) {
            return prev;
          }
        }

        const heldIndices = isCurrentlyHeld
          ? prev.heldIndices.filter((i) => i !== index)
          : [...prev.heldIndices, index];

        return { ...prev, heldIndices };
      });
    },
    [setState]
  );

  /**
   * One draw step: replace non-held cards with new cards from deck, then either
   * stay in playing (if draws left) or generate parallel hands and go to animation.
   * Works for any hand size (5–8). Draw count is driven by maxDraws vs drawsCompletedThisRound.
   */
  const drawParallelHands = useCallback(() => {
    setState((prev) => {
      const handSize = prev.playerHand.length;
      if (handSize < 5 || prev.parallelHands.length > 0) {
        return prev;
      }

      const maxDraws = prev.maxDraws ?? 1;
      const fullDeck = createFullDeck(
        prev.deckModifications.deadCards,
        prev.deckModifications.removedCards,
        prev.deckModifications.wildCards
      );

      // When maxDraws === 1 we don't replace cards; go straight to generate from current hand
      let updatedHand = prev.playerHand;
      let drawsCompletedThisRound = prev.drawsCompletedThisRound ?? 0;

      if (maxDraws >= 2) {
        // One draw step: replace non-held cards with new cards (deck = full deck minus current hand)
        drawsCompletedThisRound += 1;
        const deckWithoutHand = removeCardsFromDeck(fullDeck, prev.playerHand);
        const shuffled = shuffleDeck(deckWithoutHand);
        const needCount = handSize - prev.heldIndices.length;
        const drawn = shuffled.slice(0, needCount);
        updatedHand = [...prev.playerHand];
        let drawIndex = 0;
        for (let i = 0; i < handSize; i++) {
          if (!prev.heldIndices.includes(i)) {
            updatedHand[i] = drawn[drawIndex++];
          }
        }
      }

      // If we have more draws left (only when maxDraws >= 2), stay in playing phase
      if (maxDraws >= 2 && drawsCompletedThisRound < maxDraws) {
        return {
          ...prev,
          playerHand: updatedHand,
          drawsCompletedThisRound,
        };
      }

      // All draws used (or single draw): build 5-card hand and generate parallel hands
      let baseHand: Card[];
      let baseHeldIndices: number[];
      if (updatedHand.length === 5) {
        baseHand = [...updatedHand];
        baseHeldIndices = [...prev.heldIndices];
      } else {
        const heldCards = prev.heldIndices.map((i) => updatedHand[i]);
        const needFromDeck = 5 - heldCards.length;
        const deckWithoutUpdated = removeCardsFromDeck(fullDeck, updatedHand);
        const shuffled2 = shuffleDeck(deckWithoutUpdated);
        const fill = shuffled2.slice(0, needFromDeck);
        baseHand = [...heldCards, ...fill];
        baseHeldIndices = heldCards.length > 0 ? Array.from({ length: heldCards.length }, (_, i) => i) : [];
      }

      let finalHand = baseHand;
      let finalHeldIndices = [...baseHeldIndices];
      let creditsAfterDeal = prev.credits;
      if (prev.devilsDealHeld && prev.devilsDealCard) {
        const modifiedHand = [...baseHand];
        for (let i = 0; i < 5; i++) {
          if (!baseHeldIndices.includes(i)) {
            modifiedHand[i] = prev.devilsDealCard!;
            finalHeldIndices = [...baseHeldIndices, i];
            break;
          }
        }
        finalHand = modifiedHand;
        creditsAfterDeal = prev.credits - prev.devilsDealCost;
      }

      const parallelHands = generateParallelHands(
        finalHand,
        finalHeldIndices,
        prev.selectedHandCount,
        prev.deckModifications.deadCards,
        prev.deckModifications.removedCards,
        prev.deckModifications.wildCards
      );

      return {
        ...prev,
        playerHand: finalHand,
        heldIndices: finalHeldIndices,
        parallelHands,
        credits: creditsAfterDeal,
        gamePhase: 'parallelHandsAnimation',
        drawsCompletedThisRound: 0,
      };
    });
  }, [setState]);

  return {
    dealHand,
    toggleHold,
    drawParallelHands,
  };
}
