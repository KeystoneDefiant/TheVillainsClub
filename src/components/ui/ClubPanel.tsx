import { Paper } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

export type ClubPanelProps = React.ComponentPropsWithoutRef<typeof Paper>;

export function ClubPanel(props: ClubPanelProps) {
  const { styles, style, children, ...rest } = props;
  const rootUser = typeof styles === "object" && styles && "root" in styles ? styles.root : undefined;
  return (
    <Paper
      radius="lg"
      p="lg"
      styles={{
        root: {
          backgroundColor: "transparent",
          backgroundImage: clubTokens.gradients.darkLeather,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          outline: `1px solid ${clubTokens.surface.brassStrokeGlow}`,
          outlineOffset: "-5px",
          position: "relative",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 16px 42px rgba(0, 0, 0, 0.6), inset 0 0 24px rgba(0, 0, 0, 0.6)",
          ...(typeof rootUser === "object" && rootUser ? rootUser : {}),
        },
      }}
      style={style}
      {...rest}
    >
      {/* Decorative corner brackets */}
      <div
        style={{
          position: "absolute",
          top: 7,
          left: 7,
          width: 12,
          height: 12,
          borderTop: `1.5px solid ${clubTokens.text.brass}`,
          borderLeft: `1.5px solid ${clubTokens.text.brass}`,
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 7,
          right: 7,
          width: 12,
          height: 12,
          borderTop: `1.5px solid ${clubTokens.text.brass}`,
          borderRight: `1.5px solid ${clubTokens.text.brass}`,
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 7,
          left: 7,
          width: 12,
          height: 12,
          borderBottom: `1.5px solid ${clubTokens.text.brass}`,
          borderLeft: `1.5px solid ${clubTokens.text.brass}`,
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 7,
          right: 7,
          width: 12,
          height: 12,
          borderBottom: `1.5px solid ${clubTokens.text.brass}`,
          borderRight: `1.5px solid ${clubTokens.text.brass}`,
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      {children}
    </Paper>
  );
}

