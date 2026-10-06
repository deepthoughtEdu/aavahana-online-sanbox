"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Workload meter for the daily plan. Fills as the user adds tasks with time
 * estimates and colours by the total: blue under 5h, yellow 5 to 7h, red at 7h
 * and above, where it also shows a gentle over-burden nudge. Helps people plan
 * a realistic day rather than overcommit.
 */

const CAP_MINS = 480; // 8h visual cap for the fill
const YELLOW_MINS = 300; // 5h
const RED_MINS = 420; // 7h

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function WorkloadBar({ totalMins }: { totalMins: number }) {
  const level =
    totalMins >= RED_MINS ? "high" : totalMins >= YELLOW_MINS ? "mid" : "low";
  const pct = Math.min(100, Math.round((totalMins / CAP_MINS) * 100));

  const barColor =
    level === "high" ? "bg-error" : level === "mid" ? "bg-warning" : "bg-info";
  const valueColor =
    level === "high"
      ? "text-error"
      : level === "mid"
        ? "text-warning"
        : "text-base-content/60";

  return (
    <div className="rounded-xl border border-base-200 bg-base-100 p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-base-content/70">Planned workload</span>
        <span className={valueColor}>{formatMins(totalMins)} of ~8h</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-base-200"
        role="progressbar"
        aria-valuenow={totalMins}
        aria-valuemin={0}
        aria-valuemax={CAP_MINS}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {level === "high" && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-error">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            That is a heavy day. Consider trimming a task, easing an estimate, or
            leaving some buffer so you do not overload yourself.
          </span>
        </div>
      )}
    </div>
  );
}
