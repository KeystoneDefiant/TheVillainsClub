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
- `useShellBandMusic` uses the same house-band stream on shell and minigame routes; volume is 30% of the user setting before entry and fades to the setting after entry. House band PCM lives under **`content/audio/bands`**; **`vite.config.ts`** serves it in dev and copies it into **`dist/audio/bands`** when building (URLs stay **`/audio/bands/…`** modulo Vite **`base`**).
- Active band and specials use the local 4AM bar-day boundary.
- Oubliette in-run screens own their viewport scrolling because the shell body is fixed; layouts still compact on mobile to avoid unnecessary scroll where possible.

## Economy and specials

- `clubWalletStore` owns club balance and active table session.
- Leaving a settled table pushes `ClubTableReturnDetail` → `BarRouteState` (`buildBarRouteStateFromReturn`) in router `location.state`; `MainMenuPage` consumes it once, replaces history with `state: null`, and shows **`ClubSettlementDock`** beside the club menu — net credits vs buy-in plus a deterministic random quip from **`content/quips.json`** (buckets include **break-even** when return equals buy-in with no tiers) via `src/game/barSettlementQuips.ts`.
- Each minigame page (`OublietteNo9Page`, `SevenYearItchPage`, `FatesealSilverPage`, `MastertonPage`) keeps an **`isReturningToClubRef`** that suppresses its "no active session → redirect to /menu" effect for the duration of cash-out: the handler flips the ref **before** calling `endSession`, so the immediate `navigate("/bar", { state })` survives the activeSession-null re-render. Without this guard the redirect-to-menu effect fires after `endSession`, replacing the bar route and dropping the settlement state on the floor (the dock and its quip then never render).
- `sessionSettlement.ts` applies per-game cap multipliers (`oubliette_cap_mult`, `seven_year_itch_cap_mult`, `fateseal_cap_mult`, `masterson_cap_mult`) and the shared `all_minigames_cap_mult` from `content/specials.json`.
- Capped cash-outs: `sessionSettlement.ts` strictly caps the returned `totalReturn` at the table's base return ceiling (`baseCap`), and `clubWalletStore.ts` enforces this same cap inside `endSession` as a second layer of defense. Additionally, `buildBarRouteStateFromReturn` caps the `totalReturn` at `maxWinCredits` to align the UI/VO quips with the actual credited wallet balance.
- Specials resolve through `specialsResolver.ts`; config rows may express payout multipliers, cap multipliers, or a first-buy-in-credit marker for future persisted daily redemption.

## Minigame contract

- Minigames receive session credits, settlement profile, optional **`gameModeId`** (see `money.ts` / `villainsGameDefaults`), and shell callbacks from their page wrapper; Oubliette can also run standalone without shell settlement callbacks when launched outside a wallet session.
- **Oubliette** resolves `gameModeId` with **`resolveOublietteGameMode`** and injects the merged profile via **`OublietteGameModeProvider`** (`OublietteNo9Page`) so nested hooks and shop UI read one consistent `GameModeConfig`. **7 Year Itch**, **Fateseal Silver**, and **Masterton 1881** resolve modes in their roots (`resolveSevenYearItchGameMode`, `resolveFatesealGameMode`, or config mapping hooks).
- 7 Year Itch, **Fateseal Silver**, and **Masterton 1881** support `onPauseToClub` so players can leave a live session without cashing out; the wallet session remains active for resume.
- **Fateseal Silver** (`/minigames/fateseal-silver`, `gameId` **`fateseal_silver`**) uses the same `OublietteSettlementProfile` / `computeFatesealReturn` cap math; specials may set **`fateseal_cap_mult`** on a definition row. Product/design notes and RTP discussion: repo root **`Fateseal_Specs.md`**; weights and **cascade payout scale** in **`src/config/minigames/fatesealRules.ts`** (see **`npm run sim:fateseal`**, optional **`FATESEAL_SIM_BASE_ONLY=1`** for base-game payout tuning).
- **Masterton 1881** (`/minigames/masterson-1881`, `gameId` **`masterson_1881`**) is a croupier rigging Double Zero roulette simulator. Players toggle rigging choices directly on the matrix board layout, track dynamic initial/last-minute AI wagers rendered as color-coded stacked chips, spin an SVG-based wheel that slides into view, and manage wagers under a 10-second symmetrical circular timer that auto-resolves when it expires.
- Settlement still happens only through the minigame’s resolved end state.
