# New game - Masterton 1881

## Concept

A Double Zero roulette game where the player is the croupier. The goal is to keep bettors involved and betting, but the player has the ability to rig the wheel in various ways to cause bettors to lose. The player keeps a percentage of what the house makes. The player has a limited amount of spins before their shift is over. When the player rigs the wheel, bettors will get wise to the fact that the game is rigged and will leave the table and reduce the amount other bettors at the table bet until their suspicion level drops.

The player can rig the wheel in a number of ways and the way they do it will affect how much suspicion is raised. The player can rig the wheel to stop on Red, Black, Even, Odd, 1-18, or 19-36 to raise a small amount of suspicion. The player can rig the wheel to stop on a column or a dozen, causing a medium amount of suspicion. Finally, the player can rig the wheel to stop on a specific number, causing a large amount of suspicion. If a bettor wins due to a rig, they will still become suspicious, but only 40% of what they would have if they had lost.

## Logic and Rules

There can be a maximum of 4 bettors at the table at any given time. THe starting amount of bettors is randomized between 1-4. Each bettor will use a different betting strategy - D'Lambert, Martingale, Random Bets, Random 1:1 bets, Hedges, Low Risk Grinds, and High Risk. Each bettor will come to the table with a random amount of chips between 5,000 and 200,000. Each bettor will have a hidden set of stats that determine their maximum suspicion (4-10), how much they're willing to lose overall (Random number between 50% and 100%), how many times in a row they're willing to lose before they leave (random number between 2-10), how often they will double their bet size (0-100%), and how apt they are to leave if another player leaves the table due to suspicion (0-100%).

The player has 30 spins to make as much money for the house as possible by causing bettors to lose. The table's total win/loss is tracked. At the end of the session, the player will earn a percentage of the total winnings from the house. If the player breaks even or loses money, they lose their buy-in to the game.

To start, the player will earn back 10% of what they make. For every quarter of their total spins, they will add an additional 5% to that payout percentage. If no bettors are at the table, a final random check is made where the player has a 25% chance of getting a single bettor to show up.

If a bettor leaves the table, every spin, there is a 15% chance a new player will fill a seat. Only one seat will be filled at a time.

Suspicion levels have an initial base number - low suspicion rigging will inflict 2 points of suspicion, medium suspicion rigging will inflict 3 points of suspicion, and high suspicion rigging will inflict 5 points of suspicion. If a bettor wins on a rigged spin, they will only amass 40% of the suspicion that they otherwise would have, rounded down but a minimum of 1. The suspicion values increase by 20%, rounded up, for each rigged spin done in a row.  

## Development Notes

- All percentages and variables will be expressed in a configuration file, much like the rest of the games in this project.

- The game will have a fully working double zero roulette layout and a working roulette wheel that animates during the spin.

# Technical Specification: Masterton 1881 (Reverse Roulette Rigging Sim)

## 1. Project Overview
**Title:** Masterton 1881  
**Genre:** Reverse Casino Management / Probability Manipulation  
**Core Hook:** The player acts as a corrupt Croupier running a Double Zero (0, 00) Roulette table. The objective is to maximize House revenue over a fixed shift (30 spins) by secretly rigging the wheel outcomes, while carefully balancing individual bettor suspicion to prevent the table from emptying.

---

## 2. Configuration Schema (`src/config/minigames/mastersonRules.ts`)
All gameplay variables must be decoupled from the core logic component. The AI agent must instantiate the game state utilizing a structural configuration matching this schema:

```json
{
  "shift_duration_spins": 30,
  "max_bettors": 4,
  "base_commission_pct": 10.0,
  "quarter_commission_bonus_pct": 5.0,
  "seat_fill_chance_per_spin": 0.15,
  "empty_table_last_chance_pct": 0.25,
  "consecutive_rig_suspicion_multiplier": 1.20,
  "rig_win_suspicion_scalar": 0.40,
  "no_rig_suspicion_decrease": 1,
  "rig_types": {
    "low":  {"suspicion": 2, "targets": ["Red", "Black", "Even", "Odd", "Low_1_18", "High_19_36"]},
    "mid":  {"suspicion": 3, "targets": ["Column_1", "Column_2", "Column_3", "Dozen_1", "Dozen_2", "Dozen_3"]},
    "high": {"suspicion": 5, "targets": ["Specific_Number"]}
  }
}
```

---

## 3. Game State & Data Structures

### A. Bettor Profiles
Every active bettor entity instantiated in the state must track the following parameters:
* `id`: unique identifier (Seat 1-4).
* `strategy`: One of `['D_Alembert', 'Martingale', 'Random', 'Random_1_1', 'Hedges', 'Low_Risk_Grind', 'High_Risk']`.
* `chips`: Integer between `5,000` and `200,000`.
* `initial_chips`: Captured at spawn to track net losses.
* `max_suspicion`: Threshold Integer `[4-10]`.
* `current_suspicion`: Integer (starts at 0).
* `loss_tolerance_pct`: Float `[0.50 - 1.00]` (Leaves if `current_chips <= initial_chips * (1 - loss_tolerance_pct)`).
* `max_consecutive_losses`: Integer `[2-10]`.
* `current_consecutive_losses`: Integer counter.
* `double_bet_frequency`: Float `[0.00 - 1.00]`.
* `herd_mentality_pct`: Float `[0.00 - 1.00]` (Chance to cascade-leave when another bettor quits due to suspicion).

---

## 4. Precise Game Loop Sequence (Per Spin Lifecycle)

For every spin execution, the system engine must process states strictly in the following chronological order:

```
[1. Bet Phase] -> [2. Player Rig Selection] -> [3. Wheel Roll] -> [4. Evaluation] -> [5. Suspicion Calc] -> [6. Morale Check] -> [7. Upkeep & Spawning]
```

### Step 1: Bet Phase
* Call individual AI strategy algorithms for all active bettors. 
* Bettors place chips onto the standard Double Zero layout coordinates based on their system.
* Deduct bet totals from bettor balances and add to the table's active handle.

### Step 2: Player Rig Selection
* Player selects either a **Fair Spin** or defines a **Rig Constraint Target** (Low, Medium, High categories).

### Step 3: Wheel Roll
* **If Fair:** Select random index from standard Double-Zero wheel arrays (`0, 00, 1-36`).
* **If Rigged:** Filter standard wheel array to numbers validating the player's Rig Constraint Target. Randomly select an index *only* from that filtered subset. Run wheel rotation animation ending on target outcome.

### Step 4: Evaluation & Payout
* Evaluate table layout bets against the final outcome.
* Standard roulette payout odds apply. Disburse payouts to winning bettors. Net losing chips directly to the Table House Ledger.

### Step 5: Suspicion Calculation
If a Rig Constraint was applied, update suspicion values using the following evaluation formula:

$$	ext{Base Suspicion} = 	ext{Rig Severity Suspicion (2, 3, or 5)}$$
$$	ext{Consecutive Streak Multiplier} = \lceil 	ext{Consecutive Rig Count} 	imes 1.20 
ceil$$
$$	ext{Total Target Suspicion} = 	ext{Base Suspicion} + 	ext{Consecutive Streak Multiplier}$$

* **If Bettor Lost on Rigged Spin:** `bettor.current_suspicion += Total Target Suspicion`
* **If Bettor Won on Rigged Spin:** `bettor.current_suspicion += Max(1, Math.floor(Total Target Suspicion * 0.40))`
* *Note: If a Fair Spin is executed, decrement all active bettors' `current_suspicion` values by no_rig_suspicion_decrease.*

### Step 6: Morale & Table Evection Evaluation
Check abandonment parameters for each bettor in seat order:
1. **Suspicion Breach:** If `current_suspicion >= max_suspicion`, bettor leaves table immediately.
2. **Financial Exhaustion:** If current chip count falls below their calculated `loss_tolerance_pct` floor, bettor leaves.
3. **Frustration Limit:** If `current_consecutive_losses >= max_consecutive_losses`, bettor leaves.
4. **Herd Cascade:** If a bettor leaves due to **Suspicion Breach**, evaluate all remaining players: Roll random probability against their individual `herd_mentality_pct`. If passed, they immediately pack up and exit.

### Step 7: Upkeep & Payout Scaling
* **Spin Counter Advancement:** `spinCount++`.
* **Dynamic Commission Update:** Base Commission rate is `10%`. At Spin 8, 15, and 23 (each quarter threshold of the 30-spin game loop), increase the player's session commission take by an additional `+5%` sequentially.
* **Seat Replenishment Checks:** * If active table seats < 4, roll a `15%` random chance. If true, instantiate exactly one new randomized Bettor Profile into an open seat.
    * If table count == 0 on Spin 30, trigger a final fallback isolation check: Execute a singular `25%` probability roll to forcefully spawn one new bettor for immediate table preservation.

---

## 5. UI/UX & Integration Map

### Presentation Components Required
* **The Dashboard Layout:** Fixed Left-to-Right orientation mapping the Betting Layout Matrix, the Physics-simulated or animated Wheel Module, and the interactive Croupier Rigging Control Deck.
* **The Seat State Monitors:** 4 fixed panels displaying visible Name, Strategy Type, and Current Bankroll.
* **The Suspicion Element:** Displayed via a covert visual gauge (e.g., an unpolished whiskey glass tracking condensation levels, or a subtle card under the table) revealing `current_suspicion` values to the player.
* **House Total Ledger:** Persistent counter tracking total net House Win/Loss margins and the player's real-time accumulated personal commission cut.

---

## 6. AI Agent Prompt Directives
> "Claude/Gemini, build a modular React implementation of 'Masterton 1881' parsing the architecture file above. Implement the logic loop cleanly inside a isolated custom core hook `useMastertonEngine`. Ensure all math formulas for suspicion ramping and betting strategies scale from the decoupled JSON configuration profiles. Decouple components so the calculation cycles update independently of the Canvas/CSS wheel animation ticks."
