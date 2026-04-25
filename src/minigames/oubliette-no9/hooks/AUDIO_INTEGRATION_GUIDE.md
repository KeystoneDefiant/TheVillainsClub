# Oubliette audio (club shell)

Oubliette **does not** host background music or duplicate the main menu audio controls. **Music** is owned by the shell; **SFX** for table/UI events use `useThemeAudio`, which reads mute and gain from the persisted **`useClubAudioStore`** (`src/audio/clubAudioStore.ts`).

## Files

- **Hook:** `src/minigames/oubliette-no9/hooks/useThemeAudio.ts` — `playSound`, `resetRoundSoundCounts` only.
- **Teardown:** `disposeOublietteAudio()` — clears cached one-shot `HTMLAudioElement`s; the minigame route calls this on unmount (`OublietteNo9Page`).
- **Manifest:** `src/config/minigames/oublietteAudioAssets.ts` — UI and hand-scoring filenames under `public/sounds/Classic/`.

## Usage

```ts
const { playSound, resetRoundSoundCounts } = useThemeAudio();

playSound("buttonClick");
playSound("handScoring", "full-house");
```

Toggles and volumes come from **Settings on the main menu** (`MainMenuPage`), not from Oubliette’s in-game Settings modal.

## Adding a sound

1. Add the file under `public/sounds/Classic/` (or adjust `OUBLIETTE_SOUND_PACK_DIR` / manifest).
2. Wire the path in `oublietteUiSoundFiles` or `oublietteHandScoringFiles`.
3. Call `playSound` with the matching event (and `HandRank` for scoring).

Missing files fail silently (`play()` rejected or no-op).
