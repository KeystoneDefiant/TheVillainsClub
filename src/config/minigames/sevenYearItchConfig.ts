export type PointNumber = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

export const POINT_NUMBERS: readonly PointNumber[] = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

export const sevenYearItchGameConfig = {
  defaultGameMode: {
    displayName: "Normal table",
    buyIn: 2000,
    maxReturnMultipleOfBuyIn: 50,
    /** Table clicks add/remove this many credits per tap (primary / context). */
    chipIncrement: 50,
    minPassBet: 50,
    minPlaceBet: 50,
    /** Field + Horn row (shown behind one-roll props when true). */
    showFieldAndHornSection: true,
    /** Rolls without a 7 before the favors shop offers new heat bonuses. */
    heatRollsPerFavorOffer: 34,
    /** Max free-odds stake as a multiple of the current pass line stake (simplified table rule). */
    maxFreeOddsMultipleOfPass: 2,
    maxPassBetFractionOfBuyIn: 0.25,
    /** Skim rate reduction for Kingpin's Cut. */
    kingpinReturnsReduction: 0.35,
    /** Cap multiplier for place bets under Aggressive Expansion. */
    aggressiveExpansionCapMultiplier: 2,
    /** Refund percentage for Evidence Locker Key when a 7 is rolled. */
    evidenceLockerRefundRate: 0.30,
    /** Forced betting mode or switchable. */
    bettingMode: "switch" as "easy" | "normal" | "switch",
  },
  gameModes: {
    normalGame: {},
    quickTable: {
      displayName: "Quick Table",
      buyIn: 1000,
      maxReturnMultipleOfBuyIn: 30,
      chipIncrement: 25,
      minPassBet: 25,
      minPlaceBet: 25,
      showFieldAndHornSection: false,
      heatRollsPerFavorOffer: 3,
    },
    highOdds: {
      displayName: "High Odds Table",
      buyIn: 5000,
      maxReturnMultipleOfBuyIn: 70,
      maxFreeOddsMultipleOfPass: 5,
      chipIncrement: 100,
      minPassBet: 100,
    },
    easyTable: {
      displayName: "Forced Easy Table",
      bettingMode: "easy",
    },
    normalTable: {
      displayName: "Forced Normal Table",
      bettingMode: "normal",
    },
  },
} as const;

export type SevenYearItchGameModeConfig = (typeof sevenYearItchGameConfig)["defaultGameMode"];

export const sevenYearItchRackets = {
  2: { name: "Political Graft", risk: "Extreme", story: "City Hall opens a side door and the councilmen start taking envelopes." },
  3: { name: "Diamond Smuggling", risk: "High", story: "A velvet pouch crosses the border under a customs man's hat." },
  4: { name: "Union Extortion", risk: "Mid", story: "The loading dock votes your way after one quiet conversation." },
  5: { name: "Speakeasies", risk: "Stable", story: "The back room fills, the glasses sweat, and the till starts singing." },
  6: { name: "Protection Rackets", risk: "Low", story: "Every storefront on the block remembers who keeps the windows intact." },
  8: { name: "Numbers Games", risk: "Low", story: "Policy slips flutter through the neighborhood like confetti with a price." },
  9: { name: "Underground Casinos", risk: "Stable", story: "The roulette wheel is honest enough to keep the suckers comfortable." },
  10: { name: "Dockside Smuggling", risk: "Mid", story: "A crate loses its manifest and gains a police escort." },
  11: { name: "Luxury Heists", risk: "High", story: "The penthouse safe coughs up diamonds before dessert is cleared." },
  12: { name: "High Commission", risk: "Extreme", story: "The boardroom signs a deal so dirty even the ink wants a lawyer." },
} as const satisfies Record<PointNumber, { name: string; risk: string; story: string }>;

export type SevenYearItchHeatBonusId =
  | "look_the_other_way"
  | "kingpins_cut"
  | "aggressive_expansion"
  | "clean_getaway"
  | "evidence_locker_key";

export type SevenYearItchHeatBonus = {
  id: SevenYearItchHeatBonusId;
  title: string;
  description: string;
  pullWeight: number;
  effect: {
    type:
      | "shield_next_seven"
      | "kingpins_cut"
      | "aggressive_expansion"
      | "free_divest"
      | "evidence_locker_key";
    value: number;
  };
};

export const sevenYearItchHeatBonuses: readonly SevenYearItchHeatBonus[] = [
  {
    id: "look_the_other_way",
    title: "The Look the Other Way",
    description: "Ignore the next 7. You didn't see nothin'.",
    pullWeight: 38,
    effect: { type: "shield_next_seven", value: 1 },
  },
  {
    id: "kingpins_cut",
    title: "The Kingpin's Cut",
    description: "Maximize all place bets and Legitimate Business Investment for free, but any returns are reduced by 35% for the rest of this hand.",
    pullWeight: 22,
    effect: { type: "kingpins_cut", value: 0.65 },
  },
  {
    id: "aggressive_expansion",
    title: "Aggressive Expansion",
    description: "Double the bet cap on place bets for this roll (increases limit from 3x to 6x of Seed Investment).",
    pullWeight: 18,
    effect: { type: "aggressive_expansion", value: 2 },
  },
  {
    id: "clean_getaway",
    title: "Clean Getaway",
    description:
      "The next time you Divest, you sweep the back-line bets with no skim — place numbers still pay full street odds for the rest of the hand.",
    pullWeight: 18,
    effect: { type: "free_divest", value: 1 },
  },
  {
    id: "evidence_locker_key",
    title: "Evidence Locker Key",
    description: "Recover 30% of all credits currently on the felt if you roll a 7 (the bust).",
    pullWeight: 28,
    effect: { type: "evidence_locker_key", value: 0.30 },
  },
] as const;
