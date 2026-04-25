/**
 * Regenerates `src/components/intro/vcLogoIntroPaths.ts` from
 * `public/images/logos/VC Logo - Color.svg`, measuring grey path bboxes
 * (userSpaceOnUse clip / reveal) with the browser.
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
/** top (min-y) and bottom (max-y) of each grey path in viewBox coords */
const bboxes = [];
for (const d of grey) {
  const esc = d.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  await page.setContent(`<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 241.3 165.6"><path id="p" d="${esc}" fill="gray" /></svg>`);
  const box = await page.$eval("#p", (el) => {
    const b = el.getBBox();
    return { y: b.y, y2: b.y + b.height };
  });
  const y0 = Math.round(box.y * 1000) / 1000;
  const y1 = Math.round(box.y2 * 1000) / 1000;
  bboxes.push({ clipY0: y0, clipY1: y1 });
}
await browser.close();

const lines = [];
lines.push("/**");
lines.push(" * Paths from `public/images/logos/VC Logo - Color.svg` (Full Color export).");
lines.push(" * `clipY0` / `clipY1`: grey path bbox top / bottom (user space) for bottom→top reveal — `scripts/sync-vc-logo-intro-paths.mjs`.");
lines.push(" */");
lines.push('export const VC_LOGO_INTRO_VIEWBOX = "0 0 241.3 165.6" as const;');
lines.push("");
lines.push("export const vcLogoRedPaths: readonly { id: string; d: string }[] = [");
for (let i = 0; i < red.length; i++) {
  lines.push(`  { id: "official-red-${i + 1}", d: ${JSON.stringify(red[i])} },`);
}
lines.push("] as const;");
lines.push("");
lines.push("export const vcLogoGreyPaths: readonly { id: string; d: string; clipY0: number; clipY1: number }[] = [");
for (let i = 0; i < grey.length; i++) {
  const { clipY0, clipY1 } = bboxes[i];
  lines.push(`  { id: "official-grey-${i + 1}", d: ${JSON.stringify(grey[i])}, clipY0: ${clipY0}, clipY1: ${clipY1} },`);
}
lines.push("] as const;");
lines.push("");
lines.push("export const VC_LOGO_GREY_LETTER_COUNT = vcLogoGreyPaths.length;");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"));
console.log("Wrote", path.relative(root, outPath));
console.log(red.length, "red,", grey.length, "grey");
