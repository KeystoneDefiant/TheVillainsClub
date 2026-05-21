import React from "react";
import { FatesealSymbolId } from "@/config/minigames/fatesealRules";

interface FatesealSymbolIconProps {
  symbol: FatesealSymbolId;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function FatesealSymbolIcon({
  symbol,
  size = "100%",
  className,
  style,
}: FatesealSymbolIconProps) {
  // outer sketchy circles
  const renderOuterCircles = () => (
    <>
      {/* Main outer circle */}
      <circle
        cx="50"
        cy="50"
        r="43"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        opacity="0.85"
      />
      {/* Sketchy overlapping circle: slightly offset center and size to simulate a hand-drawn stroke */}
      <circle
        cx="49.7"
        cy="50.3"
        r="42.6"
        stroke="currentColor"
        strokeWidth="1.0"
        fill="none"
        opacity="0.5"
      />
      {/* Outer dotted/dashed decorative circle */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
        strokeDasharray="3 5"
      />
      {/* Inner faint circle */}
      <circle
        cx="50"
        cy="50"
        r="39"
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.25"
      />
    </>
  );

  const renderInnerGlyph = () => {
    switch (symbol) {
      case "dagger":
        return (
          <>
            {/* Triangular blade */}
            <path
              d="M 50,75 L 43,44 L 57,44 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.08"
            />
            {/* Center blade ridge */}
            <path d="M 50,44 L 50,72" stroke="currentColor" strokeWidth="1.2" />
            {/* Crossguard */}
            <path d="M 35,44 L 65,44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 35,42 L 35,46" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 65,42 L 65,46" stroke="currentColor" strokeWidth="1.5" />
            {/* Hilt / grip */}
            <path d="M 50,44 L 50,26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 45,34 L 55,34" stroke="currentColor" strokeWidth="1.5" />
            {/* Pommel */}
            <circle cx="50" cy="22" r="3.5" stroke="currentColor" strokeWidth="2" fill="currentColor" />
            {/* Small accent dots beside blade */}
            <circle cx="37" cy="56" r="1.5" fill="currentColor" />
            <circle cx="63" cy="56" r="1.5" fill="currentColor" />
          </>
        );

      case "chalice":
        return (
          <>
            {/* Bowl Rim */}
            <path
              d="M 30,26 C 30,26 40,29 50,29 C 60,29 70,26 70,26"
              stroke="currentColor"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Bowl Body */}
            <path
              d="M 30,26 C 30,48 38,54 50,54 C 62,54 70,48 70,26"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            {/* Liquid Level line */}
            <path d="M 32,34 C 32,34 42,37 50,37 C 58,37 68,34 68,34" stroke="currentColor" strokeWidth="1" opacity="0.75" />
            {/* Stem */}
            <path d="M 50,54 L 50,72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* Stem knop/knot */}
            <path d="M 44,63 C 44,63 47,65 50,65 C 53,65 56,63 56,63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Base */}
            <path
              d="M 34,74 C 34,74 42,71 50,71 C 58,71 66,74 66,74 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.15"
              strokeLinejoin="round"
            />
            {/* Hovering crescent of energy above chalice */}
            <path d="M 44,18 A 6,6 0 0,0 56,18 A 8,8 0 0,1 44,18 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
          </>
        );

      case "goat":
        return (
          <>
            {/* Inverted background pentagram, very faint */}
            <path
              d="M 50,76 L 68,39 L 28,52 L 72,52 L 32,39 Z"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
              opacity="0.18"
            />
            {/* Snout/skull triangle */}
            <path
              d="M 43,42 L 57,42 L 50,68 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            {/* Left Horn */}
            <path
              d="M 45,41 C 30,22 25,32 41,43"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 40,36 C 28,21 22,29 34,38"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              opacity="0.75"
            />
            {/* Right Horn */}
            <path
              d="M 55,41 C 70,22 75,32 59,43"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 60,36 C 72,21 78,29 66,38"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              opacity="0.75"
            />
            {/* Left Ear */}
            <path d="M 39,43 C 22,48 32,54 39,43 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            {/* Right Ear */}
            <path d="M 61,43 C 78,48 68,54 61,43 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            {/* Occult forehead third eye orb */}
            <circle cx="50" cy="33" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
          </>
        );

      case "eye":
        return (
          <>
            {/* Eye shapes */}
            <path
              d="M 23,50 C 35,28 65,28 77,50 C 65,72 35,72 23,50 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            {/* Iris */}
            <circle cx="50" cy="50" r="11" stroke="currentColor" strokeWidth="1.8" fill="none" />
            {/* Pupil */}
            <circle cx="50" cy="50" r="4.5" fill="currentColor" />
            {/* Illuminating Rays */}
            <path d="M 50,23 L 50,14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 50,77 L 50,86" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 21,50 L 14,50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 79,50 L 86,50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 31,31 L 23,23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 69,31 L 77,23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 31,69 L 23,77" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 69,69 L 77,77" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Planetary beads on ray ends */}
            <circle cx="50" cy="11" r="2" fill="currentColor" />
            <circle cx="50" cy="89" r="2" fill="currentColor" />
            <circle cx="11" cy="50" r="2" fill="currentColor" />
            <circle cx="89" cy="50" r="2" fill="currentColor" />
          </>
        );

      case "serpent":
        return (
          <>
            {/* Coiled body (stylized S-curve lemniscate vibe) */}
            <path
              d="M 50,18 C 30,18 28,36 47,46 C 66,57 62,78 47,78 C 31,78 31,68 36,60"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Parallel outline path to create sketchy scale-like depth */}
            <path
              d="M 50,21 C 33,21 31,37 48,48 C 68,59 64,75 47,75 C 34,75 34,66 38,60"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              opacity="0.75"
            />
            {/* Serpent Head */}
            <path d="M 50,18 L 46,24 L 54,23 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
            <circle cx="48" cy="21" r="0.8" fill="currentColor" />
            <circle cx="52" cy="20.5" r="0.8" fill="currentColor" />
            {/* Rattle/pointed tail tip */}
            <path d="M 36,60 L 32,54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="31" cy="52" r="1.5" fill="currentColor" />
          </>
        );

      case "moon":
        return (
          <>
            {/* Full Moon Center */}
            <circle
              cx="50"
              cy="50"
              r="15"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
            />
            {/* Tiny alchemical cross inside full moon */}
            <path d="M 50,43 L 50,57 M 43,50 L 57,50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            {/* Left Waxing Crescent */}
            <path
              d="M 31,29 C 20,35 20,65 31,71 C 25,64 25,36 31,29 Z"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="currentColor"
              fillOpacity="0.12"
              strokeLinejoin="round"
            />
            {/* Right Waning Crescent */}
            <path
              d="M 69,29 C 80,35 80,65 69,71 C 75,64 75,36 69,29 Z"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="currentColor"
              fillOpacity="0.12"
              strokeLinejoin="round"
            />
            {/* Occult stars above/below */}
            <polygon points="50,12 51.5,15 54.5,15.5 52,17.5 52.5,20.5 50,18.5 47.5,20.5 48,17.5 45.5,15.5 48.5,15" fill="currentColor" transform="scale(0.85) translate(8.8, 4)" />
            <polygon points="50,80 51.5,83 54.5,83.5 52,85.5 52.5,88.5 50,86.5 47.5,88.5 48,85.5 45.5,83.5 48.5,83" fill="currentColor" transform="scale(0.85) translate(8.8, 12)" />
          </>
        );

      case "flame":
        return (
          <>
            {/* Alchemical fire triangle, dotted */}
            <path
              d="M 50,21 L 73,65 L 27,65 Z"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 3"
              fill="none"
              opacity="0.35"
            />
            {/* Licking flame paths */}
            <path
              d="M 28,65 C 38,55 38,44 50,15 C 62,44 62,55 72,65 C 62,68 38,68 28,65 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            {/* Center flame core */}
            <path
              d="M 50,15 Q 53,32 50,48 Q 47,32 50,15 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              fillOpacity="0.15"
            />
            {/* Side flame waves */}
            <path d="M 37,45 C 44,41 50,48 50,48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 63,45 C 56,41 50,48 50,48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        );

      case "key":
        return (
          <>
            {/* Bow handle (gothic diamond clover) */}
            <path
              d="M 50,16 L 39,27 L 50,38 L 61,27 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="27" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            {/* Shaft */}
            <path d="M 50,38 L 50,78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* Collar ridges */}
            <path d="M 45,43 L 55,43" stroke="currentColor" strokeWidth="1.8" />
            {/* Bit teeth */}
            <path
              d="M 50,58 L 65,58 L 65,65 L 58,65 L 58,68 L 65,68 L 65,75 L 50,75"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Tip pommel */}
            <path d="M 46,78 L 54,78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case "wild":
        return (
          <>
            {/* Central Sigil Sphere */}
            <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.8" fill="none" />
            {/* 'W' alchemical symbol inside */}
            <path d="M 44,46 L 47,54 L 50,48 L 53,54 L 56,46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* 8-pointed star main points */}
            <path
              d="M 50,17 L 54,39 L 76,39 L 58,52 L 66,74 L 50,60 L 34,74 L 42,52 L 24,39 L 46,39 Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
            />
            {/* Outer flare lines */}
            <path d="M 50,17 L 50,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 50,83 L 50,90" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 17,50 L 10,50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 83,50 L 90,50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Diagonal flare lines */}
            <path d="M 33,33 L 26,26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 67,33 L 74,26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 33,67 L 26,74" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 67,67 L 74,74" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        );

      case "scatter":
        return (
          <>
            {/* Astrolabe circular boundary */}
            <circle cx="50" cy="50" r="33" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.05" />
            <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
            {/* Crossroads Cardinal Axis */}
            <path d="M 50,9 L 50,91" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 3 2 3" />
            <path d="M 9,50 L 91,50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 3 2 3" />
            {/* Diagonal pointer dots */}
            <circle cx="34" cy="34" r="1.5" fill="currentColor" />
            <circle cx="66" cy="34" r="1.5" fill="currentColor" />
            <circle cx="34" cy="66" r="1.5" fill="currentColor" />
            <circle cx="66" cy="66" r="1.5" fill="currentColor" />
            {/* Cardinal arrowheads */}
            <polygon points="50,6 46,12 54,12" fill="currentColor" />
            <polygon points="50,94 46,88 54,88" fill="currentColor" />
            <polygon points="6,50 12,46 12,54" fill="currentColor" />
            <polygon points="94,50 88,46 88,54" fill="currentColor" />
            {/* Central Portal Vortex / Hourglass */}
            <path d="M 43,41 H 57 L 43,59 H 57 Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
          </>
        );

      case "void":
        return (
          <>
            {/* Fractured outer circle path (has two visual splits) */}
            <path
              d="M 48,10 A 40,40 0 0,0 48,90"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 52,10 A 40,40 0 0,1 52,90"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* The diagonal void slash (null ∅ look) */}
            <path d="M 22,78 L 78,22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* Central spiraling vortex */}
            <path
              d="M 50,50 Q 52,48 50,46 Q 46,46 47,52 Q 52,55 54,48 Q 50,41 44,45 Q 41,54 50,57 Q 60,54 58,42 Q 50,33 40,40 Q 33,52 46,62 Q 62,60 62,45"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Small crack details */}
            <path d="M 27,27 L 33,33" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <path d="M 73,73 L 67,67" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{
        ...style,
        display: "block",
        overflow: "visible",
      }}
      aria-label={`${symbol} icon`}
      role="img"
    >
      {renderOuterCircles()}
      {renderInnerGlyph()}
    </svg>
  );
}
