import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { VC_LOGO_INTRO_VIEWBOX, vcLogoGreyPaths, vcLogoRedPaths } from "./vcLogoIntroPaths";

/** Match `VC Logo - Color.svg` (.cls-1 / .cls-2). */
const RED_FILL = "#c0272d";
const GREY_STROKE = "#808080";
const GREY_FILL = "#808080";
const STROKE_W = 2;

const BASE_W = 420;
const ASPECT = 165.6 / 241.3;

type VcLogoIntroMarkProps = {
  /** Scales base width (420px). */
  scale?: number;
  /** Zoom-out duration; grey letters draw sequentially inside this window. */
  zoomDurationSec: number;
  letterDrawSec: number;
  easing: readonly [number, number, number, number];
};

export function VcLogoIntroMark({ scale = 1, zoomDurationSec, letterDrawSec, easing }: VcLogoIntroMarkProps) {
  const filterId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const zoomFrom = 2.35;
  const zoomTo = 1;
  const w = BASE_W * scale;
  const h = Math.round(ASPECT * BASE_W * scale);

  const svg = (
    <svg
      viewBox={VC_LOGO_INTRO_VIEWBOX}
      width={w}
      height={h}
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <title>Villains Club</title>
      <defs>
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill={RED_FILL} filter={reduceMotion ? undefined : `url(#${filterId})`}>
        {vcLogoRedPaths.map((p) => (
          <path key={p.id} d={p.d} />
        ))}
      </g>
      <g
        fill={reduceMotion ? GREY_FILL : "none"}
        stroke={reduceMotion ? "none" : GREY_STROKE}
        strokeWidth={reduceMotion ? 0 : STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {reduceMotion
          ? vcLogoGreyPaths.map((p) => <path key={p.id} d={p.d} />)
          : vcLogoGreyPaths.map((p, i) => {
              const dash = p.strokeLen;
              const startDelay = i * letterDrawSec;
              return (
                <motion.path
                  key={p.id}
                  d={p.d}
                  strokeDasharray={dash}
                  initial={{ strokeDashoffset: dash, opacity: 0.75 }}
                  animate={{ strokeDashoffset: 0, opacity: 1 }}
                  transition={{
                    strokeDashoffset: { duration: letterDrawSec, ease: easing, delay: startDelay },
                    opacity: { duration: 0.2, delay: startDelay },
                  }}
                />
              );
            })}
      </g>
    </svg>
  );

  if (reduceMotion) {
    return svg;
  }

  return (
    <motion.div
      style={{ transformOrigin: "50% 50%", willChange: "transform" }}
      initial={{ scale: zoomFrom }}
      animate={{ scale: zoomTo }}
      transition={{ duration: zoomDurationSec, ease: easing }}
    >
      {svg}
    </motion.div>
  );
}
