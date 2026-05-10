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
});
