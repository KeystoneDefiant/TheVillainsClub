import { describe, expect, it, beforeEach } from "vitest";
import { activeBandIndexForBarDate } from "@/audio/barBandSchedule";
import { bandsCatalog } from "@/config/bandsCatalog";
import { effectiveBandIndexForBarDate, useBarBandOverrideStore } from "@/audio/barBandOverrideStore";

describe("effectiveBandIndexForBarDate", () => {
  beforeEach(() => {
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(null);
  });

  it("matches catalog hash when override is null", () => {
    const key = "20260425";
    expect(effectiveBandIndexForBarDate(key)).toBe(activeBandIndexForBarDate(key, bandsCatalog));
  });

  it("uses override when in range", () => {
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(1);
    expect(effectiveBandIndexForBarDate("20260425")).toBe(1);
  });

  it("ignores out-of-range override", () => {
    useBarBandOverrideStore.getState().setEveningBandIndexOverride(999);
    const key = "20260425";
    expect(effectiveBandIndexForBarDate(key)).toBe(activeBandIndexForBarDate(key, bandsCatalog));
  });
});
