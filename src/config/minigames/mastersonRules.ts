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
  minimum_bet: number;
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
  | 'High_Risk';

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

export const mastersonGameConfig: MastersonGameConfig = {
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
  minimum_bet: 100,
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
};

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
  { value: "11", color: "Black", isEven: true, isOdd: false, isLow: true, isHigh: false, dozen: 1, column: 2 },
  { value: "12", color: "Red", isEven: false, isOdd: true, isLow: true, isHigh: false, dozen: 1, column: 3 },
  { value: "13", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 2, column: 1 },
  { value: "14", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 2, column: 2 },
  { value: "15", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 2, column: 3 },
  { value: "16", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 2, column: 1 },
  { value: "17", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 2, column: 2 },
  { value: "18", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 2, column: 3 },
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
  { value: "29", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "30", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 3 },
  { value: "31", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 1 },
  { value: "32", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "33", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 3 },
  { value: "34", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 1 },
  { value: "35", color: "Black", isEven: true, isOdd: false, isLow: false, isHigh: true, dozen: 3, column: 2 },
  { value: "36", color: "Red", isEven: false, isOdd: true, isLow: false, isHigh: true, dozen: 3, column: 3 },
];

export function validateOutcomeAgainstRig(outcome: RouletteNumberInfo, rig: RigChoice): boolean {
  if (rig.severity === 'none' || !rig.target) return true;

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
