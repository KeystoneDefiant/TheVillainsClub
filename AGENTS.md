# AGENTS.md — The Villains Club

Handoff for humans and coding agents. **Goals:** `GOALS.MD`. **Technical plan:** `PLAN.md`. **Architecture sketch:** `docs/architecture.md`.

## Engine

- **Godot 4.3** (pinned for CI; match local editor to avoid import drift).
- **Language:** GDScript.
- **Main scene:** `res://scenes/main.tscn` (dev hall for phases 0–2).
- **Tests (headless):** `godot --path . --headless res://tests/test_runner.tscn`

## Repository layout

- `core/` — autoload singletons (economy, time, save, music).
- `content/` — JSON catalogs (`specials.json`, `loans.json`, `bands.json`); optional `content/audio/` clips referenced from `bands.json`.
- `games/` — minigames (empty until ports).
- `TO_PORT/` — JS reference via **git submodule** (see `TO_PORT/README.md`).
- `tests/` — `test_runner.tscn` entry for CI.

## Submodule

```bash
git submodule update --init --recursive
```

## After pulling changes

1. Open the project in Godot 4.3 (let it import once).
2. Run the main scene or headless tests.
3. If JSON or autoload behavior changed, extend `tests/test_runner.gd` and run tests.

## Save file

- Path: `user://villains_club_save.json` (OS user data; browser storage on web).
- **Version** field; migrations live in `core/save_service.gd` (`migrate`).

## Agent cycle checklist (when you touch behavior)

- [ ] Update this file if commands, Godot version, or entry scenes change.
- [ ] Update `docs/architecture.md` if autoloads or data contracts change.
- [ ] Add or adjust tests in `tests/test_runner.gd` for deterministic rules.
- [ ] Keep `content/*.json` valid JSON; invalid files break `GameState` at startup.

## Export (Phase 0 follow-up)

Create **export presets** in the editor (Windows, Linux, Web). CI currently runs **tests only**; release builds can be added to `.github/workflows/` once presets exist. Output directory is ignored via `.gitignore` (`export/`).

## Web caveats

- First **click** should precede or coincide with starting `AudioStreamPlayer` playback.
- Optional packs are **not** filesystem mods; use fetched `.pck` per `PLAN.md`.
