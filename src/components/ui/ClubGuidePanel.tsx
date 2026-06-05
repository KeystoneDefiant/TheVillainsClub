import React from "react";
import { Group, Stack, Text, Title, Paper } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { ClubButton } from "./ClubButton";

export interface ClubGuidePanelProps {
  speakerIcon?: React.ReactNode;
  speakerName?: string;
  speakerRole?: string;
  progressText?: string;
  onClose?: () => void;
  closeLabel?: string;
  closeAriaLabel?: string;
  
  title?: string;
  dialogue?: string;
  details?: string | string[] | React.ReactNode;
  
  isFirst?: boolean;
  isLast?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  
  slideIndex: number;
  reduceMotion?: boolean;
  
  extraFooterAction?: React.ReactNode;
  headerBorderColor?: string;
  style?: React.CSSProperties;
}

export function ClubGuidePanel({
  speakerIcon,
  speakerName,
  speakerRole,
  progressText,
  onClose,
  closeLabel = "Close Guide",
  closeAriaLabel = "Close",
  title,
  dialogue,
  details,
  isFirst,
  isLast,
  onBack,
  onNext,
  nextLabel,

  extraFooterAction,
  headerBorderColor = `${clubTokens.surface.brassStroke}3b`,
  style,
}: ClubGuidePanelProps) {
  
  return (
    <Paper
      p="md"
      radius="md"
      style={{
        background: `linear-gradient(135deg, ${clubTokens.surface.walnutHi} 0%, ${clubTokens.surface.panel} 100%)`,
        border: `2px solid ${clubTokens.surface.brassStroke}`,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
    >
      {/* Header */}
      {(speakerName || speakerRole || speakerIcon || progressText || onClose) && (
        <>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              {speakerIcon && (
                <span
                  style={{
                    fontSize: "1.25rem",
                    lineHeight: 1,
                    filter: "drop-shadow(0 0 4px rgba(199,158,87,0.5))",
                  }}
                  aria-hidden
                >
                  {speakerIcon}
                </span>
              )}
              {(speakerName || speakerRole) && (
                <Stack gap={1}>
                  {speakerName && (
                    <Title
                      order={4}
                      fz="sm"
                      c={clubTokens.text.brass}
                      style={{ fontFamily: "Georgia, serif", fontWeight: 700, margin: 0 }}
                    >
                      {speakerName}
                    </Title>
                  )}
                  {speakerRole && (
                    <Text size="10px" c={clubTokens.text.muted} tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
                      {speakerRole}
                    </Text>
                  )}
                </Stack>
              )}
            </Group>
            <Group gap="sm" wrap="nowrap" align="center">
              {progressText && (
                <Text size="xs" c={clubTokens.text.muted} fw={700}>
                  {progressText}
                </Text>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="tips-close"
                  aria-label={closeAriaLabel}
                  style={{
                    color: clubTokens.text.muted,
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "0 4px",
                    transition: "color 0.15s ease",
                  }}
                >
                  ×
                </button>
              )}
            </Group>
          </Group>
          <hr style={{ margin: 0, border: 0, borderTop: `1px solid ${headerBorderColor}`, opacity: 0.35 }} />
        </>
      )}

      {/* Body Content */}
      <Stack gap={2} style={{ flex: 1 }}>
        {title && (
          <Title
            order={4}
            fz="xs"
            fw={700}
            c={clubTokens.text.brass}
            tt="uppercase"
            style={{ letterSpacing: "0.06em" }}
          >
            {title}
          </Title>
        )}
        
        {/* Render optional details */}
        {details && (
          <div style={{ marginTop: 4, marginBottom: 4 }}>
            {typeof details === "string" ? (
              <Text size="xs" c={clubTokens.text.secondary} lh={1.4}>
                {details}
              </Text>
            ) : Array.isArray(details) ? (
              <Stack gap="xs">
                {details.map((d, idx) => (
                  <Text key={idx} size="xs" c={clubTokens.text.secondary} lh={1.4}>
                    {d}
                  </Text>
                ))}
              </Stack>
            ) : (
              details
            )}
          </div>
        )}

        {dialogue && (
          <div
            className="tips-quote-block"
            style={{
              position: "relative",
              background: "rgba(0, 0, 0, 0.35)",
              borderLeft: `3px solid ${clubTokens.text.accent || "#d16166"}`,
              padding: "0.85rem 1rem",
              borderRadius: "0 6px 6px 0",
              boxShadow: "inset 0 0 8px rgba(0, 0, 0, 0.6)",
              marginTop: "0.25rem",
            }}
          >
            <Text
              size="sm"
              c={clubTokens.text.primary}
              style={{
                fontStyle: "italic",
                lineHeight: 1.45,
                minHeight: 48,
                whiteSpace: "pre-line",
              }}
            >
              “{dialogue}”
            </Text>
          </div>
        )}
      </Stack>

      {/* Footer Controls */}
      <hr style={{ margin: 0, border: 0, borderTop: `1px solid ${headerBorderColor}`, opacity: 0.35 }} />

      <Group justify="space-between" wrap="nowrap">
        {onClose ? (
          <ClubButton
            type="button"
            variant="subtle"
            size="xs"
            onClick={onClose}
            style={{ color: clubTokens.text.accent }}
          >
            {closeLabel}
          </ClubButton>
        ) : extraFooterAction ? (
          extraFooterAction
        ) : (
          <div />
        )}
        
        <Group gap="xs" wrap="nowrap">
          {onBack && (
            <ClubButton
              type="button"
              variant="outline"
              size="xs"
              onClick={onBack}
              disabled={isFirst}
            >
              Back
            </ClubButton>
          )}
          {onNext && (
            <ClubButton
              type="button"
              variant="filled"
              size="xs"
              onClick={onNext}
            >
              {nextLabel || (isLast ? "Done" : "Next")}
            </ClubButton>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
