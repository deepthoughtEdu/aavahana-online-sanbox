import React from "react";
import { NavyHead } from "./NavyHead";
import type { PersonalHealth } from "@/types/shared/event-loop.types";

function StatCell({ label, valA, labelA, valB, labelB }: {
  label: string; valA: number; labelA: string; valB: number; labelB: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-neutral uppercase tracking-[0.12em]">
        {label}
      </span>
      <div className="text-sm font-bold text-base-content">
        {valA}<span className="text-xs font-normal text-neutral"> {labelA}</span>
        {"  "}
        {valB}<span className="text-xs font-normal text-neutral"> {labelB}</span>
      </div>
    </div>
  );
}

export function PersonalHealthStrip({ owner, currentDay, sprintDays, tasksDone, tasksPending, qaMet, qaPending, ticketsOpen, streak }: PersonalHealth) {
  return (
    <div className="border border-base-300 rounded-md overflow-hidden">
      <NavyHead label={owner} badge={`${currentDay} of ${sprintDays}`} badgeColor="var(--el-label)" />

      <div className="px-4 py-[14px] bg-base-100 flex gap-5 flex-wrap">
        <StatCell label="Tasks" valA={tasksDone} labelA="done" valB={tasksPending} labelB="pending" />
        <StatCell label="QA"    valA={qaMet}     labelA="met"  valB={qaPending}    labelB="pending" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-neutral uppercase tracking-[0.12em]">TICKETS</span>
          <span className={`text-sm font-bold ${ticketsOpen > 0 ? "text-warning" : "text-base-content"}`}>
            {ticketsOpen} <span className="text-xs font-normal text-neutral">open</span>
          </span>
        </div>
      </div>

      {streak > 0 && (
        <div className="px-4 py-2 bg-base-200 border-t border-base-300 flex items-center gap-1.5">
          <span className="text-[10px] text-success">●</span>
          <span className="text-xs text-neutral">
            <span className="font-bold text-base-content">{streak}</span>d consistent logging
          </span>
        </div>
      )}
    </div>
  );
}
