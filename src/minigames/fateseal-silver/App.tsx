import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Box,
  Group,
  Modal,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { computeFatesealReturn, type FatesealShellBinding } from "@/game/sessionSettlement";
import { UnifiedGameHeader } from "@/components/ui/UnifiedGameHeader";
import { GameSettingsModal } from "@/components/ui/GameSettingsModal";
import { ClubButton } from "@/components/ui/ClubButton";
import { SommelierLiveGuide } from "@/components/ui/SommelierLiveGuide";
import {
  FATESEAL_STANDARD_SYMBOLS,
  crossroadsNextOmenAdditionCostCredits,
  fatesealProgressionRules,
  fatesealSymbolLore,
  resolveFatesealGameMode,
  fatesealWagerLevels,
  fatesealUnsettleSpiritsConfig,
  fatesealFaustianBargainConfig,
  fatesealCascadePayoutScale,
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
  applyCrossroadsAddOmenSymbol,
  applyCrossroadsUnsettleSpirits,
  unsettleSpiritsCost,
  applyCrossroadsFaustianBargain,
  faustianBargainGrant,
  applyCrossroadsVassagoGambit,
  vassagoGambitCost,
} from "./engine/shopEngine";
import { FatesealSymbolIcon } from "./components/FatesealSymbolIcon";
import "./fatesealSilver.css";

type FatesealPhase = "altar" | "ritual" | "crossroads";


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

export function diffDropInKeys(
  before: FatesealSymbolId[][],
  after: FatesealSymbolId[][],
  removedKeys?: ReadonlySet<string> | Set<string>,
): Set<string> {
  const out = new Set<string>();
  const maxMatchedRowPerCol: Record<number, number> = {};
  if (removedKeys) {
    for (const key of removedKeys) {
      const [rStr, cStr] = key.split(",");
      const r = parseInt(rStr!, 10);
      const c = parseInt(cStr!, 10);
      if (!isNaN(r) && !isNaN(c)) {
        if (maxMatchedRowPerCol[c] === undefined || r > maxMatchedRowPerCol[c]!) {
          maxMatchedRowPerCol[c] = r;
        }
      }
    }
  }

  for (let r = 0; r < after.length; r++) {
    const row = after[r]!;
    const prev = before[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const maxR = maxMatchedRowPerCol[c];
      const hasMatchBelowOrAt = maxR !== undefined && maxR >= r;
      if (prev[c] !== row[c] || hasMatchBelowOrAt) {
        out.add(`${r},${c}`);
      }
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

interface FatesealMockState {
  engine?: Partial<FatesealEngineState>;
  grid?: FatesealSymbolId[][];
  phase?: FatesealPhase;
  picks?: FatesealStandardId[];
}

export function FatesealSilverRoot(props: FatesealShellBinding) {
  const { onReturnToClubMenu, settlement } = props;
  const buyIn = settlement.buyIn;
  const tableRules = useMemo(() => resolveFatesealGameMode(props.gameModeId), [props.gameModeId]);
  const reduceMotion = usePrefersReducedMotion();
  const [realEngine, setEngine] = useState<FatesealEngineState>(() =>
    createInitialFatesealState(props.sessionCredits, buyIn, Math.random, resolveFatesealGameMode(props.gameModeId)),
  );
  const [realPhase, setPhase] = useState<FatesealPhase>("altar");
  const [realPicks, setPicks] = useState<FatesealStandardId[]>([]);

  const [showTutorial, setShowTutorial] = useState(props.isTutorial ?? false);
  const [mockState, setMockState] = useState<FatesealMockState | null>(null);

  const engine = useMemo(() => {
    let base = realEngine;
    if (mockState?.engine) {
      base = { ...base, ...mockState.engine };
    }
    if (mockState?.grid) {
      base = { ...base, grid: mockState.grid };
    }
    return base;
  }, [realEngine, mockState]);

  const phase = mockState?.phase ?? realPhase;
  const atCrossroads = phase === "crossroads";
  const picks = mockState?.picks ?? realPicks;
  const [busy, setBusy] = useState(false);
  const [currentSpinRollingPayout, setCurrentSpinRollingPayout] = useState(0);
  const [sympatheticFlash, setSympatheticFlash] = useState<{ payout: number; id: number } | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [offeredOmen, setOfferedOmen] = useState<FatesealStandardId | null>(null);
  const [tomeToggle, setTomeToggle] = useState(false);
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
    if (!sympatheticFlash) return;
    const ms = reduceMotion ? 900 : 4000;
    const t = window.setTimeout(() => setSympatheticFlash(null), ms);
    return () => window.clearTimeout(t);
  }, [sympatheticFlash, reduceMotion]);

  // Auto-cashout if the player cannot afford the minimum bet size or their forced Faustian bet
  useEffect(() => {
    if (busy || phase === "crossroads") return;
    if (engine.freeRitualSpinsLeft > 0 || engine.vassagoActive) return;

    const isFaustian = engine.deadReelPaidSpinTimers.length > 0;
    const requiredBet = isFaustian ? 250 : tableRules.minBaseBet;

    if (engine.sessionWallet < requiredBet) {
      onReturnToClubMenu?.({
        ...computeFatesealReturn(engine.sessionWallet, settlement),
        tableRound: engine.spinCount,
      });
    }
  }, [
    busy,
    phase,
    engine.sessionWallet,
    engine.freeRitualSpinsLeft,
    engine.vassagoActive,
    engine.deadReelPaidSpinTimers.length,
    engine.spinCount,
    tableRules.minBaseBet,
    onReturnToClubMenu,
    settlement,
  ]);

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


  const sealProphecy = useCallback(() => {
    const uniq = [...new Set(picks)];
    if (uniq.length !== 1) return;
    setEngine((e) => ({
      ...e,
      prophecyMode: "single",
      activeProphecy: [uniq[0]!, ...(e.purchasedExtraProphecies ?? [])],
    }));
    setPhase("ritual");
  }, [picks]);

  const goToAltarFromRitual = useCallback(() => {
    if (busy) return;
    clearCascadeTimers();
    setCascadeOverlay(null);
    const prevBase = engine.activeProphecy[0];
    setEngine((e) => ({
      ...e,
      activeProphecy: [],
    }));
    setPicks(prevBase ? [prevBase] : []);
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
      const spinEngine = {
        ...engine,
        tomeToggleActive: tomeToggle,
        ...(overrideBaseBet !== undefined
          ? {
            baseBet: clampBetToTable(
              overrideBaseBet,
              tableRules.minBaseBet,
              maxBaseBet,
              tableRules.chipIncrement,
            ),
          }
          : {}),
      };
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
          payoutOverlayTimerRef.current = null;
        }, 750);
        if (result.crossroadsGate) {
          const available = FATESEAL_STANDARD_SYMBOLS.filter((id) => !result.nextState.activeProphecy.includes(id));
          const randomOmen = available.length > 0 ? available[Math.floor(Math.random() * available.length)]! : null;
          setOfferedOmen(randomOmen);
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
        const refillDropIns = diffDropInKeys(fr.gridBeforeRemoval, fr.gridAfterCascade, removals);

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
    },
    [atCrossroads, busy, clearCascadeTimers, engine, maxBaseBet, reduceMotion, tableRules, tomeToggle],
  );

  const buyAddOmen = useCallback(() => {
    if (!offeredOmen) return;
    const res = applyCrossroadsAddOmenSymbol(engine, offeredOmen);
    if (!res.ok) return;
    setEngine(res.nextState);
    // Generate next offered omen
    const available = FATESEAL_STANDARD_SYMBOLS.filter((id) => !res.nextState.activeProphecy.includes(id));
    const randomOmen = available.length > 0 ? available[Math.floor(Math.random() * available.length)]! : null;
    setOfferedOmen(randomOmen);
  }, [engine, offeredOmen]);

  const buyUnsettleSpirits = useCallback(() => {
    const res = applyCrossroadsUnsettleSpirits(engine);
    if (!res.ok) return;
    setEngine(res.nextState);
  }, [engine]);

  const takeFaustianBargain = useCallback(() => {
    const res = applyCrossroadsFaustianBargain(engine);
    if (!res.ok) return;
    setEngine(res.nextState);
  }, [engine]);

  const buyVassagoGambit = useCallback(() => {
    const res = applyCrossroadsVassagoGambit(engine);
    if (!res.ok) return;
    setEngine(res.nextState);
  }, [engine]);

  const leaveCrossroads = useCallback(() => setPhase("ritual"), []);

  const canCashOut = !busy && !atCrossroads && engine.activeProphecy.length > 0 && engine.deadReelPaidSpinTimers.length === 0;

  const addOmenShop = useMemo(() => {
    const maxSymbols = 4;
    const nextCost = crossroadsNextOmenAdditionCostCredits(engine.purchasedExtraProphecies?.length ?? 0);
    const canBuy =
      engine.activeProphecy.length < maxSymbols &&
      Number.isFinite(nextCost) &&
      offeredOmen != null &&
      engine.sessionWallet >= nextCost;
    return { maxSymbols, nextCost, canBuy };
  }, [
    engine.purchasedExtraProphecies?.length,
    engine.activeProphecy.length,
    engine.sessionWallet,
    offeredOmen,
  ]);

  const unsettleSpiritsShop = useMemo(() => {
    const cost = unsettleSpiritsCost(engine.sessionWallet);
    const spins = fatesealUnsettleSpiritsConfig.durationSpins;
    const active = engine.wildReelPaidSpinTimers.length > 0;
    const canBuy = !active && engine.sessionWallet >= cost;
    const timers = engine.wildReelPaidSpinTimers;
    return { cost, spins, active, canBuy, timers };
  }, [engine.sessionWallet, engine.wildReelPaidSpinTimers]);

  const faustianBargainShop = useMemo(() => {
    const grant = faustianBargainGrant(engine.buyIn);
    const spins = fatesealFaustianBargainConfig.durationSpinsPerLevel;
    const activeLevels = engine.deadReelPaidSpinTimers.length;
    const maxLevels = fatesealFaustianBargainConfig.maxLevel;
    const canTake = activeLevels < maxLevels;
    const timers = engine.deadReelPaidSpinTimers;
    return { grant, spins, activeLevels, maxLevels, canTake, timers };
  }, [engine.buyIn, engine.deadReelPaidSpinTimers]);

  const vassagoGambitShop = useMemo(() => {
    const cost = vassagoGambitCost(engine.sessionWallet);
    const active = engine.vassagoActive;
    const canBuy = !active && engine.sessionWallet >= cost;
    return { cost, active, canBuy };
  }, [engine.sessionWallet, engine.vassagoActive]);

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
            let timerVal: number | undefined = undefined;
            if (sym === "void") {
              const deadK = engine.deadReelPaidSpinTimers.length;
              if (c >= displayGrid.length - deadK) {
                const timerIdx = c - (displayGrid.length - deadK);
                timerVal = engine.deadReelPaidSpinTimers[timerIdx];
              }
            }
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
                <FatesealSymbolIcon symbol={sym} className="fateseal-symbol-icon" timerValue={timerVal} />
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
        const isExtra = engine.purchasedExtraProphecies?.includes(id);
        const on = picks.includes(id);
        return (
          <UnstyledButton
            key={id}
            type="button"
            data-testid={`fateseal-pick-${id}`}
            onClick={isExtra ? undefined : () => togglePick(id)}
            className={isExtra ? "fateseal-altar-extra-purchased" : undefined}
            style={isExtra ? undefined : on ? pickerSelectedStyle : pickerIdleStyle}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <FatesealSymbolIcon symbol={id} size={38} />
            </div>
            <Text size="10px" c="dimmed" lineClamp={1} ta="center">
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
            <Group gap="xs" wrap="nowrap">
              <ClubButton
                type="button"
                size="xs"
                variant="filled"
                color="orange"
                radius="md"
                px="xs"
                onClick={() => setShowTutorial(true)}
                title="How to play"
              >
                📖 How to Play
              </ClubButton>
              {phase !== "altar" ? (
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
              ) : null}
            </Group>
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
            {phase === "altar" ? (() => {
              const activeCount = (picks.length > 0 ? 1 : 0) + (engine.purchasedExtraProphecies?.length ?? 0) || 1;
              const scale = fatesealProgressionRules.purchasedReels.omenScalingFactors[
                Math.min(activeCount - 1, fatesealProgressionRules.purchasedReels.omenScalingFactors.length - 1)
              ] ?? 1.0;
              return (
                <div>
                  <Paper p="md" radius="md" withBorder style={panelPaper} mih={280}>
                    <Stack gap="md">
                      <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                        Prophecy altar
                      </Text>
                      {pickerGrid}

                      <ClubButton
                        data-testid="fateseal-seal-prophecy"
                        size="sm"
                        variant="filled"
                        color="red"
                        onClick={sealProphecy}
                        disabled={picks.length !== 1}
                      >
                        Seal the prophecy
                      </ClubButton>
                    </Stack>
                  </Paper>

                  <Paper p="sm" radius="md" withBorder style={{ ...panelPaper, minHeight: 0 }} mt="lg">
                    {/* Payout Schedule Section */}
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text size="xs" fw={700} c={clubTokens.text.accent}>
                          Payout Schedule (Base Cascade)
                        </Text>
                        <Text size="xs" c="dimmed">
                          Active Omens: <span style={{ color: clubTokens.text.primary, fontWeight: 700 }}>{activeCount}</span> (Scale: <span style={{ color: clubTokens.text.primary, fontWeight: 700 }}>{Math.round(scale * 100)}%</span>)
                        </Text>
                      </Group>

                      <SimpleGrid cols={5} spacing="xs" style={{ background: "rgba(0,0,0,0.25)", borderRadius: 6, padding: 8 }}>
                        {Array.from({ length: 10 }, (_, i) => {
                          const m = i + 1;
                          const pct = m * 10 * scale * fatesealCascadePayoutScale;
                          const creditWin = Math.floor(m * 10 * scale * engine.baseBet * fatesealCascadePayoutScale);
                          return (
                            <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0" }}>
                              <Text size="10px" fw={700} c="dimmed">{m} Matched</Text>
                              <Text size="xs" fw={700} c={clubTokens.text.brass}>{creditWin} cr</Text>
                              <Text size="9px" c="dimmed">({(pct * 100).toFixed(1)}%)</Text>
                            </div>
                          );
                        })}
                      </SimpleGrid>
                      <Text size="10px" c="dimmed" style={{ fontStyle: "italic", textAlign: "center" }}>
                        * Payouts show base returns at minimum bet for first cascade depth. Subsequent cascades and linking adjacencies multiply these values.
                      </Text>
                    </Stack>
                  </Paper>
                </div>
              );
            })() : null}

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
                      <div style={{ width: "100%" }}>
                        {(() => {
                          const singleButtonLabel = engine.freeRitualSpinsLeft > 0
                            ? "Free ritual (spin)"
                            : engine.vassagoActive
                            ? "Vassago Grants You Vision"
                            : engine.wildReelPaidSpinTimers.length > 0
                            ? "Unsettle The Spirits"
                            : null;

                          if (singleButtonLabel) {
                            return (
                              <Stack gap={6} align="center" style={{ width: "100%" }}>
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
                                  <div
                                    style={{
                                      transition: showPayoutOverlay ? "opacity 0.3s" : "opacity 0.4s",
                                      opacity: showPayoutOverlay ? 0 : 1,
                                      pointerEvents: showPayoutOverlay ? "none" : "auto",
                                      width: "100%",
                                      display: "flex",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <ClubButton
                                      fancy
                                      variant="filled"
                                      data-testid="fateseal-ritual-spin"
                                      aria-busy={busy}
                                      disabled={busy || atCrossroads || engine.activeProphecy.length === 0}
                                      onClick={() => handleSpin()}
                                      style={{ width: "100%", maxWidth: "560px" }}
                                    >
                                      {singleButtonLabel}
                                    </ClubButton>
                                  </div>
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
                                      {currentSpinRollingPayout > 0 ? `+${currentSpinRollingPayout.toLocaleString()}` : ""}
                                    </Text>
                                  </div>
                                </div>
                              </Stack>
                            );
                          }

                          return (
                            <Stack gap={8} align="center" style={{ position: "relative", width: "100%" }}>
                              {engine.deadReelPaidSpinTimers.length > 0 ? (
                                <Text size="xs" c="dimmed" ta="center">
                                  Vision Selling — bet is locked and cash-out is disabled
                                </Text>
                              ) : (
                                <Stack gap={4} align="center" style={{ width: "100%", maxWidth: "560px" }}>
                                  <Group justify="space-between" align="center" style={{ width: "100%" }}>
                                    <Text size="xs" c="dimmed">
                                      The Forbidden Tome
                                    </Text>
                                    <Switch
                                      checked={tomeToggle}
                                      onChange={(e) => setTomeToggle(e.currentTarget.checked)}
                                      disabled={busy || atCrossroads}
                                      color="red"
                                      size="xs"
                                      label={tomeToggle ? "Active (+25% Bet/Scatter)" : "Inactive"}
                                      styles={{ label: { fontSize: "11px", color: tomeToggle ? clubTokens.text.accent : clubTokens.text.secondary } }}
                                    />
                                  </Group>
                                  <Text size="10px" c="dimmed" ta="center" style={{ lineHeight: 1.2 }}>
                                    Increase all bet sizes by 25% for a 25% higher chance of summoning scatter symbols.
                                  </Text>
                                </Stack>
                              )}
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
                                <div
                                  className="fateseal-bet-buttons-container"
                                  style={{
                                    transition: showPayoutOverlay ? "opacity 0.3s" : "opacity 0.4s",
                                    opacity: showPayoutOverlay ? 0 : 1,
                                    pointerEvents: showPayoutOverlay ? "none" : "auto",
                                    maxWidth: "560px"
                                  }}
                                >
                                  {engine.deadReelPaidSpinTimers.length > 0 ? (
                                    <ClubButton
                                      fancy
                                      variant="filled"
                                      color="red"
                                      data-testid="fateseal-ritual-spin"
                                      disabled={busy || atCrossroads || engine.activeProphecy.length === 0 || engine.sessionWallet < 250}
                                      onClick={() => handleSpin(250)}
                                      style={{ width: "100%" }}
                                    >
                                      Ritual (250)
                                    </ClubButton>
                                  ) : (
                                    fatesealWagerLevels.map((rawBet, idx) => {
                                      const betSize = tomeToggle ? Math.floor(rawBet * 1.25) : rawBet;
                                      const canAfford = engine.sessionWallet >= betSize;
                                      return (
                                        <ClubButton
                                          key={rawBet}
                                          size="xs"
                                          variant="light"
                                          color="grape"
                                          className="fateseal-bet-button"
                                          data-testid={idx === 0 ? "fateseal-bet-min" : `fateseal-bet-${rawBet}`}
                                          disabled={busy || atCrossroads || !canAfford || engine.activeProphecy.length === 0}
                                          onClick={() => handleSpin(rawBet)}
                                        >
                                          {betSize.toLocaleString()}
                                        </ClubButton>
                                      );
                                    })
                                  )}
                                </div>
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
                                    {currentSpinRollingPayout > 0 ? `+${currentSpinRollingPayout.toLocaleString()}` : ""}
                                  </Text>
                                </div>
                              </div>
                            </Stack>
                          );
                        })()}
                      </div>
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
                    {offeredOmen != null && engine.activeProphecy.length < 4 && (
                      <div className="crossroads-item-card crossroads-card--omen">
                        <div>
                          <div className="crossroads-item-header">Add Prophecy Symbol</div>
                          <div className="crossroads-item-desc" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                            <FatesealSymbolIcon symbol={offeredOmen} size={24} />
                            <Text size="xs" c="dimmed">
                              Offer: {fatesealSymbolLore[offeredOmen]?.title ?? offeredOmen}. Add to active prophecies. Max {addOmenShop.maxSymbols}.
                            </Text>
                          </div>
                        </div>
                        <div className="crossroads-item-action-row" style={{ marginTop: "12px" }}>
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
                    )}

                    {/* Card 2: Unsettle the Spirits */}
                    <div className="crossroads-item-card crossroads-card--wild">
                      <div>
                        <div className="crossroads-item-header">Unsettle the Spirits</div>
                        <div className="crossroads-item-desc" style={{ marginTop: "4px" }}>
                          <Text size="xs" c="dimmed">
                            {unsettleSpiritsShop.active
                              ? `Wild Reel active: ${unsettleSpiritsShop.timers[0]} spins left.`
                              : `Sets bet size to 250, spins are free for ${unsettleSpiritsShop.spins} spins. Wild reel column activated.`}
                          </Text>
                        </div>
                      </div>
                      <div className="crossroads-item-action-row" style={{ marginTop: "12px" }}>
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!unsettleSpiritsShop.canBuy}
                          onClick={buyUnsettleSpirits}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          {unsettleSpiritsShop.active
                            ? "Active"
                            : `Buy: ${unsettleSpiritsShop.cost.toLocaleString()} Credits`}
                        </ClubButton>
                      </div>
                    </div>

                    {/* Card 3: Faustian Bargain */}
                    <div className="crossroads-item-card crossroads-card--dead">
                      <div>
                        <div className="crossroads-item-header">Faustian Bargain</div>
                        <div className="crossroads-item-desc" style={{ marginTop: "4px" }}>
                          <Text size="xs" c="dimmed">
                            {faustianBargainShop.activeLevels > 0
                              ? `Dead Reels active: Level ${faustianBargainShop.activeLevels} (${faustianBargainShop.timers.join(", ")} spins left).`
                              : `Earn immediate credits. Sets bet size to 250, locks cash-out, blocks right column with dead reels for ${faustianBargainShop.spins} spins per level.`}
                          </Text>
                          {faustianBargainShop.activeLevels > 0 && (
                            <Text size="10px" c="red" style={{ marginTop: "2px" }}>
                              Bet size is locked and cash-out is disabled.
                            </Text>
                          )}
                        </div>
                      </div>
                      <div className="crossroads-item-action-row" style={{ marginTop: "12px" }}>
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!faustianBargainShop.canTake}
                          onClick={takeFaustianBargain}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          {faustianBargainShop.activeLevels >= faustianBargainShop.maxLevels
                            ? "Max Level Reached"
                            : `Claim: +${faustianBargainShop.grant.toLocaleString()} Credits`}
                        </ClubButton>
                      </div>
                    </div>

                    {/* Card 4: Vassago's Gambit */}
                    <div className="crossroads-item-card crossroads-card--tome">
                      <div>
                        <div className="crossroads-item-header">Vassago's Gambit</div>
                        <div className="crossroads-item-desc" style={{ marginTop: "4px" }}>
                          <Text size="xs" c="dimmed">
                            {vassagoGambitShop.active
                              ? "Next spin is Vassago's free scatter bonus."
                              : `High risk. Costs 90% of wallet (min 10,000). Next spin is free at bet 250, guarantees scatter bonus, but scatters do not count to Crossroads.`}
                          </Text>
                        </div>
                      </div>
                      <div className="crossroads-item-action-row" style={{ marginTop: "12px" }}>
                        <ClubButton
                          size="xs"
                          variant="light"
                          disabled={!vassagoGambitShop.canBuy}
                          onClick={buyVassagoGambit}
                          style={{ height: "26px", fontSize: "0.72rem" }}
                        >
                          {vassagoGambitShop.active
                            ? "Active"
                            : `Buy: ${vassagoGambitShop.cost.toLocaleString()} Credits`}
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
      {showTutorial && (
        <SommelierLiveGuide
          gameId="fateseal_silver"
          onStepChange={(mock) => setMockState(mock as FatesealMockState | null)}
          onClose={() => {
            setShowTutorial(false);
            setMockState(null);
          }}
        />
      )}
    </Box>
  );
}
