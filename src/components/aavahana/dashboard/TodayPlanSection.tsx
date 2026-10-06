// src/components/aavahana/dashboard/TodayPlanSection.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Section } from "@/components/shared/Section";
import { CalendarIcon } from "@/components/shared/icons";
import type { DailyTask } from "@/types";

interface TodayPlanSectionProps {
  tasks: DailyTask[];
  isLoading: boolean;
}

const DONE_STATUSES = new Set(["done", "completed"]);
const IN_PROGRESS_STATUSES = new Set(["inProgress", "in_progress"]);

const SOURCE_LABELS: Record<string, string | null> = {
  weekly_basket: "weekly basket",
  event_loop: "event loop",
  weekly: "weekly",
  l2_added: "L2 added",
  manual: null,
  yesterday: "from yesterday",
};

function getStatusIcon(status: string): string {
  if (DONE_STATUSES.has(status)) return "✓";
  if (IN_PROGRESS_STATUSES.has(status)) return "◐";
  return "○";
}

function getStatusColor(status: string, highlight: boolean): string {
  if (DONE_STATUSES.has(status)) return "text-success";
  if (highlight) return "text-error/80";
  if (IN_PROGRESS_STATUSES.has(status)) return "text-warning";
  return "text-base-content/40";
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const label = SOURCE_LABELS[source] ?? null;
  if (!label) return null;
  return (
    <span className="text-[10px] text-base-content/40 ml-1 font-medium">
      [{label}]
    </span>
  );
}

export function TodayPlanSection({ tasks, isLoading }: TodayPlanSectionProps) {
  const [doneExpanded, setDoneExpanded] = useState(false);

  const { groups, doneCount, doneTasks, criticalRemainingCount } =
    useMemo(() => {
      const isDone = (t: DailyTask) => DONE_STATUSES.has(t.status as string);
      const isInProgress = (t: DailyTask) =>
        IN_PROGRESS_STATUSES.has(t.status as string);
      const isCritical = (t: DailyTask) => !!t.isCriticalPath && !isDone(t);

      const critical = tasks.filter(isCritical);
      const inProgress = tasks.filter((t) => isInProgress(t) && !isCritical(t));
      const remaining = tasks.filter(
        (t) => !isDone(t) && !isInProgress(t) && !isCritical(t)
      );
      const done = tasks.filter(isDone);

      const groups: Array<{
        label: string;
        tasks: DailyTask[];
        highlight?: boolean;
      }> = [];
      if (critical.length > 0)
        groups.push({ label: "Critical Path", tasks: critical, highlight: true });
      if (inProgress.length > 0)
        groups.push({ label: "In Progress", tasks: inProgress });
      if (remaining.length > 0)
        groups.push({ label: "Remaining", tasks: remaining });
      if (done.length > 0) groups.push({ label: "Done", tasks: done });

      return {
        groups,
        doneCount: done.length,
        doneTasks: done,
        criticalRemainingCount: critical.length,
      };
    }, [tasks]);

  if (isLoading) {
    return (
      <Section>
        <Section.Header icon={<CalendarIcon size="sm" />} title="Today's Plan" />
        <Section.Body>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-8 w-full" />
            ))}
          </div>
        </Section.Body>
      </Section>
    );
  }

  if (tasks.length === 0) return null;

  const completedCount = tasks.filter((t) =>
    DONE_STATUSES.has(t.status as string)
  ).length;

  const subtitleParts = [
    `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`,
    `${completedCount} done`,
  ];
  if (criticalRemainingCount > 0) {
    subtitleParts.push(
      `${criticalRemainingCount} critical remaining`
    );
  }

  return (
    <Section>
      <Section.Header
        icon={<CalendarIcon size="sm" />}
        title="Today's Plan"
        subtitle={subtitleParts.join(" · ")}
      >
        <Link
          href="/aavahana/daily-plan"
          className="text-xs font-medium text-primary hover:underline"
        >
          View full plan →
        </Link>
      </Section.Header>
      <Section.Body>
        <div className="space-y-4">
          {groups.map((group) => {
            const isDoneGroup = group.label === "Done";
            const visibleTasks = isDoneGroup
              ? doneExpanded
                ? doneTasks
                : doneTasks.slice(0, 3)
              : group.tasks;

            return (
              <div key={group.label}>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                    group.highlight
                      ? "text-error/80"
                      : "text-base-content/40"
                  }`}
                >
                  {group.label}
                </p>
                <ul className="space-y-1.5">
                  {visibleTasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`flex-shrink-0 mt-0.5 font-mono text-sm ${getStatusColor(
                          task.status as string,
                          !!group.highlight
                        )}`}
                      >
                        {getStatusIcon(task.status as string)}
                      </span>
                      <span
                        className={`flex-1 ${
                          DONE_STATUSES.has(task.status as string)
                            ? "line-through text-base-content/40"
                            : "text-black"
                        }`}
                      >
                        {task.text}
                        {task.estimateMins && (
                          <span className="text-xs text-base-content/40 ml-1.5">
                            {task.estimateMins}min
                          </span>
                        )}
                        <SourceBadge source={task.source as string} />
                      </span>
                    </li>
                  ))}
                </ul>
                {isDoneGroup && doneCount > 3 && (
                  <button
                    onClick={() => setDoneExpanded((v) => !v)}
                    className="text-xs text-primary hover:underline mt-1.5"
                  >
                    {doneExpanded ? "Show less" : `+${doneCount - 3} more`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section.Body>
    </Section>
  );
}
