import { gameConfig } from './oublietteNo9Config';
export { gameConfig };

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

export type OublietteGameModeId = keyof typeof gameConfig.gameModes;

/** Table session: unknown ids fall back to the normal merged profile. */
export function resolveOublietteGameMode(modeId: string | undefined): GameModeConfig {
  if (modeId != null && modeId !== "" && modeId in gameConfig.gameModes) {
    return getGameMode(modeId as OublietteGameModeId);
  }
  return getCurrentGameMode();
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
