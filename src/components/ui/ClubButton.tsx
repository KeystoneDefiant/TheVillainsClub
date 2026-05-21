import { Button } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

/** Mantine polymorphic `Button` props; widened so TS accepts `component`, `onClick`, etc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClubButtonProps = Record<string, any>;

export function ClubButton(props: ClubButtonProps) {
  const { variant = "filled", styles, style, ...rest } = props;

  const getVariantStyles = () => {
    switch (variant) {
      case "filled":
        return {
          background: "radial-gradient(circle at center, #6a0b12 0%, #2e0508 55%, #100102 100%)",
          color: "#ffffff",
          borderTop: "2px solid rgba(199, 158, 87, 0.85)",
          borderBottom: "2px solid rgba(199, 158, 87, 0.85)",
          borderLeft: "none",
          borderRight: "none",
          fontWeight: 700,
          textShadow: "1px 1px 3px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.7)",
          boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.15), inset 0 0 0 1px rgba(199, 158, 87, 0.2), inset 0 0 6px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6)",
        };
      case "light":
        return {
          background: "radial-gradient(circle at center, #2d2621 0%, #171210 70%, #0a0807 100%)",
          color: "rgba(240, 230, 210, 0.9)",
          borderTop: "2px solid rgba(199, 158, 87, 0.85)",
          borderBottom: "2px solid rgba(199, 158, 87, 0.85)",
          borderLeft: "none",
          borderRight: "none",
          fontWeight: 700,
          textShadow: "1px 1px 2px rgba(0, 0, 0, 0.95), 0 0 3px rgba(0, 0, 0, 0.7)",
          boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(199, 158, 87, 0.15), inset 0 0 6px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6)",
        };
      case "outline":
        return {
          background: "radial-gradient(circle at center, #1b1e20 0%, #0d0f10 70%, #050607 100%)",
          color: "rgba(200, 205, 210, 0.95)",
          borderTop: "2px solid rgba(140, 145, 150, 0.7)",
          borderBottom: "2px solid rgba(140, 145, 150, 0.7)",
          borderLeft: "none",
          borderRight: "none",
          fontWeight: 700,
          textShadow: "1px 1px 2px rgba(0, 0, 0, 0.95)",
          boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(140, 145, 150, 0.15), inset 0 0 6px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.4)",
        };
      case "subtle":
        return {
          background: "transparent",
          color: clubTokens.text.secondary,
          border: "1px solid transparent",
          boxShadow: "none",
          fontWeight: 600,
          "&:hover": {
            background: "rgba(255, 255, 255, 0.05)",
            color: clubTokens.text.primary,
          },
        };
      default:
        return {};
    }
  };

  return (
    <Button
      variant={variant === "filled" ? "filled" : variant === "light" ? "light" : variant === "outline" ? "outline" : "subtle"}
      color="brass"
      radius="xs"
      style={style}
      styles={{
        root: {
          position: "relative",
          overflow: "visible",
          borderRadius: "3px",
          fontFamily: '"Outfit", "Inter", "Noto Sans", sans-serif',
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          padding: "0 28px",
          margin: "0 8px",
          transition: "transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.15s ease, filter 0.15s ease, background 0.15s ease, border-color 0.15s ease",
          ...getVariantStyles(),
          "&:hover:not([data-loading]):not(:disabled):not([data-disabled])": {
            transform: "translateY(-2px)",
            boxShadow: variant === "subtle"
              ? "none"
              : variant === "filled"
                ? "inset 0 1px 2px rgba(255, 255, 255, 0.2), inset 0 0 6px rgba(0, 0, 0, 0.8), 0 8px 16px rgba(0,0,0,0.55), 0 0 12px rgba(230, 20, 30, 0.7)"
                : variant === "light"
                  ? "inset 0 1px 2px rgba(255, 255, 255, 0.12), inset 0 0 6px rgba(0, 0, 0, 0.8), 0 8px 16px rgba(0,0,0,0.55), 0 0 12px rgba(220, 120, 30, 0.5)"
                  : "inset 0 1px 2px rgba(255, 255, 255, 0.12), inset 0 0 6px rgba(0, 0, 0, 0.8), 0 6px 12px rgba(0,0,0,0.45), 0 0 10px rgba(140, 145, 150, 0.45)",
            filter: "brightness(1.15)",
            background: variant === "filled"
              ? "radial-gradient(circle at center, #a8101d 0%, #4a050a 60%, #150102 100%) !important"
              : variant === "light"
                ? "radial-gradient(circle at center, #42352b 0%, #1c1511 65%, #0a0807 100%) !important"
                : variant === "outline"
                  ? "radial-gradient(circle at center, #2b3034 0%, #131618 70%, #070809 100%) !important"
                  : undefined,
            borderTopColor: variant === "filled" || variant === "light"
              ? "rgba(255, 235, 180, 1) !important"
              : variant === "outline"
                ? "rgba(255, 255, 255, 0.9) !important"
                : undefined,
            borderBottomColor: variant === "filled" || variant === "light"
              ? "rgba(255, 235, 180, 1) !important"
              : variant === "outline"
                ? "rgba(255, 255, 255, 0.9) !important"
                : undefined,
          },
          "&:active:not([data-loading]):not(:disabled):not([data-disabled])": {
            transform: "translateY(1px)",
            boxShadow: variant === "subtle"
              ? "none"
              : "inset 0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0,0,0,0.4)",
            filter: "brightness(0.92)",
          },
          "&:disabled, &[data-disabled]": {
            background: "radial-gradient(circle at center, #1a1715 0%, #0f0d0c 75%, #050404 100%) !important",
            color: "rgba(100, 95, 90, 0.55) !important",
            borderTop: "2px solid rgba(60, 55, 50, 0.6) !important",
            borderBottom: "2px solid rgba(60, 55, 50, 0.6) !important",
            borderLeft: "none !important",
            borderRight: "none !important",
            cursor: "not-allowed !important",
            transform: "none !important",
            boxShadow: "none !important",
            filter: "grayscale(1) brightness(0.55) !important",
            textShadow: "none !important",
          },
          "&::before": variant === "subtle" ? undefined : {
            content: '""',
            position: "absolute",
            left: "-8px",
            top: "0",
            bottom: "0",
            width: "16px",
            zIndex: 5,
            pointerEvents: "none",
            background: variant === "outline"
              ? "radial-gradient(circle at center, #0f1011 0%, #060607 40%, #8c9196 85%, #cfd2d6 100%)"
              : variant === "light"
                ? "radial-gradient(circle at center, #14100e 0%, #080605 40%, #8b6508 85%, #cf9e52 100%)"
                : "radial-gradient(circle at center, #2e0508 0%, #150204 40%, #8b6508 85%, #cf9e52 100%)", // filled
            clipPath: "polygon(0% 50%, 60% 0%, 100% 0%, 100% 100%, 60% 100%)",
            transition: "all 0.15s ease",
          },
          "&::after": variant === "subtle" ? undefined : {
            content: '""',
            position: "absolute",
            right: "-8px",
            top: "0",
            bottom: "0",
            width: "16px",
            zIndex: 5,
            pointerEvents: "none",
            background: variant === "outline"
              ? "radial-gradient(circle at center, #0f1011 0%, #060607 40%, #8c9196 85%, #cfd2d6 100%)"
              : variant === "light"
                ? "radial-gradient(circle at center, #14100e 0%, #080605 40%, #8b6508 85%, #cf9e52 100%)"
                : "radial-gradient(circle at center, #2e0508 0%, #150204 40%, #8b6508 85%, #cf9e52 100%)", // filled
            clipPath: "polygon(100% 50%, 40% 0%, 0% 0%, 0% 100%, 40% 100%)",
            transition: "all 0.15s ease",
          },
          "&:disabled::before, &[data-disabled]::before": {
            background: "radial-gradient(circle at center, #101010 0%, #080808 40%, #444444 85%, #666666 100%) !important",
            filter: "grayscale(1) brightness(0.4) !important",
          },
          "&:disabled::after, &[data-disabled]::after": {
            background: "radial-gradient(circle at center, #101010 0%, #080808 40%, #444444 85%, #666666 100%) !important",
            filter: "grayscale(1) brightness(0.4) !important",
          },
          "&:hover:not([data-loading]):not(:disabled):not([data-disabled])::before": {
            background: variant === "outline"
              ? "radial-gradient(circle at center, #131618 0%, #0a0b0c 40%, #b3b8bd 85%, #ffffff 100%)"
              : variant === "light"
                ? "radial-gradient(circle at center, #221510 0%, #0a0807 40%, #a87e22 85%, #ffd700 100%)"
                : "radial-gradient(circle at center, #540910 0%, #1d0305 40%, #a87e22 85%, #ffd700 100%)",
          },
          "&:hover:not([data-loading]):not(:disabled):not([data-disabled])::after": {
            background: variant === "outline"
              ? "radial-gradient(circle at center, #131618 0%, #0a0b0c 40%, #b3b8bd 85%, #ffffff 100%)"
              : variant === "light"
                ? "radial-gradient(circle at center, #221510 0%, #0a0807 40%, #a87e22 85%, #ffd700 100%)"
                : "radial-gradient(circle at center, #540910 0%, #1d0305 40%, #a87e22 85%, #ffd700 100%)",
          },
        },
        ...styles,
      }}
      {...rest}
    />
  );
}

