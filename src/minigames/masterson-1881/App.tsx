import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  ScrollArea,
} from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import { GameScaleContainer } from "@/components/ui/GameScaleContainer";
import { UnifiedGameHeader } from "@/components/ui/UnifiedGameHeader";
import { GameSettingsModal } from "@/components/ui/GameSettingsModal";
import { SommelierLiveGuide } from "@/components/ui/SommelierLiveGuide";
import { clubTokens } from "@/theme/clubTokens";

import { useMastertonEngine } from "./engine/useMastertonEngine";
import { rouletteNumbers } from "@/config/minigames/mastersonRules";
import type { ClubTableReturnDetail } from "@/game/sessionSettlement";

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
};

const WHEEL_NUMBERS = [
  "0", "28", "9", "26", "30", "11", "7", "20", "32", "17", "5", "22", "34", "15", "3", "24", "36", "13", "1",
  "00", "27", "10", "25", "29", "12", "8", "19", "31", "18", "6", "21", "33", "16", "4", "23", "35", "14", "2"
];

interface MastertonRootProps {
  sessionCredits: number;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
  onAbandonRun?: () => void;
  onPauseToClub?: () => void;
  isTutorial?: boolean;
}

interface LastMinuteBetJob {
  bettorId: string;
  delaySeconds: number;
  triggered: boolean;
}

export function MastertonRoot({
  sessionCredits,
  onReturnToClubMenu,
  onAbandonRun,
  isTutorial = false,
}: MastertonRootProps) {
  const realEngine = useMastertonEngine();
  const [mockState, setMockState] = useState<Record<string, unknown> | null>(null);

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

  // Wheel swirling and countdown timing states
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(42);
  const [timer, setTimer] = useState<number | null>(null);
  const [, setLastMinuteBetsQueue] = useState<LastMinuteBetJob[]>([]);
  const [neonFlashSeat, setNeonFlashSeat] = useState<string | null>(null);
  const [recapVisible, setRecapVisible] = useState(false);

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
    let animId: number;
    const tick = () => {
      if (engine.phase === "SPINNING") {
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
            // Resolve outcome wagers automatically
            engine.resolveSpin();
            setRecapVisible(true);
          }
        } else {
          // Normal constant spin rotation
          setWheelRotation((prev) => (prev + 1.5) % 360);
          setBallAngle((prev) => (prev - 4.5) % 360);
          setBallRadius(42);
        }
      } else {
        // Slow standby rotational crawl in other phases
        setWheelRotation((prev) => (prev + 0.12) % 360);
        setBallAngle((prev) => (prev - 0.12) % 360);
        setBallRadius(34);
        landingRef.current = null;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [engine.phase, engine.resolveSpin, engine]);

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
          // Align pocket at bottom-center (90 degrees)
          const targetRot = 90 - pocketAngle;
          const finalRot = currentRot + (360 * 3) + (targetRot - (currentRot % 360));

          landingRef.current = {
            active: true,
            startWheelRot: currentRot,
            finalWheelRot: finalRot,
            startBallAngle: ballAngleRef.current,
            finalBallAngle: finalRot,
            elapsedMs: 0,
          };
          return 0;
        }

        const nextTimer = prev - 0.1;
        const elapsedTime = 10 - nextTimer;

        // Check for queued last-minute bets
        setLastMinuteBetsQueue((prevQueue) => {
          let timerResetNeeded = false;
          const updated = prevQueue.map((job) => {
            if (!job.triggered && elapsedTime >= job.delaySeconds) {
              engineRef.current.placeLastMinuteBet(job.bettorId);
              timerResetNeeded = true;
              return { ...job, triggered: true };
            }
            return job;
          });

          if (timerResetNeeded) {
            const triggeredJob = updated.find(j => j.triggered && elapsedTime >= j.delaySeconds);
            if (triggeredJob) {
              setNeonFlashSeat(triggeredJob.bettorId);
              setTimeout(() => setNeonFlashSeat(null), 850);
            }
            // Reset countdown back to 10
            setTimeout(() => setTimer(10), 0);
          }
          return updated;
        });

        return nextTimer;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isTimerNull]);

  // Cash out and return commission to club
  const handleCashOut = () => {
    if (onReturnToClubMenu) {
      onReturnToClubMenu({
        uncappedCredits: engine.accumulatedCommission,
        basePayout: engine.accumulatedCommission,
        overachievementBonus: 0,
        tiers: 0,
        totalReturn: engine.accumulatedCommission,
        tableRound: engine.spinCount,
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
    engine.placeInitialBets();
    setTimer(10);
    setRecapVisible(false);

    // Queue 1 or 2 last-minute bets dynamically
    const activeSeatIds = engine.activeBettors.map((b) => b.id);
    const shuffled = [...activeSeatIds].sort(() => Math.random() - 0.5);
    const numLastMinute = shuffled.length > 0 ? (Math.random() > 0.5 ? Math.min(2, shuffled.length) : 1) : 0;
    const queue = shuffled.slice(0, numLastMinute).map((id, idx) => ({
      bettorId: id,
      delaySeconds: idx === 0 ? 3.0 : 6.0,
      triggered: false,
    }));
    setLastMinuteBetsQueue(queue);
  };

  // Stacked, offset, color-coded wagers rendering
  const renderWagerChips = (target: string) => {
    const wagersByBettor: { bettorId: string; totalAmount: number }[] = [];

    engine.activeBettors.forEach((bettor) => {
      const wagers = (engine.currentBets[bettor.id] || []).filter((w) => w.target === target);
      if (wagers.length > 0) {
        const total = wagers.reduce((sum, w) => sum + w.amount, 0);
        wagersByBettor.push({ bettorId: bettor.id, totalAmount: total });
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
          const displayVal = w.totalAmount >= 1000 ? `${(w.totalAmount / 1000).toFixed(0)}k` : w.totalAmount;
          return (
            <Box
              key={w.bettorId}
              title={`${w.bettorId}: $${w.totalAmount}`}
              style={{
                background: `radial-gradient(circle, #ffffff 0%, ${color} 65%, #000000 100%)`,
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "1px dashed rgba(255, 255, 255, 0.8)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "6px",
                fontWeight: "bold",
                color: "#ffffff",
                textShadow: "1px 1px 1px #000000",
                transform: `translateY(-${idx * 2}px)`,
              }}
            >
              {displayVal}
            </Box>
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
          <>
            <ClubButton
              size="xs"
              variant="outline"
              onClick={() => setShowTutorial(true)}
            >
              How to Play
            </ClubButton>
            {engine.phase === "BETTING" && (
              <ClubButton
                size="xs"
                variant="fancy"
                onClick={handleCashOut}
              >
                Cash Out
              </ClubButton>
            )}
          </>
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
          <Stack className="masterson-felt-board" p="sm" style={{ flex: isMobileLayout ? "unset" : 1, minHeight: 0, justifyContent: "center" }}>

              {/* Board grid */}
              <Box style={{ display: "flex", gap: "4px", justifyContent: "center", alignItems: "stretch" }}>
                {/* Green Numbers 0 and 00 */}
                <Box style={{ display: "flex", flexDirection: "column", gap: "4px", width: 50, height: 182 }}>
                  <Box
                    className={`masterson-grid-cell green ${isRigTarget("0") ? "active-rig" : ""}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                    onClick={() => handleToggleRig("high", "0")}
                  >
                    <Text size="xs">0</Text>
                    {renderWagerChips("0")}
                  </Box>
                  <Box
                    className={`masterson-grid-cell green ${isRigTarget("00") ? "active-rig" : ""}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                    onClick={() => handleToggleRig("high", "00")}
                  >
                    <Text size="xs">00</Text>
                    {renderWagerChips("00")}
                  </Box>
                </Box>

                {/* Grid 1-36 Numbers + Column Bets (13 Columns Total) */}
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: "4px", flex: 1 }}>
                  {ROULETTE_ROWS.flatMap((row) => [
                    ...row.numbers.map((numStr) => {
                      const numObj = rouletteNumbers.find((n) => n.value === numStr)!;
                      const isRed = numObj.color === "Red";

                      return (
                        <Box
                          key={numStr}
                          className={`masterson-grid-cell number ${isRed ? "red" : "black"} ${isRigTarget(numStr) ? "active-rig" : ""}`}
                          style={{
                            height: 58,
                            position: "relative",
                          }}
                          onClick={() => handleToggleRig("high", numStr)}
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
                        className={`masterson-grid-cell outside ${isRigTarget(row.columnTarget) ? "active-rig" : ""}`}
                        style={{
                          height: 58,
                          background: "rgba(255, 255, 255, 0.05)",
                          position: "relative",
                        }}
                        onClick={() => handleToggleRig("mid", row.columnTarget)}
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
              <Box style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "4px" }}>
                <Box style={{ width: 50 }} />
                <Box style={{ display: "flex", flex: 12, gap: "4px" }}>
                  {["Dozen_1", "Dozen_2", "Dozen_3"].map((doz) => {
                    const label = doz.replace("_", " ");
                    return (
                      <Box
                        key={doz}
                        className={`masterson-grid-cell outside ${isRigTarget(doz) ? "active-rig" : ""}`}
                        style={{
                          flex: 1,
                          height: 40,
                          background: "rgba(255, 255, 255, 0.05)",
                          position: "relative",
                        }}
                        onClick={() => handleToggleRig("mid", doz)}
                      >
                        <Text size="xs" c={clubTokens.text.primary}>{label}</Text>
                        {renderWagerChips(doz)}
                      </Box>
                    );
                  })}
                </Box>
                <Box style={{ flex: 1 }} />
              </Box>

              {/* Outside Bet Categories Layout */}
              <Box style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "4px" }}>
                <Box style={{ width: 50 }} />
                <Box style={{ display: "flex", flex: 12, gap: "4px" }}>
                  {["Low_1_18", "Even", "Red", "Black", "Odd", "High_19_36"].map((out) => {
                    const label = out.replace(/_/g, " ");
                    const bg = out === "Red" ? "rgba(211, 47, 47, 0.3)" : out === "Black" ? "rgba(26, 26, 26, 0.7)" : "rgba(255,255,255,0.05)";
                    return (
                      <Box
                        key={out}
                        className={`masterson-grid-cell outside ${isRigTarget(out) ? "active-rig" : ""}`}
                        style={{
                          flex: 1,
                          height: 40,
                          background: bg,
                          position: "relative",
                        }}
                        onClick={() => handleToggleRig("low", out)}
                      >
                        <Text size="xs" c={clubTokens.text.primary}>{label}</Text>
                        {renderWagerChips(out)}
                      </Box>
                    );
                  })}
                </Box>
                <Box style={{ flex: 1 }} />
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
                    top: "-195px", // Shifted up less so the bottom arc is clearly visible
                    left: "50%",
                    transform: `translateX(-50%)`,
                    width: "480px",
                    height: "480px",
                  }}
                >
                  <g transform={`rotate(${wheelRotation} 50 50)`}>
                    {/* Wheel Background */}
                    <circle cx="50" cy="50" r="46" fill="#14110f" stroke="#c79e57" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="39" fill="none" stroke="#2a231f" strokeWidth="1.5" />

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
                    {/* Inner pocket divider circle */}
                    <circle cx="50" cy="50" r="33.5" fill="none" stroke="#c79e57" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="28" fill="#2d2218" stroke="#1d150e" strokeWidth="1" />
                  </g>
                </svg>

                {/* Symmetrical Dual-Half SVG Countdown Timer Ring (Positioned statically, wrapping outside path) */}
                {engine.phase === "SPINNING" && timer !== null && (
                  <svg
                    viewBox="0 0 100 100"
                    style={{
                      position: "absolute",
                      top: "-195px",
                      left: "50%",
                      transform: "translateX(-50%) rotate(-90deg)", // aligned to top center
                      width: "480px",
                      height: "480px",
                      pointerEvents: "none",
                    }}
                  >
                    {/* Left Symmetrical Progress half-arc */}
                    <path
                      d="M 50,2 A 48,48 0 0,0 50,98"
                      fill="none"
                      stroke={clubTokens.surface.brassStroke}
                      strokeWidth="2.5"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 * (1 - timer / 10)}
                      strokeLinecap="round"
                      opacity="0.95"
                      filter="drop-shadow(0 0 4px rgba(199,158,87,0.7))"
                    />
                    {/* Right Symmetrical Progress half-arc */}
                    <path
                      d="M 50,2 A 48,48 0 0,1 50,98"
                      fill="none"
                      stroke={clubTokens.surface.brassStroke}
                      strokeWidth="2.5"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 * (1 - timer / 10)}
                      strokeLinecap="round"
                      opacity="0.95"
                      filter="drop-shadow(0 0 4px rgba(199,158,87,0.7))"
                    />
                  </svg>
                )}

                {/* SVG Swirling and landing Ball (Positioned statically over the wheel) */}
                <svg
                  viewBox="0 0 100 100"
                  style={{
                    position: "absolute",
                    top: "-195px",
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
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
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
                      border: `1.5px solid ${clubTokens.surface.brassStroke}`,
                      boxShadow: "0 0 8px rgba(199,158,87,0.4)",
                      borderRadius: "6px",
                      padding: "4px 12px",
                      textAlign: "center",
                      zIndex: 8,
                      minWidth: 80,
                    }}
                  >
                    <Text size="10px" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
                      Lock Rig In
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

            {/* Thin scrolling croupier logs */}
            <Stack id="ledger-log" className="masterson-ledger-panel" p="sm" style={{ height: 90, flexShrink: 0 }}>
              <Text size="xs" fw={700} c={clubTokens.text.brass}>Croupier Shift Log</Text>
              <ScrollArea style={{ flex: 1 }} scrollbarSize={4}>
                <Stack gap={2}>
                  {engine.notifications.length === 0 ? (
                    <Text size="xs" c="dimmed">Awaiting wagers...</Text>
                  ) : (
                    engine.notifications.map((n, idx) => {
                      const color = n.type === "win" ? "green" : n.type === "loss" ? "red" : n.type === "suspicion" ? "orange" : "white";
                      return (
                        <Text key={idx} size="xs" c={color}>
                          • {n.message}
                        </Text>
                      );
                    })
                  )}
                </Stack>
              </ScrollArea>
            </Stack>

            {/* Left playfield action buttons footer */}
            <Group gap="md" justify="space-between" align="center" style={{ flexShrink: 0, height: 48 }}>
              {engine.phase === "BETTING" ? (
                <>
                  <ClubButton
                    size="md"
                    variant="fancy"
                    onClick={handlePlaceInitialBets}
                    disabled={engine.activeBettors.length === 0}
                  >
                    PLACE YOUR BETS
                  </ClubButton>
                  {engine.selectedRig.severity !== "none" && (
                    <Text size="xs" c="dimmed">
                      Active Rig: <Text span c="yellow" fw={700}>{engine.selectedRig.severity.toUpperCase()} ({engine.selectedRig.target?.replace(/_/g, " ")})</Text>
                    </Text>
                  )}
                </>
              ) : engine.phase === "SPINNING" ? (
                <Box style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text size="xs" c="dimmed" fw={600}>
                    🎡 Ball is swirling... Click cells on layout to update rigging constraints target!
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
                <ClubButton
                  size="md"
                  variant="fancy"
                  onClick={engine.nextSpinTurn}
                >
                  START NEXT ROUND
                </ClubButton>
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

                  if (!bettor) {
                    return (
                      <Group key={seatId} justify="space-between" p={8} style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 6 }}>
                        <Text size="xs" c="dimmed">Seat {seatIdx + 1} (Empty)</Text>
                      </Group>
                    );
                  }

                  const isHighSuspicion = bettor.current_suspicion >= bettor.max_suspicion - 1;
                  const isCracked = bettor.current_suspicion >= bettor.max_suspicion;
                  const liquidHeightPct = Math.min(100, Math.max(10, (bettor.current_suspicion / bettor.max_suspicion) * 100));

                  const isFlashing = neonFlashSeat === seatId;
                  const seatColor = SEAT_COLORS[seatId] || "#ffe066";

                  // Win / Loss Recap badge for this spin
                  const recapAmount = recapVisible ? engine.roundRecaps[seatId] : null;
                  // Session cumulative total for this seat
                  const sessionNet = engine.sessionTotals[seatId] ?? 0;

                  return (
                    <Stack key={seatId} gap={0}>
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
                          <Text size="xs" fw={700} c="white" truncate>{bettor.name}</Text>
                          <Text size="10px" c="dimmed">{bettor.strategy.replace(/_/g, " ")}</Text>
                          {/* Session Win/Loss — sits between name/strategy and suspicion gauge */}
                          <Group gap={4} align="center">
                            <Text size="xs" c={clubTokens.text.brass} fw={700}>${bettor.chips.toLocaleString()}</Text>
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
                            title={`Suspicion: ${bettor.current_suspicion}/${bettor.max_suspicion}`}
                          >
                            <div
                              className="masterson-whiskey-liquid"
                              style={{ height: `${liquidHeightPct}%` }}
                            />
                            <div className="masterson-whiskey-condensation" />
                          </div>
                          <Text size="10px" c="dimmed">Suspicion</Text>
                        </Stack>
                      </Group>

                      {/* Recap visual overlay badge */}
                      {recapAmount !== null && recapAmount !== undefined && (
                        <Box
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            paddingTop: "2px",
                            paddingRight: "8px",
                          }}
                        >
                          <Text
                            size="10px"
                            fw={800}
                            c={recapAmount > 0 ? "#2e7d32" : recapAmount < 0 ? "#d32f2f" : "dimmed"}
                            style={{
                              textShadow: "0 0 4px rgba(0,0,0,0.6)",
                            }}
                          >
                            {recapAmount > 0 ? `+${recapAmount.toLocaleString()}` : recapAmount < 0 ? recapAmount.toLocaleString() : "+$0"}
                          </Text>
                        </Box>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </ScrollArea>
          </Stack>

          {/* Table House Ledger (Balanced Sidebar placement) */}
          <Stack id="table-house-ledger" className="masterson-ledger-panel" p="sm" justify="center" align="center" style={{ height: 110, flexShrink: 0 }}>
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

  // Mobile: render without auto-scaling
  if (isMobileLayout) {
    return (
      <Box style={{ width: "100%", overflowY: "auto", minHeight: "100vh", background: "#0c0a08" }}>
        {gameContent}
      </Box>
    );
  }

  return (
    <GameScaleContainer
      designWidth={1280}
      designHeight={800}
      transformOrigin="center top"
      alignItems="flex-start"
    >
      {gameContent}
    </GameScaleContainer>
  );
}
export const MastertonRootWrapped = MastertonRoot;
