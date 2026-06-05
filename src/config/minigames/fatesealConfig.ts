export const FATESEAL_STANDARD_SYMBOLS = [
  "dagger",
  "chalice",
  "goat",
  "eye",
  "serpent",
  "moon",
  "flame",
  "key",
] as const;

export type FatesealStandardId = (typeof FATESEAL_STANDARD_SYMBOLS)[number];

export const FATESEAL_SPECIAL_SYMBOLS = ["wild", "scatter", "void"] as const;
export type FatesealSpecialId = (typeof FATESEAL_SPECIAL_SYMBOLS)[number];

export type FatesealSymbolId = FatesealStandardId | FatesealSpecialId;

export const fatesealSymbolLore: Record<FatesealStandardId, { title: string; blurb: string }> = {
  dagger: { title: "The Dagger", blurb: "A promise cut in silver." },
  chalice: { title: "The Chalice", blurb: "Wine dark as a sealed oath." },
  goat: { title: "The Goat", blurb: "Horns against a thin veil." },
  eye: { title: "The Eye", blurb: "It blinks when nobody is watching." },
  serpent: { title: "The Serpent", blurb: "Coils in the corner of the vision." },
  moon: { title: "The Moon", blurb: "A thin sickle over charcoal stone." },
  flame: { title: "The Flame", blurb: "Cold fire that eats the edges." },
  key: { title: "The Key", blurb: "Teeth that fit a lock you never saw." },
};

export const FATESEAL_GRID_SIZE = 5 as const;

export const fatesealProphecyMode = {
  single: { pickCount: 1 as const, winMultipleOfBaseBet: 10 },
  triple: { pickCount: 3 as const, winMultipleOfBaseBet: 1 },
} as const;

export type FatesealProphecyModeKey = keyof typeof fatesealProphecyMode;

export const fatesealCascadePayoutScale = 0.0082 as const;

export const fatesealCascadeMultipliers = [1, 1, 2, 3, 4, 6] as readonly number[];

export const fatesealProgressionRules = {
  crossroads: {
    scatterSymbolsToTriggerShop: 6,
  },
  linking: {
    minOrthogonalRunForNonProphecyRemoval: 5,
    cascadeMultAddPerProphecyAdjacency: 0.2,
    maxCascadeMultBonusFromLinking: 5,
    usePowProphecyLinkingForCascadeMult: true,
    prophecyLinkingPowBasePerAdjacency: 2,
    maxProphecyEdgesForLinkingPow: 2,
  },
  sympatheticVibrations: {
    payoutMultipleOfBaseBet: 75,
    bonusRoundIndexTrigger: 4,
  },
  purchasedReels: {
    wildChancePerActiveReel: 0.20,
    wildChanceDecayPerDepth: 0.50,
    markedSymbolPayoutMultiplier: 1.5,
    omenScalingFactors: [1.2, 0.4, 0.25, 0.1] as readonly number[],
    bonusSpinsExcludeFromReelDecay: true,
  },
  bonusGrid: {
    maxGridSize: 9,
  },
} as const;

export const fatesealScatterSymbolPoolWeight = 0.7 as const;

export const fatesealScatterRitual = {
  meterToTrigger: 12,
  freeSpinsGranted: 1,
  freeRitualWildWeightBoost: 1,
} as const;

export const fatesealGameConfig = {
  defaultGameMode: {
    displayName: "Normal ritual",
    buyIn: 2000,
    maxReturnMultipleOfBuyIn: 50,
    chipIncrement: 10,
    minBaseBet: 100,
    maxBaseBetFractionOfSession: 0.5 as number,
  },
  gameModes: {
    normalGame: {},
    quickBet: {
      displayName: "Quick Bet",
      buyIn: 1000,
      maxReturnMultipleOfBuyIn: 30,
      chipIncrement: 5,
      minBaseBet: 5,
    },
    highRoller: {
      displayName: "High Roller Ritual",
      buyIn: 5000,
      maxReturnMultipleOfBuyIn: 70,
      chipIncrement: 50,
      minBaseBet: 500,
    },
  },
} as const;

export type FatesealGameModeConfig = (typeof fatesealGameConfig)["defaultGameMode"];

export const fatesealCrossroadsNewShop = {
  addOmenSymbol: {
    costs: [3500, 6000, 12000],
    maxExtraPurchases: 3,
  },
} as const;

export type FatesealPoolEntry = {
  symbol: FatesealSymbolId;
  weight: number;
};

export const fatesealDefaultSymbolPool: readonly FatesealPoolEntry[] = [
  { symbol: "dagger", weight: 9 },
  { symbol: "chalice", weight: 9 },
  { symbol: "goat", weight: 9 },
  { symbol: "eye", weight: 9 },
  { symbol: "serpent", weight: 9 },
  { symbol: "moon", weight: 9 },
  { symbol: "flame", weight: 9 },
  { symbol: "key", weight: 9 },
  { symbol: "wild", weight: 2 },
  { symbol: "scatter", weight: fatesealScatterSymbolPoolWeight },
];

export const fatesealWagerLevels = [100, 200, 500, 1000] as const;

export const fatesealUnsettleSpiritsConfig = {
  durationSpins: 5,
  costRatioOfBank: 0.75,
  minPrice: 6500,
  betSize: 250,
} as const;

export const fatesealFaustianBargainConfig = {
  creditRatioOfBuyIn: 0.75,
  durationSpinsPerLevel: 5,
  lockedBetSize: 250,
  maxLevel: 3,
} as const;

export const fatesealVassagoGambitConfig = {
  costRatioOfBank: 0.90,
  minPrice: 10000,
  betSize: 250,
  scatterChanceMultiplier: 1.5,
} as const;
