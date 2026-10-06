import React, { useState } from "react";
import { cn } from "@/utils";
import type { DaySignal, EventLoopData } from "@/types/shared/event-loop.types";

function dayDotClass(signal: DaySignal): string {
  switch (signal) {
    case "green":   return "text-success";
    case "amber":   return "text-warning";
    case "red":     return "text-error";
    case "pending": return "dt-text-dim";
  }
}

function dayPillClass(signal: DaySignal): string {
  switch (signal) {
    case "green":   return "text-success bg-success/10 border border-success/30";
    case "amber":   return "text-warning bg-warning/10 border border-warning/30";
    case "red":     return "text-error bg-error/10 border border-error/30";
    case "pending": return "text-base-content/40 bg-transparent";
  }
}

function signalLabel(signal: DaySignal): string {
  switch (signal) {
    case "green":   return "Green";
    case "amber":   return "Amber";
    case "red":     return "Red";
    case "pending": return "Pending";
  }
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-md px-2.5 py-2">
      <div className="text-[9px] text-neutral uppercase tracking-[0.1em] mb-0.5">
        {label}
      </div>
      <div className="text-base font-bold text-base-content">
        {value}
      </div>
    </div>
  );
}

function DayRow({ day, currentDay }: {
  day:        EventLoopData["sprintHealth"]["dayBreakdown"][number];
  currentDay: string;
}) {
  const [expanded, setExpanded] = useState(day.day === currentDay);
  const dotClass  = dayDotClass(day.signal);
  const pillClass = dayPillClass(day.signal);
  const label     = signalLabel(day.signal);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center w-full px-4 py-3 bg-transparent border-none border-b border-base-300 cursor-pointer gap-2.5 text-left"
      >
        <span className={cn("text-[10px] shrink-0", dotClass)}>●</span>
        <span className="text-sm font-semibold text-base-content w-[58px] shrink-0">
          {day.day}
        </span>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded tracking-[0.06em] uppercase shrink-0 min-w-[44px] text-center", pillClass)}>
          {label}
        </span>
        <span className="flex-1 text-xs text-neutral">
          {day.signal !== "pending" && day.tasks.done !== undefined
            ? `Tasks ${day.tasks.done}/${day.tasks.total}  ·  QA ${day.qa.met}/${day.qa.total}  ·  Tickets ${(day.tickets.open ?? 0)} open`
            : day.tasks.scheduled !== undefined
            ? `${day.tasks.scheduled} scheduled  ·  ${day.qa.specsLocked ?? 0} QA specs`
            : "—"}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={cn("shrink-0 text-base-content/40 transition-transform duration-200", expanded ? "rotate-180" : "rotate-0")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-b border-base-300 bg-base-200">
          <div className="px-4 py-1.5 text-[9px] font-bold tracking-[0.14em] uppercase text-base-content/40">
            Read Only — Act in Tickets tab
          </div>
          {day.signal !== "pending" && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                <StatBox label="Tasks Done"   value={`${day.tasks.done ?? 0} / ${day.tasks.total ?? 0}`} />
                <StatBox label="QA Met"       value={`${day.qa.met ?? 0} / ${day.qa.total ?? 0}`} />
                <StatBox label="Tickets Open" value={String(day.tickets.open ?? 0)} />
              </div>
            </div>
          )}
          {day.signal === "pending" && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <StatBox label="Scheduled Tasks" value={String(day.tasks.scheduled ?? 0)} />
                <StatBox label="QA Specs Locked" value={String(day.qa.specsLocked ?? 0)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  dayBreakdown: EventLoopData["sprintHealth"]["dayBreakdown"];
  currentDay:   string;
}

export function DaySignalRows({ dayBreakdown, currentDay }: Props) {
  return (
    <>
      {dayBreakdown.map((d) => (
        <DayRow key={d.day} day={d} currentDay={currentDay} />
      ))}
    </>
  );
}
