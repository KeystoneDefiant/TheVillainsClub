import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Group, Modal, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import type { SevenYearItchShellBinding } from "@/game/sessionSettlement";
import { computeSevenYearItchReturn } from "@/game/sessionSettlement";
import {
  sevenYearItchTableConfig,
  type HardwayNumber,
  type HopKey,
  type PointNumber,
} from "@/config/minigames/sevenYearItchRules";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import {
  initialBets,
  initialTableState,
  resolveRoll,
  rollDice,
  totalOnLayout,
  type DiceRoll,
  type RollLine,
} from "./engine/craplessEngine";
import { CraplessTableFelt } from "./components/CraplessTableFelt";
import "./sevenYearItch.css";

const CHIP = sevenYearItchTableConfig.chipIncrement;

function lineColor(kind: RollLine["kind"]): string {
  switch (kind) {
    case "win":
      return "var(--mantine-color-teal-4)";
    case "loss":
      return "var(--mantine-color-red-4)";
    case "neutral":
      return "var(--mantine-color-dimmed)";
    default:
      return "var(--mantine-color-dimmed)";
  }
}

export function SevenYearItchRoot(props: SevenYearItchShellBinding) {
  const buyIn = props.settlement.buyIn;
  const reduceMotion = usePrefersReducedMotion();
  const [balance, setBalance] = useState(props.sessionCredits);
  const [table, setTable] = useState(initialTableState);
  const [bets, setBets] = useState(initialBets);
  const [feed, setFeed] = useState<RollLine[]>([]);
  const [rollCount, setRollCount] = useState(0);
  const [lastRollText, setLastRollText] = useState("—");
  const [lastD1, setLastD1] = useState(1);
  const [lastD2, setLastD2] = useState(1);
  const [diceRolling, setDiceRolling] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const tableRef = useRef(table);
  const betsRef = useRef(bets);
  useEffect(() => {
    tableRef.current = table;
    betsRef.current = bets;
  }, [table, bets]);

  const wealth = balance + totalOnLayout(bets);
  const capPassHouse = Math.floor(buyIn * sevenYearItchTableConfig.maxPassBetFractionOfBuyIn);
  const passLocked = table.phase === "point" && bets.passLine > 0;

  const maxOddsCap = useMemo(() => {
    const p = Math.max(0, Math.floor(bets.passLine));
    if (p <= 0) return 0;
    return Math.floor(p * sevenYearItchTableConfig.maxFreeOddsMultipleOfPass);
  }, [bets.passLine]);

  const maxOddsWallet = balance + bets.freeOdds;
  const maxOddsDisplay = Math.min(maxOddsCap, maxOddsWallet);

  const heat = table.phase === "point" ? Math.min(100, table.rollsSincePoint * 14) : 0;

  const addPassChip = useCallback(() => {
    if (passLocked) return;
    const maxPass = Math.min(capPassHouse, bets.passLine + balance);
    const next = Math.min(bets.passLine + CHIP, maxPass);
    if (next <= bets.passLine) return;
    const d = next - bets.passLine;
    setBalance((b) => b - d);
    setBets((prev) => ({ ...prev, passLine: next }));
  }, [balance, bets.passLine, capPassHouse, passLocked]);

  const removePassChip = useCallback(() => {
    if (passLocked) return;
    if (bets.passLine <= 0) return;
    const next = Math.max(0, bets.passLine - CHIP);
    const d = bets.passLine - next;
    setBalance((b) => b + d);
    setBets((prev) => ({ ...prev, passLine: next }));
  }, [bets.passLine, passLocked]);

  const addOddsChip = useCallback(() => {
    if (table.phase !== "point") return;
    const cap = Math.min(maxOddsCap, maxOddsWallet);
    const next = Math.min(bets.freeOdds + CHIP, cap);
    if (next <= bets.freeOdds) return;
    const d = next - bets.freeOdds;
    setBalance((b) => b - d);
    setBets((prev) => ({ ...prev, freeOdds: next }));
  }, [bets.freeOdds, maxOddsCap, maxOddsWallet, table.phase]);

  const removeOddsChip = useCallback(() => {
    if (table.phase !== "point") return;
    if (bets.freeOdds <= 0) return;
    const next = Math.max(0, bets.freeOdds - CHIP);
    const d = bets.freeOdds - next;
    setBalance((b) => b + d);
    setBets((prev) => ({ ...prev, freeOdds: next }));
  }, [bets.freeOdds, table.phase]);

  const addPlaceChip = useCallback(
    (pk: PointNumber) => {
      if (table.phase !== "point") return;
      const old = bets.place[pk] ?? 0;
      const cap = old + balance;
      const next = Math.min(old + CHIP, cap);
      if (next <= old) return;
      const d = next - old;
      setBalance((b) => b - d);
      setBets((prev) => {
        const place = { ...prev.place };
        place[pk] = next;
        return { ...prev, place };
      });
    },
    [balance, bets.place, table.phase],
  );

  const removePlaceChip = useCallback(
    (pk: PointNumber) => {
      if (table.phase !== "point") return;
      const old = bets.place[pk] ?? 0;
      if (old <= 0) return;
      let next = Math.max(0, old - CHIP);
      if (next > 0 && next < sevenYearItchTableConfig.minPlaceBet) {
        next = 0;
      }
      const d = old - next;
      setBalance((b) => b + d);
      setBets((prev) => {
        const place = { ...prev.place };
        if (next <= 0) delete place[pk];
        else place[pk] = next;
        return { ...prev, place };
      });
    },
    [bets.place, table.phase],
  );

  const addFieldChip = useCallback(() => {
    const next = bets.field + CHIP;
    if (balance < CHIP) return;
    setBalance((b) => b - CHIP);
    setBets((prev) => ({ ...prev, field: next }));
  }, [balance, bets.field]);

  const removeFieldChip = useCallback(() => {
    if (bets.field <= 0) return;
    const next = Math.max(0, bets.field - CHIP);
    const d = bets.field - next;
    setBalance((b) => b + d);
    setBets((prev) => ({ ...prev, field: next }));
  }, [bets.field]);

  const addHornChip = useCallback(() => {
    const cost = CHIP * 4;
    if (balance < cost) return;
    setBalance((b) => b - cost);
    setBets((prev) => ({ ...prev, hornUnit: prev.hornUnit + CHIP }));
  }, [balance]);

  const removeHornChip = useCallback(() => {
    if (bets.hornUnit <= 0) return;
    const next = Math.max(0, bets.hornUnit - CHIP);
    const d = bets.hornUnit - next;
    setBalance((b) => b + d * 4);
    setBets((prev) => ({ ...prev, hornUnit: next }));
  }, [bets.hornUnit]);

  const addHopChip = useCallback(
    (key: HopKey) => {
      if (balance < CHIP) return;
      const old = bets.hops[key] ?? 0;
      setBalance((b) => b - CHIP);
      setBets((prev) => ({
        ...prev,
        hops: { ...prev.hops, [key]: old + CHIP },
      }));
    },
    [balance, bets.hops],
  );

  const removeHopChip = useCallback((key: HopKey) => {
    const old = bets.hops[key] ?? 0;
    if (old <= 0) return;
    const next = Math.max(0, old - CHIP);
    const d = old - next;
    setBalance((b) => b + d);
    setBets((prev) => {
      const hops = { ...prev.hops };
      if (next <= 0) delete hops[key];
      else hops[key] = next;
      return { ...prev, hops };
    });
  }, [bets.hops]);

  const addHardwayChip = useCallback(
    (hw: HardwayNumber) => {
      if (balance < CHIP) return;
      const old = bets.hardways[hw] ?? 0;
      setBalance((b) => b - CHIP);
      setBets((prev) => ({
        ...prev,
        hardways: { ...prev.hardways, [hw]: old + CHIP },
      }));
    },
    [balance, bets.hardways],
  );

  const removeHardwayChip = useCallback((hw: HardwayNumber) => {
    const old = bets.hardways[hw] ?? 0;
    if (old <= 0) return;
    const next = Math.max(0, old - CHIP);
    const d = old - next;
    setBalance((b) => b + d);
    setBets((prev) => {
      const hardways = { ...prev.hardways };
      if (next <= 0) delete hardways[hw];
      else hardways[hw] = next;
      return { ...prev, hardways };
    });
  }, [bets.hardways]);

  const canRoll =
    table.phase === "comeOut"
      ? bets.passLine >= sevenYearItchTableConfig.minPassBet
      : bets.passLine > 0;

  const applyRollResult = useCallback((r: DiceRoll) => {
    const res = resolveRoll(tableRef.current, betsRef.current, r);
    setBalance((b) => b + res.walletDelta);
    setTable(res.nextTable);
    setBets(res.nextBets);
    setLastRollText(`${r.d1} + ${r.d2} = ${r.total}`);
    setLastD1(r.d1);
    setLastD2(r.d2);
    setFeed((f) => [...res.lines, ...f].slice(0, 28));
    setRollCount((n) => n + 1);
  }, []);

  const handleRoll = useCallback(() => {
    if (!canRoll || diceRolling) return;
    const r = rollDice();
    if (reduceMotion) {
      applyRollResult(r);
      return;
    }
    setDiceRolling(true);
    window.setTimeout(() => {
      applyRollResult(r);
      setDiceRolling(false);
    }, 780);
  }, [applyRollResult, canRoll, diceRolling, reduceMotion]);

  const confirmLeave = useCallback(() => {
    const uncapped = balance + totalOnLayout(bets);
    const detail = computeSevenYearItchReturn(uncapped, props.settlement);
    props.onReturnToClubMenu?.({ ...detail, tableRound: rollCount });
    setLeaveOpen(false);
  }, [balance, bets, props, rollCount]);

  const caseLabel =
    table.phase !== "point" || table.point == null ? "NO OPEN CASE" : `CASE FILE — ${table.point}`;

  return (
    <Box className="seven-year-itch-root" p="md" data-testid="seven-year-itch-root">
      <Stack gap="md" maw={920} mx="auto">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Title order={2} c="var(--7yi-amber)" size="h3" style={{ fontFamily: "Georgia, serif" }}>
              7 Year Itch
            </Title>
            <Text size="xs" c="dimmed" mt={4}>
              Crapless layout — NV rules. Session buy-in {buyIn.toLocaleString()} credits. Click felt +{CHIP} ·
              right-click −{CHIP}.
            </Text>
          </div>
          <Button variant="subtle" color="gray" size="xs" onClick={() => setLeaveOpen(true)}>
            Return to the bar
          </Button>
        </Group>

        <Paper
          radius="md"
          p="md"
          withBorder
          style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}
        >
          <Stack gap="sm">
            <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
              Bank
            </Text>
            <Text size="xl" fw={700} c="var(--7yi-amber)">
              {balance.toLocaleString()} credits in hand
            </Text>
            <Text size="sm" c="dimmed">
              On layout {totalOnLayout(bets).toLocaleString()} · Session total {wealth.toLocaleString()}
            </Text>
          </Stack>
        </Paper>

        <Paper
          radius="md"
          p="md"
          withBorder
          style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}
        >
          <Stack gap="xs">
            <Text size="sm" fw={600} c="var(--7yi-amber)" tt="uppercase">
              {caseLabel}
            </Text>
            {table.phase === "point" ? (
              <>
                <Text size="xs" c="dimmed">
                  Heat on the investigation
                </Text>
                <Progress value={heat} color="orange" size="sm" radius="xs" />
              </>
            ) : (
              <Text size="xs" c="dimmed">
                Come-out — seven clears the board with a pass win; anything else opens a case.
              </Text>
            )}
          </Stack>
        </Paper>

        <CraplessTableFelt
          table={table}
          bets={bets}
          lastD1={lastD1}
          lastD2={lastD2}
          diceRolling={diceRolling}
          reduceMotion={reduceMotion}
          chip={CHIP}
          canRoll={canRoll}
          passLocked={passLocked}
          onPassPrimary={addPassChip}
          onPassSecondary={removePassChip}
          onOddsPrimary={addOddsChip}
          onOddsSecondary={removeOddsChip}
          onPlacePrimary={addPlaceChip}
          onPlaceSecondary={removePlaceChip}
          onFieldPrimary={addFieldChip}
          onFieldSecondary={removeFieldChip}
          onHornPrimary={addHornChip}
          onHornSecondary={removeHornChip}
          onHopPrimary={addHopChip}
          onHopSecondary={removeHopChip}
          onHardwayPrimary={addHardwayChip}
          onHardwaySecondary={removeHardwayChip}
          onRoll={handleRoll}
          maxOddsDisplay={maxOddsDisplay}
        />

        <Paper
          radius="md"
          p="sm"
          withBorder
          style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Last result
            </Text>
            <Text size="sm" fw={600} className="seven-year-itch-dice" c="var(--7yi-amber)">
              {lastRollText}
            </Text>
          </Group>
        </Paper>

        <Paper
          radius="md"
          p="md"
          withBorder
          style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}
        >
          <Text size="xs" tt="uppercase" c="dimmed" fw={700} mb="sm">
            Wire
          </Text>
          <Stack gap={6}>
            {feed.length === 0 ? (
              <Text size="sm" c="dimmed" fs="italic">
                Quiet as a closed grand jury…
              </Text>
            ) : (
              feed.map((ln, i) => (
                <Text key={`${i}-${ln.text}`} size="sm" c={lineColor(ln.kind)}>
                  {ln.text}
                </Text>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>

      <Modal opened={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave the table?">
        <Stack gap="md">
          <Text size="sm">
            Cash out <strong>{wealth.toLocaleString()}</strong> credits back to the club (subject to table caps and
            specials).
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setLeaveOpen(false)}>
              Stay
            </Button>
            <Button color="orange" onClick={confirmLeave}>
              Settle up
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
