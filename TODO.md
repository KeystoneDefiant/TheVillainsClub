# TO DO

## Fixes

- If a game is in progress, make sure the player can abandon the run from the bar menu

- Add an Abandon Run button to the top bar in each game. Abandoning the run will not pay out anything back to the player and will forefeit their buy in.

## Intro Animation

- Refine the animation a bit more. I'm ok with you taking liberties with it and coming up with something neat with drawing in the red logo and the grey logotype and doing an interesting transition between the intro and the bar screen.

- Allow for different animations for this intro screen. Keep the current one, add your new one, and randomize them each launch. Give the ability to make more animations and add them into the rotation.

## Onboarding

- If the player is new, add an onboarding step after the logo animation that introduces the club and games, asks the user for their name (which is held in their account and can be referenced as desired). After the logo zooms in, keep the background red, fade in a black gradient from the bottom at 90% opacity to the top at 10% opacity. After onboarding is complete, fade out to the bar menu.

- If the player resets their account in settings, perform the reset and then refresh the page to restart onboarding.

## Oubilette

- Ensure that the game over check is correctly checking the next round's requirements

- Ensure that the store's "Next Round Cost" number is accurate to the next round - refer to the number the game over check is looking at and show that.

- Ensure that the top bar in the shop screen conforms to the top bar used in the rest of the games. We will probably need to move some UI elements around, and that's fine. Make your best effort to lay out the shop screen in a way that's slick and clean and responsive. We want all shop items on screen, including all buttons and the close shop button. We also want to bubble up the "credits required for next round" text.

## 7 Year

- Heat goes up in relation to amount of bets in the field, not number of rolls. 1 bet is one unit of heat, grows per roll, store fires at 36 heat units. This should be expressed in the game's config

- Improve the dice rolling animation. Each die should animate uniquely and bounce off of the sides of the screen. The roll itself should be accurate to the die faces that are actually rolled. When the roll is resolved, slide the dice off of the screen.

- Rename pass line to "initial investment", remove flat odds bet.

- Limit place wagers to 3x pass line bet. This should be expressed in the game's config.

- "Look The other way" should have a reduced chance of showing up if the player's current wallet size is over their buy in

## Fateseal

- Remove the post-spin summary screen

- Ensure that when matches are removed from the grid, all symbols above that symbol being removed fall down the column and that this is animated smoothly. Some symbols are not dropping down when matches are made under them.

- Slow the animation speed of symbols being removed and symbols falling

- Show a running total of money won during this spin, animated counting up in a rolling reel style. This should fade in over top of the bet buttons, and the bet buttons fade out once the spin starts. When the spin is complete, this should remain for .75 seconds, and then crossfade back to the betting buttons

- When a new spin is started, clear the grid of symbols by dropping them out from the bottom of the grid in a casading column animation - as the first column nears 25% completion of the animation, start the second column, etc etc.

- Purchased Wilds only add the chance for the wild symbol to appear, not grant a full reel of wilds

- Remove the spinner animation while the spin is active

- Free ritual meter should be removed

- Crossroads status display should be a small progress bar that fills as bonus symbols hit. Have the color pulse light purple and then back down to the normal purple color used in the game as it animates when changed.

- Remove the Recent Lines section in the left bar

- Any additional omen symbols removes payout. For instance, when one symbol is selected, payout is 15% of the bet size. 2 symbols active pays 10% of the bet size, 3 symbols is 5%. This should be expressed in the game configuration 

- 4 symbols needed to activate bonus mode, not 5

- Non-selected matches grant 0.5x. This should be expressed in the game configuration.

- Minimum bet is 100 credits. This should be expressed in the game configuration.

- If the dead reels are in play, the minimum bet button is disabled, forcing the player to gamble more

- 1/2 bank bet amount is not correct

- Bet buttons should be in their own section under the grid and table readout 