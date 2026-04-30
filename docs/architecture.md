# Architecture (current React/Electron shell)

## Shell flow

- `src/App.tsx` mounts `ShellBandMusicHost` once inside `BrowserRouter`.
- `/` plays the VC logo intro, keeps the mark on screen, then exposes an “Enter the Club” prompt that moves into `/bar`.
- `/menu` is the unified landing screen: before entry it shows “Enter the Club” + Settings; after entry it becomes the bar menu.
- `/bar` renders the same unified menu in entered mode so return-state links and older deep links still work.
- Minigame entries open a game landing panel first; starting a table creates a `clubWalletStore` session and navigates to `/minigames/*`. Shell-bound Oubliette sessions skip its legacy in-minigame menu and open at pre-draw.
- `/oubliette-no9` is a configurable standalone landing for Oubliette No. 9; disable it with `VITE_OUBLIETTE_NO9_STANDALONE=false`.

## State and audio

- `clubAudioStore` persists music/SFX settings.
- `clubFlowStore` tracks whether the user entered the club for the current app session.
- `useShellBandMusic` uses the same house-band stream on shell and minigame routes; volume is 30% of the user setting before entry and fades to the setting after entry.
- Active band and specials use the local 4AM bar-day boundary.
- Oubliette in-run screens own their viewport scrolling because the shell body is fixed; layouts still compact on mobile to avoid unnecessary scroll where possible.

## Economy and specials

- `clubWalletStore` owns club balance and active table session.
- `sessionSettlement.ts` applies per-game and all-minigame cap multipliers from `content/specials.json`.
- Specials resolve through `specialsResolver.ts`; config rows may express payout multipliers, cap multipliers, or a first-buy-in-credit marker for future persisted daily redemption.

## Minigame contract

- Minigames receive session credits, settlement profile, and shell callbacks from their page wrapper; Oubliette can also run standalone without shell settlement callbacks when launched outside a wallet session.
- 7 Year Itch supports `onPauseToClub` so players can leave a live session without cashing out; the wallet session remains active for resume.
- Settlement still happens only through the minigame’s resolved end state.
