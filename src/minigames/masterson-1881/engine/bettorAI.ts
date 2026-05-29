import { BettorProfile, rouletteNumbers, mastersonGameConfig } from "@/config/minigames/mastersonRules";

export interface BettorBet {
  target: string; // E.g., "Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36", "Column_1", "Dozen_2", "17", etc.
  amount: number;
  payoutOdds: number; // 1 for 1:1, 2 for 2:1, 35 for 35:1
}

// Map bet targets to payout odds
export function getPayoutOddsForTarget(target: string): number {
  if (["Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36"].includes(target)) {
    return 1;
  }
  if (["Column_1", "Column_2", "Column_3", "Dozen_1", "Dozen_2", "Dozen_3"].includes(target)) {
    return 2;
  }
  if (target.startsWith("Street_")) {
    return 11;
  }
  if (target.startsWith("Corner_")) {
    return 8;
  }
  if (target.startsWith("DoubleStreet_")) {
    return 5;
  }
  return 35; // Specific number
}

// Generate names for seat profiles
const SURNAMES = ["Vance", "Lupin", "Moriarty", "Riddle", "Ratched", "Kruger", "Lecter", "Bates", "Duval", "Skeeter", "Gekko", "Corleone"];
const FIRST_NAMES = ["Victor", "Arsene", "James", "Tom", "Mildred", "Freddy", "Hannibal", "Norman", "Claude", "Rita", "Gordon", "Vito"];

export function generateRandomBettor(seatIndex: number): BettorProfile {
  const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`;
  const strategies: BettorProfile["strategy"][] = [
    "D_Alembert",
    "Martingale",
    "Random",
    "Random_1_1",
    "Hedges",
    "Low_Risk_Grind",
    "High_Risk",
  ];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)]!;
  
  // Starting chips between 5,000 and 200,000 in whole $500 increments
  const initial_chips = Math.round((Math.random() * (200000 - 5000) + 5000) / 500) * 500;
  const minSusp = mastersonGameConfig.min_bettor_max_suspicion;
  const maxSusp = mastersonGameConfig.max_bettor_max_suspicion;
  const max_suspicion = Math.floor(Math.random() * (maxSusp - minSusp) + minSusp);
  const loss_tolerance_pct = parseFloat((Math.random() * (1.00 - 0.50) + 0.50).toFixed(2)); // 0.50 to 1.00
  const max_consecutive_losses = Math.floor(Math.random() * (10 - 2) + 2); // 2 to 10
  const double_bet_frequency = parseFloat(Math.random().toFixed(2));
  const minHerd = mastersonGameConfig.min_bettor_herd_mentality_pct;
  const maxHerd = mastersonGameConfig.max_bettor_herd_mentality_pct;
  const herd_mentality_pct = parseFloat((Math.random() * (maxHerd - minHerd) + minHerd).toFixed(2));

  return {
    id: `Seat ${seatIndex}`,
    name,
    strategy,
    chips: initial_chips,
    initial_chips,
    max_suspicion,
    current_suspicion: 0,
    loss_tolerance_pct,
    max_consecutive_losses,
    current_consecutive_losses: 0,
    double_bet_frequency,
    herd_mentality_pct,
  };
}

const CONTRADICTORY_PAIRS: [string, string][] = [
  ["Red", "Black"],
  ["Even", "Odd"],
  ["Low_1_18", "High_19_36"],
];

export function isContradictoryBet(newTarget: string, existingBets: BettorBet[]): boolean {
  if (existingBets.length === 0) return false;

  const existingTargets = existingBets.map(b => b.target);

  // Check 1: Red/Black, Even/Odd, Low/High contradictions
  for (const [t1, t2] of CONTRADICTORY_PAIRS) {
    if (newTarget === t1 && existingTargets.includes(t2)) return true;
    if (newTarget === t2 && existingTargets.includes(t1)) return true;
  }

  // Check 2: Dozens contradiction (cannot cover all 3 dozens)
  const dozens = ["Dozen_1", "Dozen_2", "Dozen_3"];
  if (dozens.includes(newTarget)) {
    const activeDozens = dozens.filter(d => d === newTarget || existingTargets.includes(d));
    if (activeDozens.length === 3) return true;
  }

  // Check 3: Columns contradiction (cannot cover all 3 columns)
  const columns = ["Column_1", "Column_2", "Column_3"];
  if (columns.includes(newTarget)) {
    const activeColumns = columns.filter(c => c === newTarget || existingTargets.includes(c));
    if (activeColumns.length === 3) return true;
  }

  return false;
}

/**
 * Executes a bettor's AI logic, subtracting chips and returning the placed bets.
 */
export function executeBettorBetting(
  bettor: BettorProfile,
  previousWin: boolean | null,
  previousBetAmount: number | null,
  existingBets: BettorBet[] = []
): { bets: BettorBet[]; nextBetAmount: number } {
  const bets: BettorBet[] = [];
  let nextBetAmount = previousBetAmount ?? 0;
  const minBet = mastersonGameConfig.minimum_bet;

  if (bettor.chips < minBet) {
    return { bets: [], nextBetAmount: 0 };
  }

  // Base units based on initial chip size (rounded to minBet increments)
  const baseUnit = Math.max(minBet, Math.round((bettor.initial_chips * 0.02) / minBet) * minBet);
  
  switch (bettor.strategy) {
    case "Martingale": {
      // Standard 1:1 bet. Double on loss, reset on win.
      let target = Math.random() > 0.5 ? "Red" : "Black";
      if (isContradictoryBet(target, existingBets)) {
        target = target === "Red" ? "Black" : "Red";
      }
      let amount = baseUnit;
      if (previousWin === false && previousBetAmount) {
        amount = previousBetAmount * 2;
      }
      // Handle double bet frequency modifier
      if (Math.random() < bettor.double_bet_frequency) {
        amount *= 2;
      }
      amount = Math.round(amount / minBet) * minBet;
      amount = Math.min(amount, bettor.chips);
      if (amount >= minBet) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "D_Alembert": {
      // 1:1 bet. Add unit on loss, subtract unit on win.
      let target = Math.random() > 0.5 ? "Even" : "Odd";
      if (isContradictoryBet(target, existingBets)) {
        target = target === "Even" ? "Odd" : "Even";
      }
      let amount = baseUnit;
      if (previousBetAmount) {
        if (previousWin === false) {
          amount = previousBetAmount + baseUnit;
        } else if (previousWin === true) {
          amount = Math.max(baseUnit, previousBetAmount - baseUnit);
        }
      }
      amount = Math.round(amount / minBet) * minBet;
      amount = Math.min(amount, bettor.chips);
      if (amount >= minBet) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "Random_1_1": {
      // Pick a random 1:1 outside target, size is random percentage of initial chips
      const targets = ["Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36"];
      const allowed = targets.filter(t => !isContradictoryBet(t, existingBets));
      if (allowed.length === 0) {
        return { bets: [], nextBetAmount: 0 };
      }
      const target = allowed[Math.floor(Math.random() * allowed.length)]!;
      let amount = Math.round((baseUnit * (0.5 + Math.random() * 1.5)) / minBet) * minBet;
      amount = Math.min(amount, bettor.chips);
      if (amount >= minBet) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "Random": {
      const STREETS = ["Street_1_3", "Street_4_6", "Street_7_9", "Street_10_12", "Street_13_15", "Street_16_18", "Street_19_21", "Street_22_24", "Street_25_27", "Street_28_30", "Street_31_33", "Street_34_36"];
      const DOUBLE_STREETS = ["DoubleStreet_1_6", "DoubleStreet_7_12", "DoubleStreet_13_18", "DoubleStreet_19_24", "DoubleStreet_25_30", "DoubleStreet_31_36"];
      const CORNERS = ["Corner_1_2_4_5", "Corner_2_3_5_6", "Corner_4_5_7_8", "Corner_5_6_8_9", "Corner_7_8_10_11", "Corner_8_9_11_12", "Corner_10_11_13_14", "Corner_11_12_14_15", "Corner_13_14_16_17", "Corner_14_15_17_18", "Corner_16_17_19_20", "Corner_17_18_20_21", "Corner_19_20_22_23", "Corner_20_21_23_24", "Corner_22_23_25_26", "Corner_23_24_26_27", "Corner_25_26_28_29", "Corner_26_27_29_30", "Corner_28_29_31_32", "Corner_29_30_32_33", "Corner_31_32_34_35", "Corner_32_33_35_36"];

      // Pick a random spot anywhere on layout, bet is random
      const targets = [
        "Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36",
        "Column_1", "Column_2", "Column_3", "Dozen_1", "Dozen_2", "Dozen_3",
        ...STREETS,
        ...DOUBLE_STREETS,
        ...CORNERS,
        ...rouletteNumbers.map(n => n.value)
      ];
      const allowed = targets.filter(t => !isContradictoryBet(t, existingBets));
      if (allowed.length === 0) {
        return { bets: [], nextBetAmount: 0 };
      }
      const target = allowed[Math.floor(Math.random() * allowed.length)]!;
      const odds = getPayoutOddsForTarget(target);
      let amount = Math.round((baseUnit * (0.25 + Math.random() * 2)) / minBet) * minBet;
      amount = Math.min(amount, bettor.chips);
      if (amount >= minBet) {
        bets.push({ target, amount, payoutOdds: odds });
        nextBetAmount = amount;
      }
      break;
    }

    case "Hedges": {
      // Splits bet between two high-payout segments (like Column 1 and 2, or Dozen 1 and 2)
      let isDozens = Math.random() > 0.5;
      let t1 = isDozens ? "Dozen_1" : "Column_1";
      let t2 = isDozens ? "Dozen_2" : "Column_2";
      
      if (isContradictoryBet(t1, existingBets) || isContradictoryBet(t2, existingBets)) {
        isDozens = !isDozens;
        t1 = isDozens ? "Dozen_1" : "Column_1";
        t2 = isDozens ? "Dozen_2" : "Column_2";
        if (isContradictoryBet(t1, existingBets) || isContradictoryBet(t2, existingBets)) {
          return { bets: [], nextBetAmount: 0 };
        }
      }
      
      const totalAmt = Math.min(baseUnit * 2, bettor.chips);
      const halfAmt = Math.round((totalAmt / 2) / minBet) * minBet;
      if (halfAmt >= minBet) {
        bets.push({ target: t1, amount: halfAmt, payoutOdds: 2 });
        bets.push({ target: t2, amount: halfAmt, payoutOdds: 2 });
        nextBetAmount = halfAmt * 2;
      }
      break;
    }

    case "Low_Risk_Grind": {
      // Safe small bets on outside 1:1
      let target = "Low_1_18";
      if (isContradictoryBet(target, existingBets)) {
        target = "High_19_36";
        if (isContradictoryBet(target, existingBets)) {
          return { bets: [], nextBetAmount: 0 };
        }
      }
      let amount = Math.round((baseUnit * 0.5) / minBet) * minBet;
      amount = Math.min(amount, bettor.chips);
      if (amount >= minBet) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "High_Risk": {
      // Select single number coordinates with high sizing
      const randomOutcome = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)]!;
      const target = randomOutcome.value;
      let amount = baseUnit * 3;
      amount = Math.round(amount / minBet) * minBet;
      amount = Math.min(amount, bettor.chips);
      if (amount >= minBet) {
        bets.push({ target, amount, payoutOdds: 35 });
        nextBetAmount = amount;
      }
      break;
    }
  }

  return { bets, nextBetAmount };
}
