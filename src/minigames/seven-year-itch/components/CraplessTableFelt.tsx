import { Text } from "@mantine/core";
import type { CraplessTableState, TableBets } from "../engine/craplessEngine";
import {
  ALL_HOP_KEYS,
  HARDWAY_NUMBERS,
  POINT_NUMBERS,
  placeBetTotalReturn,
  sevenYearItchRackets,
  type HardwayNumber,
  type HopKey,
  type PointNumber,
} from "@/config/minigames/sevenYearItchRules";
import { DicePair3D } from "./DicePair3D";

export type CraplessTableFeltProps = {
  table: CraplessTableState;
  bets: TableBets;
  lastD1: number;
  lastD2: number;
  diceRolling: boolean;
  reduceMotion: boolean;
  chip: number;
  canRoll: boolean;
  passLocked: boolean;
  onPassPrimary: () => void;
  onPassSecondary: () => void;
  onOddsPrimary: () => void;
  onOddsSecondary: () => void;
  onPlacePrimary: (pk: PointNumber) => void;
  onPlaceSecondary: (pk: PointNumber) => void;
  onFieldPrimary: () => void;
  onFieldSecondary: () => void;
  onHornPrimary: () => void;
  onHornSecondary: () => void;
  onHopPrimary: (key: HopKey) => void;
  onHopSecondary: (key: HopKey) => void;
  onHardwayPrimary: (hw: HardwayNumber) => void;
  onHardwaySecondary: (hw: HardwayNumber) => void;
  onRoll: () => void;
  maxOddsDisplay: number;
};

function preventCtx(e: React.MouseEvent) {
  e.preventDefault();
}

export function CraplessTableFelt({
  table,
  bets,
  lastD1,
  lastD2,
  diceRolling,
  reduceMotion,
  chip,
  canRoll,
  passLocked,
  onPassPrimary,
  onPassSecondary,
  onOddsPrimary,
  onOddsSecondary,
  onPlacePrimary,
  onPlaceSecondary,
  onFieldPrimary,
  onFieldSecondary,
  onHornPrimary,
  onHornSecondary,
  onHopPrimary,
  onHopSecondary,
  onHardwayPrimary,
  onHardwaySecondary,
  onRoll,
  maxOddsDisplay,
}: CraplessTableFeltProps) {
  const topPlaces = POINT_NUMBERS.filter((n) => n <= 6);
  const bottomPlaces = POINT_NUMBERS.filter((n) => n >= 8);
  const hornOnLayout = bets.hornUnit * 4;

  return (
    <div className="yi-felt">
      <div className="yi-felt-propRow" aria-label="One-roll propositions">
        <button
          type="button"
          className="yi-felt-field"
          data-testid="felt-field"
          onClick={onFieldPrimary}
          onContextMenu={(e) => {
            preventCtx(e);
            onFieldSecondary();
          }}
        >
          <span className="yi-felt-prop-label">Field</span>
          <span className="yi-felt-prop-meta">2·3·4·9·10·11·12</span>
          <span className="yi-felt-prop-amt">{bets.field > 0 ? bets.field : "—"}</span>
          <span className="yi-felt-chipHint">+{chip}</span>
        </button>
        <button
          type="button"
          className="yi-felt-horn"
          data-testid="felt-horn"
          onClick={onHornPrimary}
          onContextMenu={(e) => {
            preventCtx(e);
            onHornSecondary();
          }}
        >
          <span className="yi-felt-prop-label">Horn</span>
          <span className="yi-felt-prop-meta">2·3·11·12 · {hornOnLayout > 0 ? `${hornOnLayout} out` : "—"}</span>
          <span className="yi-felt-prop-amt">{bets.hornUnit > 0 ? `${bets.hornUnit} ea` : "—"}</span>
          <span className="yi-felt-chipHint">+{chip} each leg (×4)</span>
        </button>
      </div>

      <div className="yi-felt-placeArc" aria-label="Place bets">
        <div className="yi-felt-placeRow">
          {topPlaces.map((pk) => (
            <PlaceCell
              key={pk}
              pk={pk}
              amount={bets.place[pk] ?? 0}
              isPoint={table.phase === "point" && table.point === pk}
              disabled={table.phase !== "point"}
              chip={chip}
              onPrimary={() => onPlacePrimary(pk)}
              onSecondary={() => onPlaceSecondary(pk)}
            />
          ))}
        </div>
        <div className="yi-felt-no7" aria-hidden="true">
          <span className="yi-felt-no7-inner">7 · The Bust</span>
        </div>
        <div className="yi-felt-placeRow">
          {bottomPlaces.map((pk) => (
            <PlaceCell
              key={pk}
              pk={pk}
              amount={bets.place[pk] ?? 0}
              isPoint={table.phase === "point" && table.point === pk}
              disabled={table.phase !== "point"}
              chip={chip}
              onPrimary={() => onPlacePrimary(pk)}
              onSecondary={() => onPlaceSecondary(pk)}
            />
          ))}
        </div>
      </div>

      <div className="yi-felt-diceDock">
        <DicePair3D d1={lastD1} d2={lastD2} rolling={diceRolling} reduceMotion={reduceMotion} />
        <button type="button" className="yi-felt-rollBtn" disabled={!canRoll || diceRolling} onClick={onRoll}>
          Roll
        </button>
      </div>

      <div className="yi-felt-oddsPassStack">
        <button
          type="button"
          className={`yi-felt-odds ${table.phase !== "point" ? "yi-felt-odds--off" : ""}`}
          data-testid="felt-odds"
          disabled={table.phase !== "point"}
          onClick={onOddsPrimary}
          onContextMenu={(e) => {
            preventCtx(e);
            onOddsSecondary();
          }}
        >
          <span className="yi-felt-odds-label">Free odds</span>
          <span className="yi-felt-odds-meta">
            {bets.freeOdds > 0 ? `${bets.freeOdds}` : "—"} / cap {maxOddsDisplay}
          </span>
          <span className="yi-felt-chipHint">+{chip} · right-click −{chip}</span>
        </button>

        <button
          type="button"
          className={`yi-felt-pass ${passLocked ? "yi-felt-pass--locked" : ""}`}
          data-testid="felt-pass"
          disabled={passLocked}
          onClick={onPassPrimary}
          onContextMenu={(e) => {
            preventCtx(e);
            onPassSecondary();
          }}
        >
          <span className="yi-felt-pass-label">Pass line</span>
          <span className="yi-felt-pass-amount">{bets.passLine > 0 ? bets.passLine : "—"}</span>
          <span className="yi-felt-chipHint">+{chip} · right-click −{chip}</span>
          {passLocked ? <span className="yi-felt-pass-lock">Locked — point in play</span> : null}
        </button>
      </div>

      <details className="yi-felt-oneRoll">
        <summary>More one-roll bets</summary>
        <div className="yi-felt-hopBlock" aria-label="Hopping bets">
          <Text className="yi-felt-sectionLabel" size="xs" tt="uppercase" c="dimmed" fw={600}>
            Hop
          </Text>
          <div className="yi-felt-hopGrid">
            {ALL_HOP_KEYS.map((key) => (
              <button
                type="button"
                key={key}
                className="yi-felt-hop"
                data-testid={`felt-hop-${key}`}
                onClick={() => onHopPrimary(key)}
                onContextMenu={(e) => {
                  preventCtx(e);
                  onHopSecondary(key);
                }}
              >
                <span className="yi-felt-hop-key">{key}</span>
                <span className="yi-felt-hop-amt">{(bets.hops[key] ?? 0) > 0 ? bets.hops[key] : ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="yi-felt-hardBlock" aria-label="Hardways">
          <Text className="yi-felt-sectionLabel" size="xs" tt="uppercase" c="dimmed" fw={600}>
            Hardways
          </Text>
          <div className="yi-felt-hardRow">
            {HARDWAY_NUMBERS.map((hw) => (
              <button
                type="button"
                key={hw}
                className="yi-felt-hard"
                data-testid={`felt-hard-${hw}`}
                onClick={() => onHardwayPrimary(hw)}
                onContextMenu={(e) => {
                  preventCtx(e);
                  onHardwaySecondary(hw);
                }}
              >
                <span className="yi-felt-hard-label">Hard {hw}</span>
                <span className="yi-felt-hard-amt">{(bets.hardways[hw] ?? 0) > 0 ? bets.hardways[hw] : ""}</span>
              </button>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

function PlaceCell({
  pk,
  amount,
  isPoint,
  disabled,
  chip,
  onPrimary,
  onSecondary,
}: {
  pk: PointNumber;
  amount: number;
  isPoint: boolean;
  disabled: boolean;
  chip: number;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <button
      type="button"
      className={`yi-felt-place ${isPoint ? "yi-felt-place--point" : ""} ${disabled ? "yi-felt-place--off" : ""}`}
      data-testid={`felt-place-${pk}`}
      disabled={disabled}
      onClick={onPrimary}
      onContextMenu={(e) => {
        preventCtx(e);
        onSecondary();
      }}
    >
      <span className="yi-felt-place-num">{pk}</span>
      <span className="yi-felt-place-name">{sevenYearItchRackets[pk].name}</span>
      <span className="yi-felt-place-amt">
        {amount > 0 ? `${placeBetTotalReturn(pk, amount).toLocaleString()} return` : `${placeBetTotalReturn(pk, 5)} on 5`}
      </span>
      {!disabled ? <span className="yi-felt-chipHintSm">+{chip}</span> : null}
    </button>
  );
}
