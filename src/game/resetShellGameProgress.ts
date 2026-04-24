import { useClubWallet } from "./clubWalletStore";
import { useMetaProgression } from "./metaProgressionStore";

/**
 * Clears shell progression: club wallet (default balance), table session, resume stub,
 * and meta unlocks. Keeps audio, motion, and minigame UI preference keys in localStorage.
 */
export function resetShellGameProgress(): void {
  useClubWallet.getState().resetWalletAndSession();
  useMetaProgression.getState().resetMetaProgression();
}
