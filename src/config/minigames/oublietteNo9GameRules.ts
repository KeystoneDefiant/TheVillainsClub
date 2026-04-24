export const gameConfig = {
  // Global configuration
  deadCardLimit: 10,
  shopOptionCount: 3, // Number of options to display in shop

  /**
   * Shop options: selection config for default and premium stores.
   * Premium store activates when credits >= premium.creditsThreshold.
   */
  shopOptions: {
    default: {
      name: 'Shop',
      shopOptionCount: 4,
      shopSlots: [
        { maxRarity: 1 },
        { maxRarity: 2, rarityChances: [0.6, 0.4] },
        { maxRarity: 3, rarityChances: [0.2, 0.5, 0.3] },
        { maxRarity: 4, rarityChances: [0.1, 0.3, 0.5, 0.1] },
      ],
      shopItems: {
        'dead-card': { rarity: 1 },
        'remove-single-dead-card': { rarity: 2 },
        'remove-all-dead-cards': { rarity: 3 },
        'parallel-hands-bundle-5': { rarity: 1 },
        'parallel-hands-bundle-10': { rarity: 1 },
        'parallel-hands-bundle-25': { rarity: 2 },
        'parallel-hands-bundle-50': { rarity: 3 },
        'wild-card': { rarity: 3 },
        'extra-draw': { rarity: 4 },
        'extra-card-in-hand': { rarity: 3 },
        'devils-deal-chance': { rarity: 2 },
        'devils-deal-cost-reduction': { rarity: 2 },
      },
    },
    premium: {
      name: 'VIP Shop',
      creditsThreshold: 450_000,
      /** Flat percentage added to all item costs (e.g. 25 = +25%) */
      costPercentIncrease: 500,
      /** Base price per hand for large bundles (100+). Uses default shop price for smaller bundles. */
      basePricePerHandLargeBundles: 70,
      shopOptionCount: 2,
      shopSlots: [
        { maxRarity: 3, rarityChances: [0.2, 0.5, 0.3] },
        { maxRarity: 3, rarityChances: [0.0, 0.4, 0.6] },
      ],
      shopItems: {
        'remove-single-dead-card': { rarity: 1 },
        'remove-all-dead-cards': { rarity: 1 },
        'parallel-hands-bundle-25': { rarity: 1 },
        'parallel-hands-bundle-50': { rarity: 1 },
        'parallel-hands-bundle-100': { rarity: 2 },
        'parallel-hands-bundle-250': { rarity: 2 },
        'parallel-hands-bundle-500': { rarity: 3 },
        'parallel-hands-bundle-1000': { rarity: 3 },
        'wild-card': { rarity: 2 },
        'extra-draw': { rarity: 2 },
        'extra-card-in-hand': { rarity: 2 },
        'devils-deal-chance': { rarity: 1 },
        'devils-deal-cost-reduction': { rarity: 1 },
      },
    },
  },

  // Animation timing configuration (in milliseconds)
  animation: {
    cardFlip: 500, // Card flip animation delay
    /** Phase B: abstract-wave reveal timing and scaling */
    parallelHandsAbstractWave: {
      individualMaxHands: 24, // Max hand count that still reveals every hand individually.
      mediumMaxHands: 300, // Upper bound for the medium-density sampled reveal mode.
      mediumFeaturedWinners: 10, // Winner spotlight count used while in medium sampled rounds.
      highFeaturedWinners: 14, // Winner spotlight count used for very large sampled rounds.
      noWinnerFallbackFeatures: 2, // Featured beats to show when a sampled round has no scoring hands.
      maxMsPerBeat: 430, // Slowest allowed duration for one reveal beat at low hand counts.
      minMsPerBeat: 90, // Fastest allowed duration for one reveal beat at huge hand counts.
      handCountAcceleration: 56, // How aggressively beat duration speeds up as hand count rises.
      entryRatio: 0.22, // Portion of each beat spent bringing the new hand onto the stage.
      cardsRatio: 0.4, // Portion of each beat spent showing/settling the cards before the result lands.
      resultRatio: 0.24, // Portion of each beat spent holding the rank/payout result on screen.
      exitRatio: 0.14, // Portion of each beat spent sending the old hand off the stage.
      gapRatio: 0.04, // Small spacing between beats before the next hand begins entering.
      revealCompletePauseMs: 700, // Hold time after the last reveal before the whole screen fades away.
      fadeOutMs: 420, // Duration of the final full-screen fade into the results screen.
      ambientFlowIndicators: 11, // Number of background flow lines used to suggest motion and scale.
      ambientGhostCards: 5, // Number of ghost-card silhouettes layered behind the active hand.
      ambientOrbCount: 5, // Number of drifting background light orbs in the stage field.
      winnerCardsMultiplier: 1.5, // Extra time multiplier for the card-display phase on scoring hands.
      winnerResultMultiplier: 2.25, // Extra time multiplier for how long scoring results stay readable.
      winnerExitMultiplier: 2, // Extra time multiplier for the exit phase of scoring hands.
    },
  },

  // Parallel hands grid thresholds (switch to 2 columns early to avoid stall at 20–21)
  parallelHandsGrid: {
    singleColumn: { max: 12 },
    twoColumn: { min: 13, max: 50 },
    fourColumn: { min: 51, max: 100 },
    eightColumn: { min: 101 },
  },

  // UI layout constants (extracted from hardcoded values)
  ui: {
    modalMaxWidth: 'max-w-md', // Tailwind class for modal width
    contentMaxWidth: 'max-w-7xl', // Main content area
    defaultPadding: 'p-6',
    cardPadding: 'p-8',
  },

  // Audio configuration
  audio: {
    musicVolume: 0.7, // Background music volume multiplier (0.0 to 1.0)
  },

  // Streak multiplier configuration
  streakMultiplier: {
    enabled: true,
    baseThreshold: 5, // First bonus at 5 streak
    thresholdIncrement: 10, // Base increment value
    exponentialGrowth: 1.75, // Exponential growth factor (1.0 = linear, >1.0 = exponential)
    baseMultiplier: 1.5, // 1.5x at first tier
    multiplierIncrement: 0.5, // +0.5x per tier (2.0x, 2.5x, 3.0x, etc.)
  },

  // Quips for UI elements
  quips: {
    maxBet: [
      'Max Bet',
      'All In!',
      'Go Big!',
      'YOLO!',
      'Maximum Power!',
      'Full Send!',
      'Bet It All!',
      'Maximum Overdrive!',
      'Ride or Die!',
      'Full Throttle!',
      'Maximum Effort!',
      'All or Nothing!',
      'Bet the Farm!',
      'Maximum Stakes!',
      'Fuck it, we ball',
    ],
    devilsDeal: [
      'Can I offer you a deal?',
      'Make a deal with me?',
      'Interested in a proposition?',
      'Care to make a deal?',
      'What say you to a bargain?',
      'A tempting offer awaits...',
      'Shall we make a deal?',
      'An opportunity presents itself...',
    ],
    emptyShop: [
      'Shop is empty',
      'Nothing available today',
      'Come back next round',
      'No items in stock',
      'Sold out!',
      'Shop closed for restocking',
      'Check back later',
      'Fresh out of options',
      'Nothing to see here',
      'The shelves are bare',
    ],
    gameOver: [
      'The house smiles when you blink first.',
      'Luck is a loan shark, not a friend.',
      'The deck remembers every bad bargain.',
      'Even busted runs teach sharp hands.',
      'The table is patient. It will wait for your return.',
      'Every collapse is just another tell.',
      'The next run starts with better instincts.',
      'You made it farther than the last ghost at this table.',
    ],
  },

  /**
   * Default game mode: full config used as the base for all modes.
   * Each entry in gameModes is merged over this (deep merge); empty {} = use default as-is.
   */
  defaultGameMode: {
    displayName: 'Normal Game',
    startingCredits: 5000,
    startingBet: 2,
    startingHandCount: 10,
    /** Maximum cards dealt per hand (5 base + extra from shop). Cap for deal/draw. */
    maxHandSize: 8,
    /** Maximum number of draw phases (1 = single draw, 2 = base + extra draw). */
    maxDraws: 1,
    minimumBetIncreasePercent: 95,
    minimumBetIncreaseInterval: 3,
    shopFrequency: 2,
    minimumPairRank: 11,
    devilsDeal: {
      baseChance: 15,
      baseCostPercent: 300,
      chanceIncreasePerPurchase: 20,
      maxChancePurchases: 3,
      costReductionPerPurchase: 15,
      maxCostReductionPurchases: 6,
    },
    endlessMode: {
      startRound: 30,
      failureConditions: {
        minimumBetMultiplier: { enabled: false, value: 2.0 },
        minimumCreditEfficiency: { enabled: false, value: 100 },
        minimumWinningHandsPerRound: { enabled: false, value: 20 },
        minimumWinPercent: {
          enabled: true,
          startPercent: 25,
          incrementPerRound: 5,
          maxPercent: 105,
        },
      },
    },
    shop: {
      deadCard: { creditReward: 2500 },
      wildCard: { baseCost: 5000, increasePercent: 100, maxCount: 3 },
      singleDeadCardRemoval: { baseCost: 5000, increasePercent: 10 },
      parallelHandsBundles: { basePricePerHand: 10, bundles: [5, 10, 25, 50] },
      extraDraw: { cost: 250000, increasePercent: 150, maxPurchases: 2 },
      extraCardInHand: { baseCost: 10000, increasePercent: 125, maxPurchases: 3 },
      devilsDealChance: { baseCost: 5000, increasePercent: 50 },
      devilsDealCostReduction: { baseCost: 10000, increasePercent: 25 },
    },
    rewards: {
      'royal-flush': 250,
      'five-of-a-kind': 100,
      'straight-flush': 50,
      'four-of-a-kind': 25,
      'full-house': 9,
      flush: 6,
      straight: 4,
      'three-of-a-kind': 3,
      'two-pair': 2,
      'one-pair': 1,
      'high-card': 0,
    },
  },

  // Mode overrides keyed by mode id. Empty object = use defaultGameMode as-is.
  gameModes: {
    normalGame: {},
    // Example future mode: hardMode: { startingCredits: 3000, displayName: 'Hard' },
  },

  // Default deck contents (standard 52-card deck)
  defaultDeck: {
    suits: ['hearts', 'diamonds', 'clubs', 'spades'],
    ranks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
  },
} as const;

export type GameConfig = typeof gameConfig;

/** Type of the resolved game mode (default + overrides). */
export type GameModeConfig = (typeof gameConfig)['defaultGameMode'];

/** Deep-merge mode overrides onto default. Arrays and primitives in overrides replace defaults. */
function mergeGameMode<T extends Record<string, unknown>>(
  defaults: T,
  overrides: Partial<T> | Record<string, unknown>
): T {
  const result = { ...defaults } as Record<string, unknown>;
  const over = overrides as Record<string, unknown>;
  for (const key of Object.keys(over)) {
    if (!(key in over) || over[key] === undefined) continue;
    const defVal = (defaults as Record<string, unknown>)[key];
    const ovVal = over[key];
    if (
      ovVal !== null &&
      typeof ovVal === 'object' &&
      !Array.isArray(ovVal) &&
      defVal !== null &&
      typeof defVal === 'object' &&
      !Array.isArray(defVal)
    ) {
      (result as Record<string, unknown>)[key] = mergeGameMode(
        defVal as Record<string, unknown>,
        ovVal as Record<string, unknown>
      );
    } else {
      (result as Record<string, unknown>)[key] = ovVal;
    }
  }
  return result as T;
}

/** Returns the active game mode: defaultGameMode merged with current mode overrides. */
export function getCurrentGameMode(): GameModeConfig {
  const overrides = gameConfig.gameModes.normalGame as Partial<GameModeConfig>;
  return mergeGameMode(
    gameConfig.defaultGameMode as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as GameModeConfig;
}

/** Get a specific mode by id (for future mode selection). */
export function getGameMode(modeId: keyof typeof gameConfig.gameModes): GameModeConfig {
  const overrides = (gameConfig.gameModes[modeId] ?? {}) as Partial<GameModeConfig>;
  return mergeGameMode(
    gameConfig.defaultGameMode as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as GameModeConfig;
}

/** Shop mode shape for selection (slots, items, count). */
export type ShopSelectionMode = {
  shopSlots: ReadonlyArray<{ maxRarity: number; rarityChances?: ReadonlyArray<number> }>;
  shopItems: Record<string, { rarity: number }>;
  shopOptionCount?: number;
};

/**
 * Returns the display name for the active shop based on credits.
 */
export function getShopDisplayName(credits: number): string {
  const { default: defaultOpts, premium: premiumOpts } = gameConfig.shopOptions;
  return credits >= premiumOpts.creditsThreshold ? premiumOpts.name : defaultOpts.name;
}

/**
 * Returns the shop mode to use for option selection based on credits.
 * Uses premium store when credits >= shopOptions.premium.creditsThreshold.
 */
export function getShopModeForCredits(credits: number): ShopSelectionMode {
  const { default: defaultOpts, premium: premiumOpts } = gameConfig.shopOptions;
  if (credits >= premiumOpts.creditsThreshold) {
    return {
      shopSlots: premiumOpts.shopSlots,
      shopItems: premiumOpts.shopItems as Record<string, { rarity: number }>,
      shopOptionCount: premiumOpts.shopOptionCount,
    };
  }
  return {
    shopSlots: defaultOpts.shopSlots,
    shopItems: defaultOpts.shopItems as Record<string, { rarity: number }>,
    shopOptionCount: defaultOpts.shopOptionCount,
  };
}
