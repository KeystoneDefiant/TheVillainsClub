# Project Specification: "7 Year Itch" (Crapless Craps Variant)

## 1. Concept & Narrative Meta-Layer
**Theme:** Mid-century Noir / Mafia Syndicate Management.
**The Drink:** *7 Year Itch* (A spicy, high-proof rye whiskey).
**Core Metaphor:** The game of Craps is re-imagined as a criminal enterprise.
* **The Dice:** The volatility of the underworld.
* **The Numbers (2-12):** Discrete business operations (Rackets).
* **The 7:** "The Bust" (A RICO Indictment/Police Raid).
* **The Point:** "The Crackdown" (The specific business currently under police surveillance).

---

## 2. The Game Loop (State Machine)

### Phase I: The Investigation (Come-Out Roll)
The player rolls to establish which business the police are targeting.
* **Roll a 7:** "The Clean Slate." The investigation is quashed. The player wins their initial stake and rolls again (No Point set).
* **Roll any other number (2, 3, 4, 5, 6, 8, 9, 10, 11, 12):** That number becomes **The Crackdown (The Point)**. The investigation is now a live case.

### Phase II: The Racketeering (Point Established)
The player continues to roll to collect "revenue" from their operations before the police (a 7) shut them down.
* **Hit The Point:** "Success." The targeted business completes its cycle. The player wins the main bet and the round resets to the Investigation Phase.
* **Hit a 7:** "The Bust." The round ends immediately. All active investments (bets) on the table are lost to the "Authorities."
* **Hit any other number:** "Business as usual." If the player has "invested" in that specific number, they receive a payout.

---

## 3. The Racket Hierarchy (Betting Layout)
Each number has a narrative identity and a risk/reward profile based on Crapless Craps math:

| Number | Operation | Risk | Payout Logic |
| :--- | :--- | :--- | :--- |
| **2 / 12** | Political Graft / High Commission | Extreme | Highest Payout (Rare hits) |
| **3 / 11** | Diamond Smuggling / Luxury Heists | High | High Payout |
| **4 / 10** | Union Extortion / Dockside Smuggling | Mid | Balanced |
| **5 / 9** | Speakeasies / Underground Casinos | Stable | Frequent Hits |
| **6 / 8** | Protection Rackets / Numbers Games | Low | Small, consistent gains |

---

## 4. Advanced Mechanics: Favors & Devil's Deals

### The "Favor" System (Progression)
* **Trigger:** Earned after X consecutive rolls without a 7.
* **The Look the Other Way:** A consumable "shield" that allows the player to ignore a single 7 (The Bust).
* **The Inside Man:** A temporary ability to re-roll one die.

### The "Devil’s Deal" (High-Stakes Modifiers)
Risk/reward modifiers that the player can "sign" at the start of any roll.
* **"The Kingpin’s Cut":** Triple the payout on one specific number, but a roll of 6 or 8 now results in a "Partial Seizure" (loss of 50% of the bet).
* **"Aggressive Expansion":** All non-7 rolls pay double, but a 7 now empties the player's total bankroll, not just the table bets.

---

## 5. UX & UI Requirements for Claude

### Visual Logic
* **The Point Tracker:** Should be represented as a **Police Case File** or a **Manila Folder** marked "OPEN" on the specific Crackdown number.
* **The "Heat" Meter:** A visual indicator that grows more intense the longer the player goes without rolling the Point or a 7.
* **Dice Interaction:** The dice should feel heavy and physical. Use a "Dark Amber" color palette to match the *7 Year Itch* whiskey theme.

### Feedback Loop
* **Win State:** Sound of coins clinking, jazz music swells, "The Feds missed us this time."
* **Loss State (7):** Police sirens, the sound of a door being kicked in, visual "shattering" of the UI elements.

---

## 6. Actionable Development Tasks for Claude
1.  **Engine Logic:** Create a `CraplessEngine` class that handles dice probability and State transitions.
2.  **Hook System:** Implement a middleware "Modifier" system so **Favors** and **Devil’s Deals** can intercept the dice result before the UI updates.
3.  **Simulation:** Run a 1,000-roll simulation script to ensure the "Devil's Deals" don't make the house edge impossible or too easy.
4.  **Integration Map:** Provide a schema for how this logic will communicate with the existing React UI (props, state, and event handlers).
