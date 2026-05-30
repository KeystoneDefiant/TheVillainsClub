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
        settlement: buildOublietteSettlementProfile(buyIn, new Date("2026-01-01")),
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

describe("clubWalletStore endSession", () => {
  beforeEach(() => {
    useClubWallet.setState({
      clubBalance: villainsGameDefaults.defaultClubBalance,
      activeSession: null,
      hasSave: false,
    });
  });

  it("credits the capped amount when session is ended", () => {
    const buyIn = 2000;
    const baseProfile = buildOublietteSettlementProfile(buyIn, new Date("2026-01-01"));
    
    useClubWallet.setState({
      clubBalance: 8000,
      activeSession: {
        gameId: "oubliette_no9",
        drinkId: "club_table",
        buyIn,
        sessionWallet: buyIn,
        settlement: baseProfile,
      },
    });

    useClubWallet.getState().endSession({
      uncappedCredits: 5000,
      basePayout: 5000,
      overachievementBonus: 0,
      tiers: 0,
      totalReturn: 5000,
    });

    expect(useClubWallet.getState().activeSession).toBeNull();
    expect(useClubWallet.getState().clubBalance).toBe(13000);
  });

  it("strictly enforces return ceiling cap even if ended with massive return details", () => {
    const buyIn = 2000;
    const baseProfile = buildOublietteSettlementProfile(buyIn, new Date("2026-01-01"));
    
    useClubWallet.setState({
      clubBalance: 8000,
      activeSession: {
        gameId: "oubliette_no9",
        drinkId: "club_table",
        buyIn,
        sessionWallet: buyIn,
        settlement: baseProfile,
      },
    });

    useClubWallet.getState().endSession({
      uncappedCredits: 1_000_000,
      basePayout: 100_000,
      overachievementBonus: 900_000,
      tiers: 10,
      totalReturn: 1_000_000,
    });

    expect(useClubWallet.getState().activeSession).toBeNull();
    expect(useClubWallet.getState().clubBalance).toBe(108000);
  });

  it("strictly enforces return ceiling cap when ending session with a raw number exceeding baseCap", () => {
    const buyIn = 2000;
    const baseProfile = buildOublietteSettlementProfile(buyIn, new Date("2026-01-01"));
    
    useClubWallet.setState({
      clubBalance: 8000,
      activeSession: {
        gameId: "oubliette_no9",
        drinkId: "club_table",
        buyIn,
        sessionWallet: buyIn,
        settlement: baseProfile,
      },
    });

    useClubWallet.getState().endSession(150_000);

    expect(useClubWallet.getState().activeSession).toBeNull();
    expect(useClubWallet.getState().clubBalance).toBe(108000);
  });
});

describe("clubWalletStore playedGames tracking", () => {
  beforeEach(() => {
    useClubWallet.getState().resetWalletAndSession();
  });

  it("initializes with all games set to not played", () => {
    const state = useClubWallet.getState();
    expect(state.playedGames).toEqual({
      oubliette_no9: false,
      seven_year_itch: false,
      fateseal_silver: false,
      masterson_1881: false,
    });
  });

  it("marks a game as played when a standard session starts successfully", () => {
    const buyIn = 2000;
    const baseProfile = buildOublietteSettlementProfile(buyIn, new Date("2026-01-01"));
    
    const result = useClubWallet.getState().startSession({
      gameId: "oubliette_no9",
      drinkId: "club_table",
      buyIn,
      settlement: baseProfile,
    });
    
    expect(result.ok).toBe(true);
    expect(useClubWallet.getState().playedGames.oubliette_no9).toBe(true);
    expect(useClubWallet.getState().playedGames.seven_year_itch).toBe(false);
  });

  it("marks a game as played when a tutorial session starts", () => {
    useClubWallet.getState().startTutorialSession("seven_year_itch");
    
    expect(useClubWallet.getState().activeSession).not.toBeNull();
    expect(useClubWallet.getState().activeSession?.isTutorial).toBe(true);
    expect(useClubWallet.getState().playedGames.seven_year_itch).toBe(true);
    expect(useClubWallet.getState().playedGames.oubliette_no9).toBe(false);
  });

  it("resets all playedGames to false on resetWalletAndSession", () => {
    useClubWallet.getState().startTutorialSession("fateseal_silver");
    expect(useClubWallet.getState().playedGames.fateseal_silver).toBe(true);
    
    useClubWallet.getState().resetWalletAndSession();
    expect(useClubWallet.getState().playedGames).toEqual({
      oubliette_no9: false,
      seven_year_itch: false,
      fateseal_silver: false,
      masterson_1881: false,
    });
  });
});
