/**
 * Monte Carlo harness for Oubliette No. 9 (Video Poker).
 * Calculates RTP for all dynamically loaded game modes.
 *
 * Run: `npm run sim:oubliette`
 */
import { gameConfig, resolveOublietteGameMode } from "../src/config/minigames/oublietteNo9GameRules";
import { createFullDeck, shuffleDeck } from "../src/minigames/oubliette-no9/utils/deck";
import { generateParallelHands } from "../src/minigames/oubliette-no9/utils/parallelHands";
import { PokerEvaluator } from "../src/minigames/oubliette-no9/utils/pokerEvaluator";
import { Card } from "../src/minigames/oubliette-no9/types";

const RANK_VALUES: { [key: string]: number } = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
  J: 11, Q: 12, K: 13, A: 14,
};

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

const ROUNDS = 20_000;
const seed = 0xface1234;

/**
 * Standard Jacks or Better heuristic for card holdings.
 */
function decideHeldIndices(hand: Card[], minimumPairRank: number): number[] {
  // Evaluate the initial 5 cards
  const result = PokerEvaluator.evaluate(hand, { minimumPairRank });
  if (result.rank !== "high-card" && result.rank !== "one-pair") {
    // Hold paying hands (Two Pair, 3 of a Kind, Straight, Flush, etc.)
    return [0, 1, 2, 3, 4];
  }

  // Check for 4 to a Flush
  const suitCounts: Record<string, number[]> = {};
  hand.forEach((card, idx) => {
    suitCounts[card.suit] = suitCounts[card.suit] || [];
    suitCounts[card.suit].push(idx);
  });
  for (const suit of Object.keys(suitCounts)) {
    if (suitCounts[suit].length >= 4) {
      return suitCounts[suit];
    }
  }

  // Check for Pairs
  const rankCounts: Record<string, number[]> = {};
  hand.forEach((card, idx) => {
    rankCounts[card.rank] = rankCounts[card.rank] || [];
    rankCounts[card.rank].push(idx);
  });
  let pairIndices: number[] = [];
  for (const rank of Object.keys(rankCounts)) {
    if (rankCounts[rank].length === 2) {
      pairIndices = rankCounts[rank];
      if (RANK_VALUES[rank] >= minimumPairRank) {
        return pairIndices; // Hold paying pair
      }
    }
  }
  if (pairIndices.length === 2) {
    return pairIndices; // Hold low pair
  }

  // Check for 4 to a Straight
  const sortedWithIndices = hand
    .map((card, idx) => ({ rankVal: RANK_VALUES[card.rank], idx }))
    .sort((a, b) => a.rankVal - b.rankVal);
  for (let start = 0; start <= 1; start++) {
    const sub = sortedWithIndices.slice(start, start + 4);
    const span = sub[3].rankVal - sub[0].rankVal;
    const distinct = new Set(sub.map(s => s.rankVal));
    if (distinct.size === 4 && span <= 4) {
      return sub.map(s => s.idx);
    }
  }

  // Hold High Cards
  const highCardIndices: number[] = [];
  hand.forEach((card, idx) => {
    if (RANK_VALUES[card.rank] >= 11) {
      highCardIndices.push(idx);
    }
  });
  if (highCardIndices.length > 0) {
    return highCardIndices;
  }

  return []; // Hold nothing
}

export function runOublietteSimulations() {
  const rng = mulberry32(seed);
  const modeIds = Object.keys(gameConfig.gameModes) as (keyof typeof gameConfig.gameModes)[];

  console.log("==============================================================================");
  console.log(`         OUBLIETTE NO. 9 BALANCE SIMULATION (rounds=${ROUNDS.toLocaleString()})`);
  console.log("==============================================================================");

  for (const modeId of modeIds) {
    const mode = resolveOublietteGameMode(modeId);
    let totalBet = 0;
    let totalPayout = 0;

    for (let r = 0; r < ROUNDS; r++) {
      const betAmount = mode.startingBet;
      const handCount = mode.startingHandCount;
      const roundBet = betAmount * handCount;
      totalBet += roundBet;

      // Deal initial hand
      const fullDeck = createFullDeck();
      // Fisher-Yates shuffle with our RNG
      const shuffled = [...fullDeck];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i]!, shuffled[j]!] = [shuffled[j]!, shuffled[i]!];
      }

      const initialHand = shuffled.slice(0, 5);
      const heldIndices = decideHeldIndices(initialHand, mode.minimumPairRank);

      // Generate parallel hands
      // The generateParallelHands function uses custom seeds, which is fine for Monte Carlo
      const parallelHands = generateParallelHands(
        initialHand,
        heldIndices,
        handCount,
        [],
        [],
        []
      );

      // Evaluate parallel hands
      let roundPayout = 0;
      for (const hand of parallelHands) {
        const result = PokerEvaluator.evaluate(hand.cards, { minimumPairRank: mode.minimumPairRank });
        const withRewards = PokerEvaluator.applyRewards(result, mode.rewards);
        roundPayout += betAmount * withRewards.multiplier;
      }
      totalPayout += roundPayout;
    }

    const rtp = (totalPayout / totalBet) * 100;
    const houseEdge = 100 - rtp;

    console.log(`Game Mode: ${mode.displayName}`);
    console.log(`  Starting Hands: ${mode.startingHandCount}`);
    console.log(`  Starting Bet:   ${mode.startingBet}`);
    console.log(`  Min Pair Rank:  ${mode.minimumPairRank}`);
    console.log(`  Simulated RTP:  ${rtp.toFixed(3)}%`);
    console.log(`  House Edge:     ${houseEdge.toFixed(3)}%`);
    console.log("------------------------------------------------------------------------------");
  }
}

if (process.argv[1] && (process.argv[1].endsWith("sim-oubliette.ts") || process.argv[1].endsWith("sim-oubliette"))) {
  runOublietteSimulations();
}
