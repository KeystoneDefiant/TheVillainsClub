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
          background: clubTokens.gradients.brass,
          color: clubTokens.surface.deepWalnut,
          border: `1px solid ${clubTokens.text.goldHighlight}`,
          fontWeight: 700,
          textShadow: "0 1px 0px rgba(255,255,255,0.2)",
        };
      case "light":
        return {
          background: "rgba(38, 24, 20, 0.75)",
          color: clubTokens.text.brass,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          "&:hover": {
            background: "rgba(51, 33, 28, 0.95)",
            borderColor: clubTokens.text.goldHighlight,
          },
        };
      case "outline":
        return {
          background: "transparent",
          color: clubTokens.text.brass,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          "&:hover": {
            background: "rgba(199, 158, 87, 0.1)",
            borderColor: clubTokens.text.goldHighlight,
          },
        };
      case "subtle":
        return {
          background: "transparent",
          color: clubTokens.text.secondary,
          border: "1px solid transparent",
          boxShadow: "none",
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
      radius="md"
      style={style}
      styles={{
        root: {
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          transition: "transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.15s ease, filter 0.15s ease, background 0.15s ease, border-color 0.15s ease",
          ...getVariantStyles(),
          "&:hover:not([data-loading]):not(:disabled)": {
            transform: "translateY(-2px)",
            boxShadow: `0 12px 30px rgba(0,0,0,0.5), ${clubTokens.glows.gold}`,
            filter: "brightness(1.08)",
          },
          "&:active:not([data-loading]):not(:disabled)": {
            transform: "translateY(1px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          },
        },
        ...styles,
      }}
      {...rest}
    />
  );
}

