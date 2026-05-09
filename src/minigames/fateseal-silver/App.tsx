import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
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
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
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

function rngFactory() {
  return () => Math.random();
}

function spinsUntilCrossroads(spinCount: number): number {
  if (spinCount === 0) return 3;
  const r = spinCount % 3;
  return r === 0 ? 0 : 3 - r;
}

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

export function FatesealSilverRoot(props: FatesealShellBinding) {
  const buyIn = props.settlement.buyIn;
  const reduceMotion = usePrefersReducedMotion();
  const [engine, setEngine] = useState<FatesealEngineState>(() =>
    createInitialFatesealState(props.sessionCredits, buyIn, Math.random),
  );
  const [prophecyMode, setProphecyMode] = useState<FatesealProphecyModeKey>("single");
  const [picks, setPicks] = useState<FatesealStandardId[]>([]);
  const [busy, setBusy] = useState(false);
  const [crossroadsOpen, setCrossroadsOpen] = useState(false);
  const [lastFeed, setLastFeed] = useState<string[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [silverPick, setSilverPick] = useState<FatesealStandardId>("dagger");

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
  }, [needPicks, picks, prophecyMode]);

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
    const rng = rngFactory();
    const result = runSpin(engine, rng);
    const animMs = reduceMotion ? 0 : 380 + result.log.filter((l) => l.kind === "cascade").length * 220;

    window.setTimeout(() => {
      setEngine(result.nextState);
      const lines = result.log
        .filter((l): l is Extract<typeof l, { kind: "cascade" }> => l.kind === "cascade")
        .map((l) => `Cascade ${l.depth + 1}: +${l.payout.toLocaleString()} (prophecy ${l.prophecyMatches})`);
      if (result.totalPayout > 0) {
        lines.push(`Spin total +${result.totalPayout.toLocaleString()}`);
      }
      setLastFeed((f) => [...lines, ...f].slice(0, 14));
      setBusy(false);
      if (result.crossroadsGate) {
        setCrossroadsOpen(true);
      }
    }, animMs);
  }, [busy, crossroadsOpen, engine, reduceMotion]);

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

  return (
    <Box className="fateseal-root" data-testid="fateseal-root">
      <Stack gap="xs" style={{ maxWidth: 1100, margin: "0 auto", height: "100%" }}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={0}>
            <Title order={2} size="h4" c="var(--fs-silver)" style={{ fontFamily: "Georgia, serif" }}>
              Fateseal Silver
            </Title>
            <Text size="xs" c="dimmed">
              Occult cascading grid — prophecy, ritual, crossroads.
            </Text>
          </Stack>
          <Paper p="xs" withBorder radius="md" style={{ borderColor: "rgba(200,208,218,0.2)" }}>
            <Text size="xs" c="dimmed">
              In hand
            </Text>
            <Text fw={700}>{engine.sessionWallet.toLocaleString()}</Text>
          </Paper>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm" style={{ flex: 1, minHeight: 0 }}>
          <Paper p="sm" withBorder radius="md" style={{ borderColor: "rgba(139,28,28,0.35)", background: "rgba(12,12,14,0.9)" }}>
            <Stack gap="sm">
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
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
              <SimpleGrid cols={4} spacing={6}>
                {FATESEAL_STANDARD_SYMBOLS.map((id) => {
                  const on = picks.includes(id);
                  return (
                    <UnstyledButton
                      key={id}
                      type="button"
                      onClick={() => togglePick(id)}
                      style={{
                        border: on ? "1px solid var(--fs-crimson)" : "1px solid rgba(200,208,218,0.2)",
                        borderRadius: 8,
                        padding: "6px 4px",
                        background: on ? "rgba(139,28,28,0.2)" : "rgba(0,0,0,0.35)",
                        textAlign: "center",
                      }}
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
              <Button size="xs" variant="outline" color="gray" onClick={sealProphecy} disabled={picks.length !== needPicks}>
                Seal the prophecy ({needPicks} symbol{needPicks > 1 ? "s" : ""})
              </Button>
              {engine.activeProphecy.length > 0 ? (
                <Text size="xs" c="teal">
                  Sealed: {engine.activeProphecy.map((p) => SYMBOL_LABEL[p]).join(", ")} ({engine.prophecyMode})
                </Text>
              ) : (
                <Text size="xs" c="dimmed">
                  Choose symbols, then seal before the ritual.
                </Text>
              )}
            </Stack>
          </Paper>

          <Stack gap="sm" justify="center">
            <div className="fateseal-grid" aria-label="Fateseal grid">
              {engine.grid.map((row, r) =>
                row.map((sym, c) => {
                  const voidNb = sym !== "void" && adjacentVoid(engine.grid, r, c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={[
                        "fateseal-cell",
                        sym === "void" ? "fateseal-cell--void" : "",
                        sym === "scatter" ? "fateseal-cell--scatter" : "",
                        sym === "wild" ? "fateseal-cell--wild" : "",
                        voidNb && reduceMotion ? "" : voidNb ? "fateseal-cell--voidNeighbor" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {SYMBOL_LABEL[sym]}
                    </div>
                  );
                }),
              )}
            </div>
            <Group justify="center" gap="sm">
              <NumberInput
                size="xs"
                label="Base bet"
                min={fatesealTableConfig.minBaseBet}
                max={maxBaseBet}
                step={fatesealTableConfig.chipIncrement}
                value={engine.baseBet}
                onChange={(v) => {
                  const n = typeof v === "number" ? v : engine.baseBet;
                  const clamped = Math.min(Math.max(fatesealTableConfig.minBaseBet, Math.floor(n)), maxBaseBet);
                  setEngine((e) => ({ ...e, baseBet: clamped }));
                }}
                style={{ maxWidth: 140 }}
              />
              <Button
                mt="lg"
                color="red"
                variant="light"
                loading={busy}
                disabled={busy || crossroadsOpen || engine.activeProphecy.length === 0}
                onClick={handleSpin}
              >
                The ritual (spin)
              </Button>
            </Group>
            {engine.freeRitualSpinsLeft > 0 ? (
              <Text size="xs" ta="center" c="grape">
                Free Ritual: {engine.freeRitualSpinsLeft} charge{engine.freeRitualSpinsLeft !== 1 ? "s" : ""} — no bet
              </Text>
            ) : null}
          </Stack>

          <Paper p="sm" withBorder radius="md" style={{ borderColor: "rgba(200,208,218,0.2)" }}>
            <Stack gap="xs">
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Ledger
              </Text>
              <Text size="xs">
                Scatter meter: {engine.scatterMeter} / {fatesealScatterRitual.meterToTrigger} → Free Ritual (+
                {fatesealScatterRitual.freeSpinsGranted} spins)
              </Text>
              <Text size="xs">
                Spins until Crossroads: {crossroadsOpen ? "at the threshold" : untilX}
              </Text>
              <Text size="xs" c="dimmed">
                Tome boost (scatter): {engine.tomeSpinsLeft > 0 ? `${engine.tomeSpinsLeft} spin(s)` : "inactive"}
              </Text>
              <Text size="xs" c="dimmed">
                Net vs buy-in: {(engine.sessionWallet - buyIn).toLocaleString()}
              </Text>
              <Stack gap={4}>
                {lastFeed.length === 0 ? (
                  <Text size="xs" c="dimmed" fs="italic">
                    The ledger waits.
                  </Text>
                ) : (
                  lastFeed.map((line) => (
                    <Text key={line} size="xs">
                      {line}
                    </Text>
                  ))
                )}
              </Stack>
              <Group gap="xs" wrap="wrap" justify="flex-end">
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
        </SimpleGrid>
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
          <Button
            variant="light"
            color="red"
            onClick={() => applyShop("faustian_bargain")}
          >
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
                style={{ flex: 1, padding: 8, borderRadius: 6, background: "#111", color: "#ddd", border: "1px solid #444" }}
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
                disabled={engine.silverVisionTarget != null}
                onClick={() => applyShop("silver_vision")}
              >
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
