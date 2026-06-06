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

export const fatesealCascadePayoutScale = 0.00984 as const;

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
    nonProphecyClearPayoutWeight: 0.5,
  },
  forbiddenTome: {
    betSizeMultiplier: 1.25,
    scatterChanceMultiplier: 1.25,
  },
  sympatheticVibrations: {
    payoutMultipleOfBaseBet: 75,
    bonusRoundIndexTrigger: 4,
  },
  purchasedReels: {
    wildChancePerActiveReel: 0.20,
    wildChanceDecayPerDepth: 0.50,
    markedSymbolPayoutMultiplier: 1.5,
    omenScalingFactors: [1.0, 0.3125, 0.13, 0.039] as readonly number[],
    bonusSpinsExcludeFromReelDecay: true,
  },
  bonusGrid: {
    maxGridSize: 9,
  },
} as const;

export const fatesealScatterSymbolPoolWeight = 0.7 as const;

export const fatesealScatterRitual = {
  meterToTrigger: 12,
  freeSpinsGranted: 4,
  freeRitualWildWeightBoost: 2,
} as const;

export const fatesealGameConfig = {
  defaultGameMode: {
    displayName: "Normal ritual",
    buyIn: 2000,
    maxReturnMultipleOfBuyIn: 50,
    chipIncrement: 10,
    minBaseBet: 100,
    maxBaseBetFractionOfSession: 0.5 as number,
    betMultipliers: [1, 2, 5, 10] as readonly number[],
  },
  gameModes: {
    normalGame: {},
    quickBet: {
      displayName: "Quick Bet",
      buyIn: 1000,
      maxReturnMultipleOfBuyIn: 30,
      chipIncrement: 5,
      minBaseBet: 5,
      betMultipliers: [1, 2, 5] as readonly number[],
    },
    highRoller: {
      displayName: "High Roller Ritual",
      buyIn: 5000,
      maxReturnMultipleOfBuyIn: 70,
      chipIncrement: 50,
      minBaseBet: 500,
      betMultipliers: [1, 2, 5, 10, 20] as readonly number[],
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

export const fatesealUnsettleSpiritsConfig = {
  durationSpins: 5,
  minPriceMultipleOfBuyIn: 3, // 3x base buy in (e.g. 2000 * 3 = 6000)
  costRatioOfBank: 0.75, // Wallet percentage (75%)
  betSizeMultipleOfBuyIn: 0.125, // 12.5% of base buy in (e.g. 2000 * 0.125 = 250)
  omenScalingFactors: [0.655, 0.38, 0.214, 0.102] as readonly number[],
} as const;

export const fatesealFaustianBargainConfig = {
  creditRatioOfBuyIn: 0.75,
  durationSpinsPerLevel: 5,
  lockedBetSizeMultipleOfBuyIn: 0.125, // 12.5% of base buy in (e.g. 2000 * 0.125 = 250)
  maxLevel: 3,
} as const;

export const fatesealVassagoGambitConfig = {
  durationSpins: 1,
  minPriceMultipleOfBuyIn: 5, // 5x base buy in (e.g. 2000 * 5 = 10000)
  costRatioOfBank: 0.90, // Wallet percentage (90%)
  betSizeMultipleOfBuyIn: 1.25, // 125% of base buy in (e.g. 2000 * 1.25 = 2500)
  scatterChanceMultiplier: 1.5,
  deadColDecayPerLevel: 1,
  omenScalingFactors: [2.91, 0.79, 0.248, 0.016] as readonly number[],
} as const;
