# Technical Specification: Fateseal Silver (Occult Cascading Slot)

## 1. Project Overview
**Title:** Fateseal Silver  
**Genre:** Occult Prophecy / Cascading Grid Slot  
**Core Hook:** A 5x5 grid where the player **prophesies** (bets on) specific symbols. Successes trigger cascading chain reactions. Every three spins, the player must navigate **"The Crossroads"** (Shop) to modify their deck/pool.

---

## 2. Narrative & Aesthetic Guide
* **Theme**: Dark Gothic, Ritualistic, Occult Noir.
* **Visual Palette**: Charcoal stone, shimmering silver, blood-crimson highlights, and void-black.
* **The "Dead" Symbols**: Represented as **"The Void"**—swirling, light-consuming holes in the stone tablet.
* **Soundscape**: Low-frequency thrums, rhythmic chanting that builds during cascades, and the sound of cracking stone.

---

## 3. Game Logic & State Machine

### A. The Symbol Pool (The Deck)
The game should maintain a `SymbolPool` (Array or Map). 
* **Standard Symbols**: 8-10 unique occult icons (e.g., **The Dagger**, **The Chalice**, **The Goat**, **The Eye**).
* **Special Symbols**: 
    * **Wilds**: Match any prophesied symbol.
    * **Scatters**: Collected to trigger the "Free Ritual" (Bonus Game).
    * **The Void (Dead Symbols)**: Occupy space, cannot be matched, and do not disappear during cascades.

### B. Phase I: The Prophecy (Betting)
Before the spin, the player must select their "Focus":
* **Single Focus**: Player picks **1 symbol**. Payout = **10x** Base Bet per instance.
* **Triple Focus**: Player picks **3 symbols**. Payout = **1x** Base Bet per instance of *any* of the three.

### C. Phase II: The Ritual (The Spin & Cascade)
1.  **Generation**: Fill 5x5 grid using weighted randomness from the `SymbolPool`.
2.  **Identification**: Locate all instances of the "Prophesied" symbols.
3.  **Payout**: Calculate `(Number of Matches * Multiplier) * CascadeMultiplier`.
4.  **The Burn (Removal)**: Matched symbols (and any standard 3-of-a-kind adjacent matches) are removed.
5.  **Gravity**: Remaining symbols shift to the lowest possible empty **y** coordinate in their column.
6.  **The Inflow**: New symbols from the `SymbolPool` drop into the empty top slots.
7.  **Recursion**: Repeat from Step 2 until no new matches exist.

---

## 4. The Crossroads (The Shop)
Triggered every **3 spins**. The player is presented with a choice of "Bargains":

| Bargain Type | Mechanic | Narrative Cost |
| :--- | :--- | :--- |
| **Faustian Bargain** | Grant immediate **LargeSum** of credits. | Add 3 **Void Symbols** to the `SymbolPool` permanently. |
| **Silver Vision** | Convert 1 standard symbol in the `SymbolPool` to a **Wild**. | Higher cost in credits. |
| **The Forbidden Tome** | Increase the probability of **Scatters** appearing for the next 3 spins. | Moderate cost in credits. |

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

###  Component Logic Tasks
evaluateGrid(): A recursive function that identifies matches, calculates payouts, and triggers the cascade state.

applyGravity(): A utility to shift non-null symbols to the bottom of the 2D array.

handleShop(): A function to modify the symbolPool based on player selection (e.g., symbolPool.push(...voidSymbols)).

Animation Hooks: The engine must wait for onCascadeComplete before allowing the next player action.

## 6. UX/UI Layout Instructions
Left Sidebar: The "Prophecy Altar" where players select their symbols.

Center: The 5x5 "Fateseal" stone tablet.

Right Sidebar: The "Ledger" showing current payout multipliers and the "Spins until Crossroads" countdown.

The "Void" Effect: When a Void symbol is rolled, it should have a subtle "pulling" animation, making nearby symbols vibrate.