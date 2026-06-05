import {
  mastersonGameConfig,
  rouletteNumbers,
  bettorStrategyDescriptions
} from './mastersonConfig';

import type {
  MastersonGameConfig,
  BettorStrategy,
  BettorProfile,
  RigSeverity,
  RigChoice,
  RouletteNumberInfo,
  MastersonGameModeConfig
} from './mastersonConfig';

export {
  mastersonGameConfig,
  rouletteNumbers,
  bettorStrategyDescriptions
};

export type {
  MastersonGameConfig,
  BettorStrategy,
  BettorProfile,
  RigSeverity,
  RigChoice,
  RouletteNumberInfo,
  MastersonGameModeConfig
};

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
