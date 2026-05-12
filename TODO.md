# TO DO

## Updates

- If a game has been paused, make sure the player can rejoin that game or abandon it. If abandoned, warn the player that they will not receive a payout and their buy in will be lost.

- When the player selects "Enter the Club" on the splash screen, zoom in to the red portion of the logo so that the entire screen is filled with red, and then fades out, showing the bar menu screen. When the logo is fading out, the bar menu screen should already be rendered behind the logo, adding flow and coheasion to the animation.

- During the animation - The red portion of the logo should draw in before the grey text. The red logo should flicker with a neon glow, the glow becomes brighter until the logo is filled with red, and then the glow fades out while the red fill in the logo remains. Then the grey letters fill in.

- Add the Logo to the top of the bar menu screen.

- Extreme Win quips should only activate when the player has come within 5% of the max win of a game.

- Extreme Loss quips should only activate when the player has lost 85% or more of their buy in.

## Fateseal Silver

Shipped in `src/minigames/fateseal-silver/` + `src/config/minigames/fatesealRules.ts` (see `Fateseal_Specs.md`).

- [x] Bonus spin rework — meter fires append in-spin cascade waves (same `runSpin`); transient bonus dead columns; grid grows by +1 row/col per append up to `bonusGrid.maxGridSize`; Sympathetic at configured ritual-fire count + UI overlay.
- [x] Linking — pow-based prophecy adjacency mult + config; non-prophecy orthogonal run length in config (`minOrthogonalRunForNonProphecyRemoval`).
- [x] Bonus scatter meter does not carry to the next player spin (`scatterMeter` reset after each composite spin).
- [x] Scatter pool weight tunable (`fatesealScatterSymbolPoolWeight`).
- [x] Bet chips — min / ⅛ / ¼ / ½ bankroll (under-min disabled); chips start the ritual.
- [x] Single sealed omen in shell (Crossroads can add extras per shop).
- [x] Purchased wild / dead / mark FIFO paid-spin timers + `bonusSpinsExcludeFromReelDecay`; column wild (left) / dead (right) on fills.
- [x] Larger ritual area + slower drop-in timing scale in CSS / `RITUAL_TIMING_SCALE`.
- [x] Side readout — stake, last spin total, meter, Crossroads progress, wild/dead timers, mark, active omens, recent lines.
- [x] Crossroads — scatter threshold 15 (config); full phase panel; new + legacy SKUs with config costs; once-per-visit flags where applicable.

Follow-up tuning (not blocking): **`npm run sim:fateseal`** — base-only (`FATESEAL_SIM_BASE_ONLY=1` + `forBaseRitualSim`) ≈ **90%** payout ÷ paid bet at `fatesealCascadePayoutScale` **0.00935** (seed `face1234`, 30k spins); re-run after economy changes. Richer column physics if product wants more than fill masks.