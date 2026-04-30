import { useState, useCallback, useRef, startTransition } from "react";
import type { OublietteShellBinding } from "@/game/sessionSettlement";
import { computeOublietteReturn } from "@/game/sessionSettlement";
import { GameState, GameOverReason, HandRank, Card } from "../types";
import { createFullDeck, shuffleDeck } from "../utils/deck";
import { selectShopOptionsByRarity } from "../utils/shopSelection";
import { getCurrentGameMode, getShopModeForCredits } from "@/config/minigames/oublietteNo9GameRules";
import { useGameActions } from "./useGameActions";
import { useShopActions } from "./useShopActions";
import { checkFailureConditions } from "../utils/failureConditions";
import { PokerEvaluator } from "../utils/pokerEvaluator";
import { calculateStreakMultiplier } from "../utils/streakCalculator";
import { useThemeAudio } from "../hooks/useThemeAudio";
import { parseAnimationSettings } from "../utils/typeGuards";
import { getStoredCardTheme, setStoredCardTheme } from "@/ui/cards/cardThemes";

const currentMode = getCurrentGameMode();

export type { OublietteShellBinding } from "@/game/sessionSettlement";

const DEFAULT_ANIMATION_SPEED: GameState['animationSpeedMode'] = 1;

// Load animation settings from localStorage if available
function loadAnimationSettings(): GameState['animationSpeedMode'] {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('animationSettings') : null;
  const parsed = parseAnimationSettings(stored);
  return parsed?.animationSpeedMode ?? DEFAULT_ANIMATION_SPEED;
}

function createInitialState(shell?: OublietteShellBinding | null): GameState {
  const savedState = shell?.savedState;
  const initialState: GameState = {
    screen: shell ? "game" : "menu",
    gamePhase: "preDraw",
    isGeneratingHands: false,
    playerHand: [],
    heldIndices: [],
    parallelHands: [],
    handCount: currentMode.startingHandCount,
    rewardTable: currentMode.rewards,
    credits: shell ? shell.sessionCredits : currentMode.startingCredits,
    currentRun: 0,
    additionalHandsBought: 0,
    betAmount: currentMode.startingBet,
    selectedHandCount: currentMode.startingHandCount,
    minimumBet: currentMode.startingBet,
    baseMinimumBet: currentMode.startingBet,
    round: 1,
    totalEarnings: 0,
    deckModifications: {
      deadCards: [],
      wildCards: [],
      removedCards: [],
      deadCardRemovalCount: 0,
    },
    extraDrawPurchased: false,
    maxDraws: 1,
    drawsCompletedThisRound: 0,
    wildCardCount: 0,
    gameOver: false,
    gameOverReason: null,
    showShopNextRound: false,
    selectedShopOptions: [],
    creditsAtShopOpen: null,
    prevRoundMinimumBet: null,
    shopDisplayBetAmount: null,
    isEndlessMode: false,
    currentFailureState: null,
    winningHandsLastRound: 0,
    devilsDealCard: null,
    devilsDealCost: 0,
    devilsDealHeld: false,
    devilsDealChancePurchases: 0,
    devilsDealCostReductionPurchases: 0,
    extraCardsInHand: 0,
    streakCounter: 0,
    currentStreakMultiplier: 1.0,
    runHighestCombo: 0,
    runHighestMultiplier: 1.0,
    animationSpeedMode: loadAnimationSettings(),
    cardTheme: getStoredCardTheme(),
  };
  return {
    ...initialState,
    ...savedState,
    screen: shell ? "game" : "menu",
    gamePhase: "preDraw",
    showShopNextRound: false,
    playerHand: [],
    heldIndices: [],
    parallelHands: [],
    isGeneratingHands: false,
    gameOver: false,
    gameOverReason: null,
    animationSpeedMode: savedState?.animationSpeedMode ?? initialState.animationSpeedMode,
    cardTheme: savedState?.cardTheme ?? initialState.cardTheme,
  };
}

export function useGameState(shellBinding?: OublietteShellBinding | null) {
  const shellRef = useRef(shellBinding);
  shellRef.current = shellBinding;

  const [state, setState] = useState<GameState>(() => createInitialState(shellBinding ?? null));

  // Use specialized hooks for different action types
  const gameActions = useGameActions(state, setState);
  const shopActions = useShopActions(state, setState);
  const { playSound, resetRoundSoundCounts } = useThemeAudio();

  const openShop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      screen: 'shop',
    }));
  }, []);

  const closeShop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      screen: 'game',
    }));
  }, []);

  const upgradeRewardTable = useCallback((rank: HandRank, cost: number) => {
    setState((prev) => {
      if (prev.credits < cost) {
        return prev;
      }
      return {
        ...prev,
        rewardTable: {
          ...prev.rewardTable,
          [rank]: (prev.rewardTable[rank] || 0) + 1,
        },
        credits: prev.credits - cost,
      };
    });
  }, []);

  const returnToMenu = useCallback(() => {
    startTransition(() => {
      setState((prev) => {
        const shell = shellRef.current;
        if (shell?.onReturnToClubMenu && shell.settlement) {
          const detail = computeOublietteReturn(prev.credits, shell.settlement);
          shell.onReturnToClubMenu({ ...detail, tableRound: prev.round });
        }
        return createInitialState(shellRef.current ?? null);
      });
    });
  }, []);

  const returnToPreDraw = useCallback((payout: number = 0) => {
    resetRoundSoundCounts();
    setState((prev) => {
      // Count winning hands from last round (hands with payout > 0)
      const winningHandsCount = prev.parallelHands.reduce((count, hand) => {
        const result = PokerEvaluator.evaluate(hand.cards);
        const withRewards = PokerEvaluator.applyRewards(result, prev.rewardTable);
        const handPayout = prev.betAmount * withRewards.multiplier;
        return handPayout > 0 ? count + 1 : count;
      }, 0);

      playSound('returnToPreDraw');

      // Add payout to credits and total earnings
      const newCredits = prev.credits + payout;
      const newTotalEarnings = prev.totalEarnings + payout;

      // Increment round
      const newRound = prev.round + 1;

      // Check if we should enter endless mode (at or above startRound)
      const endlessConfig = currentMode.endlessMode;
      const shouldEnterEndlessMode =
        endlessConfig && newRound >= endlessConfig.startRound && !prev.isEndlessMode;

      // Update minimum bet - only increase every X rounds (based on minimumBetIncreaseInterval)
      let newMinimumBet = prev.minimumBet;
      let newBaseMinimumBet = prev.baseMinimumBet;

      if (shouldEnterEndlessMode) {
        // When entering endless mode, set base minimum bet to current minimum bet
        newBaseMinimumBet = prev.minimumBet;
      }

      // Increase minimum bet every X rounds based on minimumBetIncreaseInterval and minimumBetIncreasePercent
      const shouldIncreaseMinBet =
        newRound % currentMode.minimumBetIncreaseInterval === 0;
      if (shouldIncreaseMinBet) {
        const minBetMultiplier = 1 + currentMode.minimumBetIncreasePercent / 100;
        newMinimumBet = Math.floor(prev.minimumBet * minBetMultiplier);
      }

      // Ensure bet is at least minimum bet
      let adjustedBet = Math.max(newMinimumBet, prev.betAmount);
      let adjustedHandCount = prev.selectedHandCount;
      let gameOver = false;
      let currentFailureState = prev.currentFailureState;

      // Check if player can still afford their previous bet/hand count
      const previousTotalCost = adjustedBet * adjustedHandCount;
      const canAffordPrevious = newCredits >= previousTotalCost;

      // Only adjust if player can't afford their previous bet/hand count
      if (!canAffordPrevious) {
        // Auto-adjust bet and hand count if player can't afford current bet
        // Step 1: Try reducing bet size until affordable (but not below minimum)
        const maxAffordableBet = Math.floor(newCredits / adjustedHandCount);
        if (maxAffordableBet >= newMinimumBet) {
          // Can afford by reducing bet (bet will be >= minimum)
          adjustedBet = maxAffordableBet;
        } else {
          // Step 2: Bet reached minimum bet, try reducing hand count
          adjustedBet = newMinimumBet;
          adjustedHandCount = Math.max(1, Math.floor(newCredits / adjustedBet));
          adjustedHandCount = Math.min(prev.handCount, adjustedHandCount);
        }
      }

      // Step 3: If still can't afford, trigger game over
      let gameOverReason: GameOverReason | null = null;
      if (newCredits < adjustedBet * adjustedHandCount) {
        gameOver = true;
        gameOverReason = 'insufficient-credits';
      }

      // Check if we're in endless mode (or should enter it)
      const isEndlessMode = shouldEnterEndlessMode || prev.isEndlessMode;

      // If in endless mode, check failure conditions
      if (isEndlessMode && !gameOver) {
        // Create temporary state for failure condition checking
        const tempState: GameState = {
          ...prev,
          round: newRound,
          credits: newCredits,
          totalEarnings: newTotalEarnings,
          minimumBet: newMinimumBet,
          baseMinimumBet: newBaseMinimumBet,
          betAmount: adjustedBet,
          winningHandsLastRound: winningHandsCount,
          isEndlessMode: true,
        };

        currentFailureState = checkFailureConditions(tempState);

        // If a failure condition is active, trigger game over
        if (currentFailureState !== null) {
          gameOver = true;
          gameOverReason = currentFailureState;
        }
      }

      // Check if shop should appear next round and generate options if so
      const showShopNextRound = newRound % currentMode.shopFrequency === 0;
      const selectedShopOptions = showShopNextRound
        ? selectShopOptionsByRarity(getShopModeForCredits(newCredits))
        : [];

      return {
        ...prev,
        gamePhase: 'preDraw',
        playerHand: [],
        heldIndices: [],
        parallelHands: [],
        drawsCompletedThisRound: 0,
        devilsDealCard: null,
        devilsDealCost: 0,
        devilsDealHeld: false,
        round: newRound,
        minimumBet: newMinimumBet,
        baseMinimumBet: newBaseMinimumBet,
        credits: newCredits,
        totalEarnings: newTotalEarnings,
        betAmount: adjustedBet,
        selectedHandCount: adjustedHandCount,
        gameOver,
        gameOverReason,
        showShopNextRound,
        selectedShopOptions,
        creditsAtShopOpen: showShopNextRound ? newCredits : null,
        prevRoundMinimumBet: showShopNextRound ? prev.minimumBet : null,
        shopDisplayBetAmount: showShopNextRound ? prev.betAmount : null,
        isEndlessMode,
        currentFailureState,
        winningHandsLastRound: winningHandsCount,
        streakCounter: 0, // Reset streak counter at the start of each round
        currentStreakMultiplier: 1.0, // Reset multiplier at the start of each round
      };
    });
  }, [playSound, resetRoundSoundCounts]);

  const startNewRun = useCallback(() => {
    setState((prev) => ({
      ...prev,
      screen: 'game',
      gamePhase: 'preDraw',
      playerHand: [],
      heldIndices: [],
      parallelHands: [],
      additionalHandsBought: 0,
      currentRun: prev.currentRun + 1,
      betAmount: currentMode.startingBet,
      selectedHandCount: prev.handCount,
      minimumBet: currentMode.startingBet,
      baseMinimumBet: currentMode.startingBet,
      round: 1,
      totalEarnings: 0,
      gameOver: false,
      maxDraws: 1,
      drawsCompletedThisRound: 0,
      showShopNextRound: false,
      selectedShopOptions: [],
      creditsAtShopOpen: null,
      shopDisplayBetAmount: null,
      isEndlessMode: false,
      currentFailureState: null,
      gameOverReason: null,
      winningHandsLastRound: 0,
      devilsDealCard: null,
      devilsDealCost: 0,
      devilsDealHeld: false,
      devilsDealChancePurchases: 0,
      devilsDealCostReductionPurchases: 0,
      extraCardsInHand: 0,
      streakCounter: 0,
      currentStreakMultiplier: 1.0,
      runHighestCombo: 0,
      runHighestMultiplier: 1.0,
    }));
  }, []);

  /**
   * End the current run and show game over summary screen.
   * Preserves stats (round, totalEarnings, credits) for display.
   * @param reason - Why the run ended; if omitted, uses state.gameOverReason or 'voluntary'
   */
  const endRun = useCallback((reason?: GameOverReason) => {
    setState((prev) => ({
      ...prev,
      screen: 'gameOver',
      gamePhase: 'preDraw',
      gameOver: true,
      gameOverReason: reason ?? prev.gameOverReason ?? 'voluntary',
      playerHand: [],
      heldIndices: [],
      parallelHands: [],
      additionalHandsBought: 0,
      drawsCompletedThisRound: 0,
      showShopNextRound: false,
      selectedShopOptions: [],
      creditsAtShopOpen: null,
      prevRoundMinimumBet: null,
      shopDisplayBetAmount: null,
    }));
  }, []);

  const buyAnotherHand = useCallback(() => {
    setState((prev) => {
      if (prev.playerHand.length !== 5 || prev.parallelHands.length === 0) {
        return prev;
      }

      // Calculate cost: parallelHands.length * (additionalHandsBought % 10)
      const cost = prev.parallelHands.length * (prev.additionalHandsBought % 10);

      if (prev.credits < cost) {
        return prev;
      }

      // Deal a completely new hand from a fresh deck (including deck modifications)
      const deck = shuffleDeck(
        createFullDeck(
          prev.deckModifications.deadCards,
          prev.deckModifications.removedCards,
          prev.deckModifications.wildCards
        )
      );
      const newHand: Card[] = deck.slice(0, 5);

      // Reset the entire hand state while maintaining the rest of the game state
      const totalBet = prev.betAmount * prev.selectedHandCount;
      if (prev.credits - cost < totalBet) {
        return prev;
      }

      return {
        ...prev,
        playerHand: newHand,
        heldIndices: [],
        parallelHands: [],
        additionalHandsBought: 0,
        credits: prev.credits - cost,
        maxDraws: Math.max(1, (getCurrentGameMode() as { maxDraws?: number }).maxDraws ?? 1) + (prev.extraDrawPurchased ? 1 : 0),
        drawsCompletedThisRound: 0,
      };
    });
  }, []);

  const setBetAmount = useCallback((amount: number) => {
    setState((prev) => {
      // Validate input is a valid number
      if (isNaN(amount) || !isFinite(amount)) {
        return prev;
      }

      // Ensure amount is not negative
      if (amount < 0) {
        return prev;
      }

      // Ensure amount meets minimum bet requirement
      if (amount < prev.minimumBet) {
        return prev;
      }

      // Floor the amount to ensure it's an integer
      const validAmount = Math.floor(amount);

      return {
        ...prev,
        betAmount: validAmount,
      };
    });
  }, []);

  const setSelectedHandCount = useCallback((count: number) => {
    setState((prev) => {
      // Validate input is a valid number
      if (isNaN(count) || !isFinite(count)) {
        return prev;
      }

      // Ensure count is positive
      if (count < 1) {
        return prev;
      }

      // Ensure count doesn't exceed available hands
      if (count > prev.handCount) {
        return prev;
      }

      // Floor the count to ensure it's an integer
      const validCount = Math.floor(count);

      // Check if player can afford bet with this hand count
      const totalBet = prev.betAmount * validCount;
      if (prev.credits < totalBet) {
        return prev;
      }

      return {
        ...prev,
        selectedHandCount: validCount,
      };
    });
  }, []);

  const moveToNextScreen = useCallback(() => {
    playSound('screenTransition');
    setState((prev) => {
      if (prev.gamePhase === 'parallelHandsAnimation') {
        return {
          ...prev,
          gamePhase: 'results',
        };
      }
      return prev;
    });
  }, [playSound]);

  const proceedFromResults = useCallback(() => {
    setState((prev) => {
      // Always hide the shop and go to PreDraw
      return {
        ...prev,
        screen: 'game',
        gamePhase: 'preDraw',
        showShopNextRound: false,
        selectedShopOptions: [],
        creditsAtShopOpen: null,
        prevRoundMinimumBet: null,
        shopDisplayBetAmount: null,
      };
    });
  }, []);

  const cheatAddCredits = useCallback((amount: number) => {
    playSound("cheater");
    setState((prev) => ({
      ...prev,
      credits: prev.credits + amount,
      gameOver: false,
      gameOverReason: null,
    }));
  }, [playSound]);

  const cheatAddHands = useCallback((amount: number) => {
    playSound('cheater');
    setState((prev) => {
      const newHandCount = prev.handCount + amount;
      return {
        ...prev,
        handCount: newHandCount,
        selectedHandCount: newHandCount,
      };
    });
  }, [playSound]);

  const cheatSetDevilsDeal = useCallback(() => {
    playSound('cheater');
    setState((prev) => ({
      ...prev,
      devilsDealChancePurchases: 19, // 5% * 19 = 95%, base 5% = 100%
      devilsDealCostReductionPurchases: 15, // 6% * 15 = 90%, base 10% - 90% = 1%
    }));
  }, [playSound]);

  const updateStreakCounter = useCallback((
    newStreakCount: number,
    roundSummary?: { highestCombo: number; highestMultiplier: number }
  ) => {
    setState((prev) => ({
      ...prev,
      streakCounter: newStreakCount,
      currentStreakMultiplier: calculateStreakMultiplier(newStreakCount),
      runHighestCombo: Math.max(prev.runHighestCombo, roundSummary?.highestCombo ?? newStreakCount),
      runHighestMultiplier: Math.max(
        prev.runHighestMultiplier,
        roundSummary?.highestMultiplier ?? calculateStreakMultiplier(newStreakCount)
      ),
    }));
  }, []);

  const setAnimationSpeed = useCallback((speed: number | 'skip') => {
    setState((prev) => {
      try {
        localStorage.setItem('animationSettings', JSON.stringify({ animationSpeedMode: speed }));
      } catch {
        // Ignore storage errors
      }
      return { ...prev, animationSpeedMode: speed };
    });
  }, []);

  const setCardTheme = useCallback((theme: 'light' | 'dark') => {
    setState((prev) => {
      try {
        setStoredCardTheme(theme);
      } catch {
        // Ignore storage errors
      }
      return { ...prev, cardTheme: theme };
    });
  }, []);

  const toggleDevilsDealHold = useCallback(() => {
    setState((prev) => {
      // Can't hold devil's deal if already holding 5 cards (hand is full)
      if (prev.heldIndices.length >= 5 && !prev.devilsDealHeld) {
        return prev;
      }
      return {
        ...prev,
        devilsDealHeld: !prev.devilsDealHeld,
      };
    });
  }, []);

  return {
    state,
    // Game actions
    ...gameActions,
    // Shop actions
    ...shopActions,
    // Navigation and other actions
    openShop,
    closeShop,
    upgradeRewardTable,
    returnToMenu,
    returnToPreDraw,
    startNewRun,
    endRun,
    buyAnotherHand,
    setBetAmount,
    setSelectedHandCount,
    moveToNextScreen,
    proceedFromResults,
    cheatAddCredits,
    cheatAddHands,
    cheatSetDevilsDeal,
    toggleDevilsDealHold,
    updateStreakCounter,
    setAnimationSpeed,
    setCardTheme,
  };
}
