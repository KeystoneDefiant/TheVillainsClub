import { animate } from "framer-motion";
import { useId, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { VC_LOGO_INTRO_VIEWBOX, vcLogoGreyPaths, vcLogoRedPaths } from "./vcLogoIntroPaths";

/** Match `VC Logo - Color.svg` (.cls-1 / .cls-2). */
const RED_FILL = "#c0272d";
const GREY_FILL = "#808080";

const BASE_W = 420;
const ASPECT = 165.6 / 241.3;

type VcLogoIntroMarkProps = {
  scale?: number;
  zoomDurationSec: number;
  letterDrawSec: number;
  easing: readonly [number, number, number, number];
};

type GreyBottomToTopGradientProps = {
  gradientId: string;
  clipY0: number;
  clipY1: number;
  delaySec: number;
  durationSec: number;
  easing: readonly [number, number, number, number];
};

/**
 * Linear gradient along letter height: opaque at bottom, transparent at top.
 * Animates the boundary between opaque and transparent bottom → top.
 */
function GreyBottomToTopGradient({
  gradientId,
  clipY0,
  clipY1,
  delaySec,
  durationSec,
  easing,
}: GreyBottomToTopGradientProps) {
  const boundaryLo = useRef<SVGStopElement>(null);
  const boundaryHi = useRef<SVGStopElement>(null);

  useEffect(() => {
    const lo = boundaryLo.current;
    const hi = boundaryHi.current;
    if (!lo || !hi) return;

    const apply = (t: number) => {
      const pct = Math.min(100, Math.max(-3, t * 103 - 3));
      const p = `${pct.toFixed(2)}%`;
      lo.setAttribute("offset", p);
      hi.setAttribute("offset", p);
    };
    apply(0);

    const controls = animate(0, 1, {
      delay: delaySec,
      duration: durationSec,
      ease: easing,
      onUpdate: apply,
    });
    return () => controls.stop();
  }, [delaySec, durationSec, easing]);

  return (
    <linearGradient
      id={gradientId}
      gradientUnits="userSpaceOnUse"
      x1={0}
      x2={0}
      y1={clipY1}
      y2={clipY0}
    >
      <stop offset="-3%" stopColor={GREY_FILL} stopOpacity={1} />
      <stop ref={boundaryLo} offset="0%" stopColor={GREY_FILL} stopOpacity={1} />
      <stop ref={boundaryHi} offset="0%" stopColor={GREY_FILL} stopOpacity={0} />
      <stop offset="100%" stopColor={GREY_FILL} stopOpacity={0} />
    </linearGradient>
  );
}

export function VcLogoIntroMark({ scale = 1, zoomDurationSec, letterDrawSec, easing }: VcLogoIntroMarkProps) {
  const uid = useId().replace(/:/g, "");
  const filterId = `vcred-${uid}`;
  const reduceMotion = useReducedMotion();
  const zoomFrom = 2.35;
  const zoomTo = 1;
  const w = BASE_W * scale;
  const h = Math.round(ASPECT * BASE_W * scale);
  const letterStepSec = letterDrawSec * 0.78;

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
        {!reduceMotion &&
          vcLogoGreyPaths.map((p, i) => (
            <GreyBottomToTopGradient
              key={p.id}
              gradientId={`${uid}-grey-grad-${i}`}
              clipY0={p.clipY0}
              clipY1={p.clipY1}
              delaySec={i * letterStepSec}
              durationSec={letterDrawSec}
              easing={easing}
            />
          ))}
      </defs>
      <g fill={RED_FILL} filter={reduceMotion ? undefined : `url(#${filterId})`}>
        {vcLogoRedPaths.map((p) => (
          <path key={p.id} d={p.d} />
        ))}
      </g>
      <g>
        {vcLogoGreyPaths.map((p, i) => (
          <motion.path
            key={p.id}
            d={p.d}
            fill={reduceMotion ? GREY_FILL : `url(#${uid}-grey-grad-${i})`}
            initial={reduceMotion ? false : { opacity: 0, y: 3, filter: "blur(1.2px)" }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={
              reduceMotion
                ? undefined
                : {
                    delay: i * letterStepSec,
                    duration: letterDrawSec * 0.85,
                    ease: easing,
                  }
            }
          />
        ))}
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
