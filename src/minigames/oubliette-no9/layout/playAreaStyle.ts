import type { CSSProperties } from "react";

/**
 * Outer wrapper for in-run Oubliette screens: full viewport height, safe-area padding,
 * vertical scroll on short viewports (avoids clipping), horizontal clip only.
 */
export const oubliettePlayAreaStyle: CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
  paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
  paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
  position: "relative",
  overflowX: "hidden",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  userSelect: "none",
};
