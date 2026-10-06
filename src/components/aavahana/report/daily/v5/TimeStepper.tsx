"use client";

import React from "react";
import { cn } from "@/utils";
import { formatMins, TIME_STEP_SMALL, TIME_STEP_LARGE } from "@/types/aavahana/report-v5.types";

interface TimeStepperProps {
  minutes: number;         // actual time
  budgetMins?: number;     // budget (immutable once day starts)
  onAdjust: (deltaMins: number) => void;
}

export function TimeStepper({ minutes, budgetMins, onAdjust }: TimeStepperProps) {
  // SA-7: color actual vs budget
  const actualColor =
    budgetMins === undefined
      ? "text-base-content"
      : minutes > budgetMins
        ? "text-error"
        : minutes === budgetMins
          ? "text-warning"
          : "text-success";

  return (
    <div className="flex items-center gap-1">
      {/* −1h button */}
      <button
        type="button"
        onClick={() => onAdjust(-TIME_STEP_LARGE)}
        disabled={minutes <= 0}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-base-200 px-1.5 text-xs font-medium text-neutral transition-colors hover:bg-base-300 disabled:opacity-30"
        aria-label="Decrease time by 1 hour"
      >
        −1h
      </button>

      {/* −30m button */}
      <button
        type="button"
        onClick={() => onAdjust(-TIME_STEP_SMALL)}
        disabled={minutes <= 0}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-base-200 px-1.5 text-xs font-medium text-neutral transition-colors hover:bg-base-300 disabled:opacity-30"
        aria-label="Decrease time by 30 minutes"
      >
        −30m
      </button>

      {/* actual / budget display */}
      <span className="min-w-[4.5rem] text-center text-sm">
        <span className={cn("font-semibold transition-colors duration-300", actualColor)}>
          {formatMins(minutes)}
        </span>
        {budgetMins !== undefined && (
          <span className="text-base-content/50"> / {formatMins(budgetMins)}</span>
        )}
      </span>

      {/* +30m button */}
      <button
        type="button"
        onClick={() => onAdjust(TIME_STEP_SMALL)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-base-200 px-1.5 text-xs font-medium text-neutral transition-colors hover:bg-base-300"
        aria-label="Increase time by 30 minutes"
      >
        +30m
      </button>

      {/* +1h button */}
      <button
        type="button"
        onClick={() => onAdjust(TIME_STEP_LARGE)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-base-300 px-1.5 text-xs font-bold text-base-content transition-colors hover:bg-base-200"
        aria-label="Increase time by 1 hour"
      >
        +1h
      </button>
    </div>
  );
}
