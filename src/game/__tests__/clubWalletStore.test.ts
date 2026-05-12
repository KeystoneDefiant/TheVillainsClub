import { describe, expect, it, beforeEach } from "vitest";
import { villainsGameDefaults } from "@/config/villainsGameDefaults";
import { buildOublietteSettlementProfile } from "../sessionSettlement";
import { useClubWallet } from "../clubWalletStore";

describe("clubWalletStore forfeitActiveSession", () => {
  beforeEach(() => {
    useClubWallet.setState({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      activeSession: null,
      hasSave: false,
    });
  });

  it("clears active session without crediting the club wallet", () => {
    const buyIn = villainsGameDefaults.oublietteNo9.defaultBuyIn;
    const afterBuyIn = villainsGameDefaults.defaultClubBalance - buyIn;
    useClubWallet.setState({
      clubBalance: afterBuyIn,
      activeSession: {
        gameId: "oubliette_no9",
        drinkId: "club_table",
        buyIn,
        sessionWallet: buyIn,
        settlement: buildOublietteSettlementProfile(buyIn),
      },
    });
    useClubWallet.getState().forfeitActiveSession();
    expect(useClubWallet.getState().activeSession).toBeNull();
    expect(useClubWallet.getState().clubBalance).toBe(afterBuyIn);
  });

  it("no-ops when there is no active session", () => {
    const bal = useClubWallet.getState().clubBalance;
    useClubWallet.getState().forfeitActiveSession();
    expect(useClubWallet.getState().clubBalance).toBe(bal);
    expect(useClubWallet.getState().activeSession).toBeNull();
  });
});
