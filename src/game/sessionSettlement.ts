import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import {
  capModifiersFromSpecialDefinition,
  resolveActiveClubSpecial,
  resolveSpecialDefinitionRow,
} from "./specialsResolver";
import { bandsCatalog } from "@/config/bandsCatalog";
import { effectiveBandIndexForBarDate } from "@/audio/barBandOverrideStore";
import { barDateKey } from "@/audio/barBandSchedule";
import type { GameState as OublietteGameState } from "@/minigames/oubliette-no9/types";
import { resolveOublietteGameMode } from "@/config/minigames/oublietteNo9GameRules";
import { resolveSevenYearItchGameMode } from "@/config/minigames/sevenYearItchRules";
import { resolveFatesealGameMode } from "@/config/minigames/fatesealRules";
import { resolveMastersonGameMode } from "@/config/minigames/mastersonRules";

/** Snapshot at table open; used when settling the session. */
export type OublietteSettlementProfile = {
  buyIn: number;
  maxReturnMultipleOfBuyIn: number;
  capModifierProduct: number;
  overachievement: {
    capMultiple: number;
    buyInSlab: number;
    tierStepMultiple: number;
    bonusMultipleOfBuyInPerTier: number;
  };
};

export type StatEntry = {
  label: string;
  value: string | number;
};

export type ClubTableReturnDetail = {
  uncappedCredits: number;
  basePayout: number;
  overachievementBonus: number;
  tiers: number;
  totalReturn: number;
  /** Last in-run round index from the minigame when settling (shell / bar copy only). */
  tableRound?: number;
  /**
   * Short human-readable sentence explaining why the session ended
   * (e.g. "Voluntary cash-out at round 31"). Shown in the settlement panel.
   */
  endReason?: string;
  /**
   * Ordered key/value statistics surfaced in the settlement ticker.
   * Games populate these; `buildBarRouteStateFromReturn` adds sensible defaults
   * for any fields that are not already present.
   */
  stats?: ReadonlyArray<StatEntry>;
};

/** Props for Oubliette embedded in the club shell. */
export type OublietteShellBinding = {
  sessionCredits: number;
  settlement: OublietteSettlementProfile;
  /** Matches `gameModes` keys in `oublietteNo9GameRules` (default: normal profile). */
  gameModeId?: string;
  savedState?: Partial<OublietteGameState>;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
  onAbandonRun?: () => void;
  isTutorial?: boolean;
};

/** Props for 7 Year Itch (Crapless) — settlement shape matches {@link OublietteSettlementProfile}. */
export type SevenYearItchShellBinding = {
  sessionCredits: number;
  settlement: OublietteSettlementProfile;
  /** Matches `gameModes` keys in `sevenYearItchRules` (default: normal profile). */
  gameModeId?: string;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
  onPauseToClub?: () => void;
  onAbandonRun?: () => void;
  isTutorial?: boolean;
};

/** Props for Fateseal Silver — settlement shape matches {@link OublietteSettlementProfile}. */
export type FatesealShellBinding = {
  sessionCredits: number;
  settlement: OublietteSettlementProfile;
  /** Matches `gameModes` keys in `fatesealRules` (default: normal profile). */
  gameModeId?: string;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
  onPauseToClub?: () => void;
  onAbandonRun?: () => void;
  isTutorial?: boolean;
};

/** Props for Masterton 1881 — settlement shape matches {@link OublietteSettlementProfile}. */
export type MastersonShellBinding = {
  sessionCredits: number;
  settlement: OublietteSettlementProfile;
  gameModeId?: string;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
  onPauseToClub?: () => void;
  onAbandonRun?: () => void;
  isTutorial?: boolean;
};

export function buildOublietteSettlementProfile(buyIn: number, gameModeId?: string, now: Date = new Date()): OublietteSettlementProfile {
  const b = Math.floor(buyIn);
  const special = resolveActiveClubSpecial(now);
  const row = resolveSpecialDefinitionRow(special);
  const { oublietteCapMult, allMinigamesCapMult } = capModifiersFromSpecialDefinition(row);
  const resolvedMode = resolveOublietteGameMode(gameModeId);
  const maxReturnMult = resolvedMode?.maxReturnMultipleOfBuyIn ?? villainsGameDefaults.oublietteNo9.maxReturnMultipleOfBuyIn;
  const cfg = villainsGameDefaults.oublietteNo9;
  return {
    buyIn: b,
    maxReturnMultipleOfBuyIn: maxReturnMult,
    capModifierProduct: oublietteCapMult * allMinigamesCapMult,
    overachievement: { ...cfg.overachievement },
  };
}

export function buildMastersonSettlementProfile(buyIn: number, gameModeId?: string, now: Date = new Date()): OublietteSettlementProfile {
  const b = Math.floor(buyIn);
  const special = resolveActiveClubSpecial(now);
  const row = resolveSpecialDefinitionRow(special);
  const { allMinigamesCapMult } = capModifiersFromSpecialDefinition(row);
  const resolvedMode = resolveMastersonGameMode(gameModeId);
  const maxReturnMult = resolvedMode?.maxReturnMultipleOfBuyIn ?? villainsGameDefaults.masterson1881.maxReturnMultipleOfBuyIn;
  const cfg = villainsGameDefaults.masterson1881;
  return {
    buyIn: b,
    maxReturnMultipleOfBuyIn: maxReturnMult,
    capModifierProduct: allMinigamesCapMult,
    overachievement: { ...cfg.overachievement },
  };
}

export function buildSevenYearItchSettlementProfile(buyIn: number, gameModeId?: string, now: Date = new Date()): OublietteSettlementProfile {
  const b = Math.floor(buyIn);
  const special = resolveActiveClubSpecial(now);
  const row = resolveSpecialDefinitionRow(special);
  const { sevenYearItchCapMult, allMinigamesCapMult } = capModifiersFromSpecialDefinition(row);
  const resolvedMode = resolveSevenYearItchGameMode(gameModeId);
  const maxReturnMult = resolvedMode?.maxReturnMultipleOfBuyIn ?? villainsGameDefaults.sevenYearItch.maxReturnMultipleOfBuyIn;
  const cfg = villainsGameDefaults.sevenYearItch;
  return {
    buyIn: b,
    maxReturnMultipleOfBuyIn: maxReturnMult,
    capModifierProduct: sevenYearItchCapMult * allMinigamesCapMult,
    overachievement: { ...cfg.overachievement },
  };
}

export function buildFatesealSettlementProfile(buyIn: number, gameModeId?: string, now: Date = new Date()): OublietteSettlementProfile {
  const b = Math.floor(buyIn);
  const special = resolveActiveClubSpecial(now);
  const row = resolveSpecialDefinitionRow(special);
  const { fatesealCapMult, allMinigamesCapMult } = capModifiersFromSpecialDefinition(row);
  const resolvedMode = resolveFatesealGameMode(gameModeId);
  const maxReturnMult = resolvedMode?.maxReturnMultipleOfBuyIn ?? villainsGameDefaults.fatesealSilver.maxReturnMultipleOfBuyIn;
  const cfg = villainsGameDefaults.fatesealSilver;
  return {
    buyIn: b,
    maxReturnMultipleOfBuyIn: maxReturnMult,
    capModifierProduct: fatesealCapMult * allMinigamesCapMult,
    overachievement: { ...cfg.overachievement },
  };
}

/** Max credits paid back from the **capped** portion of the table (before overachievement tiers). */
export function getOublietteBaseReturnCeiling(profile: OublietteSettlementProfile, gameId: string = "oubliette_no9"): number {
  const b = Math.max(1, Math.floor(profile.buyIn));
  let maxWinMultiplier = 1;
  try {
    const idx = effectiveBandIndexForBarDate(barDateKey(new Date()));
    const activeBand = bandsCatalog.bands[idx];
    if (activeBand && activeBand.modifier && activeBand.modifier.game_id === gameId) {
      maxWinMultiplier = activeBand.modifier.max_win_multiplier ?? 1;
    }
  } catch {
    // Fail-safe fall back to 1
  }
  return Math.floor(b * profile.maxReturnMultipleOfBuyIn * profile.capModifierProduct * maxWinMultiplier);
}

export function getSevenYearItchBaseReturnCeiling(profile: OublietteSettlementProfile): number {
  return getOublietteBaseReturnCeiling(profile, "seven_year_itch");
}

export function getFatesealBaseReturnCeiling(profile: OublietteSettlementProfile): number {
  return getOublietteBaseReturnCeiling(profile, "fateseal_silver");
}

export function getMastersonBaseReturnCeiling(profile: OublietteSettlementProfile): number {
  return getOublietteBaseReturnCeiling(profile, "masterson_1881");
}

/** Same cap / tier math as Oubliette; profile comes from {@link buildSevenYearItchSettlementProfile}. */
export function computeSevenYearItchReturn(
  uncappedCredits: number,
  profile: OublietteSettlementProfile,
): ClubTableReturnDetail {
  return computeOublietteReturn(uncappedCredits, profile, "seven_year_itch");
}

/** Same cap / tier math as Oubliette; profile comes from {@link buildFatesealSettlementProfile}. */
export function computeFatesealReturn(uncappedCredits: number, profile: OublietteSettlementProfile): ClubTableReturnDetail {
  return computeOublietteReturn(uncappedCredits, profile, "fateseal_silver");
}

export function computeMastersonReturn(
  uncappedCredits: number,
  profile: OublietteSettlementProfile,
): ClubTableReturnDetail {
  return computeOublietteReturn(uncappedCredits, profile, "masterson_1881");
}

/**
 * Turn uncapped in-game credits into what the club pays back.
 * Base line is capped at buyIn × maxReturnMultiple × cap modifiers × band max win modifier; bonus tiers use uncapped total vs tier bars.
 */
export function computeOublietteReturn(
  uncappedCredits: number,
  profile: OublietteSettlementProfile,
  gameId: string = "oubliette_no9",
): ClubTableReturnDetail {
  const safeRaw = Number.isFinite(uncappedCredits) ? Math.max(0, Math.floor(uncappedCredits)) : 0;
  
  let payoutMultiplier = 1;
  let maxWinMultiplier = 1;
  try {
    const idx = effectiveBandIndexForBarDate(barDateKey(new Date()));
    const activeBand = bandsCatalog.bands[idx];
    if (activeBand && activeBand.modifier && activeBand.modifier.game_id === gameId) {
      payoutMultiplier = activeBand.modifier.payout_multiplier ?? 1;
      maxWinMultiplier = activeBand.modifier.max_win_multiplier ?? 1;
    }
  } catch {
    // Fail-safe fall back to 1
  }

  const safe = Math.floor(safeRaw * payoutMultiplier);
  const b = Math.max(1, Math.floor(profile.buyIn));
  const baseCap = Math.max(
    0,
    Math.floor(b * profile.maxReturnMultipleOfBuyIn * profile.capModifierProduct * maxWinMultiplier),
  );
  const basePayout = Math.min(safe, baseCap);

  const oa = profile.overachievement;
  const milestone = b * (oa.capMultiple + oa.buyInSlab);
  const tierBar = oa.tierStepMultiple * milestone;
  const tiers = tierBar > 0 ? Math.floor(safe / tierBar) : 0;
  const overachievementBonus = tiers * oa.bonusMultipleOfBuyInPerTier * b;
  const totalReturn = Math.min(basePayout + overachievementBonus, baseCap);

  return {
    uncappedCredits: safe,
    basePayout,
    overachievementBonus,
    tiers,
    totalReturn,
  };
}
