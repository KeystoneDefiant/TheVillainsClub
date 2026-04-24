import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import {
  capModifiersFromSpecialDefinition,
  resolveActiveClubSpecial,
  resolveSpecialDefinitionRow,
} from "./specialsResolver";

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

export type ClubTableReturnDetail = {
  uncappedCredits: number;
  basePayout: number;
  overachievementBonus: number;
  tiers: number;
  totalReturn: number;
  /** Last in-run round index from the minigame when settling (shell / bar copy only). */
  tableRound?: number;
};

/** Props for Oubliette embedded in the club shell. */
export type OublietteShellBinding = {
  sessionCredits: number;
  settlement: OublietteSettlementProfile;
  onReturnToClubMenu?: (detail: ClubTableReturnDetail) => void;
};

export function buildOublietteSettlementProfile(buyIn: number, now: Date = new Date()): OublietteSettlementProfile {
  const b = Math.floor(buyIn);
  const special = resolveActiveClubSpecial(now);
  const row = resolveSpecialDefinitionRow(special);
  const { oublietteCapMult, allMinigamesCapMult } = capModifiersFromSpecialDefinition(row);
  const cfg = villainsGameDefaults.oublietteNo9;
  return {
    buyIn: b,
    maxReturnMultipleOfBuyIn: cfg.maxReturnMultipleOfBuyIn,
    capModifierProduct: oublietteCapMult * allMinigamesCapMult,
    overachievement: { ...cfg.overachievement },
  };
}

/** Max credits paid back from the **capped** portion of the table (before overachievement tiers). */
export function getOublietteBaseReturnCeiling(profile: OublietteSettlementProfile): number {
  const b = Math.max(1, Math.floor(profile.buyIn));
  return Math.floor(b * profile.maxReturnMultipleOfBuyIn * profile.capModifierProduct);
}

/**
 * Turn uncapped in-game credits into what the club pays back.
 * Base line is capped at buyIn × maxReturnMultiple × cap modifiers; bonus tiers use uncapped total vs tier bars.
 */
export function computeOublietteReturn(
  uncappedCredits: number,
  profile: OublietteSettlementProfile,
): ClubTableReturnDetail {
  const safe = Number.isFinite(uncappedCredits) ? Math.max(0, Math.floor(uncappedCredits)) : 0;
  const b = Math.max(1, Math.floor(profile.buyIn));
  const baseCap = Math.max(
    0,
    Math.floor(b * profile.maxReturnMultipleOfBuyIn * profile.capModifierProduct),
  );
  const basePayout = Math.min(safe, baseCap);

  const oa = profile.overachievement;
  const milestone = b * (oa.capMultiple + oa.buyInSlab);
  const tierBar = oa.tierStepMultiple * milestone;
  const tiers = tierBar > 0 ? Math.floor(safe / tierBar) : 0;
  const overachievementBonus = tiers * oa.bonusMultipleOfBuyInPerTier * b;
  const totalReturn = basePayout + overachievementBonus;

  return {
    uncappedCredits: safe,
    basePayout,
    overachievementBonus,
    tiers,
    totalReturn,
  };
}
