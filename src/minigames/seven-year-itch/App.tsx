import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Group, Modal, Paper, Progress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { computeSevenYearItchReturn, type SevenYearItchShellBinding } from "@/game/sessionSettlement";
import {
  sevenYearItchTableConfig,
  sevenYearItchHeatBonuses,
  sevenYearItchRackets,
  type SevenYearItchHeatBonus,
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
const HEAT_ROLLS = 4;

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
  const [heatRolls, setHeatRolls] = useState(0);
  const [activeBonus, setActiveBonus] = useState<SevenYearItchHeatBonus | null>(null);
  const [bonusChoices, setBonusChoices] = useState<SevenYearItchHeatBonus[]>([]);
  const [loreOpen, setLoreOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [loreState, setLoreState] = useState({
    title: "The Investigation",
    body: "Put money on the pass line and roll to see which racket draws police attention.",
  });
  const [lastRollText, setLastRollText] = useState("—");
  const [lastD1, setLastD1] = useState(1);
  const [lastD2, setLastD2] = useState(1);
  const [diceRolling, setDiceRolling] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);

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

  const heat = Math.min(100, (heatRolls / HEAT_ROLLS) * 100);
  const canCashOut = table.phase === "comeOut" && table.point == null && !diceRolling;

  const pickHeatChoices = useCallback(() => {
    const weighted = [...sevenYearItchHeatBonuses].sort((a, b) => b.pullWeight - a.pullWeight);
    const offset = rollCount % weighted.length;
    setBonusChoices([weighted[offset], weighted[(offset + 1) % weighted.length], weighted[(offset + 2) % weighted.length]].filter(Boolean));
  }, [rollCount]);

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
    const currentTable = tableRef.current;
    const currentBets = betsRef.current;
    const res = resolveRoll(currentTable, currentBets, r);
    const bonus = activeBonus;
    let walletDelta = res.walletDelta;
    const bonusLines: RollLine[] = [];
    let nextTable = res.nextTable;
    let nextBets = res.nextBets;
    if (bonus && r.total !== 7 && walletDelta > 0) {
      if (bonus.effect.type === "next_non_seven_multiplier" || bonus.effect.type === "risk_reward_multiplier") {
        const extra = Math.floor(walletDelta * (bonus.effect.value - 1));
        walletDelta += extra;
        bonusLines.push({ kind: "win", text: `${bonus.title} adds ${extra.toLocaleString()} credits.` });
        setActiveBonus(null);
      } else if (bonus.effect.type === "place_hit_multiplier" && res.lines.some((line) => line.text.includes("Place on"))) {
        const extra = Math.floor(walletDelta * (bonus.effect.value - 1));
        walletDelta += extra;
        bonusLines.push({ kind: "win", text: `${bonus.title} doubles the take by ${extra.toLocaleString()} credits.` });
        setActiveBonus(null);
      }
    }
    if (bonus?.effect.type === "shield_next_seven" && r.total === 7 && currentTable.phase === "point") {
      nextTable = { ...currentTable, rollsSincePoint: currentTable.rollsSincePoint + 1 };
      nextBets = currentBets;
      bonusLines.push({ kind: "win", text: `${bonus.title} burns the warrant. The felt survives.` });
      setActiveBonus(null);
    }
    setBalance((b) => b + walletDelta);
    setTable(nextTable);
    setBets(nextBets);
    setLastRollText(`${r.d1} + ${r.d2} = ${r.total}`);
    setLastD1(r.d1);
    setLastD2(r.d2);
    setFeed((f) => [...bonusLines, ...res.lines, ...f].slice(0, 28));
    setRollCount((n) => n + 1);

    const racket = r.total === 7 ? null : sevenYearItchRackets[r.total as PointNumber];
    setLoreState({
      title: r.total === 7 ? "The Bust" : `${r.total}: ${racket?.name ?? "Street Business"}`,
      body:
        r.total === 7
          ? "Sirens rake the alley. The authorities kick the door in and every exposed investment gets seized."
          : (racket?.story ?? "The street keeps moving, and the books keep bleeding ink."),
    });
    setLoreOpen(true);

    setHeatRolls((prev) => {
      if (r.total === 7) return 0;
      const next = prev + 1;
      if (next >= HEAT_ROLLS) {
        pickHeatChoices();
        return 0;
      }
      return next;
    });
  }, [activeBonus, pickHeatChoices]);

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

  const caseLabel =
    table.phase !== "point" || table.point == null
      ? "NO OPEN CASE"
      : `CASE FILE — ${table.point} ${sevenYearItchRackets[table.point].name}`;

  return (
    <Box className="seven-year-itch-root" data-testid="seven-year-itch-root">
      <Stack gap="xs" className="seven-year-itch-frame">
        <Group justify="space-between" align="center" wrap="nowrap" className="seven-year-itch-topbar">
          <Stack gap={0}>
            <Title order={2} c="var(--7yi-amber)" size="h4" style={{ fontFamily: "Georgia, serif" }}>
              7 Year Itch
            </Title>
            <Text size="xs" c="dimmed">
              {caseLabel}
            </Text>
          </Stack>
          <div className="seven-year-itch-rollBadge" aria-label="Last roll">
            {lastRollText === "—" ? "—" : lastRollText.split(" = ")[1]}
          </div>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
          <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
            <Text size="xs" c="dimmed">In hand</Text>
            <Text fw={700} c="var(--7yi-amber)">{balance.toLocaleString()}</Text>
          </Paper>
          <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
            <Text size="xs" c="dimmed">On felt</Text>
            <Text fw={700}>{totalOnLayout(bets).toLocaleString()}</Text>
          </Paper>
          <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
            <Text size="xs" c="dimmed">Net vs buy-in</Text>
            <Text fw={700}>{(wealth - buyIn).toLocaleString()}</Text>
          </Paper>
          <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="xs" c="dimmed">Heat</Text>
              <Text size="xs" c="var(--7yi-amber)">{heatRolls}/{HEAT_ROLLS}</Text>
            </Group>
            <Progress value={heat} color="orange" size="sm" radius="xs" />
          </Paper>
        </SimpleGrid>

        <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="xs" c="dimmed" lineClamp={2} style={{ flex: "1 1 180px", minWidth: 0 }}>
              {loreState.body}
            </Text>
            <Button variant="subtle" color="orange" size="xs" onClick={() => setLoreOpen(true)} style={{ flexShrink: 0 }}>
              Story
            </Button>
          </Group>
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

        <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Button variant="subtle" color="gray" size="xs" onClick={() => setLogOpen(true)}>
              Rolls / results
            </Button>
            <Group gap="xs" wrap="wrap" justify="flex-end">
              <Button variant="subtle" color="gray" size="xs" onClick={() => setLeaveOpen(true)}>
                Save and return later
              </Button>
              <Button
                variant={canCashOut ? "light" : "subtle"}
                color="orange"
                size="xs"
                disabled={!canCashOut}
                onClick={() => setCashOutOpen(true)}
                aria-label="Cash out to club"
                title={canCashOut ? "Cash out and settle this table" : "Cash out unlocks when no point is active"}
              >
                Cash out
              </Button>
            </Group>
          </Group>
        </Paper>
      </Stack>

      <Modal opened={loreOpen} onClose={() => setLoreOpen(false)} title={loreState.title} centered>
        <Stack gap="sm">
          <Text size="sm">{loreState.body}</Text>
          <SimpleGrid cols={3} spacing="xs">
            <Paper p="xs" withBorder>
              <Text size="xs" c="dimmed">On felt</Text>
              <Text fw={700}>{totalOnLayout(bets).toLocaleString()}</Text>
            </Paper>
            <Paper p="xs" withBorder>
              <Text size="xs" c="dimmed">Net</Text>
              <Text fw={700}>{(wealth - buyIn).toLocaleString()}</Text>
            </Paper>
            <Paper p="xs" withBorder>
              <Text size="xs" c="dimmed">Heat</Text>
              <Text fw={700}>{heatRolls}/{HEAT_ROLLS}</Text>
            </Paper>
          </SimpleGrid>
          {activeBonus ? (
            <Text size="sm" c="var(--7yi-amber)">
              Active favor: {activeBonus.title}
            </Text>
          ) : null}
        </Stack>
      </Modal>

      <Modal opened={bonusChoices.length > 0} onClose={() => setBonusChoices([])} title="The heat boils over" centered>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Pick one favor before the cops cool down.
          </Text>
          {bonusChoices.map((bonus) => (
            <Button
              key={bonus.id}
              variant="light"
              color="orange"
              onClick={() => {
                setActiveBonus(bonus);
                setBonusChoices([]);
              }}
            >
              {bonus.title} — {bonus.description}
            </Button>
          ))}
        </Stack>
      </Modal>

      <Modal opened={logOpen} onClose={() => setLogOpen(false)} title="Roll wire" centered>
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
      </Modal>

      <Modal opened={leaveOpen} onClose={() => setLeaveOpen(false)} title="Game saved">
        <Stack gap="md">
          <Text size="sm">
            The club will keep this table warm. Come back through the menu to resume this session without another buy-in.
          </Text>
          <Button color="orange" onClick={props.onPauseToClub}>
            Back to the bar
          </Button>
        </Stack>
      </Modal>

      <Modal opened={cashOutOpen} onClose={() => setCashOutOpen(false)} title="Cash out?" withinPortal={false}>
        <Stack gap="md">
          <Text size="sm">
            There is no active point. Settle this table and return your eligible credits to the club wallet?
          </Text>
          <SimpleGrid cols={2} spacing="sm">
            <Button variant="subtle" color="gray" onClick={() => setCashOutOpen(false)}>
              Cancel
            </Button>
            <Button
              color="orange"
              onClick={() => {
                setCashOutOpen(false);
                props.onReturnToClubMenu?.({
                  ...computeSevenYearItchReturn(wealth, props.settlement),
                  tableRound: rollCount,
                });
              }}
            >
              Confirm cash out
            </Button>
          </SimpleGrid>
        </Stack>
      </Modal>
    </Box>
  );
}
