import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { Box, CloseButton, Group, Paper, Title } from "@mantine/core";
import type { OublietteShellBinding } from "@/game/sessionSettlement";
import { useClubWallet } from "@/game/clubWalletStore";
import { OUBLIETTE_SCREEN_TRANSITION_MS } from "@/config/minigames/oublietteAudioAssets";
import { PLAYING_CARD_SURFACE_CLASS } from "@/ui/cards";
import { clubTokens } from "@/theme/clubTokens";
import { useGameState } from "./hooks/useGameState";
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { RewardTable } from './components/RewardTable';
import { LOGO_URL } from './config/assets';

// Code splitting: Lazy load screen components for better performance
const MainMenu = lazy(() => import('./components/MainMenu').then(m => ({ default: m.MainMenu })));
const PreDraw = lazy(() => import('./components/screen-PreDraw').then(m => ({ default: m.PreDraw })));
const GameTable = lazy(() => import('./components/screen-GameTable').then(m => ({ default: m.GameTable })));
const Results = lazy(() => import('./components/screen-Results').then(m => ({ default: m.Results })));
const ParallelHandsAnimation = lazy(() => import('./components/screen-ParallelHandsAnimation').then(m => ({ default: m.ParallelHandsAnimation })));
const Shop = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));
const GameOver = lazy(() => import('./components/screen-GameOver').then(m => ({ default: m.GameOver })));
const Credits = lazy(() => import('./components/Credits').then(m => ({ default: m.Credits })));
const Tutorial = lazy(() => import('./components/Tutorial').then(m => ({ default: m.Tutorial })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));

export function OublietteNo9Root(props?: OublietteShellBinding) {
  // Intentionally depend on shell fields, not the whole props object (parent may pass a new object each render).
  /* eslint-disable react-hooks/exhaustive-deps -- props bundle is optional; compare shell fields only */
  const shellBinding = useMemo(() => {
    if (!props) return undefined;
    return {
      sessionCredits: props.sessionCredits,
      settlement: props.settlement,
      savedState: props.savedState,
      onReturnToClubMenu: props.onReturnToClubMenu,
    };
  }, [props?.sessionCredits, props?.settlement, props?.savedState, props?.onReturnToClubMenu]);
  /* eslint-enable react-hooks/exhaustive-deps */
  const [showCredits, setShowCredits] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [payoutTableState, setPayoutTableState] = useState<'closed' | 'open' | 'closing'>('closed');

  const openPayoutTable = useCallback(() => {
    setPayoutTableState('open');
  }, []);

  const closePayoutTable = useCallback(() => {
    setPayoutTableState((prev) => (prev === 'closed' ? prev : 'closing'));
  }, []);

  useEffect(() => {
    if (payoutTableState !== 'closing') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPayoutTableState('closed');
    }, 240);

    return () => window.clearTimeout(timer);
  }, [payoutTableState]);

  // Preload logo so it's cached before any screen needs it (HTML preload also runs; this backs up for SPA nav)
  useEffect(() => {
    const img = new Image();
    img.src = LOGO_URL;
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--transition-duration',
      `${OUBLIETTE_SCREEN_TRANSITION_MS}ms`,
    );
  }, []);

  // Remove legacy injected theme background (older builds)
  useEffect(() => {
    document.getElementById('theme-bg-container')?.remove();
    document.getElementById('theme-bg-styles')?.remove();
    document.body.classList.remove('theme-classic');
  }, []);

  // Close payout table on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && payoutTableState !== 'closed') {
        closePayoutTable();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [payoutTableState, closePayoutTable]);

  const {
    state,
    dealHand,
    toggleHold,
    drawParallelHands,
    returnToMenu,
    returnToPreDraw,
    startNewRun,
    endRun,
    setBetAmount,
    setSelectedHandCount,
    addDeadCard,
    removeSingleDeadCard,
    removeAllDeadCards,
    addWildCard,
    purchaseExtraDraw,
    addParallelHandsBundle,
    moveToNextScreen,
    proceedFromResults,
    cheatAddCredits,
    cheatAddHands,
    cheatSetDevilsDeal,
    toggleDevilsDealHold,
    purchaseDevilsDealChance,
    purchaseDevilsDealCostReduction,
    purchaseExtraCardInHand,
    updateStreakCounter,
    setAnimationSpeed,
    setCardTheme,
  } = useGameState(shellBinding ?? null);

  const updateActiveSessionProgress = useClubWallet((s) => s.updateActiveSessionProgress);

  useEffect(() => {
    if (!shellBinding) return;
    updateActiveSessionProgress({
      progressRound: state.round,
      oublietteState: state,
    });
  }, [shellBinding, state, updateActiveSessionProgress]);

  return (
    <Box
      component="div"
      className={`min-h-screen min-h-[100dvh] ${PLAYING_CARD_SURFACE_CLASS}`}
      data-card-theme={state.cardTheme}
      style={{
        backgroundColor: clubTokens.surface.deepWalnut,
        color: clubTokens.text.primary,
        minHeight: "100dvh",
        boxSizing: "border-box",
      }}
    >
      {state.screen === 'menu' && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <div key="menu" className="screen-enter">
            <MainMenu
              onStartRun={startNewRun}
              onTutorial={() => setShowTutorial(true)}
              onCredits={() => setShowCredits(true)}
              onSettings={() => setShowSettings(true)}
            />
          </div>
        </ErrorBoundary>
      )}

      {showCredits && (
        <Suspense fallback={<LoadingSpinner />}>
          <div className="modal-enter">
            <Credits onClose={() => setShowCredits(false)} />
          </div>
        </Suspense>
      )}

      {showTutorial && (
        <Suspense fallback={<LoadingSpinner />}>
          <div className="modal-enter">
            <Tutorial onClose={() => setShowTutorial(false)} />
          </div>
        </Suspense>
      )}

      {state.screen === 'game' && state.gamePhase === 'preDraw' && !state.showShopNextRound && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <Suspense fallback={<LoadingSpinner />}>
            <div key="preDraw" className="screen-enter">
              <PreDraw
              credits={state.credits}
              handCount={state.handCount}
              selectedHandCount={state.selectedHandCount}
              betAmount={state.betAmount}
              minimumBet={state.minimumBet}
              rewardTable={state.rewardTable}
              gameOver={state.gameOver}
              round={state.round}
              totalEarnings={state.totalEarnings}
              failureState={state.currentFailureState}
              gameState={state}
              onSetBetAmount={setBetAmount}
              onSetSelectedHandCount={setSelectedHandCount}
              onDealHand={dealHand}
              onEndRun={endRun}
              onShowPayoutTable={openPayoutTable}
              onShowSettings={() => setShowSettings(true)}
            />
          </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {state.screen === 'game' && state.gamePhase === 'playing' && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <Suspense fallback={<LoadingSpinner />}>
            <div key="gameTable" className="screen-enter">
              <GameTable
              playerHand={state.playerHand}
              heldIndices={state.heldIndices}
              parallelHands={state.parallelHands}
              credits={state.credits}
              selectedHandCount={state.selectedHandCount}
              round={state.round}
              totalEarnings={state.totalEarnings}
              firstDrawComplete={state.drawsCompletedThisRound > 0}
              nextActionIsDraw={state.maxDraws >= 2 && state.drawsCompletedThisRound < state.maxDraws}
              failureState={state.currentFailureState}
              gameState={state}
              onToggleHold={toggleHold}
              onToggleDevilsDealHold={toggleDevilsDealHold}
              onDraw={drawParallelHands}
              onShowPayoutTable={openPayoutTable}
              onShowSettings={() => setShowSettings(true)}
            />
          </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {state.screen === 'game' && state.gamePhase === 'parallelHandsAnimation' && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <Suspense fallback={<LoadingSpinner />}>
            <div key="animation" className="screen-enter">
              <ParallelHandsAnimation
              parallelHands={state.parallelHands}
              playerHand={state.playerHand}
              heldIndices={state.heldIndices}
              rewardTable={state.rewardTable}
              selectedHandCount={state.selectedHandCount}
              betAmount={state.betAmount}
              initialStreakCounter={state.streakCounter}
              animationSpeedMode={state.animationSpeedMode}
              onShowSettings={() => setShowSettings(true)}
              onAnimationComplete={({ finalStreakCount, highestCombo, highestMultiplier }) => {
                updateStreakCounter(finalStreakCount, {
                  highestCombo,
                  highestMultiplier,
                });
                moveToNextScreen();
              }}
            />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {state.screen === 'game' && state.gamePhase === 'results' && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <Suspense fallback={<LoadingSpinner />}>
            <div key="results" className="screen-enter">
              <Results
                playerHand={state.playerHand}
                heldIndices={state.heldIndices}
                parallelHands={state.parallelHands}
                rewardTable={state.rewardTable}
                betAmount={state.betAmount}
                credits={state.credits}
                round={state.round}
                totalEarnings={state.totalEarnings}
                selectedHandCount={state.selectedHandCount}
                failureState={state.currentFailureState}
                gameState={state}
                onReturnToPreDraw={returnToPreDraw}
                showShopNextRound={state.showShopNextRound}
                onShowPayoutTable={openPayoutTable}
                onShowSettings={() => setShowSettings(true)}
              />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {state.screen === 'game' && state.showShopNextRound && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <Suspense fallback={<LoadingSpinner />}>
            <div key="shop" className="screen-enter">
              <Shop
              credits={state.credits}
              creditsForPricing={state.creditsAtShopOpen ?? state.credits}
              handCount={state.handCount}
              betAmount={state.betAmount}
              selectedHandCount={state.selectedHandCount}
              nextRoundMinimumBet={state.minimumBet}
              shopDisplayBetAmount={state.shopDisplayBetAmount}
              deadCards={state.deckModifications.deadCards}
              deadCardRemovalCount={state.deckModifications.deadCardRemovalCount}
              wildCards={state.deckModifications.wildCards}
              wildCardCount={state.wildCardCount}
              extraDrawPurchased={state.extraDrawPurchased}
              selectedShopOptions={state.selectedShopOptions}
              onAddDeadCard={addDeadCard}
              onRemoveSingleDeadCard={removeSingleDeadCard}
              onRemoveAllDeadCards={removeAllDeadCards}
              onAddWildCard={addWildCard}
              onPurchaseExtraDraw={purchaseExtraDraw}
              onAddParallelHandsBundle={addParallelHandsBundle}
              onPurchaseDevilsDealChance={purchaseDevilsDealChance}
              onPurchaseDevilsDealCostReduction={purchaseDevilsDealCostReduction}
              devilsDealChancePurchases={state.devilsDealChancePurchases}
              devilsDealCostReductionPurchases={state.devilsDealCostReductionPurchases}
              extraCardsInHand={state.extraCardsInHand}
              onPurchaseExtraCardInHand={purchaseExtraCardInHand}
              onClose={proceedFromResults}
              onShowSettings={() => setShowSettings(true)}
            />
          </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {state.screen === 'gameOver' && (
        <ErrorBoundary onReturnToMenu={returnToMenu}>
          <Suspense fallback={<LoadingSpinner />}>
            <div key="gameOver" className="screen-enter">
              <GameOver
              round={state.round}
              totalEarnings={state.totalEarnings}
              credits={state.credits}
              gameOverReason={state.gameOverReason}
              gameState={state}
              settlementProfile={shellBinding?.settlement ?? null}
              onReturnToMenu={returnToMenu}
            />
          </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {showSettings && (
        <Suspense fallback={<LoadingSpinner />}>
          <div className="modal-enter">
            <Settings
              onClose={() => setShowSettings(false)}
              animationSpeedMode={state.animationSpeedMode}
              onAnimationSpeedChange={setAnimationSpeed}
              cardTheme={state.cardTheme}
              onCardThemeChange={setCardTheme}
              onCheatAddCredits={cheatAddCredits}
              onCheatAddHands={cheatAddHands}
              onCheatSetDevilsDeal={cheatSetDevilsDeal}
            />
          </div>
        </Suspense>
      )}

      {payoutTableState !== "closed" && (
        <Box
          className={`fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4 payout-table-overlay ${
            payoutTableState === "closing" ? "payout-table-overlay-closing" : "payout-table-overlay-open"
          }`}
          onClick={closePayoutTable}
        >
          <Paper
            className={`game-panel max-w-lg w-full max-h-[85vh] overflow-hidden payout-table-panel ${
              payoutTableState === "closing" ? "payout-table-panel-closing" : "payout-table-panel-open"
            }`}
            radius="md"
            style={{
              border: `1px solid ${clubTokens.surface.brassStroke}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              backgroundColor: clubTokens.surface.panel,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Group
              justify="space-between"
              align="center"
              wrap="nowrap"
              p={{ base: "md", sm: "lg" }}
              style={{ borderBottom: `1px solid ${clubTokens.surface.brassStroke}` }}
            >
              <Title order={3} fz={{ base: "1.15rem", sm: "1.5rem" }} c={clubTokens.text.brass}>
                Payout table
              </Title>
              <CloseButton
                size="lg"
                aria-label="Close payout table"
                onClick={closePayoutTable}
                iconSize={22}
                style={{ color: clubTokens.text.muted }}
              />
            </Group>
            <Box p={{ base: "md", sm: "lg" }} style={{ maxHeight: "calc(85vh - 80px)", overflowY: "auto" }}>
              <RewardTable rewardTable={state.rewardTable} wildCardCount={state.wildCardCount} />
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default OublietteNo9Root;
