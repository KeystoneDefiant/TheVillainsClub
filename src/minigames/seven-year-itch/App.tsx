import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Group, Modal, Paper, Progress, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { computeSevenYearItchReturn, type SevenYearItchShellBinding } from "@/game/sessionSettlement";
import {
  HARDWAY_NUMBERS,
  POINT_NUMBERS,
  sevenYearItchHeatBonuses,
  sevenYearItchRackets,
  sevenYearItchTableConfig,
  type SevenYearItchHeatBonus,
  type HardwayNumber,
  type HopKey,
  type PointNumber,
} from "@/config/minigames/sevenYearItchRules";
import { pickSevenYearItchRollStory } from "@/config/minigames/sevenYearItchRollStories";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import {
  initialBets,
  initialTableState,
  resolveRoll,
  rollDice,
  totalOnLayout,
  type CraplessTableState,
  type DiceRoll,
  type RollLine,
} from "./engine/craplessEngine";
import { CraplessTableFelt } from "./components/CraplessTableFelt";
import { DicePair3D } from "./components/DicePair3D";
import "./sevenYearItch.css";

const CHIP = sevenYearItchTableConfig.chipIncrement;
const HEAT_ROLLS = sevenYearItchTableConfig.heatRollsPerFavorOffer;
const SHOW_FIELD_HORN = sevenYearItchTableConfig.showFieldAndHornSection;

type MainView = "table" | "favors" | "handEnd";

type HandEndSummary = {
  feltBeforeRoll: number;
  creditsThisRoll: number;
  netWealthVsHandStart: number;
  roll: DiceRoll;
};

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

function rollEndsHand(before: CraplessTableState, roll: DiceRoll): boolean {
  if (before.phase === "comeOut") {
    return roll.total === 7;
  }
  if (before.phase === "point" && before.point != null) {
    return roll.total === 7 || roll.total === before.point;
  }
  return false;
}

function pickWeightedWithoutReplacement<T extends { pullWeight: number }>(pool: readonly T[], count: number, rng: () => number): T[] {
  const copy = [...pool];
  const out: T[] = [];
  const take = Math.min(count, copy.length);
  for (let i = 0; i < take; i++) {
    const totalW = copy.reduce((s, x) => s + x.pullWeight, 0);
    if (totalW <= 0) break;
    let r = rng() * totalW;
    for (let j = 0; j < copy.length; j++) {
      const w = copy[j]!.pullWeight;
      r -= w;
      if (r <= 0) {
        out.push(copy[j]!);
        copy.splice(j, 1);
        break;
      }
    }
  }
  return out;
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
  const [favorPicks, setFavorPicks] = useState<SevenYearItchHeatBonus[]>([]);
  const [favorOfferKeep, setFavorOfferKeep] = useState(false);
  const [mainView, setMainView] = useState<MainView>("table");
  const [logOpen, setLogOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [loreState, setLoreState] = useState({
    title: "The Investigation",
    body: "Put money on the pass line and roll. Seven wins on the open; anything else sets the point.",
  });
  const [lastRollText, setLastRollText] = useState("—");
  const [lastD1, setLastD1] = useState(1);
  const [lastD2, setLastD2] = useState(1);
  const [diceRunActive, setDiceRunActive] = useState(false);
  const [diceRunStyle, setDiceRunStyle] = useState<React.CSSProperties>({});
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [handEndSummary, setHandEndSummary] = useState<HandEndSummary | null>(null);

  const tableRef = useRef(table);
  const betsRef = useRef(bets);
  const balanceRef = useRef(balance);
  const handStartWealthRef = useRef(props.sessionCredits);
  const showHandEndAfterLoreRef = useRef(false);
  const pendingSummaryRef = useRef<HandEndSummary | null>(null);
  const animTimersRef = useRef<number[]>([]);

  useEffect(() => {
    tableRef.current = table;
  }, [table]);
  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    const timers = animTimersRef;
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const wealth = balance + totalOnLayout(bets);
  const capPassHouse = Math.floor(buyIn * sevenYearItchTableConfig.maxPassBetFractionOfBuyIn);
  const passLocked = table.phase === "point" && bets.passLine > 0;
  const passOnlyLayout = table.phase === "comeOut" && table.point == null;

  const maxOddsCap = useMemo(() => {
    const p = Math.max(0, Math.floor(bets.passLine));
    if (p <= 0) return 0;
    return Math.floor(p * sevenYearItchTableConfig.maxFreeOddsMultipleOfPass);
  }, [bets.passLine]);

  const maxOddsWallet = balance + bets.freeOdds;
  const maxOddsDisplay = Math.min(maxOddsCap, maxOddsWallet);

  const heat = Math.min(100, (heatRolls / HEAT_ROLLS) * 100);
  const canCashOut = table.phase === "comeOut" && table.point == null && !diceRunActive;

  const pickHeatChoices = useCallback(() => {
    const excludeId = activeBonus?.id;
    const pool = excludeId ? sevenYearItchHeatBonuses.filter((b) => b.id !== excludeId) : [...sevenYearItchHeatBonuses];
    const picks = pickWeightedWithoutReplacement(pool, 3, Math.random);
    setFavorPicks(picks);
    setFavorOfferKeep(!!activeBonus);
    setMainView("favors");
  }, [activeBonus]);

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

  const handleDivest = useCallback(() => {
    if (table.phase !== "point" || table.hasUsedDivest || diceRunActive) return;
    const b = betsRef.current;
    let returned = b.freeOdds + b.field + b.hornUnit * 4;
    for (const k of Object.keys(b.hops) as HopKey[]) returned += b.hops[k] ?? 0;
    for (const pk of POINT_NUMBERS) returned += b.place[pk] ?? 0;
    for (const hw of HARDWAY_NUMBERS) returned += b.hardways[hw] ?? 0;
    const free = activeBonus?.effect.type === "free_divest";
    setBalance((prev) => prev + returned);
    setBets((prev) => ({
      ...prev,
      freeOdds: 0,
      field: 0,
      hornUnit: 0,
      hops: {},
      place: {},
      hardways: {},
    }));
    setTable((t) => ({
      ...t,
      hasUsedDivest: true,
      placePayoutScale: free ? 1 : 0.5,
    }));
    if (free) setActiveBonus(null);
  }, [activeBonus, diceRunActive, table.phase, table.hasUsedDivest]);

  const canRoll =
    table.phase === "comeOut"
      ? bets.passLine >= sevenYearItchTableConfig.minPassBet
      : bets.passLine > 0;

  const canDivest =
    table.phase === "point" && !table.hasUsedDivest && !diceRunActive && totalOnLayout(bets) > bets.passLine;

  const applyRollResult = useCallback(
    (r: DiceRoll) => {
      const currentTable = tableRef.current;
      const currentBets = betsRef.current;
      const feltBeforeRoll = totalOnLayout(currentBets);
      const bonus = activeBonus;
      const shieldAbsorbsSeven =
        bonus?.effect.type === "shield_next_seven" && r.total === 7 && currentTable.phase === "point";
      const endsHand = rollEndsHand(currentTable, r) && !shieldAbsorbsSeven;
      const res = resolveRoll(currentTable, currentBets, r);
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
      if (shieldAbsorbsSeven) {
        nextTable = { ...currentTable, rollsSincePoint: currentTable.rollsSincePoint + 1 };
        nextBets = currentBets;
        walletDelta = 0;
        bonusLines.push({ kind: "win", text: `${bonus.title} burns the warrant. The felt survives.` });
        setActiveBonus(null);
      }

      const balBefore = balanceRef.current;
      setBalance(balBefore + walletDelta);
      setTable(nextTable);
      setBets(nextBets);
      setLastRollText(`${r.d1} + ${r.d2} = ${r.total}`);
      setLastD1(r.d1);
      setLastD2(r.d2);
      setFeed((f) => [...bonusLines, ...(shieldAbsorbsSeven ? [] : res.lines), ...f].slice(0, 28));
      setRollCount((n) => n + 1);

      const storyLine = pickSevenYearItchRollStory(r.total);
      const racket = r.total === 7 ? null : sevenYearItchRackets[r.total as PointNumber];
      if (shieldAbsorbsSeven) {
        setLoreState({
          title: "Seven — waved through",
          body: `${storyLine} The favor clears the warrant; the felt stands untouched for now.`,
        });
      } else {
        setLoreState({
          title: r.total === 7 ? "The Bust" : `${r.total}: ${racket?.name ?? "Street Business"}`,
          body:
            r.total === 7
              ? `${storyLine} Sirens rake the alley — every exposed chip is evidence.`
              : `${storyLine} ${racket?.story ?? ""}`.trim(),
        });
      }

      const wealthAfter = balBefore + walletDelta + totalOnLayout(nextBets);
      if (endsHand) {
        pendingSummaryRef.current = {
          feltBeforeRoll,
          creditsThisRoll: walletDelta,
          netWealthVsHandStart: wealthAfter - handStartWealthRef.current,
          roll: r,
        };
        showHandEndAfterLoreRef.current = true;
      } else {
        showHandEndAfterLoreRef.current = false;
        pendingSummaryRef.current = null;
      }

      setHeatRolls((prev) => {
        if (endsHand) return 0;
        if (r.total === 7) return 0;
        const next = prev + 1;
        if (next >= HEAT_ROLLS) {
          pickHeatChoices();
          return 0;
        }
        return next;
      });
    },
    [activeBonus, pickHeatChoices],
  );

  const closeLoreModal = useCallback(() => {
    setLoreOpen(false);
    if (showHandEndAfterLoreRef.current && pendingSummaryRef.current) {
      setHandEndSummary(pendingSummaryRef.current);
      pendingSummaryRef.current = null;
      showHandEndAfterLoreRef.current = false;
      setMainView("handEnd");
    }
  }, []);

  const handleRoll = useCallback(() => {
    if (!canRoll || diceRunActive) return;
    const r = rollDice();
    if (reduceMotion) {
      applyRollResult(r);
      setLoreOpen(true);
      return;
    }
    const startXvw = 10 + Math.random() * 72;
    const deltaXvw = 62 - startXvw + (Math.random() * 16 - 8);
    const deltaYvh = -38 - Math.random() * 12;
    setDiceRunStyle({
      left: `${startXvw.toFixed(2)}vw`,
      bottom: "7vh",
      ["--yi-dx" as string]: `${deltaXvw.toFixed(2)}vw`,
      ["--yi-dy" as string]: `${deltaYvh.toFixed(2)}vh`,
    });
    setDiceRunActive(true);
    const t1 = window.setTimeout(() => {
      setLastD1(r.d1);
      setLastD2(r.d2);
    }, 50);
    animTimersRef.current.push(t1);
    const t2 = window.setTimeout(() => {
      applyRollResult(r);
      setDiceRunActive(false);
      setLoreOpen(true);
    }, 1080);
    animTimersRef.current.push(t2);
  }, [applyRollResult, canRoll, diceRunActive, reduceMotion]);

  const caseLabel =
    table.phase !== "point" || table.point == null
      ? "NO OPEN CASE"
      : `CASE FILE — ${table.point} ${sevenYearItchRackets[table.point].name}`;

  const beginNextHand = useCallback(() => {
    handStartWealthRef.current = balanceRef.current + totalOnLayout(betsRef.current);
    setHandEndSummary(null);
    setMainView("table");
  }, []);

  const favorSelectionBody = (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Pick one favor before the cops cool down. Effects apply on upcoming rolls — read each card.
      </Text>
      {favorOfferKeep ? (
        <Button
          variant="outline"
          color="gray"
          onClick={() => {
            setMainView("table");
            setFavorPicks([]);
          }}
        >
          Keep existing favor{activeBonus ? ` — ${activeBonus.title}` : ""}
        </Button>
      ) : null}
      {favorPicks.map((bonus) => (
        <Paper key={bonus.id} p="sm" withBorder radius="md" style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
          <Stack gap={6}>
            <Text fw={700} c="var(--7yi-amber)" size="sm">
              {bonus.title}
            </Text>
            <Text size="xs" c="dimmed">
              {bonus.description}
            </Text>
            <Text size="xs" c="dimmed">
              {bonus.effect.type === "shield_next_seven"
                ? "Consumes on the next seven while a point is active — the bust is ignored once."
                : bonus.effect.type === "free_divest"
                  ? "The next Divest costs no skim: place payouts stay full odds for the hand."
                  : bonus.effect.type === "place_hit_multiplier"
                    ? "Multiplies table winnings on the next roll that pays a place hit."
                    : bonus.effect.type === "risk_reward_multiplier"
                      ? "Multiplies the next non-seven payout; risky tables may still seize on a seven."
                      : "Multiplies the next non-seven payout that hits the layout."}
            </Text>
            <Button
              variant="light"
              color="orange"
              size="xs"
              onClick={() => {
                setActiveBonus(bonus);
                setFavorPicks([]);
                setMainView("table");
              }}
            >
              Take this favor
            </Button>
          </Stack>
        </Paper>
      ))}
      <Button variant="subtle" color="gray" size="xs" onClick={() => setMainView("table")}>
        Back to the table
      </Button>
    </Stack>
  );

  return (
    <Box className="seven-year-itch-root" data-testid="seven-year-itch-root">
      {diceRunActive ? (
        <div className="yi-diceOverlay" aria-hidden>
          <div className="yi-diceOverlay-inner yi-diceOverlay-inner--roll" style={diceRunStyle}>
            <DicePair3D d1={lastD1} d2={lastD2} rolling reduceMotion={false} />
          </div>
        </div>
      ) : null}

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
          <div className="seven-year-itch-rollBadge" aria-label="Last roll" data-testid="roll-badge">
            {lastRollText === "—" ? "—" : lastRollText.split(" = ")[1]}
          </div>
        </Group>

        {mainView === "favors" ? (
          <Paper
            radius="md"
            p="md"
            withBorder
            style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)", flex: 1, minHeight: 0, overflow: "auto" }}
          >
            <Title order={3} size="h4" c="var(--7yi-amber)" mb="sm" style={{ fontFamily: "Georgia, serif" }}>
              Favors — heat shop
            </Title>
            {favorSelectionBody}
          </Paper>
        ) : null}

        {mainView === "handEnd" && handEndSummary ? (
          <Paper
            radius="md"
            p="md"
            withBorder
            style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}
            data-testid="hand-end-screen"
          >
            <Stack gap="md">
              <Title order={3} size="h4" c="var(--7yi-amber)" style={{ fontFamily: "Georgia, serif" }}>
                Hand closed
              </Title>
              <Text size="sm">
                The dice showed{" "}
                <strong>
                  {handEndSummary.roll.d1} + {handEndSummary.roll.d2} = {handEndSummary.roll.total}
                </strong>
                .
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <Paper p="sm" withBorder>
                  <Text size="xs" c="dimmed">
                    On the felt (before the final roll)
                  </Text>
                  <Text fw={700}>{handEndSummary.feltBeforeRoll.toLocaleString()}</Text>
                </Paper>
                <Paper p="sm" withBorder>
                  <Text size="xs" c="dimmed">
                    Credits from the final roll
                  </Text>
                  <Text fw={700}>{handEndSummary.creditsThisRoll.toLocaleString()}</Text>
                </Paper>
                <Paper p="sm" withBorder style={{ gridColumn: "1 / -1" }}>
                  <Text size="xs" c="dimmed">
                    Net change this hand (wallet + table vs hand start)
                  </Text>
                  <Text fw={700}>{handEndSummary.netWealthVsHandStart.toLocaleString()}</Text>
                </Paper>
              </SimpleGrid>
              <Group grow wrap="wrap">
                <Button color="orange" onClick={beginNextHand}>
                  Play next hand
                </Button>
                <Button
                  variant="light"
                  color="gray"
                  disabled={!canCashOut}
                  onClick={() => setCashOutOpen(true)}
                  title={canCashOut ? "Settle and return to the club" : "Wait until dice finish"}
                >
                  Cash out
                </Button>
              </Group>
            </Stack>
          </Paper>
        ) : null}

        {mainView === "table" ? (
          <>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
                <Text size="xs" c="dimmed">
                  In hand
                </Text>
                <Text fw={700} c="var(--7yi-amber)">
                  {balance.toLocaleString()}
                </Text>
              </Paper>
              <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
                <Text size="xs" c="dimmed">
                  On felt
                </Text>
                <Text fw={700}>{totalOnLayout(bets).toLocaleString()}</Text>
              </Paper>
              <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
                <Text size="xs" c="dimmed">
                  Net vs buy-in
                </Text>
                <Text fw={700}>{(wealth - buyIn).toLocaleString()}</Text>
              </Paper>
              <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    Heat
                  </Text>
                  <Text size="xs" c="var(--7yi-amber)">
                    {heatRolls}/{HEAT_ROLLS}
                  </Text>
                </Group>
                <Progress value={heat} color="orange" size="sm" radius="xs" />
              </Paper>
            </SimpleGrid>

            <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Text size="xs" c="dimmed" lineClamp={3} style={{ flex: "1 1 200px", minWidth: 0 }}>
                  {passOnlyLayout
                    ? "Open investigation: bet the pass line only. Seven wins even money; any other total sets the point and opens the full racket board."
                    : loreState.body}
                </Text>
                <Button variant="subtle" color="orange" size="xs" onClick={() => setLoreOpen(true)} style={{ flexShrink: 0 }}>
                  Last story
                </Button>
              </Group>
            </Paper>

            <CraplessTableFelt
              table={table}
              bets={bets}
              lastD1={lastD1}
              lastD2={lastD2}
              diceRolling={diceRunActive}
              reduceMotion={reduceMotion}
              chip={CHIP}
              passOnlyLayout={passOnlyLayout}
              showFieldAndHorn={SHOW_FIELD_HORN}
              placePayoutScale={table.placePayoutScale}
              activeFavorTitle={activeBonus?.title ?? null}
              canRoll={canRoll}
              passLocked={passLocked}
              canDivest={canDivest}
              onDivest={handleDivest}
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
              hideInlineDice={diceRunActive}
            />

            <Paper radius="md" p="xs" withBorder style={{ borderColor: "var(--7yi-amber-dim)", background: "var(--7yi-paper)" }}>
              <Group justify="space-between" wrap="wrap" gap="xs">
                {favorPicks.length > 0 ? (
                  <Button variant="subtle" color="orange" size="xs" onClick={() => setMainView("favors")}>
                    Favors
                  </Button>
                ) : null}
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
          </>
        ) : null}
      </Stack>

      <Modal opened={loreOpen} onClose={closeLoreModal} title={loreState.title} centered>
        <Stack gap="sm">
          <Text size="sm">{loreState.body}</Text>
          <SimpleGrid cols={3} spacing="xs">
            <Paper p="xs" withBorder>
              <Text size="xs" c="dimmed">
                On felt
              </Text>
              <Text fw={700}>{totalOnLayout(bets).toLocaleString()}</Text>
            </Paper>
            <Paper p="xs" withBorder>
              <Text size="xs" c="dimmed">
                Net
              </Text>
              <Text fw={700}>{(wealth - buyIn).toLocaleString()}</Text>
            </Paper>
            <Paper p="xs" withBorder>
              <Text size="xs" c="dimmed">
                Heat
              </Text>
              <Text fw={700}>
                {heatRolls}/{HEAT_ROLLS}
              </Text>
            </Paper>
          </SimpleGrid>
          {activeBonus ? (
            <Text size="sm" c="var(--7yi-amber)">
              Active favor: {activeBonus.title}
            </Text>
          ) : null}
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

      <Modal opened={leaveOpen} onClose={() => setLeaveOpen(false)} title="Game saved" centered>
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
