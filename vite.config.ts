import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE?.trim() || "./";

/** Canonical house-band MP3s; copied into `dist/audio/bands` on build and served from disk in dev. */
const CONTENT_BANDS_ROOT_ABS = path.resolve(__dirname, "content/audio/bands");

function normalizeViteBase(basePath: string): string {
  const t = basePath.trim().replace(/\\/g, "/");
  if (t === "" || t === "/" || t === "." || t === "./") return "";
  const withSlash = t.startsWith("/") ? t : `/${t}`;
  return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

/**
 * Relative path inside `audio/bands/` after stripping Vite `base`, or null if this request isn't house-band audio.
 */
function houseBandTailFromReqUrl(rawUrl: string | undefined, viteBase: string): string | null {
  if (!rawUrl) return null;
  const rawPath = rawUrl.split("?")[0] ?? "";
  let pathname: string;
  try {
    pathname = decodeURIComponent(rawPath.replace(/\\/g, "/"));
  } catch {
    return null;
  }
  const b = normalizeViteBase(viteBase);
  if (b !== "" && (pathname === b || pathname.startsWith(`${b}/`))) {
    pathname = pathname === b ? "/" : pathname.slice(b.length);
  }
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefix = `/audio/bands`;
  if (p === prefix) return "";
  if (p.startsWith(`${prefix}/`)) return p.slice(prefix.length).replace(/^\/+/, "");
  return null;
}

function resolvedBandMp3(bandsRootAbs: string, tail: string): string | null {
  const parts = tail.split("/").filter((p) => p !== "" && p !== ".");
  if (parts.some((p) => p === "..")) return null;
  const resolved = path.resolve(bandsRootAbs, ...parts);
  const rootWithSep = bandsRootAbs.endsWith(path.sep) ? bandsRootAbs : `${bandsRootAbs}${path.sep}`;
  if (resolved !== bandsRootAbs && !resolved.startsWith(rootWithSep)) return null;
  if (!resolved.toLowerCase().endsWith(".mp3")) return null;
  return resolved;
}

function houseBandAudioFromContent(CONTENT_BANDS_ROOT: string): Plugin {
  let outDirAbs = "";

  return {
    name: "house-band-audio-from-content",
    configureServer(server) {
      const viteBase = server.config.base;
      server.middlewares.use((req, res, next) => {
        const tail = houseBandTailFromReqUrl(req.url, viteBase);
        if (tail === null) {
          next();
          return;
        }
        const filePath = resolvedBandMp3(CONTENT_BANDS_ROOT, tail);
        if (!filePath) {
          next();
          return;
        }
        const method = req.method;
        fs.stat(filePath, (err, st) => {
          if (err || !st.isFile()) {
            next();
            return;
          }
          if (method !== "GET" && method !== "HEAD") {
            next();
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "audio/mpeg");
          if (method === "HEAD") {
            res.end();
            return;
          }
          const stream = fs.createReadStream(filePath);
          stream.on("error", () => {
            stream.destroy();
            next();
          });
          stream.pipe(res);
        });
      });
    },
    configResolved(cfg) {
      outDirAbs = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      if (!outDirAbs) return;
      if (!fs.existsSync(CONTENT_BANDS_ROOT)) return;
      const destAbs = path.join(outDirAbs, "audio/bands");
      fs.mkdirSync(path.dirname(destAbs), { recursive: true });
      fs.cpSync(CONTENT_BANDS_ROOT, destAbs, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), houseBandAudioFromContent(CONTENT_BANDS_ROOT_ABS)],
  base,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
