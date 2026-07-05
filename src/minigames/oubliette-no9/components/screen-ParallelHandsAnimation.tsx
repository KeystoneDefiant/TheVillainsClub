import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box } from "@mantine/core";
import { Card as CardType, Hand, RewardTable } from '../types';
import { PokerEvaluator } from '../utils/pokerEvaluator';
import { gameConfig } from '@/config/minigames/oublietteNo9GameRules';
import {
  calculateStreakMultiplier,
  getNextThreshold,
  getStreakProgress,
  summarizeRoundCombos,
} from '../utils/streakCalculator';
import { StreakProgressBar } from './StreakProgressBar';
import { PlayingCardFace } from '@/ui/cards';
import { Card } from './Card';
import './screen-ParallelHandsAnimation.scss';
import { useThemeAudio } from '../hooks/useThemeAudio';
import { formatCreditsWithSuffix } from '../utils/format';

interface ParallelHandsAnimationProps {
  parallelHands: Hand[];
  playerHand: CardType[];
  heldIndices: number[];
  rewardTable: RewardTable;
  selectedHandCount: number;
  betAmount: number;
  initialStreakCounter: number;
  onAnimationComplete: (summary: {
    finalStreakCount: number;
    highestCombo: number;
    highestMultiplier: number;
  }) => void;
  animationSpeedMode?: number | 'skip';
  onShowSettings?: () => void;
}

type RevealPhase = 'enter' | 'cards' | 'result' | 'exit';
type RevealMode = 'individual' | 'sampled';

type ParallelHandsWaveConfig = {
  parallelHandsAbstractWave?: {
    individualMaxHands?: number;
    mediumMaxHands?: number;
    mediumFeaturedWinners?: number;
    highFeaturedWinners?: number;
    noWinnerFallbackFeatures?: number;
    maxMsPerBeat?: number;
    minMsPerBeat?: number;
    handCountAcceleration?: number;
    entryRatio?: number;
    cardsRatio?: number;
    resultRatio?: number;
    exitRatio?: number;
    gapRatio?: number;
    revealCompletePauseMs?: number;
    fadeOutMs?: number;
    ambientFlowIndicators?: number;
    ambientGhostCards?: number;
    ambientOrbCount?: number;
    winnerCardsMultiplier?: number;
    winnerResultMultiplier?: number;
    winnerExitMultiplier?: number;
  };
};

type WaveTimingProfile = {
  msPerBeat: number;
  entryMs: number;
  cardsMs: number;
  resultMs: number;
  exitMs: number;
  gapMs: number;
  revealCompletePauseMs: number;
  fadeDurationMs: number;
  ambientFlowIndicators: number;
  ambientGhostCards: number;
  ambientOrbCount: number;
  winnerCardsMultiplier: number;
  winnerResultMultiplier: number;
  winnerExitMultiplier: number;
};

type EvaluatedRevealHand = {
  globalIndex: number;
  hand: Hand;
  rank: string;
  rankLabel: string;
  handScored: boolean;
  creditsWon: number;
  endingStreakCount: number;
};

type RevealAggregate = {
  count: number;
  credits: number;
};

type RevealEvent = {
  kind: 'implicit' | 'featured';
  hands: EvaluatedRevealHand[];
  featuredHand: EvaluatedRevealHand | null;
  batchResolvedCount: number;
  batchCredits: number;
  batchRankTotals: Record<string, RevealAggregate>;
  endingStreakCount: number;
  lastHandScored: boolean;
  cumulativeResolvedCount: number;
};

type ExitingBeat = {
  event: RevealEvent;
  phase: 'result' | 'exit';
  exitMs: number;
};

const DEFAULT_ABSTRACT_WAVE = {
  individualMaxHands: 24,
  mediumMaxHands: 300,
  mediumFeaturedWinners: 10,
  highFeaturedWinners: 14,
  noWinnerFallbackFeatures: 2,
  maxMsPerBeat: 650,
  minMsPerBeat: 220,
  handCountAcceleration: 56,
  entryRatio: 0.22,
  cardsRatio: 0.4,
  resultRatio: 0.24,
  exitRatio: 0.14,
  gapRatio: 0.1,
  revealCompletePauseMs: 1100,
  fadeOutMs: 600,
  ambientFlowIndicators: 11,
  ambientGhostCards: 5,
  ambientOrbCount: 4,
  winnerCardsMultiplier: 1.35,
  winnerResultMultiplier: 1.75,
  winnerExitMultiplier: 1.25,
} as const;

const PREMIUM_RANKS = new Set([
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
  'royal-flush',
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isPremiumRank(rank: string): boolean {
  return PREMIUM_RANKS.has(rank);
}


function getWaveTimingProfile(
  handCount: number,
  speedNum: number,
  config: ParallelHandsWaveConfig
): WaveTimingProfile {
  const timingConfig = {
    ...DEFAULT_ABSTRACT_WAVE,
    ...(config.parallelHandsAbstractWave ?? {}),
  };
  const countAwareMsPerBeat = clamp(
    Math.round(
      timingConfig.maxMsPerBeat -
        Math.log2(Math.max(2, handCount + 1)) * timingConfig.handCountAcceleration
    ),
    timingConfig.minMsPerBeat,
    timingConfig.maxMsPerBeat
  );
  const safeSpeed = Math.max(0.25, speedNum);
  const msPerBeat = Math.max(timingConfig.minMsPerBeat, Math.round(countAwareMsPerBeat / safeSpeed));

  return {
    msPerBeat,
    entryMs: Math.max(36, Math.round(msPerBeat * timingConfig.entryRatio)),
    cardsMs: Math.max(70, Math.round(msPerBeat * timingConfig.cardsRatio)),
    resultMs: Math.max(70, Math.round(msPerBeat * timingConfig.resultRatio)),
    exitMs: Math.max(36, Math.round(msPerBeat * timingConfig.exitRatio)),
    gapMs: Math.max(18, Math.round(msPerBeat * timingConfig.gapRatio)),
    revealCompletePauseMs: Math.max(
      220,
      Math.round(timingConfig.revealCompletePauseMs / safeSpeed)
    ),
    fadeDurationMs: Math.max(180, Math.round(timingConfig.fadeOutMs / safeSpeed)),
    ambientFlowIndicators: timingConfig.ambientFlowIndicators,
    ambientGhostCards: timingConfig.ambientGhostCards,
    ambientOrbCount: timingConfig.ambientOrbCount,
    winnerCardsMultiplier: timingConfig.winnerCardsMultiplier,
    winnerResultMultiplier: timingConfig.winnerResultMultiplier,
    winnerExitMultiplier: timingConfig.winnerExitMultiplier,
  };
}


function buildRevealEvent(
  kind: RevealEvent['kind'],
  hands: EvaluatedRevealHand[],
  featuredHand: EvaluatedRevealHand | null
): RevealEvent {
  const batchRankTotals = hands.reduce<Record<string, RevealAggregate>>((accumulator, hand) => {
    const current = accumulator[hand.rank] ?? { count: 0, credits: 0 };
    accumulator[hand.rank] = {
      count: current.count + 1,
      credits: current.credits + hand.creditsWon,
    };
    return accumulator;
  }, {});
  const lastHand = hands[hands.length - 1];

  return {
    kind,
    hands,
    featuredHand,
    batchResolvedCount: hands.length,
    batchCredits: hands.reduce((sum, hand) => sum + hand.creditsWon, 0),
    batchRankTotals,
    endingStreakCount: lastHand?.endingStreakCount ?? 0,
    lastHandScored: lastHand?.handScored ?? false,
    cumulativeResolvedCount: (lastHand?.globalIndex ?? -1) + 1,
  };
}

function buildRevealEvents(
  hands: EvaluatedRevealHand[],
  config: ParallelHandsWaveConfig
): { mode: RevealMode; events: RevealEvent[] } {
  const waveConfig = {
    ...DEFAULT_ABSTRACT_WAVE,
    ...(config.parallelHandsAbstractWave ?? {}),
  };

  if (hands.length === 0) {
    return { mode: 'individual', events: [] };
  }

  if (hands.length <= waveConfig.individualMaxHands) {
    return {
      mode: 'individual',
      events: hands.map((hand) => buildRevealEvent('featured', [hand], hand)),
    };
  }

  const winningHands = hands.filter((hand) => hand.handScored);
  const desiredWinnerFeatures =
    winningHands.length > 0
      ? (hands.length <= waveConfig.mediumMaxHands
          ? waveConfig.mediumFeaturedWinners
          : waveConfig.highFeaturedWinners)
      : Math.min(waveConfig.noWinnerFallbackFeatures, hands.length);

  const numGroups = Math.max(1, desiredWinnerFeatures);
  const totalHands = hands.length;
  const segments: EvaluatedRevealHand[][] = [];
  for (let i = 0; i < numGroups; i++) {
    const start = Math.floor((i * totalHands) / numGroups);
    const end = Math.floor(((i + 1) * totalHands) / numGroups);
    if (start < end) {
      segments.push(hands.slice(start, end));
    }
  }

  const events: RevealEvent[] = [];
  let currentImplicitGroup: EvaluatedRevealHand[] = [];

  for (const segment of segments) {
    if (segment.length === 0) continue;

    // Find the best hand in the segment. Should there be a tie, pick the first one.
    let bestHand = segment[0];
    let bestIndex = 0;
    for (let j = 1; j < segment.length; j++) {
      if (segment[j].creditsWon > bestHand.creditsWon) {
        bestHand = segment[j];
        bestIndex = j;
      }
    }

    // All hands in the segment before the best hand are implicit
    for (let j = 0; j < bestIndex; j++) {
      currentImplicitGroup.push(segment[j]);
    }

    // When we hit the best hand, if we have accumulated implicit hands, emit them first
    if (currentImplicitGroup.length > 0) {
      events.push(buildRevealEvent('implicit', currentImplicitGroup, null));
      currentImplicitGroup = [];
    }

    // Now emit the featured hand
    events.push(buildRevealEvent('featured', [bestHand], bestHand));

    // All hands in the segment after the best hand are implicit
    for (let j = bestIndex + 1; j < segment.length; j++) {
      currentImplicitGroup.push(segment[j]);
    }
  }

  // After the loop, if we have remaining implicit hands, emit them
  if (currentImplicitGroup.length > 0) {
    events.push(buildRevealEvent('implicit', currentImplicitGroup, null));
  }

  return { mode: 'sampled', events };
}

function WaveHandCards({
  cards,
  heldIndices = [],
  size = 'featured',
}: {
  cards: CardType[];
  heldIndices?: number[];
  size?: 'featured' | 'compact';
}) {
  const density = size === 'compact' ? 'small' : 'medium';
  
  const partitioned = cards.map((card, index) => ({
    card,
    isHeld: heldIndices.includes(index),
  }));
  const heldCards = partitioned.filter((item) => item.isHeld);
  const drawnCards = partitioned.filter((item) => !item.isHeld);
  const sortedItems = [...heldCards, ...drawnCards];
  const firstDrawnIndex = heldCards.length;

  return (
    <div className={`wave-hand-cards wave-hand-cards-${size}`}>
      {sortedItems.map((item, visualIndex) => {
        const isStartOfDrawn = !item.isHeld && visualIndex === firstDrawnIndex;
        return (
          <div
            key={item.card.id || visualIndex}
            className={`wave-hand-card wave-hand-card-${size} ${
              item.isHeld ? 'is-held' : 'is-drawn'
            } ${isStartOfDrawn ? 'is-drawn-start' : ''}`}
            title={`${item.card.rank}${item.card.suit.charAt(0).toUpperCase()}`}
            style={{ '--card-order': visualIndex } as React.CSSProperties}
          >
            <PlayingCardFace card={item.card} density={density} />
          </div>
        );
      })}
    </div>
  );
}

function WaveBeatStage({
  event,
  phase,
  ambientGhostCards,
  variant = 'active',
  idleVariant = 'sigil',
  stackIndex = 0,
  heldIndices = [],
}: {
  event: RevealEvent | null;
  phase: RevealPhase | null;
  ambientGhostCards: number;
  variant?: 'active' | 'exiting';
  idleVariant?: 'sigil' | 'empty';
  stackIndex?: number;
  heldIndices?: number[];
}) {
  if (!event) {
    return (
      <div className={`abstract-wave-idle${idleVariant === 'empty' ? ' is-empty' : ''}`}>
        {idleVariant === 'sigil' ? <span className="abstract-wave-idle-sigil" aria-hidden="true" /> : null}
      </div>
    );
  }

  const resultVisible = phase === 'result' && event.kind === 'featured' && event.featuredHand;

  return (
    <article
      className={`abstract-wave-beat ${phase ? `abstract-wave-beat-${phase}` : ''} ${
        event.kind === 'featured' ? 'is-featured' : 'is-implicit'
      } ${event.featuredHand?.handScored ? 'is-winning' : ''} ${
        event.featuredHand?.handScored && event.featuredHand ? (isPremiumRank(event.featuredHand.rank) ? 'is-premium-winning' : '') : ''
      } ${
        variant === 'exiting' ? 'is-exiting-overlay' : 'is-active-overlay'
      }`}
      data-stack-index={stackIndex}
      aria-label="Abstract wave stage"
    >
      <div className="abstract-wave-beat-center">
        <div className="abstract-wave-ghost-field" aria-hidden="true">
          {Array.from({ length: ambientGhostCards }, (_, index) => (
            <span
              key={index}
              className="abstract-wave-ghost-card"
              style={{ animationDelay: `${index * 110}ms` }}
            />
          ))}
        </div>

        {event.kind === 'featured' && event.featuredHand ? (
          <WaveHandCards cards={event.featuredHand.hand.cards} heldIndices={heldIndices} size="featured" />
        ) : (
          <div className="abstract-wave-idle">
            <span className="abstract-wave-idle-sigil" aria-hidden="true" />
            <div className="implicit-particle-stream">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className="implicit-particle"
                  style={{
                    '--p-delay': `${i * 120}ms`,
                    '--p-x': `${(i % 2 === 0 ? 1 : -1) * (15 + (i * 4))}px`,
                    '--p-y': `${(i % 3 === 0 ? 1 : -1) * (10 + (i * 3))}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        )}

        <div
          className={`abstract-wave-result-layer${resultVisible ? ' is-visible' : ''}`}
          aria-live="polite"
        >
          {resultVisible && event.featuredHand ? (
            <>
              <span className="abstract-wave-result-rank">{event.featuredHand.rankLabel}</span>
              <span className="abstract-wave-result-payout">
                {event.featuredHand.handScored
                  ? `+${formatCreditsWithSuffix(event.featuredHand.creditsWon)}`
                  : 'MISS'}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ParallelHandsAnimation({
  parallelHands,
  playerHand,
  heldIndices,
  rewardTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedHandCount: _selectedHandCount,
  betAmount,
  initialStreakCounter,
  onAnimationComplete,
  animationSpeedMode = 1,
  onShowSettings,
}: ParallelHandsAnimationProps) {
  const { playSound } = useThemeAudio();
  const [totalRevealedCount, setTotalRevealedCount] = useState(0);
  const [committedRevealedCount, setCommittedRevealedCount] = useState(0);
  const [committedStreakCounter, setCommittedStreakCounter] = useState(initialStreakCounter);
  const [committedLastHandScored, setCommittedLastHandScored] = useState<boolean | null>(null);
  const [previewResolvedCount, setPreviewResolvedCount] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [committedScoreByRank, setCommittedScoreByRank] = useState<Record<
    string,
    { count: number; credits: number }
  >>(
    {}
  );
  const [activeEventIndex, setActiveEventIndex] = useState<number | null>(() =>
    parallelHands.length > 0 ? 0 : null
  );
  const [activePhase, setActivePhase] = useState<RevealPhase | null>(() =>
    parallelHands.length > 0 ? 'enter' : null
  );
  const [exitingBeat, setExitingBeat] = useState<ExitingBeat | null>(null);
  const [featuredStack, setFeaturedStack] = useState<{
    event: RevealEvent;
    phase: RevealPhase;
    key: string;
  }[]>([]);

  const roundComboSummary = useMemo(
    () =>
      summarizeRoundCombos(
        parallelHands,
        rewardTable,
        betAmount,
        initialStreakCounter,
        gameConfig.streakMultiplier
      ),
    [parallelHands, rewardTable, betAmount, initialStreakCounter]
  );

  const evaluatedHands = useMemo<EvaluatedRevealHand[]>(
    () =>
      parallelHands.map((hand, globalIndex) => {
        const handResult = PokerEvaluator.evaluate(hand.cards);
        const withRewards = PokerEvaluator.applyRewards(handResult, rewardTable);
        const streakMultiplier = roundComboSummary.streakMultipliers[globalIndex] ?? 1;
        const creditsWon = Math.round(withRewards.multiplier * betAmount * streakMultiplier);

        return {
          globalIndex,
          hand,
          rank: handResult.rank,
          rankLabel: toCapitalCase(handResult.rank),
          handScored: withRewards.multiplier > 0,
          creditsWon,
          endingStreakCount:
            roundComboSummary.comboProgression[globalIndex] ?? initialStreakCounter,
        };
      }),
    [
      parallelHands,
      rewardTable,
      betAmount,
      roundComboSummary.streakMultipliers,
      roundComboSummary.comboProgression,
      initialStreakCounter,
    ]
  );

  const waveConfig = gameConfig.animation as ParallelHandsWaveConfig;
  const { mode: revealMode, events: revealEvents } = useMemo(
    () => buildRevealEvents(evaluatedHands, waveConfig),
    [evaluatedHands, waveConfig]
  );

  const speedNum = typeof animationSpeedMode === 'number' ? animationSpeedMode : 1;
  const {
    msPerBeat,
    entryMs,
    cardsMs,
    resultMs,
    exitMs,
    gapMs,
    revealCompletePauseMs,
    fadeDurationMs,
    ambientFlowIndicators,
    ambientGhostCards,
    ambientOrbCount,
    winnerCardsMultiplier,
    winnerResultMultiplier,
    winnerExitMultiplier,
  } = useMemo(
    () => getWaveTimingProfile(parallelHands.length, speedNum, waveConfig),
    [parallelHands.length, speedNum, waveConfig]
  );

  const heldCards = useMemo(
    () => heldIndices.map((index) => playerHand[index]).filter(Boolean),
    [playerHand, heldIndices]
  );
  const activeEvent = activeEventIndex !== null ? revealEvents[activeEventIndex] ?? null : null;
  const isRoundComplete = totalRevealedCount === parallelHands.length && parallelHands.length > 0;
  const getEventExitMs = useCallback(
    (event: RevealEvent | null) =>
      event?.kind === 'featured' && event.featuredHand?.handScored
        ? Math.round(exitMs * winnerExitMultiplier)
        : exitMs,
    [exitMs, winnerExitMultiplier]
  );
  const activeCardsMs =
    activeEvent?.kind === 'featured' && activeEvent.featuredHand?.handScored
      ? Math.round(cardsMs * winnerCardsMultiplier)
      : cardsMs;
  const activeResultMs =
    activeEvent?.kind === 'featured' && activeEvent.featuredHand?.handScored
      ? Math.round(resultMs * winnerResultMultiplier)
      : resultMs;
  const activeExitMs = getEventExitMs(activeEvent);
  const completionSummary = useMemo(
    () => ({
      finalStreakCount:
        roundComboSummary.comboProgression[roundComboSummary.comboProgression.length - 1] ??
        initialStreakCounter,
      highestCombo: roundComboSummary.highestCombo,
      highestMultiplier: roundComboSummary.highestMultiplier,
    }),
    [roundComboSummary, initialStreakCounter]
  );

  const commitRevealEvent = useCallback((event: RevealEvent) => {
    setCommittedStreakCounter(event.endingStreakCount);
    setCommittedLastHandScored(event.lastHandScored);
    setCommittedScoreByRank((prev) => {
      const next = { ...prev };
      for (const [rank, aggregate] of Object.entries(event.batchRankTotals)) {
        const current = next[rank] ?? { count: 0, credits: 0 };
        next[rank] = {
          count: current.count + aggregate.count,
          credits: current.credits + aggregate.credits,
        };
      }
      return next;
    });
    setCommittedRevealedCount(event.cumulativeResolvedCount);
  }, []);

  const previewEvent =
    activePhase === 'result' && activeEvent
      ? activeEvent
      : exitingBeat?.event ?? null;
  const previewHands = useMemo(
    () => (previewEvent ? previewEvent.hands.slice(0, previewResolvedCount) : []),
    [previewEvent, previewResolvedCount]
  );
  const displayedScoreByRank = useMemo(() => {
    if (!previewEvent) return committedScoreByRank;

    const next = { ...committedScoreByRank };
    for (const hand of previewHands) {
      const aggregate = { count: 1, credits: hand.creditsWon };
      const rank = hand.rank;
      const current = next[rank] ?? { count: 0, credits: 0 };
      next[rank] = {
        count: current.count + aggregate.count,
        credits: current.credits + aggregate.credits,
      };
    }
    return next;
  }, [committedScoreByRank, previewEvent, previewHands]);
  const displayedRevealedCount = committedRevealedCount + previewResolvedCount;
  const latestPreviewHand = previewHands[previewHands.length - 1] ?? null;
  const displayedStreakCounter = latestPreviewHand?.endingStreakCount ?? committedStreakCounter;
  const displayedLastHandScored = latestPreviewHand?.handScored ?? committedLastHandScored;
  const currentStreakMultiplier = calculateStreakMultiplier(
    displayedStreakCounter,
    gameConfig.streakMultiplier
  );
  const nextThreshold = getNextThreshold(displayedStreakCounter, gameConfig.streakMultiplier);
  const streakProgress = getStreakProgress(displayedStreakCounter, gameConfig.streakMultiplier);
  const totalCredits = useMemo(
    () => Object.values(displayedScoreByRank).reduce((sum, entry) => sum + entry.credits, 0),
    [displayedScoreByRank]
  );
  const focusedRank = previewEvent?.featuredHand?.rank ?? null;


  const skipToSummary = () => {
    onAnimationComplete(completionSummary);
  };

  useEffect(() => {
    if (!previewEvent) {
      setPreviewResolvedCount(0);
      return;
    }

    const targetCount = previewEvent.batchResolvedCount;
    if (targetCount <= 0) {
      setPreviewResolvedCount(0);
      return;
    }

    const previewDurationMs = Math.max(120, activeResultMs + getEventExitMs(previewEvent));
    const stepMs = Math.max(16, Math.floor(previewDurationMs / Math.max(1, targetCount)));
    const startedAt = Date.now();

    setPreviewResolvedCount(1);

    if (targetCount === 1) {
      return;
    }

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextCount = Math.min(targetCount, 1 + Math.floor(elapsed / stepMs));
      setPreviewResolvedCount((current) => (nextCount > current ? nextCount : current));
      if (nextCount >= targetCount) {
        clearInterval(intervalId);
      }
    }, stepMs);

    return () => clearInterval(intervalId);
  }, [previewEvent, activeResultMs, getEventExitMs]);

  useEffect(() => {
    if (animationSpeedMode === 'skip') {
      onAnimationComplete(completionSummary);
    }
  }, [animationSpeedMode, onAnimationComplete, completionSummary]);

  useEffect(() => {
    if (parallelHands.length === 0) {
      const timeoutId = setTimeout(
        () =>
          onAnimationComplete({
            finalStreakCount: initialStreakCounter,
            highestCombo: initialStreakCounter,
            highestMultiplier: calculateStreakMultiplier(
              initialStreakCounter,
              gameConfig.streakMultiplier
            ),
          }),
        100
      );
      return () => clearTimeout(timeoutId);
    }
  }, [parallelHands.length, onAnimationComplete, initialStreakCounter]);

  useEffect(() => {
    if (animationSpeedMode === 'skip' || isFadingOut) return;
    if (activeEventIndex !== null || totalRevealedCount >= parallelHands.length) return;
    if (revealEvents.length === 0) return;

    const nextEventIndex = revealEvents.findIndex(
      (event) => event.cumulativeResolvedCount > totalRevealedCount
    );
    if (nextEventIndex === -1) return;

    const timeoutId = setTimeout(() => {
      setActiveEventIndex(nextEventIndex);
      setActivePhase('enter');
    }, totalRevealedCount === 0 ? 0 : gapMs);

    return () => clearTimeout(timeoutId);
  }, [
    animationSpeedMode,
    isFadingOut,
    activeEventIndex,
    totalRevealedCount,
    parallelHands.length,
    revealEvents,
    gapMs,
  ]);

  useEffect(() => {
    if (activeEventIndex === null || activePhase !== 'enter') return;

    const timeoutId = setTimeout(() => {
      setActivePhase('cards');
    }, entryMs);

    return () => clearTimeout(timeoutId);
  }, [activeEventIndex, activePhase, entryMs]);

  useEffect(() => {
    if (activeEventIndex === null || activePhase !== 'cards') return;

    const timeoutId = setTimeout(() => {
      const currentEvent = revealEvents[activeEventIndex];
      if (!currentEvent) return;

      if (currentEvent.kind === 'featured' && currentEvent.featuredHand?.handScored) {
        (playSound as (type: string, rank?: string) => void)(
          'handScoring',
          currentEvent.featuredHand.rank
        );
      }
      setTotalRevealedCount(currentEvent.cumulativeResolvedCount);
      setActivePhase('result');
    }, activeCardsMs);

    return () => clearTimeout(timeoutId);
  }, [activeEventIndex, activePhase, revealEvents, activeCardsMs, playSound]);

  useEffect(() => {
    if (activeEventIndex === null || activePhase !== 'result') return;

    const timeoutId = setTimeout(() => {
      const currentEvent = revealEvents[activeEventIndex];
      if (currentEvent) {
        setExitingBeat({
          event: currentEvent,
          phase: 'result',
          exitMs: getEventExitMs(currentEvent),
        });
      }
      setActiveEventIndex(null);
      setActivePhase(null);
    }, activeResultMs);

    return () => clearTimeout(timeoutId);
  }, [activeEventIndex, activePhase, activeResultMs, revealEvents, getEventExitMs]);

  useEffect(() => {
    if (!exitingBeat || exitingBeat.phase !== 'result') return;

    const timeoutId = setTimeout(() => {
      setExitingBeat((prev) => (prev ? { ...prev, phase: 'exit' } : null));
    }, 24);

    return () => clearTimeout(timeoutId);
  }, [exitingBeat]);

  useEffect(() => {
    if (!exitingBeat || exitingBeat.phase !== 'exit') return;

    const timeoutId = setTimeout(() => {
      commitRevealEvent(exitingBeat.event);
      setExitingBeat(null);
    }, exitingBeat.exitMs);

    return () => clearTimeout(timeoutId);
  }, [exitingBeat, commitRevealEvent]);

  useEffect(() => {
    if (
      totalRevealedCount === parallelHands.length &&
      parallelHands.length > 0 &&
      activeEventIndex === null &&
      exitingBeat === null &&
      !isFadingOut &&
      animationSpeedMode !== 'skip'
    ) {
      const timeoutId = setTimeout(() => setIsFadingOut(true), revealCompletePauseMs);
      return () => clearTimeout(timeoutId);
    }
  }, [
    totalRevealedCount,
    parallelHands.length,
    activeEventIndex,
    exitingBeat,
    isFadingOut,
    animationSpeedMode,
    revealCompletePauseMs,
  ]);

  useEffect(() => {
    if (!isFadingOut) return;

    const timeoutId = setTimeout(
      () =>
        onAnimationComplete({
          ...completionSummary,
          finalStreakCount: committedStreakCounter,
        }),
      fadeDurationMs
    );

    return () => clearTimeout(timeoutId);
  }, [isFadingOut, committedStreakCounter, onAnimationComplete, fadeDurationMs, completionSummary]);

  useEffect(() => {
    if (activeEvent) {
      const key = String(activeEvent.cumulativeResolvedCount);
      setFeaturedStack((prev) => {
        if (prev[0]?.key === key) {
          const next = [...prev];
          next[0] = { ...next[0], phase: activePhase || 'enter' };
          return next;
        }
        return [
          { event: activeEvent, phase: activePhase || 'enter', key },
          ...prev.filter((item) => item.key !== key),
        ].slice(0, 4);
      });
    }
  }, [activeEvent, activePhase]);

  useEffect(() => {
    if (exitingBeat) {
      const key = String(exitingBeat.event.cumulativeResolvedCount);
      setFeaturedStack((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, phase: 'exit' as const } : item
        )
      );
    }
  }, [exitingBeat]);

  return (
    <Box
      className={`parallel-hands-animation-container phase-b-layout select-none${isFadingOut ? " parallel-hands-fade-out" : ""}`}
      data-animation-speed={animationSpeedMode}
      data-animation-style="cascade"
      style={
        {
          "--card-transition-ms":
            animationSpeedMode === "skip"
              ? 30
              : Math.max(entryMs, activeExitMs, exitingBeat?.exitMs ?? 0),
          "--fade-out-ms": fadeDurationMs,
          "--wave-ms-per-beat": msPerBeat,
        } as React.CSSProperties
      }
    >
      <div className="animation-background" />

      <div className="phase-b-top-bar">
        <div className="phase-b-top-controls">
          {onShowSettings && (
            <button
              type="button"
              onClick={onShowSettings}
              className="phase-b-speed-btn"
              title="Settings"
              aria-label="Open settings"
            >
              ⚙️
            </button>
          )}
          <button
            type="button"
            onClick={skipToSummary}
            className="phase-b-skip-btn"
            title="Skip to round summary"
          >
            Skip
          </button>
        </div>
      </div>

      <div className="phase-b-left-panel">
        <div className="phase-b-held-section">
          <div className="phase-b-held-label">Held cards</div>
          <div className="phase-b-held-cards">
            {heldCards.length > 0 ? (
              heldCards.map((card) => <Card key={card.id} card={card} size="small" />)
            ) : (
              <span className="phase-b-held-empty">None held</span>
            )}
          </div>
        </div>
        <div className="phase-b-scores-section">
          <div className="phase-b-scores-label">
            <span>Scored hands</span>
            <div className="phase-b-reveal-meta">
              <span className={`phase-b-scores-counter${previewEvent ? ' is-live' : ''}`}>
                {displayedRevealedCount.toLocaleString()} of {parallelHands.length.toLocaleString()} hands
              </span>
            </div>
          </div>
          <div className="phase-b-scores-list">
            {Object.entries(displayedScoreByRank).map(([rank, { count, credits }]) => (
              <div
                key={rank}
                className={`phase-b-score-row${focusedRank === rank ? ' is-focused' : ''}${
                  isPremiumRank(rank) ? ' is-premium' : ''
                }`}
              >
                <span className="phase-b-score-left">
                  {toCapitalCase(rank)} × {count.toLocaleString()}
                </span>
                <span className="phase-b-score-right">{formatCreditsWithSuffix(credits)}</span>
              </div>
            ))}
            {Object.keys(displayedScoreByRank).length === 0 && (
              <span className="phase-b-scores-empty">—</span>
            )}
          </div>
          <div className={`phase-b-total${previewEvent ? ' is-live' : ''}`}>
            {formatCreditsWithSuffix(totalCredits)}
          </div>
        </div>
      </div>

      <section
        className="abstract-wave-stage"
        data-reveal-style="abstract-wave"
        data-reveal-mode={revealMode}
        aria-label="Parallel hands abstract wave reveal"
      >
        <div className="abstract-wave-field">
          <div className="abstract-wave-orbs" aria-hidden="true">
            {Array.from({ length: ambientOrbCount }, (_, index) => (
              <span
                key={index}
                className="abstract-wave-orb"
                style={{ animationDelay: `${index * 480}ms` }}
              />
            ))}
          </div>
          <div className="abstract-wave-flow" aria-hidden="true">
            {Array.from({ length: ambientFlowIndicators }, (_, index) => (
              <span
                key={index}
                className="abstract-wave-flow-node"
                style={{
                  animationDelay: `${index * 95}ms`,
                  opacity: 0.22 + ((index % 5) * 0.1),
                }}
              />
            ))}
          </div>

          <div className={`abstract-wave-stage-stack${exitingBeat && activeEvent ? ' is-overlapping' : ''}`}>
            {featuredStack.map((item, index) => (
              <WaveBeatStage
                key={item.key}
                event={item.event}
                phase={item.phase}
                ambientGhostCards={ambientGhostCards}
                variant={index === 0 ? "active" : "exiting"}
                stackIndex={index}
                heldIndices={heldIndices}
              />
            ))}
            {featuredStack.length === 0 && (
              <WaveBeatStage
                event={null}
                phase={null}
                ambientGhostCards={ambientGhostCards}
                idleVariant={isRoundComplete ? "empty" : "sigil"}
              />
            )}
          </div>
        </div>
      </section>

      {gameConfig.streakMultiplier.enabled && (
        <div className="phase-b-bottom-bar">
          <StreakProgressBar
            currentStreak={displayedStreakCounter}
            currentMultiplier={currentStreakMultiplier}
            nextThreshold={nextThreshold}
            progress={streakProgress}
            lastHandScored={displayedLastHandScored}
            config={gameConfig.streakMultiplier}
            variant="horizontal-segments"
          />
        </div>
      )}
    </Box>
  );
}

function toCapitalCase(rank: string): string {
  return rank
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
