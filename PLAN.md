# The Villains Club — Technical implementation plan

This document describes **how** the project is built and operated. Overarching outcomes and phase completion are in **GOALS.MD**.

---

## Current status (for agents — read this first)

**Stack:** The playable shell is **Electron + Vite + React + TypeScript**, not Godot. Godot project files, GDScript, scenes, and Godot-only tooling have been removed from this branch.

**Dev environment:** Use **Docker / Dev Container** when the host has no Node toolchain. See **AGENTS.md** (`## Dev container`) and **`.devcontainer/README.md`**. Typical flow inside the container: `npm ci` (or rely on `post-create`), then `npm run dev:web` and open forwarded **http://localhost:5173**. Full Electron: `npm run dev` (needs a display).

**What exists today (milestone: club shell + Oubliette No. 9 + 7 Year Itch host):**

- **Renderer:** Vite + React 19, **Mantine** UI, **Framer Motion** for intro/menu motion.
- **Routes:** Intro (`/`) → main menu (`/menu`) → club floor (`/bar`, table buy-ins) → **Oubliette No. 9** (`/minigames/oubliette-no9`) or **7 Year Itch** (`/minigames/seven-year-itch` after `startSession`), return to **`/bar`** with optional flash state on settle; dev-only UI playground (`/__playground` in development).
- **Theme:** Club palette in `src/theme/`; typography loads via **Google Fonts** in `src/styles/fonts.css` (add self-hosted files under `assets/fonts/` later if you want fully offline dev).
- **Economy:** `src/game/money.ts` + persisted **`clubWalletStore`** — buy-in leaves the club; **return settlement** uses `src/game/sessionSettlement.ts` (same cap / tier shape for Oubliette and 7 Year Itch; product uses `oubliette_cap_mult` vs `seven_year_itch_cap_mult` × `all_minigames_cap_mult` per game). Defaults in **`src/config/villainsGameDefaults.ts`**; cap keys on specials rows in **`content/specials.json`** resolved in **`src/game/specialsResolver.ts`** (separate from `payout_mult`).
- **Oubliette port:** First-party copy under **`src/minigames/oubliette-no9/`**; table rules config at **`src/config/minigames/oublietteNo9GameRules.ts`**; Tailwind + theme SCSS loaded from **`OublietteNo9Page`**. **`TO_PORT/OublietteNo9`** remains the upstream reference submodule.
- **7 Year Itch:** Crapless craps minigame under **`src/minigames/seven-year-itch/`**; NV paytables in **`src/config/minigames/sevenYearItchRules.ts`**; agent plan **`7YI_plan.md`**. Favors / Devil’s Deals from the narrative spec are **not** in this sprint (base table only).
- **Audio:** **`src/audio/clubAudioStore.ts`** (persisted) is the single settings source for **music and SFX** (main menu Settings). Oubliette plays **table/UI SFX only** via `useThemeAudio` reading that store; it does not duplicate audio controls or start its own background music.
- **Tests / CI:** **Vitest** + **ESLint** + **Playwright** smoke (`npm run test:e2e` after a build); Oubliette tests live under `src/minigames/oubliette-no9/**`; 7 Year Itch engine tests under `src/minigames/seven-year-itch/engine/__tests__/`; shell/table helpers under `src/components/club/` and `src/game/`.

**Immediate next steps (suggested order):**

1. Wire **save persistence** (e.g. `localStorage` or Electron `userData`) to **`clubWalletStore`** (beyond audio).
2. **Bar flow:** drink catalog from `content/drinks.json`, richer host UI; buy-in already starts from **`/bar`** via `ClubTableGamesSection` + `clubWalletStore.startSession`.
3. **Oubliette UI pass:** progressively replace Tailwind surfaces with **Mantine** + club primitives where product priority dictates.
4. **Content audio manifests:** optional `content/*_sfx.json` mapping into the club audio layer.
5. Refresh **`docs/architecture.md`** for minigame host boundaries.

---

## Engine and language

- **Shell:** **Electron** (main/preload under `electron/`), renderer **Vite + React + TypeScript** under `src/`.
- **Reference sources:** JavaScript originals live in **`TO_PORT/`** as a **git submodule**. Ports become first-party React (or shared packages); keep parity notes (e.g. `docs/oubliette_port_parity.md`) updated when behavior is ported.

## Platforms

- **Primary:** **Desktop** via Electron (Windows first in `electron-builder` config; Linux/macOS follow signing and pipeline needs).
- **Web / dev:** **Vite dev server** (`npm run dev:web`) for UI iteration inside containers or without Electron; production web export is optional unless reintroduced explicitly.

## Repository layout (current)

```
TO_PORT/              # git submodule — JS reference; not auto-imported by app
content/              # JSON/JSONC catalogs (drinks, bands, sfx manifests, etc.)
electron/             # main.cjs, preload.cjs
src/                  # React app: pages, theme, components, game/, dev playground
.devcontainer/        # Dockerfile, devcontainer.json, post-create.sh
compose.yaml          # optional plain Docker `dev` service
docs/                 # architecture, roadmaps (some Godot-era text may be stale)
.github/workflows/    # CI
```

Submodule init:

`git submodule update --init --recursive`

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
- **Integration:** Expand with Playwright or Electron test driver when flows stabilize.

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
- **`TO_PORT/`** is reference-only until code is copied or wrapped intentionally in `src/`.

## References

- **GOALS.MD** — Phase outcomes and what must work.
- **AGENTS.md** — Operational handoff (Dev Container, npm scripts, submodule).
