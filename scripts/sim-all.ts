/**
 * Rollup balance tuning dashboard for The Villains Club.
 * Executes Fateseal, Seven Year Itch, Oubliette No. 9, and Masterton 1881 simulations.
 *
 * Run: `npm run sim:all`
 */
import { runFatesealSimulations } from "./sim-fateseal";
import { runItchSimulations } from "./sim-seven-year-itch";
import { runOublietteSimulations } from "./sim-oubliette";
import { runMastersonSimulations } from "./sim-masterson";

console.log("==============================================================================");
console.log("===                   THE VILLAINS CLUB BALANCE TUNING DASHBOARD           ===");
console.log("==============================================================================");

console.log("\nStarting Fateseal Silver Simulations...");
runFatesealSimulations();

console.log("\nStarting Seven Year Itch Simulations...");
runItchSimulations();

console.log("\nStarting Oubliette No. 9 Simulations...");
runOublietteSimulations();

console.log("\nStarting Masterton 1881 Simulations...");
runMastersonSimulations();

console.log("\n==============================================================================");
console.log("===                          SIMULATIONS COMPLETED                         ===");
console.log("==============================================================================");
