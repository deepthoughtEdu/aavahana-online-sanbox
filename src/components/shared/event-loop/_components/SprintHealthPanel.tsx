import React from "react";
import { cn } from "@/utils";
import { NavyHead } from "./NavyHead";
import type { DaySignal, OwnerSignal, EventLoopData } from "@/types/shared/event-loop.types";

function daySignalClasses(signal: DaySignal) {
  switch (signal) {
    case "green":   return { text: "text-success", pill: "bg-success/10 border border-success/30", label: "Green" };
    case "amber":   return { text: "text-warning", pill: "bg-warning/10 border border-warning/30", label: "Amber" };
    case "red":     return { text: "text-error",   pill: "bg-error/10 border border-error/30",     label: "Red"   };
    case "pending": return { text: "dt-text-dim",  pill: "bg-transparent",                         label: "Pending" };
  }
}

function ownerSignalClass(signal: OwnerSignal): string {
  switch (signal) {
    case "clean":      return "text-success";
    case "flagged":    return "text-warning";
    case "escalation": return "text-error";
  }
}

interface Props {
  sprintLabel:    string;
  dayBreakdown:   EventLoopData["sprintHealth"]["dayBreakdown"];
  ownerBreakdown: EventLoopData["sprintHealth"]["ownerBreakdown"];
}

export function SprintHealthPanel({ sprintLabel, dayBreakdown, ownerBreakdown }: Props) {
  return (
    <div className="border border-base-300 rounded-md overflow-hidden">
      <NavyHead label={sprintLabel} />

      {dayBreakdown.map((d, i) => {
        const cls = daySignalClasses(d.signal);
        return (
          <div
            key={d.day}
            className={cn(
              "flex items-center gap-2.5 px-4 py-[9px] border-b",
              i < dayBreakdown.length - 1 ? "border-base-300" : "border-transparent",
              i % 2 === 0 ? "bg-base-100" : "bg-base-200",
            )}
          >
            <span className={cn("text-[9px] shrink-0", cls.text)}>●</span>
            <span className={cn("w-[42px] text-xs font-semibold shrink-0", d.signal === "pending" ? "text-neutral" : "text-base-content")}>
              {d.day}
            </span>
            <span className={cn("text-[9px] font-bold px-[7px] py-0.5 rounded uppercase tracking-[0.06em] shrink-0 min-w-[44px] text-center", cls.text, cls.pill)}>
              {cls.label}
            </span>
            <span className="text-xs text-neutral">
              {d.signal !== "pending" && d.tasks.done !== undefined
                ? `${d.tasks.done}/${d.tasks.total} tasks · QA ${d.qa.met}/${d.qa.total}`
                : d.tasks.scheduled !== undefined
                ? `${d.tasks.scheduled} scheduled · ${d.qa.specsLocked} QA specs`
                : ""}
            </span>
          </div>
        );
      })}

      <div className="flex gap-3.5 flex-wrap px-4 py-2.5 bg-[var(--dt-navyMid)] border-t border-base-300">
        {ownerBreakdown.map((o) => {
          const oc = ownerSignalClass(o.signal);
          return (
            <div key={o.owner} className="flex items-center gap-1.5">
              <span className={cn("text-[9px]", oc)}>●</span>
              <span className="text-xs text-[var(--el-muted)]">{o.owner}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
