// src/components/aavahana/dashboard/TodayPulse.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Section } from "@/components/shared/Section";
import { SPRINT_DAY_MINS, CAPACITY_THRESHOLDS } from "./dashboard.constants";
import type { DailyTask } from "@/types";

interface TodayPulseProps {
  tasks: DailyTask[];
  isLoading: boolean;
  openEventLoopCount?: number;
}

const DONE_STATUSES = new Set(["done", "completed"]);

function getSignal(
  capacityPct: number,
  criticalRemaining: number
): { text: string; colorClass: string } {
  if (capacityPct < CAPACITY_THRESHOLDS.LIGHT) {
    return {
      text: "Light day — room to take on more or invest in drills",
      colorClass: "text-success",
    };
  }
  if (capacityPct <= CAPACITY_THRESHOLDS.OPTIMAL_MAX) {
    const suffix =
      criticalRemaining > 0
        ? ` — ${criticalRemaining} critical path item${criticalRemaining !== 1 ? "s" : ""} remaining`
        : "";
    return {
      text: `On track${suffix}`,
      colorClass: "text-base-content",
    };
  }
  if (capacityPct <= CAPACITY_THRESHOLDS.HEAVY_MAX) {
    return {
      text: "Full day — protect your critical path items",
      colorClass: "text-warning",
    };
  }
  return {
    text: "Overloaded — consider deferring something",
    colorClass: "text-error",
  };
}

function getBarColor(capacityPct: number): string {
  if (capacityPct > CAPACITY_THRESHOLDS.HEAVY_MAX) return "bg-error";
  if (capacityPct > CAPACITY_THRESHOLDS.OPTIMAL_MAX) return "bg-warning";
  return "bg-success";
}

export function TodayPulse({ tasks, isLoading, openEventLoopCount }: TodayPulseProps) {
  const { totalMins, capacityPct, doneCount, criticalRemaining } =
    useMemo(() => {
      const totalMins = tasks.reduce(
        (sum, t) => sum + (Number(t.estimateMins) || 0),
        0
      );
      const raw = Math.round((totalMins / SPRINT_DAY_MINS) * 100);
      const capacityPct = Math.min(raw, 120);
      const doneCount = tasks.filter((t) =>
        DONE_STATUSES.has(t.status as string)
      ).length;
      const criticalRemaining = tasks.filter(
        (t) =>
          t.isCriticalPath && !DONE_STATUSES.has(t.status as string)
      ).length;
      return { totalMins, capacityPct, doneCount, criticalRemaining };
    }, [tasks]);

  const signal = useMemo(
    () => getSignal(capacityPct, criticalRemaining),
    [capacityPct, criticalRemaining]
  );

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeLabel =
    hours > 0
      ? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`
      : `${mins}min`;

  return (
    <Section>
      <Section.Header title="Today's Pulse" size="sm" />
      <Section.Body>
        {isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-5 w-2/3" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-base-content/60">
              No plan yet — start your day.
            </p>
            <Link
              href="/aavahana/daily-plan"
              className="text-sm text-primary font-medium hover:underline"
            >
              Create your daily plan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Capacity bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                  Capacity
                </span>
                <span className="text-xs text-base-content/60">
                  {capacityPct}% · {timeLabel} planned
                </span>
              </div>
              <div className="w-full h-2 bg-base-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(capacityPct)}`}
                  style={{ width: `${Math.min(capacityPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Task summary + event loop + state signal */}
            <div className="space-y-1">
              <p className="text-sm text-base-content/70">
                ✓ {doneCount} of {tasks.length} tasks done
                {criticalRemaining > 0 && (
                  <span className="text-base-content/60">
                    {" · "}
                    <span className="text-error/80 font-medium">
                      {criticalRemaining} critical path item
                      {criticalRemaining !== 1 ? "s" : ""} remaining
                    </span>
                  </span>
                )}
              </p>
              {openEventLoopCount !== undefined && openEventLoopCount > 0 && (
                <p className="text-sm text-base-content/70">
                  {"⚡ "}
                  <Link
                    href="/aavahana/event-loop"
                    className="text-warning font-medium hover:underline"
                  >
                    {openEventLoopCount} event loop ticket
                    {openEventLoopCount !== 1 ? "s" : ""} need attention
                  </Link>
                </p>
              )}
              <p className={`text-sm font-medium ${signal.colorClass}`}>
                {signal.text}
              </p>
            </div>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
