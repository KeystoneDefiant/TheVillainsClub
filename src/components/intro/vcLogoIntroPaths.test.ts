import { describe, expect, it } from "vitest";
import { VC_LOGO_GREY_LETTER_COUNT, vcLogoGreyPaths } from "./vcLogoIntroPaths";

describe("vcLogoIntroPaths", () => {
  it("keeps grey letter count in sync with paths", () => {
    expect(VC_LOGO_GREY_LETTER_COUNT).toBe(vcLogoGreyPaths.length);
  });

  it("uses positive stroke lengths for dash animation", () => {
    for (const p of vcLogoGreyPaths) {
      expect(p.strokeLen).toBeGreaterThan(4);
    }
  });
});
