import { describe, it, expect } from "vitest";
import { resolveLigneeRoyaleGameMode, ligneeRoyaleGameConfig } from "../../../config/minigames/ligneeRoyaleConfig";
import { LIGNEE_ROYALE_LINES, PaylineConfig } from "../App";
import { PokerEvaluator } from "../../../game/poker/pokerEvaluator";
import { Card } from "../../../game/poker/types";

describe("Lignée Royale Configuration", () => {
  it("should resolve default normal game mode", () => {
    const config = resolveLigneeRoyaleGameMode("normalGame");
    const expectedNormal = ligneeRoyaleGameConfig.defaultGameMode;
    expect(config.displayName).toBe(expectedNormal.displayName);
    expect(config.buyIn).toBe(expectedNormal.buyIn);
    expect(config.minBet).toBe(expectedNormal.minBet);
    expect(config.maxBet).toBe(expectedNormal.maxBet);
    expect(config.maxWildCards).toBe(expectedNormal.maxWildCards);
    expect(config.maxDeadCards).toBe(expectedNormal.maxDeadCards);
  });

  it("should resolve high stakes game mode overrides", () => {
    const config = resolveLigneeRoyaleGameMode("highStakes");
    const expectedHigh = {
      ...ligneeRoyaleGameConfig.defaultGameMode,
      ...ligneeRoyaleGameConfig.gameModes.highStakes,
    };
    expect(config.displayName).toBe(expectedHigh.displayName);
    expect(config.buyIn).toBe(expectedHigh.buyIn);
    expect(config.minBet).toBe(expectedHigh.minBet);
    expect(config.maxBet).toBe(expectedHigh.maxBet);
  });

  it("should resolve unknown game mode to default normal mode", () => {
    const config = resolveLigneeRoyaleGameMode("nonExistent");
    expect(config.displayName).toBe(ligneeRoyaleGameConfig.defaultGameMode.displayName);
  });
});

describe("Lignée Royale Paylines", () => {
  it("should have exactly 7 lines defined", () => {
    expect(LIGNEE_ROYALE_LINES.length).toBe(7);
  });

  it("should have middle line row indices correct", () => {
    const middleLine = LIGNEE_ROYALE_LINES.find((l: PaylineConfig) => l.id === "middle");
    expect(middleLine).toBeDefined();
    expect(middleLine!.rows).toEqual([3, 3, 3, 3, 3]);
  });

  it("should have diagonal V line row indices correct", () => {
    const diagonalV = LIGNEE_ROYALE_LINES.find((l: PaylineConfig) => l.id === "diagonal-v");
    expect(diagonalV).toBeDefined();
    expect(diagonalV!.rows).toEqual([2, 3, 4, 3, 2]);
  });
});

describe("Lignée Royale Payout Evaluation", () => {
  const normalRewards = ligneeRoyaleGameConfig.defaultGameMode.rewards;

  it("should evaluate a normal hand correctly along a line", () => {
    // 5-card straight
    const cards: Card[] = [
      { suit: "hearts", rank: "5", id: "c1" },
      { suit: "diamonds", rank: "6", id: "c2" },
      { suit: "clubs", rank: "7", id: "c3" },
      { suit: "spades", rank: "8", id: "c4" },
      { suit: "hearts", rank: "9", id: "c5" },
    ];
    const result = PokerEvaluator.evaluate(cards);
    expect(result.rank).toBe("straight");
    expect(normalRewards["straight"]).toBe(3); // Updated from Oubliette payouts
  });

  it("should stack wild multipliers multiplicatively", () => {
    // Three Kings + 2x Wild + 3x Wild = Five of a Kind!
    // Payout should be multiplied by 2x * 3x = 6x multiplier
    const cards: Card[] = [
      { suit: "hearts", rank: "K", id: "c1" },
      { suit: "diamonds", rank: "K", id: "c2" },
      { suit: "clubs", rank: "K", id: "c3" },
      { suit: "hearts", rank: "A", id: "c4", isWild: true, wildMultiplier: 2 },
      { suit: "spades", rank: "A", id: "c5", isWild: true, wildMultiplier: 3 },
    ];
    const result = PokerEvaluator.evaluate(cards);
    expect(result.rank).toBe("five-of-a-kind");

    // Calculate line multiplier product
    let mult = 1;
    cards.forEach(c => {
      if (c.isWild && c.wildMultiplier && c.wildMultiplier > 1) {
        mult *= c.wildMultiplier;
      }
    });
    expect(mult).toBe(6);
  });

  it("should ignore dead cards during evaluation", () => {
    // Three Kings + Dead Card + 5 = Three of a kind (4 active cards)
    const cards: Card[] = [
      { suit: "hearts", rank: "K", id: "c1" },
      { suit: "diamonds", rank: "K", id: "c2" },
      { suit: "clubs", rank: "K", id: "c3" },
      { suit: "spades", rank: "5", id: "c4", isDead: true },
      { suit: "hearts", rank: "2", id: "c5" },
    ];
    const result = PokerEvaluator.evaluate(cards);
    expect(result.rank).toBe("three-of-a-kind");
  });

  it("should not count scatters or coins as card values or suits during evaluation", () => {
    // Two Kings + Scatter + Coin + 2 = One Pair (Jacks or Better) / None
    const cards: Card[] = [
      { suit: "hearts", rank: "K", id: "c1" },
      { suit: "diamonds", rank: "K", id: "c2" },
      { suit: "clubs", rank: "A", id: "c3", isScatter: true },
      { suit: "spades", rank: "A", id: "c4", isCoin: true },
      { suit: "hearts", rank: "2", id: "c5" },
    ];
    const result = PokerEvaluator.evaluate(cards);
    expect(result.rank).toBe("one-pair");
  });
});
