import { mastersonGameConfig } from "./minigames/mastersonRules";

export interface SommelierTutorialStep {
  /** The title of this step or concept */
  title: string;

  /** Pazillus A. Rabellum's voice dialogue */
  dialogue: string;

  /** 
   * Optional CSS selector to place the pulsing gold spotlight overlay on.
   * Examples: ".fateseal-grid", ".yi-felt-pass", "#preDraw-screen"
   */
  highlightSelector?: string | string[];

  /** 
   * Optional state block injected into the minigame to render the exact phase layout.
   */
  mockState?: Record<string, unknown>;
}

export const sommelierTutorialCatalog: Record<string, SommelierTutorialStep[]> = {
  oubliette_no9: [
    {
      title: "Welcome to Oubliette No. 9",
      dialogue: "Welcome to the table, {playerName}. I am Pazillus A. Rabellum, the club's sommelier. \n\nOubliette No. 9 is a rustic, full-bodied video-poker blend. This is The Villains Club's first game, and its staple for most of our patronage. Quite a popular choice, I must admit.",
      highlightSelector: "#preDraw-screen"
    },
    {
      title: "The Entrance Toll",
      dialogue: "To run a round, you must pay the ante, which increases automatically each round. Ensure your credit balance can withstand the wagers, or the house will immediately spit you out as a bankrupt amateur. \n\nThe round's bet cost is multiplied by the amount of hands you have (we'll get to this in a moment), which gives you the total cost for your next round.",
      highlightSelector: "[id=\"preDraw-screen\"] .game-panel-muted",
      mockState: { screen: "game", gamePhase: "preDraw", credits: 500, betAmount: 10, minimumBet: 10, handCount: 5, selectedHandCount: 5 }
    },
    {
      title: "Sorting the Grapes",
      dialogue: "Five cards are dealt to you. Decide which ones are worth holding and discard the rest. Think of it as sorting sweet grapes from rotten skins.\n\nYou need a pair of Jacks or better to win. Anything less will leave you with a mouthful of bitter vinegar. \n\nSelect carefully before making the draw - once you play the hand, there is no undo. \n\nShould you need it, a payout table is available at the top of the screen. And should you not know your poker hands, what a delightfully expensive way to learn.",
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
      dialogue: "Once you draw, the deck is decanted into multiple Parallel Hands. Your held cards are played against multiple decks, giving you a variety of flavors from just a single hand. \n\nShould you hold a winning hand from the outset, your payouts will amplified via our combo multiplier. The more winning hands played, the higher the multiplier goes. The higher the multiplier, the higher your winnings. \n\nHowever, the more hands you have, the more expensive every round becomes. There is a balance to maintaining the ever-growing bet size and giving yourself the best odds to make credits to stay in the game.",
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
      dialogue: "Between rounds, you will visit my shop.\n\nYou can buy additional parallel hands, wild cards, more cards drawn at the start of the round, an extra draw step, and dead cards. \n\nDead cards are quite the interesting varietal; you are paid credits for taking them into your deck, however they count as no suit or rank. It simply fills up room in your deck and these dead cards will always find their way into your hand at the worst possible moments. \n\nMuch like certain people we may have in our lives. I digress. \n\nYou can also pay to have these troublesome cards removed from your deck at a later time, should the option to do so appear in the shop.",
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
        showShopNextRound: true,
        credits: 300,
        handCount: 5,
        selectedHandCount: 5,
        selectedShopOptions: [
          "wild-card",
          "parallel-hands-bundle-500"
        ]
      }
    },
    {
      title: "The End Game",
      dialogue: "Should you find yourself making it to round 30, we have quite the digestif waiting for you. \n\nWhile you have technically 'won', we here at the Club always wish to see overachievement. As such, we present you with a unique challenge. \n\nGenerally, we will ask you to win 25% of your hands, then 30%, and so on, until you no longer can meet our criteria. Nothing untoward will happen if you fail at this state, simply a test of your strategy, skill, and luck with the cards.\n\nWith that, I believe our tasting for this game has come to a conclusion. I bid you good luck, happy wagering, and I'll be by later to check on your wine glass.",
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
      title: "The Green Felt Racket - Seven Year Itch",
      dialogue: "Welcome to the table, {playerName}. I am Pazillus A. Rabellum, the club's sommelier. \n\nAh, the green wool felt of craps... an unpredictable, exciting game of dice and daring. This is 7 Year Itch, a version of craps that removes some of the more... let's call them 'unnecessary' notes of the game, and refines the rules in to a more palatable experience. I will guide you through this volatile noir flight, but do keep up and feel free to make tasting notes. \n\n For the craps players here, this is a twist on crapless craps rules.",
      highlightSelector: ".seven-year-itch-root"
    },
    {
      title: "The Seed Investment",
      dialogue: "In 7 Year Itch, you are investing in a business that deals with trade of a more illicit flavour. \n\nFor this to work in our city, we of course need a business to act as a front for the rest of our enterprise. The seed investment covers this cost. \n\nYou may bet as much as you like, but remember that the taller the tower, the more disastrous the fall. Be sure to save some money for where the real work happens. \n\n After you place your desired investment, we roll the dice. Should a 7 be rolled, the front business is a success and we don't even need to get into the mire of our more seedy activities. Your investment wins even money and returned to you, then we repeat the process until we roll anything but a 7. \n\n For our craps-playing friends in the crowd, this is the come-out roll, and you are placing a wager on the pass line.",
      highlightSelector: ".yi-felt-pass",
      mockState: { table: { phase: "comeOut", point: null }, bets: { passLine: 100 } }
    },
    {
      title: "Active Case Files",
      dialogue: "The number rolled in the previous step determines our main focus of business, but it's also the business that the police have started investigating. Should they bust this part of our business, our entire enterprise will fall to the ground like a disappointing glass of wine. \n\n If a 7 is rolled right now, the police crack down on our business, and we lose all money invested. \n\nShould we roll a 6, as in this example, we get away scot free, all money on the felt is returned, and our seed investment wins even money. The front is cleanly shut down, the cops are off of our back, and we may start over with a brand new front. Our primary business will remain highlighted, so you need not remember.",
      mockState: { table: { phase: "point", point: 6 }, bets: { passLine: 100 } }
    },
    {
      title: "Diversification",
      dialogue: "As you can see here, we have many options for business diversification. \n\n Each number corresponds to a different type of business we have our fingers in, and each one can be invested in individually. When the dice are rolled, if they land on a number that we have invested in, we will see a return on our investment. \n\n The returns on these are adjusted according to how often they would be rolled, mathematically-speaking; the less frequent numbers will pay far more than more common numbers. \n\nIn our example here, you can see that we have invested in the 2, the 6, and the 8, and the returns are noted on the felt. You can always refer to the 'Odds' button at the top of the screen for the payout structure. \n\n For our craps enthusiasts at this tasting, these are simply place bets.",
      highlightSelector: ".yi-felt-placeArc",
      mockState: { table: { phase: "point", point: 6 }, bets: { passLine: 100, place: { 2: 50, 6: 50, 8: 50 } } }
    },
    {
      title: "Divestment",
      dialogue: "Should the heat feel like it's too much, click the Divest button. \n\nThis will return all money invested in the various businesses, but your seed investment is locked down. You may re-invest after a divestment, but your returns will be lower until the start of the next hand. \n\nA savvy businessperson knows when to cut and run, but the street knows a chicken when it clucks. \n\n Speaking of, please do try our chicken marinara this evening, it's impeccable. Please ask if you need a wine pairing recommendation.",
      highlightSelector: ".yi-felt-divest-container",
      mockState: { table: { phase: "point", point: 6, hasUsedDivest: false }, bets: { passLine: 100, place: { 2: 50, 6: 50, 8: 50 } } }
    },
    {
      title: "Heat",
      dialogue: "A good wine should never be hot in most cases, but here in 7 Year Itch, heat can be a good thing. \n\nFor every bet placed on the felt, we add tension to the operation. The more you have on the felt, the more heat you generate. Every roll, we add to the heat meter at the top of the table. \n\nWhen this fills, you may select from an offering of favors that can increase our payouts, allow us a clean divestment with no downside, or even give us a second chance after rolling a 7. \n\nBig bets mean bigger chances to win, but also bigger falls when the wrong people come knocking at your office door.\n\nThat should be everything you need to know! Best of luck, and I will be around should you need advice or another bottle.",
      highlightSelector: ".yi-felt-heat-meter",
      mockState: { table: { phase: "point", point: 6, hasUsedDivest: true, heat: 24, }, bets: { passLine: 100, place: { 2: 50, 6: 50, 8: 50 } } }
    }
  ],
  fateseal_silver: [
    {
      title: "Welcome to Fateseal Silver, The Occult Altar",
      dialogue: "Welcome to the altar, {playerName}. I am Pazillus A. Rabellum, the club's sommelier. The only demons here are the tannins in this bottle of Rioja; fear not. \n\nIn Fateseal Silver, you will use your foresight to choose the correct sigils to align with, and then converse with the spirits through it to bring you fortune. Or ruin. Both are entirely possible, but that's why we're here, no? \n\nThis game effectively plays like a slot machine, but instead of hoping any symbol lines up on the reels, we pick a specific symbol and hope to see it as many times as possible.",
      mockState: { phase: "altar", picks: [] }
    },
    {
      title: "Sealing the Prophecy",
      dialogue: "First, you will choose an omen to align yourself with. One is not better than any other. Simply choose what you are drawn to. This sigil will be what pays out when we get to the ritual. \n\nEvery time it shows up in your vision, you will be rewarded with credits, and the more it shows up, the more you win. \n\nWhen you are happy with your selection, move on to the ritual. You may always return here and change your preferred omen whenever you wish.",
      highlightSelector: "[data-testid=\"fateseal-seal-prophecy\"], [data-testid^=\"fateseal-pick-\"]",
      mockState: { phase: "altar", picks: ["dagger"] }
    },
    {
      title: "The Ritual Grid",
      dialogue: "Do you smell that? The faint smell of fresh lemongrass, ozone, and a hint of brimstone? Refreshing, and dare I say, bracing. \n\nThis is our ritual grid, where the spirits come to converse with the living. Now that you are aligned to an omen sigil, you may hear the whisperings of those gamblers who have found their way near the veil and chosen to stay for a round or two. Truly, they have nothing better to do. \n\nOn the grid are many omen sigils - if your selected sigil is on the grid, it is removed, you are paid, and more sigils are added in their place. Connected sigils pay more, so hope the spirits figure out how to stand in a straight line. As I've been told, the wine in the afterlife is quite potent!",
      highlightSelector: ".fateseal-grid",
      mockState: {
        phase: "ritual",
        grid: [
          ["scatter", "scatter", "goat", "chalice", "wild"],
          ["dagger", "chalice", "dagger", "dagger", "serpent"],
          ["dagger", "scatter", "chalice", "goat", "dagger"],
          ["dagger", "dagger", "dagger", "wild", "dagger"],
          ["void", "dagger", "dagger", "dagger", "scatter"]
        ]
      }
    },
    {
      title: "The Symbols",
      dialogue: "You may also see other sigils in your vision, such as the 'Scatter', seen in the upper left corner. The 'Wild', seen in the upper right corner, and the 'Void', seen in the lower left. \n\nScatters don't count for anything, but the more you get, the closer to The Crossroads you will find yourself - a place where the veil is thinnest, and you may make a deal with the spirits. If you happen to have 4 on the board at the same time, I've heard something interesting happens. \n\nWild sigils count as any sigil, as you may imagine. \n\nVoid sigils count as nothing, and are usually the result of selling part of your vision, which we'll get to in a moment. Just know these are... less than ideal to have in your ritual.",
      highlightSelector: ".fateseal-grid",
      mockState: {
        phase: "ritual",
        grid: [
          ["scatter", "scatter", "goat", "chalice", "wild"],
          ["dagger", "chalice", "dagger", "dagger", "serpent"],
          ["dagger", "scatter", "chalice", "goat", "dagger"],
          ["dagger", "dagger", "dagger", "wild", "dagger"],
          ["void", "dagger", "dagger", "dagger", "scatter"]
        ]
      }
    },
    {
      title: "The Wagers",
      dialogue: "Befriend the spirits with an offering of credits and start the ritual. The larger your bet, the higher your payout per symbol.\n\n For our more discerning gamblers here at this tasting, the RTP is around 92-95%, all depending on what the proprietor has been doing to the math. Between you and I, he's a complete idiot. I'm unsure he even knows what he's doing and he's out here mucking around with sprits and... oh, the wine is talking again. Please pardon me.",
      highlightSelector: ".fateseal-bet-buttons-container",
      mockState: { phase: "ritual", engine: { sessionWallet: 1000 } }
    },
    {
      title: "The Crossroads",
      dialogue: "You've found yourself in the Crossroads, a rare place where the veil between our world and the spirit realm is at its thinnest. The spirits are eager to bargain, but you must be wary. The choices you make here will have lasting impacts on the rest of your session. \n\nYou may pay the spirits to align an additional omen to your vision, increasing the sigils that pay out when they appear, but decreasing their overall worth.\n\nYou may also take a Faustian bargain, wherein you sell part of your vision in exchange for credits. Your vision will return after a few spins, but be warned that the bargain can be taken multiple times, and your vision will become extremely narrow. And we all know about people with a narrow vision on the world, yes?\n\nFinally, you may invest a large portion of your bankroll on high risk bonus modes - these can make or break your run, so be sure you consider your options before taking one. Personally, I'd cash out at that point and have a glass of Syrah, but that is your prerogative.",
      highlightSelector: "[data-testid=\"fateseal-crossroads-root\"]",
      mockState: { phase: "crossroads", offeredOmen: "goat", engine: { sessionWallet: 500 } }
    }
  ],
  masterton_1881: [
    {
      title: "Welcome to Masterton 1881",
      dialogue: `Welcome to the table, {playerName}. I am Pazillus A. Rabellum, the club's sommelier. Here at The Villains Club, we appreciate history. Masterson 1881 is named after William Barkley Masterson, an Old West lawman, gambler, and journalist. When he hung up his gunbelt in 1881, he still gambled quite a bit and encountered his fair share of crooked games.`,
      highlightSelector: ".masterson-felt-board"
    },
    {
      title: "The Shift",
      dialogue: `In Masterton 1881, you are the croupier (That's the roulette dealer...) running a rigged roulette table. Your shift lasts exactly ${mastersonGameConfig.shift_duration_spins} spins or until you scare off all of the bettors at the table. Your primary objective is to maximize the house's total earnings and pocket a massive personal commission cut, all while keeping the seats filled.\n\nLet me pour you a glass of Cabernet and show you how to pull the strings.`,
      highlightSelector: ".masterson-felt-board"
    },
    {
      title: "Zen and the Art of Scamming Rubes",
      dialogue: `The key to success in Masterton 1881 is to ruin the day of your players. Don't feel bad, they'd do the same to you had roles been reversed. However, the players are wise to crooked croupiers, and will get suspicious if you rig the game a little too much. This is The Villains Club, after all.\n\nIf their suspicion maxes out, they will pack their bags and leave in a huff, taking their wallets with them. You want to give the players a little bit of hope that the game is fair, keeping them in their seats and betting more until you decide to pull the rug out from under them.\n\nAgain, this is The Villains Club, after all.`,
      highlightSelector: "#croupier-rigging-deck"
    },
    {
      title: "Bettor AI Strategies",
      dialogue: "Up to four bettors will sit at your table, each following distinct betting patterns, risk tolerances, and... naivety for lack of a kinder word.\n\nYou will see their names, strategies, chip stacks, and suspicion gauges displayed in the seat monitors.",
      highlightSelector: "#seat-monitors",
      mockState: {
        activeBettors: [
          { id: "Seat 1", name: "Mildred Ratched", strategy: "Martingale", chips: 15000, initial_chips: 15000, max_suspicion: 6, current_suspicion: 1, loss_tolerance_pct: 0.7, max_consecutive_losses: 4, current_consecutive_losses: 0, double_bet_frequency: 0.5, herd_mentality_pct: 0.2 },
          { id: "Seat 2", name: "Norman Bates", strategy: "High_Risk", chips: 8500, initial_chips: 10000, max_suspicion: 5, current_suspicion: 3, loss_tolerance_pct: 0.8, max_consecutive_losses: 5, current_consecutive_losses: 2, double_bet_frequency: 0.1, herd_mentality_pct: 0.4 }
        ],
        currentBets: {
          "Seat 1": [{ target: "Red", amount: 500, payoutOdds: 1 }],
          "Seat 2": [{ target: "17", amount: 200, payoutOdds: 35 }]
        }
      }
    },
    {
      title: "Rigging the Wheel",
      dialogue: `There are three types of rigs you can perform, the more specific the rigging, the more obvious your trickery will be. Click any bet to rig the wheel to that outcome and win, or run a fair spin. Click an active bet again to cancel the rigging and return to a fair spin.`,
      highlightSelector: "#croupier-rigging-deck",
      mockState: {
        activeBettors: [
          { id: "Seat 1", name: "Mildred Ratched", strategy: "Martingale", chips: 15000, initial_chips: 15000, max_suspicion: 6, current_suspicion: 5, loss_tolerance_pct: 0.7, max_consecutive_losses: 4, current_consecutive_losses: 0, double_bet_frequency: 0.5, herd_mentality_pct: 0.2 }
        ],
        currentBets: {
          "Seat 1": [{ target: "Red", amount: 1000, payoutOdds: 1 }]
        }
      }
    },
    {
      title: "Rigging and Suspicion, Part 2",
      dialogue: `As I mentioned, the more specifically you are rigging the wheel, the more obvious you are going to be to the players.\n\n•Low Suspicion rigging: 1:1 bets found in the bottom row.\n• Mid Suspicion rigging: Columns or Dozens.\n• High Suspicion rigging: Specific Numbers.\n\nIf a bettor wins on a rigged spin, they still get wise, but won't care as much.\n\nRunning a Fair Spin cools things down, reducing active suspicion by a small amount.\n\nKeep an eye on their whiskey glasses. As suspicion approaches the threshold, the glass clouds up with condensation and eventually cracks if they storm off.`,
      highlightSelector: ".masterson-whiskey-glass",
      mockState: {
        activeBettors: [
          { id: "Seat 1", name: "Mildred Ratched", strategy: "Martingale", chips: 15000, initial_chips: 15000, max_suspicion: 6, current_suspicion: 5, loss_tolerance_pct: 0.7, max_consecutive_losses: 4, current_consecutive_losses: 0, double_bet_frequency: 0.5, herd_mentality_pct: 0.2 }
        ],
        currentBets: {
          "Seat 1": [{ target: "Red", amount: 1000, payoutOdds: 1 }]
        }
      }
    },
    {
      title: "Evictions, Upkeeps, and Spawns",
      dialogue: `Bettors leave the table due to Suspicion, Financial Exhaustion, or Frustration (consecutive losses). Even worse, if a bettor leaves due to suspicion, others may decide to leave the party as well!\n\nOpen seats have a ${Math.round(mastersonGameConfig.seat_fill_chance_per_spin * 100)}% random chance to replenish, and if your table is completely empty, a ${Math.round(mastersonGameConfig.empty_table_last_chance_pct * 100)}% last chance trigger may spawn a final bettor to keep the shift alive.`,
      highlightSelector: ["#ledger-log", "#table-house-ledger"],
      mockState: {
        spinCount: 12,
        commissionRate: 15,
        tableHouseLedger: 24500,
        accumulatedCommission: 3675,
        notifications: [
          { type: "upkeep", message: "📈 House commission rate increased! You now pocket 15% of positive take!" },
          { type: "eviction", message: "💥 Victor Lupin left the table: Frustration Limit." }
        ]
      }
    },
    {
      title: "Advanced Strategy - Bettor Behavior",
      dialogue: `The players can bet in a number of different patterns. Knowing these patterns isn't essential, but it does help to know what they may be doing and how best to exploit them for maximum profit.\n\n• Martingale & D'Alembert: Systems that dynamically scale bet sizes based on wins/losses.\n• Random & Random 1:1: Erratic layout selections with varying risks.\n• Hedges: High-coverage bets covering multiple sections simultaneously.\n• Low Risk Grind: Conservative chips focused on safe outside bets.\n• High Risk: Chasing massive payouts on specific single-number fields.\n\nWith that, I believe our tasting for this game has come to a conclusion. Settle your shift, rig the wheel wisely, and try to pocket a handsome sum of commission. Best of luck!`,
      highlightSelector: "#betting-styles-guide",
      mockState: {
        activeBettors: [
          { id: "Seat 1", name: "Mildred Ratched", strategy: "Martingale", chips: 15000, initial_chips: 15000, max_suspicion: 6, current_suspicion: 5, loss_tolerance_pct: 0.7, max_consecutive_losses: 4, current_consecutive_losses: 0, double_bet_frequency: 0.5, herd_mentality_pct: 0.2 }
        ],
        currentBets: {
          "Seat 1": [{ target: "Red", amount: 1000, payoutOdds: 1 }]
        }
      }
    }
  ]
};
