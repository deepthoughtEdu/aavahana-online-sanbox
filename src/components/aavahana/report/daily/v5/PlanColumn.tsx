"use client";

import React from "react";
import { cn } from "@/utils";
import { TimeStepper } from "./TimeStepper";
import type { PlannedItemWithStatus } from "@/types/aavahana/report-v5.types";

interface PlanColumnProps {
  items: PlannedItemWithStatus[];
  onCycleStatus: (taskId: string) => void;
  onAdjustTime: (taskId: string, deltaMins: number) => void;
}

const STATUS_ICON: Record<string, string> = {
  done: "\u2713",
  partial: "\u25D0",
  not_done: "\u2717",
};

const STATUS_COLOR: Record<string, string> = {
  done: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  not_done: "bg-error/10 text-error",
};

export function PlanColumn({ items, onCycleStatus, onAdjustTime }: PlanColumnProps) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral">
        The Plan
      </h4>
      <div className="border-t border-base-300" />
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.taskId} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCycleStatus(item.taskId)}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                  STATUS_COLOR[item.status]
                )}
              >
                {STATUS_ICON[item.status]}
              </button>
              <span
                className={cn(
                  "text-sm",
                  item.status === "done" ? "text-neutral" : "text-base-content"
                )}
              >
                {item.text}
              </span>
            </div>
            <div className="ml-8 flex items-center gap-2">
              <TimeStepper
                minutes={item.actualMins}
                budgetMins={item.budgetMins}
                onAdjust={(delta) => onAdjustTime(item.taskId, delta)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
