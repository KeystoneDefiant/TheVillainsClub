import { describe, expect, it } from "vitest";
import {
  getCurrentSevenYearItchGameMode,
  getSevenYearItchGameMode,
  sevenYearItchGameConfig,
} from "../sevenYearItchRules";

describe("sevenYearItch game modes", () => {
  it("current mode matches default when normalGame has no overrides", () => {
    const current = getCurrentSevenYearItchGameMode();
    expect(current).toEqual({ ...sevenYearItchGameConfig.defaultGameMode });
  });

  it("getSevenYearItchGameMode merges overrides onto the base", () => {
    const quick = getSevenYearItchGameMode("quickTable");
    expect(quick.chipIncrement).toBe(25);
    expect(quick.minPassBet).toBe(25);
    expect(quick.showFieldAndHornSection).toBe(false);
    expect(quick.maxFreeOddsMultipleOfPass).toBe(sevenYearItchGameConfig.defaultGameMode.maxFreeOddsMultipleOfPass);
  });
});
