import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Progress,
  Slider,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { SevenYearItchShellBinding } from "@/game/sessionSettlement";
import { computeSevenYearItchReturn } from "@/game/sessionSettlement";
import {
  POINT_NUMBERS,
  sevenYearItchTableConfig,
  type PointNumber,
} from "@/config/minigames/sevenYearItchRules";
import {
  clampFreeOdds,
  initialBets,
  initialTableState,
  resolveRoll,
  rollDice,
  totalOnLayout,
  type RollLine,
} from "./engine/craplessEngine";
import "./sevenYearItch.css";

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
  const [balance, setBalance] = useState(props.sessionCredits);
  const [table, setTable] = useState(initialTableState);
  const [bets, setBets] = useState(initialBets);
  const [feed, setFeed] = useState<RollLine[]>([]);
  const [rollCount, setRollCount] = useState(0);
  const [lastRoll, setLastRoll] = useState<string>("—");
  const [leaveOpen, setLeaveOpen] = useState(false);

  const wealth = balance + totalOnLayout(bets);
  const capPassHouse = Math.floor(buyIn * sevenYearItchTableConfig.maxPassBetFractionOfBuyIn);
  const maxPassWallet = balance + bets.passLine;
  const passSliderMax = Math.max(0, Math.min(capPassHouse, maxPassWallet));
  const passSliderCeil = Math.max(bets.passLine, passSliderMax);
  const passLocked = table.phase === "point" && bets.passLine > 0;

  const maxOddsCap = clampFreeOdds(bets.passLine, 1e9);
  const maxOddsWallet = balance + bets.freeOdds;
  const oddsSliderCeil = Math.max(bets.freeOdds, Math.min(maxOddsCap, maxOddsWallet));

  const heat = table.phase === "point" ? Math.min(100, table.rollsSincePoint * 14) : 0;

  const setPassLine = useCallback(
    (next: number) => {
      if (passLocked) return;
      let v = Math.floor(next);
      v = Math.max(0, Math.min(v, capPassHouse, maxPassWallet));
      if (v > 0 && v < sevenYearItchTableConfig.minPassBet) {
        v = sevenYearItchTableConfig.minPassBet;
        v = Math.min(v, capPassHouse, maxPassWallet);
      }
      const d = v - bets.passLine;
      setBalance((b) => b - d);
      setBets((prev) => ({ ...prev, passLine: v }));
    },
    [bets.passLine, capPassHouse, maxPassWallet, passLocked],
  );

  const setFreeOddsAmt = useCallback(
    (nextRaw: number) => {
      if (table.phase !== "point") return;
      let v = Math.max(0, Math.floor(nextRaw));
      v = Math.min(v, maxOddsCap, maxOddsWallet);
      const d = v - bets.freeOdds;
      setBalance((b) => b - d);
      setBets((prev) => ({ ...prev, freeOdds: v }));
    },
    [bets.freeOdds, maxOddsCap, maxOddsWallet, table.phase],
  );

  const setPlaceAmt = useCallback(
    (pk: PointNumber, nextRaw: number) => {
      if (table.phase !== "point") return;
      const old = bets.place[pk] ?? 0;
      let v = Math.max(0, Math.floor(nextRaw));
      v = Math.min(v, balance + old);
      if (v > 0 && v < sevenYearItchTableConfig.minPlaceBet) {
        v = sevenYearItchTableConfig.minPlaceBet;
        v = Math.min(v, balance + old);
      }
      const d = v - old;
      setBalance((b) => b - d);
      setBets((prev) => {
        const place = { ...prev.place };
        if (v <= 0) delete place[pk];
        else place[pk] = v;
        return { ...prev, place };
      });
    },
    [balance, bets.place, table.phase],
  );

  const canRoll =
    table.phase === "comeOut"
      ? bets.passLine >= sevenYearItchTableConfig.minPassBet
      : bets.passLine > 0;

  const handleRoll = useCallback(() => {
    if (!canRoll) return;
    const r = rollDice();
    const res = resolveRoll(table, bets, r);
    setBalance((b) => b + res.walletDelta);
    setTable(res.nextTable);
    setBets(res.nextBets);
    setLastRoll(`${r.d1} + ${r.d2} = ${r.total}`);
    setFeed((f) => [...res.lines, ...f].slice(0, 28));
    setRollCount((n) => n + 1);
  }, [bets, canRoll, table]);

  const confirmLeave = useCallback(() => {
    const uncapped = balance + totalOnLayout(bets);
    const detail = computeSevenYearItchReturn(uncapped, props.settlement);
    props.onReturnToClubMenu?.({ ...detail, tableRound: rollCount });
    setLeaveOpen(false);
  }, [balance, bets, props, rollCount]);

  const caseLabel = useMemo(() => {
    if (table.phase !== "point" || table.point == null) return "NO OPEN CASE";
    return `CASE FILE — ${table.point}`;
  }, [table.phase, table.point]);

  return (
    <Box className="seven-year-itch-root" p="md" data-testid="seven-year-itch-root">
      <Stack gap="md" maw={520} mx="auto">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Title order={2} c="var(--7yi-amber)" size="h3" style={{ fontFamily: "Georgia, serif" }}>
              7 Year Itch
            </Title>
            <Text size="xs" c="dimmed" mt={4}>
              Crapless layout — NV rules. Session buy-in {buyIn.toLocaleString()} credits.
            </Text>
          </div>
          <Button variant="subtle" color="gray" size="xs" onClick={() => setLeaveOpen(true)}>
            Return to the bar
          </Button>
        </Group>

        <Paper radius="md" p="md" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
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

        <Paper radius="md" p="md" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
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

        <Paper radius="md" p="md" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} className="seven-year-itch-dice" c="var(--7yi-amber)">
                Last roll
              </Text>
              <Text fw={700} className="seven-year-itch-dice" size="lg">
                {lastRoll}
              </Text>
            </Group>
            <Button
              fullWidth
              size="md"
              color="orange"
              variant="filled"
              disabled={!canRoll}
              onClick={handleRoll}
            >
              Roll
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              {table.phase === "comeOut"
                ? `Pass line ${sevenYearItchTableConfig.minPassBet}+ credits to shoot.`
                : "Point is live — seven busts the layout."}
            </Text>
          </Stack>
        </Paper>

        <Paper radius="md" p="md" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
          <Stack gap="lg">
            <Box>
              <Group justify="space-between" mb={6}>
                <Text size="sm" fw={600}>
                  Pass line
                </Text>
                <Text size="sm" c="dimmed">
                  {bets.passLine} / max {passSliderCeil}
                </Text>
              </Group>
              <Slider
                min={0}
                max={passSliderCeil}
                step={10}
                value={bets.passLine}
                onChange={setPassLine}
                disabled={passLocked}
                color="orange"
              />
              {passLocked ? (
                <Text size="xs" c="dimmed" mt={6}>
                  Pass is locked until this point resolves.
                </Text>
              ) : null}
            </Box>

            <Box>
              <Group justify="space-between" mb={6}>
                <Text size="sm" fw={600}>
                  Free odds
                </Text>
                <Text size="sm" c="dimmed">
                  {bets.freeOdds} / cap {Math.min(maxOddsCap, maxOddsWallet)}
                </Text>
              </Group>
              <Slider
                min={0}
                max={oddsSliderCeil}
                step={10}
                value={bets.freeOdds}
                onChange={setFreeOddsAmt}
                disabled={table.phase !== "point"}
                color="orange"
              />
            </Box>

            {table.phase === "point" ? (
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Place bets
                </Text>
                {POINT_NUMBERS.map((pk) => (
                  <Group key={pk} gap="xs" wrap="nowrap">
                    <Text size="xs" w={24}>
                      {pk}
                    </Text>
                    <Slider
                      style={{ flex: 1 }}
                      min={0}
                      max={Math.max(balance + (bets.place[pk] ?? 0), sevenYearItchTableConfig.minPlaceBet)}
                      step={5}
                      value={bets.place[pk] ?? 0}
                      onChange={(v) => setPlaceAmt(pk, v)}
                      color="orange"
                      size="sm"
                    />
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text size="xs" c="dimmed">
                Place bets unlock once a point is set.
              </Text>
            )}
          </Stack>
        </Paper>

        <Paper radius="md" p="md" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
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
