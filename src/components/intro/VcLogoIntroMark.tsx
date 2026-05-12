import { animate } from "framer-motion";
import { useId, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { VC_LOGO_INTRO_VIEWBOX, vcLogoGreyPaths, vcLogoRedPaths } from "./vcLogoIntroPaths";

/** Match `VC Logo - Color.svg` (.cls-1 / .cls-2). */
const RED_FILL = "#c0272d";
const GREY_FILL = "#808080";

const BASE_W = 420;
const ASPECT = 165.6 / 241.3;

type RedPhase = "outline" | "neon" | "settle" | "done";

type VcLogoIntroMarkProps = {
  scale?: number;
  /** Outer zoom duration while grey letters reveal (after {@link greyRevealDelaySec}). */
  zoomDurationSec: number;
  letterDrawSec: number;
  easing: readonly [number, number, number, number];
  /** Seconds before grey letter reveals begin (red draw + neon + glow fade). */
  greyRevealDelaySec: number;
  introRedDrawSec: number;
  introRedNeonSec: number;
  introRedGlowFadeSec: number;
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

export function VcLogoIntroMark({
  scale = 1,
  zoomDurationSec,
  letterDrawSec,
  easing,
  greyRevealDelaySec,
  introRedDrawSec,
  introRedNeonSec,
  introRedGlowFadeSec,
}: VcLogoIntroMarkProps) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const zoomFrom = 1.22;
  const zoomTo = 1;
  const w = BASE_W * scale;
  const h = Math.round(ASPECT * BASE_W * scale);
  const letterStepSec = letterDrawSec * 0.78;

  const [redPhase, setRedPhase] = useState<RedPhase>("outline");

  useLayoutEffect(() => {
    if (reduceMotion) setRedPhase("done");
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const tNeon = window.setTimeout(() => setRedPhase("neon"), introRedDrawSec * 1000);
    const tSettle = window.setTimeout(() => setRedPhase("settle"), (introRedDrawSec + introRedNeonSec) * 1000);
    const tDone = window.setTimeout(
      () => setRedPhase("done"),
      (introRedDrawSec + introRedNeonSec + introRedGlowFadeSec) * 1000,
    );
    return () => {
      window.clearTimeout(tNeon);
      window.clearTimeout(tSettle);
      window.clearTimeout(tDone);
    };
  }, [introRedDrawSec, introRedNeonSec, introRedGlowFadeSec, reduceMotion]);

  const redZoomDurSec = introRedDrawSec + introRedNeonSec;

  const wrapStyle = {
    ["--vc-red-draw" as string]: `${introRedDrawSec}s`,
    ["--vc-red-neon" as string]: `${introRedNeonSec}s`,
    ["--vc-red-glow-fade" as string]: `${introRedGlowFadeSec}s`,
    ["--vc-red-zoom-dur" as string]: `${redZoomDurSec}s`,
  } as CSSProperties;

  const wrapClass = `shell-intro-vc-logo-wrap shell-intro-red-phase-${redPhase}`;

  const svg = (
    <svg viewBox={VC_LOGO_INTRO_VIEWBOX} width={w} height={h} aria-hidden style={{ display: "block", overflow: "visible" }}>
      <title>Villains Club</title>
      <defs>
        {!reduceMotion &&
          vcLogoGreyPaths.map((p, i) => (
            <GreyBottomToTopGradient
              key={p.id}
              gradientId={`${uid}-grey-grad-${i}`}
              clipY0={p.clipY0}
              clipY1={p.clipY1}
              delaySec={greyRevealDelaySec + i * letterStepSec}
              durationSec={letterDrawSec}
              easing={easing}
            />
          ))}
      </defs>
      {reduceMotion ? (
        <g fill={RED_FILL}>
          {vcLogoRedPaths.map((p) => (
            <path key={p.id} d={p.d} />
          ))}
        </g>
      ) : (
        <g className="shell-intro-vc-red-cluster">
          <g className="shell-intro-vc-red-stroke" aria-hidden>
            {vcLogoRedPaths.map((p) => (
              <path key={`s-${p.id}`} d={p.d} />
            ))}
          </g>
          <g className="shell-intro-vc-red-fill">
            {vcLogoRedPaths.map((p) => (
              <path key={`f-${p.id}`} d={p.d} />
            ))}
          </g>
        </g>
      )}
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
                    delay: greyRevealDelaySec + i * letterStepSec,
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
    return (
      <div className="shell-intro-vc-logo-wrap shell-intro-red-phase-done" data-vc-red-static="true" style={wrapStyle}>
        {svg}
      </div>
    );
  }

  return (
    <motion.div
      style={{ transformOrigin: "50% 50%", willChange: "transform" }}
      initial={{ scale: zoomFrom }}
      animate={{ scale: zoomTo }}
      transition={{ delay: greyRevealDelaySec, duration: zoomDurationSec, ease: easing }}
    >
      <div className={wrapClass} style={wrapStyle}>
        {svg}
      </div>
    </motion.div>
  );
}
