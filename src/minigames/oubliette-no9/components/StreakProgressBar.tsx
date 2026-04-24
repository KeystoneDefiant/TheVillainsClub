import { useEffect, useState } from 'react';
import { StreakMultiplierConfig } from '../utils/streakCalculator';
import './StreakProgressBar.css';

interface StreakProgressBarProps {
  currentStreak: number;
  currentMultiplier: number;
  nextThreshold: number;
  progress: number; // 0-100 percentage
  lastHandScored: boolean | null; // null = initial, true = +1, false = -1
  config: StreakMultiplierConfig;
  /** 'thermometer' = vertical bar (default), 'horizontal-segments' = horizontal segment blocks */
  variant?: 'thermometer' | 'horizontal-segments';
}

/**
 * StreakProgressBar component
 * 
 * Displays real-time streak counter progress with animated feedback:
 * - Current streak multiplier badge
 * - Progress bar towards next threshold
 * - Green pulse when streak increases
 * - Red pulse when streak decreases
 * - Celebratory animation when reaching new tier
 * 
 * @example
 * <StreakProgressBar
 *   currentStreak={7}
 *   currentMultiplier={1.5}
 *   nextThreshold={10}
 *   progress={40}
 *   lastHandScored={true}
 *   config={gameConfig.streakMultiplier}
 * />
 */
const SEGMENT_COUNT = 10;

export function StreakProgressBar({
  currentStreak,
  currentMultiplier,
  nextThreshold,
  progress,
  lastHandScored,
  config,
  variant = 'thermometer',
}: StreakProgressBarProps) {
  const [pulseClass, setPulseClass] = useState('');
  const [celebrateNewTier, setCelebrateNewTier] = useState(false);

  // Trigger pulse animation when streak changes
  useEffect(() => {
    if (lastHandScored === true) {
      setPulseClass('pulse-green');
      
      // Check if we just reached a new threshold
      if (currentStreak >= config.baseThreshold && 
          (currentStreak - config.baseThreshold) % config.thresholdIncrement === 0) {
        setCelebrateNewTier(true);
        setTimeout(() => setCelebrateNewTier(false), 1000);
      }
    } else if (lastHandScored === false) {
      setPulseClass('pulse-red');
    }
    
    const timer = setTimeout(() => setPulseClass(''), 500);
    return () => clearTimeout(timer);
  }, [lastHandScored, currentStreak, config.baseThreshold, config.thresholdIncrement]);

  // Don't show if feature is disabled
  if (!config.enabled) {
    return null;
  }

  if (variant === 'horizontal-segments') {
    const filledCount = Math.round((progress / 100) * SEGMENT_COUNT);
    return (
      <div className="streak-segments">
        <div className="segments-multiplier-badge">{currentMultiplier.toFixed(1)}x</div>
        <div className="segments-bar">
          {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
            <div
              key={i}
              className={`segment-block ${i < filledCount ? 'segment-filled' : ''}`}
            />
          ))}
        </div>
        <div className="segments-label">
          <span className="segments-current">{currentStreak}</span>
          <span className="segments-sep">/</span>
          <span className="segments-next">{nextThreshold}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`streak-thermometer ${pulseClass} ${celebrateNewTier ? 'celebrate' : ''}`}>
      <div className="multiplier-badge">
        <span className="badge-value">{currentMultiplier.toFixed(1)}x</span>
      </div>
      
      <div className="thermometer-container">
        <div 
          className="thermometer-fill" 
          style={{ height: `${Math.min(100, Math.max(0, progress))}%` }}
        />
        <div className="thermometer-label">
          <span className="current-count">{currentStreak}</span>
        </div>
      </div>
      
      <div className="next-label">
        {nextThreshold}
      </div>
    </div>
  );
}
