# Architecture (Phases 0–2)

## Autoload order

Defined in `project.godot`:

1. **DayCycle** → `core/day_cycle.gd` — effective local date string; `debug_calendar_offset_days` for QA.
2. **SaveService** → `core/save_service.gd` — `user://villains_club_save.json`, version + migration.
3. **GameState** → `core/game_state.gd` — credits, daily stipend, `content/specials.json`, `content/loans.json`, loan expiry (real-time unix).
4. **MusicDirector** → `core/music_director.gd` — `content/bands.json`, band picked by hash of bar date; playlist with interludes/breaks; optional `AudioStreamPlayer` or timer fallback.

## Data flow (simplified)

```mermaid
flowchart LR
  subgraph persist [Persistence]
    SaveService
  end
  DayCycle --> GameState
  SaveService --> GameState
  GameState --> SaveService
  DayCycle --> MusicDirector
  GameState -->|"get_* modifiers"| MinigamesLater[Minigames later]
```

## Minigame contract (next phases)

Minigames will read **payout** and **max wager** multipliers from `GameState` (`get_special_modifier_product()`, `get_max_wager_multiplier()`) and report outcomes back for credit updates.

## Web notes

Saves use `user://` (browser storage on HTML5). House music should start after a **user gesture** (“Enter bar” in the dev UI).
