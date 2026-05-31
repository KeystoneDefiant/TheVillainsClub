import { useMemo } from "react";
import type { StatEntry } from "@/game/sessionSettlement";
import "./StatsTicker.css";

type StatsTickerProps = {
  stats: ReadonlyArray<StatEntry>;
  /** When true the ticker is static (no scroll animation). */
  reduceMotion?: boolean;
  /** Scroll duration in seconds. Longer = slower. Defaults to 18s for ~4 items. */
  durationSeconds?: number;
};

/**
 * Horizontally scrolling ticker that displays game statistics after settlement.
 *
 * - Motion allowed: items scroll left in a seamless marquee loop (CSS animation).
 * - prefers-reduced-motion / `reduceMotion` prop: renders as a static two-column grid.
 * - The item list is duplicated internally so the animation loops without a jump.
 */
export function StatsTicker({ stats, reduceMotion = false, durationSeconds }: StatsTickerProps) {
  // Scale duration by item count so a longer list doesn't whip by too fast.
  const dur = useMemo(() => {
    if (durationSeconds !== undefined) return durationSeconds;
    return Math.max(10, stats.length * 4.5);
  }, [stats.length, durationSeconds]);

  if (stats.length === 0) return null;

  if (reduceMotion) {
    return (
      <div className="stats-ticker stats-ticker--static" aria-label="Session statistics">
        <div className="stats-ticker__track-wrap">
          <div className="stats-ticker__track">
            {stats.map((s, i) => (
              <div key={i} className="stats-ticker__item">
                <span className="stats-ticker__label">{s.label}</span>
                <span className="stats-ticker__value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-ticker" aria-label="Session statistics">
      <div className="stats-ticker__track-wrap">
        {/*
         * Two copies of the track. The animation moves the whole element by −50%,
         * which equals exactly one copy width, so the loop is seamless.
         */}
        <div
          className="stats-ticker__track"
          style={{ "--ticker-duration": `${dur}s` } as React.CSSProperties}
          aria-hidden="false"
        >
          {/* First copy */}
          {stats.map((s, i) => (
            <span key={`a-${i}`} className="stats-ticker__item">
              <span className="stats-ticker__label">{s.label}</span>
              <span className="stats-ticker__value">{s.value}</span>
              {i < stats.length - 1 && <span className="stats-ticker__sep" aria-hidden="true">·</span>}
            </span>
          ))}
          {/* Separator between copies */}
          <span className="stats-ticker__sep" aria-hidden="true">·</span>
          {/* Duplicate copy for seamless loop */}
          {stats.map((s, i) => (
            <span key={`b-${i}`} className="stats-ticker__item" aria-hidden="true">
              <span className="stats-ticker__label">{s.label}</span>
              <span className="stats-ticker__value">{s.value}</span>
              {i < stats.length - 1 && <span className="stats-ticker__sep" aria-hidden="true">·</span>}
            </span>
          ))}
          <span className="stats-ticker__sep" aria-hidden="true">·</span>
        </div>
      </div>
    </div>
  );
}
