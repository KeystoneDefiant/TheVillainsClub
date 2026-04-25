import { describe, expect, it } from "vitest";
import { VC_LOGO_GREY_LETTER_COUNT, VC_LOGO_INTRO_VIEWBOX, vcLogoGreyPaths, vcLogoRedPaths } from "./vcLogoIntroPaths";

describe("vcLogoIntroPaths", () => {
  it("matches VC Logo - Color.svg layout (2 red, 12 grey paths)", () => {
    expect(vcLogoRedPaths).toHaveLength(2);
    expect(vcLogoGreyPaths).toHaveLength(12);
    expect(VC_LOGO_INTRO_VIEWBOX).toBe("0 0 241.3 165.6");
  });

  it("keeps grey letter count in sync with paths", () => {
    expect(VC_LOGO_GREY_LETTER_COUNT).toBe(vcLogoGreyPaths.length);
  });

  it("uses positive stroke lengths for dash animation", () => {
    for (const p of vcLogoGreyPaths) {
      expect(p.strokeLen).toBeGreaterThan(4);
    }
  });
});
