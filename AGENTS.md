# AGENTS.md — The Villains Club

Handoff for humans and coding agents. **Goals:** `GOALS.MD` (repo root). **Technical plan:** `PLAN.md` (includes **Current status** for milestones). **Architecture sketch:** `docs/architecture.md` (may lag the pivot; prefer `PLAN.md` + `src/`).

## Expectations for every coding-agent run

Each agent session that does more than a trivial typo-only pass should **before finishing** update everything that applies. Skip an item only when the change genuinely does not touch it (say so briefly in the handoff).

1. **`AGENTS.md`** — When commands, ports, devcontainer behavior, CI, Playwright/Electron flows, or agent-facing expectations change, update this file so the next run matches reality.
2. **Documentation** — When behavior, milestones, or contracts shift: **`PLAN.md` → Current status** (and other `PLAN.md` sections as needed); **`docs/architecture.md`** when module boundaries or data flow change; any other doc the work makes wrong or obsolete. Do not add new markdown files unless the user asked for them.
3. **Tests** — Add or adjust **Vitest** for deterministic logic you change; add or extend **Playwright** when shell routing, menu/bar flows, or other CI-critical journeys change. Run **`npm run lint`**, **`npm run test`**, and **`npm run typecheck`** when you touched code; run **`npm run test:e2e`** when the production build or those journeys may be affected.

### Tests and tunable values

When a number or string is defined in app **settings / config** (for example `src/config/villainsGameDefaults.ts`, `src/config/minigames/oublietteNo9GameRules.ts`, or other exported defaults), **tests should import and use that value** instead of duplicating a magic number, **when the test is asserting or driving behavior tied to that setting**. Pure math fixtures (synthetic profiles, edge-case shapes) may still use small literals if they are not meant to track production defaults—prefer deriving expected results from the same config object when the assertion would otherwise drift.

The **Agent cycle checklist** below is the same bar, itemized.

## Current status (read first)

- **Shell:** **Electron + Vite + React + TypeScript** (`electron/`, `src/`). There is **no Godot project** in this tree anymore.
- **What works:** Intro (`/`), main menu (`/menu`), club floor / bar (`/bar` — **table buy-ins and minigame starts live here**, not on `/menu`), Mantine + Club theme, Framer Motion presets (honors **`prefers-reduced-motion`** on shell routes), **`/__playground`** (UI lab; linked from menu and bar), economy contract stubs in `src/game/` (club balance vs session buy-in — see `money.ts`). Settling **Oubliette** or **7 Year Itch** returns you to **`/bar`** with a short recap when the shell passes router state. **7 Year Itch** plan: **`7YI_plan.md`**; implementation under `src/minigames/seven-year-itch/`. **Audio:** main menu Settings + **`clubAudioStore`** own music/SFX toggles and volumes; Oubliette reads that store for **SFX only** (no in-minigame audio panel, no Oubliette BGM player). **House band** from the shell keeps playing during minigames (same HTMLAudioElement as menu/bar).
- **Data / reference on disk:** **`content/`** catalogs (JSON/JSONC) are kept for future wiring; **`TO_PORT/`** is the **git submodule** legacy JS tree (Oubliette source of truth was copied into `src/minigames/oubliette-no9/` — treat `TO_PORT/` as reference only unless syncing upstream).
- **Where to look next:** `PLAN.md` → **Current status** → **Immediate next steps** (persistence, bar flow, first minigame host, audio, architecture doc refresh).

## Dev container (no local Node)

- **Cursor / VS Code:** install Dev Containers, then **Dev Containers: Reopen in Container**. Image: Node 22 + Debian libraries for Vite, Vitest, and Electron (see **`.devcontainer/`**).
- **After create:** `post-create` runs `npm ci` (see `.devcontainer/post-create.sh`) and attempts `git submodule update --init --recursive` for `TO_PORT/`.
- **Web shell (no Electron window):** `npm run dev:web` → open forwarded **http://localhost:5173** (Vite listens on all interfaces).
- **Full Electron:** `npm run dev` — needs a display (WSLg, Linux desktop, macOS, or X11). Headless remote: use `dev:web` or `npm run build` / `npm test`.
- **Docker only:** from repo root, `docker compose up -d dev` then `docker compose exec dev npm run dev:web` — details in [`.devcontainer/README.md`](.devcontainer/README.md).

## Electron + React (commands)

- **Install:** `npm ci` (preferred) or `npm install`.
- **Dev (Vite only):** `npm run dev:web` — best inside containers or without a GUI.
- **Dev (Electron + Vite):** `npm run dev` — starts Vite on **5173** and opens Electron when the dev server is ready.
- **Quality:** `npm run lint`, `npm run test`, `npm run typecheck`. **`npm run test:e2e`** runs a **production `vite build`** then Playwright against `vite preview` (CI uses the same script).
- **Production bundle (renderer):** `npm run build`.
- **Packaged desktop (local):** `npm run pack` or `npm run dist` (requires a full toolchain for `electron-builder` targets you enable).

## Repository layout (current)

- **`src/`** — React app: `pages/`, `components/`, `theme/`, `motion/`, `game/`, `dev/` (playground).
- **`electron/`** — `main.cjs`, `preload.cjs` (extend `contextBridge` deliberately).
- **`content/`** — JSON/JSONC catalogs (drinks, bands, sfx, modes, etc.); validate before relying on them at runtime (JSONC needs stripping or conversion in the browser).
- **`TO_PORT/`** — git submodule; JS reference ports (see `TO_PORT/README.md`).
- **`.devcontainer/`**, **`compose.yaml`** — containerized dev environment.

## Submodule

```bash
git submodule update --init --recursive
```

## After pulling changes

1. `npm ci` (or reopen the Dev Container so `post-create` runs).
2. `git submodule update --init --recursive` if you use `TO_PORT/`.
3. `npm run lint` and `npm run test` before pushing substantive UI or game logic changes.

## Save / persistence (legacy notes + direction)

- **Legacy (Godot):** Older branches used `user://villains_club_save.json` with versioned migrations; that implementation is **not** in this tree.
- **Current / TODO:** Persist settings and club progress via **Electron `userData`** (or equivalent) with a **versioned JSON** schema and migrations — wire into `clubWalletStore` and settings UI when implemented.

## Agent cycle checklist (every run — when applicable)

- [ ] Update **`PLAN.md` → Current status** when a milestone lands or direction changes materially (container agents read it first).
- [ ] Update **`AGENTS.md`** (this file) when run commands, ports, devcontainer behavior, CI, or agent expectations change.
- [ ] Update **`docs/architecture.md`** when module boundaries or data contracts change.
- [ ] Add or adjust **Vitest** tests under `src/` for deterministic rules and regressions you might introduce.
- [ ] Add or adjust **Playwright** (`e2e/`) when shell routing, menu/bar/minigame entry, or other user journeys you rely on in CI change.
- [ ] Run **`npm run lint`**, **`npm run test`**, **`npm run typecheck`** before handoff when code changed; run **`npm run test:e2e`** when a production build or those journeys may break.
- [ ] Keep **`content/*.json`** valid JSON where the app parses them; JSONC files cannot be parsed by `JSON.parse` until converted or stripped.

## CI (GitHub Actions)

- **Push/PR:** `npm ci`, then **`npm run lint`**, **`npm run test`**, **`npm run typecheck`**, **`npm run build`**, Playwright smoke, **Electron** packaging on Ubuntu / Windows / macOS (`dist:electron:*`, unsigned), and on pushes to the **default branch** a **GitHub Pages** deploy (see `.github/workflows/ci.yml`).
- **Pages setup:** Repository **Settings → Pages**: set **Build and deployment** source to **GitHub Actions** (not “Deploy from a branch”). The site is built with `VITE_BASE=/<repository-name>/` so asset URLs and `BrowserRouter` match project Pages (`https://<user>.github.io/<repo>/`). SPA deep links use **`404.html`** copied from `index.html` in CI.
- **Local desktop installers:** `npm run dist` (Windows **NSIS** in `package.json`); CI uses **`dir`** targets for speed and to avoid signing.

## Web / browser dev notes

- When using **`npm run dev:web`**, browsers may require a **user gesture** before audio unlocks; align first interaction with audio start when you wire SFX/music.
- Optional downloadable packs are **not** implemented in the Electron shell yet; treat `content/dlc_manifest.json` as future-facing data until a loader exists.
