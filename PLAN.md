# The Villains Club — Technical implementation plan

This document describes **how** the project is built and operated. Overarching outcomes and phase completion are in **GOALS.MD**.

---

## Current status (for agents — read this first)

**Stack:** The playable shell is **Electron + Vite + React + TypeScript**, not Godot. Godot project files, GDScript, scenes, and Godot-only tooling have been removed from this branch.

**Dev environment:** Use **Docker / Dev Container** when the host has no Node toolchain. See **AGENTS.md** (`## Dev container`) and **`.devcontainer/README.md`**. Typical flow inside the container: `npm ci` (or rely on `post-create`), then `npm run dev:web` and open forwarded **http://localhost:5173**. Full Electron: `npm run dev` (needs a display).

**What exists today (milestone: club shell + Oubliette No. 9 + 7 Year Itch + Fateseal Silver host + Game-Like UI Redesign):**

- **Renderer:** Vite + React 19, **Mantine** UI, **Framer Motion** for intro/menu motion, and **SCSS** for component stylesheets.
- **Visual Theme & Redesign:** Enhanced `clubTokens.ts` with premium metallic gradients (`brass`, `goldSweep`), leather surface textures, and UI glows. Gothic skeuomorphic Diablo-style buttons implemented project-wide (unified under `ClubButton.tsx`, supporting standard and "fancy" styles, with Oubliette's `GameButton` wrapper, Seven Year Itch's roll button, and Fateseal's ritual button all sharing this core component), featuring ornate gold/bronze metallic side-cap chevrons (custom clip-paths and radial metallic gradients), chiseled gold horizontal border rails, and deep textured crimson-obsidian radial gradients that transition to glowing red/orange backlight box-shadows on hover. Floating amber/gold ember particles floating upwards against a rich, repeating Gothic/Victorian fine filigree lacy scrollwork vector pattern background, detailed with fine fabric weave overlays, mahogany velvet backing, and a warm cinematic vignette. Heavy 3D rounded Chicago bar armrest wood rail molded with authentic growth rings, horizontal fiber grain, and a glossy lacquer specular reflection, accented by a warm gold under-rail ambient LED glow. The wainscoting apron base features a series of recessed vertical dark-walnut wood panels finished with realistic inner frame shadows and polished golden brass rivets. A heavy, glowing brass footrest pipe with solid vertical support brackets runs horizontally along the floor line at the base of the bar. Card backs replaced with intricate gold-filigree SVG vector patterns; card fronts styled with brass outlines and double-stroke gold borders + translateY raise transitions for held cards. Oubliette's streak thermometer styled as a retro-future Nixie vacuum glass tube. 7 Year Itch styled with a realistic green wool felt fabric texture (via inline SVG noise), embossed borders, pulsing active points, and ivory/marble dice with radial highlights. Fateseal Silver styled with obsidian runestones and glowing purple lava/energy cracks. Refined `ClubButton` layout rules in `ClubButton.scss` to ensure vertical centering, seamless side-cap chevron alignment (`top: -2px` / `bottom: -2px`), responsive scaling down to `< 400px` viewports to prevent text clipping, corrected full-width button calculations (`calc(100% - margin)`) to prevent layout overflow and chevron clipping, polished variant-specific disabled styles without text blur or linear hazard stripes, and fixed border chevron asymmetry and third-party styling overrides by refactoring the chevrons to render as explicit child span elements (`.club-btn-chevron-left` and `.club-btn-chevron-right`) rather than using pseudo-elements on the button root. All component stylesheets have been converted from `.css` to `.scss` to utilize clean nesting and central CSS variables.
- **Custom Skeuomorphic Form Components:** Created high-fidelity wrapped input components `ClubTextInput`, `ClubSelect`, `ClubTextarea`, and `ClubNumberInput` matching the exact visual style, gradients, top/bottom borders, and absolute-positioned side-cap chevrons of `ClubButton` variants (`filled`, `light`, `outline`, `subtle`, `sheen`). Input variants map to corresponding button styles, and the `sheen` variant runs the active `playcard-gold-sheen` reflection animation on hover.
- **UI Playground Enhancements & Form Sandbox:** Integrated an interactive **ClubButton Code Generator** widget (allowing toggling of text, variant, size, fancy, fullWidth, loading, and disabled states with a live preview and direct click-to-copy code block) and a detailed **Club Primitives Code References** import index. Form controls tab updated to showcase `Club` wrapper inputs in various configurations alongside standard inline inputs (Switch, Checkbox, Radio, Slider, Progress). Expanded the **Form Elements Interactive Sandbox** to allow configuring control types (TextInput, Select, Textarea, NumberInput, Switch, Slider, Checkbox, Radio), custom labels, variants, and fancy chevrons, with copyable React markup and responsive hover/focus live previews.
- **Main Menu Mobile Vertical Scrolling:** Locked the `.club-landing` container height to viewport dimensions with `overflow-y: auto;` in `shellAnimations.css` to bypass the body's `overflow: hidden` constraint and enable internal vertical scrolling. Added safe bottom clearances (`padding-bottom`) to `.club-landing__menu` under the mobile media query to ensure all cards scroll fully past the bottom bar rail.
- **Routes & Settlement Screens:** Intro (`/`) plays the VC mark in **sequenced phases** (red draw-in → CSS neon pulse → glow settle → grey letter reveals, then gentle zoom), then shows **Enter the Club**; choosing it calls `useIntroToBarTransition` so **`/bar` mounts under a fixed `IntroToBarOverlay`** that performs a pixel-perfect zoom of the red mark to fill the frame and fades out (skipped under `prefers-reduced-motion`). The door state in `/menu` still shows **Enter the Club** + Settings; after entry it redirects to `/bar`, keeps the shelf/bar scene mounted, and presents the restaurant-style club menu with game landing cards. Dedicated Bar Ledger Settlement Screen: returning to the bar from a game table bypasses the active menu immediately and locks the screen into a dedicated centered Speakeasy receipt card, displaying session stakes, total table payouts, glowing net margins, the bartender's dynamic contextual quips, and a "Pocket Winnings" transaction button to slide over to the regular bar menu. The bar menu screen displays the static `VcLogoBarMark` at the top of the page. **Oubliette No. 9** can also start from a standalone landing (`/oubliette-no9`, enabled by `villainsGameDefaults.oublietteNo9.standaloneLandingEnabled` and disabled at runtime with `VITE_OUBLIETTE_NO9_STANDALONE=false`). **Oubliette No. 9** starts shell-bound sessions directly at pre-draw, without the legacy in-minigame main menu; **7 Year Itch** and **Fateseal Silver** start from their landing cards. `/bar` deep links reuse the same unified host and still show optional settlement flash state; `/__playground` remains linked from the club menu.
- **Staff Onboarding & Cinematic Transitions**: `/onboarding` is triggered immediately after name submission, rendering an interactive split-screen onboarding sequence (walnut panels, brass details) featuring 8 slides detailing staff dossiers, club rules (such as bankruptcy protection and the Bartender's Intervention), and speakeasy lore. Refactored to utilize the common `ClubGuidePanel` component and `useGuideNavigator` hook. Features a Walnut artwork display frame supporting optional high-fidelity images that fade out/in and shrink down from 110% on transition, removing the 3d door. Text changes are beautifully animated using directional spatial scrolling (scrolling left on 'Next', and right on 'Back'). Entry completion scales the display frame into full black before fading in `/bar`.
- **Theme & Global Custom Colors:** Club palette in `src/theme/`; typography loads via **Google Fonts** in `src/styles/fonts.css`. Repeated colors (such as deep walnut and brass strokes) are consolidated into central CSS custom properties in `index.css` mapped directly to `clubTokens.ts`.
- **Economy & Quips:** `src/game/money.ts` + persisted **`clubWalletStore`** — buy-in leaves the club once; resuming an active table reuses the existing session instead of charging another buy-in. `TableSession.gameModeId` tags the active rules profile. Bartender quip settlement selection strictly triggers `extreme_win` only when within 5% of a game's max win, and `extreme_loss` only when 85% or more of the buy-in is lost. Minigames cap the returned credits to the base return ceiling (`baseCap`, default 50x the buy-in) at both calculation and wallet-store levels, protecting the club balance from massive payouts.
- **Minigame Rules configurations & overrides:** Extracted all static configurations out of minigame rules files into dedicated config modules (`oublietteNo9Config.ts`, `sevenYearItchConfig.ts`, `fatesealConfig.ts`, `mastersonConfig.ts`) to make game modes and parameters easier to read and edit. Merged dynamically using imports/exports.
- **Oubliette port:** First-party copy under **`src/minigames/oubliette-no9/`**; table rules config at **`src/config/minigames/oublietteNo9GameRules.ts`** (`resolveOublietteGameMode` wrapper of `oublietteNo9Config.ts`); runtime mode is provided by **`OublietteGameModeProvider`** on **`OublietteNo9Page`** so hooks and shop math track the session profile. Tailwind + theme SCSS loaded from **`OublietteNo9Page`**. Shell-bound sessions snapshot Oubliette state for resume, and voluntary cash-out is available at round 31+.
- **7 Year Itch:** Crapless craps minigame under **`src/minigames/seven-year-itch/`**; NV paytables, racket lore, heat bonuses, configurations in **`src/config/minigames/sevenYearItchConfig.ts`** (default + `gameModes` merge), and per-roll noir lines in **`src/config/minigames/sevenYearItchRollStories.ts`**; agent plan **`7YI_plan.md`**. UX: pass-only come-out → full layout with point; hand recap is merged into the roll story modal with continue / cash-out; favors as a full view; Look the other way keeps the whole layout; Divest / Clean Getaway; optional Field/Horn; cash-out only when no point is active. Heat favors updated: Look the Other Way retained, Inside Man removed, Kingpin's Cut maximizes bets for free with 35% skim, Aggressive Expansion doubles place bet cap, Evidence Locker Key refunds 30% on a 7 bust; place bets do not score on come-out rolls; dice slide smoothly to home next to the roll button; felt layout smoothly furls/unfurls between phases, and Legitimate Business Investment crossfades. Mobile view optimized to allow vertical scrolling, wrapping controls row, and stacking bottom wagers. High-Fidelity UX Refinements: Circular brass-rimmed place bet badges, limit progress bars, active betting unit locks, and fast consecutive rolls. Includes an alternative **Easy Betting Mode** (active by default, switchable via a custom walnut-brass checkbox toggle in the lower left controls that fades in/out with the felt) that groups sister numbers (2/12, 3/11, etc.) into single columns and bets on both simultaneously (costing double chips). Supports configuration overrides `bettingMode: "easy" | "normal" | "switch"`. Interactive tutorial covers both Easy and Normal mode, explaining layout differences.
- **Fateseal Silver:** Occult cascading grid slot under **`src/minigames/fateseal-silver/`**; design spec **`Fateseal_Specs.md`**. Occult symbols, rules, and multipliers structured in **`src/config/minigames/fatesealConfig.ts`**. Altar single omen pick; Crossroads offers additional omens. Bet button controls, scatter append waves, transient void columns, FIFO paid-spin timers, and wild decay. Automatic Cash-out Safeguard triggers when session credits fall below bet limits.
- **Settlement → bar handoff:** Each minigame page holds an **`isReturningToClubRef`** that gates the "no active session → redirect to /menu" effect; the cash-out handler flips the ref before calling `endSession`, so the immediate `navigate("/bar", { state: BarRouteState })` is not tramped by the redirect-to-menu effect.
- **Dynamic Game Scaling to Fit Viewport:** Integrates custom `GameScaleContainer` (`src/components/ui/GameScaleContainer.tsx`) on Oubliette, Seven Year Itch, Fateseal, and Masterton pages that dynamically scales game screen dimensions using CSS `transform: scale()`.
- **Masterson 1881:** Reverse roulette croupier rigging sim under **`src/minigames/masterson-1881/`**; configuration in `src/config/minigames/mastersonConfig.ts` (Double Zero geometry); isolated engine executing a strict 7-phase loop; 13 AI betting strategies, covert whiskey-glass suspicion indicators, interactive live spotlight tutorials, and dynamic table ledger-based commission cuts that forfeit the player's buy-in if the house finishes negative.
- **Audio:** Music settings, user volume scales, and bands catalogs continue playing seamlessly during minigames.
- **Pazillus Interactive Live-Render Tutorial System:** A zero-screenshot, data-driven tutorial manager (`SommelierLiveGuide.tsx`) refactored under the new unified guide framework.
- **Player Titles, Bankruptcy, and Played Game Tracking:** Fully integrated dynamic Player Titles, dossier modal, and Bartender bankruptcy overlay.
- **Game Tips Modal & Unified Guides Framework:** Shared hook `useGuideNavigator` and `ClubGuidePanel` component consolidate step-by-step navigation, keyboards, and animations across `SommelierLiveGuide`, `GameTipsModal`, and `OnboardingPage`.
- **Balance Tuning Simulators:** Built custom Monte Carlo balance verification scripts under `scripts/` supporting all minigames with dynamic game mode extraction. Fateseal Silver (`sim:fateseal`) runs a matrix measuring 1-4 omen counts under standard, Unsettle Spirits, and Faustian Bargain setups. Seven Year Itch (`sim:itch`) calculates isolated RTPs for Pass Line, Field, Horn, and all individual Place and Hardway wagers. Oubliette No. 9 (`sim:oubliette`) runs hands using a rule-based AI video-poker player following Jacks-or-Better strategy. Masterton 1881 (`sim:masterson`) simulates croupier shifts under fair and optimal rigging models to compare table house edge vs. croupier commission ROI. Rollup script (`sim:all`) executes the entire suite to print a unified balancing dashboard.


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
