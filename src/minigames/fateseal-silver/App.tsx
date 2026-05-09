import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";
import { computeFatesealReturn, type FatesealShellBinding } from "@/game/sessionSettlement";
import {
  FATESEAL_STANDARD_SYMBOLS,
  fatesealProphecyMode,
  fatesealScatterRitual,
  fatesealSymbolLore,
  fatesealTableConfig,
  type FatesealProphecyModeKey,
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

type FatesealPhase = "altar" | "ritual" | "ledger";

function rngFactory() {
  return () => Math.random();
}

function spinsUntilCrossroads(spinCount: number): number {
  if (spinCount === 0) return 3;
  const r = spinCount % 3;
  return r === 0 ? 0 : 3 - r;
}

function dupGrid(grid: FatesealSymbolId[][]): FatesealSymbolId[][] {
  return grid.map((row) => [...row]);
}

/** Split cascade step payout across prophecy-hit cells — sums equal `payout` when payout > 0 and n > 0. */
function splitCascadeStepPayout(payout: number, prophecyHits: number): number[] {
  if (prophecyHits <= 0) return [];
  const base = Math.floor(payout / prophecyHits);
  const rem = payout - base * prophecyHits;
  return Array.from({ length: prophecyHits }, (_, i) => base + (i < rem ? 1 : 0));
}

const CASCADE_FOCUS_MS = 140;
const CASCADE_EMIT_AFTER_MS = 100;
/** Long enough for `.fateseal-payout-flyoff` (~480ms) to finish before the grid refills. */
const CASCADE_FLOAT_MS = 520;
/** Final beat after tiles settle visually before next cascade depth. */
const CASCADE_SETTLE_MS = 200;

/** Timings tuned so total per depth ≈ CASCADE_FOCUS_MS + CASCADE_EMIT_AFTER_MS + CASCADE_FLOAT_MS + CASCADE_SETTLE_MS. */
const CASCADE_STEP_DURATION_MS =
  CASCADE_FOCUS_MS + CASCADE_EMIT_AFTER_MS + CASCADE_FLOAT_MS + CASCADE_SETTLE_MS;

type CascadeOverlay = {
  /** Identifies cascade depth for payout flyoff remount animation. */
  depth: number;
  grid: FatesealSymbolId[][];
  removalKeys: ReadonlySet<string>;
  prophecyKeys: ReadonlySet<string>;
  payouts: readonly { cellKey: string; text: string }[];
};

function adjacentVoid(grid: FatesealSymbolId[][], row: number, col: number): boolean {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < 5 && c >= 0 && c < 5 && grid[r]![c] === "void") return true;
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
  const reduceMotion = usePrefersReducedMotion();
  const [engine, setEngine] = useState<FatesealEngineState>(() =>
    createInitialFatesealState(props.sessionCredits, buyIn, Math.random),
  );
  const [phase, setPhase] = useState<FatesealPhase>("altar");
  const [prophecyMode, setProphecyMode] = useState<FatesealProphecyModeKey>("single");
  const [picks, setPicks] = useState<FatesealStandardId[]>([]);
  const [busy, setBusy] = useState(false);
  const [crossroadsOpen, setCrossroadsOpen] = useState(false);
  const [lastFeed, setLastFeed] = useState<string[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [silverPick, setSilverPick] = useState<FatesealStandardId>("dagger");
  const [cascadeOverlay, setCascadeOverlay] = useState<CascadeOverlay | null>(null);
  /** Browser timers are numeric handles; avoids NodeJS `Timeout` vs `number` clashes under `tsc`. */
  const cascadeTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      cascadeTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

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
        fatesealTableConfig.minBaseBet,
        Math.floor(engine.sessionWallet * fatesealTableConfig.maxBaseBetFractionOfSession),
      ),
    [engine.sessionWallet],
  );

  const needPicks = prophecyMode === "single" ? 1 : 3;

  const sealProphecy = useCallback(() => {
    const uniq = [...new Set(picks)];
    if (uniq.length !== needPicks) return;
    setEngine((e) => ({
      ...e,
      prophecyMode,
      activeProphecy: uniq,
    }));
    setPhase("ritual");
  }, [needPicks, picks, prophecyMode]);

  const goToAltarFromRitual = useCallback(() => {
    if (busy) return;
    clearCascadeTimers();
    setCascadeOverlay(null);
    setEngine((e) => ({
      ...e,
      activeProphecy: [],
    }));
    setPicks([]);
    setPhase("altar");
  }, [busy, clearCascadeTimers]);

  const goToRitualFromLedger = useCallback(() => {
    if (busy || crossroadsOpen || engine.activeProphecy.length === 0) return;
    setPhase("ritual");
  }, [busy, crossroadsOpen, engine.activeProphecy.length]);

  const togglePick = useCallback(
    (id: FatesealStandardId) => {
      setPicks((prev) => {
        if (prophecyMode === "single") {
          return prev[0] === id ? [] : [id];
        }
        const set = new Set(prev);
        if (set.has(id)) set.delete(id);
        else if (set.size < 3) set.add(id);
        return [...set] as FatesealStandardId[];
      });
    },
    [prophecyMode],
  );

  const handleSpin = useCallback(() => {
    if (busy || crossroadsOpen) return;
    if (engine.activeProphecy.length === 0) return;
    setBusy(true);
    clearCascadeTimers();
    const rng = rngFactory();
    const result = runSpin(engine, rng);

    const pushLedgerAndFinish = () => {
      const lines = result.log
        .filter((l): l is Extract<typeof l, { kind: "cascade" }> => l.kind === "cascade")
        .map((l) => `Cascade ${l.depth + 1}: +${l.payout.toLocaleString()} (prophecy ${l.prophecyMatches})`);
      if (result.totalPayout > 0) {
        lines.push(`Spin total +${result.totalPayout.toLocaleString()}`);
      }
      setLastFeed((f) => [...lines, ...f].slice(0, 14));
      setCascadeOverlay(null);
      setEngine(result.nextState);
      setBusy(false);
      setPhase("ledger");
      if (result.crossroadsGate) {
        setCrossroadsOpen(true);
      }
    };

    const frames = result.cascadeKeyframes;
    const noAnim = reduceMotion || frames.length === 0;

    if (noAnim) {
      pushLedgerAndFinish();
      return;
    }

    let at = 0;
    for (const fr of frames) {
      const removals = new Set(fr.removedKeys);
      const prophecies = new Set(fr.prophecyMatchKeys);

      cascadeTimersRef.current.push(
        window.setTimeout(() => {
          setCascadeOverlay({
            depth: fr.depth,
            grid: dupGrid(fr.gridBeforeRemoval),
            removalKeys: removals,
            prophecyKeys: prophecies,
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
            payouts: [],
          });
        }, at + CASCADE_FOCUS_MS + CASCADE_EMIT_AFTER_MS + CASCADE_FLOAT_MS),
      );

      at += CASCADE_STEP_DURATION_MS;
    }

    cascadeTimersRef.current.push(window.setTimeout(pushLedgerAndFinish, at));
  }, [busy, clearCascadeTimers, crossroadsOpen, engine, reduceMotion]);

  const applyShop = useCallback(
    (choice: CrossroadsChoice) => {
      const res = applyCrossroads(engine, choice, choice === "silver_vision" ? silverPick : null, buyIn);
      if (!res.ok) return;
      setEngine(res.nextState);
      setCrossroadsOpen(false);
    },
    [buyIn, engine, silverPick],
  );

  const canCashOut = !busy && !crossroadsOpen && engine.activeProphecy.length > 0;
  const untilX = spinsUntilCrossroads(engine.spinCount);
  const displayGrid = cascadeOverlay?.grid ?? engine.grid;
  const presence = fatesealPhasePresence(reduceMotion);

  const headerWalletPaper = (
    <Paper radius="md" px="xs" py={6} withBorder style={{ ...panelPaper, minWidth: 88 }}>
      <Text size="xs" c="dimmed">
        In hand
      </Text>
      <Text fw={700} c={clubTokens.text.primary}>
        {engine.sessionWallet.toLocaleString()}
      </Text>
    </Paper>
  );

  const renderGridCells = () => (
    <div className="fateseal-grid-wrap">
      <div className="fateseal-grid" aria-label="Fateseal grid">
        {displayGrid.map((row, r) =>
          row.map((sym, c) => {
            const ck = `${r},${c}`;
            const voidNb = sym !== "void" && adjacentVoid(displayGrid, r, c);
            const removing = cascadeOverlay?.removalKeys.has(ck);
            const prophecyHit = cascadeOverlay?.prophecyKeys.has(ck);
            const flyoffs =
              cascadeOverlay?.payouts.filter((p) => p.cellKey === ck && p.text) ?? [];
            return (
              <div
                key={ck}
                className={[
                  "fateseal-cell",
                  sym === "void" ? "fateseal-cell--void" : "",
                  sym === "scatter" ? "fateseal-cell--scatter" : "",
                  sym === "wild" ? "fateseal-cell--wild" : "",
                  voidNb && reduceMotion ? "" : voidNb ? "fateseal-cell--voidNeighbor" : "",
                  !reduceMotion && removing ? "fateseal-cell--cascadePulse" : "",
                  !reduceMotion && prophecyHit && cascadeOverlay?.payouts.length ? "fateseal-cell--prophecyBloom" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
        <Group justify="space-between" align="center" wrap="nowrap" className="fateseal-topbar">
          <Stack gap={0}>
            <Title order={2} size="h4" c={clubTokens.text.primary} style={{ fontFamily: "Georgia, serif" }}>
              Fateseal Silver
            </Title>
            <Text size="xs" c={clubTokens.text.muted}>
              Cascading ritual — prophecy, the seal, crossroads ledger.
            </Text>
          </Stack>
          <Group gap="xs" wrap="nowrap">
            <div className="fateseal-spin-badge" aria-label="Completed rituals">
              {engine.spinCount}
            </div>
            {headerWalletPaper}
          </Group>
        </Group>

        <AnimatePresence mode="wait">
          <motion.section
            key={phase}
            className="fateseal-screen"
            aria-label={
              phase === "altar" ? "Prophecy altar" : phase === "ritual" ? "Ritual chamber" : "Ledger"
            }
            {...presence}
          >
            {phase === "altar" ? (
              <Paper p="md" radius="md" withBorder style={panelPaper} mih={280}>
                <Stack gap="md">
                  <Text size="xs" tt="uppercase" fw={700} c={clubTokens.text.muted}>
                    Prophecy altar
                  </Text>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant={prophecyMode === "single" ? "light" : "subtle"}
                      color="gray"
                      onClick={() => {
                        setProphecyMode("single");
                        setPicks([]);
                      }}
                    >
                      Single ({fatesealProphecyMode.single.winMultipleOfBaseBet}×)
                    </Button>
                    <Button
                      size="xs"
                      variant={prophecyMode === "triple" ? "light" : "subtle"}
                      color="gray"
                      onClick={() => {
                        setProphecyMode("triple");
                        setPicks([]);
                      }}
                    >
                      Triple ({fatesealProphecyMode.triple.winMultipleOfBaseBet}×)
                    </Button>
                  </Group>
                  {pickerGrid}
                  <Button
                    data-testid="fateseal-seal-prophecy"
                    size="sm"
                    variant="outline"
                    color="gray"
                    onClick={sealProphecy}
                    disabled={picks.length !== needPicks}
                  >
                    Seal the prophecy ({needPicks} symbol{needPicks > 1 ? "s" : ""})
                  </Button>
                  <Text size="xs" c="dimmed">
                    Choose symbols, seal them, then the ritual chamber opens—cascade settles on the ledger.
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
                      {" "}
                      ({engine.prophecyMode})
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

                <div className="fateseal-felt">
                  <Stack gap="md" align="center">
                    {renderGridCells()}
                    <Group justify="center" gap="sm" wrap="nowrap" mt="xs">
                      <NumberInput
                        size="xs"
                        label="Base bet"
                        min={fatesealTableConfig.minBaseBet}
                        max={maxBaseBet}
                        step={fatesealTableConfig.chipIncrement}
                        value={engine.baseBet}
                        onChange={(v) => {
                          const n = typeof v === "number" ? v : engine.baseBet;
                          const clamped = Math.min(
                            Math.max(fatesealTableConfig.minBaseBet, Math.floor(n)),
                            maxBaseBet,
                          );
                          setEngine((e) => ({ ...e, baseBet: clamped }));
                        }}
                        styles={{ label: { color: clubTokens.text.muted } }}
                        style={{ maxWidth: 140 }}
                      />
                      <Stack gap={6} mt={22}>
                        {busy ? <Loader color="grape" size="xs" /> : <Box h={14} />}
                        <button
                          type="button"
                          className="fateseal-ritual-btn"
                          data-testid="fateseal-ritual-spin"
                          aria-busy={busy}
                          disabled={
                            busy ||
                            crossroadsOpen ||
                            engine.activeProphecy.length === 0
                          }
                          onClick={handleSpin}
                        >
                          The ritual (spin)
                        </button>
                      </Stack>
                    </Group>
                    {engine.freeRitualSpinsLeft > 0 ? (
                      <Text size="xs" ta="center" c="grape">
                        Free Ritual: {engine.freeRitualSpinsLeft} charge
                        {engine.freeRitualSpinsLeft !== 1 ? "s" : ""} — no bet
                      </Text>
                    ) : null}
                  </Stack>
                </div>
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
                        {engine.scatterMeter} / {fatesealScatterRitual.meterToTrigger} (+{fatesealScatterRitual.freeSpinsGranted})
                      </Text>
                    </Paper>
                    <Paper radius="md" px="xs" py={6} withBorder style={{ borderColor: panelPaper.borderColor, background: "rgba(0,0,0,0.28)" }}>
                      <Text size="xs" c="dimmed">
                        Crossroads in
                      </Text>
                      <Text size="sm" fw={700}>
                        {crossroadsOpen ? "At the threshold" : untilX === 0 ? "Now" : `${untilX} spin(s)`}
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
                      lastFeed.map((line) => (
                        <Text key={line} size="xs" c={clubTokens.text.secondary}>
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
                      disabled={busy || crossroadsOpen || engine.activeProphecy.length === 0}
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
          </motion.section>
        </AnimatePresence>
      </Stack>

      <Modal
        opened={crossroadsOpen}
        onClose={() => {}}
        title="The Crossroads"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Every third spin, the ledger opens a bargain. Pick one.
          </Text>
          <Button variant="light" color="red" onClick={() => applyShop("faustian_bargain")}>
            Faustian Bargain — +{faustianCreditGrant(buyIn).toLocaleString()} credits; add {3} Voids to the pool
          </Button>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Silver Vision — cost {silverVisionCost(buyIn).toLocaleString()} (pick a standard to promote toward Wild in the pool)
            </Text>
            <Group gap="xs">
              <select
                aria-label="Silver Vision symbol"
                value={silverPick}
                onChange={(e) => setSilverPick(e.target.value as FatesealStandardId)}
                disabled={engine.silverVisionTarget != null}
                style={{
                  flex: 1,
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
              <Button variant="light" color="gray" disabled={engine.silverVisionTarget != null} onClick={() => applyShop("silver_vision")}>
                Buy Vision
              </Button>
            </Group>
          </Stack>
          <Button variant="light" color="violet" onClick={() => applyShop("forbidden_tome")}>
            The Forbidden Tome — {tomeCost(buyIn).toLocaleString()} credits — double scatter weight (3 spins)
          </Button>
        </Stack>
      </Modal>

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
    </Box>
  );
}
