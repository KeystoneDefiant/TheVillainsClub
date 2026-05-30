import React from "react";
import { Button, ButtonProps } from "@mantine/core";
import "./ClubButton.css";

export type ClubButtonProps<C extends React.ElementType = "button"> = ButtonProps & {
  fancy?: boolean;
  component?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonProps | "component">;

export function ClubButton<C extends React.ElementType = "button">(props: ClubButtonProps<C>) {
  const { variant = "filled", fancy, size, styles, style, className, disabled, onClick, children, component, ...rest } = props;

  const isFancy = !!fancy;

  const classNamesList = [
    "club-btn",
    `club-btn-${variant}`,
    isFancy ? "club-btn-fancy" : "",
    isFancy ? `club-btn-fancy-${size || "md"}` : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={component as any}
      variant={variant === "filled" || variant === "sheen" ? "filled" : variant === "light" ? "light" : variant === "outline" ? "outline" : "subtle"}
      color="brass"
      radius={isFancy ? undefined : "xs"}
      size={isFancy ? undefined : size}
      style={style}
      className={classNamesList}
      styles={styles}
      disabled={disabled}
      data-disabled={disabled || undefined}
      onClick={handleClick}
      {...rest}
    >
      {variant !== "subtle" && <span className="club-btn-chevron club-btn-chevron-left" />}
      {children}
      {variant !== "subtle" && <span className="club-btn-chevron club-btn-chevron-right" />}
    </Button>
  );
}



