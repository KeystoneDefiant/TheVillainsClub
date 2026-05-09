/**
 * Monte Carlo harness for Fateseal Silver (see `src/config/minigames/fatesealRules.ts`, `Fateseal_Specs.md`).
 * Run: `npm run sim:fateseal`
 *
 * Environment:
 * - `FATESEAL_SIM_BASE_ONLY=1` — reset scatter meter and free ritual each spin (**base ritual RTP**; use to tune scale).
 * - unset — **full model** (scatter meter + Free Ritual spins accumulate).
 *
 * Primary tuning target: **Payout / paid base bet** in the **base-only** run ≈ **88%–95%**.
 */
import { fatesealCascadePayoutScale, fatesealScatterRitual } from "../src/config/minigames/fatesealRules";
import { createInitialFatesealState, runSpin, type FatesealEngineState } from "../src/minigames/fateseal-silver/engine/cascadeEngine";

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

const SPINS = 30_000;
const seed = 0xface1234;
const rng = mulberry32(seed);
const baseOnly = process.env.FATESEAL_SIM_BASE_ONLY === "1";

const state0 = createInitialFatesealState(100_000_000, 2000, Math.random);
let state: FatesealEngineState = {
  ...state0,
  activeProphecy: ["moon"],
  prophecyMode: "single",
  baseBet: 50,
};

if (baseOnly) {
  state = { ...state, scatterMeter: 0, freeRitualSpinsLeft: 0 };
}

let sumBet = 0;
let sumPayout = 0;

for (let i = 0; i < SPINS; i++) {
  if (baseOnly) {
    state = {
      ...state,
      scatterMeter: 0,
      freeRitualSpinsLeft: 0,
    };
  }
  const paid = state.freeRitualSpinsLeft <= 0;
  if (paid) sumBet += state.baseBet;
  const r = runSpin(state, rng);
  sumPayout += r.totalPayout;
  state = r.nextState;
}

const pct = sumBet > 0 ? (sumPayout / sumBet) * 100 : 0;

// eslint-disable-next-line no-console -- CLI report
console.log(`Fateseal Monte Carlo seed=${seed.toString(16)} spins=${SPINS}`);
// eslint-disable-next-line no-console -- CLI report
console.log(`Mode: ${baseOnly ? "FATESEAL_SIM_BASE_ONLY=1 (strip scatter & free ritual each spin)" : "full (scatter + Free Ritual)"}`);
// eslint-disable-next-line no-console -- CLI report
console.log(`Cascade payout scale: ${fatesealCascadePayoutScale}`);
if (!baseOnly) {
  // eslint-disable-next-line no-console -- CLI report
  console.log(`Scatter ritual (config): meter ${fatesealScatterRitual.meterToTrigger}, +${fatesealScatterRitual.freeSpinsGranted} spins`);
}
// eslint-disable-next-line no-console -- CLI report
console.log(`Payout / paid base bets (%): ${pct.toFixed(2)}%  (base-only target ~88–95)`);
