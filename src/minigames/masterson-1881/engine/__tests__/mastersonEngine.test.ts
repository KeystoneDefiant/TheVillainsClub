import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { executeBettorBetting } from "../bettorAI";
import { rouletteNumbers, validateOutcomeAgainstRig, mastersonGameConfig, resolveMastersonGameMode } from "@/config/minigames/mastersonRules";

// vi.mock is hoisted by Vitest so it intercepts the engine's ESM named imports of
// executeBettorBetting and generateRandomBettor. vi.spyOn only patches the namespace
// object and does NOT intercept direct named import bindings inside useMastertonEngine.
vi.mock("../bettorAI", async (importOriginal) => {
  const original = await importOriginal<typeof import("../bettorAI")>();
  return {
    ...original,
    executeBettorBetting: vi.fn(original.executeBettorBetting),
    generateRandomBettor: vi.fn(original.generateRandomBettor),
  };
});

// Import useMastertonEngine and the mocked bettorAI namespace after vi.mock declaration.
import { useMastertonEngine } from "../useMastertonEngine";
import * as bettorAI from "../bettorAI";

describe("Bettor AI Strategies", () => {
  beforeEach(() => {
    vi.mocked(bettorAI.executeBettorBetting).mockRestore();
    vi.mocked(bettorAI.generateRandomBettor).mockRestore();
  });

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
  beforeEach(() => {
    // Restore to real implementation before each test so other hook tests are unaffected
    vi.mocked(bettorAI.executeBettorBetting).mockRestore();
    vi.mocked(bettorAI.generateRandomBettor).mockRestore();
  });

  it("should initialize with spinCount 1 and 4 seat profiles by default", () => {
    const { result } = renderHook(() => useMastertonEngine());
    expect(result.current.spinCount).toBe(1);
    expect(result.current.activeBettors.length).toBe(4);
    expect(result.current.phase).toBe("BETTING");
  });

  it("should initialize with configured seat profiles when grandSalon gameModeId is provided", () => {
    const { result } = renderHook(() => useMastertonEngine("grandSalon"));
    expect(result.current.spinCount).toBe(1);
    const expectedBettors = resolveMastersonGameMode("grandSalon").max_bettors;
    expect(result.current.activeBettors.length).toBe(expectedBettors);
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
    // Provide fully controlled bettor profiles so eviction is 100% deterministic:
    //   loss_tolerance_pct = 1.0  →  eviction threshold = initial_chips * (1 - 1.0) = 0
    //   chips = 0 after betting everything  →  0 <= 0  = true  →  always evicted
    //   herd_mentality_pct = 0  →  no herd cascade random calls
    const makeBettor = (seatIndex: number) => ({
      id: `Seat ${seatIndex}`,
      name: `Villain ${seatIndex}`,
      strategy: "Martingale" as const,
      chips: 10000,
      initial_chips: 10000,
      max_suspicion: 10,
      current_suspicion: 0,
      loss_tolerance_pct: 1.0,
      max_consecutive_losses: 100,
      current_consecutive_losses: 0,
      double_bet_frequency: 0,
      herd_mentality_pct: 0,
    });

    // Both are intercepted via vi.mock hoisting, so the engine's named imports are patched.
    vi.mocked(bettorAI.generateRandomBettor).mockImplementation(makeBettor);
    vi.mocked(bettorAI.executeBettorBetting).mockImplementation((bettor) => ({
      bets: [{ target: "Red", amount: bettor.chips, payoutOdds: 1 }],
      nextBetAmount: bettor.chips,
    }));

    // With controlled bettors, Math.random calls in the upkeep section are:
    //   (1) determineResultAndLock outcome pick — any index in the Black-filtered set is fine
    //   (2) seat-refill roll  → must be >= seat_fill_chance_per_spin (0.40) to SKIP
    //   (3) empty-table roll  → must be < empty_table_last_chance_pct (0.25) to TRIGGER
    // No other Math.random calls happen (bettors have herd_mentality_pct=0, no cascade branch).
    const { seat_fill_chance_per_spin, empty_table_last_chance_pct } = mastersonGameConfig;
    let callCount = 0;
    const randomQueue = [
      0.5,                                  // outcome pick (Black-filtered, any index works)
      seat_fill_chance_per_spin + 0.1,      // seat-refill roll — SKIP (>= 0.40)
      empty_table_last_chance_pct - 0.05,   // empty-table roll — TRIGGER (< 0.25)
      ...Array(20).fill(0.5),               // generateRandomBettor for new wealthy gambler
    ];
    const spyMath = vi.spyOn(Math, "random").mockImplementation(() => {
      const val = randomQueue[callCount] ?? 0.5;
      callCount++;
      return val;
    });

    const { result } = renderHook(() => useMastertonEngine());

    // Rig outcome to Black so all Red bets lose.
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

    spyMath.mockRestore();
  });

  it("should calculate commission dynamically on overall ledger and generate warning notifications if negative", () => {
    const makeBettor = (seatIndex: number) => ({
      id: `Seat ${seatIndex}`,
      name: `Villain ${seatIndex}`,
      strategy: "Martingale" as const,
      chips: 10000,
      initial_chips: 10000,
      max_suspicion: 10,
      current_suspicion: 0,
      loss_tolerance_pct: 1.0,
      max_consecutive_losses: 100,
      current_consecutive_losses: 0,
      double_bet_frequency: 0,
      herd_mentality_pct: 0,
    });

    vi.mocked(bettorAI.generateRandomBettor).mockImplementation(makeBettor);
    
    // Rig player wins (house losses)
    vi.mocked(bettorAI.executeBettorBetting).mockImplementation(() => ({
      bets: [{ target: "Red", amount: 1000, payoutOdds: 1 }],
      nextBetAmount: 1000,
    }));

    const { result } = renderHook(() => useMastertonEngine());

    // Rig outcome to Red so player wins (house loses 1000)
    act(() => {
      result.current.selectRig("low", "Red");
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

    // House lost 4 bettors * 1000 = 4000. Wait, 4 active bettors, each bet 1000 on Red, and they won 1000 payout + kept 1000 bet.
    // So house paid out 4000 net profit to players. Ledger is -4000.
    expect(result.current.tableHouseLedger).toBe(-4000);
    // Commission is 0 because ledger is negative
    expect(result.current.accumulatedCommission).toBe(0);
    // Warning warning notification should exist
    expect(result.current.notifications.some(n => n.message.includes("WARNING: Table ledger is negative"))).toBe(true);

    // Now rig player loss (house wins)
    vi.mocked(bettorAI.executeBettorBetting).mockImplementation(() => ({
      bets: [{ target: "Red", amount: 3000, payoutOdds: 1 }],
      nextBetAmount: 3000,
    }));

    act(() => {
      result.current.advanceToSummary();
    });
    act(() => {
      result.current.nextSpinTurn();
    });
    
    // Rig outcome to Black so player loses (house wins 4 bettors * 3000 = 12000)
    // Ledger: -4000 + 12000 = 8000
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

    expect(result.current.tableHouseLedger).toBe(8000);
    // Commission rate is 10% on spin 2
    // Commission: 8000 * 0.1 = 800
    expect(result.current.accumulatedCommission).toBe(800);
    expect(result.current.notifications.some(n => n.message.includes("WARNING"))).toBe(false);
  });
});

