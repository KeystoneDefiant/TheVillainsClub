import type { CSSProperties } from "react";

/**
 * Outer wrapper for in-run Oubliette screens: viewport-sized with safe-area padding.
 * Content should fit when practical, but mobile must be able to scroll when it cannot.
 */
export const oubliettePlayAreaStyle: CSSProperties = {
  height: "100dvh",
  minHeight: 0,
  boxSizing: "border-box",
  paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
  paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
  paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
  position: "relative",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  userSelect: "none",
};
