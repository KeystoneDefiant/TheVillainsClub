import { Button } from "@mantine/core";
import "./ClubButton.css";

/** Mantine polymorphic `Button` props; widened so TS accepts `component`, `onClick`, etc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClubButtonProps = {
  fancy?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "filled" | "light" | "outline" | "subtle";
  disabled?: boolean;
} & Record<string, any>;

export function ClubButton(props: ClubButtonProps) {
  const { variant = "filled", fancy, size, styles, style, className, disabled, onClick, children, ...rest } = props;

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

  const handleClick = (e: React.MouseEvent) => {
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
      variant={variant === "filled" ? "filled" : variant === "light" ? "light" : variant === "outline" ? "outline" : "subtle"}
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



