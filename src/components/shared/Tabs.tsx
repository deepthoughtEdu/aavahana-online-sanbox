import React, { ReactNode } from "react";
import { IconBox } from "./IconBox";
import { SpinnerIcon } from "@/components/shared/icons";
import { tabSizes, tabPillStyles, getDynamicColorClasses, type ColorVariant, gaps } from "@/utils/shared/design.utils";
import { cn } from "@/utils";

export interface Tab<T> {
  key: T;
  label: ReactNode;
  icon?: ReactNode;
  description?: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface TabsProps<T> {
  tabs: Tab<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
  size?: keyof typeof tabSizes;
  variant?: "cards" | "pills"; // New prop for layout variant
}

/**
 * Responsive, accessible tab component.
 * Mobile: Horizontal scroll with pills or stacked cards
 * Desktop: Grid layout
 */
export function Tabs<T extends string | number>({
  tabs,
  activeKey,
  onChange,
  className = "",
  size = "md",
  variant = "cards",
}: TabsProps<T>) {
  const sizeConfig = tabSizes[size];

  // Dynamic grid columns based on tab count
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  }[Math.min(tabs.length, 5)] || "md:grid-cols-3";

  if (variant === "pills") {
    // Pills variant - Compact horizontal scrolling tabs (like browser tabs)
    return (
      <div className={tabPillStyles.container}>
        <div className={tabPillStyles.scrollContainer}>
          {tabs.map((tab) => {
            const isActive = activeKey === tab.key;
            const color = tab.color || "primary";
            const isDisabled = tab.disabled;
            const isLoading = tab.loading;
            const colors = getDynamicColorClasses(color, isActive);

            return (
              <button
                key={tab.key}
                onClick={() => !isDisabled && !isLoading && onChange(tab.key)}
                disabled={isDisabled || isLoading}
                className={cn(
                  tabPillStyles.pill,
                  {
                    [colors.border.replace('border-', 'border-b-')]: isActive,
                    [colors.text]: isActive,
                    [tabPillStyles.pillInactive]: !isActive && !isDisabled,
                    "opacity-50 cursor-not-allowed": isDisabled,
                    "cursor-wait": isLoading,
                  }
                )}
              >
                {isLoading ? (
                  <SpinnerIcon color={color as ColorVariant} />
                ) : tab.icon ? (
                  <span className="flex-shrink-0">{tab.icon}</span>
                ) : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Cards variant - Original design with responsive improvements
  return (
    <div className="w-full">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-2 scrollbar-hide">
        <div className={cn("flex gap-3 px-1", gaps.md)}>
          {tabs.map((tab) => (
            <TabCard
              key={tab.key}
              tab={tab}
              isActive={activeKey === tab.key}
              onChange={onChange}
              sizeConfig={sizeConfig}
              size={size}
              className="min-w-[240px] sm:min-w-[280px] flex-shrink-0" // Responsive min width
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className={cn("hidden md:grid", gaps.md, gridCols, className)}>
        {tabs.map((tab) => (
          <TabCard
            key={tab.key}
            tab={tab}
            isActive={activeKey === tab.key}
            onChange={onChange}
            sizeConfig={sizeConfig}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}

// Extracted TabCard component for reusability
function TabCard<T extends string | number>({
  tab,
  isActive,
  onChange,
  sizeConfig,
  size,
  className,
}: {
  tab: Tab<T>;
  isActive: boolean;
  onChange: (key: T) => void;
  sizeConfig: (typeof tabSizes)[keyof typeof tabSizes];
  size: keyof typeof tabSizes;
  className?: string;
}) {
  const color = tab.color || "primary";
  const isDisabled = tab.disabled;
  const isLoading = tab.loading;
  const colors = getDynamicColorClasses(color, isActive);

  const cursorClass = isLoading
    ? "cursor-wait"
    : isDisabled
      ? "cursor-not-allowed"
      : "cursor-pointer";

  return (
    <button
      onClick={() => !isDisabled && !isLoading && onChange(tab.key)}
      disabled={isDisabled || isLoading}
      className={cn(
        "flex items-center rounded-xl border transition-all duration-200 text-left w-full",
        sizeConfig.container,
        sizeConfig.gap,
        {
          [colors.border]: isActive,
          [colors.bg]: isActive,
          "border-base-300 bg-white": !isActive,
          "opacity-60": isDisabled
        },
        cursorClass,
        className
      )}
    >
      {/* Icon */}
      <IconBox
        icon={
          isLoading ? (
            <SpinnerIcon
              size={sizeConfig.iconSize}
              color={color as ColorVariant}
            />
          ) : (
            tab.icon
          )
        }
        color={color as ColorVariant}
        isActive={isActive}
        size={size}
        shape="default"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <h3
          className={cn(
            "transition-colors font-medium truncate",
            sizeConfig.title,
            isActive ? colors.text : "text-black"
          )}
        >
          {tab.label}
        </h3>

        {tab.description && (
          <p
            className={cn(
              "text-neutral line-clamp-2",
              sizeConfig.description
            )}
          >
            {tab.description}
          </p>
        )}
      </div>
    </button>
  );
}