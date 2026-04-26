import bandsJson from "../../content/bands.json";

export type BandCatalogEntry = {
  id: string;
  display_name: string;
  asset_root: string;
  music_files: string[];
  interlude_files: string[];
};

export type BandsCatalog = {
  interlude_chance_between_tracks: number;
  bands: BandCatalogEntry[];
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function parseCatalog(raw: unknown): BandsCatalog {
  if (typeof raw !== "object" || raw === null) throw new Error("bands.json: expected object");
  const o = raw as Record<string, unknown>;
  const chance = o.interlude_chance_between_tracks;
  if (typeof chance !== "number" || Number.isNaN(chance) || chance < 0 || chance > 1) {
    throw new Error("bands.json: interlude_chance_between_tracks must be a number in [0, 1]");
  }
  if (!Array.isArray(o.bands) || o.bands.length < 1) {
    throw new Error("bands.json: bands must be a non-empty array");
  }
  const bands: BandCatalogEntry[] = o.bands.map((b, i) => {
    if (typeof b !== "object" || b === null) throw new Error(`bands.json: band[${i}] invalid`);
    const e = b as Record<string, unknown>;
    if (!isNonEmptyString(e.id)) throw new Error(`bands.json: band[${i}].id`);
    if (!isNonEmptyString(e.display_name)) throw new Error(`bands.json: band[${i}].display_name`);
    if (!isNonEmptyString(e.asset_root)) throw new Error(`bands.json: band[${i}].asset_root`);
    if (!Array.isArray(e.music_files) || e.music_files.length < 1 || !e.music_files.every(isNonEmptyString)) {
      throw new Error(`bands.json: band[${i}].music_files`);
    }
    const interlude_files = Array.isArray(e.interlude_files)
      ? e.interlude_files.filter(isNonEmptyString)
      : [];
    return {
      id: e.id,
      display_name: e.display_name,
      asset_root: e.asset_root,
      music_files: e.music_files,
      interlude_files,
    };
  });
  return { interlude_chance_between_tracks: chance, bands };
}

/** Validated house band manifest (`content/bands.json`). */
export const bandsCatalog: BandsCatalog = parseCatalog(bandsJson);

/**
 * Path prefix for static assets (matches Vite `base` / `import.meta.env.BASE_URL`).
 * Uses a root-absolute path so URLs stay correct on nested routes (e.g. GitHub Pages `/repo/menu`).
 */
export function siteAssetPathPrefixFromViteBase(viteBaseUrl: string): string {
  const raw = viteBaseUrl.trim();
  if (!raw || raw === "/" || raw === "./") return "";
  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed === "." || trimmed === "") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Public URL for a file under the band's `asset_root`.
 *
 * - **http(s):** root-absolute path so nested SPA routes (e.g. GitHub Pages `/repo/menu`) still hit
 *   `/repo/audio/bands/...` instead of losing the repo segment.
 * - **file:** (Electron `loadFile` dist): use a path **relative to `index.html`** so `audio/...` resolves
 *   under `dist/`; a leading `/` would map to the filesystem root on Windows.
 */
export function bandAssetPublicPath(
  band: BandCatalogEntry,
  relativePath: string,
  viteBaseUrl: string,
  pageProtocol?: string,
): string {
  const root = band.asset_root.replace(/^\/+|\/+$/g, "");
  const rel = relativePath.replace(/^\/+/, "");
  const pathFromDist = `${root}/${rel}`;

  if (pageProtocol === "file:") {
    return pathFromDist;
  }

  const prefix = siteAssetPathPrefixFromViteBase(viteBaseUrl);
  const joined = `${prefix}/${pathFromDist}`.replace(/\/{2,}/g, "/");
  return joined.startsWith("/") ? joined : `/${joined}`;
}

export function bandPublicUrl(band: BandCatalogEntry, relativePath: string): string {
  const protocol =
    typeof globalThis !== "undefined" && "location" in globalThis && globalThis.location
      ? globalThis.location.protocol
      : undefined;
  return bandAssetPublicPath(band, relativePath, import.meta.env.BASE_URL, protocol);
}

