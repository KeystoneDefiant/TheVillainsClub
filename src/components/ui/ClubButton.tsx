import { Button } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

/** Mantine polymorphic `Button` props; widened so TS accepts `component`, `onClick`, etc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClubButtonProps = Record<string, any>;

export function ClubButton(props: ClubButtonProps) {
  const { variant = "filled", styles, ...rest } = props;
  return (
    <Button
      variant={variant}
      color="brass"
      radius="md"
      styles={{
        root: {
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        },
        ...styles,
      }}
      {...rest}
    />
  );
}
