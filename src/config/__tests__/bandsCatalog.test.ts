import { describe, expect, it } from "vitest";
import type { BandCatalogEntry } from "@/config/bandsCatalog";
import { bandAssetPublicPath, siteAssetPathPrefixFromViteBase } from "@/config/bandsCatalog";

const sampleBand: BandCatalogEntry = {
  id: "test",
  display_name: "Test",
  asset_root: "audio/bands/velvet_rats",
  music_files: ["music/track_01.ogg"],
  interlude_files: [],
};

describe("siteAssetPathPrefixFromViteBase", () => {
  it("treats default relative base as empty prefix", () => {
    expect(siteAssetPathPrefixFromViteBase("./")).toBe("");
    expect(siteAssetPathPrefixFromViteBase(".")).toBe("");
  });

  it("strips trailing slashes from absolute base", () => {
    expect(siteAssetPathPrefixFromViteBase("/villains-club/")).toBe("/villains-club");
  });
});

describe("bandAssetPublicPath", () => {
  it("uses root-absolute path when base is empty (http)", () => {
    expect(bandAssetPublicPath(sampleBand, "music/track_01.ogg", "./", "http:")).toBe(
      "/audio/bands/velvet_rats/music/track_01.ogg",
    );
  });

  it("prefixes GitHub Pages-style base once (https)", () => {
    expect(bandAssetPublicPath(sampleBand, "music/track_01.ogg", "/villains-club/", "https:")).toBe(
      "/villains-club/audio/bands/velvet_rats/music/track_01.ogg",
    );
  });

  it("uses path relative to index.html under file: (Electron dist)", () => {
    expect(bandAssetPublicPath(sampleBand, "music/track_01.ogg", "./", "file:")).toBe(
      "audio/bands/velvet_rats/music/track_01.ogg",
    );
  });
});
