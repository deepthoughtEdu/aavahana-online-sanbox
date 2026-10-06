/**
 * ELMyTasks.tsx — Event Loop Tab 1: My Tasks
 *
 * Groups tasks by day, delegates each card to TaskCard.
 * State (done/not-done overrides) is managed here and passed down.
 */

import React, { useState } from "react";
import { cn } from "@/utils";
import { TaskCard, DayHeader } from "./_components/TaskCard";
import type { ELTask, ELTaskStatus } from "@/types/shared/event-loop.types";

interface ELMyTasksProps {
  tasks:      ELTask[];
  currentDay: string;
}

export function ELMyTasks({ tasks, currentDay }: ELMyTasksProps) {
  const [taskStates, setTaskStates] = useState<Record<string, ELTaskStatus>>(
    Object.fromEntries(tasks.map((t) => [t.taskId, t.status]))
  );
  const [blockerNotes, setBlockerNotes] = useState<Record<string, string>>({});

  const days = Array.from(new Set(tasks.map((t) => t.day)));

  function handleDone(taskId: string) {
    setTaskStates((prev) => ({ ...prev, [taskId]: "done" }));
  }

  function handleNotDone(taskId: string, note: string) {
    setTaskStates((prev) => ({ ...prev, [taskId]: "not_done" }));
    setBlockerNotes((prev) => ({ ...prev, [taskId]: note }));
  }

  return (
    <div className="max-w-[680px]">
      {days.map((day) => {
        const dayTasks  = tasks.filter((t) => t.day === day);
        const isCurrent = day === currentDay;
        return (
          <div key={day} className="mb-4">
            <DayHeader day={day} isCurrent={isCurrent} />
            <div className={cn("border-t-0 rounded-b-md overflow-hidden border", isCurrent ? "border-[var(--dt-navyMid)]" : "border-base-content/20")}>
              {dayTasks.map((t, i) => {
                const merged: ELTask = {
                  ...t,
                  status:       taskStates[t.taskId] ?? t.status,
                  blockingNote: blockerNotes[t.taskId] ?? t.blockingNote,
                };
                return (
                  <div key={t.taskId} className={cn(i > 0 ? "border-t border-base-300" : "")}>
                    <TaskCard task={merged} currentDay={currentDay} onDone={handleDone} onNotDone={handleNotDone} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
