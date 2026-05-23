import React from "react";
import { Title, TitleProps } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

export type ClubHeadingProps = TitleProps &
  Omit<React.ComponentPropsWithoutRef<"h1">, keyof TitleProps>;

export function ClubHeading(props: ClubHeadingProps) {
  const { c, style, ...rest } = props;
  return (
    <Title
      c={c ?? clubTokens.text.primary}
      style={{
        fontFamily: "Cinzel, Georgia, serif",
        letterSpacing: "0.02em",
        ...style,
      }}
      {...rest}
    />
  );
}
