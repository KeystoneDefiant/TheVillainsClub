/**
 * Static Oubliette audio manifest (was loaded from theme config).
 * Files live under `public/sounds/{OUBLIETTE_SOUND_PACK_DIR}/`.
 */
export const OUBLIETTE_SOUND_PACK_DIR = "Classic" as const;

export const OUBLIETTE_SCREEN_TRANSITION_MS = 300;

export const oublietteUiSoundFiles = {
  buttonClick: "button-click.ogg",
  shopPurchase: "shop-purchase.ogg",
  screenTransition: "screen-transition.ogg",
  returnToPreDraw: "return-to-predraw.ogg",
  cheater: "cheater.ogg",
} as const;

export const oublietteHandScoringFiles: Record<string, string> = {
  "royal-flush": "royalflush.ogg",
  "straight-flush": "straightflush.ogg",
  "four-of-a-kind": "fourofakind.ogg",
  "full-house": "fullhouse.ogg",
  flush: "flush.ogg",
  straight: "straight.ogg",
  "three-of-a-kind": "threeofakind.ogg",
  "two-pair": "twopair.ogg",
  "one-pair": "onepair.ogg",
};

export const oublietteBackgroundTracks = [
  "bgm1.mp3",
  "bgm2.mp3",
  "bgm3.mp3",
  "bgm4.mp3",
] as const;
