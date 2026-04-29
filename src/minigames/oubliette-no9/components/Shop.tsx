import { useState, useCallback, useEffect } from "react";
import { Box, Button, Group, Modal, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import {
  calculateWildCardCost,
  calculateSingleDeadCardRemovalCost,
  calculateAllDeadCardsRemovalCost,
  calculateDevilsDealChanceCost,
  calculateDevilsDealCostReductionCost,
  calculateExtraCardInHandCost,
  applyShopCostMultiplier,
  getParallelHandsBundleBaseCost,
  getCreditsNeededForDisplayedRound,
  getCreditsNeededForNextRound,
} from '../utils/config';
import { gameConfig, getCurrentGameMode, getShopDisplayName } from '@/config/minigames/oublietteNo9GameRules';
import './Shop.css';
import { ShopOptionType } from '../types';
import { formatCredits } from '../utils/format';
import { GameButton } from './GameButton';
/**
 * Shop component props
 *
 * Displays available upgrades and modifications for the player to purchase
 * between rounds. Upgrades include dead cards, wild cards, parallel hands,
 * extra draws, and Devil's Deal improvements.
 */
interface ShopProps {
  /** Current player credits (for affordability checks) */
  credits: number;
  /** Credits used for pricing (snapshot at shop open; prevents prices changing mid-visit) */
  creditsForPricing?: number;
  /** Total hand count (maximum parallel hands available) */
  handCount: number;
  /** Bet amount per hand for next round (used to show cost for next round) */
  betAmount: number;
  /** Selected hand count for next round (used to show cost for next round) */
  selectedHandCount: number;
  /** Bet size from the round just completed; used for round-cost display in shop. */
  shopDisplayBetAmount?: number | null;
  /** Round number you will play after leaving the shop (already advanced from results). */
  nextRoundNumber?: number;
  /** Minimum bet from the round before `nextRoundNumber`; used when the next round bumps the table minimum. */
  prevRoundMinimumBetForNextRoundCost?: number | null;
  /** Array of dead cards currently in deck */
  deadCards: { id: string }[];
  /** Number of times dead cards have been removed */
  deadCardRemovalCount: number;
  /** Array of wild cards currently in deck */
  wildCards: { id: string }[];
  /** Total count of wild cards */
  wildCardCount: number;
  /** Whether extra draw has been purchased */
  extraDrawPurchased: boolean;
  /** Array of shop options to display */
  selectedShopOptions: ShopOptionType[];
  /** Callback to add a dead card */
  onAddDeadCard: () => void;
  /** Callback to remove a single dead card */
  onRemoveSingleDeadCard: () => void;
  /** Callback to remove all dead cards */
  onRemoveAllDeadCards: () => void;
  /** Callback to add a wild card */
  onAddWildCard: () => void;
  /** Callback to purchase extra draw ability */
  onPurchaseExtraDraw: () => void;
  /** Callback to add parallel hands bundle */
  onAddParallelHandsBundle: (bundleSize: number) => void;
  /** Callback to increase Devil's Deal chance */
  onPurchaseDevilsDealChance: () => void;
  /** Callback to reduce Devil's Deal cost */
  onPurchaseDevilsDealCostReduction: () => void;
  /** Number of Devil's Deal chance upgrades purchased */
  devilsDealChancePurchases: number;
  /** Number of Devil's Deal cost reduction upgrades purchased */
  devilsDealCostReductionPurchases: number;
  /** Number of extra cards in hand purchased (0 = deal 5, 1 = deal 6, etc.) */
  extraCardsInHand: number;
  /** Callback to purchase extra card in hand */
  onPurchaseExtraCardInHand: () => void;
  /** Callback to close shop and continue */
  onClose: () => void;
  /** Callback to open settings modal */
  onShowSettings?: () => void;
}

/**
 * Shop component for purchasing game upgrades
 *
 * Displays available shop options based on current game state and allows
 * players to purchase upgrades between rounds. Handles affordability checks,
 * cost calculations, and disabled states for maxed-out upgrades.
 *
 * @example
 * <Shop
 *   credits={5000}
 *   handCount={50}
 *   betAmount={5}
 *   selectedHandCount={10}
 *   selectedShopOptions={['dead-card', 'wild-card']}
 *   onAddDeadCard={handleAddDeadCard}
 *   onClose={handleCloseShop}
 *   {...otherProps}
 * />
 */
export function Shop({
  credits,
  creditsForPricing = credits,
  handCount,
  betAmount,
  selectedHandCount,
  shopDisplayBetAmount = null,
  nextRoundNumber,
  prevRoundMinimumBetForNextRoundCost = null,
  deadCards,
  deadCardRemovalCount,
  wildCards,
  wildCardCount,
  extraDrawPurchased,
  selectedShopOptions,
  onAddDeadCard,
  onRemoveSingleDeadCard,
  onRemoveAllDeadCards,
  onAddWildCard,
  onPurchaseExtraDraw,
  onAddParallelHandsBundle,
  onPurchaseDevilsDealChance,
  onPurchaseDevilsDealCostReduction,
  devilsDealChancePurchases,
  devilsDealCostReductionPurchases,
  extraCardsInHand,
  onPurchaseExtraCardInHand,
  onClose,
  onShowSettings,
}: ShopProps) {
  void wildCards;
  const currentMode = getCurrentGameMode();
  const isVipShop = creditsForPricing >= gameConfig.shopOptions.premium.creditsThreshold;
  // Track items purchased during this shop visit
  const [purchasedItems, setPurchasedItems] = useState<Set<ShopOptionType>>(new Set());
  // Pending purchase that would leave player unable to afford next round
  const [affordabilityWarning, setAffordabilityWarning] = useState<{
    onConfirm: () => void;
    onCancel: () => void;
    cost: number;
    creditsAfter: number;
    roundCost: number;
  } | null>(null);

  // Close affordability modal on Escape
  useEffect(() => {
    if (!affordabilityWarning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        affordabilityWarning.onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [affordabilityWarning]);

  // Helper to calculate bundle cost (uses creditsForPricing so prices stay fixed for the visit)
  const calculateBundleCost = (bundleSize: number): number => {
    const baseCost = getParallelHandsBundleBaseCost(bundleSize, creditsForPricing);
    return applyShopCostMultiplier(baseCost, creditsForPricing);
  };

  // Helper to check if an item was purchased this visit
  const isPurchased = (optionType: ShopOptionType): boolean => {
    return purchasedItems.has(optionType);
  };

  // Helper to mark an item as purchased
  const markPurchased = (optionType: ShopOptionType) => {
    setPurchasedItems((prev) => new Set([...prev, optionType]));
  };

  // Calculate costs (use creditsForPricing so prices stay fixed for the visit)
  const singleDeadCardRemovalCost = applyShopCostMultiplier(
    calculateSingleDeadCardRemovalCost(deadCardRemovalCount),
    creditsForPricing
  );
  const allDeadCardsRemovalCost = applyShopCostMultiplier(
    calculateAllDeadCardsRemovalCost(deadCardRemovalCount, deadCards.length),
    creditsForPricing
  );
  const wildCardCost = applyShopCostMultiplier(
    calculateWildCardCost(wildCardCount),
    creditsForPricing
  );
  const devilsDealChanceCost = applyShopCostMultiplier(
    calculateDevilsDealChanceCost(devilsDealChancePurchases),
    creditsForPricing
  );
  const devilsDealCostReductionCost = applyShopCostMultiplier(
    calculateDevilsDealCostReductionCost(devilsDealCostReductionPurchases),
    creditsForPricing
  );
  const extraCardInHandCost = applyShopCostMultiplier(
    calculateExtraCardInHandCost(extraCardsInHand),
    creditsForPricing
  );
  const extraDrawCost = applyShopCostMultiplier(
    currentMode.shop.extraDraw.cost,
    creditsForPricing
  );

  const devilsDealConfig = currentMode.devilsDeal;
  const effectiveChance = devilsDealConfig
    ? devilsDealConfig.baseChance +
      devilsDealChancePurchases * devilsDealConfig.chanceIncreasePerPurchase
    : 0;
  const effectiveCostPercent = devilsDealConfig
    ? Math.max(
        1,
        devilsDealConfig.baseCostPercent -
          devilsDealCostReductionPurchases * devilsDealConfig.costReductionPerPurchase
      )
    : 0;

  const displayedRoundBetAmount = shopDisplayBetAmount ?? betAmount;
  const creditsNeededForNextRound =
    nextRoundNumber != null && prevRoundMinimumBetForNextRoundCost != null
      ? getCreditsNeededForNextRound(
          nextRoundNumber,
          prevRoundMinimumBetForNextRoundCost,
          betAmount,
          selectedHandCount,
          handCount,
        )
      : getCreditsNeededForDisplayedRound(displayedRoundBetAmount, selectedHandCount, handCount);

  const getRoundCostAfterPurchase = (newHandCount: number) =>
    nextRoundNumber != null && prevRoundMinimumBetForNextRoundCost != null
      ? getCreditsNeededForNextRound(
          nextRoundNumber,
          prevRoundMinimumBetForNextRoundCost,
          betAmount,
          newHandCount,
          newHandCount,
        )
      : getCreditsNeededForDisplayedRound(displayedRoundBetAmount, newHandCount, newHandCount);

  /**
   * Attempts a purchase. If it would leave the player unable to afford the next round,
   * shows a warning modal instead of completing immediately.
   */
  const attemptPurchase = useCallback(
    (
      cost: number,
      roundCostAfterPurchase: number,
      optionType: ShopOptionType,
      doPurchase: () => void
    ) => {
      const creditsAfter = credits - cost;
      if (creditsAfter < roundCostAfterPurchase) {
        setAffordabilityWarning({
          onConfirm: () => {
            doPurchase();
            setPurchasedItems((prev) => new Set([...prev, optionType]));
            setAffordabilityWarning(null);
          },
          onCancel: () => setAffordabilityWarning(null),
          cost,
          creditsAfter,
          roundCost: roundCostAfterPurchase,
        });
      } else {
        doPurchase();
        markPurchased(optionType);
      }
    },
    [credits]
  );

  /** Renders one shop card for the given option type. Used to show exactly one card per slot (repeats allowed). */
  const renderShopCard = (optionType: ShopOptionType): React.ReactNode => {
    switch (optionType) {
      case 'parallel-hands-bundle-5':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +5</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 5 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(5),
                  getRoundCostAfterPurchase(handCount + 5),
                  'parallel-hands-bundle-5',
                  () => onAddParallelHandsBundle(5)
                )
              }
              disabled={credits < calculateBundleCost(5) || isPurchased('parallel-hands-bundle-5')}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(5) && !isPurchased('parallel-hands-bundle-5') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-5')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(5))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-10':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +10</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 10 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(10),
                  getRoundCostAfterPurchase(handCount + 10),
                  'parallel-hands-bundle-10',
                  () => onAddParallelHandsBundle(10)
                )
              }
              disabled={
                credits < calculateBundleCost(10) || isPurchased('parallel-hands-bundle-10')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(10) && !isPurchased('parallel-hands-bundle-10') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-10')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(10))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-25':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +25</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 25 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(25),
                  getRoundCostAfterPurchase(handCount + 25),
                  'parallel-hands-bundle-25',
                  () => onAddParallelHandsBundle(25)
                )
              }
              disabled={
                credits < calculateBundleCost(25) || isPurchased('parallel-hands-bundle-25')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(25) && !isPurchased('parallel-hands-bundle-25') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-25')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(25))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-50':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +50</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 50 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(50),
                  getRoundCostAfterPurchase(handCount + 50),
                  'parallel-hands-bundle-50',
                  () => onAddParallelHandsBundle(50)
                )
              }
              disabled={
                credits < calculateBundleCost(50) || isPurchased('parallel-hands-bundle-50')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(50) && !isPurchased('parallel-hands-bundle-50') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-50')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(50))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-100':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +100</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 100 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(100),
                  getRoundCostAfterPurchase(handCount + 100),
                  'parallel-hands-bundle-100',
                  () => onAddParallelHandsBundle(100)
                )
              }
              disabled={
                credits < calculateBundleCost(100) || isPurchased('parallel-hands-bundle-100')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(100) && !isPurchased('parallel-hands-bundle-100') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-100')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(100))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-250':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +250</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 250 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(250),
                  getRoundCostAfterPurchase(handCount + 250),
                  'parallel-hands-bundle-250',
                  () => onAddParallelHandsBundle(250)
                )
              }
              disabled={
                credits < calculateBundleCost(250) || isPurchased('parallel-hands-bundle-250')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(250) && !isPurchased('parallel-hands-bundle-250') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-250')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(250))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-500':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +500</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 500 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(500),
                  getRoundCostAfterPurchase(handCount + 500),
                  'parallel-hands-bundle-500',
                  () => onAddParallelHandsBundle(500)
                )
              }
              disabled={
                credits < calculateBundleCost(500) || isPurchased('parallel-hands-bundle-500')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(500) && !isPurchased('parallel-hands-bundle-500') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-500')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(500))} Credits`}
            </button>
          </div>
        );
      case 'parallel-hands-bundle-1000':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="More parallel hands = more chances to win each round. Each hand is evaluated separately."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Parallel Hands +1000</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>Current: {handCount}</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Add 1000 Parallel Hands</p>
            <button
              onClick={() =>
                attemptPurchase(
                  calculateBundleCost(1000),
                  getRoundCostAfterPurchase(handCount + 1000),
                  'parallel-hands-bundle-1000',
                  () => onAddParallelHandsBundle(1000)
                )
              }
              disabled={
                credits < calculateBundleCost(1000) || isPurchased('parallel-hands-bundle-1000')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= calculateBundleCost(1000) && !isPurchased('parallel-hands-bundle-1000') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('parallel-hands-bundle-1000')
                ? 'Already Purchased'
                : `${formatCredits(calculateBundleCost(1000))} Credits`}
            </button>
          </div>
        );
      case 'dead-card':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="Dead cards are drawn but don't count toward your hand. Add one to receive credits."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Add Dead Card</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>
                {deadCards.length}/{gameConfig.deadCardLimit}
              </span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>
              Add a card that doesn't count toward your hand to your deck. Receive{' '}
              {formatCredits(currentMode.shop.deadCard.creditReward)} credits
            </p>
            <button
              onClick={() => {
                onAddDeadCard();
                markPurchased('dead-card');
              }}
              disabled={deadCards.length >= gameConfig.deadCardLimit || isPurchased('dead-card')}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${deadCards.length < gameConfig.deadCardLimit && !isPurchased('dead-card') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('dead-card')
                ? 'Already Purchased'
                : deadCards.length >= gameConfig.deadCardLimit
                  ? 'Maximum Dead Cards Reached'
                  : `Gain ${formatCredits(currentMode.shop.deadCard.creditReward)} Credits`}
            </button>
          </div>
        );
      case 'wild-card':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full border border-[var(--game-accent-gold)]"
            style={{ boxShadow: '0 0 16px rgba(201, 162, 39, 0.15)' }}
            title="Wild cards can substitute for any rank and suit. Great for completing straights, flushes, and high pairs."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Add Wild Card</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>
                {wildCardCount}/{currentMode.shop.wildCard.maxCount}
              </span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>
              Add a card that counts as any rank and suit (max {currentMode.shop.wildCard.maxCount})
            </p>
            <button
              onClick={() =>
                attemptPurchase(wildCardCost, creditsNeededForNextRound, 'wild-card', onAddWildCard)
              }
              disabled={
                credits < wildCardCost ||
                wildCardCount >= currentMode.shop.wildCard.maxCount ||
                isPurchased('wild-card')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= wildCardCost && wildCardCount < currentMode.shop.wildCard.maxCount && !isPurchased('wild-card') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('wild-card')
                ? 'Already Purchased'
                : `${formatCredits(wildCardCost)} Credits${wildCardCount >= currentMode.shop.wildCard.maxCount ? ' (Max)' : ''}`}
            </button>
          </div>
        );
      case 'extra-draw':
        return (
          <div
            className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full"
            title="Get a second draw phase: hold 1 card, redraw the other 4. One-time purchase."
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Extra Draw</h3>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>
              Adds an additonal draw phase after you hold cards.
            </p>
            <button
              onClick={() =>
                attemptPurchase(
                  extraDrawCost,
                  creditsNeededForNextRound,
                  'extra-draw',
                  onPurchaseExtraDraw
                )
              }
              disabled={
                credits < extraDrawCost ||
                extraDrawPurchased ||
                isPurchased('extra-draw')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= extraDrawCost && !extraDrawPurchased && !isPurchased('extra-draw') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('extra-draw') || extraDrawPurchased
                ? 'Already Purchased'
                : `${formatCredits(extraDrawCost)} Credits`}
            </button>
          </div>
        );
      case 'extra-card-in-hand':
        return (
          <div className="game-panel rounded-lg p-6 hover:opacity-95 transition-all flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Extra Card in Hand</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>
                {extraCardsInHand}/{currentMode.shop.extraCardInHand.maxPurchases}
              </span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Deals an additional card during your draw phase.</p>
            <button
              onClick={() =>
                attemptPurchase(
                  extraCardInHandCost,
                  creditsNeededForNextRound,
                  'extra-card-in-hand',
                  onPurchaseExtraCardInHand
                )
              }
              disabled={
                credits < extraCardInHandCost ||
                extraCardsInHand >= currentMode.shop.extraCardInHand.maxPurchases ||
                isPurchased('extra-card-in-hand')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= extraCardInHandCost && extraCardsInHand < currentMode.shop.extraCardInHand.maxPurchases && !isPurchased('extra-card-in-hand') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {extraCardsInHand >= currentMode.shop.extraCardInHand.maxPurchases
                ? 'Max Purchased'
                : isPurchased('extra-card-in-hand')
                  ? 'Purchased This Visit'
                  : `${formatCredits(extraCardInHandCost)} Credits`}
            </button>
          </div>
        );
      case 'remove-single-dead-card':
        return (
          <div className="game-panel rounded-lg p-6 hover:opacity-95 transition-all flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Remove Dead Card</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>
                {deadCards.length > 0 ? `1/${deadCards.length}` : 'None'}
              </span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Permanently remove one dead card from deck</p>
            <button
              onClick={() =>
                attemptPurchase(
                  singleDeadCardRemovalCost,
                  creditsNeededForNextRound,
                  'remove-single-dead-card',
                  onRemoveSingleDeadCard
                )
              }
              disabled={
                credits < singleDeadCardRemovalCost ||
                deadCards.length === 0 ||
                isPurchased('remove-single-dead-card')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= singleDeadCardRemovalCost && deadCards.length > 0 && !isPurchased('remove-single-dead-card') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('remove-single-dead-card')
                ? 'Already Purchased'
                : deadCards.length === 0
                  ? 'No dead cards'
                  : `${formatCredits(singleDeadCardRemovalCost)} Credits`}
            </button>
          </div>
        );
      case 'remove-all-dead-cards':
        return (
          <div className="game-panel rounded-lg p-6 hover:opacity-95 transition-all flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Remove All Dead Cards</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>{deadCards.length} total</span>
            </div>
            <p className="mb-4" style={{ color: 'var(--game-text-muted)' }}>Remove all {deadCards.length} dead cards at once</p>
            <button
              onClick={() =>
                attemptPurchase(
                  allDeadCardsRemovalCost,
                  creditsNeededForNextRound,
                  'remove-all-dead-cards',
                  onRemoveAllDeadCards
                )
              }
              disabled={
                credits < allDeadCardsRemovalCost ||
                deadCards.length === 0 ||
                isPurchased('remove-all-dead-cards')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= allDeadCardsRemovalCost && deadCards.length > 0 && !isPurchased('remove-all-dead-cards') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('remove-all-dead-cards')
                ? 'Already Purchased'
                : `${formatCredits(allDeadCardsRemovalCost)} Credits`}
            </button>
          </div>
        );
      case 'devils-deal-chance':
        return devilsDealConfig ? (
          <div className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Increase Devil's Deal Chance</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>
                {devilsDealChancePurchases}/{devilsDealConfig.maxChancePurchases}
              </span>
            </div>
            <p className="mb-2" style={{ color: 'var(--game-text-muted)' }}>
              Increase chance by {devilsDealConfig.chanceIncreasePerPurchase}% per purchase
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--game-text-dim)' }}>Current chance: {effectiveChance}%</p>
            <button
              onClick={() =>
                attemptPurchase(
                  devilsDealChanceCost,
                  creditsNeededForNextRound,
                  'devils-deal-chance',
                  onPurchaseDevilsDealChance
                )
              }
              disabled={
                credits < devilsDealChanceCost ||
                devilsDealChancePurchases >= devilsDealConfig.maxChancePurchases ||
                isPurchased('devils-deal-chance')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= devilsDealChanceCost && devilsDealChancePurchases < devilsDealConfig.maxChancePurchases && !isPurchased('devils-deal-chance') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('devils-deal-chance')
                ? 'Already Purchased'
                : devilsDealChancePurchases >= devilsDealConfig.maxChancePurchases
                  ? 'Maximum Purchases Reached'
                  : `${formatCredits(devilsDealChanceCost)} Credits`}
            </button>
          </div>
        ) : null;
      case 'devils-deal-cost-reduction':
        return devilsDealConfig ? (
          <div className="game-panel rounded-xl p-6 hover:opacity-95 transition-all flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold" style={{ color: 'var(--game-text)' }}>Reduce Devil's Deal Cost</h3>
              <span style={{ color: 'var(--game-text-muted)' }}>
                {devilsDealCostReductionPurchases}/{devilsDealConfig.maxCostReductionPurchases}
              </span>
            </div>
            <p className="mb-2" style={{ color: 'var(--game-text-muted)' }}>
              Reduce cost by {devilsDealConfig.costReductionPerPurchase}% per purchase
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--game-text-dim)' }}>
              Current cost: {effectiveCostPercent}% of payout
            </p>
            <button
              onClick={() =>
                attemptPurchase(
                  devilsDealCostReductionCost,
                  creditsNeededForNextRound,
                  'devils-deal-cost-reduction',
                  onPurchaseDevilsDealCostReduction
                )
              }
              disabled={
                credits < devilsDealCostReductionCost ||
                devilsDealCostReductionPurchases >= devilsDealConfig.maxCostReductionPurchases ||
                isPurchased('devils-deal-cost-reduction')
              }
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors mt-auto ${credits >= devilsDealCostReductionCost && devilsDealCostReductionPurchases < devilsDealConfig.maxCostReductionPurchases && !isPurchased('devils-deal-cost-reduction') ? 'shop-btn-enabled' : 'shop-btn-disabled'}`}
            >
              {isPurchased('devils-deal-cost-reduction')
                ? 'Already Purchased'
                : devilsDealCostReductionPurchases >= devilsDealConfig.maxCostReductionPurchases
                  ? 'Maximum Purchases Reached'
                  : `${formatCredits(devilsDealCostReductionCost)} Credits`}
            </button>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Box
      className={isVipShop ? "shop-vip-sheen" : undefined}
      style={{
        minHeight: "100dvh",
        padding: "clamp(1rem, 3vw, 1.5rem)",
      }}
    >
      <Stack maw={896} mx="auto" gap="md" style={{ minHeight: "calc(100dvh - 2rem)" }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Title order={2} c={clubTokens.text.brass} fz={{ base: "1.35rem", sm: "1.65rem", md: "1.85rem" }}>
            {getShopDisplayName(creditsForPricing)}
          </Title>
          <Group gap="xs">
            {onShowSettings ? (
              <Button
                type="button"
                variant="default"
                size="xs"
                w={36}
                h={36}
                p={0}
                onClick={onShowSettings}
                title="Settings"
                aria-label="Open settings"
                styles={{
                  root: {
                    border: `1px solid ${clubTokens.surface.brassStroke}`,
                    background: `linear-gradient(145deg, ${clubTokens.surface.walnutHi} 0%, ${clubTokens.surface.panel} 100%)`,
                  },
                }}
              >
                ⚙️
              </Button>
            ) : null}
            <GameButton onClick={onClose} variant="primary" size="md">
              Close Shop
            </GameButton>
          </Group>
        </Group>

        <Paper className="game-panel-muted" p="md" radius="md" withBorder>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text size="md" fw={600} c={clubTokens.text.primary}>
              Credits:{" "}
              <Text span c={clubTokens.text.brass} inherit>
                {formatCredits(credits)}
              </Text>
            </Text>
            <Text size="sm" c={clubTokens.text.muted}>
              Credits needed for next round:{" "}
              <Text span fw={600} c={clubTokens.text.primary} inherit>
                {formatCredits(creditsNeededForNextRound)}
              </Text>
            </Text>
          </Group>
        </Paper>

        {selectedShopOptions.length === 0 ? (
          <Stack align="center" justify="center" py="xl" gap="md" style={{ flex: 1 }}>
            <Text fz={{ base: "3rem", sm: "3.5rem" }} aria-hidden>
              🏪
            </Text>
            <Title order={3} ta="center" c={clubTokens.text.brass}>
              {gameConfig.quips.emptyShop[Math.floor(Math.random() * gameConfig.quips.emptyShop.length)]}
            </Title>
            <Text size="lg" c={clubTokens.text.muted} ta="center">
              Try again next round!
            </Text>
            <GameButton onClick={onClose} variant="secondary" size="lg">
              Continue
            </GameButton>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" style={{ flex: 1 }}>
            {selectedShopOptions.map((optionType, index) => (
              <Box key={`shop-slot-${index}`} className={isVipShop ? "shop-vip-card h-full" : "h-full"}>
                {renderShopCard(optionType)}
              </Box>
            ))}
          </SimpleGrid>
        )}

        <GameButton onClick={onClose} variant="primary" size="lg" fullWidth>
          Close Shop
        </GameButton>

        <Modal
          opened={affordabilityWarning != null}
          onClose={() => affordabilityWarning?.onCancel()}
          title="Warning: cannot afford next round"
          centered
          overlayProps={{ backgroundOpacity: 0.55 }}
          styles={{
            title: { color: clubTokens.text.brass, fontWeight: 700 },
            content: {
              backgroundColor: clubTokens.surface.panel,
              border: `1px solid ${clubTokens.text.brass}`,
              boxShadow: "0 0 24px rgba(201, 162, 39, 0.25)",
            },
          }}
        >
          {affordabilityWarning ? (
            <Stack gap="md">
              <Text c={clubTokens.text.primary}>
                This purchase would leave you with {formatCredits(affordabilityWarning.creditsAfter)} credits, but you
                need {formatCredits(affordabilityWarning.roundCost)} to play the next round.
              </Text>
              <Text size="sm" c={clubTokens.text.muted}>
                If you make this purchase, you will not be able to afford the next round and you will lose. IT IS A BAD
                IDEA TO MAKE THIS PURCHASE.
              </Text>
              <Group justify="flex-end" gap="sm">
                <GameButton onClick={affordabilityWarning.onCancel} variant="ghost" size="md">
                  Cancel
                </GameButton>
                <GameButton onClick={affordabilityWarning.onConfirm} variant="secondary" size="md">
                  Complete purchase anyway
                </GameButton>
              </Group>
            </Stack>
          ) : null}
        </Modal>
      </Stack>
    </Box>
  );
}
