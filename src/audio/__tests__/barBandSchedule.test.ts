import { describe, expect, it } from "vitest";
import type { BandsCatalog } from "@/config/bandsCatalog";
import {
  activeBandIndexForBarDate,
  barDateKey,
  barDayStart,
  msUntilNextBarBoundary,
} from "@/audio/barBandSchedule";

const threeBandCatalog: BandsCatalog = {
  interlude_chance_between_tracks: 0.3,
  bands: [
    { id: "a", display_name: "A", asset_root: "x", music_files: ["m.ogg"], interlude_files: [] },
    { id: "b", display_name: "B", asset_root: "x", music_files: ["m.ogg"], interlude_files: [] },
    { id: "c", display_name: "C", asset_root: "x", music_files: ["m.ogg"], interlude_files: [] },
  ],
};

describe("barDayStart / barDateKey", () => {
  it("uses the previous calendar day before 4am", () => {
    const d = new Date(2026, 3, 25, 3, 30, 0, 0);
    const s = barDayStart(d);
    expect(s.getFullYear()).toBe(2026);
    expect(s.getMonth()).toBe(3);
    expect(s.getDate()).toBe(24);
    expect(s.getHours()).toBe(4);
    expect(barDateKey(d)).toBe("20260424");
  });

  it("uses the same calendar day from 4am onward", () => {
    const d = new Date(2026, 3, 25, 4, 0, 0, 0);
    expect(barDateKey(d)).toBe("20260425");
    const d2 = new Date(2026, 3, 25, 12, 0, 0, 0);
    expect(barDateKey(d2)).toBe("20260425");
  });
});

describe("activeBandIndexForBarDate", () => {
  it("returns a valid index for any key", () => {
    for (const key of ["20260424", "20260425", "20250101"]) {
      const i = activeBandIndexForBarDate(key, threeBandCatalog);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(3);
    }
  });

  it("is stable for the same key", () => {
    expect(activeBandIndexForBarDate("20260425", threeBandCatalog)).toBe(
      activeBandIndexForBarDate("20260425", threeBandCatalog),
    );
  });
});

describe("msUntilNextBarBoundary", () => {
  it("is positive and finite", () => {
    const ms = msUntilNextBarBoundary(new Date(2026, 3, 25, 10, 0, 0, 0));
    expect(ms).toBeGreaterThan(0);
    expect(Number.isFinite(ms)).toBe(true);
  });
});
