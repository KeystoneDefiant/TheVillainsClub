import { Box } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

export function MenuHazeBackground() {
  return (
    <Box
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor: clubTokens.surface.deepWalnut,
        backgroundImage: `
          radial-gradient(1200px 700px at 20% 10%, rgba(209, 97, 102, 0.18), transparent 55%),
          radial-gradient(900px 600px at 85% 25%, rgba(214, 184, 122, 0.12), transparent 50%),
          radial-gradient(800px 500px at 50% 100%, rgba(50, 34, 28, 0.9), transparent 60%)
        `,
        filter: "saturate(1.05)",
      }}
    />
  );
}
