import React from "react";
import { cn } from "@/utils";
import type { OwnerSignal, EventLoopData } from "@/types/shared/event-loop.types";

function ownerDotClass(signal: OwnerSignal): string {
  switch (signal) {
    case "clean":      return "text-success";
    case "flagged":    return "text-warning";
    case "escalation": return "text-error";
  }
}

function ownerPillClass(signal: OwnerSignal): string {
  switch (signal) {
    case "clean":      return "text-success bg-success/10 border border-success/30";
    case "flagged":    return "text-warning bg-warning/10 border border-warning/30";
    case "escalation": return "text-error bg-error/10 border border-error/30";
  }
}

interface Props {
  ownerBreakdown: EventLoopData["sprintHealth"]["ownerBreakdown"];
}

export function OwnerHealthTable({ ownerBreakdown }: Props) {
  return (
    <>
      {ownerBreakdown.map((o, i) => {
        const dotClass  = ownerDotClass(o.signal);
        const pillClass = ownerPillClass(o.signal);
        return (
          <div
            key={o.owner}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5",
              i < ownerBreakdown.length - 1 ? "border-b border-base-300" : "",
            )}
          >
            <span className={cn("text-[10px] shrink-0", dotClass)}>●</span>
            <span className="text-xs font-semibold text-base-content w-[120px] shrink-0">
              {o.owner}
            </span>
            <span className="text-xs text-neutral flex-1">
              {o.tasks.done}/{o.tasks.total} tasks · QA {o.qa.met}/{o.qa.total}
            </span>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-[0.06em]", pillClass)}>
              {o.signal.charAt(0).toUpperCase() + o.signal.slice(1)}
            </span>
          </div>
        );
      })}
    </>
  );
}
