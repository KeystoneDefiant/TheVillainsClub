# TO DO

## Fateseal Changes

- Let's change the wagers. Minimum bet at 100, then 200, then 500, then 1000. These values should be configurable in the game's config json file.

- Let's change the options at the crossroads:
    - Offer a new prophecy symbol at random, not from a drop down. If the player is at their maximum, do not show this option. Reflect what extra prophey symbols have been purchased at the Altar screen by highlighting them in purple and giving them the same shimmer effect that the void symbols have.
    - Only one wild reel slot powerup can be active at a time, you no longer should be able to stack them. Change the name to "Unsettle the Spirits". Change the description to "Unsettle the spirits and activate a alchemical transmogrification for the next 5 spins, drastically increasing the likelihood of wild symbols appearing on the reels." The cost should be 75% of the player's bank, with a minimum price of 6500. While this is active, the betting buttons on the main screen are replaced with a new button that says "Unsettle The Spirits". Clicking this button does not cost credits, and the bet size is set to 250. After this bonus is used, the betting returns to normal.
    - Dead Reel Boon should be renamed to "Faustian Bargain". The description should now read "Temporarily sell part of your vision for immediate profit. Bet size is locked to 250 and you cannot cash out while your vision is in this state. Each level adds another column of blindness, lasting 5 turns each." Then a line break, and then "Active x/3, Timers: y"
    - Omen Mark should be removed
    - The Forbidden Tome should be turned into a toggle switch. The description should read "Increase all bet sizes by 25% for a 25% higher chance of summoning scatter symbols."
    - Add a new option called "Vassago's Gambit". The description should read "Make an offering to Vassago, the Prince of Prophecy. Trigger a scatter bonus on your next vision." The cost should be 90% of the player's bank, with a minimum price of 10000. While this is active, the betting buttons on the main screen are replaced with a new button that says "Vassago Grants You Vision". Clicking this button does not cost credits, and the bet size is set to 250. After this bonus is used, the betting returns to normal. The next spin will have a guaranteed scatter bonus, but the scatters do not count toward the crossroads.
    - All of these values should be configurable in the game's configuration json file.

- Wilds should not remove scatter tiles

- Make sure the betting button block expands to the width of the containing parent so that the buttons don't wrap when possible.

- Make the betting buttons the same width so that if wrapping does occur on smaller screens, the layout remains asthetically pleasing

- THe payout indicator during a spin changes to +0 a moment before it disappears. 

- During a cascade, make sure symbols are actually falling to the lowest possible slot in the column. There are instances where a symbol remains in the space even though a match was made under it.

- Show the timer in the center of void symbols with the time remaining on that column. For instance, if 3 void reels are in play, the first void reel would have the number 3 in the middle of the symbol if there are 3 spins remaining until it is removed. It should share the same shimmer effect that the rest of the void symbol has.