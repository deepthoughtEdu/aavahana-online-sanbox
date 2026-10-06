// components/daily-report/TasksSection.tsx
"use client";

import { useEffect } from "react";
import { CheckCircle2, Circle, Zap } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReportPlanItem } from "@/types/aavahana/report.types";
import { cn } from "@/utils";
import { todayISO } from "@/utils/shared/date.utils";
import { sizes, borderColors, transitions } from "@/utils/shared/design.utils";
import { CalendarIcon, InfoIcon } from "@/components/shared/icons";

interface TasksSectionProps {
  tasks: ReportPlanItem[];
  statuses: Record<number, string>;
  onStatusChange: (index: number, status: string) => void;
}

export function TasksSection({
  tasks,
  statuses,
  onStatusChange,
}: TasksSectionProps) {
  // Save statuses to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(statuses).length > 0) {
      const today = todayISO();
      const storageKey = `task-statuses-${today}`;
      localStorage.setItem(storageKey, JSON.stringify(statuses));
    }
  }, [statuses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={18} className="text-success" />;
      case "in_progress":
        return <Zap size={18} className="text-warning" />;
      default:
        return <Circle size={18} className="dt-text-dim" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 border-success/30";
      case "in_progress":
        return "bg-warning/10 border-warning/30";
      default:
        return "bg-base-200 border-base-300";
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-l-success";
      case "in_progress":
        return "border-l-warning";
      default:
        return "border-l-base-300";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "in_progress":
        return "text-warning";
      default:
        return "dt-text-muted";
    }
  };

  return (
    <Section
      className={cn(
        "bg-base-100 border flex flex-col",
        borderColors.ghost,
        sizes.xl.rounded
      )}
    >
      <Section.Header
        icon={<CalendarIcon size="sm" />}
        title="Today's Plan"
        subtitle={`${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
        size="sm"
      />

      <Section.Body className="flex-1 p-2" noPadding>
        {tasks.length === 0 ? (
          <div className="flex h-full">
            <EmptyState
              icon={<InfoIcon size="md" />}
              variant="info"
              title="No tasks planned"
              subtitle="Add tasks from your daily plan"
              size="md"
            />
          </div>
        ) : (
          <div
            className={cn("space-y-3 overflow-y-auto scroll-smooth")}
            style={{ maxHeight: "170px" }}
          >
            {tasks.map((task, i) => {
              const currentStatus = statuses[i] || task.status;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3",
                    sizes.sm.padding,
                    sizes.lg.rounded,
                    "border-l-4",
                    transitions.normal,
                    getStatusColor(currentStatus),
                    getStatusBorderColor(currentStatus)
                  )}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">{getStatusIcon(currentStatus)}</div>

                  {/* Task Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        sizes.sm.text,
                        "font-medium truncate",
                        getStatusTextColor(currentStatus)
                      )}
                    >
                      {task.text}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={currentStatus}
                    onChange={(e) => onStatusChange(i, e.target.value)}
                    className={cn(
                      "select select-ghost select-sm w-auto",
                      "text-xs font-medium text-base-content",
                      transitions.normal,
                      "focus:outline-none focus:text-base-content"
                    )}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
