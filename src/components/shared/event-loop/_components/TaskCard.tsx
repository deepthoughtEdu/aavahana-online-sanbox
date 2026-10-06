"use client";

import React, { useState } from "react";
import { cn } from "@/utils";
import type { ELTask } from "@/types/shared/event-loop.types";

/* ── QA result badge ─────────────────────────────────────────────────────────── */
function QABadge({ result, feedback }: { result: string; feedback: string | null }) {
  const badgeClass =
    result === "met"
      ? "text-success bg-success/10 border border-success/30"
      : result === "not_met"
      ? "text-error bg-error/10 border border-error/30"
      : "text-neutral bg-base-200 border border-base-300";

  const label = result === "met" ? "✓ Met" : result === "not_met" ? "✗ Not Met" : "Pending";

  return (
    <div>
      <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold", badgeClass)}>
        {label}
      </div>
      {result === "not_met" && feedback && (
        <div className="mt-1 text-xs text-error italic leading-[1.4]">
          &quot;{feedback}&quot;
        </div>
      )}
    </div>
  );
}

/* ── Day section header ──────────────────────────────────────────────────────── */
export function DayHeader({ day, isCurrent }: { day: string; isCurrent: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 rounded-t-md mt-5",
        isCurrent ? "bg-[var(--dt-navyMid)]" : "bg-[var(--dt-navy)]",
      )}
    >
      <span className={cn("text-[10px] font-bold tracking-[0.15em] uppercase", isCurrent ? "text-white" : "text-[var(--el-muted)]")}>
        {day}
      </span>
      {isCurrent && (
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-primary/80">
          Now
        </span>
      )}
    </div>
  );
}

/* ── Single Task Card ────────────────────────────────────────────────────────── */
interface TaskCardProps {
  task:       ELTask;
  currentDay: string;
  onDone:     (taskId: string) => void;
  onNotDone:  (taskId: string, note: string) => void;
}

export function TaskCard({ task, currentDay, onDone, onNotDone }: TaskCardProps) {
  const [showBlocker, setShowBlocker] = useState(false);
  const [blockerText, setBlockerText] = useState("");

  const isFuture  = task.day > currentDay;
  const isDone    = task.status === "done";
  const isNotDone = task.status === "not_done";
  const isPending = task.status === "pending";

  function handleSubmitBlocker() {
    if (!blockerText.trim()) return;
    onNotDone(task.taskId, blockerText.trim());
    setShowBlocker(false);
    setBlockerText("");
  }

  return (
    <div
      className={cn(
        "bg-base-100 rounded-lg px-4 py-3.5 mb-2.5 border transition-opacity duration-300",
        isNotDone ? "border-warning/30" : "border-base-300",
        isDone ? "opacity-55" : isFuture ? "opacity-45" : "opacity-100",
      )}
    >
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-primary">
              {task.taskId}
            </span>
            {isDone    && <span className="text-[10px] text-success">✓ Done</span>}
            {isNotDone && <span className="text-[10px] text-warning">✗ Not Done</span>}
          </div>
          <div className={cn("text-sm leading-[1.45]", isDone ? "text-neutral" : "text-base-content")}>
            {task.task}
          </div>
        </div>
        <span className="text-xs text-neutral shrink-0">
          {task.day}
        </span>
      </div>

      {isNotDone && task.blockingNote && (
        <div className="mt-2.5 px-2.5 py-2 bg-warning/10 border border-warning/30 rounded-md text-xs text-warning italic">
          {task.blockingNote}
        </div>
      )}

      {(isDone || isNotDone) && (
        <div className="mt-2.5 pt-2.5 border-t border-base-300 flex items-start gap-2">
          <span className="text-xs text-neutral mt-0.5">
            QA · {task.qa.reviewer}
          </span>
          <QABadge result={task.qa.result} feedback={task.qa.feedback} />
        </div>
      )}

      {isPending && !isFuture && !showBlocker && (
        <div className="flex gap-2 mt-3.5">
          <button
            onClick={() => onDone(task.taskId)}
            className="px-5 py-1.5 bg-primary text-white border-none rounded-md text-xs font-bold cursor-pointer hover:opacity-85 transition-opacity"
          >
            Done
          </button>
          <button
            onClick={() => setShowBlocker(true)}
            className="px-4 py-1.5 bg-transparent text-base-content/80 border border-base-300 rounded-md text-xs font-medium cursor-pointer"
          >
            Not Done
          </button>
        </div>
      )}

      {showBlocker && (
        <div className="mt-3">
          <input
            type="text"
            value={blockerText}
            onChange={(e) => setBlockerText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmitBlocker(); }}
            placeholder="What is blocking this"
            autoFocus
            className="w-full px-2.5 py-2 bg-base-200 border border-base-300 rounded-md text-xs text-base-content outline-none box-border"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => { setShowBlocker(false); setBlockerText(""); }}
              className="px-3 py-1 bg-transparent text-neutral border border-base-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitBlocker}
              disabled={!blockerText.trim()}
              className={cn(
                "px-3.5 py-1 border-none rounded text-xs font-bold",
                blockerText.trim() ? "bg-warning text-white cursor-pointer" : "bg-base-200 text-neutral cursor-default",
              )}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
