export interface TipSlide {
  title: string;
  content: string;
}

export const gameTipsCatalog: Record<string, TipSlide[]> = {
  oubliette_no9: [
    {
      title: "Jacks or Better",
      content: "The biggest mistake newer players make. A pair only counts if it's a pair of Jacks or better. A pair of 2's, 3's, 4's, 5's, 6's, 7's, 8's, or 9's does not count.",
    },
    {
      title: "Parallel Hands Balance",
      content: "Increasing your parallel hands gives you more chances to win and compound your multiplier, but it also increases the cost per round. Ensure your hand count doesn't outpace your bankroll.",
    },
    {
      title: "Upgrades Priority",
      content: "Prioritize purchasing Wild Cards and Hand Count bundle upgrades early in the shop. Avoid buying Dead Cards unless you desperately need the short-term cash injection.",
    },
    {
      title: "Handling Dead Cards",
      content: "If you acquire Dead Cards, look for the 'Remove Dead Card' or 'Remove All Dead Cards' options in the shop immediately. Dead Cards dilute your deck and hurt your chances in later rounds.",
    },
    {
      title: "Wild Cards",
      content: "Wild Cards change your odds more dramatically than you may think. This also opens the chance to make a 5-of-a-kind, which pays out handsomely.",
    },
    {
      title: "Dead Card Strategy",
      content: "Only pick up a dead card when you're trying to stay alive in the early game or if you need to stretch a bit to get a wild card and still have a comfortable buffer. More than 3 dead cards impacts your odds too heavily to make it worthwhile to keep them around.",
    },
    {
      title: "The Devil's Deal",
      content: "The Devil's Deal is powerful but extremely expensive because of the built-in house margin. Use it only when a high multiplier is active and the card on offer makes a qualifying hand that has the ability to be larger than the hand it qualifies.\n\n For instance, if you are offered a deal that gives you a pair, that allows the hand to make 3 or 4 of a kind or a full house. This gives you a chance to grow your winnings and make up the the cost of the deal.",
    },
    {
      title: "Junk Hands",
      content: "Junk hands happen often. It's not about the loss, it's about minimizing the bleeding. Take at least 2 royals if you can, but anything more than that limits the chances for making a pair.",
    },
    {
      title: "Maximizing Profit on Small Hands",
      content: "If you have a pair of royals, take any other card and you immediately improve the chances to hit 2 pair on the draw, increasing the potential return on what is effectively a free round.",
    },
  ],
  seven_year_itch: [
    {
      title: "Seed Investment",
      content: "Your Seed Investment is the safest bet on the felt. A come-out 7 wins immediately, while other numbers set the point and lock your investment.",
    },
    {
      title: "Manage the Heat",
      content: "Generating heat yields powerful favors, but it also elevates risk. Balance heat generation by keeping an eye on the heat meter; big bets generate heat much faster but increase your risk profile on a 7. Bet what you can to get to the favor, but don't overextend.",
    },
    {
      title: "Taking Favors Wisely",
      content: "Choose the 'Look The Other Way' favor if available and then bet the farm; then divest when you hit your first 7 and lose the protection of the favor. You have a better chance of this showing up if your balance is lower than your buy-in.",
    },
    {
      title: "Divesting Safely",
      content: "Divesting returns all place bets to your hand, lowering your risk, but it cuts your potential profit on a hot streak. Divest when a bust seems imminent.",
    },
    {
      title: "No-Point Cashout Lock",
      content: "Keep in mind that you can only voluntarily cash out when there is no active point on the board. Plan your exits carefully.",
    },
  ],
  fateseal_silver: [
    {
      title: "Choosing Your Omen",
      content: "In the altar phase, select the omen you feel drawn to. They all pay the same, and are functionally identical.",
    },
    {
      title: "Scatter Crossroads Meter",
      content: "Keep an eye on the scatter meter. Filling the meter lets you enter the Crossroads to purchase additional sigils and bonus modes.",
    },
    {
      title: "Purchasing Additional Sigils",
      content: "You can purchase sigils in the crossroads to increase your odds of making matches. Your payouts will decrease, but your chances to make matches goes up. It is a good trade-off in most cases.",
    },
    {
      title: "Faustian Bargain Risk",
      content: "The Faustian Bargain offers immediate credit infusions but blocks off columns with void reels. Taking this too many times will severely limit your matching potential. Take one or 2 levels of this if it's going to allow you to buy an extra symbol and you have at least 2,000 credits after the purchase.",
    },
    {
      title: "Forbidden Tome and The Crossroads",
      content: "Enabling the Forbidden Tome increases your bet cost by 25% but significantly boosts the spawn rate of scatter symbols, accelerating your path to the Crossroads. Do not enable the tome if you don't have enough credits to make the Crossroads visit worthwhile.",
    },
    {
      title: "Bonuses and Timing",
      content: "Don't take a bonus from the Crossroads unless you have purchased the maximum amount of allowed runes. You are limiting your chances for tumbles otherwise.",
    },
  ],
  masterson_1881: [
    {
      title: "Managing Bettor Suspicion",
      content: "The primary way you lose is by scaring off all the bettors. Always mix in 'Fair Spins' to cool down the table and lower active suspicion.",
    },
    {
      title: "Strategy Identification",
      content: "Martingale bettors double their bets after losses; high-risk bettors seek high payouts. Knowing their profiles lets you choose the perfect moment to rig their bets. Click a player card to see more information about them and a detailed description of their strategy.",
    },
    {
      title: "Whiskey Condensation",
      content: "The bettor's whiskey glass fills as suspicion rises. Watch it closely before making highly obvious specific-number rigs.",
    },
    {
      title: "Exploiting Large Stacks",
      content: "When a Martingale bettor has built a huge wager, consider pulling off a rigged win/loss to maximize house revenue, but be prepared for the massive suspicion spike.",
    },
    {
      title: "Commission Scaling",
      content: "Focus on maintaining a full table of wealthy bettors rather than bankrupting everyone immediately. A stable, long-running table generates far more commission over 30 spins.",
    },
  ],
};
