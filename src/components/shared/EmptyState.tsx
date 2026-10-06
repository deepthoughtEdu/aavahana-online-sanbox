import React from "react";
import { emptyStateSizes, getEmptyStateColors } from "@/utils/shared/design.utils";
import { cn } from "@/utils";

export interface EmptyStateProps {
  title?: string | null;
  subtitle?: string | null;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  resourceName?: string;
  plural?: boolean;
  variant?: "empty" | "error" | "info";
  size?: keyof typeof emptyStateSizes;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon,
  illustration,
  resourceName,
  plural,
  variant = "empty",
  size = "md",
  className = "",
  children,
}) => {
  //  Get size styles from centralized tokens
  const sizeStyles = emptyStateSizes[size];

  //  Get variant colors from centralized utility
  const variantColors = getEmptyStateColors(variant);

  // Default text logic
  const computedTitle =
    title === undefined
      ? resourceName
        ? `No ${resourceName}${plural ? "s" : ""} Found`
        : "Nothing here yet"
      : title;

  const computedSubtitle =
    subtitle === undefined
      ? resourceName
        ? `There are no ${resourceName.toLowerCase()}${plural ? "s" : ""
        } yet.`
        : "Try adjusting your filters or add new data."
      : subtitle;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center w-full bg-white",
        sizeStyles.container,
        sizeStyles.gap,
        className
      )}
    >
      {/* Inner colored section for icon + text */}
      <div className="max-w-md w-full flex flex-col items-center justify-center px-4 sm:px-0">
        {illustration && (
          <div className="mb-4 flex justify-center w-full max-w-xs sm:max-w-sm">{illustration}</div>
        )}

        {icon && !illustration && (
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              sizeStyles.iconPadding,
              sizeStyles.icon,
              variantColors.text,
              variantColors.bg
            )}
          >
            {icon}
          </div>
        )}

        {computedTitle && (
          <h3 className={cn("text-black mt-2", sizeStyles.title)}>
            {computedTitle}
          </h3>
        )}

        {computedSubtitle && (
          <p className={cn("max-w-sm mx-auto px-2 sm:px-0", sizeStyles.subtitle)}>
            {computedSubtitle}
          </p>
        )}

        {children && (
          <div
            className={cn(
              "flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 w-full",
              sizeStyles.actions
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};