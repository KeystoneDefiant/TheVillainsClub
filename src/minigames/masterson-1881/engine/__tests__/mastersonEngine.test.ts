import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMastertonEngine } from "../useMastertonEngine";
import { executeBettorBetting } from "../bettorAI";
import * as bettorAI from "../bettorAI";
import { rouletteNumbers, validateOutcomeAgainstRig } from "@/config/minigames/mastersonRules";

describe("Bettor AI Strategies", () => {
  it("Martingale strategy should double bet on loss and reset on win", () => {
    const bettor = {
      id: "Seat 1",
      name: "Norman Bates",
      strategy: "Martingale" as const,
      chips: 10000,
      initial_chips: 10000,
      max_suspicion: 5,
      current_suspicion: 0,
      loss_tolerance_pct: 0.8,
      max_consecutive_losses: 5,
      current_consecutive_losses: 0,
      double_bet_frequency: 0,
      herd_mentality_pct: 0.2,
    };

    // First spin (no history)
    const res1 = executeBettorBetting(bettor, null, null);
    expect(res1.bets.length).toBe(1);
    const initialAmt = res1.bets[0]!.amount;

    // Spin after a loss (should double)
    const res2 = executeBettorBetting(bettor, false, initialAmt);
    expect(res2.bets[0]!.amount).toBe(initialAmt * 2);

    // Spin after a win (should reset)
    const res3 = executeBettorBetting(bettor, true, initialAmt * 2);
    expect(res3.bets[0]!.amount).toBe(initialAmt);
  });

  it("D'Alembert strategy should increment bet on loss and decrement on win", () => {
    const bettor = {
      id: "Seat 1",
      name: "Mildred Ratched",
      strategy: "D_Alembert" as const,
      chips: 10000,
      initial_chips: 10000,
      max_suspicion: 5,
      current_suspicion: 0,
      loss_tolerance_pct: 0.8,
      max_consecutive_losses: 5,
      current_consecutive_losses: 0,
      double_bet_frequency: 0,
      herd_mentality_pct: 0.2,
    };

    const baseUnit = Math.floor(bettor.initial_chips * 0.02);

    const res1 = executeBettorBetting(bettor, null, null);
    const initialAmt = res1.bets[0]!.amount;
    expect(initialAmt).toBe(baseUnit);

    // Loss: should increase by baseUnit
    const res2 = executeBettorBetting(bettor, false, initialAmt);
    expect(res2.bets[0]!.amount).toBe(initialAmt + baseUnit);

    // Win: should decrease back to baseUnit
    const res3 = executeBettorBetting(bettor, true, initialAmt + baseUnit);
    expect(res3.bets[0]!.amount).toBe(initialAmt);
  });
});

describe("Roulette Geometry & Payout Validation", () => {
  it("should validate low rig outcomes correctly", () => {
    const oddNum = rouletteNumbers.find((n) => n.value === "3")!;
    const evenNum = rouletteNumbers.find((n) => n.value === "10")!;
    const redNum = rouletteNumbers.find((n) => n.color === "Red")!;
    
    expect(validateOutcomeAgainstRig(oddNum, { severity: "low", target: "Odd" })).toBe(true);
    expect(validateOutcomeAgainstRig(evenNum, { severity: "low", target: "Odd" })).toBe(false);
    expect(validateOutcomeAgainstRig(redNum, { severity: "low", target: "Red" })).toBe(true);
  });
});

describe("useMastertonEngine Hook", () => {
  it("should initialize with spinCount 1 and 4 seat profiles", () => {
    const { result } = renderHook(() => useMastertonEngine());
    expect(result.current.spinCount).toBe(1);
    expect(result.current.activeBettors.length).toBe(4);
    expect(result.current.phase).toBe("BETTING");
  });

  it("should run through spin phase and evaluation correctly", () => {
    const { result } = renderHook(() => useMastertonEngine());

    // Step 1: Rig selection
    act(() => {
      result.current.selectRig("low", "Red");
    });
    expect(result.current.selectedRig.target).toBe("Red");

    // Step 2: Place Initial Bets & Lock outcome
    act(() => {
      result.current.placeInitialBets();
    });
    expect(result.current.phase).toBe("SPINNING");

    act(() => {
      result.current.determineResultAndLock();
    });
    expect(result.current.spinResult).not.toBeNull();
    // Outcome must honor rig
    expect(result.current.spinResult!.color).toBe("Red");

    // Step 3: Resolve Spin
    act(() => {
      result.current.resolveSpin();
    });
    expect(result.current.phase).toBe("EVALUATION");
    expect(result.current.notifications.length).toBeGreaterThan(0);

    // Step 4: Advance to summary
    act(() => {
      result.current.advanceToSummary();
    });
    expect(result.current.phase).toBe("SUMMARY");

    // Step 5: Advance to next spin
    act(() => {
      result.current.nextSpinTurn();
    });
    expect(result.current.spinCount).toBe(2);
    expect(result.current.phase).toBe("BETTING");
  });

  it("should trigger last chance bettor join if table is completely empty on any spin", () => {
    // Bettors bet all of their chips on Red to force eviction upon losing
    const spyAI = vi.spyOn(bettorAI, "executeBettorBetting").mockImplementation((bettor) => ({
      bets: [{ target: "Red", amount: bettor.chips }],
      updatedBettor: { ...bettor, chips: 0 },
    }));

    // Return 0.2 so standard seat refill (15% chance) is skipped,
    // but empty table last chance check (25% chance) triggers successfully.
    const spyMath = vi.spyOn(Math, "random").mockImplementation(() => 0.2);

    const { result } = renderHook(() => useMastertonEngine());

    // Rig outcome to Black so all bets on Red lose
    act(() => {
      result.current.selectRig("low", "Black");
    });

    act(() => {
      result.current.placeInitialBets();
    });

    act(() => {
      result.current.determineResultAndLock();
    });

    act(() => {
      result.current.resolveSpin();
    });

    expect(result.current.activeBettors.length).toBe(1);
    expect(result.current.notifications.some(n => n.message.includes("wealthy gambler"))).toBe(true);

    spyAI.mockRestore();
    spyMath.mockRestore();
  });
});
