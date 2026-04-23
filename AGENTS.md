# AGENTS.md — The Villains Club

Handoff for humans and coding agents. **Goals:** `GOALS.MD` (repo root). **Technical plan:** `PLAN.md` (includes **Current status** for milestones). **Architecture sketch:** `docs/architecture.md` (may lag the pivot; prefer `PLAN.md` + `src/`).

## Current status (read first)

- **Shell:** **Electron + Vite + React 18 + TypeScript** (`electron/`, `src/`). There is **no Godot project** in this tree anymore. If `PLAN.md` and **`package.json`** disagree on a dependency version, trust **`package.json`**.
- **What works:** Intro (`/`), main menu (`/menu`), bar stub (`/bar`), Mantine + Club theme, Framer Motion presets, dev-only **`/__playground`**, economy contract stubs in `src/game/` (club balance vs session buy-in — see `money.ts`).
- **Data / reference on disk:** **`content/`** catalogs (JSON/JSONC) are kept for future wiring; **`TO_PORT/`** is the **git submodule** JS reference (e.g. Oubliette), not auto-bundled until ported.
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
- **Quality:** `npm run lint` (covers `src/**/*.ts(x)`, `vite.config.ts`, `vitest.config.ts`), `npm run test`, `npm run typecheck`.
- **Tests (watch):** `npm run test:watch` — Vitest in watch mode during development.
- **Production bundle (renderer):** `npm run build`.
- **Preview built renderer:** `npm run preview` — serves the Vite production build locally (run after `npm run build`).
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

## Agent cycle checklist (when you touch behavior)

- [ ] Update **`PLAN.md` → Current status** when a milestone lands (container agents read it first).
- [ ] Update **this file** when run commands, ports, or devcontainer behavior change.
- [ ] Update **`docs/architecture.md`** when module boundaries or data contracts change.
- [ ] Add or adjust **Vitest** tests under `src/` for deterministic rules.
- [ ] Keep **`content/*.json`** valid JSON where the app parses them; JSONC files cannot be parsed by `JSON.parse` until converted or stripped.

## CI (GitHub Actions)

- **Push/PR:** `npm ci`, then **`npm run lint`**, **`npm run test`**, **`npm run typecheck`**, **`npm run build`** (see `.github/workflows/ci.yml`).

## Web / browser dev notes

- When using **`npm run dev:web`**, browsers may require a **user gesture** before audio unlocks; align first interaction with audio start when you wire SFX/music.
- Optional downloadable packs are **not** implemented in the Electron shell yet; treat `content/dlc_manifest.json` as future-facing data until a loader exists.
