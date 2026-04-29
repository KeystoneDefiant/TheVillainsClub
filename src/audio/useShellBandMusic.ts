import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { bandPublicUrl, bandsCatalog } from "@/config/bandsCatalog";
import { barDateKey, msUntilNextBarBoundary } from "@/audio/barBandSchedule";
import { effectiveBandIndexForBarDate, useBarBandOverrideStore } from "@/audio/barBandOverrideStore";
import { useClubAudioStore } from "@/audio/clubAudioStore";
import { useClubFlowStore } from "@/game/clubFlowStore";

/** House band plays on shell screens and continues uninterrupted into minigames. */
function shellHouseMusicRoute(pathname: string): boolean {
  return pathname === "/" || pathname === "/menu" || pathname === "/bar" || pathname.startsWith("/minigames/");
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shell-owned house band: one band per local "bar day" (4:00 boundary), shuffled
 * play-through of that band's tracks with optional short interludes between songs.
 */
export function useShellBandMusic(): void {
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const remainingMusicRef = useRef<string[]>([]);
  const barKeyRef = useRef(barDateKey(new Date()));
  const bandIndexRef = useRef(effectiveBandIndexForBarDate(barKeyRef.current));
  const lastClipRef = useRef<"music" | "interlude" | null>(null);
  const boundaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.preload = "auto";
    audioRef.current = audio;

    const isShell = () => shellHouseMusicRoute(pathnameRef.current);

    const clearFadeTimer = () => {
      if (fadeTimerRef.current !== null) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };

    const targetVolume = () => {
      const { musicEnabled, musicVolume } = useClubAudioStore.getState();
      if (!musicEnabled) return 0;
      return musicVolume * (useClubFlowStore.getState().hasEnteredClub ? 1 : 0.3);
    };

    const applyVolume = (mode: "instant" | "fade" = "instant") => {
      const next = targetVolume();
      if (mode === "instant") {
        clearFadeTimer();
        audio.volume = next;
        return;
      }
      clearFadeTimer();
      const start = audio.volume;
      const durationMs = 1400;
      const started = performance.now();
      fadeTimerRef.current = setInterval(() => {
        const t = Math.min(1, (performance.now() - started) / durationMs);
        audio.volume = start + (next - start) * t;
        if (t >= 1) {
          clearFadeTimer();
        }
      }, 50);
    };

    applyVolume();

    const refillMusicQueue = () => {
      const band = bandsCatalog.bands[bandIndexRef.current];
      const seed = barKeyRef.current.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + band.id.length * 997;
      const urls = band.music_files.map((f) => bandPublicUrl(band, f));
      shuffleInPlace(urls, mulberry32(seed));
      remainingMusicRef.current = urls;
    };

    const playUrl = (url: string, kind: "music" | "interlude") => {
      lastClipRef.current = kind;
      applyVolume("instant");
      audio.src = url;
      void audio.play().catch(() => {});
    };

    const pickInterludeUrl = (): string | null => {
      const band = bandsCatalog.bands[bandIndexRef.current];
      if (band.interlude_files.length === 0) return null;
      const rel = band.interlude_files[Math.floor(Math.random() * band.interlude_files.length)];
      return bandPublicUrl(band, rel);
    };

    const playNextMusicTrack = () => {
      const { musicEnabled } = useClubAudioStore.getState();
      if (!musicEnabled || !isShell()) return;

      if (remainingMusicRef.current.length === 0) {
        refillMusicQueue();
      }
      const next = remainingMusicRef.current.shift();
      if (!next) return;
      playUrl(next, "music");
    };

    const afterMusicTrack = () => {
      const { musicEnabled } = useClubAudioStore.getState();
      if (!musicEnabled || !isShell()) return;

      const chance = bandsCatalog.interlude_chance_between_tracks;
      const inter = Math.random() < chance ? pickInterludeUrl() : null;
      if (inter) {
        playUrl(inter, "interlude");
        return;
      }
      playNextMusicTrack();
    };

    const onEnded = () => {
      if (lastClipRef.current === "interlude") {
        playNextMusicTrack();
      } else if (lastClipRef.current === "music") {
        afterMusicTrack();
      }
    };

    audio.addEventListener("ended", onEnded);

    const syncBarDayAndMaybeSwitchBand = () => {
      const key = barDateKey(new Date());
      if (key === barKeyRef.current) return;
      barKeyRef.current = key;
      const nextIdx = effectiveBandIndexForBarDate(key);
      if (nextIdx !== bandIndexRef.current) {
        bandIndexRef.current = nextIdx;
        remainingMusicRef.current = [];
        lastClipRef.current = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };

    const scheduleBoundary = () => {
      if (boundaryTimerRef.current !== null) {
        clearTimeout(boundaryTimerRef.current);
      }
      const ms = msUntilNextBarBoundary(new Date());
      boundaryTimerRef.current = setTimeout(() => {
        boundaryTimerRef.current = null;
        syncBarDayAndMaybeSwitchBand();
        scheduleBoundary();
        const { musicEnabled } = useClubAudioStore.getState();
        if (musicEnabled && isShell() && (audio.paused || !audio.src)) {
          playNextMusicTrack();
        }
      }, ms);
    };

    scheduleBoundary();

    const maybeStartOrResume = () => {
      const { musicEnabled } = useClubAudioStore.getState();
      if (!musicEnabled || !isShell()) {
        audio.pause();
        return;
      }
      syncBarDayAndMaybeSwitchBand();
      if (!audio.src || audio.ended) {
        playNextMusicTrack();
      } else {
        void audio.play().catch(() => {});
      }
    };

    const unsubMusic = useClubAudioStore.subscribe((s, prev) => {
      if (s.musicVolume !== prev.musicVolume) {
        applyVolume("fade");
      }
      if (s.musicEnabled !== prev.musicEnabled) {
        if (!s.musicEnabled) {
          audio.pause();
        } else {
          maybeStartOrResume();
        }
      }
    });

    const applyEffectiveBandIndex = (key: string) => {
      const nextIdx = effectiveBandIndexForBarDate(key);
      if (nextIdx === bandIndexRef.current) return;
      bandIndexRef.current = nextIdx;
      remainingMusicRef.current = [];
      lastClipRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };

    const unsubBandOverride = useBarBandOverrideStore.subscribe(() => {
      applyEffectiveBandIndex(barKeyRef.current);
      const { musicEnabled } = useClubAudioStore.getState();
      if (musicEnabled && isShell()) {
        maybeStartOrResume();
      }
    });

    const unsubClubFlow = useClubFlowStore.subscribe((s, prev) => {
      if (s.hasEnteredClub !== prev.hasEnteredClub) {
        applyVolume(s.hasEnteredClub ? "fade" : "instant");
      }
    });

    const onFirstGesture = () => {
      maybeStartOrResume();
    };
    document.addEventListener("pointerdown", onFirstGesture, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onFirstGesture);
      audio.removeEventListener("ended", onEnded);
      unsubMusic();
      unsubBandOverride();
      unsubClubFlow();
      clearFadeTimer();
      if (boundaryTimerRef.current !== null) {
        clearTimeout(boundaryTimerRef.current);
      }
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const { musicEnabled } = useClubAudioStore.getState();

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    if (!shellHouseMusicRoute(pathname)) {
      audio.pause();
      return;
    }

    const key = barDateKey(new Date());
    if (key !== barKeyRef.current) {
      barKeyRef.current = key;
      remainingMusicRef.current = [];
      lastClipRef.current = null;
    }
    const nextIdx = effectiveBandIndexForBarDate(barKeyRef.current);
    if (nextIdx !== bandIndexRef.current) {
      bandIndexRef.current = nextIdx;
      remainingMusicRef.current = [];
      lastClipRef.current = null;
    }

    if (!audio.src || audio.ended) {
      if (remainingMusicRef.current.length === 0) {
        const band = bandsCatalog.bands[bandIndexRef.current];
        const seed = barKeyRef.current.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + band.id.length * 997;
        const urls = band.music_files.map((f) => bandPublicUrl(band, f));
        shuffleInPlace(urls, mulberry32(seed));
        remainingMusicRef.current = urls;
      }
      const next = remainingMusicRef.current.shift();
      if (next) {
        lastClipRef.current = "music";
        const { musicEnabled: enabled, musicVolume } = useClubAudioStore.getState();
        audio.volume = enabled ? musicVolume * (useClubFlowStore.getState().hasEnteredClub ? 1 : 0.3) : 0;
        audio.src = next;
        void audio.play().catch(() => {});
      }
    } else {
      void audio.play().catch(() => {});
    }
  }, [pathname]);
}

/** Mount once under the router; owns the shell HTMLAudioElement for house band playback. */
export function ShellBandMusicHost() {
  useShellBandMusic();
  return null;
}
