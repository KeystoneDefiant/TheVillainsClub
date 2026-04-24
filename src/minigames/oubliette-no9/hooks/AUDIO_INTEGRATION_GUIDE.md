# Oubliette audio (club shell)

Oubliette no longer loads a “theme” for sound. Playback uses the **club audio store** plus a static file manifest.

## Files

- **Hook:** `src/minigames/oubliette-no9/hooks/useThemeAudio.ts` — `playSound`, `playMusic`, `stopMusic`, `stopAll`, `resetRoundSoundCounts`.
- **Teardown:** `disposeOublietteAudio()` in the same module — pauses/clears cached `HTMLAudioElement`s; the minigame route calls this on unmount.
- **Manifest:** `src/config/minigames/oublietteAudioAssets.ts` — filenames and `public/sounds/Classic/` pack folder.
- **Volumes / toggles:** `src/audio/clubAudioStore.ts` (persisted).

## Usage

```ts
const { playSound, playMusic, stopMusic } = useThemeAudio(state.audioSettings);

playSound("buttonClick");
playSound("handScoring", "full-house");
playMusic();
stopMusic();
```

Missing files fail silently (`play()` rejected or no-op).

## Adding a sound

1. Drop the file under `public/sounds/Classic/` (or change `OUBLIETTE_SOUND_PACK_DIR` and paths in `oublietteAudioAssets.ts`).
2. Wire the filename in `oublietteUiSoundFiles` or `oublietteHandScoringFiles`.
3. Call `playSound` with the matching event (and `HandRank` for scoring lines).

## Adding BGM tracks

Extend `oublietteBackgroundTracks` in `oublietteAudioAssets.ts`. Multiple tracks rotate randomly without immediate repeats; a single track loops.
