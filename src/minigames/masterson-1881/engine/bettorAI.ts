import { BettorProfile, rouletteNumbers } from "@/config/minigames/mastersonRules";

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
  
  // Starting chips between 5,000 and 200,000
  const initial_chips = Math.floor(Math.random() * (200000 - 5000) + 5000);
  const max_suspicion = Math.floor(Math.random() * (10 - 4) + 4); // 4 to 10
  const loss_tolerance_pct = parseFloat((Math.random() * (1.00 - 0.50) + 0.50).toFixed(2)); // 0.50 to 1.00
  const max_consecutive_losses = Math.floor(Math.random() * (10 - 2) + 2); // 2 to 10
  const double_bet_frequency = parseFloat(Math.random().toFixed(2));
  const herd_mentality_pct = parseFloat(Math.random().toFixed(2));

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

/**
 * Executes a bettor's AI logic, subtracting chips and returning the placed bets.
 */
export function executeBettorBetting(
  bettor: BettorProfile,
  previousWin: boolean | null,
  previousBetAmount: number | null
): { bets: BettorBet[]; nextBetAmount: number } {
  const bets: BettorBet[] = [];
  let nextBetAmount = previousBetAmount ?? 0;

  if (bettor.chips <= 0) {
    return { bets, nextBetAmount: 0 };
  }

  // Base units based on initial chip size
  const baseUnit = Math.max(100, Math.floor(bettor.initial_chips * 0.02)); // 2% of initial bankroll
  
  switch (bettor.strategy) {
    case "Martingale": {
      // Standard 1:1 bet. Double on loss, reset on win.
      const target = Math.random() > 0.5 ? "Red" : "Black";
      let amount = baseUnit;
      if (previousWin === false && previousBetAmount) {
        amount = previousBetAmount * 2;
      }
      // Handle double bet frequency modifier
      if (Math.random() < bettor.double_bet_frequency) {
        amount *= 2;
      }
      amount = Math.min(amount, bettor.chips);
      if (amount > 0) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "D_Alembert": {
      // 1:1 bet. Add unit on loss, subtract unit on win.
      const target = Math.random() > 0.5 ? "Even" : "Odd";
      let amount = baseUnit;
      if (previousBetAmount) {
        if (previousWin === false) {
          amount = previousBetAmount + baseUnit;
        } else if (previousWin === true) {
          amount = Math.max(baseUnit, previousBetAmount - baseUnit);
        }
      }
      amount = Math.min(amount, bettor.chips);
      if (amount > 0) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "Random_1_1": {
      // Pick a random 1:1 outside target, size is random percentage of initial chips
      const targets = ["Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36"];
      const target = targets[Math.floor(Math.random() * targets.length)]!;
      let amount = Math.floor(baseUnit * (0.5 + Math.random() * 1.5));
      amount = Math.min(amount, bettor.chips);
      if (amount > 0) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "Random": {
      // Pick a random spot anywhere on layout, bet is random
      const targets = [
        "Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36",
        "Column_1", "Column_2", "Column_3", "Dozen_1", "Dozen_2", "Dozen_3",
        ...rouletteNumbers.map(n => n.value)
      ];
      const target = targets[Math.floor(Math.random() * targets.length)]!;
      const odds = getPayoutOddsForTarget(target);
      let amount = Math.floor(baseUnit * (0.25 + Math.random() * 2));
      amount = Math.min(amount, bettor.chips);
      if (amount > 0) {
        bets.push({ target, amount, payoutOdds: odds });
        nextBetAmount = amount;
      }
      break;
    }

    case "Hedges": {
      // Splits bet between two high-payout segments (like Column 1 and 2, or Dozen 1 and 2)
      const isDozens = Math.random() > 0.5;
      const t1 = isDozens ? "Dozen_1" : "Column_1";
      const t2 = isDozens ? "Dozen_2" : "Column_2";
      
      const totalAmt = Math.min(baseUnit * 2, bettor.chips);
      const halfAmt = Math.floor(totalAmt / 2);
      if (halfAmt > 0) {
        bets.push({ target: t1, amount: halfAmt, payoutOdds: 2 });
        bets.push({ target: t2, amount: halfAmt, payoutOdds: 2 });
        nextBetAmount = totalAmt;
      }
      break;
    }

    case "Low_Risk_Grind": {
      // Safe small bets on outside 1:1
      const target = "Low_1_18";
      const amount = Math.min(Math.floor(baseUnit * 0.5), bettor.chips);
      if (amount > 0) {
        bets.push({ target, amount, payoutOdds: 1 });
        nextBetAmount = amount;
      }
      break;
    }

    case "High_Risk": {
      // Select single number coordinates with high sizing
      const randomOutcome = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)]!;
      const target = randomOutcome.value;
      const amount = Math.min(baseUnit * 3, bettor.chips);
      if (amount > 0) {
        bets.push({ target, amount, payoutOdds: 35 });
        nextBetAmount = amount;
      }
      break;
    }
  }

  return { bets, nextBetAmount };
}
