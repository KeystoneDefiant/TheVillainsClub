export interface SommelierTutorialStep {
  /** The title of this step or concept */
  title: string;

  /** Pazillus A. Rabellum's voice dialogue */
  dialogue: string;

  /** 
   * Optional CSS selector to place the pulsing gold spotlight overlay on.
   * Examples: ".fateseal-grid", ".yi-felt-pass", "#preDraw-screen"
   */
  highlightSelector?: string;

  /** 
   * Optional state block injected into the minigame to render the exact phase layout.
   */
  mockState?: Record<string, unknown>;
}

export const sommelierTutorialCatalog: Record<string, SommelierTutorialStep[]> = {
  oubliette_no9: [
    {
      title: "Welcome to Oubliette No. 9",
      dialogue: "Welcome to the table, friend. I am Pazillus A. Rabellum, the club's sommelier. Oubliette No. 9 is a rustic, full-bodied video-poker blend. You need a pair of Jacks or better to win. Anything less will leave you with a mouthful of bitter vinegar.",
      highlightSelector: "#preDraw-screen"
    },
    {
      title: "The Entrance Toll",
      dialogue: "To run a round, you must pay the ante, which increases automatically each round. Ensure your credit balance can withstand the wagers, or the house will immediately spit you out as a bankrupt amateur.",
      highlightSelector: "[id=\"preDraw-screen\"] .game-panel-muted",
      mockState: { screen: "game", gamePhase: "preDraw", credits: 500, betAmount: 10, minimumBet: 10, handCount: 5, selectedHandCount: 5 }
    },
    {
      title: "Sorting the Grapes",
      dialogue: "Five cards are dealt to you. Decide which ones are worth holding and discard the rest. Think of it as sorting sweet grapes from rotten skins. Select carefully before making the draw. Should you need it, a payout table is available at the top of the screen. And should you not know your poker hands, what a delightfully expensive way to learn.",
      highlightSelector: ".oubliette-play-stack",
      mockState: {
        screen: "game",
        gamePhase: "playing",
        credits: 1500,
        betAmount: 10,
        minimumBet: 10,
        handCount: 5,
        selectedHandCount: 5,
        playerHand: [
          { rank: "A", suit: "H", id: "1" },
          { rank: "K", suit: "S", id: "2" },
          { rank: "Q", suit: "D", id: "3" },
          { rank: "J", suit: "C", id: "4" },
          { rank: "10", suit: "H", id: "5" }
        ],
        heldIndices: [0, 1]
      }
    },
    {
      title: "Parallel Decanting",
      dialogue: "Once you draw, the deck is decanted into multiple Parallel Hands. Your held cards are played against multiple decks, giving you so many flavors on a single hand. Should you hold a winning hand from the outset, your payouts will amplified via our combo multiplier. The more winning hands played, the higher the multiplier goes. The higher the multiplier, the higher your winnings. But, I suppose you could also look at it as the potential for higher losses on a bad hand as well. Depends if your glass is half full or half empty... I suppose that's why we're all here at the club. ",
      highlightSelector: ".oubliette-play-area",
      mockState: {
        screen: "game",
        gamePhase: "results",
        credits: 640,
        totalEarnings: 90,
        round: 4,
        handCount: 5,
        selectedHandCount: 5,
        parallelHands: [
          {
            cards: [
              { rank: "A", suit: "H", id: "1" },
              { rank: "A", suit: "D", id: "11" },
              { rank: "2", suit: "C", id: "12" },
              { rank: "3", suit: "S", id: "13" },
              { rank: "4", suit: "H", id: "14" }
            ]
          },
          {
            cards: [
              { rank: "K", suit: "S", id: "2" },
              { rank: "K", suit: "C", id: "21" },
              { rank: "5", suit: "D", id: "22" },
              { rank: "6", suit: "H", id: "23" },
              { rank: "7", suit: "S", id: "24" }
            ]
          }
        ]
      }
    },
    {
      title: "The Cellar Shop",
      dialogue: "Between rounds, you will visit my shop. You can buy additional parallel hands, wild cards, more cards drawn at the start of the round, an extra draw step, and dead cards. Dead cards are quite the interesting varietal; we pay you money for taking them, however they count as no suit or rank. It simply fills up room in your deck and these dead cards will always find their way into your hand at the worst possible moments. Much like certain people we may have in our lives. I digress. You can also pay to have these troublesome cards removed from your deck at a later time, should the option to do so appear in the shop.",
      highlightSelector: ".oubliette-shop-card-wrap",
      mockState: {
        screen: "game",
        showShopNextRound: true,
        credits: 300,
        handCount: 5,
        selectedHandCount: 5,
        selectedShopOptions: [
          "wild-card",
          "parallel-hands-bundle-5"
        ]
      }
    },
    {
      title: "The VIP Cellar Shop",
      dialogue: "I should also mention my VIP shop, for my more discerning and... better funded patrons. While the selection in the VIP shop may be more limited in quantity, you will find the quality of the items on offer to be rather spectacular.",
      highlightSelector: ".oubliette-shop-card-wrap",
      mockState: {
        screen: "game",
        // showShopNextRound: true,
        credits: 300,
        handCount: 5,
        selectedHandCount: 5,
        selectedShopOptions: [
          "wild-card",
          "parallel-hands-bundle-5"
        ]
      }
    },
    {
      title: "The End Game",
      dialogue: "Should you find yourself making it to round 30, we have quite the digestif waiting for you. While you have technically 'won', we here at the Club always wish to see overachievement. As such, we present you with a unique challenge. Generally, we will ask you to win 25% of your hands, then 30%, and so on, until you no longer can meet our criteria. Nothing untoward will happen if you fail at this state, simply a test of your strategy, skill, and luck with the cards.",
      highlightSelector: ".oubliette-shop-card-wrap",
      mockState: {
        screen: "game",
        // showShopNextRound: true,
        credits: 300,
        handCount: 5,
        selectedHandCount: 5,
        selectedShopOptions: [
          "wild-card",
          "parallel-hands-bundle-5"
        ]
      }
    }
  ],
  seven_year_itch: [
    {
      title: "The Green Felt Racket",
      dialogue: "Welcome to the table, friend. I am Pazillus A. Rabellum, the club's sommelier. Ah, the green wool felt of craps... an unpredictable, exciting game of dice and daring. This is 7 Year Itch, a version of craps that removes some of the more... let's call them 'unnecessary' notes of the game, and refines the rules in to a more palatable experience. I will guide you through this volatile noir flight, but do keep up and feel free to make tasting notes. \n\n For the craps players here, this is a twist on crapless craps rules.",
      highlightSelector: ".seven-year-itch-root"
    },
    {
      title: "The Seed Investment",
      dialogue: "In 7 Year Itch, you are investing in a business that deals with trade of a more illicit flavour. For this to work in our city, we of course need a business to act as a front for the rest of our enterprise. The seed investment covers this cost. You may bet as much as you like, but remember that the taller the tower, the more disastrous the fall. Be sure to save some money for where the real work happens. After you place your desired investment, we roll the dice. Should a 7 be rolled, the front business is a success and we don't even need to get into the mire of our more seedy activities. Your investment is doubled and returned to you, then we repeat the process until we roll anything but a 7. \n\n For our craps-playing friends in the crowd, this is the come-out roll, and you are placing a wager on the pass line.",
      highlightSelector: ".yi-felt-pass",
      mockState: { table: { phase: "comeOut", point: null }, bets: { passLine: 100 } }
    },
    {
      title: "Active Case Files",
      dialogue: "The number rolled in the previous step determines our main focus of business, but it's also the business that the police have started investigating. Should they bust this part of our business, our entire enterprise will fall to the ground like a disappointing glass of wine. \n\n If a 7 is rolled right now, the police crack down on our business, and we lose all money invested. Should we roll a 6, as in this example, we get away scot free, all money on the felt is returned, and our seed investment is doubled and returned to us. The front is cleanly shut down, the cops are off of our back, and we may start over with a brand new front. Our primary business will remain highlighted, so you don't need to remember.",
      highlightSelector: ".yi-felt-placeArc",
      mockState: { table: { phase: "point", point: 6 }, bets: { passLine: 100 } }
    },
    {
      title: "Diversification",
      dialogue: "As you can see here, we have many options for business diversification. Each number corresponds to a different type of business we have our fingers in, and each one can be invested in individually. When the dice are rolled, if they land on a number that we have invested in, we will see a return on our investment. Some businesses pay out less frequently, mathematically-speaking, such as the 2 and 12 - or more often, in the case of a 6 or 8. \n\n The returns on these are adjusted accordingly; the less frequent numbers will pay far more than more common numbers. In our example here, you can see that we have invested in the 2, the 6, and the 8, and the returns are noted on the felt. You can always refer to the 'Odds' button at the top of the screen for the payout structure. \n\n For our craps enthusiasts at this tasting, these are simply place bets.",
      highlightSelector: ".yi-felt-placeArc",
      mockState: { table: { phase: "point", point: 6 }, bets: { passLine: 100, place: { 2: 50, 6: 50, 8: 50 } } }
    },
    {
      title: "Divestment",
      dialogue: "Should the heat feel like it's too much, click the Divest button. This will return all money invested in the various businesses, but your seed investment is locked down. You may re-invest, but after a divestment your returns will be lower until the start of the next hand. A savvy businessperson knows when to cut and run, but the streets know a chicken when it clucks. \n\n Speaking of, please do try our chicken marinara this evening, it's impeccable. Please ask if you need a wine pairing recommendation.",
      highlightSelector: ".yi-felt-divest-container",
      mockState: { table: { phase: "point", point: 6, hasUsedDivest: true }, bets: { passLine: 100 } }
    },
    {
      title: "Heat",
      dialogue: "A good wine should never be hot in most cases, but here in 7 Year Itch, heat can be a good thing. For every bet placed on the felt, we add tension to the operation. The more you have on the felt, the more heat you generate. Every roll, we add to the heat meter at the top of the table. When this fills, you may select from an offering of favors that can increase our payouts, allow us a cleaner divestment, or even give us a second chance after rolling a 7. Big bets mean bigger chances to win, but also bigger falls when the wrong people come knocking at your office door.\n\nThat should be everything you need to know! Best of luck, and I will be around should you need advice or another glass or bottle.",
      highlightSelector: ".yi-felt-heat-meter",
      mockState: { table: { phase: "point", point: 6, hasUsedDivest: true, heat: 24, }, bets: { passLine: 100 } }
    }
  ],
  fateseal_silver: [
    {
      title: "The Occult Altar",
      dialogue: "Welcome to the altar, friend. I am Pazillus A. Rabellum, the club's sommelier. Step up to the Fateseal Altar. Here, you will use your foresight to choose the correct sigils to align with, and then converse with the spirits through it to bring you fortune. Or ruin. Both are entirely possible, but that's why we're here, no?",
      highlightSelector: "[data-testid^=\"fateseal-pick-\"]",
      mockState: { phase: "altar", picks: [] }
    },
    {
      title: "Sealing the Prophecy",
      dialogue: "First, you will choose an omen to align yourself with.One is not better than another.",
      highlightSelector: "[data-testid=\"fateseal-seal-prophecy\"]",
      mockState: { phase: "altar", picks: ["dagger"] }
    },
    {
      title: "The Ritual Grid",
      dialogue: "The ritual grid. Obsidian runestones cascade down from the void core. Matching clusters shatter in stepped cascades, shifting gravity to make space for new elements.",
      highlightSelector: ".fateseal-grid",
      mockState: {
        phase: "ritual",
        grid: [
          ["void", "scatter", "dagger", "chalice", "dagger"],
          ["dagger", "chalice", "dagger", "dagger", "dagger"],
          ["dagger", "dagger", "chalice", "dagger", "dagger"],
          ["dagger", "dagger", "dagger", "chalice", "dagger"],
          ["dagger", "dagger", "dagger", "dagger", "dagger"]
        ]
      }
    },
    {
      title: "The Wagers",
      dialogue: "Select your wager stakes. Higher bets summon scatter symbols, filling your progress meter and paving the way to the Crossroads.",
      highlightSelector: ".fateseal-bet-buttons-container",
      mockState: { phase: "ritual", engine: { sessionWallet: 1000, baseBet: 100 } }
    },
    {
      title: "The Crossroads",
      dialogue: "The Crossroads. An exclusive cellar shop where you trade wagers for wild reels, dead reels, or make a Faustian bargain. Select your curated deal, or walk away uncorked.",
      highlightSelector: "[data-testid=\"fateseal-crossroads-root\"]",
      mockState: { phase: "crossroads", offeredOmen: "goat", engine: { sessionWallet: 500 } }
    }
  ]
};
