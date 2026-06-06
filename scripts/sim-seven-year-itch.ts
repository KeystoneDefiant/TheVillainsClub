/**
 * Monte Carlo harness for Seven Year Itch (Crapless Craps).
 * Calculates RTP and house edge for every bet type across dynamically loaded game modes.
 *
 * Run: `npm run sim:itch`
 */
import {
  sevenYearItchGameConfig,
  resolveSevenYearItchGameMode,
  PointNumber,
  HardwayNumber,
  POINT_NUMBERS,
  HARDWAY_NUMBERS,
  fieldBetReturn,
  hornBetReturn,
  placeBetTotalReturn,
  hardwayProfit,
  isFieldWinnerTotal
} from "../src/config/minigames/sevenYearItchRules";
import {
  rollDice
} from "../src/minigames/seven-year-itch/engine/craplessEngine";

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

const ROUNDS = 40_000;
const seed = 0xface1234;

export function runItchSimulations() {
  const rng = mulberry32(seed);
  const modeIds = Object.keys(sevenYearItchGameConfig.gameModes) as (keyof typeof sevenYearItchGameConfig.gameModes)[];

  console.log("==============================================================================");
  console.log(`         SEVEN YEAR ITCH BALANCE SIMULATION (rounds=${ROUNDS.toLocaleString()})`);
  console.log("==============================================================================");

  for (const modeId of modeIds) {
    const tableConfig = resolveSevenYearItchGameMode(modeId);
    console.log(`\nGame Mode: ${tableConfig.displayName} (Buy-in: ${tableConfig.buyIn}, Chip Increment: ${tableConfig.chipIncrement})`);
    console.log("------------------------------------------------------------------------------");
    console.log(" Bet Type                           | Win Rate | RTP (%)  | House Edge (%)");
    console.log("------------------------------------------------------------------------------");

    // 1. Pass Line Bet Simulation
    let passWins = 0;
    let passTotalPayout = 0;
    let passTotalBet = 0;

    for (let r = 0; r < ROUNDS; r++) {
      passTotalBet += 100;
      let point: PointNumber | null = null;
      let resolved = false;

      while (!resolved) {
        const roll = rollDice(rng);
        if (point === null) {
          // Come-out roll
          if (roll.total === 7) {
            passTotalPayout += 200; // even money win
            passWins++;
            resolved = true;
          } else {
            point = roll.total as PointNumber;
          }
        } else {
          // Point roll
          if (roll.total === point) {
            passTotalPayout += 200; // point hit win
            passWins++;
            resolved = true;
          } else if (roll.total === 7) {
            resolved = true; // seven out loss
          }
        }
      }
    }
    const passWinRate = (passWins / ROUNDS) * 100;
    const passRtp = (passTotalPayout / passTotalBet) * 100;
    const passHouseEdge = 100 - passRtp;
    console.log(` Pass Line                          |  ${passWinRate.toFixed(2).padStart(5)}%  |  ${passRtp.toFixed(3).padStart(7)}% |  ${passHouseEdge.toFixed(3).padStart(7)}%`);

    // 2. Field Bet Simulation (one-roll bet)
    let fieldWins = 0;
    let fieldTotalPayout = 0;
    const fieldTotalBet = ROUNDS * 100;

    for (let r = 0; r < ROUNDS; r++) {
      const roll = rollDice(rng);
      const payout = fieldBetReturn(roll.total, 100);
      fieldTotalPayout += payout;
      if (payout > 0) {
        fieldWins++;
      }
    }
    const fieldWinRate = (fieldWins / ROUNDS) * 100;
    const fieldRtp = (fieldTotalPayout / fieldTotalBet) * 100;
    const fieldHouseEdge = 100 - fieldRtp;
    console.log(` Field                              |  ${fieldWinRate.toFixed(2).padStart(5)}%  |  ${fieldRtp.toFixed(3).padStart(7)}% |  ${fieldHouseEdge.toFixed(3).padStart(7)}%`);

    // 3. Horn Bet Simulation (one-roll bet, equal units on 2,3,11,12 - total 100)
    let hornWins = 0;
    let hornTotalPayout = 0;
    const hornTotalBet = ROUNDS * 100;

    for (let r = 0; r < ROUNDS; r++) {
      const roll = rollDice(rng);
      const payout = hornBetReturn(roll.total, 25);
      hornTotalPayout += payout;
      if (payout > 0) {
        hornWins++;
      }
    }
    const hornWinRate = (hornWins / ROUNDS) * 100;
    const hornRtp = (hornTotalPayout / hornTotalBet) * 100;
    const hornHouseEdge = 100 - hornRtp;
    console.log(` Horn (Total Bet 100)               |  ${hornWinRate.toFixed(2).padStart(5)}%  |  ${hornRtp.toFixed(3).padStart(7)}% |  ${hornHouseEdge.toFixed(3).padStart(7)}%`);

    // 4. Place Bets Simulations (run for each point number)
    console.log("------------------------------------------------------------------------------");
    console.log(" Place Bets (Point)                 | Win Rate | RTP (%)  | House Edge (%)");
    console.log("------------------------------------------------------------------------------");
    for (const point of POINT_NUMBERS) {
      let placeWins = 0;
      let placeTotalPayout = 0;
      let placeTotalBet = 0;

      for (let r = 0; r < ROUNDS; r++) {
        // Establish main point first
        let mainPoint: PointNumber | null = null;
        while (mainPoint === null) {
          const roll = rollDice(rng);
          if (roll.total !== 7) {
            mainPoint = roll.total as PointNumber;
          }
        }

        // Place bet of 100 on target point
        placeTotalBet += 100;
        let resolved = false;

        while (!resolved) {
          const roll = rollDice(rng);
          if (roll.total === 7) {
            resolved = true; // Lose bet
          } else if (roll.total === point) {
            if (point === mainPoint) {
              placeTotalPayout += placeBetTotalReturn(point, 100);
              placeWins++;
              resolved = true; // Resolved on main point hit
            } else {
              // Non-main point pays profit, stake rides
              placeTotalPayout += placeBetTotalReturn(point, 100) - 100;
              placeWins++;
            }
          } else if (roll.total === mainPoint) {
            // Main point hit: place bet is refunded/pushed
            placeTotalPayout += 100;
            resolved = true;
          }
        }
      }
      const placeWinRate = placeTotalBet > 0 ? (placeWins / (placeTotalBet / 100)) * 100 : 0;
      const placeRtp = placeTotalBet > 0 ? (placeTotalPayout / placeTotalBet) * 100 : 0;
      const placeHouseEdge = 100 - placeRtp;
      console.log(`   Point ${point.toString().padEnd(2)}                         |  ${placeWinRate.toFixed(2).padStart(5)}%  |  ${placeRtp.toFixed(3).padStart(7)}% |  ${placeHouseEdge.toFixed(3).padStart(7)}%`);
    }

    // 5. Hardways Bets Simulations (run for each hardway number)
    console.log("------------------------------------------------------------------------------");
    console.log(" Hardway Bets                       | Win Rate | RTP (%)  | House Edge (%)");
    console.log("------------------------------------------------------------------------------");
    for (const hw of HARDWAY_NUMBERS) {
      let hwWins = 0;
      let hwTotalPayout = 0;
      let hwTotalBet = 0;

      for (let r = 0; r < ROUNDS; r++) {
        // Establish main point first
        let mainPoint: PointNumber | null = null;
        while (mainPoint === null) {
          const roll = rollDice(rng);
          if (roll.total !== 7) {
            mainPoint = roll.total as PointNumber;
          }
        }

        // Place hardway bet of 100
        hwTotalBet += 100;
        let resolved = false;

        while (!resolved) {
          const roll = rollDice(rng);
          if (roll.total === 7) {
            resolved = true; // Lose bet on 7
          } else if (roll.total === hw) {
            const isHard = roll.d1 === roll.d2;
            if (isHard) {
              hwTotalPayout += 100 + hardwayProfit(hw, 100);
              hwWins++;
              resolved = true;
            } else {
              resolved = true; // Lose bet on easy total
            }
          } else if (roll.total === mainPoint) {
            // Refunded if main point hits
            hwTotalPayout += 100;
            resolved = true;
          }
        }
      }
      const hwWinRate = hwTotalBet > 0 ? (hwWins / (hwTotalBet / 100)) * 100 : 0;
      const hwRtp = hwTotalBet > 0 ? (hwTotalPayout / hwTotalBet) * 100 : 0;
      const hwHouseEdge = 100 - hwRtp;
      console.log(`   Hard ${hw.toString().padEnd(2)}                          |  ${hwWinRate.toFixed(2).padStart(5)}%  |  ${hwRtp.toFixed(3).padStart(7)}% |  ${hwHouseEdge.toFixed(3).padStart(7)}%`);
    }
    console.log("------------------------------------------------------------------------------");
  }
}

if (process.argv[1] && (process.argv[1].endsWith("sim-seven-year-itch.ts") || process.argv[1].endsWith("sim-seven-year-itch"))) {
  runItchSimulations();
}
