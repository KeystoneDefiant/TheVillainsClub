import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { computeFatesealReturn, type FatesealShellBinding } from "@/game/sessionSettlement";
import { UnifiedGameHeader } from "@/components/ui/UnifiedGameHeader";
import { GameSettingsModal } from "@/components/ui/GameSettingsModal";
import {
  FATESEAL_STANDARD_SYMBOLS,
  crossroadsNextOmenAdditionCostCredits,
  fatesealCrossroadsNewShop,
  fatesealProphecyMode,
  fatesealProgressionRules,
  fatesealScatterRitual,
  fatesealSymbolLore,
  resolveFatesealGameMode,
  type FatesealStandardId,
  type FatesealSymbolId,
} from "@/config/minigames/fatesealRules";
import { defaultMotionPreset } from "@/motion/presets";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";
import {
  createInitialFatesealState,
  runSpin,
  type FatesealEngineState,
} from "./engine/cascadeEngine";
import {
  applyCrossroads,
  applyCrossroadsAddOmenSymbol,
  applyCrossroadsDeadReel,
  applyCrossroadsOmenMark,
  applyCrossroadsWildReel,
  faustianCreditGrant,
  silverVisionCost,
  tomeCost,
  type CrossroadsChoice,
} from "./engine/shopEngine";
import "./fatesealSilver.css";

const SYMBOL_LABEL: Record<FatesealSymbolId, string> = {
  dagger: "Dg",
  chalice: "Ch",
  goat: "Gt",
  eye: "Ey",
  serpent: "Se",
  moon: "Mn",
  flame: "Fl",
  key: "Ky",
  wild: "W★",
  scatter: "Sc",
  void: "∅",
};

type FatesealPhase = "altar" | "ritual" | "ledger" | "crossroads";

type CrossroadsVisitFlags = {
  /** Successful add-omen purchases this visit (drives next price via `crossroadsNextOmenAdditionCostCredits`). */
  omenAddPurchased: number;
  legacyFaustian: boolean;
  legacySilver: boolean;
  legacyTome: boolean;
};

function emptyCrossroadsVisit(): CrossroadsVisitFlags {
  return {
    omenAddPurchased: 0,
    legacyFaustian: false,
    legacySilver: false,
    legacyTome: false,
  };
}

function rngFactory() {
  return () => Math.random();
}

function dupGrid(grid: FatesealSymbolId[][]): FatesealSymbolId[][] {
  return grid.map((row) => [...row]);
}

function clampBetToTable(raw: number, minBet: number, maxBet: number, chipStep: number): number {
  const step = Math.max(1, chipStep);
  const cap = Math.max(minBet, maxBet);
  const clamped = Math.floor(Math.max(minBet, Math.min(raw, cap)) / step) * step;
  return Math.min(Math.max(clamped, minBet), cap);
}

/** Raw bankroll fraction must reach `minBet` before the chip is enabled (TODO.md). */
function walletFractionBet(
  wallet: number,
  fraction: number,
  minBet: number,
  maxBet: number,
  chipStep: number,
): { bet: number; disabled: boolean } {
  const raw = Math.floor(wallet * fraction);
  if (raw < minBet) return { bet: minBet, disabled: true };
  return { bet: clampBetToTable(raw, minBet, maxBet, chipStep), disabled: false };
}

/** Split cascade step payout across prophecy-hit cells — sums equal `payout` when payout > 0 and n > 0. */
function splitCascadeStepPayout(payout: number, prophecyHits: number): number[] {
  if (prophecyHits <= 0) return [];
  const base = Math.floor(payout / prophecyHits);
  const rem = payout - base * prophecyHits;
  return Array.from({ length: prophecyHits }, (_, i) => base + (i < rem ? 1 : 0));
}

/** TODO.md — slightly slower cascade choreography on motion-enabled builds. */
const RITUAL_TIMING_SCALE = 1.15;

const CASCADE_FOCUS_MS = Math.round(140 * RITUAL_TIMING_SCALE);
const CASCADE_EMIT_AFTER_MS = Math.round(100 * RITUAL_TIMING_SCALE);
/**
 * Time the prophecy / payout overlay holds with the BEFORE grid before the
 * post-cascade refill swaps in. Tuned so the payout flyoff (~480ms total) is
 * mostly past its peak when the new tiles begin to drop.
 */
const CASCADE_FLOAT_MS = Math.round(360 * RITUAL_TIMING_SCALE);
/**
 * Window during which the post-cascade grid is shown with `--dropIn` cells
 * animating in. Must comfortably exceed the drop-in animation duration plus
 * the per-row stagger (CSS: 320ms anim + 4 × 35ms stagger = 460ms).
 */
const CASCADE_REFILL_MS = Math.round(480 * RITUAL_TIMING_SCALE);
/** Final beat after tiles settle visually before next cascade depth. */
const CASCADE_SETTLE_MS = Math.round(80 * RITUAL_TIMING_SCALE);

/**
 * Timings tuned so total per depth ≈
 * CASCADE_FOCUS_MS + CASCADE_EMIT_AFTER_MS + CASCADE_FLOAT_MS + CASCADE_REFILL_MS + CASCADE_SETTLE_MS.
 */
const CASCADE_STEP_DURATION_MS =
  CASCADE_FOCUS_MS +
  CASCADE_EMIT_AFTER_MS +
  CASCADE_FLOAT_MS +
  CASCADE_REFILL_MS +
  CASCADE_SETTLE_MS;

/**
 * Window dedicated to the spin's initial tablet fill (after the prior round's
 * grid is replaced by a fresh randomized roll). Holds the cascade-step gating
 * back until the tiles have visibly "landed" on the tablet.
 */
const FILL_DURATION_MS = Math.round(460 * RITUAL_TIMING_SCALE);

type CascadeOverlay = {
  /**
   * Identifies cascade depth for payout flyoff remount animation. Use `-1`
   * for the synthetic initial-fill frame so its cell keys do not collide
   * with cascade-depth flyoffs.
   */
  depth: number;
  grid: FatesealSymbolId[][];
  removalKeys: ReadonlySet<string>;
  prophecyKeys: ReadonlySet<string>;
  /** Cells that should play the drop-in CSS animation against the current grid. */
  dropInKeys: ReadonlySet<string>;
  payouts: readonly { cellKey: string; text: string }[];
};

function diffDropInKeys(
  before: FatesealSymbolId[][],
  after: FatesealSymbolId[][],
): Set<string> {
  const out = new Set<string>();
  for (let r = 0; r < after.length; r++) {
    const row = after[r]!;
    const prev = before[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      if (prev[c] !== row[c]) out.add(`${r},${c}`);
    }
  }
  return out;
}

function allCellKeys(grid: FatesealSymbolId[][]): Set<string> {
  const out = new Set<string>();
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      out.add(`${r},${c}`);
    }
  }
  return out;
}

function adjacentVoid(grid: FatesealSymbolId[][], row: number, col: number): boolean {
  const n = grid.length;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < n && c >= 0 && c < n && grid[r]![c] === "void") return true;
  }
  return false;
}

function fatesealPhasePresence(reduceMotion: boolean) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1, y: 0, z: 0 },
      animate: { opacity: 1, y: 0, z: 0, transition: { duration: 0 } },
      exit: { opacity: 1, y: 0, z: 0, transition: { duration: 0 } },
    };
  }
  const ease = [...defaultMotionPreset.easing] as [number, number, number, number];
  const d = defaultMotionPreset.menuItemDuration;
  return {
    initial: { opacity: 0, y: 14, z: 0 },
    animate: {
      opacity: 1,
      y: 0,
      z: 0,
      transition: { duration: d, ease },
    },
    exit: {
      opacity: 0,
      y: -10,
      z: 0,
      transition: { duration: 0.22, ease },
    },
  };
}

export function FatesealSilverRoot(props: FatesealShellBinding) {
  const buyIn = props.settlement.buyIn;
  const tableRules = useMemo(() => resolveFatesealGameMode(props.gameModeId), [props.gameModeId]);
  const reduceMotion = usePrefersReducedMotion();
  const [engine, setEngine] = useState<FatesealEngineState>(() =>
    createInitialFatesealState(props.sessionCredits, buyIn, Math.random, resolveFatesealGameMode(props.gameModeId)),
  );
  const [phase, setPhase] = useState<FatesealPhase>("altar");
  const atCrossroads = phase === "crossroads";
  const [picks, setPicks] = useState<FatesealStandardId[]>([]);
  const [busy, setBusy] = useState(false);
  const [crossroadsVisit, setCrossroadsVisit] = useState<CrossroadsVisitFlags>(emptyCrossroadsVisit);
  const [lastFeed, setLastFeed] = useState<string[]>([]);
  const [lastSpinTotalPayout, setLastSpinTotalPayout] = useState(0);
  const [sympatheticFlash, setSympatheticFlash] = useState<{ payout: number; id: number } | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [silverPick, setSilverPick] = useState<FatesealStandardId>("dagger");
  const [omenAddPick, setOmenAddPick] = useState<FatesealStandardId>("chalice");
  const [markPick, setMarkPick] = useState<FatesealStandardId>("dagger");
  const [cascadeOverlay, setCascadeOverlay] = useState<CascadeOverlay | null>(null);
  /** Browser timers are numeric handles; avoids NodeJS `Timeout` vs `number` clashes under `tsc`. */
  const cascadeTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      cascadeTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (phase !== "crossroads") return;
    if (engine.activeProphecy.includes(omenAddPick)) {
      const next = FATESEAL_STANDARD_SYMBOLS.find((id) => !engine.activeProphecy.includes(id));
      if (next != null) setOmenAddPick(next);
    }
    if (engine.activeProphecy.length > 0 && !engine.activeProphecy.includes(markPick)) {
      setMarkPick(engine.activeProphecy[0]!);
    }
  }, [phase, engine.activeProphecy, omenAddPick, markPick]);

  useEffect(() => {
    if (!sympatheticFlash) return;
    const ms = reduceMotion ? 900 : 4000;
    const t = window.setTimeout(() => setSympatheticFlash(null), ms);
    return () => window.clearTimeout(t);
  }, [sympatheticFlash, reduceMotion]);

  const clearCascadeTimers = useCallback(() => {
    cascadeTimersRef.current.forEach((id) => window.clearTimeout(id));
    cascadeTimersRef.current = [];
  }, []);

  const panelPaper = useMemo(
    () =>
      ({
        borderColor: clubTokens.surface.brassStroke as string,
        background: clubTokens.surface.panel as string,
      }) as const,
    [],
  );

  const pickerSelectedStyle = useMemo(
    () => ({
      border: `1px solid ${clubTokens.text.accent}`,
      borderRadius: 8,
      padding: "6px 4px",
      background: "rgba(209, 97, 102, 0.18)",
      textAlign: "center" as const,
    }),
    [],
  );

  const pickerIdleStyle = useMemo(
    () => ({
      border: `1px solid rgba(200,208,218,0.18)`,
      borderRadius: 8,
      padding: "6px 4px",
      background: "rgba(0,0,0,0.35)",
      textAlign: "center" as const,
    }),
    [],
  );

  const maxBaseBet = useMemo(
    () =>
      Math.max(
        tableRules.minBaseBet,
        Math.floor(engine.sessionWallet * tableRules.maxBaseBetFractionOfSession),
      ),
    [engine.sessionWallet, tableRules.maxBaseBetFractionOfSession, tableRules.minBaseBet],
  );

  const betChipOptions = useMemo(() => {
    const w = engine.sessionWallet;
    const minB = tableRules.minBaseBet;
    const maxB = maxBaseBet;
    const step = tableRules.chipIncrement;
    return {
      min: clampBetToTable(minB, minB, maxB, step),
      eighth: walletFractionBet(w, 1 / 8, minB, maxB, step),
      quarter: walletFractionBet(w, 1 / 4, minB, maxB, step),
      half: walletFractionBet(w, 1 / 2, minB, maxB, step),
    };
  }, [engine.sessionWallet, maxBaseBet, tableRules.chipIncrement, tableRules.minBaseBet]);

  const sealProphecy = useCallback(() => {
    const uniq = [...new Set(picks)];
    if (uniq.length !== 1) return;
    setEngine((e) => ({
      ...e,
      prophecyMode: "single",
      activeProphecy: uniq,
    }));
    setPhase("ritual");
  }, [picks]);

  const goToAltarFromRitual = useCallback(() => {
    if (busy) return;
    clearCascadeTimers();
    setCascadeOverlay(null);
    const prev = engine.activeProphecy;
    setEngine((e) => ({
      ...e,
      activeProphecy: [],
    }));
    setPicks(prev.length > 0 ? [prev[0]!] : []);
    setPhase("altar");
  }, [busy, clearCascadeTimers, engine.activeProphecy]);

  const goToRitualFromLedger = useCallback(() => {
    if (busy || atCrossroads || engine.activeProphecy.length === 0) return;
    setPhase("ritual");
  }, [atCrossroads, busy, engine.activeProphecy.length]);

  const togglePick = useCallback((id: FatesealStandardId) => {
    setPicks((prev) => (prev[0] === id ? [] : [id]));
  }, []);

  const handleSpin = useCallback(
    (overrideBaseBet?: number) => {
      if (busy || atCrossroads) return;
      if (engine.activeProphecy.length === 0) return;
      setBusy(true);
      clearCascadeTimers();
      const rng = rngFactory();
      const spinEngine =
        overrideBaseBet !== undefined
          ? {
              ...engine,
              baseBet: clampBetToTable(
                overrideBaseBet,
                tableRules.minBaseBet,
                maxBaseBet,
                tableRules.chipIncrement,
              ),
            }
          : engine;
      /**
       * The grid that was visible to the player before this spin replaces it
       * with a fresh randomized roll. Used to compute which cells appear "new"
       * for the initial fill drop-in animation.
       */
      const preSpinGrid = spinEngine.grid;
      const result = runSpin(spinEngine, rng);

    const pushLedgerAndFinish = () => {
      const lines = result.log
        .filter((l): l is Extract<typeof l, { kind: "cascade" }> => l.kind === "cascade")
        .map((l) => `Cascade ${l.depth + 1}: +${l.payout.toLocaleString()} (prophecy ${l.prophecyMatches})`);
      for (const l of result.log) {
        if (l.kind === "sympathetic_vibrations") {
          lines.push(`Sympathetic Vibrations: +${l.payout.toLocaleString()}`);
        }
      }
      if (result.totalPayout > 0) {
        lines.push(`Spin total +${result.totalPayout.toLocaleString()}`);
      }
      setLastSpinTotalPayout(result.totalPayout);
      const sym = result.log.find((l): l is Extract<typeof l, { kind: "sympathetic_vibrations" }> => l.kind === "sympathetic_vibrations");
      if (sym) {
        setSympatheticFlash({ payout: sym.payout, id: Date.now() });
      }
      setLastFeed((f) => [...lines, ...f].slice(0, 14));
      setCascadeOverlay(null);
      setEngine(result.nextState);
      setBusy(false);
      if (result.crossroadsGate) {
        setCrossroadsVisit(emptyCrossroadsVisit());
        setPhase("crossroads");
      } else {
        setPhase("ledger");
      }
    };

    const frames = result.cascadeKeyframes;

    if (reduceMotion) {
      pushLedgerAndFinish();
      return;
    }

    /**
     * The post-fill grid the player sees once the tablet is full. When the
     * spin produced cascade frames, frames[0].gridBeforeRemoval is that
     * grid; otherwise the engine's resolved grid is the final visible one.
     */
    const postFillGrid =
      frames.length > 0 ? frames[0]!.gridBeforeRemoval : result.nextState.grid;
    const fillDropIns = diffDropInKeys(preSpinGrid, postFillGrid);
    /**
     * Even when no cell symbol changed (e.g. an empty initial grid scenario
     * in tests), animate the whole tablet so the fill always reads as "new"
     * to the player.
     */
    const fillKeys =
      fillDropIns.size > 0 ? fillDropIns : allCellKeys(postFillGrid);

    cascadeTimersRef.current.push(
      window.setTimeout(() => {
        setCascadeOverlay({
          depth: -1,
          grid: dupGrid(postFillGrid),
          removalKeys: new Set<string>(),
          prophecyKeys: new Set<string>(),
          dropInKeys: fillKeys,
          payouts: [],
        });
      }, 0),
    );

    let at = FILL_DURATION_MS;
    for (const fr of frames) {
      const removals = new Set(fr.removedKeys);
      const prophecies = new Set(fr.prophecyMatchKeys);
      const refillDropIns = diffDropInKeys(fr.gridBeforeRemoval, fr.gridAfterCascade);

      cascadeTimersRef.current.push(
        window.setTimeout(() => {
          setCascadeOverlay({
            depth: fr.depth,
            grid: dupGrid(fr.gridBeforeRemoval),
            removalKeys: removals,
            prophecyKeys: prophecies,
            dropInKeys: new Set<string>(),
            payouts: [],
          });
        }, at),
      );

      cascadeTimersRef.current.push(
        window.setTimeout(() => {
          const keys = [...fr.prophecyMatchKeys].sort();
          const chunks = splitCascadeStepPayout(fr.payout, keys.length);
          const payouts = keys
            .map((cellKey, i) => {
              const n = chunks[i] ?? 0;
              return n > 0 ? { cellKey, text: `+${n.toLocaleString()}` } : null;
            })
            .filter((x): x is { cellKey: string; text: string } => x != null);

          setCascadeOverlay({
            depth: fr.depth,
            grid: dupGrid(fr.gridBeforeRemoval),
            removalKeys: removals,
            prophecyKeys: prophecies,
            dropInKeys: new Set<string>(),
            payouts,
          });
        }, at + CASCADE_FOCUS_MS + CASCADE_EMIT_AFTER_MS),
      );

      cascadeTimersRef.current.push(
        window.setTimeout(() => {
          setCascadeOverlay({
            depth: fr.depth,
            grid: dupGrid(fr.gridAfterCascade),
            removalKeys: new Set<string>(),
            prophecyKeys: new Set<string>(),
            dropInKeys: refillDropIns,
            payouts: [],
          });
        }, at + CASCADE_FOCUS_MS + CASCADE_EMIT_AFTER_MS + CASCADE_FLOAT_MS),
      );

      at += CASCADE_STEP_DURATION_MS;
    }

    cascadeTimersRef.current.push(window.setTimeout(pushLedgerAndFinish, at));
  }, [atCrossroads, busy, clearCascadeTimers, engine, maxBaseBet, reduceMotion, tableRules]);

  const applyLegacyShop = useCallback(
    (choice: CrossroadsChoice) => {
      if (choice === "faustian_bargain" && crossroadsVisit.legacyFaustian) return;
      if (choice === "silver_vision" && (crossroadsVisit.legacySilver || engine.silverVisionTarget != null)) return;
      if (choice === "forbidden_tome" && crossroadsVisit.legacyTome) return;
      const res = applyCrossroads(engine, choice, choice === "silver_vision" ? silverPick : null, buyIn);
      if (!res.ok) return;
      setEngine(res.nextState);
      setCrossroadsVisit((v) => ({
        ...v,
        legacyFaustian: choice === "faustian_bargain" ? true : v.legacyFaustian,
        legacySilver: choice === "silver_vision" ? true : v.legacySilver,
        legacyTome: choice === "forbidden_tome" ? true : v.legacyTome,
      }));
    },
    [buyIn, crossroadsVisit.legacyFaustian, crossroadsVisit.legacySilver, crossroadsVisit.legacyTome, engine, silverPick],
  );

  const buyAddOmen = useCallback(() => {
    const res = applyCrossroadsAddOmenSymbol(engine, omenAddPick, crossroadsVisit.omenAddPurchased);
    if (!res.ok) return;
    setEngine(res.nextState);
    setCrossroadsVisit((v) => ({ ...v, omenAddPurchased: v.omenAddPurchased + 1 }));
  }, [crossroadsVisit.omenAddPurchased, engine, omenAddPick]);

  const buyWildReel = useCallback(() => {
    const res = applyCrossroadsWildReel(engine);
    if (!res.ok) return;
    setEngine(res.nextState);
  }, [engine]);

  const takeDeadReel = useCallback(() => {
    const res = applyCrossroadsDeadReel(engine);
    if (!res.ok) return;
    setEngine(res.nextState);
  }, [engine]);

  const buyOmenMark = useCallback(() => {
    const res = applyCrossroadsOmenMark(engine, markPick);
    if (!res.ok) return;
    setEngine(res.nextState);
  }, [engine, markPick]);

  const leaveCrossroads = useCallback(() => setPhase("ledger"), []);

  const canCashOut = !busy && !atCrossroads && engine.activeProphecy.length > 0;

  const addOmenShop = useMemo(() => {
    const maxSymbols = 1 + fatesealCrossroadsNewShop.addOmenSymbol.maxPurchasesThisVisit;
    const nextCost = crossroadsNextOmenAdditionCostCredits(crossroadsVisit.omenAddPurchased);
    const canBuy =
      engine.activeProphecy.length < maxSymbols &&
      Number.isFinite(nextCost) &&
      !engine.activeProphecy.includes(omenAddPick) &&
      engine.sessionWallet >= nextCost;
    return { maxSymbols, nextCost, canBuy };
  }, [
    crossroadsVisit.omenAddPurchased,
    engine.activeProphecy,
    engine.sessionWallet,
    omenAddPick,
  ]);

  const wildReelShop = useMemo(() => {
    const cfg = fatesealCrossroadsNewShop.wildReel;
    const n = engine.wildReelPaidSpinTimers.length;
    const canBuy = n < cfg.maxActive && engine.sessionWallet >= cfg.costCredits;
    return { ...cfg, canBuy, activeSlots: n, timers: engine.wildReelPaidSpinTimers };
  }, [engine.sessionWallet, engine.wildReelPaidSpinTimers]);

  const deadReelShop = useMemo(() => {
    const cfg = fatesealCrossroadsNewShop.deadReel;
    const n = engine.deadReelPaidSpinTimers.length;
    const canTake = n < cfg.maxActive;
    return { ...cfg, canTake, activeSlots: n, timers: engine.deadReelPaidSpinTimers };
  }, [engine.deadReelPaidSpinTimers]);

  const omenMarkShop = useMemo(() => {
    const cfg = fatesealCrossroadsNewShop.omenMark;
    const canBuy =
      engine.markedOmenSymbol == null &&
      engine.activeProphecy.includes(markPick) &&
      engine.sessionWallet >= cfg.costCredits;
    return { ...cfg, canBuy };
  }, [engine.activeProphecy, engine.markedOmenSymbol, engine.sessionWallet, markPick]);

  const crossroadsScatterThreshold = fatesealProgressionRules.crossroads.scatterSymbolsToTriggerShop;
  const bonusSymbolsUntilCrossroads = Math.max(
    0,
    crossroadsScatterThreshold - engine.crossroadsBonusAccum,
  );
  const displayGrid = cascadeOverlay?.grid ?? engine.grid;
  const presence = fatesealPhasePresence(reduceMotion);

  const ritualSidePanel = (
    <Paper
      radius="md"
      p="sm"
      withBorder
      style={{
        ...panelPaper,
        alignSelf: "stretch",
        maxHeight: 440,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 200,
        flex: "1 1 200px",
      }}
      className="fateseal-ritual-side"
      aria-label="Round stats and recent ledger lines"
    >
      <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
        Table readout
      </Text>
      <Text size="xs" mt={4}>
        Base bet (stake):{" "}
        <Text span fw={700}>
          {engine.baseBet.toLocaleString()}
        </Text>
      </Text>
      <Text size="xs">
        Last spin total:{" "}
        <Text span fw={700}>
          {lastSpinTotalPayout.toLocaleString()}
        </Text>
      </Text>
      <Text size="xs" c="dimmed">
        Active omens:{" "}
        <Text span fw={600}>
          {engine.activeProphecy.length > 0
            ? engine.activeProphecy.map((p) => SYMBOL_LABEL[p]).join(", ")
            : "—"}
        </Text>
      </Text>
      <Text size="xs" c="dimmed">
        Free ritual meter: {engine.scatterMeter} / {fatesealScatterRitual.meterToTrigger}
      </Text>
      <Text size="xs" c="dimmed">
        Crossroads: {bonusSymbolsUntilCrossroads} / {crossroadsScatterThreshold} scatters (final grid)
      </Text>
      <Text size="xs" c="dimmed">
        Wild slots (paid spins left):{" "}
        {engine.wildReelPaidSpinTimers.length > 0 ? engine.wildReelPaidSpinTimers.join(" · ") : "—"}
      </Text>
      <Text size="xs" c="dimmed">
        Dead slots (paid spins left):{" "}
        {engine.deadReelPaidSpinTimers.length > 0 ? engine.deadReelPaidSpinTimers.join(" · ") : "—"}
      </Text>
      <Text size="xs" c="dimmed">
        Mark:{" "}
        {engine.markedOmenSymbol
          ? `${SYMBOL_LABEL[engine.markedOmenSymbol]} (${engine.markedOmenPaidSpinsLeft} paid spins)`
          : "—"}
      </Text>
      <Text size="xs" fw={700} mt="sm" tt="uppercase" c={clubTokens.text.muted}>
        Recent lines
      </Text>
      <Stack gap={4} mt={4} style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
        {lastFeed.length === 0 ? (
          <Text size="xs" c="dimmed" fs="italic">
            Spin to imprint the side scroll.
          </Text>
        ) : (
          lastFeed.slice(0, 20).map((line, idx) => (
            <Text key={`side-${idx}:${line}`} size="xs" c={clubTokens.text.secondary} lineClamp={2}>
              {line}
            </Text>
          ))
        )}
      </Stack>
    </Paper>
  );



  const renderGridCells = () => (
    <div className="fateseal-grid-wrap">
      <div
        className="fateseal-grid"
        style={
          {
            ["--fs-cols" as string]: String(displayGrid.length),
          } as CSSProperties
        }
        aria-label="Fateseal grid"
      >
        {displayGrid.map((row, r) =>
          row.map((sym, c) => {
            const ck = `${r},${c}`;
            const voidNb = sym !== "void" && adjacentVoid(displayGrid, r, c);
            const removing = cascadeOverlay?.removalKeys.has(ck);
            const prophecyHit = cascadeOverlay?.prophecyKeys.has(ck);
            const dropIn = cascadeOverlay?.dropInKeys.has(ck);
            const flyoffs =
              cascadeOverlay?.payouts.filter((p) => p.cellKey === ck && p.text) ?? [];
            /**
             * Re-keying drop-in cells per cascade depth restarts the CSS
             * animation between consecutive frames where the same row/col
             * receives a new tile (otherwise React keeps the existing DOM
             * node and the animation is skipped).
             */
            const cellKey = dropIn ? `${ck}@${cascadeOverlay?.depth ?? 0}` : ck;
            const dropInStyle =
              dropIn && !reduceMotion
                ? ({ ["--fs-drop-row" as string]: r } as CSSProperties)
                : undefined;
            return (
              <div
                key={cellKey}
                className={[
                  "fateseal-cell",
                  sym === "void" ? "fateseal-cell--void" : "",
                  sym === "scatter" ? "fateseal-cell--scatter" : "",
                  sym === "wild" ? "fateseal-cell--wild" : "",
                  voidNb && reduceMotion ? "" : voidNb ? "fateseal-cell--voidNeighbor" : "",
                  !reduceMotion && removing ? "fateseal-cell--cascadePulse" : "",
                  !reduceMotion && prophecyHit && cascadeOverlay?.payouts.length ? "fateseal-cell--prophecyBloom" : "",
                  !reduceMotion && dropIn ? "fateseal-cell--dropIn" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={dropInStyle}
              >
                {SYMBOL_LABEL[sym]}
                {flyoffs.map((p, fi) => (
                  <span
                    key={`${cascadeOverlay?.depth ?? 0}-${p.cellKey}-${p.text}-${fi}`}
                    className="fateseal-payout-flyoff"
                    aria-hidden
                  >
                    {p.text}
                  </span>
                ))}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );

  const pickerGrid = (
    <SimpleGrid cols={4} spacing={6}>
      {FATESEAL_STANDARD_SYMBOLS.map((id) => {
        const on = picks.includes(id);
        return (
          <UnstyledButton
            key={id}
            type="button"
            data-testid={`fateseal-pick-${id}`}
            onClick={() => togglePick(id)}
            style={on ? pickerSelectedStyle : pickerIdleStyle}
          >
            <Text size="xs" fw={700}>
              {SYMBOL_LABEL[id]}
            </Text>
            <Text size="10px" c="dimmed" lineClamp={1}>
              {fatesealSymbolLore[id]?.title ?? id}
            </Text>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );

  return (
    <Box className="fateseal-root" data-testid="fateseal-root">
      <Stack gap="xs" className="fateseal-frame">
        <UnifiedGameHeader
          gameTitle="Fateseal Silver"
          walletAmount={engine.sessionWallet}
          currentRound={engine.spinCount}
          roundLabel="Rituals"
          onShowSettings={() => setSettingsOpened(true)}
          extraButtons={
            phase !== "altar" ? (
              <Button
                type="button"
                size="xs"
                variant="filled"
                color="grape"
                radius="md"
                px="xs"
                onClick={goToAltarFromRitual}
                title="Return to prophecy altar"
                styles={{ label: { fontWeight: 700, color: clubTokens.text.primary } }}
              >
                🔮 Altar
              </Button>
            ) : null
          }
        />

        <AnimatePresence mode="wait">
          <motion.section
            key={phase}
            className="fateseal-screen"
            aria-label={
              phase === "altar"
                ? "Prophecy altar"
                : phase === "ritual"
                  ? "Ritual chamber"
                  : phase === "crossroads"
                    ? "The Crossroads"
                    : "Ledger"
            }
            {...presence}
          >
            {phase === "altar" ? (
              <Paper p="md" radius="md" withBorder style={panelPaper} mih={280}>
                <Stack gap="md">
                  <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                    Prophecy altar
                  </Text>
                  <Text size="sm" c={clubTokens.text.secondary}>
                    Single omen — {fatesealProphecyMode.single.winMultipleOfBaseBet}× per prophecy match.
                  </Text>
                  {pickerGrid}
                  <Button
                    data-testid="fateseal-seal-prophecy"
                    size="sm"
                    variant="outline"
                    color="gray"
                    onClick={sealProphecy}
                    disabled={picks.length !== 1}
                  >
                    Seal the prophecy (1 symbol)
                  </Button>
                  <Text size="xs" c="dimmed">
                    Choose one symbol, seal it, then stake the ritual from chip buttons in the chamber.
                  </Text>
                </Stack>
              </Paper>
            ) : null}

            {phase === "ritual" ? (
              <Stack gap="md">
                <Group justify="space-between" wrap="wrap">
                  <Stack gap={0}>
                    <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                      Ritual chamber
                    </Text>
                    <Text size="sm" c={clubTokens.text.secondary}>
                      Sealed{": "}
                      <Text span fw={700} c={clubTokens.text.dimGreen}>
                        {engine.activeProphecy.map((p) => SYMBOL_LABEL[p]).join(", ")}
                      </Text>
                      {" — "}
                      {fatesealProphecyMode.single.winMultipleOfBaseBet}× per prophecy tile (
                      {engine.activeProphecy.length} omen{engine.activeProphecy.length !== 1 ? "s" : ""})
                    </Text>
                  </Stack>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    disabled={busy}
                    onClick={goToAltarFromRitual}
                  >
                    Adjust prophecy
                  </Button>
                </Group>

                <Group align="flex-start" justify="center" wrap="wrap" gap="md" grow>
                  <div className="fateseal-felt">
                    <Stack gap="md" align="center">
                      {renderGridCells()}
                      <Group justify="center" gap="xs" wrap="wrap" mt="xs">
                      {engine.freeRitualSpinsLeft > 0 ? (
                        <Stack gap={6} align="center">
                          {busy ? <Loader color="grape" size="xs" /> : <Box h={14} />}
                          <button
                            type="button"
                            className="fateseal-ritual-btn"
                            data-testid="fateseal-ritual-spin"
                            aria-busy={busy}
                            disabled={busy || atCrossroads || engine.activeProphecy.length === 0}
                            onClick={() => handleSpin()}
                          >
                            Free ritual (spin)
                          </button>
                        </Stack>
                      ) : (
                        <Stack gap={8} align="center">
                          <Text size="xs" c="dimmed" ta="center">
                            Stake — bank buttons set base bet and open the cascade
                          </Text>
                          <Group justify="center" gap="xs" wrap="wrap">
                            {busy ? <Loader color="grape" size="xs" /> : <Box w={0} h={14} />}
                            <Button
                              size="xs"
                              variant="light"
                              color="grape"
                              data-testid="fateseal-bet-min"
                              disabled={busy || atCrossroads}
                              onClick={() => handleSpin(betChipOptions.min)}
                            >
                              Min ({betChipOptions.min.toLocaleString()})
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="grape"
                              data-testid="fateseal-bet-eighth"
                              disabled={busy || atCrossroads || betChipOptions.eighth.disabled}
                              onClick={() => handleSpin(betChipOptions.eighth.bet)}
                            >
                              ⅛ bank
                              {betChipOptions.eighth.disabled
                                ? " (under min)"
                                : ` (${betChipOptions.eighth.bet.toLocaleString()})`}
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="grape"
                              data-testid="fateseal-bet-quarter"
                              disabled={busy || atCrossroads || betChipOptions.quarter.disabled}
                              onClick={() => handleSpin(betChipOptions.quarter.bet)}
                            >
                              ¼ bank
                              {betChipOptions.quarter.disabled
                                ? " (under min)"
                                : ` (${betChipOptions.quarter.bet.toLocaleString()})`}
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="grape"
                              data-testid="fateseal-bet-half"
                              disabled={busy || atCrossroads || betChipOptions.half.disabled}
                              onClick={() => handleSpin(betChipOptions.half.bet)}
                            >
                              ½ bank
                              {betChipOptions.half.disabled
                                ? " (under min)"
                                : ` (${betChipOptions.half.bet.toLocaleString()})`}
                            </Button>
                          </Group>
                        </Stack>
                      )}
                    </Group>
                    {engine.freeRitualSpinsLeft > 0 ? (
                      <Text size="xs" ta="center" c="grape">
                        Free Ritual: {engine.freeRitualSpinsLeft} charge
                        {engine.freeRitualSpinsLeft !== 1 ? "s" : ""} — no bet
                      </Text>
                    ) : null}
                  </Stack>
                </div>
                {ritualSidePanel}
              </Group>
            </Stack>
            ) : null}

            {phase === "ledger" ? (
              <Paper p="md" radius="md" withBorder style={panelPaper}>
                <Stack gap="sm">
                  <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                    Ledger & crossroads
                  </Text>
                  <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
                    <Paper radius="md" px="xs" py={6} withBorder style={{ borderColor: panelPaper.borderColor, background: "rgba(0,0,0,0.28)" }}>
                      <Text size="xs" c="dimmed">
                        Scatter meter
                      </Text>
                      <Text size="sm" fw={700}>
                        {engine.scatterMeter} / {fatesealScatterRitual.meterToTrigger} (fills append in-spin)
                      </Text>
                    </Paper>
                    <Paper radius="md" px="xs" py={6} withBorder style={{ borderColor: panelPaper.borderColor, background: "rgba(0,0,0,0.28)" }}>
                      <Text size="xs" c="dimmed">
                        Crossroads (scatters)
                      </Text>
                      <Text size="sm" fw={700}>
                        {atCrossroads
                          ? "At the threshold"
                          : `${bonusSymbolsUntilCrossroads} / ${crossroadsScatterThreshold} on final grid`}
                      </Text>
                    </Paper>
                  </SimpleGrid>

                  <Text size="xs" c="dimmed">
                    Tome boost (scatter): {engine.tomeSpinsLeft > 0 ? `${engine.tomeSpinsLeft} spin(s)` : "inactive"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Net vs buy-in: {(engine.sessionWallet - buyIn).toLocaleString()}
                  </Text>

                  <Stack gap={4}>
                    {lastFeed.length === 0 ? (
                      <Text size="xs" c="dimmed" fs="italic">
                        Complete a ritual spin to imprint the ledger.
                      </Text>
                    ) : (
                      /**
                       * Two cascades from different spins can produce the
                       * same human-readable line (e.g. "Cascade 3: +25
                       * (prophecy 1)"); composing the key with the array
                       * index keeps React happy without changing copy.
                       */
                      lastFeed.map((line, idx) => (
                        <Text key={`${idx}:${line}`} size="xs" c={clubTokens.text.secondary}>
                          {line}
                        </Text>
                      ))
                    )}
                  </Stack>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                    <Button
                      color="grape"
                      variant="light"
                      onClick={goToRitualFromLedger}
                      disabled={busy || atCrossroads || engine.activeProphecy.length === 0}
                    >
                      Next ritual
                    </Button>
                    <Button variant="outline" color="gray" disabled={busy} onClick={goToAltarFromRitual}>
                      Return to prophecy altar
                    </Button>
                  </SimpleGrid>

                  <Group gap="xs" wrap="wrap" justify="flex-end" mt="sm">
                    <Button variant="subtle" color="gray" size="xs" onClick={() => setLeaveOpen(true)}>
                      Save and return later
                    </Button>
                    <Button
                      variant="light"
                      color="grape"
                      size="xs"
                      disabled={!canCashOut}
                      onClick={() => setCashOutOpen(true)}
                      aria-label="Cash out to club"
                    >
                      Cash out
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : null}

            {phase === "crossroads" ? (
              <Paper
                p="md"
                radius="md"
                withBorder
                style={{ ...panelPaper, maxHeight: "min(92vh, 720px)", overflowY: "auto" }}
                data-testid="fateseal-crossroads-root"
              >
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={4}>
                      <Title order={3} size="h5" c={clubTokens.text.primary} style={{ fontFamily: "Georgia, serif" }}>
                        The Crossroads
                      </Title>
                      <Text size="sm" c="dimmed">
                        Enough scatters landed on the settled grid to open the threshold. Credit rites apply here; legacy pacts are once per opening.
                      </Text>
                    </Stack>
                    <Button
                      size="xs"
                      variant="light"
                      color="gray"
                      data-testid="fateseal-crossroads-return"
                      onClick={leaveCrossroads}
                    >
                      Return to ledger
                    </Button>
                  </Group>

                  <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                    New rites
                  </Text>

                  <Stack gap={6}>
                    <Text size="xs" c="dimmed">
                      Add omen —{" "}
                      {Number.isFinite(addOmenShop.nextCost)
                        ? `${addOmenShop.nextCost.toLocaleString()} credits`
                        : "capacity reached"}{" "}
                      ({engine.activeProphecy.length}/{addOmenShop.maxSymbols} symbols)
                    </Text>
                    <Group gap="xs" wrap="wrap" align="flex-end">
                      <select
                        aria-label="Symbol to add to prophecy"
                        value={omenAddPick}
                        onChange={(e) => setOmenAddPick(e.target.value as FatesealStandardId)}
                        style={{
                          minWidth: 160,
                          padding: 8,
                          borderRadius: 6,
                          background: "#111",
                          color: "#ddd",
                          border: "1px solid #444",
                        }}
                      >
                        {FATESEAL_STANDARD_SYMBOLS.map((id) => (
                          <option key={id} value={id} disabled={engine.activeProphecy.includes(id)}>
                            {fatesealSymbolLore[id]?.title ?? id}
                          </option>
                        ))}
                      </select>
                      <Button size="xs" variant="light" color="grape" disabled={!addOmenShop.canBuy} onClick={buyAddOmen}>
                        Add symbol
                      </Button>
                    </Group>
                  </Stack>

                  <Stack gap={6}>
                    <Text size="xs" c="dimmed">
                      Wild reel slot — {wildReelShop.costCredits.toLocaleString()} credits (active{" "}
                      {wildReelShop.activeSlots}/{wildReelShop.maxActive}; paid spins left per slot:{" "}
                      {wildReelShop.timers.length ? wildReelShop.timers.join(", ") : "—"}; column effect pending).
                    </Text>
                    <Button size="xs" variant="light" color="orange" disabled={!wildReelShop.canBuy} onClick={buyWildReel}>
                      Buy wild reel slot
                    </Button>
                  </Stack>

                  <Stack gap={6}>
                    <Text size="xs" c="dimmed">
                      Dead reel boon — +{deadReelShop.grantCreditsOnTake.toLocaleString()} credits (active{" "}
                      {deadReelShop.activeSlots}/{deadReelShop.maxActive}; paid spins left per slot:{" "}
                      {deadReelShop.timers.length ? deadReelShop.timers.join(", ") : "—"}; column effect pending).
                    </Text>
                    <Button size="xs" variant="light" color="gray" disabled={!deadReelShop.canTake} onClick={takeDeadReel}>
                      Take dead reel grant
                    </Button>
                  </Stack>

                  <Stack gap={6}>
                    <Text size="xs" c="dimmed">
                      Omen mark — {omenMarkShop.costCredits.toLocaleString()} credits (×
                      {fatesealProgressionRules.purchasedReels.markedSymbolPayoutMultiplier} on a prophecy hit that shows the marked standard).
                    </Text>
                    <Group gap="xs" wrap="wrap" align="flex-end">
                      <select
                        aria-label="Omen mark symbol"
                        value={markPick}
                        onChange={(e) => setMarkPick(e.target.value as FatesealStandardId)}
                        style={{
                          minWidth: 160,
                          padding: 8,
                          borderRadius: 6,
                          background: "#111",
                          color: "#ddd",
                          border: "1px solid #444",
                        }}
                      >
                        {FATESEAL_STANDARD_SYMBOLS.map((id) => (
                          <option key={id} value={id} disabled={!engine.activeProphecy.includes(id)}>
                            {fatesealSymbolLore[id]?.title ?? id}
                          </option>
                        ))}
                      </select>
                      <Button size="xs" variant="light" color="violet" disabled={!omenMarkShop.canBuy} onClick={buyOmenMark}>
                        Mark the omen
                      </Button>
                    </Group>
                    {engine.markedOmenSymbol ? (
                      <Text size="xs" c="dimmed">
                        Marked: {SYMBOL_LABEL[engine.markedOmenSymbol]} — {engine.markedOmenPaidSpinsLeft} paid spin
                        {engine.markedOmenPaidSpinsLeft !== 1 ? "s" : ""} remaining.
                      </Text>
                    ) : null}
                  </Stack>

                  <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                    Legacy pacts
                  </Text>

                  <Button
                    variant="light"
                    color="red"
                    disabled={crossroadsVisit.legacyFaustian}
                    onClick={() => applyLegacyShop("faustian_bargain")}
                  >
                    Faustian Bargain — +{faustianCreditGrant(buyIn).toLocaleString()} credits; add {3} Voids to the pool
                  </Button>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed">
                      Silver Vision — cost {silverVisionCost(buyIn).toLocaleString()} (pick a standard to promote toward Wild in the pool)
                    </Text>
                    <Group gap="xs" wrap="wrap">
                      <select
                        aria-label="Silver Vision symbol"
                        value={silverPick}
                        onChange={(e) => setSilverPick(e.target.value as FatesealStandardId)}
                        disabled={
                          crossroadsVisit.legacySilver || engine.silverVisionTarget != null
                        }
                        style={{
                          flex: "1 1 160px",
                          padding: 8,
                          borderRadius: 6,
                          background: "#111",
                          color: "#ddd",
                          border: "1px solid #444",
                        }}
                      >
                        {FATESEAL_STANDARD_SYMBOLS.map((id) => (
                          <option key={id} value={id}>
                            {fatesealSymbolLore[id]?.title ?? id}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="light"
                        color="gray"
                        disabled={crossroadsVisit.legacySilver || engine.silverVisionTarget != null}
                        onClick={() => applyLegacyShop("silver_vision")}
                      >
                        Buy Vision
                      </Button>
                    </Group>
                  </Stack>
                  <Button
                    variant="light"
                    color="violet"
                    disabled={crossroadsVisit.legacyTome}
                    onClick={() => applyLegacyShop("forbidden_tome")}
                  >
                    The Forbidden Tome — {tomeCost(buyIn).toLocaleString()} credits — double scatter weight (3 spins)
                  </Button>
                </Stack>
              </Paper>
            ) : null}
          </motion.section>
        </AnimatePresence>
      </Stack>

      <Modal opened={leaveOpen} onClose={() => setLeaveOpen(false)} title="Session saved" centered>
        <Stack gap="md">
          <Text size="sm">Return to the bar — this table stays reserved without another buy-in.</Text>
          <Button color="gray" onClick={() => props.onPauseToClub?.()}>
            Back to the bar
          </Button>
        </Stack>
      </Modal>

      <Modal opened={cashOutOpen} onClose={() => setCashOutOpen(false)} title="Cash out?" centered>
        <Stack gap="md">
          <Text size="sm">Settle this table and return credits to the club wallet?</Text>
          <Group grow>
            <Button variant="subtle" onClick={() => setCashOutOpen(false)}>
              Cancel
            </Button>
            <Button
              color="grape"
              onClick={() => {
                setCashOutOpen(false);
                props.onReturnToClubMenu?.({
                  ...computeFatesealReturn(engine.sessionWallet, props.settlement),
                  tableRound: engine.spinCount,
                });
              }}
            >
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>

      <GameSettingsModal opened={settingsOpened} onClose={() => setSettingsOpened(false)} />

      {sympatheticFlash ? (
        <Box
          key={sympatheticFlash.id}
          className="fateseal-sympathetic-flash"
          role="status"
          aria-live="polite"
        >
          <Stack align="center" gap="md" justify="center" style={{ textAlign: "center", maxWidth: 520 }}>
            <Title order={2} size="h3" c="violet" style={{ fontFamily: "Georgia, serif", lineHeight: 1.25 }}>
              The Spirits Have Received Your Sympathetic Vibrations
            </Title>
            <Text size="xl" fw={800} c={clubTokens.text.primary}>
              +{sympatheticFlash.payout.toLocaleString()}
            </Text>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
