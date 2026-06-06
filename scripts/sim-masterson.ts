/**
 * Monte Carlo harness for Masterton 1881.
 * Simulates table profits, house edge, and croupier commission under fair vs rigged play
 * across all dynamically loaded game modes.
 *
 * Run: `npm run sim:masterson`
 */
import {
  mastersonGameConfig,
  resolveMastersonGameMode,
  rouletteNumbers,
  validateOutcomeAgainstRig,
  RouletteNumberInfo,
  BettorProfile
} from "../src/config/minigames/mastersonRules";
import { generateRandomBettor, executeBettorBetting } from "../src/minigames/masterson-1881/engine/bettorAI";

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const SHIFTS = 200;
const seed = 0xface1234;

interface SimMetrics {
  totalPlayerBets: number;
  totalTableProfit: number;
  totalCommission: number;
  totalSpins: number;
  totalEvictions: number;
}

function runShift(
  modeId: string,
  rigged: boolean,
  rng: () => number
): SimMetrics {
  const config = resolveMastersonGameMode(modeId);
  const maxSpins = config.shift_duration_spins || 30;
  const maxBettors = config.max_bettors || 4;

  let activeBettors = Array.from({ length: maxBettors }, (_, i) => generateRandomBettor(i + 1));
  const previousBets: Record<string, { lastBetAmount: number; won: boolean | null }> = {};

  let totalPlayerBets = 0;
  let totalTableProfit = 0;
  let totalCommission = 0;
  let totalEvictions = 0;
  let commissionRate = config.base_commission_pct;
  let consecutiveRigStreak = 0;
  let totalSpins = 0;

  for (let spin = 1; spin <= maxSpins; spin++) {
    if (activeBettors.length === 0) {
      // Table isolation last chance check
      if (rng() < config.empty_table_last_chance_pct) {
        const fallbackBettor = generateRandomBettor(1);
        activeBettors.push(fallbackBettor);
      } else {
        break; // shift ends early due to empty table
      }
    }
    totalSpins++;

    // 1. Bettors place bets
    const currentBets: Record<string, any[]> = {};
    activeBettors = activeBettors.map((bettor) => {
      const prev = previousBets[bettor.id] || { lastBetAmount: 0, won: null };
      const { bets, nextBetAmount } = executeBettorBetting(bettor, prev.won, prev.lastBetAmount);
      currentBets[bettor.id] = bets;
      const roundBetTotal = bets.reduce((sum, b) => sum + b.amount, 0);
      totalPlayerBets += roundBetTotal;

      previousBets[bettor.id] = { lastBetAmount: nextBetAmount, won: null };
      return {
        ...bettor,
        chips: Math.max(0, bettor.chips - roundBetTotal),
        total_spins_bet: (bettor.total_spins_bet ?? 0) + 1,
        total_amount_bet: (bettor.total_amount_bet ?? 0) + roundBetTotal,
      };
    });

    // 2. Select spin result
    let spinResult: RouletteNumberInfo;
    if (rigged) {
      // Find outcome that minimizes total player payouts (maximizes table profit)
      let minPayout = Number.POSITIVE_INFINITY;
      let bestOutcomes: RouletteNumberInfo[] = [];

      for (const outcome of rouletteNumbers) {
        let outcomePayout = 0;
        activeBettors.forEach((bettor) => {
          const wagers = currentBets[bettor.id] || [];
          wagers.forEach((w) => {
            const isWin = validateOutcomeAgainstRig(outcome, { severity: "high", target: w.target });
            if (isWin) {
              outcomePayout += w.amount * w.payoutOdds + w.amount;
            }
          });
        });

        if (outcomePayout < minPayout) {
          minPayout = outcomePayout;
          bestOutcomes = [outcome];
        } else if (outcomePayout === minPayout) {
          bestOutcomes.push(outcome);
        }
      }

      spinResult = bestOutcomes[Math.floor(rng() * bestOutcomes.length)]!;
      consecutiveRigStreak++;
    } else {
      // Fair wheel spin
      spinResult = rouletteNumbers[Math.floor(rng() * rouletteNumbers.length)]!;
      consecutiveRigStreak = 0;
    }

    // 3. Resolve spin payouts
    const recaps: Record<string, number> = {};
    const baseSuspicion = rigged ? 3 : 0; // average mid severity
    const streakMult = Math.ceil(consecutiveRigStreak * mastersonGameConfig.consecutive_rig_suspicion_multiplier);
    const totalTargetSuspicion = baseSuspicion + streakMult;

    activeBettors = activeBettors.map((bettor) => {
      const wagers = currentBets[bettor.id] || [];
      let totalWon = 0;
      let totalLost = 0;

      wagers.forEach((w) => {
        const isWin = validateOutcomeAgainstRig(spinResult, { severity: "high", target: w.target });
        if (isWin) {
          totalWon += w.amount * w.payoutOdds + w.amount;
        } else {
          totalLost += w.amount;
        }
      });

      const totalBetAmount = wagers.reduce((sum, b) => sum + b.amount, 0);
      recaps[bettor.id] = totalWon - totalBetAmount;

      const isOverallWin = totalWon > totalLost;

      // Suspicion adjustments
      let suspicionChange = 0;
      if (rigged) {
        if (!isOverallWin) {
          suspicionChange = totalTargetSuspicion;
        } else {
          suspicionChange = Math.max(1, Math.floor(totalTargetSuspicion * mastersonGameConfig.rig_win_suspicion_scalar));
        }
      } else {
        suspicionChange = -mastersonGameConfig.no_rig_suspicion_decrease;
      }

      if (previousBets[bettor.id]) {
        previousBets[bettor.id]!.won = isOverallWin;
      }

      return {
        ...bettor,
        chips: bettor.chips + totalWon,
        current_suspicion: Math.max(0, bettor.current_suspicion + suspicionChange),
        current_consecutive_losses: isOverallWin ? 0 : bettor.current_consecutive_losses + 1,
      };
    });

    // Net house profit
    const spinTableProfit = -Object.values(recaps).reduce((sum, val) => sum + val, 0);
    totalTableProfit += spinTableProfit;

    // Commission cut
    if (spinTableProfit > 0) {
      totalCommission += Math.floor(spinTableProfit * (commissionRate / 100));
    }

    // Evictions
    const survivors: BettorProfile[] = [];
    let triggeredSuspicionBreach = false;

    activeBettors.forEach((bettor) => {
      let evicted = false;
      if (bettor.current_suspicion >= bettor.max_suspicion) {
        evicted = true;
        triggeredSuspicionBreach = true;
      } else if (bettor.chips <= bettor.initial_chips * (1 - bettor.loss_tolerance_pct)) {
        evicted = true;
      } else if (bettor.current_consecutive_losses >= bettor.max_consecutive_losses) {
        evicted = true;
      }

      if (evicted) {
        totalEvictions++;
      } else {
        survivors.push(bettor);
      }
    });

    // Herd mental cascade check
    let cascadeBettors: BettorProfile[] = [];
    if (triggeredSuspicionBreach) {
      let currentDecay = 1.0;
      survivors.forEach((bettor) => {
        if (rng() < bettor.herd_mentality_pct * currentDecay) {
          totalEvictions++;
          currentDecay *= (1 - mastersonGameConfig.herd_mentality_decay_rate);
        } else {
          cascadeBettors.push(bettor);
        }
      });
    } else {
      cascadeBettors = survivors;
    }

    activeBettors = cascadeBettors;

    // Upkeeps
    if (spin === 8 || spin === 15 || spin === 23) {
      commissionRate += mastersonGameConfig.quarter_commission_bonus_pct;
    }

    // Replenishment
    const seatsOpen = maxBettors - activeBettors.length;
    if (seatsOpen > 0 && rng() < config.seat_fill_chance_per_spin) {
      const possibleSeats = Array.from({ length: maxBettors }, (_, i) => i + 1);
      const newSeatNum = possibleSeats.find(
        (num) => !activeBettors.some((b) => b.id === `Seat ${num}`)
      ) || 1;
      const newBettor = generateRandomBettor(newSeatNum);
      activeBettors.push(newBettor);
      previousBets[`Seat ${newSeatNum}`] = { lastBetAmount: 0, won: null };
    }
  }

  return {
    totalPlayerBets,
    totalTableProfit,
    totalCommission,
    totalSpins,
    totalEvictions
  };
}

export function runMastersonSimulations() {
  const rng = mulberry32(seed);
  const modeIds = Object.keys(mastersonGameConfig.gameModes) as (keyof typeof mastersonGameConfig.gameModes)[];

  console.log("==============================================================================");
  console.log(`         MASTERTON 1881 BALANCE SIMULATION (shifts=${SHIFTS.toLocaleString()})`);
  console.log("==============================================================================");

  for (const modeId of modeIds) {
    const config = resolveMastersonGameMode(modeId);
    console.log(`\nGame Mode: ${config.displayName} (Buy-in: ${config.buyIn}, Max Bettors: ${config.max_bettors})`);

    for (const rigged of [false, true]) {
      let totalBets = 0;
      let totalTableProfit = 0;
      let totalCommission = 0;
      let totalSpins = 0;
      let totalEvictions = 0;

      for (let s = 0; s < SHIFTS; s++) {
        const metrics = runShift(modeId, rigged, rng);
        totalBets += metrics.totalPlayerBets;
        totalTableProfit += metrics.totalTableProfit;
        totalCommission += metrics.totalCommission;
        totalSpins += metrics.totalSpins;
        totalEvictions += metrics.totalEvictions;
      }

      const avgSpins = totalSpins / SHIFTS;
      const houseEdge = totalBets > 0 ? (totalTableProfit / totalBets) * 100 : 0;
      const avgCommission = totalCommission / SHIFTS;
      // Croupier RTP = (Buy-in + Commission) / Buy-in
      const croupierRtp = ((config.buyIn + avgCommission) / config.buyIn) * 100;
      const avgEvictions = totalEvictions / SHIFTS;

      console.log(`  Croupier Strategy: [${rigged ? "OPTIMAL RIGGING" : "FAIR PLAY"}]`);
      console.log(`    Avg Table Profit/Shift:   ${Math.round(totalTableProfit / SHIFTS).toLocaleString().padStart(6)} cr`);
      console.log(`    Table House Edge (RTP):   ${houseEdge.toFixed(2).padStart(6)}% (${(100 - houseEdge).toFixed(2)}%)`);
      console.log(`    Avg Croupier Commission:  ${Math.round(avgCommission).toLocaleString().padStart(6)} cr`);
      console.log(`    Croupier Shift ROI/RTP:   ${(croupierRtp - 100).toFixed(2).padStart(6)}% / ${croupierRtp.toFixed(2)}%`);
      console.log(`    Avg Evictions/Shift:      ${avgEvictions.toFixed(2).padStart(6)}`);
      console.log(`    Avg Spins Survived/Shift: ${avgSpins.toFixed(2).padStart(6)}`);
      console.log("  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -");
    }
  }
}

if (process.argv[1] && (process.argv[1].endsWith("sim-masterson.ts") || process.argv[1].endsWith("sim-masterson"))) {
  runMastersonSimulations();
}
