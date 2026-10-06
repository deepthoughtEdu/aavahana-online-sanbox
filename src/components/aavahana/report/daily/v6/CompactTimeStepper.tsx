"use client";

import React from "react";
import { cn } from "@/utils";
import { formatMins, TIME_STEP_SMALL } from "@/types/aavahana/report-v5.types";

interface CompactTimeStepperProps {
  minutes: number;
  budgetMins?: number;
  onAdjust: (deltaMins: number) => void;
}

export function CompactTimeStepper({ minutes, budgetMins, onAdjust }: CompactTimeStepperProps) {
  const actualColor =
    budgetMins === undefined
      ? "text-base-content"
      : minutes > budgetMins
        ? "text-error"
        : minutes === budgetMins
          ? "text-warning"
          : "text-success";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onAdjust(-TIME_STEP_SMALL)}
        disabled={minutes <= 0}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200 text-sm font-medium text-base-content/60 transition-colors hover:bg-base-300 active:bg-base-content/10 disabled:opacity-30"
        aria-label="Decrease time by 30 minutes"
      >
        −30
      </button>

      <span className="min-w-[4rem] text-center text-sm tabular-nums">
        <span className={cn("font-semibold transition-colors duration-300", actualColor)}>
          {formatMins(minutes)}
        </span>
        {budgetMins !== undefined && (
          <span className="text-base-content/40"> / {formatMins(budgetMins)}</span>
        )}
      </span>

      <button
        type="button"
        onClick={() => onAdjust(TIME_STEP_SMALL)}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200 text-sm font-medium text-base-content/60 transition-colors hover:bg-base-300 active:bg-base-content/10"
        aria-label="Increase time by 30 minutes"
      >
        +30
      </button>
    </div>
  );
}
