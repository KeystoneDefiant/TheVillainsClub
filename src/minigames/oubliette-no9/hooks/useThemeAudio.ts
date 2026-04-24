import { useCallback, useEffect } from "react";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import {
  OUBLIETTE_SOUND_PACK_DIR,
  oublietteHandScoringFiles,
  oublietteUiSoundFiles,
} from "@/config/minigames/oublietteAudioAssets";
import type { HandRank } from "../types";

type SoundEvent =
  | "buttonClick"
  | "shopPurchase"
  | "screenTransition"
  | "returnToPreDraw"
  | "cheater"
  | "handScoring";

interface AudioInstances {
  soundEffects: Map<string, HTMLAudioElement>;
}

const globalAudioCache: AudioInstances = {
  soundEffects: new Map(),
};

const handRankPlaysThisRound: Record<string, number> = {};

/** Stop cached Oubliette SFX instances (call when leaving the minigame route). */
export function disposeOublietteAudio(): void {
  globalAudioCache.soundEffects.forEach((a) => {
    a.pause();
    a.currentTime = 0;
  });
  globalAudioCache.soundEffects.clear();
  Object.keys(handRankPlaysThisRound).forEach((k) => delete handRankPlaysThisRound[k]);
}

function soundBaseUrl(): string {
  const base = import.meta.env.BASE_URL;
  return `${base}sounds/`;
}

/**
 * Oubliette UI / table SFX only. Volumes and mute are read from {@link useClubAudioStore}
 * (main menu / shell settings). Background music is owned by the shell, not this hook.
 */
export function useThemeAudio() {
  useEffect(() => {
    const unsub = useClubAudioStore.subscribe((s) => {
      globalAudioCache.soundEffects.forEach((audio) => {
        audio.volume = s.sfxVolume;
      });
    });
    return unsub;
  }, []);

  const playSound = useCallback((event: SoundEvent, handRank?: HandRank) => {
    const { sfxEnabled, sfxVolume, repeatSfxAttenuationPercent } = useClubAudioStore.getState();
    if (!sfxEnabled) return;

    try {
      let audioPath: string | undefined;

      if (event === "buttonClick") {
        audioPath = oublietteUiSoundFiles.buttonClick;
      } else if (event === "shopPurchase") {
        audioPath = oublietteUiSoundFiles.shopPurchase;
      } else if (event === "screenTransition") {
        audioPath = oublietteUiSoundFiles.screenTransition;
      } else if (event === "returnToPreDraw") {
        audioPath = oublietteUiSoundFiles.returnToPreDraw;
      } else if (event === "cheater") {
        audioPath = oublietteUiSoundFiles.cheater;
      } else if (event === "handScoring" && handRank) {
        audioPath = oublietteHandScoringFiles[handRank];
      }

      if (!audioPath) return;

      const fullPath = `${soundBaseUrl()}${OUBLIETTE_SOUND_PACK_DIR}/${audioPath}`;

      const audioKey = `${event}-${handRank || ""}`;
      let audio = globalAudioCache.soundEffects.get(audioKey);

      const baseVolume = sfxVolume;
      let volume = baseVolume;

      if (event === "handScoring" && handRank) {
        handRankPlaysThisRound[handRank] = (handRankPlaysThisRound[handRank] || 0) + 1;
        const count = handRankPlaysThisRound[handRank];
        const minVolPercent = repeatSfxAttenuationPercent;
        const minFloor = baseVolume * (minVolPercent / 100);
        if (count > 5) {
          const ducked = baseVolume * Math.pow(0.75, count - 5);
          volume = Math.max(minFloor, ducked);
        }
      }

      if (!audio) {
        audio = new Audio(fullPath);
        audio.volume = volume;
        globalAudioCache.soundEffects.set(audioKey, audio);
      } else {
        audio.volume = volume;
      }

      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
      // silence
    }
  }, []);

  const resetRoundSoundCounts = useCallback(() => {
    Object.keys(handRankPlaysThisRound).forEach((k) => delete handRankPlaysThisRound[k]);
  }, []);

  return {
    playSound,
    resetRoundSoundCounts,
  };
}
