import { createTheme, type MantineColorsTuple, type MantineThemeOverride } from "@mantine/core";
import { clubTokens } from "./clubTokens";

const walnut: MantineColorsTuple = [
  "#f6f1eb",
  "#e9dfd4",
  "#d9c7b8",
  "#b89a8a",
  "#8f6a5e",
  "#5c3f36",
  "#3d2a24",
  "#261814",
  "#1a100d",
  "#140c0a",
];

const brass: MantineColorsTuple = [
  "#faf6ef",
  "#f0e6cf",
  "#e6d4af",
  "#d6b87a",
  "#c79e57",
  "#a67f3d",
  "#85632f",
  "#634824",
  "#4a3319",
  "#362410",
];

export function buildClubTheme(override?: MantineThemeOverride) {
  return createTheme({
    primaryColor: "brass",
    fontFamily: "Noto Sans, system-ui, -apple-system, Segoe UI, sans-serif",
    headings: {
      fontFamily: "Playfair Display, Georgia, Times New Roman, serif",
      fontWeight: "600",
      sizes: {
        h1: { fontSize: "2.75rem", lineHeight: "1.05" },
        h2: { fontSize: "2rem", lineHeight: "1.1" },
        h3: { fontSize: "1.35rem", lineHeight: "1.2" },
      },
    },
    defaultRadius: "md",
    colors: {
      walnut,
      brass,
    },
    other: {
      club: clubTokens,
    },
    components: {
      Button: {
        defaultProps: { variant: "light", color: "brass" },
      },
      Modal: {
        styles: {
          content: {
            backgroundColor: clubTokens.surface.walnutHi,
            border: `1px solid ${clubTokens.surface.brassStroke}`,
          },
          header: { backgroundColor: "transparent" },
        },
      },
      Drawer: {
        styles: {
          content: {
            backgroundColor: clubTokens.surface.walnutHi,
            borderLeft: `1px solid ${clubTokens.surface.brassStroke}`,
          },
          header: { backgroundColor: "transparent" },
        },
      },
    },
    ...override,
  });
}
