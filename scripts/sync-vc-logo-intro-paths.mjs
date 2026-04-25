/**
 * Regenerates `src/components/intro/vcLogoIntroPaths.ts` from
 * `public/images/logos/VC Logo - Color.svg`, measuring grey path lengths
 * with the browser (getTotalLength).
 *
 * Usage: node scripts/sync-vc-logo-intro-paths.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const svgPath = path.join(root, "public/images/logos/VC Logo - Color.svg");
const outPath = path.join(root, "src/components/intro/vcLogoIntroPaths.ts");

const xml = fs.readFileSync(svgPath, "utf8");

function paths(cls) {
  const re = new RegExp(`<path[^>]*class="${cls}"[^>]*d="([^"]+)"`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

const red = paths("cls-1");
const grey = paths("cls-2");

const browser = await chromium.launch();
const page = await browser.newPage();
const lengths = [];
for (const d of grey) {
  const esc = d.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  await page.setContent(`<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="${esc}" /></svg>`);
  const len = await page.$eval("#p", (el) => el.getTotalLength());
  lengths.push(Math.round(len * 100) / 100);
}
await browser.close();

const lines = [];
lines.push("/**");
lines.push(" * Paths from `public/images/logos/VC Logo - Color.svg` (Full Color export).");
lines.push(" * `strokeLen` on grey paths: SVGGeometryElement.getTotalLength() from `scripts/sync-vc-logo-intro-paths.mjs`.");
lines.push(" */");
lines.push('export const VC_LOGO_INTRO_VIEWBOX = "0 0 241.3 165.6" as const;');
lines.push("");
lines.push("export const vcLogoRedPaths: readonly { id: string; d: string }[] = [");
for (let i = 0; i < red.length; i++) {
  lines.push(`  { id: "official-red-${i + 1}", d: ${JSON.stringify(red[i])} },`);
}
lines.push("] as const;");
lines.push("");
lines.push("export const vcLogoGreyPaths: readonly { id: string; d: string; strokeLen: number }[] = [");
for (let i = 0; i < grey.length; i++) {
  lines.push(`  { id: "official-grey-${i + 1}", d: ${JSON.stringify(grey[i])}, strokeLen: ${lengths[i]} },`);
}
lines.push("] as const;");
lines.push("");
lines.push("export const VC_LOGO_GREY_LETTER_COUNT = vcLogoGreyPaths.length;");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"));
console.log("Wrote", path.relative(root, outPath));
console.log(red.length, "red paths,", grey.length, "grey paths, lengths:", lengths.join(", "));
