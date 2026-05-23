# The Villains Club — Technical implementation plan

This document describes **how** the project is built and operated. Overarching outcomes and phase completion are in **GOALS.MD**.

---

## Current status (for agents — read this first)

**Stack:** The playable shell is **Electron + Vite + React + TypeScript**, not Godot. Godot project files, GDScript, scenes, and Godot-only tooling have been removed from this branch.

**Dev environment:** Use **Docker / Dev Container** when the host has no Node toolchain. See **AGENTS.md** (`## Dev container`) and **`.devcontainer/README.md`**. Typical flow inside the container: `npm ci` (or rely on `post-create`), then `npm run dev:web` and open forwarded **http://localhost:5173**. Full Electron: `npm run dev` (needs a display).

**What exists today (milestone: club shell + Oubliette No. 9 + 7 Year Itch + Fateseal Silver host + Game-Like UI Redesign):**

- **Renderer:** Vite + React 19, **Mantine** UI, **Framer Motion** for intro/menu motion.
- **Visual Theme & Redesign:** Enhanced `clubTokens.ts` with premium metallic gradients (`brass`, `goldSweep`), leather surface textures, and UI glows. Gothic skeuomorphic Diablo-style buttons implemented project-wide (unified under `ClubButton.tsx`, supporting standard and "fancy" styles, with Oubliette's `GameButton` wrapper, Seven Year Itch's roll button, and Fateseal's ritual button all sharing this core component), featuring ornate gold/bronze metallic side-cap chevrons (custom clip-paths and radial metallic gradients), chiseled gold horizontal border rails, and deep textured crimson-obsidian radial gradients that transition to glowing red/orange backlight box-shadows on hover. Floating ember particles and backlit bottle glows on bar shelves. Card backs replaced with intricate gold-filigree SVG vector patterns; card fronts styled with brass outlines and double-stroke gold borders + translateY raise transitions for held cards. Oubliette's streak thermometer styled as a retro-future Nixie vacuum glass tube. 7 Year Itch styled with a realistic green wool felt fabric texture (via inline SVG noise), embossed borders, pulsing active points, and ivory/marble dice with radial highlights. Fateseal Silver styled with obsidian runestones and glowing purple lava/energy cracks. Refined `ClubButton` layout rules in `ClubButton.css` to ensure vertical centering, seamless side-cap chevron alignment (`top: -2px` / `bottom: -2px`), responsive scaling down to `< 400px` viewports to prevent text clipping, corrected full-width button calculations (`calc(100% - margin)`) to prevent layout overflow and chevron clipping, polished variant-specific disabled styles without text blur or linear hazard stripes, and fixed border chevron asymmetry and third-party styling overrides by refactoring the chevrons to render as isolated child span elements (`.club-btn-chevron-left` and `.club-btn-chevron-right`) rather than using pseudo-elements on the button root.
- **Routes:** Intro (`/`) plays the VC mark in **sequenced phases** (red draw-in → CSS neon pulse → glow settle → grey letter reveals, then gentle zoom), then shows **Enter the Club**; choosing it calls `useIntroToBarTransition` so **`/bar` mounts under a fixed `IntroToBarOverlay`** that performs a pixel-perfect zoom of the red mark to fill the frame and fades out (skipped under `prefers-reduced-motion`). The door state in `/menu` still shows **Enter the Club** + Settings; after entry it redirects to `/bar`, keeps the shelf/bar scene mounted, and presents the restaurant-style club menu with game landing cards. The bar menu screen displays the static `VcLogoBarMark` at the top of the page. **Oubliette No. 9** can also start from a standalone landing (`/oubliette-no9`, enabled by `villainsGameDefaults.oublietteNo9.standaloneLandingEnabled` and disabled at runtime with `VITE_OUBLIETTE_NO9_STANDALONE=false`). **Oubliette No. 9** (`/minigames/oubliette-no9`) starts shell-bound sessions directly at pre-draw, without the legacy in-minigame main menu; **7 Year Itch** (`/minigames/seven-year-itch`) and **Fateseal Silver** (`/minigames/fateseal-silver`) start from their landing cards. `/bar` deep links reuse the same unified host and still show optional settlement flash state; **`/__playground`** remains linked from the club menu.
- **Theme:** Club palette in `src/theme/`; typography loads via **Google Fonts** in `src/styles/fonts.css` (add self-hosted files under `assets/fonts/` later if you want fully offline dev).
- **Economy & Quips:** `src/game/money.ts` + persisted **`clubWalletStore`** — buy-in leaves the club once; resuming an active table reuses the existing session instead of charging another buy-in. **`TableSession.gameModeId`** tags the active rules profile. Bartender quip settlement selection strictly triggers `extreme_win` only when within 5% of a game's max win, and `extreme_loss` only when 85% or more of the buy-in is lost. Minigames cap the returned credits to the base return ceiling (`baseCap`, default 50x the buy-in) at both calculation and wallet-store levels, protecting the club balance from massive payouts.
- **Oubliette port:** First-party copy under **`src/minigames/oubliette-no9/`**; table rules config at **`src/config/minigames/oublietteNo9GameRules.ts`** (`resolveOublietteGameMode`); runtime mode is provided by **`OublietteGameModeProvider`** on **`OublietteNo9Page`** so hooks and shop math track the session profile. Tailwind + theme SCSS loaded from **`OublietteNo9Page`**. Shell-bound sessions snapshot Oubliette state for resume, and voluntary cash-out is available at round 31+.
- **7 Year Itch:** Crapless craps minigame under **`src/minigames/seven-year-itch/`**; NV paytables, racket lore, heat bonuses, **`sevenYearItchGameConfig`** (same **default + `gameModes` merge** pattern as Oubliette’s `gameConfig`; resolved table rules in **`sevenYearItchTableConfig`** / **`getSevenYearItchGameMode`**), and **per-roll noir lines** in **`src/config/minigames/sevenYearItchRollStories.ts`**; agent plan **`7YI_plan.md`**. UX: pass-only come-out → full layout with point; **hand recap is merged into the roll story modal** with continue / cash-out; favors as a full view; **Look the other way** keeps the **whole layout**; **Divest** / **Clean Getaway**; optional Field/Horn; cash-out only when no point is active.
- **Fateseal Silver:** Occult cascading grid slot under **`src/minigames/fateseal-silver/`**; design spec **`Fateseal_Specs.md`**. **Shell:** single-symbol seal at the altar; additional omens only via Crossroads random “add symbol” offer (if < 4 symbols). Ritual stakes via **100 / 200 / 500 / 1000** bet buttons (responsive, full width container); legacy **`freeRitualSpinsLeft`** path remains for zero-bet spins but the scatter meter **no longer banks** charges — meter fires **append bonus waves** inside the same `runSpin` (grid grows up to **`bonusGrid.maxGridSize`**, transient bonus dead columns, Sympathetic at configured fire count). Weighted symbol pool, cascades with gravity shifting void symbols to lowest empty spots and protecting scatter symbols from wild overwrites. **`fatesealCrossroadsNewShop`** — wild/dead purchases use **FIFO paid-spin timers** with **column fill masks** (wild left / purchased dead right) and active wild chance decays exponentially per cascade depth step (via `fatesealProgressionRules.purchasedReels.wildChanceDecayPerDepth`) to prevent infinite cascade loops. Crossroads includes **Unsettle the Spirits** (free wild spins at bet 250), **Faustian Bargain** (dead reels for credits, locking bet to 250 and disabling cash-out), and **Vassago's Gambit** (guaranteed scatter bonus next spin, but scatters don't accumulate Crossroads progress). **`fatesealGameConfig`** (**default + `gameModes` merge**, `resolveFatesealGameMode`) for wager levels and powerups. Pure engine in **`src/minigames/fateseal-silver/engine/`**. Shell UI: **altar → ritual (grid + cascades) → ledger**, plus in-flow **`crossroads`** phase (full-width shop, not a modal) when the scatter bank trips. Monte Carlo: **`npm run sim:fateseal`** (`scripts/sim-fateseal.ts`; use **`npx tsx scripts/sim-fateseal.ts`** if `tsx` is not on PATH); use **`FATESEAL_SIM_BASE_ONLY=1`** when tuning the scale toward the staged ~90% payout on paid bets in the stripped base game.
- **Settlement → bar handoff:** Each minigame page (`OublietteNo9Page`, `SevenYearItchPage`, `FatesealSilverPage`) holds an **`isReturningToClubRef`** that gates the "no active session → redirect to /menu" effect; the cash-out handler flips the ref before calling `endSession`, so the immediate `navigate("/bar", { state: BarRouteState })` is not trampled by the redirect-to-menu effect that fires once `activeSession` becomes null. Without this guard, `ClubSettlementDock` (the bar-side quip card) never receives `lastTable` state.
- **Audio:** **`src/audio/clubAudioStore.ts`** (persisted) is the single settings source for **music and SFX** (Settings). The shell band starts on the intro/menu/bar/minigame routes at **30% of the user music volume until the club is entered**, then fades to the configured volume. Oubliette plays **table/UI SFX only** via `useThemeAudio`; it does not duplicate audio controls or start its own background music. **House band** continues on `/minigames/*` via `useShellBandMusic`; its active band's music queue is shuffled from runtime randomness on each load. Tracks from `content/bands.json` resolve under `public/audio/bands/*` via **`bandPublicUrl`**.
- **Tests / CI:** **Vitest** + **ESLint**; Oubliette tests live under `src/minigames/oubliette-no9/**`; 7 Year Itch engine tests under `src/minigames/seven-year-itch/engine/__tests__/`; Fateseal engine tests under `src/minigames/fateseal-silver/engine/__tests__/`; shell/table helpers under `src/components/club/` and `src/game/`.

**Immediate next steps (suggested order):**

1. Wire **save persistence** (e.g. `localStorage` or Electron `userData`) to **`clubWalletStore`** (beyond audio).
2. **Bar flow:** drink catalog from `content/drinks.json`, richer host UI; buy-in already starts from **`/bar`** via `ClubTableGamesSection` + `clubWalletStore.startSession`.
3. **Oubliette UI pass:** mobile play screens now scroll when needed and use tighter small-screen spacing; continue replacing Tailwind surfaces with **Mantine** + club primitives where product priority dictates.
4. **Content audio manifests:** optional `content/*_sfx.json` mapping into the club audio layer.
5. Refresh **`docs/architecture.md`** for minigame host boundaries.

---

## Engine and language

- **Shell:** **Electron** (main/preload under `electron/`), renderer **Vite + React + TypeScript** under `src/`.

## Platforms

- **Primary:** **Desktop** via Electron (Windows first in `electron-builder` config; Linux/macOS follow signing and pipeline needs).
- **Web / dev:** **Vite dev server** (`npm run dev:web`) for UI iteration inside containers or without Electron; production web export is optional unless reintroduced explicitly.

## Repository layout (current)

```
content/              # JSON/JSONC catalogs (drinks, bands, sfx manifests, etc.)
electron/             # main.cjs, preload.cjs
src/                  # React app: pages, theme, components, game/, dev playground
.devcontainer/        # Dockerfile, devcontainer.json, post-create.sh
compose.yaml          # optional plain Docker `dev` service
docs/                 # architecture, roadmaps (some Godot-era text may be stale)
.github/workflows/    # CI
```

## Architecture (high level)

| Area | Responsibility (target) |
|------|-------------------------|
| Renderer state | React + Zustand (or similar) for UI and session flows |
| Persistence | Versioned save JSON under Electron `userData` (or web storage if you add a web target) |
| Audio | Web Audio / HTMLAudio; map from `content` manifests |
| Content | Load `content/*.json` at runtime or bundle via Vite; handle JSONC for browser |

### Offline-first vs optional online

Unchanged as a product goal: core play should not require network. Optional online features stay a separate module.

### Economy (product + code contract)

- **Club balance:** global persisted credits.
- **Table session:** **buy-in** moves value from club balance into an isolated **session wallet** for the active minigame.
- **Minigames** receive only session-scoped props (see `src/game/money.ts`); they do not read or write the full club balance directly.

### Minigame integration contract

- **Entry:** Session wallet, rules payload, modifiers as data.
- **Exit:** Outcome and amount returned to the shell for settlement (`settleTableSession` pattern in `money.ts`).

## DLC, mods, and packs (later)

Electron builds can still use **HTTP-fetched** optional content packs or local drop-ins; define a manifest schema when you implement it.

## Persistence

- **Target:** Versioned JSON in **Electron `app.getPath('userData')`**, with migrations keyed by a **version** field.
- **Scope:** Credits, unlocks, loan state, audio settings, per-game stats as the product requires.

## Internationalization

- **v1:** English; prefer string keys or a small i18n layer early. Legacy copy may still live under `content/lang/` as JSONC until migrated.

## Testing

- **Framework:** **Vitest** + Testing Library for React units and smoke tests (`npm test`).

## CI (GitHub Actions)

- **On push/PR:** `npm ci`, then **`npm run lint`**, **`npm run test`**, **`npm run typecheck`**, **`npm run build`**.

## Agentic development

- **`AGENTS.md`:** Commands for **Dev Container**, **Vite**, **Electron**, tests, and builds.
- **`PLAN.md` (this file):** Update the **Current status** section whenever a milestone lands so container and editor agents share the same picture.
- **Living docs:** Update `docs/architecture.md` when module boundaries change.

## Brand and UI implementation

- **Tokens:** `src/theme/clubTokens.ts`, Mantine theme in `src/theme/clubTheme.ts`, shared primitives under `src/components/ui/`.
- **Motion:** Shared presets in `src/motion/`; tune in **`/__playground`** (dev only).

## Security and scope

- No secrets in git; use CI secrets for signing and publishing.

## References

- **GOALS.MD** — Phase outcomes and what must work.
- **AGENTS.md** — Operational handoff (Dev Container, npm scripts, submodule).
