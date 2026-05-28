# New game - Bismark Black

- Horse Racing betting simulator, 8 horses, Pari-Mutuel betting style

- Players can bet win, place, show, or trifecta.

- Odds are calculated using a pool of 99 virtual bettors. Each bettor will bet a random number between $2-$500, with their bet being placed either against a horse that is likely to win based on stats, a longshot of a horse, the highest jockey rating, or the highest speed rating. This selection is random. The bettor pool, and bet min-max should be expressed in the game's config.

- Horse stats are generated using a pool of 100 points across Speed, Power, Stamina, Luck and Jockey. These stats are not shown to the player.

- Pre bet, the horses are shown to the player, along with odds.

- Player gets 2 unique actions before betting, values should be expressed in the game config:
* Protect horse: 65% chance that a specific horse does not scratch or is debuffed
* Scratch horse: 45% chance to scratch a specific horse, odds are recalculated
* Boost horse: Grants 15 additional stat points spread randomly to a specific horse
* Lame horse: Removes 10 stat points spread randomly to a specific horse
* Bribe Jockey: 75% chance to remove half of the jockey points from a specific horse 
* Threaten Jockey: 50% chance to double jockey points on a specific horse
* Scout: Get a generalized report on 2 stat lines from 3 random horses. This report would read something akin to "This horse is the fastest on the track and has been on a lucky streak", or "This horse doesn't seem to have a lot of stamina, but has a very good jockey". Comments are based on comparisons to the rest of the field, and only 2 stats are evaluated, with a 25% chance of getting a third stat line per horse.

- A horse can scratch after betting ends but before the race begins. This is calculated by taking a random number between 10 and 30, and subtracting (Luck*random number between 1-5). Once this number is determined, randomize a number between 1-100, and if the number randomized is less than the scratch number, that horse is scratched. If this horse has been protected, then randomize a number between 1-100 and if the number is less than protection percent specified in the config, the horse is not scratched.  If any horses are scratched, it should be noted on the race screen with "Horse #x has been scratched at post time".

 - A horse can be affected with the "lame horse" action after betting ends but before the race begins. This is calculated by taking a random number between 10 and 50, and subtracting (Luck*random number between 1-10). Once this number is determined, randomize a number between 1-100, and if the number randomized is less than the debuff number, that horse is affected by the Lame Horse effect. If this horse has been protected, then randomize a number between 1-100 and if the number is less than protection percent specified in the config, the horse is not affected. If any horses are debuffed, it should be noted on the race screen with "Horse #x looks to be coming up a little lame to the gate".

- Race calculations
* ((Speed*Stamina)+ (Jockey*(random number between 1-5))) - ((Power of 3 random horses in the field - (Luck*(random number between 1-5))). This should be expressed in the game's config
* Horse placement order is based on who has the highest number

- Race
* 8 differently colored horses race across the screen over a 15 second race, with each horse placing where it should based on the race calculations seen above. There should be some tension with the race, meaning a horse could trail behind at the start of race, or fall behind at the end of the race. There should not be an obvious gigantic speed boost or "rubber banding" of a horse - the race should look competitive and dynamic.