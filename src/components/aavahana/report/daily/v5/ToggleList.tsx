"use client";

import React from "react";
import { cn } from "@/utils";
import { TimeStepper } from "./TimeStepper";
import type { PlannedItemWithStatus } from "@/types/aavahana/report-v5.types";

interface ToggleListProps {
  items: PlannedItemWithStatus[];
  onCycleStatus: (taskId: string) => void;
  onAdjustTime: (taskId: string, deltaMins: number) => void;
  onToggleCriticalPath?: (taskId: string) => void; // SA-8
  showNeedleMoverPrompt?: boolean;                 // SA-8 / E-1: show after all have status
  onProceed?: () => void;
}

const STATUS_ICON: Record<string, string> = {
  done: "\u2713",     // ✓
  partial: "\u25D0",  // ◐
  not_done: "",
};

const STATUS_STYLE: Record<string, string> = {
  done: "border-success bg-success/10 text-success",
  partial: "border-warning bg-warning/10 text-warning",
  not_done: "border-base-300 bg-base-200 text-neutral",
};

export function ToggleList({ items, onCycleStatus, onAdjustTime, onToggleCriticalPath, showNeedleMoverPrompt: _showNeedleMoverPrompt, onProceed }: ToggleListProps) {
  const doneCount = items.filter((i) => i.status === "done").length;
  const partialCount = items.filter((i) => i.status === "partial").length;
  const notDoneCount = items.filter((i) => i.status === "not_done").length;

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      {/* Header */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral">
        Your Plan Today
      </h3>

      {/* Divider */}
      <div className="mb-3 border-t border-base-300" />

      {/* Critical path prompt — always visible when toggle is available */}
      {onToggleCriticalPath && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
          <span className="text-primary text-sm">★</span>
          <p className="text-xs text-primary/80">
            Which one is on the <span className="font-semibold">critical path</span>? Tap the star to mark it.
          </p>
        </div>
      )}

      {/* Task list */}
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.taskId}
            className={cn(
              "flex items-center gap-3 rounded-lg p-1.5 transition-all duration-200",
              item.isCriticalPath && "border-2 border-primary bg-primary/5 pl-2"
            )}
          >
            {/* Critical path toggle — prominent, left of status */}
            {onToggleCriticalPath && (
              <button
                type="button"
                onClick={() => onToggleCriticalPath(item.taskId)}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-200",
                  item.isCriticalPath
                    ? "bg-primary text-primary-content shadow-sm shadow-primary/30"
                    : "bg-base-200 text-base-content/30 hover:bg-primary/10 hover:text-primary"
                )}
                aria-label={item.isCriticalPath ? `Remove critical path from "${item.text}"` : `Mark "${item.text}" as critical path`}
                aria-pressed={item.isCriticalPath}
              >
                ★
              </button>
            )}

            {/* 3-state toggle button */}
            <button
              type="button"
              onClick={() => onCycleStatus(item.taskId)}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition-colors",
                STATUS_STYLE[item.status]
              )}
              aria-label={`Cycle status of "${item.text}" (currently ${item.status.replace("_", " ")})`}
            >
              {STATUS_ICON[item.status]}
            </button>

            {/* Task text */}
            <span
              className={cn(
                "flex-1 text-sm",
                item.status === "done" ? "text-neutral line-through" : "text-base-content"
              )}
            >
              {item.text}
            </span>

            {/* Program badge */}
            {item.programName && (
              <span className="rounded-md bg-base-200 px-2 py-0.5 text-xs text-neutral">
                {item.programName}
              </span>
            )}

            {/* Auto-populated badge */}
            {item.autoPopulated && (
              <span className="text-xs text-info" title="Auto-detected from ticket state">
                auto
              </span>
            )}

            {/* Time stepper */}
            <TimeStepper
              minutes={item.actualMins}
              budgetMins={item.budgetMins}
              onAdjust={(delta) => onAdjustTime(item.taskId, delta)}
            />
          </li>
        ))}
      </ul>

      {/* Divider */}
      <div className="mt-3 border-t border-base-300" />

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-neutral">
          {doneCount} done{partialCount > 0 ? ` · ${partialCount} partial` : ""}{notDoneCount > 0 ? ` · ${notDoneCount} not done` : ""}.
        </span>

        {onProceed && (
          <button
            type="button"
            onClick={onProceed}
            className="btn btn-sm btn-primary"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
