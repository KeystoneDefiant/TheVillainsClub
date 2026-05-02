import { describe, expect, it } from "vitest";
import type { BandCatalogEntry } from "@/config/bandsCatalog";
import { shuffledBandMusicUrls } from "@/audio/useShellBandMusic";

const sampleBand: BandCatalogEntry = {
  id: "test-band",
  display_name: "Test Band",
  asset_root: "audio/bands/test_band",
  music_files: ["music/a.ogg", "music/b.ogg", "music/c.ogg", "music/d.ogg"],
  interlude_files: [],
};

describe("shuffledBandMusicUrls", () => {
  it("builds a full shuffled queue from the band's music files", () => {
    const queue = shuffledBandMusicUrls(sampleBand, () => 0);

    expect(queue).toHaveLength(sampleBand.music_files.length);
    expect([...queue].sort()).toEqual(
      [
        "/audio/bands/test_band/music/a.ogg",
        "/audio/bands/test_band/music/b.ogg",
        "/audio/bands/test_band/music/c.ogg",
        "/audio/bands/test_band/music/d.ogg",
      ].sort(),
    );
  });

  it("uses runtime randomness so fresh loads can receive different orders", () => {
    const firstLoadQueue = shuffledBandMusicUrls(sampleBand, () => 0);
    const secondLoadQueue = shuffledBandMusicUrls(sampleBand, () => 0.99);

    expect(firstLoadQueue).not.toEqual(secondLoadQueue);
  });
});
