import { describe, expect, it } from "vitest";
import { routerBasenameFromBaseUrl } from "./routerBasename";

describe("routerBasenameFromBaseUrl", () => {
  it("returns undefined for root-ish bases", () => {
    expect(routerBasenameFromBaseUrl("/")).toBeUndefined();
    expect(routerBasenameFromBaseUrl("./")).toBeUndefined();
  });

  it("strips trailing slash from path bases", () => {
    expect(routerBasenameFromBaseUrl("/TheVillainsClub/")).toBe("/TheVillainsClub");
  });
});
