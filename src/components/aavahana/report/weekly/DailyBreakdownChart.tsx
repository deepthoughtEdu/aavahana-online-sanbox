"use client";

import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { DailyBreakdownItem } from "@/types";

import { cn, gaps } from "@/utils";
import { BarChartIcon } from "lucide-react";

interface DailyBreakdownChartProps {
  data: DailyBreakdownItem[];
}

export function DailyBreakdownChart({ data }: DailyBreakdownChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => d.planned + d.completed),
    1 // Prevent division by zero
  );

  // Days of the week for x-axis
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <Section>
      <Section.Header
        icon={<BarChartIcon />}
        title="Daily Plan vs Actuals"
        size="sm"
      >
        <Button size="sm" variant="ghost" color="secondary">
          View: Tasks
        </Button>
      </Section.Header>

      <Section.Body>
        <div className={cn(gaps.md)}>
          {/* Chart Container */}
          <div className="relative h-64 flex items-end justify-between px-4 pb-2">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs dt-text-dim">
              <span>{maxValue}</span>
              <span>{Math.floor(maxValue * 0.75)}</span>
              <span>{Math.floor(maxValue * 0.5)}</span>
              <span>{Math.floor(maxValue * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Horizontal grid lines */}
            <div className="absolute left-8 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-base-300/50" />
              ))}
            </div>

            {/* Bars */}
            <div className="flex items-end justify-between gap-2 flex-1 ml-8 h-full">
              {days.map((day) => {
                const dayData = data.find((d) => d.day === day);
                const planned = dayData?.planned || 0;
                const completed = dayData?.completed || 0;
                // const total = planned + completed;

                const plannedHeight =
                  maxValue > 0 ? (planned / maxValue) * 100 : 0;
                const completedHeight =
                  maxValue > 0 ? (completed / maxValue) * 100 : 0;

                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    {/* Stacked Bars */}
                    <div className="w-full flex flex-col-reverse items-center h-full justify-end gap-0.5">
                      {/* Completed Bar (Blue/Primary) */}
                      {completed > 0 && (
                        <div
                          className={cn(
                            "w-full bg-primary rounded-t transition-all duration-300",
                            "group-hover:bg-primary/80 relative"
                          )}
                          style={{
                            height: `${completedHeight}%`,
                            minHeight: completed > 0 ? "4px" : "0",
                          }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral text-neutral-content text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {completed} completed
                          </div>
                        </div>
                      )}

                      {/* Remaining/Planned Bar (Light Blue) */}
                      {planned > completed && (
                        <div
                          className={cn(
                            "w-full bg-info/30 rounded-t transition-all duration-300",
                            "group-hover:bg-info/40 relative"
                          )}
                          style={{
                            height: `${plannedHeight - completedHeight}%`,
                            minHeight: planned - completed > 0 ? "4px" : "0",
                          }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral text-neutral-content text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {planned - completed} remaining
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Day Label */}
                    <span className="text-xs dt-text-muted font-medium mt-1">
                      {day.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-center",
              gaps.md,
              "pt-4 border-t border-base-300"
            )}
          >
            <div className={cn("flex items-center", gaps.xs)}>
              <div className="w-4 h-4 bg-info/30 rounded" />
              <span className="text-xs dt-text-muted">Planned</span>
            </div>
            <div className={cn("flex items-center", gaps.xs)}>
              <div className="w-4 h-4 bg-primary rounded" />
              <span className="text-xs dt-text-muted">Actual</span>
            </div>
            <div className={cn("flex items-center", gaps.xs)}>
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-xs dt-text-muted">Completed</span>
            </div>
            <div className={cn("flex items-center", gaps.xs)}>
              <div className="w-3 h-3 bg-info/30 rounded-full" />
              <span className="text-xs dt-text-muted">Remaining</span>
            </div>
          </div>
        </div>
      </Section.Body>
    </Section>
  );
}
