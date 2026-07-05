/**
 * Monte Carlo harness for Lignée Royale (Card Slots).
 * Calculates RTP for all dynamically loaded game modes.
 *
 * Run: `npm run sim:lignee-royale` (or `npx tsx scripts/sim-lignee-royale.ts`)
 */
import { resolveLigneeRoyaleGameMode as getGameMode } from "../src/config/minigames/ligneeRoyaleConfig";
import { createFullDeck, shuffleDeck } from "../src/game/poker/deck";
import { PokerEvaluator } from "../src/game/poker/pokerEvaluator";
import { Card } from "../src/game/poker/types";

// Local definition of payline rows to avoid importing React components (and SCSS) in Node env
const LIGNEE_ROYALE_LINES = [
  { id: "middle", name: "Middle Row", rows: [3, 3, 3, 3, 3] },
  { id: "top", name: "Top Row", rows: [2, 2, 2, 2, 2] },
  { id: "bottom", name: "Bottom Row", rows: [4, 4, 4, 4, 4] },
  { id: "diagonal-v", name: "V-Diagonal", rows: [2, 3, 4, 3, 2] },
  { id: "diagonal-inv-v", name: "Inverted V-Diagonal", rows: [4, 3, 2, 3, 4] },
  { id: "off-diagonal-down", name: "Off-Diagonal Down", rows: [2, 2, 3, 4, 4] },
  { id: "off-diagonal-up", name: "Off-Diagonal Up", rows: [4, 4, 3, 2, 2] },
];

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

const ROUNDS = 50_000;
const seed = 0xface1234;

export function runLigneeRoyaleSimulations() {
  const rng = mulberry32(seed);
  const modeIds = ["normalGame", "highStakes"];

  console.log("==============================================================================");
  console.log(`         LIGNÉE ROYALE BALANCE SIMULATION (rounds=${ROUNDS.toLocaleString()})`);
  console.log("==============================================================================");

  for (const modeId of modeIds) {
    const mode = getGameMode(modeId);
    
    // We will test all multipliers: 1x (1 line), 2x (3 lines), 3x (5 lines), 4x (7 lines)
    const multipliers = [1, 2, 3, 4];

    console.log(`\n--- Game Mode: ${mode.displayName} ---`);
    console.log(`Buy-in: ${mode.buyIn} | Min Bet: ${mode.minBet} | Max Bet: ${mode.maxBet}`);
    
    // Create base deck representation (before custom special cards)
    const baseDeck = createFullDeck([], [], [], mode.deckComposition.suits, mode.deckComposition.ranks);

    // Create special cards list
    const specialCards: Card[] = [];
    for (let i = 0; i < mode.maxWildCards; i++) {
      specialCards.push({ suit: "hearts", rank: "A", id: `wild-std-${i}`, isWild: true });
    }
    for (let i = 0; i < mode.maxWild2xCards; i++) {
      specialCards.push({ suit: "diamonds", rank: "A", id: `wild-2x-${i}`, isWild: true, wildMultiplier: 2 });
    }
    for (let i = 0; i < mode.maxWild3xCards; i++) {
      specialCards.push({ suit: "clubs", rank: "A", id: `wild-3x-${i}`, isWild: true, wildMultiplier: 3 });
    }
    for (let i = 0; i < mode.maxWild5xCards; i++) {
      specialCards.push({ suit: "spades", rank: "A", id: `wild-5x-${i}`, isWild: true, wildMultiplier: 5 });
    }
    for (let i = 0; i < mode.maxDeadCards; i++) {
      specialCards.push({ suit: "hearts", rank: "2", id: `dead-card-${i}`, isDead: true });
    }

    const fullSimulationDeck = [...baseDeck, ...specialCards];
    console.log(`Total Deck Size (standard + special): ${fullSimulationDeck.length} cards`);
    console.log(`Wilds: ${mode.maxWildCards} | Wild 2x: ${mode.maxWild2xCards} | Wild 3x: ${mode.maxWild3xCards} | Wild 5x: ${mode.maxWild5xCards} | Dead: ${mode.maxDeadCards}`);

    for (const mult of multipliers) {
      let totalBet = 0;
      let totalPayout = 0;
      let winningSpins = 0;

      const activeLinesCount = mult === 1 ? 1 : mult === 2 ? 3 : mult === 3 ? 5 : 7;
      const activeLines = LIGNEE_ROYALE_LINES.slice(0, activeLinesCount);

      // Tally of hand ranks made
      const handCounts: Record<string, number> = {};

      for (let r = 0; r < ROUNDS; r++) {
        const betAmount = mode.minBet;
        const spinBet = betAmount * mult;
        totalBet += spinBet;

        // Shuffle deck
        const shuffled = [...fullSimulationDeck];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [shuffled[i]!, shuffled[j]!] = [shuffled[j]!, shuffled[i]!];
        }

        // Deal 7x5 grid
        const grid: Card[][] = [
          [shuffled[0], shuffled[7], shuffled[14], shuffled[21], shuffled[28]],
          [shuffled[1], shuffled[8], shuffled[15], shuffled[22], shuffled[29]],
          [shuffled[2], shuffled[9], shuffled[16], shuffled[23], shuffled[30]],
          [shuffled[3], shuffled[10], shuffled[17], shuffled[24], shuffled[31]],
          [shuffled[4], shuffled[11], shuffled[18], shuffled[25], shuffled[32]],
          [shuffled[5], shuffled[12], shuffled[19], shuffled[26], shuffled[33]],
          [shuffled[6], shuffled[13], shuffled[20], shuffled[27], shuffled[34]],
        ];

        let spinPayout = 0;
        let isWin = false;

        for (const line of activeLines) {
          const lineCards = line.rows.map((rowIdx, colIdx) => grid[rowIdx][colIdx]);
          
          try {
            const result = PokerEvaluator.evaluate(lineCards, { minimumPairRank: mode.minimumPairRank });
            
            if (result.score > 0 && mode.rewards[result.rank] > 0) {
              const baseMult = mode.rewards[result.rank];
              
              // Calculate wild multiplier stacking
              let wildMult = 1;
              lineCards.forEach((c) => {
                if (c.isWild && c.wildMultiplier && c.wildMultiplier > 1) {
                  wildMult *= c.wildMultiplier;
                }
              });

              const linePayout = betAmount * baseMult * wildMult;
              spinPayout += linePayout;
              isWin = true;

              handCounts[result.rank] = (handCounts[result.rank] || 0) + 1;
            }
          } catch {
            // Evaluator safe check
          }
        }

        const finalPayout = Math.min(spinPayout, mode.maxPayout);
        totalPayout += finalPayout;
        if (isWin) {
          winningSpins++;
        }
      }

      const rtp = (totalPayout / totalBet) * 100;
      const hitFreq = (winningSpins / ROUNDS) * 100;

      console.log(`\n  Multiplier: ${mult}x (${activeLinesCount} active lines)`);
      console.log(`    Total Bet: ${totalBet.toLocaleString()} cr`);
      console.log(`    Total Return: ${totalPayout.toLocaleString()} cr`);
      console.log(`    Calculated RTP: ${rtp.toFixed(2)}% (Target: 85.00% - 98.00%)`);
      console.log(`    Hit Frequency: ${hitFreq.toFixed(2)}%`);
      
      if (mult === 4) {
        console.log(`    Hand distributions (total hits across all paylines):`);
        Object.entries(handCounts)
          .sort((a, b) => b[1] - a[1])
          .forEach(([rank, count]) => {
            console.log(`      - ${rank}: ${count.toLocaleString()} times`);
          });
      }
    }
  }
  console.log("==============================================================================");
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runLigneeRoyaleSimulations();
}
