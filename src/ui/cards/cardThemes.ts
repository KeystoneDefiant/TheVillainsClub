/**
 * Card surface palette (light / dark). Used by Oubliette and any other table UIs.
 */

export type CardThemeId = "light" | "dark";

export const CARD_THEME_STORAGE_KEY = "villains-playing-card-theme";

const LEGACY_CARD_THEME_STORAGE_KEY = "cardTheme";

export const CARD_THEMES: { id: CardThemeId; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "White cards, traditional red and black suits" },
  { id: "dark", label: "Dark", description: "Dark cards with red and light suit text" },
];

export function getStoredCardTheme(): CardThemeId {
  if (typeof window === "undefined") return "dark";
  const stored =
    localStorage.getItem(CARD_THEME_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_CARD_THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function setStoredCardTheme(theme: CardThemeId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARD_THEME_STORAGE_KEY, theme);
  try {
    localStorage.removeItem(LEGACY_CARD_THEME_STORAGE_KEY);
  } catch {
    // ignore
  }
}
