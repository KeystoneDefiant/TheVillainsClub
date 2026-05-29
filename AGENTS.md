# AGENTS.md — The Villains Club

Handoff for humans and coding agents. **Goals:** `GOALS.MD` (repo root). **Technical plan:** `PLAN.md` (includes **Current status** for milestones). **Architecture sketch:** `docs/architecture.md` (may lag the pivot; prefer `PLAN.md` + `src/`).

## Expectations for every coding-agent run

Each agent session that does more than a trivial typo-only pass should **before finishing** update everything that applies. Skip an item only when the change genuinely does not touch it (say so briefly in the handoff).

1. **`AGENTS.md`** — When commands, ports, devcontainer behavior, CI, Playwright/Electron flows, or agent-facing expectations change, update this file so the next run matches reality.
2. **Documentation** — When behavior, milestones, or contracts shift: **`PLAN.md` → Current status** (and other `PLAN.md` sections as needed); **`docs/architecture.md`** when module boundaries or data flow change; any other doc the work makes wrong or obsolete. Do not add new markdown files unless the user asked for them.
3. **Tests and Verification** — Add or adjust **Vitest** for deterministic logic you change. You MUST run the full verification suite with **`npm run testall`** (which runs `lint`, `typecheck`, and all tests) after all major edits and before finishing.


### Tests and tunable values

When a number or string is defined in app **settings / config** (for example `src/config/villainsGameDefaults.ts`, `src/config/minigames/oublietteNo9GameRules.ts`, or other exported defaults), **tests should import and use that value** instead of duplicating a magic number, **when the test is asserting or driving behavior tied to that setting**. Pure math fixtures (synthetic profiles, edge-case shapes) may still use small literals if they are not meant to track production defaults—prefer deriving expected results from the same config object when the assertion would otherwise drift.

The **Agent cycle checklist** below is the same bar, itemized.

## Current status (read first)

- **Shell:** **Electron + Vite + React + TypeScript** (`electron/`, `src/`). There is **no Godot project** in this tree anymore.
- **What works:** Intro (`/`) runs the VC mark in phased motion (red draw-in, neon pulse + glow settle, grey letter reveals, then logo zoom) and exposes **Enter the Club**; the click navigates to `/bar` while `IntroToBarOverlay` (mounted in `App.tsx`) paints a red zoom-to-fill and fades so the bar menu is already live underneath (shortened under `prefers-reduced-motion`). Main menu (`/menu`), club floor / bar (`/bar` — **table buy-ins and minigame starts live here**, not on `/menu`), standalone Oubliette landing (`/oubliette-no9`, disabled with `VITE_OUBLIETTE_NO9_STANDALONE=false`), Mantine + Club theme, Framer Motion presets (honors **`prefers-reduced-motion`** on shell routes), **`/__playground`** (UI lab; linked from menu and bar), economy contract stubs in `src/game/` (club balance vs session buy-in — see `money.ts`; optional **`gameModeId`** on the session; **`/bar`** starts tables with **`villainsGameDefaults.*.defaultGameModeId`**). Resuming an active table does **not** charge another buy-in. Oubliette launched from shell/standalone landing skips its legacy in-minigame main menu and starts at pre-draw; play screens use compact mobile layouts with internal scrolling fallback; active Oubliette sessions snapshot current pre-draw state for resume; **`OublietteGameModeProvider`** on the shell page supplies **`resolveOublietteGameMode(session.gameModeId)`** to gameplay hooks. Settling **Oubliette** (voluntary cash-out only at round **31+**), **7 Year Itch** (pass-only come-out → full point layout; hand recap inside roll modal; `sevenYearItchGameConfig` modes like Oubliette; favors shop view; Divest / Clean Getaway; roll story config; cash-out only when no point is active), **Fateseal Silver** (cascading grid slot at `/minigames/fateseal-silver`), or **Masterton 1881** (reverse roulette rigging simulator at `/minigames/masterson-1881`) returns you to **`/bar`** with a short recap when the shell passes router state. **Cash-out → /bar redirect race:** every minigame page (`OublietteNo9Page`, `SevenYearItchPage`, `FatesealSilverPage`, `MastertonPage`) keeps an **`isReturningToClubRef`** that suppresses its "no active session → /menu" effect during settlement; the cash-out handler flips it **before** `endSession()` so the immediate `navigate("/bar", { state: BarRouteState })` survives — without it the dock + quip on `/bar` never render. **7 Year Itch** plan: **`7YI_plan.md`**; implementation under `src/minigames/seven-year-itch/`. **Fateseal** — **`Fateseal_Specs.md`**, rules in `src/config/minigames/fatesealRules.ts` (**`fatesealGameConfig`** / **`resolveFatesealGameMode`** for chip and bet limits; **`fatesealProgressionRules`** for Crossroads scatter threshold, non-prophecy cluster clears, prophecy adjacency payout bonus, scatter meter / Sympathetic Vibrations, and other backlog tunables; **`fatesealCrossroadsNewShop`** / **`crossroadsNextOmenAdditionCostCredits`** for Crossroads credit SKUs); **Masterton 1881:** Reverse roulette croupier rigging sim under `src/minigames/masterson-1881/`; configuration in `src/config/minigames/mastersonRules.ts` with Double Zero roulette geometry; isolated engine in `src/minigames/masterson-1881/engine/useMastertonEngine.ts` executing a strict 7-phase loop; 7 AI betting strategies, covert whiskey-glass suspicion indicators, and interactive SommelierLiveGuide Pazillus-narrated live spotlight tutorial system. React stale closure bug resolved via an engine-phase sync `useEffect` in `App.tsx` ensuring `resolveSpin` executes cleanly. Grid fully redesigned using 3 standard roulette rows, offset by spacers for green zero numbers, spanning 13 columns (12 for numbers, 1 for column bets) with direct cell-click rigging hooks. Outside bet zones (Dozens, Categories, Columns) aspect ratios corrected so they stretch organically to prevent text cutoffs. Rendered premium brass-bordered golden gradient mini chip indicators displaying exact bet counts on the matrix board. Fateseal engine under `src/minigames/fateseal-silver/engine/` (spin results include `cascadeKeyframes` for stepped UI; session state uses FIFO **`wildReelPaidSpinTimers`**, **`deadReelPaidSpinTimers`**, **`markedOmenSymbol`** / **`markedOmenPaidSpinsLeft`**; fills honor left wild / right purchased-dead / transient bonus-dead columns and **meter fires append bonus waves inside the same `runSpin`**); `App.tsx` uses stepped screens (**prophecy altar → ritual grid / cascades → ledger**, plus in-flow **`crossroads`** when the scatter bank trips — full-width shop panel, not a Mantine `Modal`) via Framer **`AnimatePresence`** with **`defaultMotionPreset`** easing when motion is allowed and Walnut/brass **`clubTokens` panels / felt framing** aligned with **7 Year Itch**. **Altar:** single omen pick only. **Ritual:** chip bet buttons (min + bank fractions) start the spin; Free Ritual keeps a dedicated spin control. Each spin animates a **tablet-fill drop-in** (every cell falls in from above the grid with a per-row stagger) before the cascade frames; matched cells flash, payouts fly off, then the post-cascade refill applies the same drop-in animation to the cells that changed (gravity-shifted survivors + new tops from the pool). All Fateseal motion is skipped when **`prefers-reduced-motion`** is set; the App composes overlays from `cascadeKeyframes`. **Audio:** main menu Settings + **`clubAudioStore`** own music/SFX toggles and volumes; Oubliette reads that store for **SFX only** (no in-minigame audio panel, no Oubliette BGM player). **House band** from the shell keeps playing during minigames (same HTMLAudioElement as menu/bar) and shuffles the active band's track queue with runtime randomness on each load.
- **Unified Button System:** The core polymorphic component `ClubButton` (`src/components/ui/ClubButton.tsx`) supports standard and `fancy` styles. `GameButton` is a wrapper delegate for the `fancy` style. Seven Year Itch's roll button and Fateseal Silver's ritual button have been refactored to use the unified component, removing duplicate CSS classes (`.yi-felt-rollBtn`, `.fateseal-ritual-btn`). Refined layout rules in `ClubButton.css` to ensure vertical centering, seamless side-cap chevron alignment (`top: -2px` / `bottom: -2px`), responsive scaling down to `< 400px` viewports to prevent text clipping, corrected full-width button calculations (`calc(100% - margin)`) to prevent layout overflow and chevron clipping, and polished variant-specific disabled styles without text blur or linear hazard stripes. To resolve conflicts where Mantine's built-in focus/hover overlay styling on `::before` overrides and hides/distorts our left chevron, the side-cap chevrons are now rendered as explicit child span elements (`.club-btn-chevron-left` and `.club-btn-chevron-right`) instead of pseudo-elements.
- **Game Scale Container:** The polymorphic auto-scaling wrapper `GameScaleContainer` (`src/components/ui/GameScaleContainer.tsx`) is available to scale game screens to fit window/viewport boundaries using CSS `transform: scale()`. All active minigames (including Oubliette, Seven Year Itch, Fateseal Silver, and Masterton) have been standardized to use native responsive layouts and viewport scrolling rather than scaling transforms, improving standard text rendering and alignment.
- **Data / reference on disk:** **`content/`** catalogs (JSON/JSONC) are kept for future wiring; **`content/quips.json`** — settlement VO lines keyed by **`extreme_loss` / `loss` / `break_even` / `win` / `extreme_win`** for **`ClubSettlementDock`** on **`/bar`**; **`Fateseal_Specs.md`** for the cascading slot.
- **Where to look next:** `PLAN.md` → **Current status** → **Immediate next steps** (persistence, bar flow, first minigame host, audio, architecture doc refresh).

## Dev container (no local Node)

- **Cursor / VS Code:** install Dev Containers, then **Dev Containers: Reopen in Container**. Image: Node 22 + Debian libraries for Vite, Vitest, and Electron (see **`.devcontainer/`**).
- **After create:** `post-create` runs `npm ci` (see `.devcontainer/post-create.sh`).
- **Web shell (no Electron window):** `npm run dev:web` → open forwarded **http://localhost:5173** (Vite listens on all interfaces).
- **Full Electron:** `npm run dev` — needs a display (WSLg, Linux desktop, macOS, or X11). Headless remote: use `dev:web` or `npm run build` / `npm test`.
- **Docker only:** from repo root, `docker compose up -d dev` then `docker compose exec dev npm run dev:web` — details in [`.devcontainer/README.md`](.devcontainer/README.md).
- **Hot Reloading / HMR on Windows Hosts:** Windows hosts running Docker containers typically do not propagate native file watch events across the mount boundary. In this repository, polling (`usePolling`) is used if `VITE_USE_POLLING=true` (or `CHOKIDAR_USEPOLLING=true`) is defined. It is enabled by default in `.devcontainer/devcontainer.json` and `compose.yaml`.

## Electron + React (commands)

- **Install:** `npm ci` (preferred) or `npm install`.
- **Dev (Vite only):** `npm run dev:web` — best inside containers or without a GUI.
- **Dev (Electron + Vite):** `npm run dev` — starts Vite on **5173** and opens Electron when the dev server is ready.
- **Quality:** `npm run lint`, `npm run test`, `npm run typecheck`.
- **Tuning:** **`npm run sim:fateseal`** runs the Fateseal Silver Monte Carlo harness (`scripts/sim-fateseal.ts`; uses **`npx tsx`** so it works when `tsx` is not on PATH). Set **`FATESEAL_SIM_BASE_ONLY=1`** to measure **base ritual** payout vs. paid bets (~**88–95%** target for `fatesealCascadePayoutScale` with `forBaseRitualSim`); omit for the full model fingerprint (meter + in-spin bonus appends + sympathetic).
- **Production bundle (renderer):** `npm run build`.
- **Packaged desktop (local):** `npm run pack` or `npm run dist` (requires a full toolchain for `electron-builder` targets you enable).

## Repository layout (current)

- **`src/`** — React app: `pages/`, `components/`, `theme/`, `motion/`, `game/`, `dev/` (playground).
- **`electron/`** — `main.cjs`, `preload.cjs` (extend `contextBridge` deliberately).
- **`content/`** — JSON/JSONC catalogs (drinks, bands, sfx, modes, etc.); validate before relying on them at runtime (JSONC needs stripping or conversion in the browser).
- **`Fateseal_Specs.md`** — Fateseal Silver design + implementation notes (tunables: `src/config/minigames/fatesealRules.ts`).

- **`.devcontainer/`**, **`compose.yaml`** — containerized dev environment.


## After pulling changes

1. `npm ci` (or reopen the Dev Container so `post-create` runs).
2. `npm run lint` and `npm run test` before pushing substantive UI or game logic changes.

## Save / persistence (legacy notes + direction)

- **Legacy (Godot):** Older branches used `user://villains_club_save.json` with versioned migrations; that implementation is **not** in this tree.
- **Current / TODO:** Persist settings and club progress via **Electron `userData`** (or equivalent) with a **versioned JSON** schema and migrations — wire into `clubWalletStore` and settings UI when implemented.

## Agent cycle checklist (every run — when applicable)

- [ ] Update **`PLAN.md` → Current status** when a milestone lands or direction changes materially (container agents read it first).
- [ ] Update **`AGENTS.md`** (this file) when run commands, ports, devcontainer behavior, CI, or agent expectations change.
- [ ] Update **`docs/architecture.md`** when module boundaries or data contracts change.
- [ ] Add or adjust **Vitest** tests under `src/` for deterministic rules and regressions you might introduce.
- [ ] Run **`npm run testall`** (or `npm run lint && npm run typecheck && npm run test`) after all major edits and before finishing.

- [ ] Keep **`content/*.json`** valid JSON where the app parses them; JSONC files cannot be parsed by `JSON.parse` until converted or stripped.

## CI (GitHub Actions)

- **Push/PR:** `npm ci`, then **`npm run lint`**, **`npm run test`**, **`npm run typecheck`**, **`npm run build`**, **Electron** packaging on Ubuntu / Windows / macOS (`dist:electron:*`, unsigned), and on pushes to the **default branch** a **GitHub Pages** deploy (see `.github/workflows/ci.yml`).
- **Pages setup:** Repository **Settings → Pages**: set **Build and deployment** source to **GitHub Actions** (not “Deploy from a branch”). The site is built with `VITE_BASE=/<repository-name>/` so asset URLs and `BrowserRouter` match project Pages (`https://<user>.github.io/<repo>/`). SPA deep links use **`404.html`** copied from `index.html` in CI.
- **Local desktop installers:** `npm run dist` (Windows **NSIS** in `package.json`); CI uses **`dir`** targets for speed and to avoid signing.

## Web / browser dev notes

- When using **`npm run dev:web`**, browsers may require a **user gesture** before audio unlocks; align first interaction with audio start when you wire SFX/music.
- Optional downloadable packs are **not** implemented in the Electron shell yet; treat `content/dlc_manifest.json` as future-facing data until a loader exists.
