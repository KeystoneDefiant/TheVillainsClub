import { useState, useCallback, useRef } from "react";
import {
  mastersonGameConfig,
  BettorProfile,
  rouletteNumbers,
  validateOutcomeAgainstRig,
  RigChoice,
  RouletteNumberInfo,
} from "@/config/minigames/mastersonRules";
import { executeBettorBetting, BettorBet, generateRandomBettor } from "./bettorAI";

export type GamePhase = "BETTING" | "SPINNING" | "EVALUATION" | "SUMMARY";

export interface SpinNotification {
  type: "info" | "win" | "loss" | "suspicion" | "eviction" | "upkeep";
  message: string;
}

export function useMastertonEngine() {
  const [spinCount, setSpinCount] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [activeBettors, setActiveBettors] = useState<BettorProfile[]>(() => {
    // Spawn 4 initial random bettors
    return Array.from({ length: 4 }, (_, i) => generateRandomBettor(i + 1));
  });

  const [currentBets, setCurrentBets] = useState<Record<string, BettorBet[]>>({});
  const [selectedRig, setSelectedRig] = useState<RigChoice>({ severity: "none", target: null });
  const [consecutiveRigCount, setConsecutiveRigCount] = useState<number>(0);
  const [spinResult, setSpinResult] = useState<RouletteNumberInfo | null>(null);
  const [roundRecaps, setRoundRecaps] = useState<Record<string, number>>({});
  const [sessionTotals, setSessionTotals] = useState<Record<string, number>>({});
  const [evictedBettors, setEvictedBettors] = useState<Record<string, {
    name: string;
    reason: string;
    chips: number;
    strategy: string;
  }>>({});

  // Table House Ledger: net profit / loss of the table
  const [tableHouseLedger, setTableHouseLedger] = useState<number>(0);
  const [lastSpinHouseProfit, setLastSpinHouseProfit] = useState<number | null>(null);
  const [gameOverReason, setGameOverReason] = useState<"MAX_SPINS" | "NO_PLAYERS" | null>(null);

  // Croupier's personal commission pocket
  const [accumulatedCommission, setAccumulatedCommission] = useState<number>(0);
  const [commissionRate, setCommissionRate] = useState<number>(mastersonGameConfig.base_commission_pct);

  const [notifications, setNotifications] = useState<SpinNotification[]>([]);

  // Persistent strategy state for AI (last bet sizes to calculate Martingale / D'Alembert progressions)
  const previousBetsRef = useRef<Record<string, { lastBetAmount: number; won: boolean | null }>>({});

  const selectRig = useCallback((severity: RigChoice["severity"], target: string | null) => {
    setSelectedRig({ severity, target });
  }, []);

  const resetGame = useCallback(() => {
    setSpinCount(1);
    setPhase("BETTING");
    setActiveBettors(Array.from({ length: 4 }, (_, i) => generateRandomBettor(i + 1)));
    setCurrentBets({});
    setRoundRecaps({});
    setSessionTotals({});
    setEvictedBettors({});
    setSelectedRig({ severity: "none", target: null });
    setConsecutiveRigCount(0);
    setSpinResult(null);
    setTableHouseLedger(0);
    setLastSpinHouseProfit(null);
    setGameOverReason(null);
    setAccumulatedCommission(0);
    setCommissionRate(mastersonGameConfig.base_commission_pct);
    setNotifications([]);
    previousBetsRef.current = {};
  }, []);

  const placeInitialBets = useCallback((isDeferred = false) => {
    if (phase !== "BETTING") return;

    if (isDeferred) {
      setCurrentBets({});
      setRoundRecaps({});
      setPhase("SPINNING");
      return;
    }

    // Instant placement (used in unit tests)
    const newBets: Record<string, BettorBet[]> = {};
    const updatedBettors = activeBettors.map((bettor) => {
      const prev = previousBetsRef.current[bettor.id] || { lastBetAmount: 0, won: null };
      const { bets, nextBetAmount } = executeBettorBetting(bettor, prev.won, prev.lastBetAmount);

      const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);
      newBets[bettor.id] = bets;

      previousBetsRef.current[bettor.id] = {
        lastBetAmount: nextBetAmount,
        won: null,
      };

      return {
        ...bettor,
        chips: Math.max(0, bettor.chips - totalBetAmount),
        total_spins_bet: (bettor.total_spins_bet ?? 0) + 1,
        total_amount_bet: (bettor.total_amount_bet ?? 0) + totalBetAmount,
      };
    });

    setActiveBettors(updatedBettors);
    setCurrentBets(newBets);
    setRoundRecaps({});
    setPhase("SPINNING");
  }, [phase, activeBettors]);

  const placeSingleBettorBet = useCallback((seatId: string) => {
    const bettorIdx = activeBettors.findIndex((b) => b.id === seatId);
    if (bettorIdx === -1) return null;

    const bettor = activeBettors[bettorIdx]!;
    const prev = previousBetsRef.current[bettor.id] || { lastBetAmount: 0, won: null };
    const { bets, nextBetAmount } = executeBettorBetting(bettor, prev.won, prev.lastBetAmount);

    if (bets.length === 0) return null;

    const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);
    if (bettor.chips < totalBetAmount) return null;

    const updatedBettors = [...activeBettors];
    updatedBettors[bettorIdx] = {
      ...bettor,
      chips: bettor.chips - totalBetAmount,
      total_spins_bet: (bettor.total_spins_bet ?? 0) + 1,
      total_amount_bet: (bettor.total_amount_bet ?? 0) + totalBetAmount,
    };
    setActiveBettors(updatedBettors);

    setCurrentBets((prevBets) => {
      const existingBets = prevBets[seatId] || [];
      return {
        ...prevBets,
        [seatId]: [...existingBets, ...bets],
      };
    });

    previousBetsRef.current[bettor.id] = {
      lastBetAmount: nextBetAmount,
      won: prev.won,
    };

    return bets;
  }, [activeBettors]);

  const placeLastMinuteBet = useCallback((seatId: string) => {
    return placeSingleBettorBet(seatId);
  }, [placeSingleBettorBet]);

  const determineResultAndLock = useCallback(() => {
    let possibilities = rouletteNumbers;
    if (selectedRig.severity !== "none" && selectedRig.target) {
      possibilities = rouletteNumbers.filter((num) =>
        validateOutcomeAgainstRig(num, selectedRig)
      );
      if (possibilities.length === 0) possibilities = rouletteNumbers;
    }

    const chosenOutcome = possibilities[Math.floor(Math.random() * possibilities.length)]!;
    setSpinResult(chosenOutcome);
    return chosenOutcome;
  }, [selectedRig]);

  const resolveSpin = useCallback(() => {
    if (phase !== "SPINNING" || !spinResult) return;

    const newNotifications: SpinNotification[] = [];
    newNotifications.push({
      type: "info",
      message: `The ball landed on ${spinResult.color} ${spinResult.value}!`,
    });

    // Rigging streak tracking
    const isRigged = selectedRig.severity !== "none";
    const nextRigStreak = isRigged ? consecutiveRigCount + 1 : 0;
    setConsecutiveRigCount(nextRigStreak);

    // Dynamic commission modifier calculation based on spin streak
    // base suspension severity: 2, 3, or 5
    let baseSuspicion = 0;
    if (isRigged && selectedRig.severity !== "none") {
      baseSuspicion = mastersonGameConfig.rig_types[selectedRig.severity as "low" | "mid" | "high"].suspicion;
    }
    const streakMultiplier = Math.ceil(nextRigStreak * mastersonGameConfig.consecutive_rig_suspicion_multiplier);
    const totalTargetSuspicion = baseSuspicion + streakMultiplier;

    let spinTableProfit = 0;
    let spinPayouts = 0;

    const recaps: Record<string, number> = {};

    // Step 4 & 5: Evaluation, Payouts, & Suspicion
    const evaluatedBettors = activeBettors.map((bettor) => {
      const bets = currentBets[bettor.id] || [];
      let totalWon = 0;
      let totalLost = 0;

      bets.forEach((bet) => {
        const isWin = validateOutcomeAgainstRig(spinResult, { severity: "high", target: bet.target });
        if (isWin) {
          totalWon += bet.amount * bet.payoutOdds + bet.amount; // returns bet + payout
        } else {
          totalLost += bet.amount;
        }
      });

      const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);
      recaps[bettor.id] = totalWon - totalBetAmount;

      spinPayouts += totalWon;

      const isOverallWin = totalWon > totalLost;

      // Update bettor chips
      const finalChips = bettor.chips + totalWon;

      // Update consecutive losses
      const nextConsecutiveLosses = isOverallWin ? 0 : bettor.current_consecutive_losses + 1;

      // Update previous bet ref with results
      if (previousBetsRef.current[bettor.id]) {
        previousBetsRef.current[bettor.id]!.won = isOverallWin;
      }

      // Suspicion adjustments
      let suspicionChange = 0;
      if (isRigged) {
        if (!isOverallWin) {
          suspicionChange = totalTargetSuspicion;
        } else {
          suspicionChange = Math.max(1, Math.floor(totalTargetSuspicion * mastersonGameConfig.rig_win_suspicion_scalar));
        }
      } else {
        // Fair spin decrement
        suspicionChange = -mastersonGameConfig.no_rig_suspicion_decrease;
      }

      const nextSuspicion = Math.max(0, bettor.current_suspicion + suspicionChange);

      if (totalWon > 0) {
        newNotifications.push({
          type: "win",
          message: `${bettor.name} won ${totalWon.toLocaleString()} chips!`,
        });
      } else if (totalLost > 0) {
        newNotifications.push({
          type: "loss",
          message: `${bettor.name} lost ${totalLost.toLocaleString()} chips.`,
        });
      }

      if (suspicionChange > 0) {
        newNotifications.push({
          type: "suspicion",
          message: `${bettor.name}'s suspicion increased by +${suspicionChange}.`,
        });
      } else if (suspicionChange < 0 && bettor.current_suspicion > 0) {
        newNotifications.push({
          type: "info",
          message: `${bettor.name}'s suspicion cooled down by -1.`,
        });
      }

      const nextRecentSpins = [...(bettor.recent_spins ?? []), spinResult.value].slice(-10);

      return {
        ...bettor,
        chips: finalChips,
        current_suspicion: nextSuspicion,
        current_consecutive_losses: nextConsecutiveLosses,
        recent_spins: nextRecentSpins,
      };
    });

    // Net house earnings from this spin
    spinTableProfit = -Object.values(recaps).reduce((sum, val) => sum + val, 0);
    setLastSpinHouseProfit(spinTableProfit);
    const nextTableLedger = tableHouseLedger + spinTableProfit;
    setTableHouseLedger(nextTableLedger);

    // Personal commission
    if (spinTableProfit > 0) {
      const cut = Math.floor(spinTableProfit * (commissionRate / 100));
      setAccumulatedCommission((prev) => prev + cut);
      newNotifications.push({
        type: "upkeep",
        message: `You earned a commission cut of ${cut.toLocaleString()} chips (+${commissionRate}% of positive take).`,
      });
    }

    // Step 6: Morale and Evictions
    const remainingBettors: BettorProfile[] = [];
    const evictedIds = new Set<string>();
    let triggeredSuspicionBreach = false;
    const evicts: Record<string, { name: string; reason: string; chips: number; strategy: string }> = {};

    evaluatedBettors.forEach((bettor) => {
      let evicted = false;
      let reason = "";

      if (bettor.current_suspicion >= bettor.max_suspicion) {
        evicted = true;
        reason = "Suspicion Breach";
        triggeredSuspicionBreach = true;
      } else if (bettor.chips <= bettor.initial_chips * (1 - bettor.loss_tolerance_pct)) {
        evicted = true;
        reason = "Financial Exhaustion";
      } else if (bettor.current_consecutive_losses >= bettor.max_consecutive_losses) {
        evicted = true;
        reason = "Frustration Limit";
      }

      if (evicted) {
        evictedIds.add(bettor.id);
        evicts[bettor.id] = {
          name: bettor.name,
          reason,
          chips: bettor.chips,
          strategy: bettor.strategy,
        };
        newNotifications.push({
          type: "eviction",
          message: `💥 ${bettor.name} left the table: ${reason}.`,
        });
      } else {
        remainingBettors.push(bettor);
      }
    });

    // Herd Mental Cascade Check
    let cascadeBettors: BettorProfile[] = [];
    if (triggeredSuspicionBreach) {
      let currentDecayMultiplier = 1.0;
      const decayRate = mastersonGameConfig.herd_mentality_decay_rate;

      remainingBettors.forEach((bettor) => {
        const effectiveHerdMentality = bettor.herd_mentality_pct * currentDecayMultiplier;
        if (Math.random() < effectiveHerdMentality) {
          evictedIds.add(bettor.id);
          evicts[bettor.id] = {
            name: bettor.name,
            reason: "Herd Cascade",
            chips: bettor.chips,
            strategy: bettor.strategy,
          };
          newNotifications.push({
            type: "eviction",
            message: `🐑 Herd Cascade: ${bettor.name} saw someone leave in suspicion and packed up!`,
          });
          // Apply decay for the next possible migration check
          currentDecayMultiplier *= (1 - decayRate);
        } else {
          cascadeBettors.push(bettor);
        }
      });
    } else {
      cascadeBettors = remainingBettors;
    }

    setEvictedBettors(evicts);

    // Step 7: Upkeep & Payout Scaling / Spawning
    const nextSpin = spinCount + 1;

    // Dynamic commission update
    let nextCommRate = commissionRate;
    if (nextSpin === 8 || nextSpin === 15 || nextSpin === 23) {
      nextCommRate += mastersonGameConfig.quarter_commission_bonus_pct;
      newNotifications.push({
        type: "upkeep",
        message: `📈 House commission rate increased! You now pocket ${nextCommRate}% of positive take!`,
      });
    }
    setCommissionRate(nextCommRate);

    // Seat Replenishment Checks
    const nextActiveBettors = [...cascadeBettors];
    const seatsOpen = 4 - nextActiveBettors.length;

    if (seatsOpen > 0) {
      if (Math.random() < mastersonGameConfig.seat_fill_chance_per_spin) {
        // Spawn one new bettor
        const newSeatNum = [1, 2, 3, 4].find(
          (num) => !nextActiveBettors.some((b) => b.id === `Seat ${num}`)
        ) || 1;
        const newBettor = generateRandomBettor(newSeatNum);
        nextActiveBettors.push(newBettor);

        // Reset win/loss total and previous bet ref for the new bettor in this seat
        setSessionTotals((prev) => ({
          ...prev,
          [`Seat ${newSeatNum}`]: 0,
        }));
        previousBetsRef.current[`Seat ${newSeatNum}`] = { lastBetAmount: 0, won: null };

        newNotifications.push({
          type: "info",
          message: `👤 ${newBettor.name} joined the table at Seat ${newSeatNum}.`,
        });
      }
    }

    // Table isolation last chance check
    let noPlayers = false;
    if (nextActiveBettors.length === 0) {
      if (Math.random() < mastersonGameConfig.empty_table_last_chance_pct) {
        const fallbackBettor = generateRandomBettor(1);
        nextActiveBettors.push(fallbackBettor);

        setSessionTotals((prev) => ({
          ...prev,
          [`Seat 1`]: 0,
        }));
        previousBetsRef.current[`Seat 1`] = { lastBetAmount: 0, won: null };

        const isFinalSpin = spinCount === 30;
        newNotifications.push({
          type: "info",
          message: `🚨 Table Isolation: A wealthy gambler stepped up ${isFinalSpin ? "for the final spin" : "to keep the shift alive"}!`,
        });
      } else {
        noPlayers = true;
      }
    }

    if (noPlayers) {
      setGameOverReason("NO_PLAYERS");
    }

    setActiveBettors(nextActiveBettors);
    setNotifications(newNotifications);
    setRoundRecaps(recaps);
    setSessionTotals((prev) => {
      const next = { ...prev };
      Object.entries(recaps).forEach(([seatId, net]) => {
        next[seatId] = (next[seatId] ?? 0) + net;
      });
      return next;
    });
    setPhase("EVALUATION");
  }, [phase, spinCount, activeBettors, currentBets, selectedRig, consecutiveRigCount, tableHouseLedger, commissionRate, spinResult]);

  const advanceToSummary = useCallback(() => {
    if (phase !== "EVALUATION") return;
    setPhase("SUMMARY");
  }, [phase]);

  const nextSpinTurn = useCallback(() => {
    if (phase !== "SUMMARY" && phase !== "EVALUATION") return;
    if (spinCount >= mastersonGameConfig.shift_duration_spins) {
      setGameOverReason("MAX_SPINS");
      return;
    }
    setSpinCount((prev) => prev + 1);
    setSelectedRig({ severity: "none", target: null });
    setCurrentBets({});
    setSpinResult(null);
    setRoundRecaps({});
    setLastSpinHouseProfit(null);
    setEvictedBettors({});
    setNotifications([]);
    setPhase("BETTING");
  }, [phase, spinCount]);

  return {
    spinCount,
    phase,
    activeBettors,
    currentBets,
    selectedRig,
    consecutiveRigCount,
    spinResult,
    tableHouseLedger,
    lastSpinHouseProfit,
    gameOverReason,
    accumulatedCommission,
    commissionRate,
    notifications,
    selectRig,
    placeInitialBets,
    placeLastMinuteBet,
    placeSingleBettorBet,
    determineResultAndLock,
    resolveSpin,
    advanceToSummary,
    nextSpinTurn,
    resetGame,
    roundRecaps,
    sessionTotals,
    evictedBettors,
  };
}
