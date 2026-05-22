import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Box,
  Group,
  Modal,
  Paper,
  Progress,
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
import { ClubButton } from "@/components/ui/ClubButton";
import {
  FATESEAL_STANDARD_SYMBOLS,
  crossroadsNextOmenAdditionCostCredits,
  fatesealCrossroadsNewShop,
  fatesealProphecyMode,
  fatesealProgressionRules,
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
  tomeCost,
  type CrossroadsChoice,
} from "./engine/shopEngine";
import { FatesealSymbolIcon } from "./components/FatesealSymbolIcon";
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

type FatesealPhase = "altar" | "ritual" | "crossroads";

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
const RITUAL_TIMING_SCALE = 0.85;

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
  dropOutKeys?: ReadonlySet<string>;
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
  const [currentSpinRollingPayout, setCurrentSpinRollingPayout] = useState(0);
  const [sympatheticFlash, setSympatheticFlash] = useState<{ payout: number; id: number } | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [silverPick] = useState<FatesealStandardId>("dagger");
  const [omenAddPick, setOmenAddPick] = useState<FatesealStandardId>("chalice");
  const [markPick, setMarkPick] = useState<FatesealStandardId>("dagger");
  const [cascadeOverlay, setCascadeOverlay] = useState<CascadeOverlay | null>(null);
  const [showPayoutOverlay, setShowPayoutOverlay] = useState(false);
  /** Browser timers are numeric handles; avoids NodeJS `Timeout` vs `number` clashes under `tsc`. */
  const cascadeTimersRef = useRef<number[]>([]);
  const payoutOverlayTimerRef = useRef<number | null>(null);

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
        const sym = result.log.find((l): l is Extract<typeof l, { kind: "sympathetic_vibrations" }> => l.kind === "sympathetic_vibrations");
        if (sym) {
          setSympatheticFlash({ payout: sym.payout, id: Date.now() });
        }
        setCascadeOverlay(null);
        setEngine(result.nextState);
        setBusy(false);
        // Keep payout overlay visible briefly, then crossfade back to bet buttons
        payoutOverlayTimerRef.current = window.setTimeout(() => {
          setShowPayoutOverlay(false);
          setCurrentSpinRollingPayout(0);
          payoutOverlayTimerRef.current = null;
        }, 750);
        if (result.crossroadsGate) {
          setCrossroadsVisit(emptyCrossroadsVisit());
          setPhase("crossroads");
        } else {
          setPhase("ritual");
        }
      };

      setCurrentSpinRollingPayout(0);
      setShowPayoutOverlay(false);
      if (payoutOverlayTimerRef.current !== null) {
        window.clearTimeout(payoutOverlayTimerRef.current);
        payoutOverlayTimerRef.current = null;
      }

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

      // Always fill the whole grid to complete the cascade effect
      const fillKeys = allCellKeys(postFillGrid);

      const DROP_OUT_MS = Math.round(400 * RITUAL_TIMING_SCALE);

      cascadeTimersRef.current.push(
        window.setTimeout(() => {
          setCascadeOverlay({
            depth: -2,
            grid: dupGrid(preSpinGrid),
            removalKeys: new Set<string>(),
            prophecyKeys: new Set<string>(),
            dropInKeys: new Set<string>(),
            dropOutKeys: allCellKeys(preSpinGrid),
            payouts: [],
          });
        }, 0),
      );

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
        }, DROP_OUT_MS),
      );

      let at = FILL_DURATION_MS + DROP_OUT_MS;
      let rollingAcc = 0;

      for (const fr of frames) {
        const removals = new Set(fr.removedKeys);
        const prophecies = new Set(fr.prophecyMatchKeys);
        const refillDropIns = diffDropInKeys(fr.gridBeforeRemoval, fr.gridAfterCascade);

        rollingAcc += fr.payout;
        const thisStepAcc = rollingAcc;

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
            setCurrentSpinRollingPayout(thisStepAcc);
            setShowPayoutOverlay(true);
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

  const leaveCrossroads = useCallback(() => setPhase("ritual"), []);

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
  const displayGrid = cascadeOverlay?.grid ?? engine.grid;
  const presence = fatesealPhasePresence(reduceMotion);




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
            const dropOut = cascadeOverlay?.dropOutKeys?.has(ck);
            const flyoffs =
              cascadeOverlay?.payouts.filter((p) => p.cellKey === ck && p.text) ?? [];
            /**
             * Re-keying drop-in cells per cascade depth restarts the CSS
             * animation between consecutive frames where the same row/col
             * receives a new tile (otherwise React keeps the existing DOM
             * node and the animation is skipped).
             */
            const cellKey = (dropIn || dropOut) ? `${ck}@${cascadeOverlay?.depth ?? 0}` : ck;
            const dropStyle =
              (dropIn || dropOut) && !reduceMotion
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
                  !reduceMotion && dropOut ? "fateseal-cell--dropOut" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={dropStyle}
              >
                <FatesealSymbolIcon symbol={sym} className="fateseal-symbol-icon" />
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <FatesealSymbolIcon symbol={id} size={38} />
            </div>
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
          onAbandonRun={props?.onAbandonRun}
          extraButtons={
            phase !== "altar" ? (
              <ClubButton
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
              </ClubButton>
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
                : phase === "crossroads"
                  ? "The Crossroads"
                  : "Ritual chamber"
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
                  <ClubButton
                    data-testid="fateseal-seal-prophecy"
                    size="sm"
                    variant="outline"
                    color="gray"
                    onClick={sealProphecy}
                    disabled={picks.length !== 1}
                  >
                    Seal the prophecy (1 symbol)
                  </ClubButton>
                  <Text size="xs" c="dimmed">
                    Choose one symbol, seal it, then stake the ritual from chip buttons in the chamber.
                  </Text>
                </Stack>
              </Paper>
            ) : null}

            {phase === "ritual" ? (
              <Stack gap="md">

                <Group align="flex-start" justify="center" wrap="wrap" gap="md" grow>
                  <div className="fateseal-felt">
                    <Stack gap="md" align="center" style={{ width: "100%" }}>
                      <Stack gap={2} style={{ width: "100%" }}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">Crossroads progress</Text>
                          <Text size="xs" fw={700} c="grape">
                            {engine.crossroadsBonusAccum} / {crossroadsScatterThreshold} scatters
                          </Text>
                        </Group>
                        <Progress
                          value={(engine.crossroadsBonusAccum / crossroadsScatterThreshold) * 100}
                          color="grape"
                          size="sm"
                          radius="xl"
                          style={{ background: "rgba(0, 0, 0, 0.4)" }}
                        />
                      </Stack>
                      {renderGridCells()}
                      <Group justify="center" gap="xs" wrap="wrap" mt="xs">
                        {engine.freeRitualSpinsLeft > 0 ? (
                          <Stack gap={6} align="center">
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
                          <Stack gap={8} align="center" style={{ position: "relative", width: "100%" }}>
                            <Text size="xs" c="dimmed" ta="center">
                              Stake — bank buttons set base bet and open the cascade
                            </Text>
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                minHeight: 52,
                              }}
                            >
                              {/* Bet buttons — fade out when payout overlay shows */}
                              <Group
                                justify="center"
                                gap="xs"
                                wrap="wrap"
                                style={{
                                  // position: "absolute",
                                  inset: 0,
                                  paddingTop: "10px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  transition: showPayoutOverlay ? "opacity 0.3s" : "opacity 0.4s",
                                  opacity: showPayoutOverlay ? 0 : 1,
                                  pointerEvents: showPayoutOverlay ? "none" : "auto",
                                  maxWidth: "560px"
                                }}
                              >
                                <ClubButton
                                  size="xs"
                                  variant="light"
                                  color="grape"
                                  data-testid="fateseal-bet-min"
                                  disabled={busy || atCrossroads || engine.deadReelPaidSpinTimers.length > 0}
                                  onClick={() => handleSpin(betChipOptions.min)}
                                >
                                  {engine.deadReelPaidSpinTimers.length > 0
                                    ? "Min (locked)"
                                    : `Min (${betChipOptions.min.toLocaleString()})`}
                                </ClubButton>
                                <ClubButton
                                  size="xs"
                                  variant="light"
                                  color="grape"
                                  data-testid="fateseal-bet-eighth"
                                  disabled={busy || atCrossroads || betChipOptions.eighth.disabled}
                                  onClick={() => handleSpin(betChipOptions.eighth.bet)}
                                >
                                  1/8 bank
                                  {betChipOptions.eighth.disabled
                                    ? " (under min)"
                                    : ` (${betChipOptions.eighth.bet.toLocaleString()})`}
                                </ClubButton>
                                <ClubButton
                                  size="xs"
                                  variant="light"
                                  color="grape"
                                  data-testid="fateseal-bet-quarter"
                                  disabled={busy || atCrossroads || betChipOptions.quarter.disabled}
                                  onClick={() => handleSpin(betChipOptions.quarter.bet)}
                                >
                                  1/4 bank
                                  {betChipOptions.quarter.disabled
                                    ? " (under min)"
                                    : ` (${betChipOptions.quarter.bet.toLocaleString()})`}
                                </ClubButton>
                                <ClubButton
                                  size="xs"
                                  variant="light"
                                  color="grape"
                                  data-testid="fateseal-bet-half"
                                  disabled={busy || atCrossroads || betChipOptions.half.disabled}
                                  onClick={() => handleSpin(betChipOptions.half.bet)}
                                >
                                  1/2 bank
                                  {betChipOptions.half.disabled
                                    ? " (under min)"
                                    : ` (${betChipOptions.half.bet.toLocaleString()})`}
                                </ClubButton>
                              </Group>
                              {/* Rolling payout counter — crossfades over bet buttons */}
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: showPayoutOverlay ? "opacity 0.3s" : "opacity 0.4s",
                                  opacity: showPayoutOverlay && currentSpinRollingPayout > 0 ? 1 : 0,
                                  pointerEvents: "none",
                                }}
                                aria-live="polite"
                                aria-atomic="true"
                              >
                                <Text
                                  fw={900}
                                  size="xl"
                                  c="yellow"
                                  ta="center"
                                  className="fateseal-payout-counter"
                                  style={{
                                    textShadow: "0 0 16px rgba(255,215,0,0.7), 0 0 4px rgba(255,215,0,0.4)",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  +{currentSpinRollingPayout.toLocaleString()}
                                </Text>
                              </div>
                            </div>
                          </Stack>
                        )}
                      </Group>
                      {engine.freeRitualSpinsLeft > 0 ? (
                        <Text size="xs" ta="center" c="grape">
                          Free Ritual: {engine.freeRitualSpinsLeft} charge
                          {engine.freeRitualSpinsLeft !== 1 ? "s" : ""} — no bet
                        </Text>
                      ) : null}
                      <Group gap="xs" wrap="wrap" justify="flex-end" mt="xs">
                        {/* <ClubButton
                          variant="light"
                          color="grape"
                          size="xs" onClick={() => setLeaveOpen(true)}>
                          Save and return later
                        </ClubButton> */}
                        <ClubButton
                          variant="light"
                          color="grape"
                          size="xs"
                          disabled={!canCashOut}
                          onClick={() => setCashOutOpen(true)}
                          aria-label="Cash out to club"
                        >
                          Cash out
                        </ClubButton>
                      </Group>
                    </Stack>
                  </div>
                </Group>
              </Stack>
            ) : null}



            {phase === "crossroads" ? (
              <Paper
                p="sm"
                radius="md"
                withBorder
                style={{ ...panelPaper, maxHeight: "min(92vh, 720px)", overflowY: "auto" }}
                data-testid="fateseal-crossroads-root"
              >
                <Stack gap="sm">
                  <Stack gap={2}>
                    <Title order={3} size="h5" c={clubTokens.text.primary} style={{ fontFamily: "Georgia, serif" }}>
                      The Crossroads
                    </Title>
                    <Text size="xs" c="dimmed">
                      Enough scatters landed to open the threshold. Acquire credit rites or the legacy pact.
                    </Text>
                  </Stack>

                  <div className="crossroads-grid">
                    {/* Card 1: Add Prophecy Symbol */}
                    <div className="crossroads-item-card crossroads-card--omen">
                      <div>
                        <div className="crossroads-item-header">Add Prophecy Symbol</div>
                        <div className="crossroads-item-desc">
                          Active: {engine.activeProphecy.length}/{addOmenShop.maxSymbols} symbols. Add standard symbol.
                        </div>
                      </div>
                      <div className="crossroads-item-action-row">
                        <select
                          aria-label="Symbol to add to prophecy"
                          value={omenAddPick}
                          onChange={(e) => setOmenAddPick(e.target.value as FatesealStandardId)}
                          className="crossroads-select"
                        >
                          {FATESEAL_STANDARD_SYMBOLS.map((id) => (
                            <option key={id} value={id} disabled={engine.activeProphecy.includes(id)}>
                              {fatesealSymbolLore[id]?.title ?? id}
                            </option>
                          ))}
                        </select>
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!addOmenShop.canBuy}
                          onClick={buyAddOmen}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          {Number.isFinite(addOmenShop.nextCost)
                            ? `Buy: ${addOmenShop.nextCost.toLocaleString()} Credits`
                            : "Capacity Reached"}
                        </ClubButton>
                      </div>
                    </div>

                    {/* Card 2: Wild Reel Slot */}
                    <div className="crossroads-item-card crossroads-card--wild">
                      <div>
                        <div className="crossroads-item-header">Wild Reel Slot</div>
                        <div className="crossroads-item-desc">
                          Active: {wildReelShop.activeSlots}/{wildReelShop.maxActive} | Timers:{" "}
                          {wildReelShop.timers.length ? wildReelShop.timers.join(", ") : "None"}. Fills left columns.
                        </div>
                      </div>
                      <div className="crossroads-item-action-row">
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!wildReelShop.canBuy}
                          onClick={buyWildReel}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          Buy: {wildReelShop.costCredits.toLocaleString()} Credits
                        </ClubButton>
                      </div>
                    </div>

                    {/* Card 3: Dead Reel Boon */}
                    <div className="crossroads-item-card crossroads-card--dead">
                      <div>
                        <div className="crossroads-item-header">Dead Reel Boon</div>
                        <div className="crossroads-item-desc">
                          Active: {deadReelShop.activeSlots}/{deadReelShop.maxActive} | Timers:{" "}
                          {deadReelShop.timers.length ? deadReelShop.timers.join(", ") : "None"}. Blocks right columns.
                        </div>
                      </div>
                      <div className="crossroads-item-action-row">
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!deadReelShop.canTake}
                          onClick={takeDeadReel}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          Claim: +{deadReelShop.grantCreditsOnTake.toLocaleString()} Credits
                        </ClubButton>
                      </div>
                    </div>

                    {/* Card 4: Omen Mark */}
                    <div className="crossroads-item-card crossroads-card--mark">
                      <div>
                        <div className="crossroads-item-header">Omen Mark</div>
                        <div className="crossroads-item-desc">
                          {engine.markedOmenSymbol ? (
                            <span style={{ color: clubTokens.text.goldHighlight }}>
                              Marked: {SYMBOL_LABEL[engine.markedOmenSymbol]} ({engine.markedOmenPaidSpinsLeft} spins left)
                            </span>
                          ) : (
                            `Boost prophecy hit by ${fatesealProgressionRules.purchasedReels.markedSymbolPayoutMultiplier}x.`
                          )}
                        </div>
                      </div>
                      <div className="crossroads-item-action-row">
                        <select
                          aria-label="Omen mark symbol"
                          value={markPick}
                          onChange={(e) => setMarkPick(e.target.value as FatesealStandardId)}
                          className="crossroads-select"
                        >
                          {FATESEAL_STANDARD_SYMBOLS.map((id) => (
                            <option key={id} value={id} disabled={!engine.activeProphecy.includes(id)}>
                              {fatesealSymbolLore[id]?.title ?? id}
                            </option>
                          ))}
                        </select>
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!omenMarkShop.canBuy}
                          onClick={buyOmenMark}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          Buy: {omenMarkShop.costCredits.toLocaleString()} Credits
                        </ClubButton>
                      </div>
                    </div>

                    {/* Card 5: The Forbidden Tome */}
                    <div className="crossroads-item-card crossroads-card--tome crossroads-card-full">
                      <div>
                        <div className="crossroads-item-header">The Forbidden Tome</div>
                        <div className="crossroads-item-desc">
                          Legacy Pact: Double scatter weights on the grid for the next 3 spins. Once per opening.
                        </div>
                      </div>
                      <div className="crossroads-item-action-row">
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={crossroadsVisit.legacyTome}
                          onClick={() => applyLegacyShop("forbidden_tome")}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          {crossroadsVisit.legacyTome
                            ? "Acquired"
                            : `Acquire: ${tomeCost(buyIn).toLocaleString()} Credits`}
                        </ClubButton>
                      </div>
                    </div>
                  </div>

                  <ClubButton
                    data-testid="fateseal-crossroads-return"
                    onClick={leaveCrossroads}
                    variant="filled"
                    style={{ width: "100%", height: "30px", fontSize: "0.78rem" }}
                  >
                    Return to ritual
                  </ClubButton>
                </Stack>
              </Paper>
            ) : null}
          </motion.section>
        </AnimatePresence>
      </Stack>

      <Modal opened={leaveOpen} onClose={() => setLeaveOpen(false)} title="Session saved" centered>
        <Stack gap="md">
          <Text size="sm">Return to the bar — this table stays reserved without another buy-in.</Text>
          <ClubButton color="gray" onClick={() => props.onPauseToClub?.()}>
            Back to the bar
          </ClubButton>
        </Stack>
      </Modal>

      <Modal opened={cashOutOpen} onClose={() => setCashOutOpen(false)} title="Cash out?" centered>
        <Stack gap="md">
          <Text size="sm">Settle this table and return credits to the club wallet?</Text>
          <Group grow>
            <ClubButton variant="subtle" onClick={() => setCashOutOpen(false)}>
              Cancel
            </ClubButton>
            <ClubButton
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
            </ClubButton>
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
