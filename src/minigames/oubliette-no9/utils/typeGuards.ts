/**
 * Runtime type guards for external data (localStorage, API responses, etc.)
 * Use these when parsing JSON or reading from storage to validate shape before use.
 */

/** Expected shape for audio settings from localStorage */
export interface StoredAudioSettings {
  musicEnabled?: boolean;
  soundEffectsEnabled?: boolean;
  musicVolume?: number;
  soundEffectsVolume?: number;
  handScoringMinVolumePercent?: number;
}

/**
 * Type guard for audio settings object.
 * Validates that parsed JSON has the expected shape for audio settings.
 */
export function isAudioSettings(value: unknown): value is StoredAudioSettings {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if ('musicEnabled' in obj && typeof obj.musicEnabled !== 'boolean' && obj.musicEnabled !== undefined) {
    return false;
  }
  if ('soundEffectsEnabled' in obj && typeof obj.soundEffectsEnabled !== 'boolean' && obj.soundEffectsEnabled !== undefined) {
    return false;
  }
  if ('musicVolume' in obj && typeof obj.musicVolume !== 'number' && obj.musicVolume !== undefined) {
    return false;
  }
  if ('soundEffectsVolume' in obj && typeof obj.soundEffectsVolume !== 'number' && obj.soundEffectsVolume !== undefined) {
    return false;
  }
  if ('handScoringMinVolumePercent' in obj && typeof obj.handScoringMinVolumePercent !== 'number' && obj.handScoringMinVolumePercent !== undefined) {
    return false;
  }
  return true;
}

/**
 * Safely parse and validate audio settings from JSON string.
 * Returns null if invalid.
 */
export function parseAudioSettings(json: string | null): StoredAudioSettings | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return isAudioSettings(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Expected shape for animation settings from localStorage */
export interface StoredAnimationSettings {
  animationSpeedMode?: number | 'skip';
}

const ANIMATION_SPEED_MIN = 0.5;
const ANIMATION_SPEED_MAX = 7;

/**
 * Safely parse and validate animation settings from JSON string.
 * Returns null if invalid. Validates animationSpeedMode is 0.5-7 or 'skip'.
 */
export function parseAnimationSettings(json: string | null): StoredAnimationSettings | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed === null || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    const mode = obj.animationSpeedMode;
    if (mode === 'skip') {
      return { animationSpeedMode: 'skip' };
    }
    if (typeof mode === 'number' && mode >= ANIMATION_SPEED_MIN && mode <= ANIMATION_SPEED_MAX) {
      return { animationSpeedMode: mode };
    }
    return null;
  } catch {
    return null;
  }
}
