# THE VILLAINS CLUB — Goals

Overarching vision and **what must work for each phase to count as complete**. Technical stack, layout, CI, and implementation detail live in **PLAN.md**.

---

## Vision (unchanging)

- A **members-only bar** front end for **multiple minigames**: noir, art deco, dark, foreboding, refined.
- Each minigame is a **drink you order** — flow: order → preparation (loading) → play → return to the bar with outcomes.
- Ports come from JS originals in **`TO_PORT/`** (submodule), with **large UI rewrites** and **performance/architecture improvements**; shipped UI matches this product, not the old web look.
- **Unlockables:** dice and card skins, music tracks, bar adornments; **meta-unlocks** that affect odds; **nightly specials** (24h) with benefits and risks.
- **Music:** bands “playing tonight” — soundtrack rotates every 24h; **5–10 songs** per band, **interlude every 2–3 songs**, including breaks.
- **Credits:** shared pool across games; each game has **max wager bring-in** and **max payout** from that wager; **daily credit infusion**; **loans** grant credits with a **playful or devious** 24h debuff/restriction.
- **Brand:** colors, logos, logotype, voice — see `_examples/Villain's Club.ai`. UI: smooth, filigree/damask, deep texture, moody noir — relaxed but dangerous.
- **Audience:** English at launch; **i18n** is a later nice-to-have.
- **Optional later:** Drop-in as “management” to grant a buff (no required online for core play). **Cheats menu** for credits/testing and for players short on time.
- **Platforms:** Native builds (Windows, Linux, mobile, macOS when viable) plus a **web** build (HTML5/WASM) so the bar is playable in a browser from the same Godot project, within **PLAN.md** web constraints (load size, DLC via fetch, saves in browser storage).

---

## Phase completion — what needs to work

### Phase 0 — Project foundation

- Godot project opens cleanly; folder layout matches **PLAN.md** (or documented deltas).
- At least **one desktop platform** exports successfully (e.g. Windows or Linux).
- **Web export preset** exists and produces a runnable build locally (even if art is placeholder); known **web caveats** (audio gesture, threading/headers if applicable) are noted for the team.
- **`TO_PORT/`** submodule documented: how to clone/update it.

### Phase 1 — Persistence and economy core

- **Save/load** survives app restart; **schema versioning** path exists for future migrations.
- **Credits** display and update correctly from a single source of truth.
- **Local calendar day** drives eligibility for **daily credit infusion** (behavior defined and testable).
- **Cheats or debug path** can grant credits (and optionally advance day) for QA.

### Phase 2 — Specials, loans, band rotation

- **Daily specials** change with the day; effects are **data-driven** and apply to the bar/games as designed.
- **Loans:** player can take a loan, receive credits, and suffer the defined **restriction/debuff** until it expires (24h model).
- **Band of the day:** correct playlist for the current day; **interludes** and **breaks** play at the configured cadence.

### Phase 3 — Bar experience and drink flow

- Player can **browse drinks**, see locked/unlocked state, and **order** a drink.
- Full loop: **order → transition → loading/preparation → game scene → return to bar** with **payout/credit update** (real minigame or **stub** acceptable for this phase).
- Visual direction aligns with brand references (even if art is placeholder).

### Phase 4 — First minigame (shippable)

- **One** minigame from **`TO_PORT/`** is ported: logic sound, **new UI** consistent with the bar.
- **Wager cap** and **max payout** rules enforced and reflected in credits on exit.
- **Automated tests** cover the minigame rules you care to guarantee.

### Phase 5 — Unlockables and meta

- At least one path to **earn or display** unlockables (skins, tracks, or adornments — not all types required at once).
- **Meta-unlocks** can change odds or outcomes in at least one minigame through a defined, testable contract.

### Phase 6 — DLC and community packs

- Game loads **optional `.pck`** (or equivalent) content using a **manifest**; new drinks/games can register without rebuilding the entire core.
- **Mod/community** drop-in path documented for **native** (folder, format, limitations) and for **web** (fetched packs / curated URLs per **PLAN.md**).

### Phase 7 — CI and releases

- **GitHub Actions** run tests on PR/main and **build** artifacts.
- **Releases** publish built binaries (per platform as far as signing and runners allow), including a **web build artifact** (zip of export) when the pipeline supports it.
- **Agent handoff** is usable: **AGENTS.md** + pointers to architecture, tests, and open work (see **PLAN.md**).

### Phase 8 — Launch scope

- **Three** minigames playable end-to-end from the bar, each honoring economy and unlock contracts.
- **Polish** pass on bar UI, transitions, and audio balance.
- **Steam / store** integration deferred unless already in scope — **PLAN.md** covers `.pck` first, Steam later.

---

## Done = launch bar experience

The product is **complete for this roadmap** when Phases **0–8** are satisfied: bar, **three** games, credits, save, specials, loans, band rotation, unlock/meta pipeline, DLC hook (native + web-appropriate loading), **shippable web export** alongside other targets, CI/releases, and documentation sufficient for agents and humans to continue work.
