import { Paper } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClubPanelProps = Record<string, any>;

export function ClubPanel(props: ClubPanelProps) {
  const { styles, style, ...rest } = props;
  const rootUser = typeof styles === "object" && styles && "root" in styles ? styles.root : undefined;
  return (
    <Paper
      radius="lg"
      p="lg"
      styles={{
        root: {
          backgroundColor: clubTokens.surface.panel,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          backdropFilter: "blur(8px)",
          ...(typeof rootUser === "object" && rootUser ? rootUser : {}),
        },
      }}
      style={style}
      {...rest}
    />
  );
}
