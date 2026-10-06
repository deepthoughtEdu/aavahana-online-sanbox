"use client";

import { cn } from "@/utils";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import type { MonthlyBasketItem } from "@/types";

interface MonthlyBasketPickerProps {
  items: MonthlyBasketItem[];
  pickedIds: string[];
  onPick: (item: MonthlyBasketItem) => void;
  onUnpick: (itemId: string) => void;
  className?: string;
}

const PRIORITY_VARIANT: Record<string, "error" | "warning" | "info" | "ghost"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "ghost",
};

/**
 * Monthly basket picker — physics-first mode for Weekly Plan.
 * Shows monthly commitments not yet picked into a week.
 * Module 3 (Weekly Plan) — NEW per PDGMS v4.0 cascade logic.
 */
export function MonthlyBasketPicker({
  items,
  pickedIds,
  onPick,
  onUnpick,
  className,
}: MonthlyBasketPickerProps) {
  if (items.length === 0) {
    return (
      <div className={cn("text-sm opacity-40 text-center py-4", className)}>
        Monthly basket is empty — use voice input to set your week goals.
      </div>
    );
  }

  const unpicked = items.filter((i) => !pickedIds.includes(i.id));
  const picked = items.filter((i) => pickedIds.includes(i.id));

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm font-medium opacity-70">
        Monthly Basket
        <span className="text-xs ml-2 opacity-40">
          ({picked.length}/{items.length} picked)
        </span>
      </p>

      {unpicked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 uppercase tracking-wide">Available</p>
          {unpicked.map((item) => (
            <div
              key={item.id}
              onClick={() => onPick(item)}
              className="flex items-center gap-3 bg-base-200 hover:bg-base-300 rounded-xl px-3 py-2 cursor-pointer transition-colors"
            >
              <Badge
                variant={PRIORITY_VARIANT[item.priority] ?? "ghost"}
                size="sm"
                icon={null}
                className="shrink-0"
                label={item.priority}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {item.title}
                  {item.targetWeek && (
                    <span className="ml-1.5 text-xs opacity-40">{item.targetWeek}</span>
                  )}
                </p>
                <p className="text-xs opacity-50">
                  {item.programName} · {item.estimatedHours}h est.
                  {/* Carried into earlier weeks already — worth knowing before
                      pulling it in again. */}
                  {item.consumption && item.consumption.weeksWorked > 0 && (
                    <>
                      {' · '}
                      <span className="text-warning">
                        {item.consumption.weeksWorked} week
                        {item.consumption.weeksWorked === 1 ? '' : 's'} worked
                        {item.consumption.completed > 0 && ` · ${item.consumption.completed} done`}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <span className="text-xs text-primary shrink-0">+ Pick</span>
            </div>
          ))}
        </div>
      )}

      {picked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs opacity-40 uppercase tracking-wide">Picked this week</p>
          {picked.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl px-3 py-2"
            >
              <span className="text-success text-sm shrink-0">✓</span>
              <p className="text-sm flex-1 truncate">{item.title}</p>
              <Button
                variant="ghost"
                size="xs"
                color="error"
                className="shrink-0"
                onClick={() => onUnpick(item.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
