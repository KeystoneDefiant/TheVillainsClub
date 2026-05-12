import { Box } from "@mantine/core";
import { VC_LOGO_INTRO_VIEWBOX, vcLogoGreyPaths, vcLogoRedPaths } from "@/components/intro/vcLogoIntroPaths";

const RED_FILL = "#c0272d";
const GREY_FILL = "#808080";

type VcLogoBarMarkProps = {
  /** Display width in px; height follows viewBox aspect. */
  width?: number;
};

/** Static Villains Club mark for headers (no intro animation). */
export function VcLogoBarMark({ width = 120 }: VcLogoBarMarkProps) {
  const aspect = 165.6 / 241.3;
  const displayH = Math.round(width * aspect);

  return (
    <Box
      component="div"
      aria-hidden
      m={0}
      mx="auto"
      style={{ lineHeight: 0, maxWidth: "100%" }}
    >
      <svg viewBox={VC_LOGO_INTRO_VIEWBOX} width={width} height={displayH} focusable="false">
        {vcLogoRedPaths.map((p) => (
          <path key={p.id} d={p.d} fill={RED_FILL} />
        ))}
        {vcLogoGreyPaths.map((p) => (
          <path key={p.id} d={p.d} fill={GREY_FILL} />
        ))}
      </svg>
    </Box>
  );
}
