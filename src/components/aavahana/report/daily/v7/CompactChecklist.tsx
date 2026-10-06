"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import { CompactTimeStepper } from "./CompactTimeStepper";
import { formatMins, STATUS_CYCLE } from "@/types/aavahana/report-v5.types";
import type { PlannedItemStatus } from "@/types/aavahana/report-v5.types";
import type { PlannedDeliverable } from "./data/types";

/* ── Status presentation ── */

const STATUS_ICON: Record<string, string> = {
  done: "\u2713",       // ✓
  partial: "\u25D0",    // ◐
  not_done: "\u00B7",   // ·
};

const STATUS_STYLE: Record<string, string> = {
  done: "border-success bg-success/20 text-success shadow-sm shadow-success/20",
  partial: "border-warning bg-warning/20 text-warning shadow-sm shadow-warning/20",
  not_done: "border-base-300 bg-base-100 text-base-content/25",
};

const STATUS_LABEL_STYLE: Record<string, string> = {
  done: "text-base-content/40 line-through",
  partial: "text-base-content/80",
  not_done: "text-base-content",
};

/* ── Props ── */

interface CompactChecklistProps {
  deliverables: PlannedDeliverable[];
  onCycleStatus: (taskId: string) => void;
  onAdjustTime: (taskId: string, deltaMins: number) => void;
  onToggleCriticalPath: (taskId: string) => void;
}

export function CompactChecklist({
  deliverables,
  onCycleStatus,
  onAdjustTime,
  onToggleCriticalPath,
}: CompactChecklistProps) {
  // Accordion: only one time stepper open at a time
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleTimeToggle = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const doneCount = deliverables.filter((d) => d.status === "done").length;
  const partialCount = deliverables.filter((d) => d.status === "partial").length;
  const notDoneCount = deliverables.filter(
    (d) => d.status === "not_done" || d.status === null,
  ).length;

  return (
    <div className="flex flex-col gap-1">
      {/* Critical path hint */}
      <p className="mb-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs text-base-content/50">
        Tap <span className="font-semibold text-primary">★</span> on the one that matters most today
      </p>

      {/* Deliverable rows */}
      <ul className="flex flex-col gap-2">
        {deliverables.map((d, idx) => {
          const status: PlannedItemStatus = d.status ?? "not_done";
          const isExpanded = expandedId === d.id;
          const timeColor =
            d.actualMins > d.estimateMins
              ? "text-error"
              : d.actualMins === d.estimateMins
                ? "text-warning"
                : "text-success";
          const isFirst = idx === 0;

          return (
            <li key={d.id} className="flex flex-col">
              {/* Main row */}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2 py-2 transition-all duration-200",
                  d.isCriticalPath
                    ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-base-200 bg-base-100",
                )}
              >
                {/* Critical path star */}
                <button
                  type="button"
                  id={isFirst ? "tour-deliver-critical-path" : undefined}
                  onClick={() => onToggleCriticalPath(String(d.id))}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-200 active:scale-90",
                    d.isCriticalPath
                      ? "bg-primary text-primary-content shadow-sm shadow-primary/30"
                      : "text-base-content/20 hover:text-primary/50",
                  )}
                  aria-label={d.isCriticalPath ? `Remove critical path from "${d.label}"` : `Mark "${d.label}" as critical path`}
                  aria-pressed={d.isCriticalPath}
                >
                  ★
                </button>

                {/* Status cycle */}
                <button
                  type="button"
                  id={isFirst ? "tour-deliver-status" : undefined}
                  onClick={() => {
                    const currentIdx = STATUS_CYCLE.indexOf(status);
                    const _next = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
                    onCycleStatus(String(d.id));
                  }}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-all duration-200 active:scale-90",
                    STATUS_STYLE[status],
                  )}
                  aria-label={`Cycle status of "${d.label}" (currently ${status.replace("_", " ")})`}
                >
                  {STATUS_ICON[status]}
                </button>

                {/* Label */}
                <span className={cn("flex-1 truncate text-sm", STATUS_LABEL_STYLE[status])}>
                  {d.label}
                </span>

                {/* Tappable time display */}
                <button
                  type="button"
                  id={isFirst ? "tour-deliver-time" : undefined}
                  onClick={() => handleTimeToggle(d.id)}
                  className={cn(
                    "shrink-0 rounded-lg border px-2 py-1 text-xs tabular-nums transition-all duration-200 active:scale-95",
                    isExpanded
                      ? "border-base-300 bg-base-200 text-base-content"
                      : "border-transparent text-base-content/50 hover:border-base-200 hover:bg-base-200/50",
                  )}
                  aria-label={`Adjust time for "${d.label}"`}
                  aria-expanded={isExpanded}
                >
                  <span className={cn("font-semibold", timeColor)}>
                    {formatMins(d.actualMins)}
                  </span>
                  <span className="text-base-content/30">/{formatMins(d.estimateMins)}</span>
                </button>
              </div>

              {/* Accordion time stepper */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-center py-2">
                      <CompactTimeStepper
                        minutes={d.actualMins}
                        budgetMins={d.estimateMins}
                        onAdjust={(delta) => onAdjustTime(String(d.id), delta)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {/* Footer — status counts */}
      <div className="mt-2 flex items-center gap-3 text-xs text-base-content/50">
        {doneCount > 0 && <span className="text-success">{doneCount} done</span>}
        {partialCount > 0 && <span className="text-warning">{partialCount} partial</span>}
        {notDoneCount > 0 && <span>{notDoneCount} pending</span>}
      </div>
    </div>
  );
}
