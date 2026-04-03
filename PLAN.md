# The Villains Club — Technical implementation plan

This document describes **how** the project is built and operated. Overarching outcomes and phase completion are in **GOALS.MD**.

## Engine and language

- **Engine:** Godot 4.x (pin an exact minor version in `AGENTS.md` and match CI export templates).
- **Language:** **GDScript** as the default for gameplay, UI, and tools unless the team explicitly commits to C# and its export/toolchain overhead (especially mobile).
- **Reference sources:** JavaScript originals live in **`TO_PORT/`** as a **git submodule**. Ports are new Godot implementations; do not embed a JS runtime in shipping builds.

## Platforms

Target every platform Godot supports that the team can sign and maintain:

- **Desktop:** Windows, Linux; add **macOS** if Apple developer signing/notarization is available.
- **Mobile:** Android, iOS (certificates, provisioning, store policies).
- **Web:** **HTML5 / WebAssembly** export — same Godot project and (ideally) same gameplay code paths as native; ship via static hosting (itch.io, GitHub Pages, your own CDN, etc.).

Use **export presets** per platform; document required secrets (keystore, API keys) outside the repo.

### Web-specific implementation notes

- **Performance and size:** Web builds are **larger downloads** and typically **more CPU/GPU constrained** than desktop; cap initial load (texture audio compression, lazy loading where Godot allows), and profile minigames on mid-tier laptops in Chrome/Firefox/Safari.
- **Threads:** Depending on Godot version and export settings, the web player may be **single-threaded** or require specific **COOP/COEP** (and related) headers on the host. Treat **threading and worker assumptions** as a web compatibility checklist, not identical to desktop.
- **Persistence:** `user://` on web maps to **browser storage** (persistent across sessions when storage is not cleared). Same **save schema and migration** logic as native; avoid assuming a real filesystem path.
- **Input:** Touch, pointer, and **keyboard focus** (fullscreen, canvas focus) differ from native; bar UI should remain usable with mouse, touch, and common gamepad mappings where you support them elsewhere.
- **Audio:** Browsers enforce **user-gesture** rules for starting audio; ensure the first tap/click can **unlock** the audio bus (Godot often handles this if UX starts from a clear “enter bar” / play action).
- **DLC and mods on web:** There is no arbitrary `mods/` folder like on disk. Plan **HTTP(S) fetch** of optional `.pck` (or split asset bundles) into a web-safe location, then load via Godot’s documented **pack loading** APIs, with **CORS** and **hosting** documented. Community mods may be **URL-based** or **curated packs** only unless you build a workshop-style pipeline later.
- **“Management favor” / optional online:** Web builds are already **URL-delivered**; optional session features align naturally, but still keep **core play** working **offline** via **PWA** / **service worker** caching only if you explicitly invest in that (otherwise web implies network for first load).

## Repository layout (suggested)

```
TO_PORT/              # git submodule — JS reference only, not shipped
games/                # one folder per minigame (scenes, resources, tests)
core/                 # autoloads, bar shell, economy, time, save, unlocks
content/              # data: drink catalog, specials, bands, loan rules
dlc/                  # optional pack projects, manifests, build notes
addons/               # third-party plugins, shared editor tools
docs/                 # architecture, modding, i18n notes
.github/workflows/    # CI
```

Initialize the submodule in onboarding and in `AGENTS.md`:

`git submodule update --init --recursive`

## Architecture

### Autoloads (conceptual)

| Area        | Responsibility |
|------------|----------------|
| Game state | Credits, profile, unlock flags, active modifiers |
| Time / day | Local calendar day boundary, “bar date,” daily infusion eligibility |
| Save       | Serialize/deserialize, versioning, migration |
| Audio      | Band-of-the-day, playlists, interludes, buses |
| Content    | Load catalogs; merge DLC/mod manifests |

### Offline-first vs optional online

- **Required:** No network to play. All progression, specials, loans, and audio rotation work locally.
- **Optional (later):** “Management favor” (remote admin buff) is a **separate module**: session discovery, auth, and transport (LAN, relay, or store-specific) must not block the offline path.

### Cheats / debug

- **Cheats menu:** Grant credits, optional day skip for QA; accessible in dev builds or via explicit player-facing toggle (product decision). Keep logic shared with tests where possible.

### Daily systems

- **Clock:** **Local system time**; document cheatability as acceptable for non-competitive play.
- **Specials:** Data-driven rules keyed to calendar day (or rolling 24h from a stored anchor if you switch models — document in `docs/architecture` if so).
- **Loans:** Grant credits; apply timed debuff/restriction until expiry; persist in save.
- **Band rotation:** Per-day band id → playlist (5–10 tracks); interlude every 2–3 tracks; breaks as configured in data.

### Economy

- Rolling **credits** across games.
- Per game: **max bring-in (wager cap)** and **max payout** derived from wager (rules per minigame, validated in tests).
- **Daily credit infusion** once per local day (or as designed).

### Minigame integration contract

Each game should expose a small, testable surface, for example:

- Entry: current credits, allowed wager range, active meta-modifiers.
- Exit: outcome, payout, optional unlock triggers (data only; core applies unlock rules).

Use a **factory or registry** so DLC can register new drink ids without editing core code beyond manifest merge.

## DLC, mods, and Steam

- **v1:** **`.pck`** (or Godot’s documented add-on pack flow) with a **manifest** (id, version, dependencies, contributed drinks/games/assets).
- **Load order (native):** Core → official packs → optional `mods/` directory (path documented; unsigned community content is opt-in).
- **Load order (web):** Core WASM + main pack; optional packs via **fetched** `.pck` URLs (see **Web-specific implementation notes**). Same **manifest schema** as native where possible.
- **Later:** Steam depot/DLC integration; keep manifest schema stable so Steam builds wrap the same pack format.

## Persistence

- **Format:** Versioned JSON or Godot-config-style files under **`user://`**; **migration** functions per save version. On web, `user://` is backed by the browser’s persistent storage for the origin.
- **Scope:** Credits, unlocks, loan state, last processed day, audio/band state, per-game stats if needed.

## Internationalization

- **v1:** English strings; use **string keys** (e.g. `tr("drink.oubliette.name")`) or CSV/gettext workflow early to avoid a full string sweep later.

## Testing

- **Framework:** One chosen stack (e.g. **GdUnit4**) for the whole repo.
- **Unit tests:** Economy, daily rollover, specials selection, loan expiry, playlist/interlude logic, save migration.
- **Integration:** Bar → stub game → return with credit update; minimal scene tests where stable.
- **Per-game tests:** Cover documented rules (inputs → outcomes), not necessarily every UI path.

## CI (GitHub Actions)

- **On push/PR:** Run tests headless (Godot `--headless` or project’s test command).
- **On tag (or workflow_dispatch):** Export builds for platforms you can produce on runners (typically Windows + Linux first); upload artifacts to **GitHub Releases**.
- **Web:** Add an export job that produces **`index.html` + `.wasm` + `.pck` + JS glue** (zip for upload to itch.io, static host, or **GitHub Pages**). Validate with a **smoke checklist** (load, save, audio unlock, one minigame) in a real browser.
- **Mobile:** Add jobs when signing secrets exist (often separate protected workflows).

Cache Godot binaries and export templates where practical.

## Agentic development

- **`AGENTS.md`:** Current state, pinned Godot version, submodule steps, how to run tests and builds, links to architecture and open work.
- **`.cursor/rules` (optional):** Non-negotiables mirrored for editor agents.
- **Issues / project board:** Source of truth for todos, bugs, enhancements; `AGENTS.md` summarizes and links rather than duplicating every ticket.
- **Living docs:** `docs/architecture.md` (text or Mermaid); update when boundaries change.
- **Each cycle:** Update `AGENTS.md` when behavior or commands change; add/adjust tests for specified behavior; note optimizations in a short backlog section or Issues.

## Brand and UI implementation

- Visual reference: `_examples/Villain's Club.ai` (and exported assets as they are added to the repo).
- Implement **design tokens** (colors, type, spacing) in one place; favor textures/nine-slices for filigree and damask; consistent lighting/mood pass on bar scenes.

## Security and scope

- No secrets in git; use CI secrets for signing.
- Submodule is **read-only reference** for implementers; Godot game code does not execute arbitrary JS from `TO_PORT/`.

## References

- **GOALS.MD** — Phase outcomes and “what must work.”
- **AGENTS.md** — Operational handoff (create/update as the project starts).
