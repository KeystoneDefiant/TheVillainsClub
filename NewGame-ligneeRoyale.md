## New Game

Title: Lignée Royale

- A 3 row, 5 column slot machine that uses playing cards as the symbols in the reels. Payouts are calculated based on poker hands that are made across the columns.

- Initially only the middle row is active, which pays out based on poker hands of 5 cards across the column. Multiplying the bet amount will add additional lines that will score, always added in tandem - a 2x bet multiplier activates the top and bottom rows, a 3x bet multiplier activates the top and bottom rows and the two diagonals, a 4x bet multiplier activates the top and bottom rows and the two diagonals and the two off diagonals. 

- Visually, the game should resemble a slot machine and use already existing assets, colors, styles and elements already present in the game.

- Card designs should be pulled from the Oubliette game, and made into generic objects so that any game moving forward can use these assets easily.

- Poker hand evaluation code should be pulled from the Oubliette game and made into a generic utility that can be used in other games.

- Known variables that should be contained in the game's configuration file for easy tweaking:
    - Base payouts for each poker hand
    - Minimum bet sizes and maximum bet sizes
    - Max Payout
    - Buy in amount
    - Maximum amount of wild cards that can appear in the deck
    - Maximum amount of dead cards that can appear in the deck
    - Deck composition (what suits and ranks are included in the deck)

- Test cases should be generated and import configuration variables, and not test for display strings.

- RTP calculations should be generated, and compared to the baseline RTP for slot machines. There is a suite of RTP tools already in the project and these should be leveraged.

