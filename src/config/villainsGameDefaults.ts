/**
 * Shell-level defaults for integrated minigames (club wallet, caps, etc.).
 * Table rules for Oubliette live in {@link ./minigames/oublietteNo9GameRules}.
 */
export const villainsGameDefaults = {
  oublietteNo9: {
    /** Default stake when starting a table (static for now; specials may vary later). */
    defaultBuyIn: 100,
    /**
     * Max credits **returned to the club** from the session before overachievement bonuses.
     * Effective ceiling: `floor(buyIn * maxReturnMultipleOfBuyIn * oubliette_cap_mult * all_minigames_cap_mult)`.
     */
    maxReturnMultipleOfBuyIn: 50,
    /**
     * Overachievement: for each full multiple of `tierStepMultiple * milestoneTotal` the player
     * reaches in **uncapped** table credits, add `bonusMultipleOfBuyInPerTier * buyIn` to the final return.
     * `milestoneTotal = buyIn * (capMultiple + buyInSlab)` (“50× + buy-in” line).
     */
    overachievement: {
      /** Same number as the main cap multiple for the “50× + buy-in” milestone line. */
      capMultiple: 50,
      /** Added to capMultiple as buy-in slabs (default 1 → “50× + buy-in”). */
      buyInSlab: 1,
      /** “5× over” the milestone: tier bar = this × milestoneTotal. */
      tierStepMultiple: 5,
      /** Bonus per tier, in multiples of buy-in (default 5 → +5× buy-in each tier). */
      bonusMultipleOfBuyInPerTier: 5,
    },
  },
} as const;
