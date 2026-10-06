import React from "react";
import { formatMins } from "@/types/aavahana/report-v5.types";
import type { SectionAGap, SectionATimeSummary } from "@/types/aavahana/report-v5.types";

interface GapSummaryProps {
  gap: SectionAGap;
  timeSummary: SectionATimeSummary;
}

export function GapSummary({ gap, timeSummary }: GapSummaryProps) {
  const allDone = gap.notDone === 0 && gap.partial === 0 && gap.unplanned === 0;

  const statusParts: string[] = [];
  if (gap.done > 0) statusParts.push(`${gap.done} done`);
  if (gap.partial > 0) statusParts.push(`${gap.partial} partial`);
  if (gap.notDone > 0) statusParts.push(`${gap.notDone} not done`);
  if (gap.unplanned > 0) statusParts.push(`${gap.unplanned} unplanned`);

  const overBudget = timeSummary.totalActualMins > timeSummary.budgetMins;

  return (
    <div className="mt-3 border-t border-base-300 pt-3 text-center">
      {allDone ? (
        <p className="text-sm text-success">Everything went to plan.</p>
      ) : (
        <p className="text-sm text-warning">{statusParts.join(" · ")}.</p>
      )}
      <p className={`mt-1 text-xs ${overBudget ? "text-warning" : "text-neutral"}`}>
        Budget: {formatMins(timeSummary.budgetMins)} → Actual: {formatMins(timeSummary.totalActualMins)}
        {timeSummary.unplannedMins > 0 && (
          <span> (planned {formatMins(timeSummary.plannedActualMins)} + unplanned {formatMins(timeSummary.unplannedMins)})</span>
        )}
      </p>
    </div>
  );
}
