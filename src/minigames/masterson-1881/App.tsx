import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  ScrollArea,
  Modal,
  Table,
} from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import { UnifiedGameHeader } from "@/components/ui/UnifiedGameHeader";
import { GameSettingsModal } from "@/components/ui/GameSettingsModal";
import { SommelierLiveGuide } from "@/components/ui/SommelierLiveGuide";
import { clubTokens } from "@/theme/clubTokens";
import { motion, AnimatePresence } from "framer-motion";

import { useMastertonEngine } from "./engine/useMastertonEngine";
import { rouletteNumbers, mastersonGameConfig, validateOutcomeAgainstRig, bettorStrategyDescriptions, type BettorProfile, type BettorStrategy } from "@/config/minigames/mastersonRules";
import { computeMastersonReturn, type ClubTableReturnDetail, type OublietteSettlementProfile } from "@/game/sessionSettlement";

import "./masterson.css";

const ROULETTE_ROWS = [
  {
    numbers: ["3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"],
    columnTarget: "Column_3",
    columnLabel: "2 to 1",
  },
  {
    numbers: ["2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"],
    columnTarget: "Column_2",
    columnLabel: "2 to 1",
  },
  {
    numbers: ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"],
    columnTarget: "Column_1",
    columnLabel: "2 to 1",
  },
];

const SEAT_COLORS: Record<string, string> = {
  "Seat 1": "#d32f2f", // Crimson Red
  "Seat 2": "#ffb300", // Amber Gold
  "Seat 3": "#2e7d32", // Emerald Green
  "Seat 4": "#7b1fa2", // Royal Amethyst
  "Seat 5": "#0288d1", // Cerulean Blue
};

const WHEEL_NUMBERS = [
  "0", "28", "9", "26", "30", "11", "7", "20", "32", "17", "5", "22", "34", "15", "3", "24", "36", "13", "1",
  "00", "27", "10", "25", "29", "12", "8", "19", "31", "18", "6", "21", "33", "16", "4", "23", "35", "14", "2"
];

const ODDS_LEDGER = [
  { type: "Single Number", covered: "1 number", payout: "35 to 1" },
  { type: "Street Bet", covered: "3 numbers", payout: "11 to 1" },
  { type: "Corner Bet", covered: "4 numbers", payout: "8 to 1" },
  { type: "Double Street", covered: "6 numbers", payout: "5 to 1" },
  { type: "Columns / Dozens", covered: "12 numbers", payout: "2 to 1" },
  { type: "Even / Odd / Red / Black", covered: "18 numbers", payout: "1 to 1" },
  { type: "Low (1-18) / High (19-36)", covered: "18 numbers", payout: "1 to 1" },
];

interface MastertonRootProps {
  sessionCredits: number;
  settlement?: OublietteSettlementProfile;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
  onAbandonRun?: () => void;
  onPauseToClub?: () => void;
  isTutorial?: boolean;
  gameModeId?: string;
}


function isNumberAffectedByTarget(numStr: string, target: string | null): boolean {
  if (!target) return false;
  const numObj = rouletteNumbers.find((n) => n.value === numStr);
  if (!numObj) return false;
  return validateOutcomeAgainstRig(numObj, { severity: "high", target });
}

export function MastertonRoot({
  sessionCredits,
  settlement,
  onReturnToClubMenu,
  onAbandonRun,
  isTutorial = false,
  gameModeId,
}: MastertonRootProps) {
  const realEngine = useMastertonEngine(gameModeId);
  const [mockState, setMockState] = useState<Record<string, unknown> | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);

  // Proxy active engine state to support Pazillus interactive live-render guide
  const engine = useMemo(() => {
    if (!mockState) return realEngine;
    return {
      ...realEngine,
      ...mockState,
    };
  }, [realEngine, mockState]);

  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(isTutorial);
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [selectedBettorCard, setSelectedBettorCard] = useState<string | null>(null);

  // Close card details modal instantly when spin begins
  useEffect(() => {
    if (engine.phase === "SPINNING") {
      setSelectedBettorCard(null);
    }
  }, [engine.phase]);

  const selectedBettor = useMemo<BettorProfile | null>(() => {
    if (!selectedBettorCard) return null;
    const active = engine.activeBettors.find(b => b.id === selectedBettorCard);
    if (active) return active;
    const evicted = engine.evictedBettors[selectedBettorCard];
    if (evicted) {
      return {
        id: selectedBettorCard,
        name: evicted.name,
        chips: evicted.chips,
        strategy: evicted.strategy as BettorStrategy,
        initial_chips: evicted.chips,
        loss_tolerance_pct: 0.5,
        current_suspicion: 10,
        max_suspicion: 10,
        current_consecutive_losses: 0,
        max_consecutive_losses: 5,
        double_bet_frequency: 0,
        herd_mentality_pct: 0.3,
        total_spins_bet: 0,
        total_amount_bet: 0,
        recent_spins: [],
      };
    }
    return null;
  }, [selectedBettorCard, engine.activeBettors, engine.evictedBettors]);

  // Wheel swirling and countdown timing states
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(42);
  const [timer, setTimer] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTimerRef = useRef<number | null>(null);
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer !== null && prevTimerRef.current !== null && timer > prevTimerRef.current + 0.5) {
      setIsPulsing(true);
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      pulseTimeoutRef.current = setTimeout(() => {
        setIsPulsing(false);
        pulseTimeoutRef.current = null;
      }, 300);
    }
    prevTimerRef.current = timer;
  }, [timer]);

  // Clean up pulse timeout on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  const isResetting = timer !== null && prevTimerRef.current !== null && timer > prevTimerRef.current + 0.5;

  interface ScheduledBetJob {
    seatId: string;
    triggerTime: number;
    placed: boolean;
  }
  const scheduledBetsRef = useRef<ScheduledBetJob[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [neonFlashSeat, setNeonFlashSeat] = useState<string | null>(null);
  const [recapVisible, setRecapVisible] = useState(false);

  // Sync phase changes to reset timer back to null so interval doesn't stick
  useEffect(() => {
    if (engine.phase === "BETTING" || engine.phase === "EVALUATION" || engine.phase === "SUMMARY") {
      setTimer(null);
    }
  }, [engine.phase]);

  // Keep refs of wheelRotation and ballAngle so we can access them in the timer resolution
  // without triggering timer useEffect re-registration
  const wheelRotationRef = useRef(wheelRotation);
  const ballAngleRef = useRef(ballAngle);

  useEffect(() => {
    wheelRotationRef.current = wheelRotation;
  }, [wheelRotation]);

  useEffect(() => {
    ballAngleRef.current = ballAngle;
  }, [ballAngle]);

  // Landing state refs to preserve across animation frames
  const landingRef = useRef<{
    active: boolean;
    startWheelRot: number;
    finalWheelRot: number;
    startBallAngle: number;
    finalBallAngle: number;
    elapsedMs: number;
  } | null>(null);

  // Sync isTutorial trigger
  useEffect(() => {
    if (isTutorial) {
      setShowTutorial(true);
    }
  }, [isTutorial]);

  // SVG wheel rotation & swirling ball loop
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    if (engine.phase !== "SPINNING" || isHolding) {
      return;
    }
    let animId: number;
    const tick = () => {
      if (landingRef.current && landingRef.current.active) {
        // Landing eased drop-in animation (2.5 seconds)
        landingRef.current.elapsedMs += 16.7; // ~60fps
        const t = Math.min(1, landingRef.current.elapsedMs / 2500);
        const easeOut = 1 - Math.pow(1 - t, 3); // cubic ease-out

        const currentWheelRot = landingRef.current.startWheelRot + (landingRef.current.finalWheelRot - landingRef.current.startWheelRot) * easeOut;
        const currentBallAngle = landingRef.current.startBallAngle + (landingRef.current.finalBallAngle - landingRef.current.startBallAngle) * easeOut;
        const currentBallRad = 42 - (42 - 34) * easeOut; // drop inward to pocket radius (34)

        setWheelRotation(currentWheelRot % 360);
        setBallAngle(currentBallAngle % 360);
        setBallRadius(currentBallRad);

        if (t >= 1) {
          landingRef.current.active = false;
          setIsHolding(true);
          setTimeout(() => {
            engine.resolveSpin();
            setRecapVisible(true);
            setIsHolding(false);
          }, 1000);
        }
      } else {
        // Normal constant spin rotation
        setWheelRotation((prev) => (prev + 1.5) % 360);
        setBallAngle((prev) => (prev - 4.5) % 360);
        setBallRadius(42);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [engine.phase, engine.resolveSpin, engine, isHolding]);

  const isTimerNull = timer === null;

  // 100ms interval countdown loop for last-minute bets
  useEffect(() => {
    if (engineRef.current.phase !== "SPINNING" || isTimerNull) {
      return;
    }
    if (landingRef.current && landingRef.current.active) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === null) return null;
        if (prev <= 0.1) {
          clearInterval(interval);
          // Lock outcome matching chosen rig target
          const result = engineRef.current.determineResultAndLock();

          // Initialize eased landing coordinates
          const pocketIdx = WHEEL_NUMBERS.indexOf(result.value);
          const pocketAngle = pocketIdx * (360 / 38);

          const currentRot = wheelRotationRef.current;
          const currentBallAngle = ballAngleRef.current;

          // Helper for safe modulo
          const mod = (n: number, m: number) => ((n % m) + m) % m;

          // Align pocket at bottom-center (90 degrees)
          const targetRot = mod(180 - pocketAngle, 360);
          const finalWheelRot = currentRot + (360 * 3) + mod(targetRot - currentRot, 360);

          // Align ball at bottom-center (90 degrees)
          const targetBallAngle = 90;
          const finalBallAngle = currentBallAngle - (360 * 3) - mod(currentBallAngle - targetBallAngle, 360);

          landingRef.current = {
            active: true,
            startWheelRot: currentRot,
            finalWheelRot: finalWheelRot,
            startBallAngle: currentBallAngle,
            finalBallAngle: finalBallAngle,
            elapsedMs: 0,
          };
          return 0;
        }

        const nextTimer = prev - 0.1;

        // Trigger any scheduled bets as timer counts down
        const nextScheduled = scheduledBetsRef.current.map((job) => {
          if (!job.placed && nextTimer <= job.triggerTime) {
            engineRef.current.placeSingleBettorBet(job.seatId);
            setNeonFlashSeat(job.seatId);
            setTimeout(() => setNeonFlashSeat(null), 850);
            return { ...job, placed: true };
          }
          return job;
        });
        scheduledBetsRef.current = nextScheduled;

        return nextTimer;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isTimerNull]);

  // Cash out and return commission to club
  const handleCashOut = () => {
    if (onReturnToClubMenu) {
      const activeSettlement = settlement || {
        buyIn: 1000,
        maxReturnMultipleOfBuyIn: 3,
        capModifierProduct: 1,
        overachievement: {
          capMultiple: 3,
          buyInSlab: 0.5,
          tierStepMultiple: 1,
          bonusMultipleOfBuyInPerTier: 0.1,
        },
      };

      let endReason = `Voluntary Cash-out at spin ${engine.spinCount}`;
      if (engine.gameOverReason === "MAX_SPINS") {
        endReason = "Shift Completed — 30 spins completed";
      } else if (engine.gameOverReason === "NO_PLAYERS") {
        endReason = "Table Isolated — no active players left";
      }

      const stats = [
        { label: "Spins Conducted", value: engine.spinCount },
        { label: "Table House Ledger", value: `${engine.tableHouseLedger.toLocaleString()} cr` },
        { label: "Commission Earned", value: `${engine.accumulatedCommission.toLocaleString()} cr` },
        { label: "Active Bettors", value: engine.activeBettors.length },
        { label: "Evicted Bettors", value: Object.keys(engine.evictedBettors).length }
      ];

      onReturnToClubMenu({
        ...computeMastersonReturn(engine.accumulatedCommission, activeSettlement),
        tableRound: engine.spinCount,
        endReason,
        stats,
      });
    }
  };

  // Helper to check if a specific number or category is chosen as rig target
  const isRigTarget = (target: string) => {
    return engine.selectedRig.target === target;
  };

  // Universal toggle handler for click-to-rig on the layout matrix
  const handleToggleRig = (severity: "low" | "mid" | "high", target: string) => {
    if (engine.phase !== "BETTING" && engine.phase !== "SPINNING") return;
    if (isRigTarget(target)) {
      engine.selectRig("none", null);
    } else {
      engine.selectRig(severity, target);
    }
  };

  // Trigger betting round
  const handlePlaceInitialBets = () => {
    engine.placeInitialBets(true);
    setTimer(mastersonGameConfig.betting_duration_seconds);
    setRecapVisible(false);

    const duration = mastersonGameConfig.betting_duration_seconds;
    const cutoff = mastersonGameConfig.no_more_bets_seconds;
    const activeBettors = engine.activeBettors;

    const scheduled = activeBettors.map((bettor) => {
      // Pick a random trigger time between (cutoff + 0.5) and (duration - 0.5)
      const triggerTime = Math.random() * (duration - cutoff - 1.0) + cutoff + 0.5;
      return {
        seatId: bettor.id,
        triggerTime,
        placed: false,
      };
    });
    scheduledBetsRef.current = scheduled;
  };

  // Stacked, offset, color-coded wagers rendering with visual splits support
  const renderWagerChips = (target: string) => {
    const wagersByBettor: { bettorId: string; totalAmount: number }[] = [];

    // Helper to compute bet share for covered numbers
    const getWagerWeight = (wTarget: string, cellTarget: string): number => {
      if (wTarget === cellTarget) return 1.0;

      if (wTarget.startsWith("Trio_")) {
        const parts = wTarget.split("_").slice(1);
        if (parts.includes(cellTarget)) {
          return 1.0 / 3;
        }
      }

      const cellVal = parseInt(cellTarget, 10);
      if (isNaN(cellVal)) return 0;

      if (wTarget.startsWith("Street_")) {
        const parts = wTarget.split("_");
        const start = parseInt(parts[1] || "", 10);
        const end = parseInt(parts[2] || "", 10);
        if (!isNaN(start) && !isNaN(end) && cellVal >= start && cellVal <= end) {
          return 1.0 / 3;
        }
      }
      if (wTarget.startsWith("Corner_")) {
        const parts = wTarget.split("_").slice(1);
        if (parts.includes(cellTarget)) {
          return 1.0 / 4;
        }
      }
      if (wTarget.startsWith("DoubleStreet_")) {
        const parts = wTarget.split("_");
        const start = parseInt(parts[1] || "", 10);
        const end = parseInt(parts[2] || "", 10);
        if (!isNaN(start) && !isNaN(end) && cellVal >= start && cellVal <= end) {
          return 1.0 / 6;
        }
      }
      return 0;
    };

    engine.activeBettors.forEach((bettor) => {
      const wagers = (engine.currentBets[bettor.id] || []).map((w) => ({
        ...w,
        weight: getWagerWeight(w.target, target),
      })).filter((w) => w.weight > 0);

      if (wagers.length > 0) {
        const total = wagers.reduce((sum, w) => sum + (w.amount * w.weight), 0);
        if (total > 0) {
          wagersByBettor.push({ bettorId: bettor.id, totalAmount: total });
        }
      }
    });

    if (wagersByBettor.length === 0) return null;

    return (
      <Box
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2px",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {wagersByBettor.map((w, idx) => {
          const color = SEAT_COLORS[w.bettorId] || "#ffe066";
          const roundedAmount = Math.round(w.totalAmount);
          const displayVal = roundedAmount >= 1000 ? `${(roundedAmount / 1000).toFixed(0)}k` : roundedAmount;
          return (
            <motion.div
              key={w.bettorId}
              title={`${w.bettorId}: $${roundedAmount}`}
              initial={{ opacity: 0, scale: 2.2, y: -60 }}
              animate={{ opacity: 1, scale: 1, y: -idx * 3 }}
              transition={{ type: "spring", stiffness: 120, damping: 12, mass: 0.8 }}
              style={{
                background: `radial-gradient(circle, #ffffff 0%, ${color} 65%, #000000 100%)`,
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1.5px dashed rgba(255, 255, 255, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: "bold",
                color: "#ffffff",
                textShadow: "1px 1px 1px #000000",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
              }}
            >
              {displayVal}
            </motion.div>
          );
        })}
      </Box>
    );
  };

  // Detect mobile viewport to disable auto-scaling and stack player cards below
  const isMobileLayout = typeof window !== "undefined" && window.innerWidth < 768;

  const gameContent = (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "12px",
        height: isMobileLayout ? "auto" : "100%",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <UnifiedGameHeader
        gameTitle="Masterton 1881"
        walletAmount={sessionCredits}
        currentRound={engine.spinCount}
        roundLabel="Spin"
        onShowSettings={() => setShowSettings(true)}
        onAbandonRun={onAbandonRun}
        extraButtons={
          <ClubButton
            size="xs"
            variant="outline"
            onClick={() => setShowOddsModal(true)}
          >
            Odds
          </ClubButton>
        }
      />

      {/* Main Dashboard Grid */}
      <Box
        style={{
          display: "flex",
          flexDirection: isMobileLayout ? "column" : "row",
          gap: "12px",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left Column: Playfield, Wheel & Action Deck */}
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: isMobileLayout ? "unset" : "0 0 66.666%",
            width: isMobileLayout ? "100%" : undefined,
            minHeight: 0,
          }}
        >
          {/* Walnut Felt Layout Matrix */}
          <Stack
            className="masterson-felt-board"
            p="sm"
            style={{
              flex: isMobileLayout ? "unset" : 1,
              minHeight: 0,
              justifyContent: "center",
              width: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >

            {/* Board grid */}
            <Box style={{ display: "flex", gap: "4px", width: 767, flexShrink: 0, margin: "0 auto", alignItems: "stretch" }}>
              {/* Green Numbers 0 and 00 */}
              <Box style={{ display: "flex", flexDirection: "column", gap: "4px", width: 50, height: 182, flexShrink: 0 }}>
                <Box
                  className={`masterson-grid-cell green ${isRigTarget("0") ? "active-rig" : ""} ${engine.selectedRig.target && isNumberAffectedByTarget("0", engine.selectedRig.target) ? "highlight-yellow" : ""} ${isNumberAffectedByTarget("0", hoveredTarget) ? "highlight-blue" : ""} ${(engine.phase === "EVALUATION" || engine.phase === "SUMMARY") && engine.spinResult?.value === "0" ? "winning-highlight" : ""}`}
                  style={{
                    flex: 1,
                    width: 50,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                  onClick={() => handleToggleRig("high", "0")}
                  onMouseEnter={() => setHoveredTarget("0")}
                  onMouseLeave={() => setHoveredTarget(null)}
                >
                  <Text size="xs">0</Text>
                  {renderWagerChips("0")}
                </Box>
                <Box
                  className={`masterson-grid-cell green ${isRigTarget("00") ? "active-rig" : ""} ${engine.selectedRig.target && isNumberAffectedByTarget("00", engine.selectedRig.target) ? "highlight-yellow" : ""} ${isNumberAffectedByTarget("00", hoveredTarget) ? "highlight-blue" : ""} ${(engine.phase === "EVALUATION" || engine.phase === "SUMMARY") && engine.spinResult?.value === "00" ? "winning-highlight" : ""}`}
                  style={{
                    flex: 1,
                    width: 50,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                  onClick={() => handleToggleRig("high", "00")}
                  onMouseEnter={() => setHoveredTarget("00")}
                  onMouseLeave={() => setHoveredTarget(null)}
                >
                  <Text size="xs">00</Text>
                  {renderWagerChips("00")}
                </Box>
              </Box>

              {/* Grid 1-36 Numbers + Column Bets (12 Equal Columns + 1.3 Expanded Column Bet) */}
              <Box style={{ display: "grid", gridTemplateColumns: "repeat(12, 50px) 65px", gap: "4px", flexShrink: 0, width: 713 }}>
                {ROULETTE_ROWS.flatMap((row) => [
                  ...row.numbers.map((numStr) => {
                    const numObj = rouletteNumbers.find((n) => n.value === numStr)!;
                    const isRed = numObj.color === "Red";

                    return (
                      <Box
                        key={numStr}
                        className={`masterson-grid-cell number ${isRed ? "red" : "black"} ${isRigTarget(numStr) ? "active-rig" : ""} ${engine.selectedRig.target && isNumberAffectedByTarget(numStr, engine.selectedRig.target) ? "highlight-yellow" : ""} ${isNumberAffectedByTarget(numStr, hoveredTarget) ? "highlight-blue" : ""} ${(engine.phase === "EVALUATION" || engine.phase === "SUMMARY") && engine.spinResult?.value === numStr ? "winning-highlight" : ""}`}
                        style={{
                          width: 50,
                          height: 58,
                          boxSizing: "border-box",
                          position: "relative",
                        }}
                        onClick={() => handleToggleRig("high", numStr)}
                        onMouseEnter={() => setHoveredTarget(numStr)}
                        onMouseLeave={() => setHoveredTarget(null)}
                      >
                        <Text size="xs">{numStr}</Text>
                        {renderWagerChips(numStr)}
                      </Box>
                    );
                  }),
                  // Column bet cell at the end of each row
                  (
                    <Box
                      key={row.columnTarget}
                      className={`masterson-grid-cell outside ${isRigTarget(row.columnTarget) ? "active-rig" : ""} ${isNumberAffectedByTarget(row.columnTarget, hoveredTarget) ? "highlight-blue" : ""}`}
                      style={{
                        width: 65,
                        height: 58,
                        boxSizing: "border-box",
                        background: "rgba(255, 255, 255, 0.05)",
                        position: "relative",
                      }}
                      onClick={() => handleToggleRig("mid", row.columnTarget)}
                      onMouseEnter={() => setHoveredTarget(row.columnTarget)}
                      onMouseLeave={() => setHoveredTarget(null)}
                    >
                      <Text style={{ fontSize: "10px" }} c={clubTokens.text.primary}>
                        {row.columnLabel}
                      </Text>
                      {renderWagerChips(row.columnTarget)}
                    </Box>
                  )
                ])}
              </Box>
            </Box>

            {/* Outside Bet Dozens Layout */}
            <Box style={{ display: "flex", gap: "4px", width: 767, flexShrink: 0, margin: "4px auto 0" }}>
              <Box style={{ width: 50, flexShrink: 0 }} />
              <Box style={{ display: "flex", width: 644, gap: "4px", flexShrink: 0 }}>
                {["Dozen_1", "Dozen_2", "Dozen_3"].map((doz) => {
                  const friendlyLabels: Record<string, string> = {
                    Dozen_1: "1st Dozen",
                    Dozen_2: "2nd Dozen",
                    Dozen_3: "3rd Dozen",
                  };
                  const label = friendlyLabels[doz] || doz.replace("_", " ");
                  return (
                    <Box
                      key={doz}
                      className={`masterson-grid-cell outside ${isRigTarget(doz) ? "active-rig" : ""} ${isNumberAffectedByTarget(doz, hoveredTarget) ? "highlight-blue" : ""}`}
                      style={{
                        width: 212,
                        flexShrink: 0,
                        height: 40,
                        boxSizing: "border-box",
                        background: "rgba(255, 255, 255, 0.05)",
                        position: "relative",
                      }}
                      onClick={() => handleToggleRig("mid", doz)}
                      onMouseEnter={() => setHoveredTarget(doz)}
                      onMouseLeave={() => setHoveredTarget(null)}
                    >
                      <Text size="xs" c={clubTokens.text.primary}>{label}</Text>
                      {renderWagerChips(doz)}
                    </Box>
                  );
                })}
              </Box>
              <Box style={{ width: 65, flexShrink: 0 }} />
            </Box>

            {/* Outside Bet Categories Layout */}
            <Box style={{ display: "flex", gap: "4px", width: 767, flexShrink: 0, margin: "4px auto 0" }}>
              <Box style={{ width: 50, flexShrink: 0 }} />
              <Box style={{ display: "flex", width: 644, gap: "4px", flexShrink: 0 }}>
                {["Low_1_18", "Even", "Red", "Black", "Odd", "High_19_36"].map((out) => {
                  const friendlyLabels: Record<string, string> = {
                    Low_1_18: "Low 1-18",
                    High_19_36: "High 19-36",
                  };
                  const label = friendlyLabels[out] || out.replace(/_/g, " ");
                  const bg = out === "Red" ? "rgba(211, 47, 47, 0.3)" : out === "Black" ? "rgba(26, 26, 26, 0.7)" : "rgba(255,255,255,0.05)";
                  return (
                    <Box
                      key={out}
                      className={`masterson-grid-cell outside ${isRigTarget(out) ? "active-rig" : ""} ${isNumberAffectedByTarget(out, hoveredTarget) ? "highlight-blue" : ""}`}
                      style={{
                        width: 104,
                        flexShrink: 0,
                        height: 40,
                        boxSizing: "border-box",
                        background: bg,
                        position: "relative",
                      }}
                      onClick={() => handleToggleRig("low", out)}
                      onMouseEnter={() => setHoveredTarget(out)}
                      onMouseLeave={() => setHoveredTarget(null)}
                    >
                      <Text size="xs" c={clubTokens.text.primary}>{label}</Text>
                      {renderWagerChips(out)}
                    </Box>
                  );
                })}
              </Box>
              <Box style={{ width: 65, flexShrink: 0 }} />
            </Box>
          </Stack>

          {/* Slide-down SVG Roulette Wheel Panel (Displays bottom arc only) */}
          <Box
            className={`masterson-wheel-slide-panel ${engine.phase === "SPINNING" ? "spinning" : ""}`}
            style={{
              position: "relative",
              background: `linear-gradient(180deg, ${clubTokens.surface.panel} 0%, rgba(20,16,13,0.95) 100%)`,
              border: `2px solid ${clubTokens.surface.brassStroke}`,
              borderRadius: "8px",
              boxShadow: "inset 0 4px 16px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {/* Wheel Viewport clipping container */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "170px", // displays the bottom third curve
                overflow: "hidden",
              }}
            >
              {/* SVG Rotating Wheel Group */}
              <svg
                viewBox="0 0 100 100"
                style={{
                  position: "absolute",
                  top: "-300px", // Shifted up so the bottom arc is clearly visible
                  left: "50%",
                  transform: `translateX(-50%)`,
                  width: "480px",
                  height: "480px",
                }}
              >
                <defs>
                  {/* Ornate metallic gold-brass rim gradient */}
                  <linearGradient id="wheelBrass" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cf9e52" />
                    <stop offset="30%" stopColor="#ffd700" />
                    <stop offset="45%" stopColor="#ffffff" />
                    <stop offset="55%" stopColor="#ffd700" />
                    <stop offset="70%" stopColor="#cf9e52" />
                    <stop offset="100%" stopColor="#8a6508" />
                  </linearGradient>

                  {/* Rich mahogany wood grain backing */}
                  <radialGradient id="wheelMahogany" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3d2216" />
                    <stop offset="60%" stopColor="#251209" />
                    <stop offset="100%" stopColor="#100502" />
                  </radialGradient>
                </defs>

                <g transform={`rotate(${wheelRotation} 50 50)`}>
                  {/* Wheel Background (Wood Rim & Gold Accent Ring) */}
                  <circle cx="50" cy="50" r="46" fill="url(#wheelMahogany)" stroke="url(#wheelBrass)" strokeWidth="2.5" />
                  <circle cx="50" cy="50" r="39" fill="none" stroke="url(#wheelBrass)" strokeWidth="0.8" opacity="0.6" />

                  {/* Pockets and segments */}
                  {WHEEL_NUMBERS.map((num, idx) => {
                    const angle = idx * (360 / 38);
                    const isRed = rouletteNumbers.find((n) => n.value === num)?.color === "Red";
                    const isGreen = num === "0" || num === "00";
                    const pocketColor = isGreen ? "#2e7d32" : isRed ? "#d32f2f" : "#111111";

                    return (
                      <g key={num} transform={`rotate(${angle} 50 50)`}>
                        {/* Segment Pocket Slice */}
                        <path
                          d={`M 50,50 L ${50 + 38 * Math.cos((Math.PI / 180) * (-90 - 360 / 38 / 2))},${50 + 38 * Math.sin((Math.PI / 180) * (-90 - 360 / 38 / 2))} A 38,38 0 0,1 ${50 + 38 * Math.cos((Math.PI / 180) * (-90 + 360 / 38 / 2))},${50 + 38 * Math.sin((Math.PI / 180) * (-90 + 360 / 38 / 2))} Z`}
                          fill={pocketColor}
                          stroke="#2a231f"
                          strokeWidth="0.25"
                        />
                        {/* Number Text (oriented outward) */}
                        <text
                          x="50"
                          y="18"
                          fill="#ffffff"
                          fontSize="3.2"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform="rotate(0 50 18)"
                        >
                          {num}
                        </text>
                      </g>
                    );
                  })}

                  {/* Pocket tracks ambient depth shadows to create chiseled 3D bowl effect */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="3" />
                  <circle cx="50" cy="50" r="28.5" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.2" />

                  {/* Inner pocket divider circle (Center Mahogany Turret with Gold Trim) */}
                  <circle cx="50" cy="50" r="28" fill="url(#wheelMahogany)" stroke="url(#wheelBrass)" strokeWidth="0.8" />
                </g>
              </svg>

              {/* Symmetrical Dual-Half SVG Countdown Timer Ring (Positioned statically, wrapping outside path) */}
              {engine.phase === "SPINNING" && timer !== null && (
                <svg
                  viewBox="0 0 100 100"
                  style={{
                    position: "absolute",
                    top: "-300px",
                    left: "50%",
                    transform: "translateX(-50%)", // no rotate(-90deg) to keep bottom center at 50,98
                    width: "480px",
                    height: "480px",
                    pointerEvents: "none",
                  }}
                >
                  {/* Left Symmetrical Progress quarter-arc — path runs center→tip so arc drains from center outward to 9 o'clock */}
                  <path
                    d="M 50,94 A 44,44 0 0,1 6,50"
                    fill="none"
                    stroke={isPulsing ? "#ffeb3b" : clubTokens.surface.brassStroke}
                    strokeWidth="2.5"
                    strokeDasharray="69.1"
                    strokeDashoffset={69.1 * (1 - timer / mastersonGameConfig.betting_duration_seconds)}
                    strokeLinecap="round"
                    opacity="0.95"
                    style={{
                      filter: isPulsing
                        ? "drop-shadow(0px 0px 8px rgba(255, 235, 59, 0.95))"
                        : "drop-shadow(0px 0px 4px rgba(199,158,87,0.7))",
                      transition: isResetting
                        ? "stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.05s ease, filter 0.05s ease"
                        : isPulsing
                        ? "stroke-dashoffset 0.1s linear, stroke 0.3s ease-out, filter 0.3s ease-out"
                        : "stroke-dashoffset 0.1s linear, stroke 0.2s ease, filter 0.2s ease",
                    }}
                  />
                  {/* Right Symmetrical Progress quarter-arc — path runs center→tip so arc drains from center outward to 3 o'clock */}
                  <path
                    d="M 50,94 A 44,44 0 0,0 94,50"
                    fill="none"
                    stroke={isPulsing ? "#ffeb3b" : clubTokens.surface.brassStroke}
                    strokeWidth="2.5"
                    strokeDasharray="69.1"
                    strokeDashoffset={69.1 * (1 - timer / mastersonGameConfig.betting_duration_seconds)}
                    strokeLinecap="round"
                    opacity="0.95"
                    style={{
                      filter: isPulsing
                        ? "drop-shadow(0px 0px 8px rgba(255, 235, 59, 0.95))"
                        : "drop-shadow(0px 0px 4px rgba(199,158,87,0.7))",
                      transition: isResetting
                        ? "stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.05s ease, filter 0.05s ease"
                        : isPulsing
                        ? "stroke-dashoffset 0.1s linear, stroke 0.3s ease-out, filter 0.3s ease-out"
                        : "stroke-dashoffset 0.1s linear, stroke 0.2s ease, filter 0.2s ease",
                    }}
                  />
                </svg>
              )}

              {/* SVG Swirling and landing Ball (Positioned statically over the wheel) */}
              <svg
                viewBox="0 0 100 100"
                style={{
                  position: "absolute",
                  top: "-300px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "480px",
                  height: "480px",
                  pointerEvents: "none",
                }}
              >
                {(() => {
                  const rad = (ballAngle * Math.PI) / 180;
                  const bx = 50 + ballRadius * Math.cos(rad);
                  const by = 50 + ballRadius * Math.sin(rad);
                  return (
                    <circle
                      cx={bx}
                      cy={by}
                      r="2.2"
                      fill="#ffffff"
                      style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.8))" }}
                    />
                  );
                })()}
              </svg>

              {/* Center visual overlay timer display */}
              {engine.phase === "SPINNING" && timer !== null && (
                <Box
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(15, 12, 10, 0.9)",
                    border: `1.5px solid ${timer <= mastersonGameConfig.no_more_bets_seconds ? "#ef5350" : clubTokens.surface.brassStroke}`,
                    boxShadow: timer <= mastersonGameConfig.no_more_bets_seconds
                      ? "0 0 12px rgba(239, 83, 80, 0.6)"
                      : "0 0 8px rgba(199,158,87,0.4)",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    textAlign: "center",
                    zIndex: 8,
                    minWidth: 95,
                  }}
                >
                  <Text size="10px" c={timer <= mastersonGameConfig.no_more_bets_seconds ? "#ef5350" : "dimmed"} tt="uppercase" fw={700} style={{ letterSpacing: "0.06em" }}>
                    {timer <= mastersonGameConfig.no_more_bets_seconds ? "No More Bets" : "Lock Rig In"}
                  </Text>
                  <Text size="sm" fw={800} c={timer <= 3 ? "red" : clubTokens.text.brass}>
                    {timer.toFixed(1)}s
                  </Text>
                </Box>
              )}

              {/* Landing outcomes announcement overlay */}
              {engine.phase === "EVALUATION" && engine.spinResult && (
                <Box
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(10, 8, 7, 0.95)",
                    border: `1.5px solid ${clubTokens.surface.brassStroke}`,
                    boxShadow: "0 0 12px rgba(199,158,87,0.6)",
                    borderRadius: "6px",
                    padding: "6px 16px",
                    zIndex: 8,
                  }}
                >
                  <Text size="xs" ta="center" c="dimmed" tt="uppercase" fw={700}>
                    Landed Outcome
                  </Text>
                  <Group gap="xs" justify="center" mt={2}>
                    <Box
                      style={{
                        background: engine.spinResult.color === "Red" ? "#d32f2f" : engine.spinResult.color === "Black" ? "#111111" : "#2e7d32",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <Text size="xs" fw={700} c="white">{engine.spinResult.value}</Text>
                    </Box>
                    <Text size="xs" c="white" fw={600}>
                      {engine.spinResult.color} • {engine.spinResult.isEven ? "Even" : engine.spinResult.isOdd ? "Odd" : "Zero"}
                    </Text>
                  </Group>
                </Box>
              )}
            </div>
          </Box>

          {/* Left playfield action buttons footer */}
          <Group gap="md" justify="space-between" align="center" style={{ flexShrink: 0, height: 48 }}>
            {engine.phase === "BETTING" ? (
              <>
                <ClubButton
                  size="md"
                  fancy
                  variant="outline"
                  onClick={handleCashOut}
                >
                  Cash Out
                </ClubButton>
                {engine.selectedRig.severity !== "none" && (
                  <Text size="xs" c="dimmed">
                    Active Rig: <Text span c="yellow" fw={700}>{engine.selectedRig.severity.toUpperCase()} ({engine.selectedRig.target?.replace(/_/g, " ")})</Text>
                  </Text>
                )}
                <ClubButton
                  size="md"
                  fancy
                  variant="filled"
                  onClick={handlePlaceInitialBets}
                  disabled={engine.activeBettors.length === 0}
                >
                  PLACE YOUR BETS
                </ClubButton>
              </>
            ) : engine.phase === "SPINNING" ? (
              <Box style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size="xs" c="dimmed" fw={600}>
                  Ball is swirling... Make your rigging selection before time is up!
                </Text>
                {engine.selectedRig.severity !== "none" ? (
                  <Text size="xs" c="yellow" fw={700}>
                    RIGGED: {engine.selectedRig.target?.replace(/_/g, " ")} ({engine.selectedRig.severity.toUpperCase()})
                  </Text>
                ) : (
                  <Text size="xs" c="green" fw={700}>
                    FAIR SPIN
                  </Text>
                )}
              </Box>
            ) : (
              <>
                <Box style={{ flex: 1 }} />
                <ClubButton
                  size="md"
                  fancy
                  variant="filled"
                  onClick={engine.nextSpinTurn}
                >
                  START NEXT ROUND
                </ClubButton>
              </>
            )}
          </Group>
        </Box>

        {/* Right Column / Mobile-Bottom: Active Seat Cards & Table House Ledger */}
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: isMobileLayout ? "unset" : "0 0 33.333%",
            width: isMobileLayout ? "100%" : undefined,
            minHeight: 0,
          }}
        >
          {/* Seat Monitors */}
          <Stack id="seat-monitors" className="masterson-ledger-panel" p="sm" style={{ flex: isMobileLayout ? "unset" : 1, minHeight: 0 }} gap="xs">
            <Title order={5} ta="center" c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif" }}>
              Active Seats
            </Title>
            <ScrollArea style={{ flex: 1 }} scrollbarSize={6}>
              <Stack gap="xs">
                {Array.from({ length: 4 }).map((_, seatIdx) => {
                  const seatId = `Seat ${seatIdx + 1}`;
                  const bettor = engine.activeBettors.find((b) => b.id === seatId);
                  const evictedBettor = engine.evictedBettors[seatId];
                  const isEvicted = !!evictedBettor;
                  const displayBettor: BettorProfile | undefined = evictedBettor
                    ? {
                        id: seatId,
                        name: evictedBettor.name,
                        chips: evictedBettor.chips,
                        strategy: evictedBettor.strategy as BettorStrategy,
                        initial_chips: evictedBettor.chips,
                        loss_tolerance_pct: 0.5,
                        current_suspicion: 10,
                        max_suspicion: 10,
                        current_consecutive_losses: 0,
                        max_consecutive_losses: 5,
                        double_bet_frequency: 0,
                        herd_mentality_pct: 0.3,
                        total_spins_bet: 0,
                        total_amount_bet: 0,
                        recent_spins: [],
                      }
                    : bettor;

                  if (!displayBettor) {
                    return (
                      <Group key={seatId} justify="space-between" p={8} style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 6 }}>
                        <Text size="xs" c="dimmed">Seat {seatIdx + 1} (Empty)</Text>
                      </Group>
                    );
                  }

                  const isHighSuspicion = !isEvicted && bettor && bettor.current_suspicion >= bettor.max_suspicion - 1;
                  const isCracked = isEvicted || (bettor && bettor.current_suspicion >= bettor.max_suspicion);
                  const liquidHeightPct = isEvicted ? 100 : (bettor ? Math.min(100, Math.max(10, (bettor.current_suspicion / bettor.max_suspicion) * 100)) : 10);

                  const isFlashing = neonFlashSeat === seatId;
                  const seatColor = SEAT_COLORS[seatId] || "#ffe066";

                  // Win / Loss Recap badge for this spin
                  const recapAmount = recapVisible ? engine.roundRecaps[seatId] : null;
                  // Session cumulative total for this seat
                  const sessionNet = engine.sessionTotals[seatId] ?? 0;

                  return (
                    <Box key={seatId} style={{ position: "relative", minHeight: 68 }}>
                      <AnimatePresence mode="popLayout">
                        {isEvicted ? (
                          <motion.div
                            key="evicted"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{ width: "100%", height: "100%" }}
                          >
                            <Box
                              className="masterson-leaving-overlay"
                              style={{
                                cursor: engine.phase === "SPINNING" ? "not-allowed" : "pointer",
                              }}
                              onClick={() => {
                                if (engine.phase !== "SPINNING") {
                                  setSelectedBettorCard(seatId);
                                }
                              }}
                            >
                              <Text size="xs" fw={700} c="white" truncate>{displayBettor.name}</Text>
                              <Text className="masterson-leaving-reason">
                                {evictedBettor.reason}
                              </Text>
                              <Text size="9px" c="dimmed">Left table with ${evictedBettor.chips.toLocaleString()}</Text>
                            </Box>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="active"
                            initial={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            style={{ position: "relative", width: "100%" }}
                          >
                            <Group
                              justify="space-between"
                              wrap="nowrap"
                              p={8}
                              className={isFlashing ? "masterson-seat-flash" : undefined}
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: isFlashing ? `1.5px solid ${seatColor}` : "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 6,
                                position: "relative",
                                transition: "all 0.3s ease",
                                cursor: engine.phase === "SPINNING" ? "not-allowed" : "pointer",
                              }}
                              onClick={() => {
                                if (engine.phase !== "SPINNING") {
                                  setSelectedBettorCard(seatId);
                                }
                              }}
                            >
                              {/* Seat colored dot */}
                              <Box
                                style={{
                                  position: "absolute",
                                  top: 6,
                                  left: 6,
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: seatColor,
                                }}
                              />

                              <Stack gap={2} style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
                                <Text size="xs" fw={700} c="white" truncate>{displayBettor.name}</Text>
                                {(() => {
                                  const avgBet = displayBettor.total_spins_bet && displayBettor.total_spins_bet > 0
                                    ? Math.round(displayBettor.total_amount_bet! / displayBettor.total_spins_bet)
                                    : 0;
                                  return (
                                    <Text size="10px" c="dimmed">
                                      {displayBettor.strategy.replace(/_/g, " ")} • Avg: ${avgBet.toLocaleString()}
                                    </Text>
                                  );
                                })()}
                                {/* Session Win/Loss — sits between name/strategy and suspicion gauge */}
                                <Group gap={4} align="center">
                                  <Text size="xs" c={clubTokens.text.brass} fw={700}>${displayBettor.chips.toLocaleString()}</Text>
                                  {engine.spinCount > 1 && (
                                    <Text
                                      size="10px"
                                      fw={800}
                                      c={sessionNet > 0 ? "#4caf50" : sessionNet < 0 ? "#ef5350" : "dimmed"}
                                      style={{ letterSpacing: "0.04em" }}
                                    >
                                      ({sessionNet > 0 ? `+${sessionNet.toLocaleString()}` : sessionNet.toLocaleString()})
                                    </Text>
                                  )}
                                </Group>
                              </Stack>

                              {/* Covert Whiskey Glass Gauge */}
                              <Stack gap={1} align="center">
                                <div
                                  className={`masterson-whiskey-glass ${isHighSuspicion ? "condensed" : ""} ${isCracked ? "cracked" : ""}`}
                                  title={isEvicted ? "Suspicion: Maxed" : (bettor ? `Suspicion: ${bettor.current_suspicion}/${bettor.max_suspicion}` : "")}
                                >
                                  <div
                                    className="masterson-whiskey-liquid"
                                    style={{ height: `${liquidHeightPct}%` }}
                                  />
                                  <div className="masterson-whiskey-condensation" />
                                </div>
                                <Text size="10px" c="dimmed">Suspicion</Text>
                              </Stack>

                              {/* Glassmorphic Win/Loss Staggered Overlay inside placard */}
                              <AnimatePresence>
                                {recapAmount !== null && recapAmount !== undefined && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                      delay: seatIdx * 0.15, // Cascading staggered sequence
                                      duration: 0.35,
                                      ease: "easeOut",
                                    }}
                                    className="masterson-recap-overlay"
                                  >
                                    <span className={`masterson-recap-text ${recapAmount > 0 ? "win" : recapAmount < 0 ? "loss" : "even"}`}>
                                      {recapAmount > 0 ? `+$${recapAmount.toLocaleString()}` : recapAmount < 0 ? `-$${Math.abs(recapAmount).toLocaleString()}` : "$0"}
                                    </span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Group>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  );
                })}
              </Stack>
            </ScrollArea>
          </Stack>

          {/* Table House Ledger (Balanced Sidebar placement) */}
          <Stack id="table-house-ledger" className="masterson-ledger-panel" p="sm" justify="center" align="center" style={{ height: 110, flexShrink: 0, position: "relative" }}>
            <AnimatePresence>
              {(engine.phase === "EVALUATION" || engine.phase === "SUMMARY") && engine.lastSpinHouseProfit !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="masterson-recap-overlay"
                  style={{ borderRadius: 8 }}
                >
                  <span className={`masterson-recap-text ${engine.lastSpinHouseProfit >= 0 ? "win" : "loss"}`}>
                    {engine.lastSpinHouseProfit >= 0 
                      ? `House Won +$${engine.lastSpinHouseProfit.toLocaleString()}` 
                      : `House Lost -$${Math.abs(engine.lastSpinHouseProfit).toLocaleString()}`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <Text size="xs" c="dimmed">TABLE HOUSE LEDGER</Text>
            <Title order={4} className="masterson-text-brass" style={{ fontFamily: "Georgia, serif" }}>
              ${engine.tableHouseLedger.toLocaleString()}
            </Title>
            <Text size="xs" c="white">
              Croupier Commission ({engine.commissionRate}%):{" "}
              <Text span c="yellow" fw={700}>
                ${engine.accumulatedCommission.toLocaleString()}
              </Text>
            </Text>
          </Stack>
        </Box>
      </Box>

      {/* Settings Modal */}
      <GameSettingsModal
        opened={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Odds Modal */}
      <Modal
        opened={showOddsModal}
        onClose={() => setShowOddsModal(false)}
        title={
          <Text fw={700} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>
            Masterson 1881 Payout Odds
          </Text>
        }
        centered
        size="md"
        styles={{
          content: {
            background: "linear-gradient(135deg, #2e1d13 0%, #140d08 100%)",
            border: `2px solid ${clubTokens.surface.brassStroke}`,
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8)",
          },
          header: {
            background: "transparent",
            borderBottom: "1px solid rgba(230, 184, 52, 0.25)",
            paddingBottom: "10px",
          },
          close: {
            color: clubTokens.text.brass,
            "&:hover": {
              background: "rgba(255, 255, 255, 0.05)",
            },
          },
        }}
      >
        <Stack gap="md" p="xs">
          <Text size="xs" c="dimmed">
            Commission of {engine.commissionRate}% is applied solely to positive net spin returns at table settlement. Net even or losses result in forfeiture of buy-in.
          </Text>
          <Table variant="unstyled" style={{ color: "#ffffff", borderCollapse: "collapse" }}>
            <Table.Thead style={{ borderBottom: "1px solid rgba(230, 184, 52, 0.2)" }}>
              <Table.Tr>
                <Table.Th style={{ color: clubTokens.text.brass, fontSize: "11px" }}>BET TYPE</Table.Th>
                <Table.Th style={{ color: clubTokens.text.brass, fontSize: "11px" }}>COVERAGE</Table.Th>
                <Table.Th style={{ color: clubTokens.text.brass, fontSize: "11px" }} ta="right">PAYOUT</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ODDS_LEDGER.map((odd, idx) => (
                <Table.Tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "background 0.2s ease",
                  }}
                >
                  <Table.Td style={{ fontSize: "12px", padding: "10px 4px", fontWeight: 600 }}>{odd.type}</Table.Td>
                  <Table.Td style={{ fontSize: "12px", padding: "10px 4px", color: "rgba(255, 255, 255, 0.7)" }}>{odd.covered}</Table.Td>
                  <Table.Td style={{ fontSize: "12px", padding: "10px 4px", fontWeight: 700, color: "#81c784" }} ta="right">{odd.payout}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <ClubButton
            onClick={() => setShowOddsModal(false)}
            variant="fancy"
            size="sm"
            fullWidth
            mt="xs"
          >
            RETURN TO GAME
          </ClubButton>
        </Stack>
      </Modal>

      {/* Player Profile Details Modal */}
      <Modal
        opened={!!selectedBettorCard && !!selectedBettor}
        onClose={() => setSelectedBettorCard(null)}
        title={
          selectedBettor ? (
            <Group gap="xs" align="center">
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: SEAT_COLORS[selectedBettor.id] || "#ffe066",
                }}
              />
              <Text fw={700} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem" }}>
                {selectedBettor.name} ({selectedBettor.id})
              </Text>
              {engine.evictedBettors[selectedBettor.id] && (
                <Text size="10px" fw={800} bg="rgba(239, 83, 80, 0.2)" c="#ef5350" px={6} py={2} style={{ borderRadius: 4, textTransform: "uppercase" }}>
                  EVICTED
                </Text>
              )}
            </Group>
          ) : null
        }
        centered
        size="md"
        styles={{
          content: {
            background: "radial-gradient(circle at top, #2e1d13 0%, #140d08 100%)",
            border: `2.5px solid ${clubTokens.surface.brassStroke}`,
            borderRadius: "14px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.9), inset 0 0 24px rgba(0,0,0,0.5)",
            color: "#ffffff",
          },
          header: {
            background: "transparent",
            borderBottom: "1px solid rgba(230, 184, 52, 0.25)",
            paddingBottom: "12px",
          },
          close: {
            color: clubTokens.text.brass,
            "&:hover": {
              background: "rgba(255, 255, 255, 0.05)",
            },
          },
        }}
      >
        {selectedBettor && (
          <Stack gap="md" p="xs" style={{ position: "relative" }}>
            {/* Ornate subtle dashed inner border */}
            <Box
              style={{
                position: "absolute",
                top: -8,
                left: -8,
                right: -8,
                bottom: -8,
                border: "1px dashed rgba(230, 184, 52, 0.1)",
                borderRadius: "10px",
                pointerEvents: "none",
              }}
            />

            {/* Strategy Spotlight Section */}
            {(() => {
              const strategyDetails = bettorStrategyDescriptions[selectedBettor.strategy];
              return (
                <Stack
                  gap="xs"
                  p="sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(230, 184, 52, 0.15)",
                    borderRadius: "8px",
                  }}
                >
                  <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: "0.05em" }}>
                    Betting Strategy
                  </Text>
                  <Text fw={700} c={clubTokens.text.brass} size="sm">
                    {strategyDetails?.title || selectedBettor.strategy.replace(/_/g, " ")}
                  </Text>
                  <Text size="xs" c="rgba(255, 255, 255, 0.75)" style={{ lineHeight: "1.4" }}>
                    {strategyDetails?.description || "A secretive betting pattern used to outsmart the croupier."}
                  </Text>
                </Stack>
              );
            })()}

            {/* Metrics Panel */}
            <Stack
              gap="xs"
              p="sm"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
              }}
            >
              <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: "0.05em" }} mb={4}>
                Real-Time Statistics
              </Text>

              {/* Bankroll Chips */}
              <Group justify="space-between" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px" }}>
                <Text size="xs" c="dimmed">Current Bankroll</Text>
                <Text size="sm" fw={800} c={clubTokens.text.brass}>
                  ${selectedBettor.chips.toLocaleString()}
                </Text>
              </Group>

              {/* Net Session Change */}
              {(() => {
                const netChange = selectedBettor.chips - selectedBettor.initial_chips;
                const isPositive = netChange > 0;
                const isNegative = netChange < 0;
                return (
                  <Group justify="space-between" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px" }}>
                    <Text size="xs" c="dimmed">Net Session Return</Text>
                    <Text size="sm" fw={800} c={isPositive ? "#81c784" : isNegative ? "#ef5350" : "dimmed"}>
                      {isPositive ? `+$${netChange.toLocaleString()}` : isNegative ? `-$${Math.abs(netChange).toLocaleString()}` : "$0"}
                    </Text>
                  </Group>
                );
              })()}

              {/* Total Wagers */}
              <Group justify="space-between" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px" }}>
                <Text size="xs" c="dimmed">Total Rounds Wagered</Text>
                <Text size="xs" fw={700} c="white">
                  {selectedBettor.total_spins_bet ?? 0} spins
                </Text>
              </Group>

              {/* Average Bet Size */}
              {(() => {
                const avgBet = selectedBettor.total_spins_bet && selectedBettor.total_spins_bet > 0
                  ? Math.round(selectedBettor.total_amount_bet! / selectedBettor.total_spins_bet)
                  : 0;
                return (
                  <Group justify="space-between" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px" }}>
                    <Text size="xs" c="dimmed">Average Bet Size</Text>
                    <Text size="xs" fw={700} c="white">
                      ${avgBet.toLocaleString()}
                    </Text>
                  </Group>
                );
              })()}

              {/* Suspicion Meter */}
              <Group justify="space-between" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px" }} align="center">
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Suspicion Meter</Text>
                  <Text size="9px" c="dimmed">(Max tolerance: {selectedBettor.max_suspicion})</Text>
                </Stack>
                <Group gap="xs" align="center">
                  <Text size="xs" fw={700} c={selectedBettor.current_suspicion >= selectedBettor.max_suspicion - 1 ? "#ef5350" : "white"}>
                    {selectedBettor.current_suspicion} / {selectedBettor.max_suspicion}
                  </Text>
                  <Box
                    style={{
                      width: 60,
                      height: 8,
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      style={{
                        width: `${Math.min(100, (selectedBettor.current_suspicion / selectedBettor.max_suspicion) * 100)}%`,
                        height: "100%",
                        background: selectedBettor.current_suspicion >= selectedBettor.max_suspicion - 1
                          ? "linear-gradient(90deg, #e53935, #ef5350)"
                          : "linear-gradient(90deg, #c79e57, #ffd700)",
                        boxShadow: selectedBettor.current_suspicion >= selectedBettor.max_suspicion - 1
                          ? "0 0 6px rgba(239, 83, 80, 0.8)"
                          : "0 0 4px rgba(255, 215, 0, 0.5)",
                      }}
                    />
                  </Box>
                </Group>
              </Group>

              {/* Consecutive Losses */}
              <Group justify="space-between" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px" }}>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Consecutive Losses</Text>
                  <Text size="9px" c="dimmed">(Patience limit: {selectedBettor.max_consecutive_losses} spins)</Text>
                </Stack>
                <Text size="xs" fw={700} c={selectedBettor.current_consecutive_losses >= selectedBettor.max_consecutive_losses - 1 ? "#ef5350" : "white"}>
                  {selectedBettor.current_consecutive_losses} / {selectedBettor.max_consecutive_losses}
                </Text>
              </Group>

              {/* Herd Mentality */}
              <Group justify="space-between">
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Herd Mentality Index</Text>
                  <Text size="9px" c="dimmed">(Tendency to follow other high wagers)</Text>
                </Stack>
                <Text size="xs" fw={700} c="white">
                  {Math.round((selectedBettor.herd_mentality_pct ?? 0) * 100)}%
                </Text>
              </Group>
            </Stack>

            <ClubButton
              onClick={() => setSelectedBettorCard(null)}
              variant="fancy"
              size="sm"
              fullWidth
              mt="xs"
            >
              CLOSE DOSSIER
            </ClubButton>
          </Stack>
        )}
      </Modal>

      {/* Interactive Sommelier Live Guide */}
      {showTutorial && (
        <SommelierLiveGuide
          gameId="masterton_1881"
          onStepChange={(mock) => setMockState(mock)}
          onClose={() => {
            setShowTutorial(false);
            setMockState(null);
          }}
        />
      )}
    </Box>
  );

  return (
    <Box style={{ width: "100%", minHeight: "100%", background: "#0c0a08", position: "relative" }}>
      {gameContent}

      <AnimatePresence>
        {engine.gameOverReason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 8, 7, 0.95)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              style={{
                width: "100%",
                maxWidth: 500,
                background: "radial-gradient(circle at top, #2e1d13 0%, #140d08 100%)",
                border: `3px solid ${clubTokens.surface.brassStroke}`,
                borderRadius: "16px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), inset 0 0 30px rgba(0,0,0,0.5)",
                padding: "2rem",
                textAlign: "center",
                position: "relative",
                boxSizing: "border-box",
              }}
            >
              {/* Ornate brass trim elements */}
              <Box
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  right: 10,
                  bottom: 10,
                  border: "1px dashed rgba(230, 184, 52, 0.2)",
                  borderRadius: "12px",
                  pointerEvents: "none",
                }}
              />

              <Title order={2} style={{ fontFamily: "Georgia, serif", color: clubTokens.text.brass, fontSize: "1.8rem" }} mb="md">
                {engine.gameOverReason === "MAX_SPINS" ? "SHIFT COMPLETED" : "TABLE ISOLATED"}
              </Title>

              <Text size="sm" c="dimmed" mb="xl" style={{ lineHeight: "1.5" }}>
                {engine.gameOverReason === "MAX_SPINS"
                  ? "All 30 spins of your croupier shift have been conducted. The club house managers have closed the table for final audit."
                  : "All active bettors have left the table due to suspicion, frustration, or financial exhaustion. No new players are willing to take a seat."}
              </Text>

              {/* Statistics Panel */}
              <Stack
                gap="sm"
                p="md"
                mb="xl"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(230, 184, 52, 0.15)",
                  borderRadius: "8px",
                }}
              >
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">SPINS CONDUCTED</Text>
                  <Text size="xs" fw={700} c="white">{engine.spinCount} / 30</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">TABLE HOUSE LEDGER</Text>
                  <Text size="xs" fw={700} c={engine.tableHouseLedger >= 0 ? "#81c784" : "#ef5350"}>
                    {engine.tableHouseLedger >= 0 ? `+$${engine.tableHouseLedger.toLocaleString()}` : `-$${Math.abs(engine.tableHouseLedger).toLocaleString()}`}
                  </Text>
                </Group>
                <Group justify="space-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
                  <Text size="xs" c="dimmed">YOUR COMMISSION ({engine.commissionRate}%)</Text>
                  <Text size="sm" fw={800} c="yellow">
                    ${engine.accumulatedCommission.toLocaleString()}
                  </Text>
                </Group>
              </Stack>

              <ClubButton
                onClick={handleCashOut}
                variant="fancy"
                size="md"
                fullWidth
              >
                CASH OUT & SETTLE SHIFT
              </ClubButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
export const MastertonRootWrapped = MastertonRoot;
