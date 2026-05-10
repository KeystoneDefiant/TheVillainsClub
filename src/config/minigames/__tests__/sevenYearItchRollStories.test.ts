import { describe, expect, it } from "vitest";
import { pickSevenYearItchRollStory, sevenYearItchRollStories } from "../sevenYearItchRollStories";

describe("sevenYearItchRollStories", () => {
  it("has multiple lines for every dice total 2–12", () => {
    for (let t = 2; t <= 12; t += 1) {
      expect(sevenYearItchRollStories[t as keyof typeof sevenYearItchRollStories].length).toBeGreaterThan(0);
    }
  });

  it("pickSevenYearItchRollStory is deterministic with a fixed rng", () => {
    const rng = () => 0.99;
    const a = pickSevenYearItchRollStory(7, rng);
    const b = pickSevenYearItchRollStory(7, rng);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });
});
