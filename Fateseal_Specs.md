# Technical Specification: Fateseal Silver (Occult Cascading Slot)

## 1. Project Overview

**Title:** Fateseal Silver  
**Genre:** Occult Prophecy / Cascading Grid Slot  
**Core Hook:** A 5x5 grid where the player **prophesies** (bets on) specific symbols. Successes trigger cascading chain reactions. When enough **scatter** symbols have appeared on the **final settled grid** (threshold in `fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop`, default 15 in the Villains Club build), the player opens **"The Crossroads"** (shop) to modify their pool and session — see §4.

---

## 2. Narrative & Aesthetic Guide

- **Theme**: Dark Gothic, Ritualistic, Occult Noir.
- **Visual Palette**: Charcoal stone, shimmering silver, blood-crimson highlights, and void-black.
- **The "Dead" Symbols**: Represented as **"The Void"**—swirling, light-consuming holes in the stone tablet.
- **Soundscape**: Low-frequency thrums, rhythmic chanting that builds during cascades, and the sound of cracking stone.

---

## 3. Game Logic & State Machine

### A. The Symbol Pool (The Deck)

The game should maintain a `SymbolPool` (Array or Map).

- **Standard Symbols**: 8-10 unique occult icons (e.g., **The Dagger**, **The Chalice**, **The Goat**, **The Eye**).
- **Special Symbols**:
  - **Wilds**: Match any prophesied symbol.
  - **Scatters**: Collected to trigger the "Free Ritual" (Bonus Game).
  - **The Void (Dead Symbols)**: Occupy space, cannot be matched, and do not disappear during cascades.

### B. Phase I: The Prophecy (Betting)

Before the spin, the player must select their "Focus":

- **Single Focus**: Player picks **1 symbol**. Payout = **10x** Base Bet per instance.
- **Triple Focus**: Player picks **3 symbols**. Payout = **1x** Base Bet per instance of *any* of the three.

### C. Phase II: The Ritual (The Spin & Cascade)

1. **Generation**: Fill 5x5 grid using weighted randomness from the `SymbolPool`.
2. **Identification**: Locate all instances of the "Prophesied" symbols.
3. **Payout**: Calculate `(Number of Matches * Multiplier) * CascadeMultiplier`.
4. **The Burn (Removal)**: Matched symbols (and any standard 3-of-a-kind adjacent matches) are removed.
5. **Gravity**: Remaining symbols shift to the lowest possible empty **y** coordinate in their column.
6. **The Inflow**: New symbols from the `SymbolPool` drop into the empty top slots.
7. **Recursion**: Repeat from Step 2 until no new matches exist.

---

## 4. The Crossroads (The Shop)

**Villains Club implementation:** Crossroads is a **dedicated in-game phase** (full-width panel in `App.tsx`, not a modal). It opens after the scatter-accumulation rule in §7 fires; the player returns to the **ledger** when they dismiss it.

**Credit shop (config `fatesealCrossroadsNewShop` + `crossroadsNextOmenAdditionCostCredits`):**

| SKU | Mechanic |
| :--- | :--- |
| **Add omen symbol** | Pay tiered credits (first purchase + step per extra); append a new standard to `activeProphecy` (cap: sealed omen + `maxPurchasesThisVisit` extras). |
| **Wild reel slot** | Pay credits; appends a FIFO paid-spin timer (`wildReelPaidSpinTimers`); leftmost *k* columns are forced wild on fills until timers expire. |
| **Dead reel boon** | Grants credits; appends FIFO timers (`deadReelPaidSpinTimers`); rightmost *k* columns are void on fills until timers expire. |
| **Omen mark** | Pay once while no mark is set; choose a symbol already in `activeProphecy`; cascade pays **`markedSymbolPayoutMultiplier`** when that standard appears in a prophecy hit (`fatesealProgressionRules.purchasedReels`). |

**Legacy bargains** (still in `fatesealCrossroadsOffers` / `applyCrossroads`): **Faustian Bargain** (credits + void pool weights), **Silver Vision** (cost + convert chosen standard’s pool entries toward wild for the session), **The Forbidden Tome** (cost + boosted scatter weight for N spins). In the shell, each legacy line is **once per Crossroads opening** alongside the new SKUs.

*Original pitch deck table:* “every three spins” and a smaller fixed set of bargains — superseded in this repo by the scatter gate + tables above.

---

## 5. Technical Implementation Requirements for AI Agent

### Data Structures
```typescript
interface GameState {
  grid: Symbol[][]; // 5x5 matrix
  symbolPool: Symbol[]; // Weighted list of possible drops
  activeProphecy: Symbol[]; // 1 or 3 selected symbols
  spinCount: number; // Counter for Shop trigger (mod 3)
  bankroll: number;
  multiplier: number; // Increases with each cascade
}
```

### Component Logic Tasks

- `evaluateGrid()`: A recursive function that identifies matches, calculates payouts, and triggers the cascade state.
- `applyGravity()`: A utility to shift non-null symbols to the bottom of the 2D array.
- `handleShop()`: A function to modify the symbolPool based on player selection (e.g. `symbolPool.push(...voidSymbols)`).
- **Animation Hooks**: The engine must wait for `onCascadeComplete` before allowing the next player action.

---

## 6. UX/UI Layout Instructions

- **Left Sidebar**: The "Prophecy Altar" where players select their symbols.
- **Center**: The 5x5 "Fateseal" stone tablet.
- **Right Sidebar**: The "Ledger" showing current payout multipliers and progress toward **Crossroads** (scatter symbols on the final settled grid vs. `fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop`).
- **The "Void" Effect**: When a Void symbol is rolled, it should have a subtle "pulling" animation, making nearby symbols vibrate.

---

## 7. Implementation notes (Villains Club build)

Authoritative tunables live in **`src/config/minigames/fatesealRules.ts`**. Deviations from the prose above (for session economy):

- **`fatesealCascadePayoutScale`** — Applied after the §3B–§3C payout expression (per cascade step). Tuned with **`npm run sim:fateseal`** so that with `FATESEAL_SIM_BASE_ONLY=1`, **payout ÷ paid base bet** lands near **90%** (house edge ~10% on the base ritual in isolation).
- **Scatter / Free Ritual** — Meter threshold and wild boost live in config. **TODO.md behavior:** each meter fire **appends bonus cascade waves** inside the same paid spin (extra rows/columns up to `fatesealProgressionRules.bonusGrid.maxGridSize`, transient bonus dead columns on the left, no banked “next spin free” charges). The engine still ticks the meter mid-cascade for **Sympathetic Vibrations** accumulation; `scatter_ritual_started` log lines are emitted only when a wave begins with a logged meter fire. **Sympathetic Vibrations** — when `fatesealProgressionRules.sympatheticVibrations.bonusRoundIndexTrigger` ritual grants occur in one composite spin, a lump **`payoutMultipleOfBaseBet` × base bet** is paid once and logged as `sympathetic_vibrations`. **Scatter meter remainder does not carry** to the next player spin (`scatterMeter` resets to 0 after each `runSpin`).
- **Crossroads** — Faustian credit ratio and legacy shop costs are the implementation source of truth; tune alongside the pool. **Villains Club:** Crossroads opens after **`fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop`** scatter symbols appear on the **final settled grid** per completed spin (v1 stand-in for “bonus symbols revealed” in TODO.md); remainder carries toward the next visit. **New SKUs:** **`fatesealCrossroadsNewShop`** + helpers in `src/minigames/fateseal-silver/engine/shopEngine.ts`. **Linking:** non–actively-prophesied standards need **five** orthogonally linked tiles (+ wild) to clear; prophecy hits add a **capped bonus** to the cascade step multiplier from prophecy–prophecy adjacency edges (`fatesealProgressionRules.linking`). Other backlog constants (Sympathetic Vibrations payout, purchased reel spin decay, bonus grid growth) live in **`fatesealProgressionRules`** in the same file.

Monte Carlo:

```bash
npm run sim:fateseal                       # full model
FATESEAL_SIM_BASE_ONLY=1 npm run sim:fateseal   # base ritual only (RTP scale check)
# If `tsx` is not on PATH in your shell, use:
# npx tsx scripts/sim-fateseal.ts
# FATESEAL_SIM_BASE_ONLY=1 npx tsx scripts/sim-fateseal.ts
```

**Harness snapshot (dev run, seed `face1234`, 30 000 spins, `fatesealCascadePayoutScale` = `0.00935`, current engine):** base-only sim (`FATESEAL_SIM_BASE_ONLY=1`, **`forBaseRitualSim`**) ≈ **90.4%** payout ÷ paid base bet; full model ≈ **90.4%** on the same harness profile (moon prophecy, no Crossroads purchases) — scatter volume is modest here so base and full align; use only as a regression fingerprint; tune with `fatesealCascadePayoutScale`, pool weights, and scatter cadence.
