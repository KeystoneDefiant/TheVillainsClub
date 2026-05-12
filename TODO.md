# TO DO

## Updates

- If a game has been paused, make sure the player can rejoin that game or abandon it. If abandoned, warn the player that they will not receive a payout and their buy in will be lost.

- When the player selects "Enter the Club" on the splash screen, zoom in to the red portion of the logo so that the entire screen is filled with red, and then fades out, showing the bar menu screen. When the logo is fading out, the bar menu screen should already be rendered behind the logo, adding flow and coheasion to the animation.

- During the animation - The red portion of the logo should draw in before the grey text. The red logo should flicker with a neon glow, the glow becomes brighter until the logo is filled with red, and then the glow fades out while the red fill in the logo remains. Then the grey letters fill in.

- Add the Logo to the top of the bar menu screen.

- Extreme Win quips should only activate when the player has come within 5% of the max win of a game.

- Extreme Loss quips should only activate when the player has lost 85% or more of their buy in.

## Fateseal Silver

- Bonus spin rework:
    - When a free spin is achieved, add the spin onto the current spin. This does not make the next spin free, it simply appends a free spin on to the current spin. This resolves after the current spin is complete.
    - For every extra spin round achieved, a dead reel is added. This reel is removed at the end of all bonus spins. For instance, when the bonus spin starts, 1 dead reel is added. If another bonus spin is earned, the next bonus spin will have 2 dead reels, etc. After all of these bonus spins are completed, the dead reels added are removed Any dead reels that the player has accrued via other means are retained.
    - Each bonus spin adds an extra row and column to the grid. Subsequent bonuses will continue to add another row and grid.
    - The player can earn 3 bonus spins in a single round. If a 4th bonus round is achieved, this activates a status called "Sympathetic Vibrations", which pays out 75x the bet amount. When this happens, an animation showing "The Spirits Have Received Your Sympathetic Vibrations" as a large, glowing text banner that pops over the game, with the bonus payout shown under the text. After 4 seconds, this animation fades from view.

- Rework symbol linking:
    - Selected symbols do not need to link to qualify, but we will add a 2x multiplier per matched linking symbols. This multiplier should be expressed in the game config so that it can be overridden by new game types.
    - Non-selected symbols require 5 linking symbols to be matched for removal/cascade. This number should be expressed in the game config so that it can be overridden by new game types.

- Bonus symbol count do not carry over between rounds

- Rethink Bonus symbol frequency so getting a bonus is a little more rare. Frequency should be expressed in the game config

- Instead of having a bet textbox, add 4 buttons: Minimum bet, 1/8 bankroll, 1/4 bankroll, 1/2 bankroll. If the bankroll bets are under the minimum bet, disable these buttons. Clicking a button will start the reels, replacing the "Start Omen" button

- Only 1 symbol can be chosen at the outset of the game. Reconsider payouts to find a good balance.

- Purchased wild reels last for 3 spins. If a bonus spin is achieved, this bonus spin does not count towards the 3 spins. This lifespan of a wild reel should be expressed in the game config.

- Purchased dead reels last for 5 spins. If a bonus spin is achieved, this bonus spin does not count towards the 3 spins. This lifespan of a dead reel should be expressed in the game config.

- Purchased marked reels last for 3 spins. The reel face selected pays 1.5x when it pays out. If a bonus spin is achieved, this bonus spin does not count towards the 3 spins. This lifespan of a bonus reel should be expressed in the game config.

- Make the game area larger, and the animations slightly slower.

- Add a section to the side of the game area that scrolls the payouts that have occurred, the current amount won for the current round and inclusive of bonus spins, the current amount bet, the current active symbols, how many bonus symbols until the next crossroads, and how many wild and dead reels are in play and how long they are going to last.

- Crossroads Rework: 
    - Will appear after 15 bonus symbols have been revealed, not after 3 rounds. This number should be expressed in the game config so that it can be overridden by new game types.
    - Crossroads shop should be its own screen and not a modal
    - Each item can be purchased once per crossroads visit
    - Available shop bonuses should be as follows... these values should be expressed in the game config
        - Add a symbol to the omen - 3500 credits for the first purchase, adding 2500 to the cost for each additional purchases, max of 3 total. This symbol will now pay out.
        - Add a temporary wild reel - 5000 credits, max of 3 active
        - Add a dead reel - Gives the player 1500 credits when taken, max of 3 active
        - Mark an omen symbol - 4000 credits, max of 1 active at any given time. This mark can be applied to any symbol that the player currently has activated.