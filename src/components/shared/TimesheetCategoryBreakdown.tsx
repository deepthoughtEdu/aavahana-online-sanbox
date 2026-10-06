"use client";

import { cn } from "@/utils";
import type { TimesheetCategory, TimesheetCategoryType } from "@/types";

const CATEGORY_LABELS: Record<TimesheetCategoryType, string> = {
  operational: "Operational",
  research: "Research",
  deep_work: "Deep Work",
  coordination: "Coordination",
  meetings: "Meetings",
  planning_strategy: "Planning & Strategy",
};

const CATEGORY_COLORS: Record<TimesheetCategoryType, string> = {
  operational: "bg-primary",
  research: "bg-secondary",
  deep_work: "bg-success",
  coordination: "bg-warning",
  meetings: "bg-error",
  planning_strategy: "bg-info",
};

const ALL_CATEGORIES: TimesheetCategoryType[] = [
  "operational",
  "research",
  "deep_work",
  "coordination",
  "meetings",
  "planning_strategy",
];

interface TimesheetCategoryBreakdownProps {
  categories: TimesheetCategory[];
  onChange?: (categories: TimesheetCategory[]) => void;
  disabled?: boolean;
  className?: string;
  showBar?: boolean;
}

/**
 * 6-category timesheet breakdown — display + optional editing.
 * Used in Daily Report (editing mode) and Analytics (display mode).
 */
export function TimesheetCategoryBreakdown({
  categories,
  onChange,
  disabled = false,
  className,
  showBar = true,
}: TimesheetCategoryBreakdownProps) {
  const totalHours = categories.reduce((sum, c) => sum + c.hours, 0);

  function getHours(category: TimesheetCategoryType): number {
    return categories.find((c) => c.category === category)?.hours ?? 0;
  }

  function setHours(category: TimesheetCategoryType, hours: number) {
    if (!onChange) return;
    const existing = categories.find((c) => c.category === category);
    if (existing) {
      onChange(
        categories.map((c) =>
          c.category === category ? { ...c, hours: Math.max(0, hours) } : c
        )
      );
    } else {
      onChange([...categories, { category, hours: Math.max(0, hours) }]);
    }
  }

  const percent = (hours: number) =>
    totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-70">Time Breakdown</p>
        <span className="text-sm opacity-50">{totalHours.toFixed(1)} hrs total</span>
      </div>

      {showBar && totalHours > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden w-full">
          {ALL_CATEGORIES.map((cat) => {
            const h = getHours(cat);
            if (h <= 0) return null;
            return (
              <div
                key={cat}
                className={cn(CATEGORY_COLORS[cat], "transition-all")}
                style={{ width: `${percent(h)}%` }}
                title={`${CATEGORY_LABELS[cat]}: ${h}h`}
              />
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const hours = getHours(cat);
          return (
            <div
              key={cat}
              className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2"
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full shrink-0",
                  CATEGORY_COLORS[cat]
                )}
              />
              <span className="text-sm flex-1">{CATEGORY_LABELS[cat]}</span>
              {disabled ? (
                <span className="text-sm font-mono opacity-70">
                  {hours.toFixed(1)}h
                </span>
              ) : (
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(cat, Number(e.target.value))}
                  className="input input-xs input-bordered w-20 text-right"
                />
              )}
              {showBar && totalHours > 0 && (
                <span className="text-xs opacity-40 w-8 text-right">
                  {percent(hours)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
