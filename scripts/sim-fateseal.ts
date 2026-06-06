/**
 * Expanded Monte Carlo harness for Fateseal Silver.
 * Calculates RTP for 1, 2, 3, and 4 omens across standard and all three bonus modes
 * for all dynamically loaded game modes.
 *
 * Run: `npm run sim:fateseal`
 */
import {
  fatesealGameConfig,
  resolveFatesealGameMode,
  FatesealStandardId,
  fatesealUnsettleSpiritsConfig,
  fatesealFaustianBargainConfig,
  fatesealVassagoGambitConfig
} from "../src/config/minigames/fatesealRules";
import { createInitialFatesealState, runSpin } from "../src/minigames/fateseal-silver/engine/cascadeEngine";

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

const SPINS = 20_000;
const seed = 0xface1234;

// Test standard omens
const omenPool: FatesealStandardId[] = ["moon", "dagger", "chalice", "goat"];

export function runFatesealSimulations() {
  const rng = mulberry32(seed);
  const modeIds = Object.keys(fatesealGameConfig.gameModes) as (keyof typeof fatesealGameConfig.gameModes)[];

  console.log("======================================================================================================================");
  console.log(`         FATESEAL SILVER BALANCE SIMULATION (spins=${SPINS.toLocaleString()})`);
  console.log("======================================================================================================================");

  for (const modeId of modeIds) {
    const tableConfig = resolveFatesealGameMode(modeId);
    console.log(`\nGame Mode: ${tableConfig.displayName} (Buy-in: ${tableConfig.buyIn}, Min Bet: ${tableConfig.minBaseBet})`);
    console.log("----------------------------------------------------------------------------------------------------------------------");
    console.log(" Omens | Std RTP | Unsettle Spins | Unsettle Net* | Faustian Spins | Faustian Net** | Vassago Spins | Vassago Net***");
    console.log("----------------------------------------------------------------------------------------------------------------------");

    for (let omenCount = 1; omenCount <= 4; omenCount++) {
      const activeOmens = omenPool.slice(0, omenCount);

      // 1. Standard Play Simulation
      let stateStd = createInitialFatesealState(100_000_000, tableConfig.buyIn, rng, tableConfig);
      stateStd.activeProphecy = [...activeOmens];
      stateStd.prophecyMode = "single";
      let stdBet = 0;
      let stdPayout = 0;

      for (let i = 0; i < SPINS; i++) {
        const paid = stateStd.freeRitualSpinsLeft <= 0;
        if (paid) {
          stdBet += stateStd.tomeToggleActive ? Math.floor(stateStd.baseBet * 1.25) : stateStd.baseBet;
        }
        const r = runSpin(stateStd, rng, { forBaseRitualSim: false });
        stdPayout += r.totalPayout;
        stateStd = r.nextState;
      }
      const stdRtp = stdBet > 0 ? (stdPayout / stdBet) * 100 : 0;

      // 2. Unsettle Spirits (Wild Reels) Play Simulation
      const minPrice = fatesealUnsettleSpiritsConfig.minPrice;
      const wildDuration = fatesealUnsettleSpiritsConfig.durationSpins;
      const wildBetSize = fatesealUnsettleSpiritsConfig.betSize;
      let wildPayout = 0;
      let wildTotalCost = 0;
      let wildSpinsCount = 0;

      while (wildSpinsCount < SPINS) {
        // Choose cost randomly between minPrice and 1.5 * minPrice
        const cost = minPrice + Math.floor(rng() * (minPrice * 0.5));
        wildTotalCost += cost;

        let stateWild = createInitialFatesealState(100_000_000, tableConfig.buyIn, rng, tableConfig);
        stateWild.activeProphecy = [...activeOmens];
        stateWild.prophecyMode = "single";
        stateWild.wildReelPaidSpinTimers = [wildDuration];

        for (let s = 0; s < wildDuration; s++) {
          const r = runSpin(stateWild, rng, { forBaseRitualSim: false });
          wildPayout += r.totalPayout;
          stateWild = r.nextState;
          wildSpinsCount++;
        }
      }
      const wildSpinsRtp = (wildPayout / (wildSpinsCount * wildBetSize)) * 100;
      const wildNetRtp = (wildPayout / wildTotalCost) * 100;

      // 3. Faustian Bargain (Dead Reels) Play Simulation
      const grant = Math.max(0, Math.floor(tableConfig.buyIn * fatesealFaustianBargainConfig.creditRatioOfBuyIn));
      const deadDuration = fatesealFaustianBargainConfig.durationSpinsPerLevel;
      const deadBetSize = fatesealFaustianBargainConfig.lockedBetSize;
      let deadPayout = 0;
      let deadTotalBets = 0;
      let deadTotalGrant = 0;
      let deadSpinsCount = 0;

      while (deadSpinsCount < SPINS) {
        deadTotalBets += deadDuration * deadBetSize;
        deadTotalGrant += grant;

        let stateDead = createInitialFatesealState(100_000_000, tableConfig.buyIn, rng, tableConfig);
        stateDead.activeProphecy = [...activeOmens];
        stateDead.prophecyMode = "single";
        stateDead.deadReelPaidSpinTimers = [deadDuration];

        for (let s = 0; s < deadDuration; s++) {
          const r = runSpin(stateDead, rng, { forBaseRitualSim: false });
          deadPayout += r.totalPayout;
          stateDead = r.nextState;
          deadSpinsCount++;
        }
      }
      const deadSpinsRtp = (deadPayout / (deadSpinsCount * deadBetSize)) * 100;
      const deadNetRtp = ((deadPayout + deadTotalGrant) / deadTotalBets) * 100;

      // 4. Vassago's Gambit Play Simulation
      const vassagoMinPrice = fatesealVassagoGambitConfig.minPrice;
      const vassagoDuration = fatesealVassagoGambitConfig.durationSpins;
      const vassagoBetSize = fatesealVassagoGambitConfig.betSize;
      let vassagoPayout = 0;
      let vassagoTotalCost = 0;
      let vassagoSpinsCount = 0;

      while (vassagoSpinsCount < SPINS) {
        // Choose cost randomly between minPrice and 1.5 * minPrice
        const cost = vassagoMinPrice + Math.floor(rng() * (vassagoMinPrice * 0.5));
        vassagoTotalCost += cost;

        const stateVassago = createInitialFatesealState(100_000_000, tableConfig.buyIn, rng, tableConfig);
        stateVassago.activeProphecy = [...activeOmens];
        stateVassago.prophecyMode = "single";
        stateVassago.vassagoActive = true;

        const r = runSpin(stateVassago, rng, { forBaseRitualSim: false });
        vassagoPayout += r.totalPayout;
        vassagoSpinsCount += vassagoDuration;
      }
      const vassagoSpinsRtp = (vassagoPayout / (vassagoSpinsCount * vassagoBetSize)) * 100;
      const vassagoNetRtp = (vassagoPayout / vassagoTotalCost) * 100;

      console.log(
        `   ${omenCount}   | ${stdRtp.toFixed(2).padStart(6)}% | ${wildSpinsRtp.toFixed(2).padStart(12)}% | ${wildNetRtp.toFixed(2).padStart(11)}% | ${deadSpinsRtp.toFixed(2).padStart(12)}% | ${deadNetRtp.toFixed(2).padStart(12)}% | ${vassagoSpinsRtp.toFixed(2).padStart(11)}% | ${vassagoNetRtp.toFixed(2).padStart(12)}%`
      );
    }
    console.log("----------------------------------------------------------------------------------------------------------------------");
  }
  console.log("*Note: Unsettle Net RTP incorporates the random buy-in cost (between min price and 50% above).");
  console.log("**Note: Faustian Net RTP includes the credit grant from accepting the dead reel.");
  console.log("***Note: Vassago Net RTP incorporates the random buy-in cost (between min price and 50% above).");
}

// Run if called directly
if (process.argv[1] && (process.argv[1].endsWith("sim-fateseal.ts") || process.argv[1].endsWith("sim-fateseal"))) {
  runFatesealSimulations();
}
