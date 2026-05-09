/**
 * Monte Carlo harness for Fateseal Silver default weights (see `src/config/minigames/fatesealRules.ts`).
 * Run: `npm run sim:fateseal`
 */
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

const SPINS = 15_000;
const seed = 0xface1234;
const rng = mulberry32(seed);

let state = createInitialFatesealState(5_000_000, 2000, Math.random);
state.activeProphecy = ["moon"];
state.prophecyMode = "single";
state.baseBet = 50;

let net = 0;
for (let i = 0; i < SPINS; i++) {
  const before = state.sessionWallet;
  const r = runSpin(state, rng);
  state = r.nextState;
  net += state.sessionWallet - before;
}

const avg = net / SPINS;
// eslint-disable-next-line no-console -- CLI report
console.log(`Fateseal Monte Carlo seed=${seed.toString(16)} spins=${SPINS}`);
// eslint-disable-next-line no-console -- CLI report
console.log(`Avg net change per spin (session credits): ${avg.toFixed(3)}`);
