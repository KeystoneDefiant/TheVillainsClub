export interface MastersonGameConfig {
  shift_duration_spins: number;
  max_bettors: number;
  base_commission_pct: number;
  quarter_commission_bonus_pct: number;
  seat_fill_chance_per_spin: number;
  empty_table_last_chance_pct: number;
  consecutive_rig_suspicion_multiplier: number;
  rig_win_suspicion_scalar: number;
  no_rig_suspicion_decrease: number;
  betting_duration_seconds: number;
  no_more_bets_seconds: number;
  minimum_bet: number;
  min_bettor_max_suspicion: number;
  max_bettor_max_suspicion: number;
  min_bettor_herd_mentality_pct: number;
  max_bettor_herd_mentality_pct: number;
  herd_mentality_decay_rate: number;
  first_names: string[];
  last_names: string[];
  rig_types: {
    low: { suspicion: number; targets: string[] };
    mid: { suspicion: number; targets: string[] };
    high: { suspicion: number; targets: string[] };
  };
}

export type BettorStrategy =
  | 'D_Alembert'
  | 'Martingale'
  | 'Random'
  | 'Random_1_1'
  | 'Hedges'
  | 'Low_Risk_Grind'
  | 'High_Risk'
  | 'Keystone_Lock'
  | 'James_Bond'
  | 'Fibonacci'
  | 'Tier_et_Tout'
  | 'The_Pivot'
  | 'Angels_Split';

export interface BettorProfile {
  id: string; // "Seat 1", "Seat 2", etc.
  name: string;
  strategy: BettorStrategy;
  chips: number;
  initial_chips: number;
  max_suspicion: number;
  current_suspicion: number;
  loss_tolerance_pct: number;
  max_consecutive_losses: number;
  current_consecutive_losses: number;
  double_bet_frequency: number;
  herd_mentality_pct: number;
  total_spins_bet?: number;
  total_amount_bet?: number;
  progression_index?: number;
  pivot_target?: string | null;
  recent_spins?: string[];
}

export type RigSeverity = 'none' | 'low' | 'mid' | 'high';

export interface RigChoice {
  severity: RigSeverity;
  target: string | null; // e.g., "Red", "Column_1", "17", or null for Fair
}

export interface RouletteNumberInfo {
  value: string; // "0", "00", "1"-"36"
  color: 'Red' | 'Black' | 'Green';
  isEven: boolean;
  isOdd: boolean;
  isLow: boolean; // 1-18
  isHigh: boolean; // 19-36
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
}

export const mastersonGameConfig = {
  shift_duration_spins: 30,
  max_bettors: 4,
  base_commission_pct: 10.0,
  quarter_commission_bonus_pct: 5.0,
  seat_fill_chance_per_spin: 0.40,
  empty_table_last_chance_pct: 0.25,
  consecutive_rig_suspicion_multiplier: 1.20,
  rig_win_suspicion_scalar: 0.40,
  no_rig_suspicion_decrease: 2,
  betting_duration_seconds: 13,
  no_more_bets_seconds: 6,
  minimum_bet: 100,
  min_bettor_max_suspicion: 4,
  max_bettor_max_suspicion: 10,
  min_bettor_herd_mentality_pct: 0.0,
  max_bettor_herd_mentality_pct: 0.7,
  herd_mentality_decay_rate: 0.35,
  first_names: ["Victor", "Arsene", "James", "Tom", "Mildred", "Freddy", "Hannibal", "Norman", "Claude", "Rita", "Gordon", "Vito"],
  last_names: ["Vance", "Lupin", "Moriarty", "Riddle", "Ratched", "Kruger", "Lecter", "Bates", "Duval", "Skeeter", "Gekko", "Corleone"],
  rig_types: {
    low: {
      suspicion: 2,
      targets: ["Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36"],
    },
    mid: {
      suspicion: 3,
      targets: ["Column_1", "Column_2", "Column_3", "Dozen_1", "Dozen_2", "Dozen_3"],
    },
    high: {
      suspicion: 5,
      targets: ["Specific_Number"],
    },
  },
  defaultGameMode: {
    shift_duration_spins: 30,
    max_bettors: 4,
    base_commission_pct: 10.0,
    quarter_commission_bonus_pct: 5.0,
    seat_fill_chance_per_spin: 0.40,
    empty_table_last_chance_pct: 0.25,
    consecutive_rig_suspicion_multiplier: 1.20,
    rig_win_suspicion_scalar: 0.40,
    no_rig_suspicion_decrease: 2,
    betting_duration_seconds: 13,
    no_more_bets_seconds: 6,
    minimum_bet: 100,
    min_bettor_max_suspicion: 4,
    max_bettor_max_suspicion: 10,
    min_bettor_herd_mentality_pct: 0.0,
    max_bettor_herd_mentality_pct: 0.7,
    herd_mentality_decay_rate: 0.35,
  },
  gameModes: {
    normalGame: {},
    grandSalon: {
      displayName: "Grand Salon",
      max_bettors: 5,
      base_commission_pct: 12.0,
      seat_fill_chance_per_spin: 0.50,
    },
  },
} as const;

export type MastersonGameModeConfig = typeof mastersonGameConfig.defaultGameMode;

function mergeMastersonGameMode(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] === undefined) continue;
    const defVal = defaults[key];
    const ovVal = overrides[key];
    if (
      ovVal !== null &&
      typeof ovVal === "object" &&
      !Array.isArray(ovVal) &&
      defVal !== null &&
      typeof defVal === "object" &&
      !Array.isArray(defVal)
    ) {
      result[key] = mergeMastersonGameMode(
        defVal as Record<string, unknown>,
        ovVal as Record<string, unknown>,
      );
    } else {
      result[key] = ovVal;
    }
  }
  return result;
}

export function getCurrentMastersonGameMode(): MastersonGameModeConfig {
  const base = { ...mastersonGameConfig.defaultGameMode } as unknown as Record<string, unknown>;
  const overrides = mastersonGameConfig.gameModes.normalGame as unknown as Record<string, unknown>;
  return mergeMastersonGameMode(base, overrides) as unknown as MastersonGameModeConfig;
}

export function getMastersonGameMode(
  modeId: keyof typeof mastersonGameConfig.gameModes,
): MastersonGameModeConfig {
  const base = { ...mastersonGameConfig.defaultGameMode } as unknown as Record<string, unknown>;
  const overrides = (mastersonGameConfig.gameModes[modeId] ?? {}) as unknown as Record<string, unknown>;
  return mergeMastersonGameMode(base, overrides) as unknown as MastersonGameModeConfig;
}

export type MastersonGameModeId = keyof typeof mastersonGameConfig.gameModes;

export function resolveMastersonGameMode(modeId: string | undefined): MastersonGameModeConfig {
  if (modeId != null && modeId !== "" && modeId in mastersonGameConfig.gameModes) {
    return getMastersonGameMode(modeId as MastersonGameModeId);
  }
  return getCurrentMastersonGameMode();
}

// Double-Zero Roulette layout array
export const rouletteNumbers: RouletteNumberInfo[] = [
  { value: "0", color: "Green", isEven: false, isOdd: false, isLow: false, isHigh: false, dozen: null, column: null },
  { value: "00", color: "Green", isEven: false, isOdd: false, isLow: false, isHigh: false, dozen: null, column: null },
  { value: "1", color: "Red", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 1 },
  { value: "2", color: "Black", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 2 },
  { value: "3", color: "Red", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 3 },
  { value: "4", color: "Black", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 1 },
  { value: "5", color: "Red", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 2 },
  { value: "6", color: "Black", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 3 },
  { value: "7", color: "Red", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 1 },
  { value: "8", color: "Black", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 2 },
  { value: "9", color: "Red", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 3 },
  { value: "10", color: "Black", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 1 },
  { value: "11", color: "Black", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 2 },
  { value: "12", color: "Red", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 3 },
  { value: "13", color: "Black", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 2, column: 1 },
  { value: "14", color: "Red", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 2, column: 2 },
  { value: "15", color: "Black", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 2, column: 3 },
  { value: "16", color: "Red", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 2, column: 1 },
  { value: "17", color: "Black", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 2, column: 2 },
  { value: "18", color: "Red", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 2, column: 3 },
  { value: "19", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 2, column: 1 },
  { value: "20", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 2, column: 2 },
  { value: "21", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 2, column: 3 },
  { value: "22", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 2, column: 1 },
  { value: "23", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 2, column: 2 },
  { value: "24", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 2, column: 3 },
  { value: "25", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 1 },
  { value: "26", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "27", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 3 },
  { value: "28", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 1 },
  { value: "29", color: "Black", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "30", color: "Red", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 3 },
  { value: "31", color: "Black", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 1 },
  { value: "32", color: "Red", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "33", color: "Black", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 3 },
  { value: "34", color: "Red", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 1 },
  { value: "35", color: "Black", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "36", color: "Red", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 3 },
];


export function validateOutcomeAgainstRig(outcome: RouletteNumberInfo, rig: RigChoice): boolean {
  if (rig.severity === 'none' || !rig.target) return true;

  if (rig.target.startsWith('Trio_')) {
    const parts = rig.target.split('_').slice(1);
    return parts.includes(outcome.value);
  }
  if (rig.target.startsWith('Street_')) {
    const parts = rig.target.split('_');
    const start = parseInt(parts[1] || '', 10);
    const end = parseInt(parts[2] || '', 10);
    const val = parseInt(outcome.value, 10);
    return !isNaN(start) && !isNaN(end) && !isNaN(val) && val >= start && val <= end;
  }
  if (rig.target.startsWith('DoubleStreet_')) {
    const parts = rig.target.split('_');
    const start = parseInt(parts[1] || '', 10);
    const end = parseInt(parts[2] || '', 10);
    const val = parseInt(outcome.value, 10);
    return !isNaN(start) && !isNaN(end) && !isNaN(val) && val >= start && val <= end;
  }
  if (rig.target.startsWith('Corner_')) {
    const parts = rig.target.split('_').slice(1);
    return parts.includes(outcome.value);
  }

  switch (rig.target) {
    case 'Red': return outcome.color === 'Red';
    case 'Black': return outcome.color === 'Black';
    case 'Even': return outcome.isEven;
    case 'Odd': return outcome.isOdd;
    case 'Low_1_18': return outcome.isLow;
    case 'High_19_36': return outcome.isHigh;
    case 'Column_1': return outcome.column === 1;
    case 'Column_2': return outcome.column === 2;
    case 'Column_3': return outcome.column === 3;
    case 'Dozen_1': return outcome.dozen === 1;
    case 'Dozen_2': return outcome.dozen === 2;
    case 'Dozen_3': return outcome.dozen === 3;
    default:
      // If it is a specific number
      return outcome.value === rig.target;
  }
}

export const bettorStrategyDescriptions: Record<BettorStrategy, { title: string; description: string }> = {
  Martingale: {
    title: "Martingale",
    description: "Doubles the bet size on every loss, resetting to the base unit upon a win. Aimed at recovering all losses with a single win.",
  },
  D_Alembert: {
    title: "D'Alembert",
    description: "Increases the bet by one base unit after a loss, and decreases it by one base unit after a win. A balanced, low-volatility progression.",
  },
  Random_1_1: {
    title: "Random 1:1",
    description: "Picks a random 1:1 outside bet (Red/Black, Even/Odd, Low/High) and wagers a random amount between 0.5x and 2x base units.",
  },
  Random: {
    title: "Wild Random",
    description: "Places wagers at random spots across the entire board (Numbers, Streets, Corners, Columns, Dozens) with highly volatile sizing.",
  },
  Hedges: {
    title: "Column/Dozen Hedges",
    description: "Splits bets equally between two columns or two dozens (covering 24 numbers), yielding a high win frequency but low net return.",
  },
  Low_Risk_Grind: {
    title: "Low Risk Grind",
    description: "Steadily wagers small, conservative amounts on safe 1:1 outside bets to drag out play without risking their bankroll.",
  },
  High_Risk: {
    title: "High Risk Plunger",
    description: "Targets specific numbers with heavy stakes, seeking rare 35:1 high-value payouts at the cost of rapid financial exhaustion.",
  },
  Keystone_Lock: {
    title: "Keystone Lock",
    description: "Highly defensive system placing 4 units on 2nd Dozen, 4 units on 3rd Dozen, 2 units on 7-12 Double Street, and 1 unit on a green Trio or Street. Developed by some maniac.",
  },
  James_Bond: {
    title: "James Bond 007",
    description: "Covers 2/3 of the board by placing 14 units on High numbers, 5 units on 13-18 Double Street, and 1 unit on 0 as insurance.",
  },
  Fibonacci: {
    title: "Fibonacci Progression",
    description: "Progresses bets on 1:1 outcomes along the Fibonacci sequence on losses, stepping back two positions on wins. Safer than Martingale.",
  },
  Tier_et_Tout: {
    title: "Tier-et-Tout",
    description: "Splits bankroll into 1/3 ('Tier') for the first bet, and 2/3 ('Tout') for the second bet on loss. Highly volatile and explosive.",
  },
  The_Pivot: {
    title: "The Pivot Tracker",
    description: "Tracks recently landed numbers and wagers flat units exclusively on the first single number that repeats, hoping it is 'hot'.",
  },
  Angels_Split: {
    title: "Angel's Column Split",
    description: "Covers 24 numbers on columns by wagering equally on Column 1 and Column 2, plus 1 unit on green zero/double-zero splits for safety.",
  },
};
