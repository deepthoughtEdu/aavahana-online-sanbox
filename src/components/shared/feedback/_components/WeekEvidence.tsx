"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check, X, CalendarDays } from "lucide-react";
import { cn } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";
import type { FeedbackWeekDay } from "@/types/shared/feedback.types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeekEvidenceProps {
  /** Whose evidence this is — drives the panel title. */
  ownerName?: string;
  /** "Week of 9–15 Jun, 2026" */
  weekLabel: string;
  days: FeedbackWeekDay[];
  isLoading?: boolean;
  /** On the most recent completed week — can't navigate forward. */
  atLatestWeek?: boolean;
  onPrevWeek(): void;
  onNextWeek(): void;
}

// Status → tone. Static class strings only (Design Surface Law).
const STATUS_DOT: Record<string, string> = {
  completed: "bg-success",
  done: "bg-success",
  inProgress: "bg-warning",
  in_progress: "bg-warning",
  notStarted: "bg-base-300",
  not_started: "bg-base-300",
};

function statusDot(status: string): string {
  return STATUS_DOT[status] ?? "bg-base-300";
}

// ─── Compact day row (collapsed → expand on click) ────────────────────────────

function DayRow({ day }: { day: FeedbackWeekDay }) {
  const [open, setOpen] = useState(false);
  const plannedCount = day.plan.length;
  const rep = day.report;
  const isEmpty = !day.hasPlan && !day.hasReport;

  return (
    <div className="border-b border-base-200 last:border-b-0">
      {/* Summary line — always visible */}
      <button
        type="button"
        onClick={() => !isEmpty && setOpen((v) => !v)}
        disabled={isEmpty}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
          isEmpty ? "opacity-50 cursor-default" : "hover:bg-base-200/60"
        )}
      >
        {/* Weekday + date */}
        <div className="w-16 flex-shrink-0">
          <p className="text-xs font-semibold text-black leading-tight">{formatDate(day.date, "ddd")}</p>
          <p className="text-[10px] text-neutral leading-tight">{formatDate(day.date, "D MMM")}</p>
        </div>

        {/* Compact stats */}
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1 text-[11px]">
          {isEmpty ? (
            <span className="text-neutral italic">No plan or report</span>
          ) : (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full",
                  day.hasPlan ? "bg-primary/10 text-primary" : "bg-base-200 text-neutral"
                )}
              >
                {day.hasPlan ? `${plannedCount} planned` : "no plan"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full",
                  rep?.submitted ? "bg-success/10 text-success" : "bg-base-200 text-neutral"
                )}
              >
                {rep?.submitted ? (
                  <>
                    <Check className="w-3 h-3" /> {rep.doneCount}/{rep.totalCount} done
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" /> no report
                  </>
                )}
              </span>
            </>
          )}
        </div>

        {!isEmpty && (
          <ChevronDown
            className={cn("w-4 h-4 text-neutral flex-shrink-0 transition-transform", open && "rotate-180")}
          />
        )}
      </button>

      {/* Expanded — two labeled blocks: Plan / Report */}
      {open && !isEmpty && (
        <div className="px-3 pb-3 pl-[76px] grid gap-3 sm:grid-cols-2">
          {/* Plan block */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral">Plan</p>
            {day.hasPlan ? (
              <ul className="space-y-1">
                {day.plan.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-black leading-snug">
                    <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", statusDot(item.status))} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral italic">No plan submitted</p>
            )}
          </div>

          {/* Report block */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral">Report</p>
            {rep?.submitted ? (
              <div className="space-y-1.5">
                {rep.narrative && (
                  <p className="text-xs text-black italic leading-snug border-l-2 border-base-300 pl-2">
                    {rep.narrative}
                  </p>
                )}
                {rep.tasks.length > 0 && (
                  <ul className="space-y-1">
                    {rep.tasks.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-black leading-snug">
                        <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", statusDot(t.status))} />
                        <span className="min-w-0">
                          {t.text}
                          {t.actualMins != null && t.actualMins > 0 && (
                            <span className="text-neutral ml-1">· {t.actualMins}m</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-neutral">
                  {rep.doneCount}/{rep.totalCount} done
                  {rep.totalActualMins > 0 && ` · ${rep.totalActualMins}m logged`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral italic">No report submitted</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function WeekEvidence({
  ownerName,
  weekLabel,
  days,
  isLoading = false,
  atLatestWeek = false,
  onPrevWeek,
  onNextWeek,
}: WeekEvidenceProps) {
  const hasAny = days.some((d) => d.hasPlan || d.hasReport);

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
      {/* Header: title + week nav */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-base-200/60 border-b border-base-300">
        <p className="text-xs font-semibold text-black flex items-center gap-1.5 min-w-0">
          <CalendarDays className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{ownerName ? `${ownerName}'s week` : "Their week"}</span>
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="Previous week"
            className="p-1 rounded-md hover:bg-base-300 text-neutral hover:text-black transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-neutral tabular-nums whitespace-nowrap">{weekLabel}</span>
          <button
            type="button"
            onClick={onNextWeek}
            disabled={atLatestWeek}
            aria-label="Next week"
            className="p-1 rounded-md hover:bg-base-300 text-neutral hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <p className="px-3 py-4 text-xs text-neutral">Loading the week…</p>
      ) : !hasAny ? (
        <p className="px-3 py-4 text-xs text-neutral italic">
          No daily plans or reports for this week. Use the arrows to check another week.
        </p>
      ) : (
        <div>
          {days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}
