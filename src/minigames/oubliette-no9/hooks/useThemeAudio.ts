import { useCallback, useEffect } from "react";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { gameConfig } from "@/config/minigames/oublietteNo9GameRules";
import {
  OUBLIETTE_SOUND_PACK_DIR,
  oublietteBackgroundTracks,
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
  backgroundMusic: HTMLAudioElement | null;
}

const globalAudioCache: AudioInstances = {
  soundEffects: new Map(),
  backgroundMusic: null,
};

let lastPlayedMusicIndex = -1;

const handRankPlaysThisRound: Record<string, number> = {};

/** Stop all Oubliette HTMLAudio instances (call when leaving the minigame route). */
export function disposeOublietteAudio(): void {
  globalAudioCache.soundEffects.forEach((a) => {
    a.pause();
    a.currentTime = 0;
  });
  globalAudioCache.soundEffects.clear();
  const m = globalAudioCache.backgroundMusic;
  if (m) {
    m.pause();
    m.currentTime = 0;
    m.removeAttribute("src");
    globalAudioCache.backgroundMusic = null;
  }
  Object.keys(handRankPlaysThisRound).forEach((k) => delete handRankPlaysThisRound[k]);
}

function soundBaseUrl(): string {
  const base = import.meta.env.BASE_URL;
  return `${base}sounds/`;
}

/**
 * Legacy settings shape kept for API compatibility with Oubliette components.
 * Playback volumes and mute flags are driven by {@link useClubAudioStore}.
 */
export interface ThemeAudioSettings {
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicVolume?: number;
  soundEffectsVolume?: number;
  handScoringMinVolumePercent?: number;
}

/** Oubliette SFX / BGM — routed through the club-wide audio store (no theme loader). */
export function useThemeAudio(audioSettings?: ThemeAudioSettings) {
  void audioSettings;
  useClubAudioStore((s) => [s.musicVolume, s.sfxVolume]);

  useEffect(() => {
    const unsub = useClubAudioStore.subscribe((s) => {
      const m = s.musicVolume;
      if (globalAudioCache.backgroundMusic) {
        globalAudioCache.backgroundMusic.volume = m;
      }
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

  const playMusic = useCallback(() => {
    const { musicEnabled, musicVolume } = useClubAudioStore.getState();
    if (!musicEnabled) return;

    try {
      const tracks = [...oublietteBackgroundTracks];
      if (tracks.length === 0) return;

      const basePath = `${soundBaseUrl()}${OUBLIETTE_SOUND_PACK_DIR}/`;
      const volume = musicVolume ?? gameConfig.audio.musicVolume;

      const pickNextIndex = (): number => {
        if (tracks.length === 1) return 0;
        let idx = Math.floor(Math.random() * tracks.length);
        if (idx === lastPlayedMusicIndex && tracks.length > 1) {
          idx = (idx + 1) % tracks.length;
        }
        return idx;
      };

      const playTrack = (index: number) => {
        const file = tracks[index]!;
        lastPlayedMusicIndex = index;
        const musicPath = basePath + file;
        let audio = globalAudioCache.backgroundMusic;

        if (!audio) {
          audio = new Audio(musicPath);
          audio.volume = volume;
          globalAudioCache.backgroundMusic = audio;
        } else {
          audio.src = musicPath;
          audio.volume = volume;
        }

        audio.loop = tracks.length === 1;
        if (tracks.length > 1) {
          const onEnded = () => {
            audio!.removeEventListener("ended", onEnded);
            const nextIdx = pickNextIndex();
            playTrack(nextIdx);
          };
          audio.addEventListener("ended", onEnded);
        }

        void audio.play().catch(() => {});
      };

      playTrack(pickNextIndex());
    } catch {
      // silence
    }
  }, []);

  const stopMusic = useCallback(() => {
    const audio = globalAudioCache.backgroundMusic;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopAll = useCallback(() => {
    globalAudioCache.soundEffects.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    stopMusic();
  }, [stopMusic]);

  const resetRoundSoundCounts = useCallback(() => {
    Object.keys(handRankPlaysThisRound).forEach((k) => delete handRankPlaysThisRound[k]);
  }, []);

  return {
    playSound,
    playMusic,
    stopMusic,
    stopAll,
    resetRoundSoundCounts,
  };
}
