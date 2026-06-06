import { describe, expect, it } from "vitest";
import {
  fatesealGameConfig,
  getCurrentFatesealGameMode,
  getFatesealGameMode,
} from "../fatesealRules";

describe("Fateseal Silver game modes", () => {
  it("current mode matches default when normalGame has no overrides", () => {
    const current = getCurrentFatesealGameMode();
    expect(current).toEqual({ ...fatesealGameConfig.defaultGameMode });
  });

  it("getFatesealGameMode merges overrides onto the base", () => {
    const quick = getFatesealGameMode("quickBet");
    expect(quick.chipIncrement).toBe(5);
    expect(quick.minBaseBet).toBe(5);
    expect(quick.maxBaseBetFractionOfSession).toBe(
      fatesealGameConfig.defaultGameMode.maxBaseBetFractionOfSession,
    );
  });

  it("resolves dynamic betMultipliers correctly per game mode", () => {
    const current = getCurrentFatesealGameMode();
    expect(current.betMultipliers).toEqual(fatesealGameConfig.defaultGameMode.betMultipliers);

    const quick = getFatesealGameMode("quickBet");
    expect(quick.betMultipliers).toEqual(
      fatesealGameConfig.gameModes.quickBet.betMultipliers ?? fatesealGameConfig.defaultGameMode.betMultipliers
    );

    const high = getFatesealGameMode("highRoller");
    expect(high.betMultipliers).toEqual(
      fatesealGameConfig.gameModes.highRoller.betMultipliers ?? fatesealGameConfig.defaultGameMode.betMultipliers
    );
  });
});
