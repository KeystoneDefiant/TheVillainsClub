import { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Group, Stack, Text, Switch } from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import { PlayingCard } from "@/ui/cards";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { LigneeRoyaleShellBinding, ClubTableReturnDetail } from "@/game/sessionSettlement";
import { resolveLigneeRoyaleGameMode, LigneeRoyaleGameModeConfig } from "@/config/minigames/ligneeRoyaleConfig";
import { Card, Suit, Rank, HandResult } from "@/game/poker/types";
import { createFullDeck, shuffleDeck } from "@/game/poker/deck";
import { PokerEvaluator } from "@/game/poker/pokerEvaluator";
import { clubTokens } from "@/theme/clubTokens";
import { AnimatePresence, motion } from "framer-motion";
import { SommelierLiveGuide } from "@/components/ui/SommelierLiveGuide";
import { UnifiedGameHeader } from "@/components/ui/UnifiedGameHeader";
import { useMediaQuery } from "@mantine/hooks";
import { GameSettingsModal } from "@/components/ui/GameSettingsModal";

// Paylines paths definitions (rows index for columns 0..4 in 7-row card slot)
// Rows 2, 3, and 4 are the scoring ones. Rows 0, 1, 5, and 6 are above/below scoring.
export interface PaylineConfig {
  id: string;
  name: string;
  rows: number[];
  color: string;
}

export const LIGNEE_ROYALE_LINES: PaylineConfig[] = [
  { id: "middle", name: "Middle Row", rows: [3, 3, 3, 3, 3], color: "#e6c587" },
  { id: "top", name: "Top Row", rows: [2, 2, 2, 2, 2], color: "#d16166" },
  { id: "bottom", name: "Bottom Row", rows: [4, 4, 4, 4, 4], color: "#8cb894" },
  { id: "diagonal-v", name: "V-Diagonal", rows: [2, 3, 4, 3, 2], color: "#a67f3d" },
  { id: "diagonal-inv-v", name: "Inverted V-Diagonal", rows: [4, 3, 2, 3, 4], color: "#dbcce6" },
  { id: "off-diagonal-down", name: "Off-Diagonal Down", rows: [2, 2, 3, 4, 4], color: "#ff9900" },
  { id: "off-diagonal-up", name: "Off-Diagonal Up", rows: [4, 4, 3, 2, 2], color: "#00ccff" },
];

const MULTIPLIER_LINES: Record<number, string> = {
  1: "1 Line",
  2: "3 Lines",
  3: "5 Lines",
  4: "7 Lines",
};

export type LigneeRoyaleRootProps = LigneeRoyaleShellBinding;

export function LigneeRoyaleRoot({
  sessionCredits,
  gameModeId,
  onReturnToClubMenu,
  onAbandonRun,
  isTutorial = false,
}: LigneeRoyaleRootProps) {
  const config: LigneeRoyaleGameModeConfig = useMemo(() => resolveLigneeRoyaleGameMode(gameModeId), [gameModeId]);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const cardSize = isMobile ? "medium" : "large";

  // Audio utility
  const playSfx = useCallback((fileName: string) => {
    const { sfxEnabled, sfxVolume } = useClubAudioStore.getState();
    if (!sfxEnabled) return;
    try {
      const base = import.meta.env.BASE_URL;
      const audio = new Audio(`${base}sounds/Classic/${fileName}`);
      audio.volume = sfxVolume;
      void audio.play().catch(() => {});
    } catch {
      // silence
    }
  }, []);

  // Card layouts initializer (7x5 grid)
  const initialCards = useMemo(() => {
    const dummySuits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const dummyRanks: Rank[] = ["A", "K", "Q", "J", "10"];
    const cards: Card[][] = [];
    for (let r = 0; r < 7; r++) {
      const rowCards: Card[] = [];
      for (let c = 0; c < 5; c++) {
        rowCards.push({
          suit: dummySuits[(r + c) % 4],
          rank: dummyRanks[c],
          id: `initial-${r}-${c}`,
        });
      }
      cards.push(rowCards);
    }
    return cards;
  }, []);

  // State Management
  const [credits, setCredits] = useState(sessionCredits);
  const [betAmount, setBetAmount] = useState(config.minBet);
  const [betMultiplier, setBetMultiplier] = useState(1); // 1x, 2x, 3x, 4x -> lines
  const [grid, setGrid] = useState<Card[][]>(initialCards);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  
  // Snappy reel stops bounce animations classes states
  const [bounceReels, setBounceReels] = useState<boolean[]>([false, false, false, false, false]);

  const [winningLines, setWinningLines] = useState<Array<{
    lineId: string;
    lineName: string;
    handResult: HandResult;
    payout: number;
    wildMultiplier: number;
    rows: number[];
  }>>([]);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);

  // Sequential winning highlights loop
  const [activeWinLineIdx, setActiveWinLineIdx] = useState<number | null>(null);

  // Statistics
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [highestWin, setHighestWin] = useState(0);

  // Modals
  const [showTutorial, setShowTutorial] = useState(isTutorial);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Autoplay
  const [autoPlay, setAutoPlay] = useState(false);

  // Spin trigger index to refresh animations
  const [spinTriggerId, setSpinTriggerId] = useState(0);

  // Compute number of active lines based on bet multiplier
  const activeLinesCount = useMemo(() => {
    if (betMultiplier === 1) return 1;
    if (betMultiplier === 2) return 3;
    if (betMultiplier === 3) return 5;
    return 7;
  }, [betMultiplier]);

  const activeLines = useMemo(() => {
    return LIGNEE_ROYALE_LINES.slice(0, activeLinesCount);
  }, [activeLinesCount]);

  // Create customized deck with special card types (wild multipliers, dead cards)
  const generateLigneeRoyaleDeck = useCallback(() => {
    const baseDeck = createFullDeck([], [], [], config.deckComposition.suits, config.deckComposition.ranks);
    const specialCards: Card[] = [];
    
    // Standard Wilds
    for (let i = 0; i < config.maxWildCards; i++) {
      specialCards.push({ suit: "hearts", rank: "A", id: `wild-std-${i}`, isWild: true });
    }
    // 2x Wilds
    for (let i = 0; i < config.maxWild2xCards; i++) {
      specialCards.push({ suit: "diamonds", rank: "A", id: `wild-2x-${i}`, isWild: true, wildMultiplier: 2 });
    }
    // 3x Wilds
    for (let i = 0; i < config.maxWild3xCards; i++) {
      specialCards.push({ suit: "clubs", rank: "A", id: `wild-3x-${i}`, isWild: true, wildMultiplier: 3 });
    }
    // 5x Wilds
    for (let i = 0; i < config.maxWild5xCards; i++) {
      specialCards.push({ suit: "spades", rank: "A", id: `wild-5x-${i}`, isWild: true, wildMultiplier: 5 });
    }
    // Dead cards
    for (let i = 0; i < config.maxDeadCards; i++) {
      specialCards.push({ suit: "hearts", rank: "2", id: `dead-card-${i}`, isDead: true });
    }

    return [...baseDeck, ...specialCards];
  }, [config]);

  // Execute actual spin wins evaluation
  const evaluateSpin = useCallback((currentGrid: Card[][]) => {
    const winsList: typeof winningLines = [];
    let totalWin = 0;

    activeLines.forEach((line) => {
      // Extract cards on payline (row indices 2, 3, and 4 are the scoring ones)
      const lineCards: Card[] = line.rows.map((rowIdx, colIdx) => currentGrid[rowIdx][colIdx]);
      
      try {
        const handResult = PokerEvaluator.evaluate(lineCards, { minimumPairRank: config.minimumPairRank });
        
        if (handResult.score > 0 && config.rewards[handResult.rank] > 0) {
          const baseMult = config.rewards[handResult.rank];
          
          // Calculate wild multipliers along the line
          let wildMultProduct = 1;
          lineCards.forEach((card) => {
            if (card.isWild && card.wildMultiplier && card.wildMultiplier > 1) {
              wildMultProduct *= card.wildMultiplier;
            }
          });

          const payout = betAmount * baseMult * wildMultProduct;
          totalWin += payout;
          winsList.push({
            lineId: line.id,
            lineName: line.name,
            handResult,
            payout,
            wildMultiplier: wildMultProduct,
            rows: line.rows,
          });
        }
      } catch {
        // Safe evaluation fall through
      }
    });

    const finalWin = Math.min(totalWin, config.maxPayout);
    setWinningLines(winsList);
    setLastWinAmount(finalWin);
    setCredits((c) => c + finalWin);

    if (finalWin > 0) {
      setTotalWins((w) => w + 1);
      setTotalPayout((p) => p + finalWin);
      setHighestWin((h) => Math.max(h, finalWin));
      
      // Start cycling through the winning paylines one by one
      setActiveWinLineIdx(0);

      // Play sound based on highest winning hand
      const highestWinHand = winsList.reduce((prev, curr) => 
        (curr.handResult.score > prev.handResult.score) ? curr : prev
      , winsList[0]);

      if (highestWinHand) {
        const soundMap: Record<string, string> = {
          "royal-flush": "royalflush.ogg",
          "five-of-a-kind": "fiveofakind.ogg",
          "straight-flush": "straightflush.ogg",
          "four-of-a-kind": "fourofakind.ogg",
          "full-house": "fullhouse.ogg",
          "flush": "flush.ogg",
          "straight": "straight.ogg",
          "three-of-a-kind": "threeofakind.ogg",
          "two-pair": "twopair.ogg",
          "one-pair": "onepair.ogg",
        };
        const sfx = soundMap[highestWinHand.handResult.rank] || "button-click.ogg";
        playSfx(sfx);
      }
    } else {
      playSfx("highcard.ogg");
    }

    setTotalSpins((s) => s + 1);
    setIsSpinning(false);
  }, [activeLines, betAmount, config, playSfx]);

  // Main spin handler
  const handleSpin = useCallback((preRiggedGrid?: Card[][]) => {
    const cost = betAmount * activeLinesCount;
    if (credits < cost) {
      playSfx("cheater.ogg");
      setAutoPlay(false);
      return;
    }

    playSfx("button-click.ogg");
    setCredits((c) => c - cost);
    setWinningLines([]);
    setLastWinAmount(null);
    setActiveWinLineIdx(null);
    setIsSpinning(true);
    setSpinningReels([true, true, true, true, true]);
    setBounceReels([false, false, false, false, false]); // Reset bounce animation triggers
    setSpinTriggerId((s) => s + 1);

    // Generate new cards (7x5 layout)
    let nextGrid: Card[][];
    if (preRiggedGrid) {
      nextGrid = preRiggedGrid;
    } else {
      const deck = generateLigneeRoyaleDeck();
      const shuffled = shuffleDeck(deck);
      nextGrid = [
        [shuffled[0], shuffled[7], shuffled[14], shuffled[21], shuffled[28]],
        [shuffled[1], shuffled[8], shuffled[15], shuffled[22], shuffled[29]],
        [shuffled[2], shuffled[9], shuffled[16], shuffled[23], shuffled[30]], // Scoring Top (Row 2)
        [shuffled[3], shuffled[10], shuffled[17], shuffled[24], shuffled[31]], // Scoring Middle (Row 3)
        [shuffled[4], shuffled[11], shuffled[18], shuffled[25], shuffled[32]], // Scoring Bottom (Row 4)
        [shuffled[5], shuffled[12], shuffled[19], shuffled[26], shuffled[33]],
        [shuffled[6], shuffled[13], shuffled[20], shuffled[27], shuffled[34]],
      ];
    }

    // Staggered stop logic
    const delays = [600, 900, 1200, 1500, 1800];
    
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        setGrid((currentGrid) => {
          const next = currentGrid.map((row) => [...row]);
          for (let r = 0; r < 7; r++) {
            next[r][idx] = nextGrid[r][idx];
          }
          return next;
        });

        setSpinningReels((prev) => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
        
        // Trigger reel stop snappy bounce settlement animation
        setBounceReels((prev) => {
          const next = [...prev];
          next[idx] = true;
          return next;
        });
        playSfx("button-click.ogg");

        // Clear bounce class after duration to prevent overlap
        setTimeout(() => {
          setBounceReels((prev) => {
            const next = [...prev];
            next[idx] = false;
            return next;
          });
        }, 400);

        if (idx === 4) {
          evaluateSpin(nextGrid);
        }
      }, delay);
    });
  }, [betAmount, activeLinesCount, credits, generateLigneeRoyaleDeck, evaluateSpin, playSfx]);

  // Autoplay hook
  useEffect(() => {
    if (autoPlay && !isSpinning && !showTutorial) {
      const timer = setTimeout(() => {
        const cost = betAmount * activeLinesCount;
        if (credits >= cost) {
          handleSpin();
        } else {
          setAutoPlay(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isSpinning, credits, betAmount, activeLinesCount, handleSpin, showTutorial]);

  // Cycle through winning lines in sequence
  useEffect(() => {
    if (isSpinning || winningLines.length === 0 || activeWinLineIdx === null) {
      return;
    }

    const timer = setInterval(() => {
      setActiveWinLineIdx((curr) => {
        if (curr === null || curr === winningLines.length - 1) {
          return 0;
        }
        return curr + 1;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isSpinning, winningLines, activeWinLineIdx]);

  // Pre-rigged tutorial layout (7x5 grid)
  const handlePreRiggedTutorialSpin = () => {
    const tutorialCards: Card[][] = [
      // Row 0
      [
        { suit: "hearts", rank: "2", id: "tut-0-0" },
        { suit: "clubs", rank: "4", id: "tut-0-1" },
        { suit: "spades", rank: "6", id: "tut-0-2" },
        { suit: "diamonds", rank: "8", id: "tut-0-3" },
        { suit: "hearts", rank: "10", id: "tut-0-4" },
      ],
      // Row 1
      [
        { suit: "diamonds", rank: "3", id: "tut-1-0" },
        { suit: "hearts", rank: "5", id: "tut-1-1" },
        { suit: "clubs", rank: "7", id: "tut-1-2" },
        { suit: "spades", rank: "9", id: "tut-1-3" },
        { suit: "diamonds", rank: "J", id: "tut-1-4" },
      ],
      // Row 2 (Scoring Top)
      [
        { suit: "hearts", rank: "A", id: "tut-2-0" },
        { suit: "clubs", rank: "2", id: "tut-2-1" },
        { suit: "spades", rank: "5", id: "tut-2-2" },
        { suit: "diamonds", rank: "9", id: "tut-2-3" },
        { suit: "hearts", rank: "10", id: "tut-2-4" },
      ],
      // Row 3 (Scoring Middle)
      [
        { suit: "clubs", rank: "K", id: "tut-3-0" },
        { suit: "diamonds", rank: "K", id: "tut-3-1" },
        { suit: "hearts", rank: "K", id: "tut-3-2" },
        { suit: "diamonds", rank: "A", id: "tut-3-3", isWild: true, wildMultiplier: 2 },
        { suit: "spades", rank: "2", id: "tut-3-4" },
      ],
      // Row 4 (Scoring Bottom)
      [
        { suit: "diamonds", rank: "3", id: "tut-4-0" },
        { suit: "hearts", rank: "Q", id: "tut-4-1" },
        { suit: "clubs", rank: "4", id: "tut-4-2" },
        { suit: "hearts", rank: "J", id: "tut-4-3" },
        { suit: "spades", rank: "7", id: "tut-4-4" },
      ],
      // Row 5
      [
        { suit: "clubs", rank: "A", id: "tut-5-0" },
        { suit: "diamonds", rank: "3", id: "tut-5-1" },
        { suit: "hearts", rank: "5", id: "tut-5-2" },
        { suit: "spades", rank: "7", id: "tut-5-3" },
        { suit: "clubs", rank: "9", id: "tut-5-4" },
      ],
      // Row 6
      [
        { suit: "spades", rank: "K", id: "tut-6-0" },
        { suit: "hearts", rank: "Q", id: "tut-6-1" },
        { suit: "diamonds", rank: "J", id: "tut-6-2" },
        { suit: "clubs", rank: "10", id: "tut-6-3" },
        { suit: "spades", rank: "9", id: "tut-6-4" },
      ],
    ];
    handlePreRiggedTutorialSpin.toString(); // reference to prevent unused warning
    handleSpin(tutorialCards);
  };

  const handleCashOut = () => {
    if (onReturnToClubMenu) {
      const statsList: ClubTableReturnDetail["stats"] = [
        { label: "Total Spins", value: totalSpins },
        { label: "Total Wins", value: totalWins },
        { label: "Total Payout", value: `${totalPayout} credits` },
        { label: "Highest Win", value: `${highestWin} credits` },
      ];
      onReturnToClubMenu({
        uncappedCredits: credits,
        basePayout: credits,
        overachievementBonus: 0,
        tiers: 0,
        totalReturn: credits,
        tableRound: totalSpins,
        endReason: `Voluntary cash-out at spin ${totalSpins}`,
        stats: statsList,
      });
    }
  };

  // Helper to resolve card points on responsive layouts (restored to prior 3x5 centers)
  const getLinePoints = useCallback((line: PaylineConfig) => {
    return line.rows
      .map((rowIdx, colIdx) => {
        const visibleRowIdx = rowIdx - 2; // Maps Rows 2,3,4 inside the visible 3-row viewport
        if (isMobile) {
          // medium size: 64w x 96h, container pad = 8, col padding top = 8, gap = 8
          const x = 8 + colIdx * (64 + 8) + 32;
          const y = 8 + 4 + visibleRowIdx * (96 + 8) + 48;
          return `${x},${y}`;
        } else {
          // large size: 80w x 128h, container pad = 16, col padding top = 8, gap = 12
          const x = 16 + colIdx * (80 + 16) + 40;
          const y = 16 + 8 + visibleRowIdx * (128 + 12) + 64;
          return `${x},${y}`;
        }
      })
      .join(" ");
  }, [isMobile]);

  return (
    <Box className="lignee-royale-scope" style={{ padding: "24px 16px", minHeight: "100vh" }}>
      {/* Unified Top Header with Settings Gear action */}
      <UnifiedGameHeader
        gameTitle="Lignée Royale"
        walletAmount={credits}
        currentRound={totalSpins}
        roundLabel="Spins"
        onAbandonRun={onAbandonRun}
        onShowSettings={() => setSettingsOpened(true)}
        extraButtons={
          <Group gap="sm" wrap="nowrap">
            <ClubButton variant="outline" size="sm" onClick={() => setShowTutorial(true)}>
              Rules
            </ClubButton>
            <ClubButton variant="filled" color="red" size="sm" onClick={handleCashOut} disabled={isSpinning}>
              Settle / Cash Out
            </ClubButton>
          </Group>
        }
      />

      {/* Main Layout Grid */}
      <Box className="lr-main-group" style={{ marginTop: 12 }}>
        
        {/* Left Side Paylines Panel */}
        <Box className="lr-side-panel-left">
          <Stack gap="xs">
            <Box className="lr-glass-panel" p="md">
              <Text size="sm" fw={600} c={clubTokens.text.brass} mb="xs">
                Active Paylines ({activeLinesCount})
              </Text>
              <Stack gap={4}>
                {LIGNEE_ROYALE_LINES.map((line, idx) => {
                  const isActive = idx < activeLinesCount;
                  const isWin = winningLines.some((w) => w.lineId === line.id);
                  const isCurrentActive = activeWinLineIdx !== null && winningLines[activeWinLineIdx]?.lineId === line.id;
                  const lineWin = winningLines.find((w) => w.lineId === line.id);

                  return (
                    <Group
                      key={line.id}
                      justify="space-between"
                      wrap="nowrap"
                      align="center" // Align items to vertical middle of the Group container
                      style={{
                        padding: "6px 8px",
                        borderRadius: 4,
                        backgroundColor: isCurrentActive
                          ? "rgba(199, 158, 87, 0.25)"
                          : isWin
                            ? "rgba(199, 158, 87, 0.1)"
                            : hoveredLine === line.id
                              ? "rgba(255, 255, 255, 0.05)"
                              : "transparent",
                        cursor: "pointer",
                        border: isCurrentActive 
                          ? `2px solid ${line.color}` 
                          : isWin 
                            ? `1px dashed ${line.color}` 
                            : "1px solid transparent",
                        opacity: isActive ? 1 : 0.4,
                        // Fixed height row layout to prevent jumping list heights
                        height: 52,
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={() => setHoveredLine(line.id)}
                      onMouseLeave={() => setHoveredLine(null)}
                    >
                      <Stack gap={0} style={{ minWidth: 0, flexGrow: 1, height: "100%", justifyContent: "center" }}>
                        <Text size="xs" fw={isCurrentActive ? 700 : 500} c={isActive ? clubTokens.text.primary : clubTokens.text.muted} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {line.name}
                        </Text>
                        
                        {isActive && lineWin && (
                          <Stack gap={0} style={{ marginTop: 2 }}>
                            <Text size="xxs" c="green" fw={700} style={{ fontSize: "0.66rem", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {lineWin.handResult.rank.toUpperCase().replace(/-/g, " ")}
                              {lineWin.wildMultiplier > 1 && ` (x${lineWin.wildMultiplier})`}
                            </Text>
                            <Text size="xxs" c="green" fw={600} style={{ fontSize: "0.62rem", lineHeight: 1 }}>
                              {`+${lineWin.payout} cr`}
                            </Text>
                          </Stack>
                        )}
                      </Stack>
                      <Box
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: line.color,
                          boxShadow: isActive ? `0 0 6px ${line.color}` : "none",
                          flexShrink: 0,
                          alignSelf: "center", // Explicit vertical middle alignment for indicator badge
                        }}
                      />
                    </Group>
                  );
                })}
              </Stack>
            </Box>

            {/* Stats Box */}
            <Box className="lr-glass-panel" p="md">
              <Text size="sm" fw={600} c={clubTokens.text.brass} mb="xs">
                Session Stats
              </Text>
              <Stack gap={4}>
                <Group justify="space-between">
                  <Text size="xs" c={clubTokens.text.muted}>Spins:</Text>
                  <Text size="xs" fw={600}>{totalSpins}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c={clubTokens.text.muted}>Wins:</Text>
                  <Text size="xs" fw={600}>{totalWins}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c={clubTokens.text.muted}>Last Win:</Text>
                  <Text size="xs" fw={600} c="green">
                    {lastWinAmount !== null ? `${lastWinAmount} cr` : "—"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c={clubTokens.text.muted}>Highest Payout:</Text>
                  <Text size="xs" fw={600} c="green">{highestWin} cr</Text>
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Center Card Matrix */}
        <Box className="lr-center-panel">
          <Stack gap="md" style={{ width: "100%" }}>
            <Box className="lr-card-grid-container" style={{ paddingBottom: 24 }}>
              {/* SVG lines overlay */}
              <svg
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                {LIGNEE_ROYALE_LINES.map((line, idx) => {
                  const isActive = idx < activeLinesCount;
                  const isCurrentActiveWinLine = activeWinLineIdx !== null && winningLines[activeWinLineIdx]?.lineId === line.id;
                  const shouldDraw = isCurrentActiveWinLine || (hoveredLine === line.id && isActive);

                  if (!shouldDraw) return null;

                  const points = getLinePoints(line);

                  return (
                    <polyline
                      key={line.id}
                      points={points}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={isCurrentActiveWinLine ? 5 : 2}
                      className={isCurrentActiveWinLine ? "lr-neon-line lr-payline-glowing" : "lr-neon-line"}
                      style={{
                        color: line.color,
                        opacity: isCurrentActiveWinLine ? 1 : 0.6,
                      }}
                    />
                  );
                })}
              </svg>

              {/* The 7x5 Grid Layout - Viewport cropped to 3 rows height, overflow hidden */}
              <Group gap={isMobile ? "xs" : "md"} wrap="nowrap">
                {[0, 1, 2, 3, 4].map((colIdx) => {
                  const isReelSpinning = spinningReels[colIdx];
                  const hasBounceTrigger = bounceReels[colIdx];
                  
                  // Reel column style: spin blur while spinning, snappy vertical bounce when stopped
                  let reelColumnClass = "lr-reel-column";
                  if (isReelSpinning) {
                    reelColumnClass += " lr-reel-spinning";
                  } else if (hasBounceTrigger) {
                    reelColumnClass += " lr-reel-bounce";
                  }

                  return (
                    <Stack key={colIdx} gap={isMobile ? "xs" : "md"} className={reelColumnClass}>
                      {[0, 1, 2, 3, 4, 5, 6].map((rowIdx) => {
                        const card = grid[rowIdx][colIdx];
                        const isWinningCard = activeWinLineIdx !== null && 
                          winningLines[activeWinLineIdx]?.rows[colIdx] === rowIdx;
                        
                        // Scoring rows are indices 2, 3, and 4. Rows 0,1 and 5,6 are dimmed backdrop overflow.
                        const isScoringRow = rowIdx >= 2 && rowIdx <= 4;
                        
                        // Card style modifiers (ignored during active reel spinning)
                        let cardClass = "";
                        if (!isScoringRow) {
                          cardClass = "lr-card-non-scoring";
                        }
                        
                        if (!isReelSpinning) {
                          if (isScoringRow) {
                            if (card.isDead) cardClass = "card-special-dead";
                            else if (card.isWild) {
                              if (card.wildMultiplier === 2) cardClass = "card-special-wild-2x";
                              else if (card.wildMultiplier === 3) cardClass = "card-special-wild-3x";
                              else if (card.wildMultiplier === 5) cardClass = "card-special-wild-5x";
                              else cardClass = "card-special-wild";
                            }
                            if (isWinningCard) {
                              cardClass += " lr-card-highlighted";
                            }
                          }
                        }

                        // Generate a key that forces a remount on spin trigger to clear highlights/decays
                        const cardKey = `${spinTriggerId}-${rowIdx}-${colIdx}-${isReelSpinning}`;

                        // Calculate vertical margin shift offset to align Rows 2, 3, and 4 inside the viewport
                        // Desktop offset: -280px (2 cards * 128 height + 2 gaps * 12)
                        // Mobile offset: -208px (2 cards * 96 height + 2 gaps * 8)
                        const shiftMargin = rowIdx === 0 ? (isMobile ? -208 : -280) : undefined;

                        return (
                          <Box
                            key={cardKey}
                            className={cardClass}
                            style={{
                              position: "relative",
                              transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease",
                              zIndex: isWinningCard ? 100 : 2,
                              marginTop: shiftMargin,
                            }}
                          >
                            <PlayingCard
                              card={{
                                suit: card.suit,
                                rank: card.rank,
                                isWild: card.isWild,
                                isDead: card.isDead,
                              }}
                              size={cardSize}
                              showBack={isReelSpinning} // Card backs show only while active spinning is running
                            />
                            {/* Display custom badge overlays only when NOT spinning & row is scoring */}
                            {!isReelSpinning && isScoringRow && card.isWild && (
                              <Box
                                className="card-special-badge"
                                style={{
                                  backgroundColor: card.wildMultiplier ? "#d35400" : "#d4ac0d",
                                  color: "#fff",
                                }}
                              >
                                {card.wildMultiplier ? `WILD ${card.wildMultiplier}x` : "WILD"}
                              </Box>
                            )}
                            {!isReelSpinning && isScoringRow && card.isDead && (
                              <Box
                                className="card-special-badge"
                                style={{
                                  backgroundColor: "#555",
                                  color: "#fff",
                                }}
                              >
                                  DEAD
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  );
                })}
              </Group>

              {/* Centered Floating Win Indicator over playfield */}
              {activeWinLineIdx !== null && winningLines[activeWinLineIdx] && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeWinLineIdx}
                    initial={{ opacity: 0, y: 35, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1.1 }}
                    exit={{ opacity: 0, y: -35, scale: 0.8 }}
                    transition={{ duration: 0.45 }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 500,
                      pointerEvents: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(20, 15, 12, 0.95)",
                      border: `2px solid ${winningLines[activeWinLineIdx].wildMultiplier > 1 ? "#ff9900" : "#c79e57"}`,
                      borderRadius: "16px",
                      padding: "16px 24px",
                      boxShadow: "0 0 35px rgba(0, 0, 0, 0.95), 0 0 15px rgba(199, 158, 87, 0.35)",
                    }}
                  >
                    <Text
                      size="xs"
                      fw={700}
                      tt="uppercase"
                      c={winningLines[activeWinLineIdx].wildMultiplier > 1 ? "orange" : "var(--color-gold-bright)"}
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {winningLines[activeWinLineIdx].lineName} Win
                    </Text>
                    <Text
                      size="xl"
                      fw={900}
                      c="green"
                      style={{
                        fontSize: "2.2rem",
                        lineHeight: 1.1,
                        textShadow: "0 0 12px rgba(0, 255, 0, 0.6)",
                        marginTop: 4,
                      }}
                    >
                      +{winningLines[activeWinLineIdx].payout.toLocaleString()} cr
                    </Text>
                    <Text size="xs" c={clubTokens.text.primary} fw={600} mt={4}>
                      {winningLines[activeWinLineIdx].handResult.rank.toUpperCase().replace(/-/g, " ")}
                      {winningLines[activeWinLineIdx].wildMultiplier > 1 && ` (x${winningLines[activeWinLineIdx].wildMultiplier} Wild)`}
                    </Text>
                  </motion.div>
                </AnimatePresence>
              )}
            </Box>

            {/* Swapped Bottom Spin Control Bar - Now includes Select Active Lines */}
            <Box className="lr-glass-panel" p="md">
              <Stack gap="md">
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Group gap="sm" style={{ flexGrow: 1 }}>
                    <Text size="xs" c={clubTokens.text.muted}>
                      Autoplay
                    </Text>
                    <Switch
                      checked={autoPlay}
                      onChange={(e) => {
                        playSfx("button-click.ogg");
                        setAutoPlay(e.currentTarget.checked);
                      }}
                      disabled={isSpinning}
                      color="red"
                    />
                  </Group>
                  
                  <ClubButton
                    fancy
                    size="lg"
                    disabled={isSpinning || credits < betAmount * activeLinesCount}
                    onClick={() => handleSpin()}
                    style={{ width: isMobile ? "100%" : 260, height: 52 }}
                  >
                    SPIN
                  </ClubButton>
                </Group>

                {/* Select Active Lines buttons under the spin button section */}
                <Stack gap="xs" style={{ borderTop: `1px solid ${clubTokens.surface.brassStroke}`, paddingTop: 12 }}>
                  <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                    <Text size="xs" fw={600} c={clubTokens.text.brass}>
                      Select Active Lines (Bet Multiplier)
                    </Text>
                    <Text size="xxs" c={clubTokens.text.muted}>
                      More lines increases total bet cost
                    </Text>
                  </Group>
                  <Group grow gap="xs" wrap="nowrap">
                    {[1, 2, 3, 4].map((mult) => (
                      <ClubButton
                        key={mult}
                        variant={betMultiplier === mult ? "filled" : "outline"}
                        size="xs"
                        disabled={isSpinning}
                        onClick={() => {
                          playSfx("button-click.ogg");
                          setBetMultiplier(mult);
                        }}
                        style={{ fontSize: "0.75rem", padding: "4px 2px" }}
                      >
                        {MULTIPLIER_LINES[mult]}
                      </ClubButton>
                    ))}
                  </Group>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Right Side Control Board */}
        <Box className="lr-side-panel-right">
          <Stack gap="xs">
            {/* Ledger statistics board - Last Win stat row is always rendered, never pops out */}
            <Box className="lr-glass-panel" p="md">
              <Text size="sm" fw={600} c={clubTokens.text.brass} mb="xs">
                Wallet & Stakes
              </Text>
              <Stack gap="xs">
                <Stack gap={2}>
                  <Text size="xs" c={clubTokens.text.muted}>CREDITS:</Text>
                  <Text size="md" fw={700} c={clubTokens.text.goldHighlight}>
                    {credits.toLocaleString()} cr
                  </Text>
                </Stack>
                
                <Stack gap={2}>
                  <Text size="xs" c={clubTokens.text.muted}>TOTAL BET:</Text>
                  <Text size="md" fw={700} c={clubTokens.text.brass}>
                    {(betAmount * activeLinesCount).toLocaleString()} cr
                  </Text>
                </Stack>
                
                <Stack gap={2}>
                  <Text size="xs" c={lastWinAmount !== null && lastWinAmount > 0 ? "green" : clubTokens.text.muted} fw={600}>
                    LAST WIN:
                  </Text>
                  <Text
                    size="md"
                    fw={800}
                    c={lastWinAmount !== null && lastWinAmount > 0 ? "green" : clubTokens.text.primary}
                    style={{
                      textShadow: lastWinAmount !== null && lastWinAmount > 0 ? "0 0 10px rgba(0, 255, 0, 0.4)" : "none",
                      transition: "color 0.25s ease, text-shadow 0.25s ease",
                    }}
                  >
                    {lastWinAmount !== null && lastWinAmount > 0 ? `+${lastWinAmount.toLocaleString()} cr` : "0 cr"}
                  </Text>
                </Stack>
              </Stack>
            </Box>

            {/* Bet size controls */}
            <Box className="lr-glass-panel" p="md">
              <Text size="sm" fw={600} c={clubTokens.text.brass} mb="xs">
                Place Bet
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c={clubTokens.text.muted}>Base Bet:</Text>
                  <Text size="sm" fw={600}>{betAmount} cr</Text>
                </Group>
                <Group grow gap="xs">
                  <ClubButton
                    variant="outline"
                    size="xs"
                    disabled={betAmount <= config.minBet || isSpinning}
                    onClick={() => {
                      playSfx("button-click.ogg");
                      setBetAmount((b) => Math.max(config.minBet, b - 5));
                    }}
                  >
                    -5
                  </ClubButton>
                  <ClubButton
                    variant="outline"
                    size="xs"
                    disabled={betAmount >= config.maxBet || isSpinning}
                    onClick={() => {
                      playSfx("button-click.ogg");
                      setBetAmount((b) => Math.min(config.maxBet, b + 5));
                    }}
                  >
                    +5
                  </ClubButton>
                </Group>
                <Group grow gap="xs">
                  <ClubButton
                    variant="outline"
                    size="xs"
                    disabled={isSpinning}
                    onClick={() => {
                      playSfx("button-click.ogg");
                      setBetAmount(config.minBet);
                    }}
                  >
                    Min
                  </ClubButton>
                  <ClubButton
                    variant="outline"
                    size="xs"
                    disabled={isSpinning}
                    onClick={() => {
                      playSfx("button-click.ogg");
                      setBetAmount(config.maxBet);
                    }}
                  >
                    Max
                  </ClubButton>
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Settings Modal component integration */}
      <GameSettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />

      {/* Standardized Sommelier Live Guide overlay */}
      {showTutorial && (
        <SommelierLiveGuide
          gameId="lignee_royale"
          onStepChange={(mock) => {
            if (mock) {
              if (mock.betMultiplier) {
                setBetMultiplier(mock.betMultiplier as number);
              }
              if (mock.betAmount) {
                setBetAmount(mock.betAmount as number);
              }
              if (mock.isTutorialWin) {
                handlePreRiggedTutorialSpin();
              }
            }
          }}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </Box>
  );
}
export default LigneeRoyaleRoot;
