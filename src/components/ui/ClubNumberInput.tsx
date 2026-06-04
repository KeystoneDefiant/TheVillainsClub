import React from "react";
import { NumberInput, NumberInputProps } from "@mantine/core";
import "./ClubForm.css";

export interface ClubNumberInputProps extends NumberInputProps {
  fancy?: boolean;
  variant?: "filled" | "light" | "outline" | "subtle" | "sheen";
}

export const ClubNumberInput = React.forwardRef<HTMLInputElement, ClubNumberInputProps>(
  ({ fancy = false, variant = "light", label, description, className, style, disabled, ...rest }, ref) => {
    const isFancy = !!fancy;
    const isSubtle = variant === "subtle";

    return (
      <div className={`club-field-root ${disabled ? "club-field-disabled" : ""}`} style={style as React.CSSProperties}>
        {label && <label className="club-field-label">{label}</label>}
        {description && <div className="club-field-desc">{description}</div>}
        <div className={`club-field-input-container ${isFancy ? "club-field-fancy" : ""} club-field-${variant}`}>
          {isFancy && !isSubtle && <span className="club-field-chevron club-field-chevron-left" />}
          <NumberInput
            ref={ref}
            disabled={disabled}
            label={null}
            description={null}
            className={`club-input club-input-${variant} ${isFancy ? "club-input-fancy" : ""} ${className || ""}`}
            {...rest}
          />
          {isFancy && !isSubtle && <span className="club-field-chevron club-field-chevron-right" />}
        </div>
      </div>
    );
  }
);

ClubNumberInput.displayName = "ClubNumberInput";
