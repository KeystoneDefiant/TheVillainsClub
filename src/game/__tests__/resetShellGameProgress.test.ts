import { describe, expect, it, beforeEach } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { useClubWallet } from "../clubWalletStore";
import { useMetaProgression } from "../metaProgressionStore";
import { resetShellGameProgress } from "../resetShellGameProgress";

describe("resetShellGameProgress", () => {
  beforeEach(() => {
    useClubWallet.setState({
      clubBalance: 99_999,
      activeSession: null,
      hasSave: true,
    });
    useMetaProgression.setState({ unlockIds: ["stub-drink", "stub-table"] });
  });

  it("restores default club balance and clears session flags", () => {
    resetShellGameProgress();
    const w = useClubWallet.getState();
    expect(w.clubBalance).toBe(villainsGameDefaults.defaultClubBalance);
    expect(w.activeSession).toBeNull();
    expect(w.hasSave).toBe(false);
  });

  it("clears meta unlock ids", () => {
    resetShellGameProgress();
    expect(useMetaProgression.getState().unlockIds).toEqual([]);
  });
});
