import React from "react";
import { CheckIcon, CloseIcon, WarningIcon, InfoIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import type { ColorVariant, IconSize } from "@/utils/shared/design.utils";

// Structural sizing config — padding/text/gap are layout, not design values.
// Colors live in dt.css: .dt-badge[data-color="*"]
const badgeSizes = {
  sm: { padding: "px-1.5 py-0.5", text: "text-xs",   gap: "gap-1",   iconSize: "sm" as IconSize },
  md: { padding: "px-2 py-1",     text: "text-sm",   gap: "gap-1.5", iconSize: "md" as IconSize },
  lg: { padding: "px-3 py-1.5",   text: "text-base", gap: "gap-2",   iconSize: "lg" as IconSize },
} as const;

export interface BadgeProps {
  label?: string | React.ReactNode;
  icon?: React.ReactNode | null; // undefined = auto-icon, null = no icon
  variant?: ColorVariant;
  size?: keyof typeof badgeSizes;
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  icon,
  variant = "primary",
  size = "md",
  className = "",
  children,
}) => {
  const s = badgeSizes[size];

  const defaultIcon =
    icon === null
      ? null
      : icon !== undefined
      ? icon
      : ({
          success: <CheckIcon size={s.iconSize} />,
          error:   <CloseIcon size={s.iconSize} />,
          warning: <WarningIcon size={s.iconSize} />,
          info:    <InfoIcon size={s.iconSize} />,
        } as Record<string, React.ReactNode>)[variant] ?? null;

  return (
    <span
      data-color={variant}
      className={cn(
        // dt-badge: colour resolved by CSS from data-color (see dt.css)
        "dt-badge",
        "inline-flex items-center font-bold border-0 select-none transition-all uppercase tracking-[0.06em]",
        "rounded-[4px]",
        s.padding, s.gap, s.text,
        className
      )}
    >
      {defaultIcon && <span className="flex items-center">{defaultIcon}</span>}
      {label}
      {children}
    </span>
  );
};
