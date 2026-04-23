import { Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClubHeadingProps = Record<string, any>;

export function ClubHeading(props: ClubHeadingProps) {
  const { c, style, ...rest } = props;
  return (
    <Title
      c={c ?? clubTokens.text.primary}
      style={{
        fontFamily: "Playfair Display, Georgia, serif",
        letterSpacing: "0.02em",
        ...style,
      }}
      {...rest}
    />
  );
}
