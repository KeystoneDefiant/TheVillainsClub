/**
 * Shell-level defaults for integrated minigames (club wallet, caps, etc.).
 * Table rules for Oubliette live in {@link ./minigames/oublietteNo9GameRules}.
 */
export const villainsGameDefaults = {
  /**
   * Starting **club wallet** credits for a new game (used when there is no persisted wallet yet).
   * Persisted balance in `localStorage` overrides this after the first save.
   */
  defaultClubBalance: 10000,

  oublietteNo9: {
    /** Default stake when starting a table (static for now; specials may vary later). */
    defaultBuyIn: 2000,
    /** Enables the standalone `/oubliette-no9` landing outside the club menu. */
    standaloneLandingEnabled: true,
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

  /** 7 Year Itch — Crapless table (see `7YI_plan.md`). */
  sevenYearItch: {
    defaultBuyIn: 2000,
    maxReturnMultipleOfBuyIn: 50,
    overachievement: {
      capMultiple: 50,
      buyInSlab: 1,
      tierStepMultiple: 5,
      bonusMultipleOfBuyInPerTier: 5,
    },
  },
} as const;
