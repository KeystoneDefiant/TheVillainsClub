import React, { useState, useEffect } from "react";
import { Text } from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import type { CraplessTableState, TableBets } from "../engine/craplessEngine";
import {
  ALL_HOP_KEYS,
  HARDWAY_NUMBERS,
  POINT_NUMBERS,
  placeBetScaledReturn,
  sevenYearItchRackets,
  type HardwayNumber,
  type HopKey,
  type PointNumber,
  type SevenYearItchGameModeConfig,
} from "@/config/minigames/sevenYearItchRules";
import { DicePair3D } from "./DicePair3D";

export type CraplessTableFeltProps = {
  easyMode: boolean;
  onEasyModeToggle: (val: boolean) => void;
  tableRules: SevenYearItchGameModeConfig;
  table: CraplessTableState;
  bets: TableBets;
  lastD1: number;
  lastD2: number;
  diceRolling: boolean;
  reduceMotion: boolean;
  chip: number;
  /** Come-out with no point: only pass + roll. */
  passOnlyLayout: boolean;
  showFieldAndHorn: boolean;
  placePayoutScale: number;
  activeFavorTitle: string | null;
  canRoll: boolean;
  passLocked: boolean;
  canDivest: boolean;
  onDivest: () => void;
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
  /** Hide in-table dice during overlay roll animation. */
  hideInlineDice: boolean;
  maxBet: number;
  recentPlacePayout: { pk: PointNumber; amount: number; triggerKey: number } | null;
  diceContainerRef?: React.RefObject<HTMLDivElement | null>;
};

function preventCtx(e: React.MouseEvent) {
  e.preventDefault();
}

export function CraplessTableFelt({
  easyMode,
  onEasyModeToggle,
  tableRules,
  table,
  bets,
  lastD1,
  lastD2,
  diceRolling,
  reduceMotion,
  chip,
  passOnlyLayout,
  showFieldAndHorn,
  placePayoutScale,
  activeFavorTitle,
  canRoll,
  passLocked,
  canDivest,
  onDivest,
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
  hideInlineDice,
  maxBet,
  recentPlacePayout,
  diceContainerRef,
}: CraplessTableFeltProps) {
  const topPlaces = POINT_NUMBERS.filter((n) => n <= 6);
  const bottomPlaces = POINT_NUMBERS.filter((n) => n >= 8);
  const hornOnLayout = bets.hornUnit * 4;
  const showGrid = !passOnlyLayout;

  const easyPairs = topPlaces.map((left) => ({
    left,
    right: (14 - left) as PointNumber,
  }));

  return (
    <div className="yi-felt">
      {activeFavorTitle ? (
        <div className="yi-felt-favorBanner" data-testid="felt-active-favor">
          <span className="yi-felt-favorBanner-label">Active favor</span>
          <span className="yi-felt-favorBanner-title">{activeFavorTitle}</span>
        </div>
      ) : null}

      <div className={`yi-felt-unfurl-container ${showGrid ? "unfurled" : ""}`}>
        <div className="yi-felt-unfurl-content">
          {placePayoutScale < 1 ? (
            <Text size="xs" c="orange" mb={6} data-testid="felt-divest-skim">
              Post-divest skim: place hits pay half profit until this hand ends.
            </Text>
          ) : null}

          <div className="yi-felt-placeArc" aria-label="Place bets">
            {easyMode ? (
              <div className="yi-felt-placeRow">
                {easyPairs.map(({ left, right }) => (
                  <EasyPlaceCell
                    key={left}
                    left={left}
                    right={right}
                    amount={bets.place[left] ?? 0}
                    isPoint={table.phase === "point" && (table.point === left || table.point === right)}
                    leftIsPoint={table.phase === "point" && table.point === left}
                    rightIsPoint={table.phase === "point" && table.point === right}
                    disabled={table.phase !== "point"}
                    chip={chip}
                    placePayoutScale={placePayoutScale}
                    onPrimary={() => onPlacePrimary(left)}
                    onSecondary={() => onPlaceSecondary(left)}
                    maxBet={maxBet}
                    recentPlacePayout={recentPlacePayout}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="yi-felt-placeRow">
                  {topPlaces.map((pk) => (
                    <PlaceCell
                      key={pk}
                      pk={pk}
                      amount={bets.place[pk] ?? 0}
                      isPoint={table.phase === "point" && table.point === pk}
                      disabled={table.phase !== "point"}
                      chip={chip}
                      placePayoutScale={placePayoutScale}
                      onPrimary={() => onPlacePrimary(pk)}
                      onSecondary={() => onPlaceSecondary(pk)}
                      maxBet={maxBet}
                      recentPlacePayout={recentPlacePayout}
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
                      placePayoutScale={placePayoutScale}
                      onPrimary={() => onPlacePrimary(pk)}
                      onSecondary={() => onPlaceSecondary(pk)}
                      maxBet={maxBet}
                      recentPlacePayout={recentPlacePayout}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <details className="yi-felt-oneRoll">
            <summary>One-roll bets</summary>
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

            {showFieldAndHorn ? (
              <div className="yi-felt-propRow yi-felt-propRow--afterOneRoll" aria-label="Field and horn">
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
            ) : null}
          </details>
        </div>
      </div>

      <div className="yi-felt-oddsPassStack">
        <div className="yi-felt-left-stack">
          <button
            type="button"
            className={`yi-felt-odds ${table.phase !== "point" ? "yi-felt-odds--off" : ""} ${showGrid ? "active" : "inactive"}`}
            data-testid="felt-odds"
            disabled={table.phase !== "point"}
            onClick={onOddsPrimary}
            onContextMenu={(e) => {
              preventCtx(e);
              onOddsSecondary();
            }}
          >
            <span className="yi-felt-odds-label">Legitimate Business Investment</span>
            <span className="yi-felt-odds-meta">
              {bets.freeOdds > 0 ? `${bets.freeOdds}` : "—"} / cap {maxOddsDisplay}
            </span>
            <span className="yi-felt-chipHint">Invest more money into the legitimate business. Pays even money if you roll {table.point}</span>
          </button>

          <div className={`yi-felt-come-out-instruction ${!showGrid ? "active" : "inactive"}`} style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px dashed rgba(255, 255, 255, 0.2)",
            background: "rgba(0, 0, 0, 0.4)",
            textAlign: "center",
            height: "100%",
            boxSizing: "border-box"
          }}>
            <Text size="xs" style={{ color: "rgba(232, 223, 212, 0.8)", fontWeight: 500, lineHeight: 1.3 }}>
              Place your initial investment and then roll the dice.
            </Text>
          </div>
        </div>

        <button
          type="button"
          className={`yi-felt-pass ${passLocked ? "yi-felt-pass--locked" : ""} ${table.phase === "comeOut" && bets.passLine === 0 ? "yi-felt-pass--pulse-glow" : ""}`}
          data-testid="felt-pass"
          disabled={passLocked}
          onClick={onPassPrimary}
          onContextMenu={(e) => {
            preventCtx(e);
            onPassSecondary();
          }}
        >
          <span className="yi-felt-pass-label">Seed Investment</span>
          <span className="yi-felt-pass-amount">{bets.passLine > 0 ? bets.passLine : "—"}</span>
          <span className="yi-felt-chipHint">+{chip} · right-click −{chip}</span>
          {passLocked ? <span className="yi-felt-pass-lock">Locked — point in play</span> : null}
        </button>
      </div>

      {showGrid ? (
        <details className="yi-felt-oneRoll">
          <summary>One-roll bets</summary>
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

          {showFieldAndHorn ? (
            <div className="yi-felt-propRow yi-felt-propRow--afterOneRoll" aria-label="Field and horn">
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
          ) : null}
        </details>
      ) : null}

      <div className="yi-felt-controls">
        <div className="yi-felt-divest-container">
          <div className="yi-felt-left-stack" style={{ width: "auto" }}>
            <div className={showGrid ? "active" : "inactive"}>
              <ClubButton
                fancy
                variant="light"
                size="sm"
                data-testid="felt-divest"
                disabled={!canDivest}
                onClick={onDivest}
                title={canDivest ? "Return all bets except pass (once per hand)" : "Already divested this hand"}
              >
                Divest
              </ClubButton>
            </div>
            {tableRules.bettingMode === "switch" && (
              <div
                className={!showGrid ? "active" : "inactive"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "38px"
                }}
              >
                <label className="yi-easy-toggle-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    data-testid="felt-easy-toggle"
                    checked={easyMode}
                    onChange={(e) => onEasyModeToggle(e.target.checked)}
                    style={{ display: "none" }}
                  />
                  <div className="yi-easy-toggle-track" style={{
                    width: "38px",
                    height: "20px",
                    borderRadius: "10px",
                    background: easyMode ? "radial-gradient(circle at center, #6a0b12 0%, #2e0508 100%)" : "#140c0a",
                    border: "1px solid rgba(199, 158, 87, 0.4)",
                    position: "relative",
                    transition: "all 0.15s ease",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.85)",
                  }}>
                    <div className="yi-easy-toggle-thumb" style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: easyMode ? "radial-gradient(circle at center, #ffffff 0%, #e6c587 85%)" : "radial-gradient(circle at center, #faf6ef 0%, #c79e57 85%)",
                      border: "1.5px solid #faf6ef",
                      position: "absolute",
                      top: "2px",
                      left: easyMode ? "20px" : "2px",
                      transition: "all 0.15s ease",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
                    }} />
                  </div>
                  <span className="yi-easy-toggle-text" style={{
                    fontSize: "0.72rem",
                    fontFamily: "Cinzel, Montserrat, serif",
                    fontWeight: 700,
                    color: "#d6b87a",
                    userSelect: "none",
                  }}>
                    Easy Mode
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="yi-felt-dice-container" ref={diceContainerRef as React.RefObject<HTMLDivElement>}>
          {hideInlineDice ? (
            <div className="yi-felt-dicePlaceholder" aria-hidden />
          ) : (
            <DicePair3D d1={lastD1} d2={lastD2} rolling={diceRolling} reduceMotion={reduceMotion} />
          )}
        </div>

        <div className="yi-felt-roll-container">
          <ClubButton
            fancy
            variant="filled"
            disabled={!canRoll || diceRolling}
            onClick={onRoll}
          >
            Roll
          </ClubButton>
        </div>
      </div>
    </div>
  );
}

function PlaceCell({
  pk,
  amount,
  isPoint,
  disabled,
  chip,
  placePayoutScale,
  onPrimary,
  onSecondary,
  maxBet,
  recentPlacePayout,
}: {
  pk: PointNumber;
  amount: number;
  isPoint: boolean;
  disabled: boolean;
  chip: number;
  placePayoutScale: number;
  onPrimary: () => void;
  onSecondary: () => void;
  maxBet: number;
  recentPlacePayout: { pk: PointNumber; amount: number; triggerKey: number } | null;
}) {
  const [showPayoutAnim, setShowPayoutAnim] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);

  useEffect(() => {
    if (recentPlacePayout && recentPlacePayout.pk === pk) {
      setPayoutAmount(recentPlacePayout.amount);
      setShowPayoutAnim(true);
      const t = setTimeout(() => {
        setShowPayoutAnim(false);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [recentPlacePayout, pk]);

  const previewStake = amount > 0 ? amount : chip;
  const retPreview = placeBetScaledReturn(pk, previewStake, placePayoutScale);
  const progressPercent = maxBet > 0 ? Math.min(100, (amount / maxBet) * 100) : 0;

  return (
    <button
      type="button"
      className={`yi-felt-place ${isPoint ? "yi-felt-place--point" : ""} ${disabled ? "yi-felt-place--off" : ""} ${showPayoutAnim ? "yi-felt-place--payout-pulse" : ""}`}
      data-testid={`felt-place-${pk}`}
      disabled={disabled}
      onClick={onPrimary}
      onContextMenu={(e) => {
        e.preventDefault();
        onSecondary();
      }}
      style={{
        position: "relative",
        paddingTop: 18,
        paddingBottom: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Progress Bar */}
      {amount > 0 && maxBet > 0 && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progressPercent}%`,
          background: "linear-gradient(90deg, rgba(196, 120, 45, 0.22) 0%, rgba(196, 120, 45, 0.42) 90%, rgba(255, 215, 128, 0.08) 100%)",
          transition: "width 0.2s ease",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: 6,
        }} />
      )}

      {/* Number Circle - Overlapping top-center */}
      <div style={{
        position: "absolute",
        top: -12,
        left: "50%",
        transform: "translateX(-50%)",
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: `1.5px solid ${isPoint ? "#ffd780" : "var(--7yi-amber)"}`,
        background: "#0c0a09",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.6)",
        zIndex: 2,
      }}>
        <span style={{
          fontSize: "0.85rem",
          fontWeight: 900,
          color: isPoint ? "#ffd780" : "var(--7yi-amber)",
          lineHeight: 1,
          textAlign: "center",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {pk}
        </span>
      </div>

      <span className="yi-felt-place-name" style={{ fontSize: "0.72rem", fontWeight: 700, zIndex: 1 }}>
        {sevenYearItchRackets[pk].name}
      </span>
      <span className="yi-felt-place-amt" style={{ fontSize: "0.62rem", zIndex: 1 }}>
        {amount > 0 ? `+${(retPreview - amount).toLocaleString()} payout` : `+${(retPreview - chip).toLocaleString()} on ${chip}`}
      </span>

      {!disabled ? <span className="yi-felt-chipHintSm" style={{ marginTop: 2, zIndex: 1 }}>+{chip}</span> : null}

      {showPayoutAnim && (
        <span className="yi-felt-payout-float">
          +${payoutAmount.toLocaleString()}
        </span>
      )}
    </button>
  );
}

function EasyPlaceCell({
  left,
  right,
  amount,
  isPoint,
  leftIsPoint,
  rightIsPoint,
  disabled,
  chip,
  placePayoutScale,
  onPrimary,
  onSecondary,
  maxBet,
  recentPlacePayout,
}: {
  left: PointNumber;
  right: PointNumber;
  amount: number;
  isPoint: boolean;
  leftIsPoint: boolean;
  rightIsPoint: boolean;
  disabled: boolean;
  chip: number;
  placePayoutScale: number;
  onPrimary: () => void;
  onSecondary: () => void;
  maxBet: number;
  recentPlacePayout: { pk: PointNumber; amount: number; triggerKey: number } | null;
}) {
  const [showPayoutAnim, setShowPayoutAnim] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);

  useEffect(() => {
    if (recentPlacePayout && (recentPlacePayout.pk === left || recentPlacePayout.pk === right)) {
      setPayoutAmount(recentPlacePayout.amount);
      setShowPayoutAnim(true);
      const t = setTimeout(() => {
        setShowPayoutAnim(false);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [recentPlacePayout, left, right]);

  const previewStake = amount > 0 ? amount : chip;
  const retPreview = placeBetScaledReturn(left, previewStake, placePayoutScale);
  const progressPercent = maxBet > 0 ? Math.min(100, (amount / maxBet) * 100) : 0;

  return (
    <button
      type="button"
      className={`yi-felt-place yi-felt-place-easy ${isPoint ? "yi-felt-place--point" : ""} ${disabled ? "yi-felt-place--off" : ""} ${showPayoutAnim ? "yi-felt-place--payout-pulse" : ""}`}
      data-testid={`felt-place-easy-${left}-${right}`}
      disabled={disabled}
      onClick={onPrimary}
      onContextMenu={(e) => {
        e.preventDefault();
        onSecondary();
      }}
    >
      {/* Background Progress Bar */}
      {amount > 0 && maxBet > 0 && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progressPercent}%`,
          background: "linear-gradient(90deg, rgba(196, 120, 45, 0.22) 0%, rgba(196, 120, 45, 0.42) 90%, rgba(255, 215, 128, 0.08) 100%)",
          transition: "width 0.2s ease",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: 6,
        }} />
      )}

      {/* Left Number Circle */}
      <div className="yi-felt-place-easy-circle yi-felt-place-easy-circle--left" style={{
        border: `1.5px solid ${leftIsPoint ? "#ffd780" : "var(--7yi-amber)"}`,
      }}>
        <span style={{
          color: leftIsPoint ? "#ffd780" : "var(--7yi-amber)",
        }}>
          {left}
        </span>
      </div>

      {/* Right Number Circle */}
      <div className="yi-felt-place-easy-circle yi-felt-place-easy-circle--right" style={{
        border: `1.5px solid ${rightIsPoint ? "#ffd780" : "var(--7yi-amber)"}`,
      }}>
        <span style={{
          color: rightIsPoint ? "#ffd780" : "var(--7yi-amber)",
        }}>
          {right}
        </span>
      </div>

      {/* Stacked Scheme Names in the center */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, zIndex: 1, marginTop: 4, marginBottom: 4 }}>
        <span className="yi-felt-place-name" style={{ fontSize: "0.72rem", fontWeight: 700, lineHeight: 1.1 }}>
          {sevenYearItchRackets[left].name}
        </span>
        <span className="yi-felt-place-name" style={{ fontSize: "0.72rem", fontWeight: 700, lineHeight: 1.1 }}>
          {sevenYearItchRackets[right].name}
        </span>
      </div>

      {/* Payline */}
      <span className="yi-felt-place-amt" style={{ fontSize: "0.62rem", zIndex: 1 }}>
        {amount > 0 ? `+${(retPreview - amount).toLocaleString()} payout` : `+${(retPreview - chip).toLocaleString()} on ${chip}`}
      </span>

      {showPayoutAnim && (
        <span className="yi-felt-payout-float">
          +${payoutAmount.toLocaleString()}
        </span>
      )}
    </button>
  );
}
