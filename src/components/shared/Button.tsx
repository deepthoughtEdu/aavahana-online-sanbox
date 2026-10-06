import React from "react";
import { cn } from "@/utils";
import { SpinnerIcon } from "@/components/shared/icons";
import type { Position } from "@/utils/shared/design.utils";

// ============================================================================
// BUTTON TYPES
// ============================================================================

export type ButtonColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

export type ButtonVariant =
  | "outline"
  | "dash"
  | "soft"
  | "ghost"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export type ButtonShape =
  | "square"   // 1:1 ratio
  | "circle";  // 1:1 ratio with rounded corners

export type ButtonModifier =
  | "wide"     // more horizontal padding
  | "block";   // full width

export interface TooltipOptions {
  text: string;
  position?: Position;
}

// ============================================================================
// BUTTON PROPS
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  modifier?: ButtonModifier | ButtonModifier[];
  loading?: boolean;
  active?: boolean;
  /** @deprecated Use shape="square" instead */
  square?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  children?: React.ReactNode;
  tooltip?: TooltipOptions | string;
}

// ============================================================================
// LOCAL MAPS — structural only, no design values
// ============================================================================

const sizeMap: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export const Button: React.FC<ButtonProps> = ({
  color = "primary",
  variant,
  size = "md",
  shape,
  modifier,
  loading = false,
  active = false,
  disabled,
  square, // Deprecated
  iconBefore,
  iconAfter,
  children,
  tooltip,
  className = "",
  ...rest
}) => {
  const sizeClass = sizeMap[size];

  // DaisyUI error button needs white text override (framework quirk)
  const colorClass = color
    ? ((!variant && color === "error" ? "text-white hover:text-white " : (color === "error" ? "hover:text-white " : "")) + `btn-${color}`)
    : "";

  const variantClass  = variant  ? `btn-${variant}`  : "";
  const shapeClass    = shape    ? `btn-${shape}`    : square ? "btn-square" : "";
  const activeClass   = active   ? "btn-active"      : "";
  const isDisabled    = disabled || loading;
  const disabledClass = isDisabled && !loading ? "btn-disabled" : "";

  const modifierClassList = modifier
    ? Array.isArray(modifier)
      ? modifier.map(m => `btn-${m}`).join(" ")
      : `btn-${modifier}`
    : "";

  const tooltipText = typeof tooltip === "string" ? tooltip : tooltip?.text || "";
  const tooltipPosition = typeof tooltip === "object" && tooltip?.position
    ? `tooltip-${tooltip.position}`
    : "tooltip-top";

  const button = (
    <button
      {...rest}
      disabled={isDisabled}
      className={cn(
        "btn transition-all",
        colorClass,
        variantClass,
        sizeClass,
        shapeClass,
        modifierClassList,
        activeClass,
        disabledClass,
        { "opacity-50 cursor-not-allowed": isDisabled },
        className
      )}
    >
      {loading && <SpinnerIcon size={size} />}
      {!loading && iconBefore && (
        <span className="inline-flex items-center">{iconBefore}</span>
      )}
      {children}
      {!loading && iconAfter && (
        <span className="inline-flex items-center">{iconAfter}</span>
      )}
    </button>
  );

  if (!tooltipText) return button;

  return (
    <div className={cn(`tooltip ${tooltipPosition}`, "inline-flex")} data-tip={tooltipText}>
      {button}
    </div>
  );
};
