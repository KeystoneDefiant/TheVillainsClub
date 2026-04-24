/**
 * Tutorial slide content for the How to Play flow.
 * Seven slides covering: intro, pay table, parallel hands, multiplier, shop, wild/dead cards, end game.
 */
export interface TutorialSlide {
  title: string;
  content: string;
}

export const tutorialSlides: TutorialSlide[] = [
  {
    title: 'Welcome to Oubliette Number 9',
    content:
      "This is a single-player poker game, akin to video poker. You are dealt 5 cards; select any number of cards you want to keep - the cards you don't keep will be discarded and then you'll play your hand. \n\nA pair of Jacks or better is the lowest hand you can get. A pair of 10s won't do the trick, Mick.",
  },
  {
    title: 'Pay Table & Betting',
    content:
      "Each round has an ever-increasing bet amount. Your hand payouts are based on the bet size. Check the payout table to see how much each hand rank is worth. The bet amount goes up automatically as you advance through rounds. \n\nIf you can't pay for the next round, you lose the game. \n\nOnce you hit round 30, some new devious and profanity-inspiring rules kick in. You're welcome.",
  },
  {
    title: 'Parallel Hands',
    content:
      "After you hold your cards, the deck is cloned and shuffled with the power of Science and Dumbfuckery. You then draw a bunch of hands against the cards you've held using the cloned decks - we call this concept Parallel Hands. \n\nFor instance, if you draw a 7 of Hearts in one hand, you can see it again in the next hand. Each Parallel Hand uses the same bet size: 5 hands at a bet size of 2 costs 10 credits; 100 hands at a bet size of 5 costs 500 credits. \n\nMore hands mean more chances to win, even on a tough draw... but then again it's more chances to lose. I guess it comes down to your personal perspective on things...",
  },
  {
    title: 'The Multiplier',
    content:
      "Score multiple hands in a row and your multiplier goes up! \n\nMo' mults, Mo' money! \n\nWhen you don't score a hand, your progress toward the next multiplier level goes down. The number of hands you need to score in a row to reach the next multiplier level increases exponentially as you increase the multiplier. Chain wins together to maximize your earnings. \n\nOr don't. I'm not your manager.",
  },
  {
    title: 'The Shop',
    content:
      "Every so often, between rounds, you can buy upgrades in the fancy shop! \n\nMore Parallel Hands, dead cards, wild cards, extra draws, extra cards in your hand, and more. \n\nEvery purchase affects your game - more hands means more chances to win and boost the multiplier, but each round costs more credits. The shop is randomly generated each round, so you never know what you'll find!\n\nOnce you have enough credits, you will upgrade to the VIP Shop. You're no longer a peasant, so you'll get access to some premium items and more premium selections, but there's not as many... and when you are buying those name brand Parallel Hands, you'll be paying a premium price!",
  },
  {
    title: 'Wild Cards & Dead Cards',
    content:
      "Wild cards can substitute for any rank - use them to complete strong hands. \n\nDead cards give you money when you first obtain them from the shop, but they don't count toward any poker hand and act as a wasted card draw. Hope you really needed that money, chum. You can remove these cards from the deck if the option shows up in the shop - there are items to remove a single dead card or all dead cards at once.",
  },
  {
    title: "Devil's Deal",
    content:
      "When the Devil's Deal activates, a ghostly card that will give you the best possible hand is offered to you. You don't have to take it, which is good because them thangs be 'spensive - the cost is how much that hand would be worth after all parallel hands would be played with it, plus a little 'house edge'. Okay, a lot of house edge. \n\nBe careful when choosing this! It can be very useful, but can also be used extremely wrong! \n\nYou can increase the chance the deal will be offered to you, as well as the reducing the cost of the deal with upgrades in the shop.",
  },
  {
    title: 'The End Game',
    content:
      "After round 30, the end game begins. \n\nLosing is an eventuality - the goal is to survive as long as you can and finish with as many credits as possible. \n\nJust making it to round 30 is a success! \n\nGood luck, and may the odds be ever in your favor. \n\nI'll be waiting for you at the bar and you can tell me all about the bugs you found, and how I'm a horrible person for making you play this game.",
  },
];
