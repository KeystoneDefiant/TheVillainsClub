/**
 * Block wordmark for the intro (viewBox 0 0 520 132).
 * Stroke-draw order: THE (3) → CLUB (4); red VILLAINS is filled center band.
 */
export const VC_LOGO_INTRO_VIEWBOX = "0 0 520 132" as const;

/** Filled paths — red logotype. */
export const vcLogoRedPaths: readonly { id: string; d: string }[] = [
  { id: "r-v", d: "M 56 108 L 84 44 L 112 108 L 100 108 L 84 58 L 68 108 Z" },
  { id: "r-i1", d: "M 120 44 L 132 44 L 132 108 L 120 108 Z" },
  { id: "r-l1", d: "M 140 44 L 152 44 L 152 96 L 184 96 L 184 108 L 140 108 Z" },
  { id: "r-l2", d: "M 192 44 L 204 44 L 204 96 L 236 96 L 236 108 L 192 108 Z" },
  { id: "r-a", d: "M 270 108 L 244 72 L 256 64 L 270 88 L 284 64 L 296 72 L 270 108 Z" },
  { id: "r-i2", d: "M 304 44 L 316 44 L 316 108 L 304 108 Z" },
  { id: "r-n", d: "M 324 108 L 324 44 L 336 44 L 372 96 L 372 44 L 384 44 L 384 108 L 372 108 L 336 56 L 336 108 Z" },
  {
    id: "r-s",
    d: "M 412 64 Q 424 44 448 52 Q 464 58 456 72 Q 452 80 432 84 Q 412 88 408 98 Q 404 112 424 118 Q 448 124 464 108 L 456 98 Q 440 108 426 104 Q 416 100 420 92 Q 424 84 444 80 Q 468 74 472 60 Q 478 40 452 32 Q 424 24 404 48 Z",
  },
] as const;

/** Grey letters — stroke draw-in; `strokeLen` ≈ getTotalLength() at authoring time. */
export const vcLogoGreyPaths: readonly { id: string; d: string; strokeLen: number }[] = [
  { id: "g-t", d: "M 244 12 L 276 12 M 260 12 L 260 30", strokeLen: 52 },
  { id: "g-h", d: "M 288 12 L 288 30 M 320 12 L 320 30 M 288 21 L 320 21", strokeLen: 96 },
  { id: "g-e", d: "M 332 12 L 332 30 M 332 12 L 358 12 M 332 21 L 352 21 M 332 30 L 358 30", strokeLen: 118 },
  { id: "g-c", d: "M 168 116 Q 152 108 152 92 Q 152 76 168 68", strokeLen: 72 },
  { id: "g-l", d: "M 188 68 L 188 116 L 216 116", strokeLen: 76 },
  { id: "g-u", d: "M 228 68 L 228 104 Q 228 116 244 116 Q 260 116 260 104 L 260 68", strokeLen: 108 },
  { id: "g-b", d: "M 272 68 L 272 116 M 272 68 L 296 68 Q 308 68 308 80 Q 308 92 296 92 L 272 92 M 296 92 Q 312 92 312 104 Q 312 116 296 116 L 272 116", strokeLen: 168 },
] as const;

export const VC_LOGO_GREY_LETTER_COUNT = vcLogoGreyPaths.length;
