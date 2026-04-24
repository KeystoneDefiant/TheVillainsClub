import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ClubAudioSnapshot = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  /** 0–1 linear gain for background music */
  musicVolume: number;
  /** 0–1 linear gain for one-shot SFX */
  sfxVolume: number;
  /**
   * Minimum volume floor for rapidly repeating SFX (e.g. hand scoring), as percent of current SFX gain (0–10).
   * Matches Oubliette `handScoringMinVolumePercent` semantics.
   */
  repeatSfxAttenuationPercent: number;
};

type ClubAudioState = ClubAudioSnapshot & {
  setMusicEnabled: (v: boolean) => void;
  setSfxEnabled: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setRepeatSfxAttenuationPercent: (v: number) => void;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp010 = (n: number) => Math.max(0, Math.min(10, n));

export const useClubAudioStore = create<ClubAudioState>()(
  persist(
    (set) => ({
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.7,
      sfxVolume: 1,
      repeatSfxAttenuationPercent: 0,
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setSfxEnabled: (sfxEnabled) => set({ sfxEnabled }),
      setMusicVolume: (musicVolume) => set({ musicVolume: clamp01(musicVolume) }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume: clamp01(sfxVolume) }),
      setRepeatSfxAttenuationPercent: (repeatSfxAttenuationPercent) =>
        set({ repeatSfxAttenuationPercent: clamp010(repeatSfxAttenuationPercent) }),
    }),
    { name: "villains-club-audio" },
  ),
);
