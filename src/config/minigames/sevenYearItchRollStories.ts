/**
 * Noir flavor lines keyed by dice total. One entry is chosen at random per roll
 * (see {@link pickSevenYearItchRollStory}).
 */

export type SevenYearItchRollStoryRng = () => number;

export type SevenYearItchRollTotal = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const sevenYearItchRollStories: Record<SevenYearItchRollTotal, readonly string[]> = {
  2: [
    "Snake eyes in the gutter — someone paid the wrong cop.",
    "The alley goes quiet; two ones mean a debt just came due.",
    "Twin candles blown out. The fixer whispers: smallest number, biggest problem.",
  ],
  3: [
    "Three across the felt — a courier slips past the cordon.",
    "Easy three: a bent wheel and a straight lie.",
    "The dice find a thin seam; the night gets interested.",
  ],
  4: [
    "Four hits the layout like a gavel — court’s in session underground.",
    "Boxcars’ little brother rolls in; the block captain nods once.",
    "A square number for crooked times.",
  ],
  5: [
    "Fever five — the band plays louder and the blinds stay down.",
    "Nickel on the wire; someone’s phone will ring tonight.",
    "Five opens doors that should have stayed locked.",
  ],
  6: [
    "Six the hard way the world forgot — the street remembers.",
    "Half a dozen witnesses suddenly need coffee.",
    "The dice lean toward the docks; salt and diesel on the air.",
  ],
  7: [
    "Lucky seven for the house — badges, boots, and a busted hinge.",
    "The city’s favorite number shows up wearing handcuffs.",
    "Seven: the train you didn’t hear until it hit the crossing.",
  ],
  8: [
    "Eight spreads like rumor — fast, wide, and hard to kill.",
    "The back room counts in eights; the stack grows anyway.",
    "A fat middle; the case file gets another staple.",
  ],
  9: [
    "Nine — three rows of trouble in a three-piece suit.",
    "Center Street shows a spine; everyone walks straighter for a second.",
    "The big square of the small hours.",
  ],
  10: [
    "Ten: two fives worth of nerve and one open window.",
    "Double digits, single alibi.",
    "The freight timetable slips — ten on the dice, midnight on the clock.",
  ],
  11: [
    "Yo-leven — the elevator dings for the penthouse.",
    "A long shot with a short fuse.",
    "Eleven: champagne troubles and basement solutions.",
  ],
  12: [
    "Boxcars — the train leaves whether you’re on it or under it.",
    "Midnight and noon tied in a knot.",
    "Twelve: the house pretends it didn’t see, and charges anyway.",
  ],
} as const;

export function pickSevenYearItchRollStory(total: number, rng: SevenYearItchRollStoryRng = Math.random): string {
  const key = Math.min(12, Math.max(2, Math.round(total))) as SevenYearItchRollTotal;
  const lines = sevenYearItchRollStories[key];
  const i = Math.floor(rng() * lines.length);
  return lines[i] ?? lines[0];
}
