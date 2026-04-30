import { villainsGameDefaults } from "./villainsGameDefaults";

const DISABLED_VALUES = new Set(["0", "false", "off", "no", "disabled"]);

export const OUBLIETTE_STANDALONE_ROUTE = "/oubliette-no9";

export function isOublietteStandaloneLandingEnabled(
  envValue = import.meta.env.VITE_OUBLIETTE_NO9_STANDALONE,
): boolean {
  if (typeof envValue !== "string" || envValue.trim() === "") {
    return villainsGameDefaults.oublietteNo9.standaloneLandingEnabled;
  }
  return !DISABLED_VALUES.has(envValue.trim().toLowerCase());
}
