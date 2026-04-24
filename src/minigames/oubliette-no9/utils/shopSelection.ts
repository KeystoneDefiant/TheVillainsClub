/**
 * Shop option selection utilities
 * Rarity-based selection: each slot has a max rarity and chances per rarity;
 * we roll for rarity then pick an item of that rarity (by weight).
 */

import { ShopOptionType } from '../types';

export type ShopSlotConfig = {
  maxRarity: number;
  rarityChances?: number[];
};

export type ShopItemConfig = {
  rarity: number;
};

/** Mode shape for rarity-based shop selection (accepts readonly config). */
export type ShopRarityMode = {
  /** Desired number of shop slots to fill. If omitted, uses shopSlots.length. */
  shopOptionCount?: number;
  shopSlots?: ReadonlyArray<{ maxRarity: number; rarityChances?: ReadonlyArray<number> | number[] }>;
  shopItems?: Record<string, { rarity: number }>;
};

/**
 * Pick a rarity level 1..maxRarity using the slot's rarityChances.
 * rarityChances[i] = chance for rarity i+1; length must be maxRarity; will be normalized.
 */
function pickRarityForSlot(
  maxRarity: number,
  rarityChances: readonly number[] | number[] | undefined
): number {
  const chances =
    rarityChances && rarityChances.length >= maxRarity
      ? [...rarityChances].slice(0, maxRarity)
      : Array.from({ length: maxRarity }, () => 1 / maxRarity);
  const sum = chances.reduce((a, b) => a + b, 0);
  const normalized = sum > 0 ? chances.map((c) => c / sum) : chances;
  const roll = Math.random();
  let acc = 0;
  for (let r = 1; r <= maxRarity; r++) {
    acc += normalized[r - 1];
    if (roll < acc) return r;
  }
  return maxRarity;
}

/**
 * Uniform random pick from options. Returns one option or null if none.
 */
function pickOne(options: ShopOptionType[]): ShopOptionType | null {
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Select shop options by rarity: for each slot, determine rarity from slot config,
 * then pick an item of that rarity (by weight). Prefers no duplicates; fills with
 * repeats so the shop always has exactly the configured number of items.
 */
export function selectShopOptionsByRarity(mode: ShopRarityMode): ShopOptionType[] {
  const slots = mode.shopSlots;
  const items = mode.shopItems;

  if (!slots?.length || !items) {
    return [];
  }

  const optionKeys = Object.keys(items) as ShopOptionType[];
  if (optionKeys.length === 0) return [];

  const targetCount = Math.max(
    1,
    mode.shopOptionCount ?? slots.length
  );
  const selected: ShopOptionType[] = [];

  for (let i = 0; i < targetCount; i++) {
    const slot = slots[i % slots.length];
    const maxRarity = Math.min(4, Math.max(1, slot.maxRarity));
    const rarity = pickRarityForSlot(maxRarity, slot.rarityChances);

    const availableByRarity = optionKeys.filter(
      (key) => items[key]?.rarity === rarity && !selected.includes(key)
    );
    const availableAny = optionKeys.filter((key) => !selected.includes(key));
    // When no unique options left, allow duplicates so the shop is always filled
    const pool =
      availableByRarity.length > 0
        ? availableByRarity
        : availableAny.length > 0
          ? availableAny
          : optionKeys;

    const picked = pickOne(pool);
    if (picked != null) {
      selected.push(picked);
    }
  }

  return selected;
}

/**
 * Legacy: weighted random selection without replacement.
 * Prefer selectShopOptionsByRarity when mode has shopSlots/shopItems.
 */
export function selectRandomShopOptions(
  weights: Record<string, number>,
  count: number
): ShopOptionType[] {
  const availableOptions = Object.entries(weights) as [ShopOptionType, number][];
  const selected: ShopOptionType[] = [];
  let totalWeight = availableOptions.reduce((sum, [, weight]) => sum + weight, 0);

  while (selected.length < count && availableOptions.length > 0) {
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableOptions.length; i++) {
      const [option, weight] = availableOptions[i];
      random -= weight;

      if (random <= 0) {
        selected.push(option);
        totalWeight -= weight;
        availableOptions.splice(i, 1);
        break;
      }
    }
  }

  if (selected.length < count) {
    const allOptions = Object.entries(weights) as [ShopOptionType, number][];
    allOptions.sort((a, b) => b[1] - a[1]);
    let optionIndex = 0;
    while (selected.length < count && allOptions.length > 0) {
      const [option] = allOptions[optionIndex % allOptions.length];
      selected.push(option);
      optionIndex++;
    }
  }

  return selected;
}
