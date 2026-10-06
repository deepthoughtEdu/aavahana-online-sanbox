import React from "react";
import { cn } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";
import type { FeedbackSubmission } from "@/types/shared/feedback.types";

interface ScoreHistoryProps {
  history: FeedbackSubmission[];
  className?: string;
}

export function ScoreHistory({ history, className }: ScoreHistoryProps) {
  if (!Array.isArray(history) || history.length === 0) return null;

  return (
    <div className={cn("bg-white rounded-xl border border-base-300 overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-base-300">
        <h3 className="text-sm font-semibold text-black">Your Reflections</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-base-200 text-xs font-semibold dt-text-muted uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left">Period</th>
              <th className="px-4 py-2.5 text-left">Target</th>
              <th className="px-4 py-2.5 text-left">Score</th>
              <th className="px-4 py-2.5 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id} className="border-t border-[var(--dt-borderSubtle)] hover:bg-[var(--dt-surfaceAlt)] transition-colors">
                <td className="px-4 py-3 font-medium text-black">{entry.period}</td>
                <td className="px-4 py-3 dt-text-muted">{entry.targetId}</td>
                <td className="px-4 py-3 font-bold text-black">
                  {entry.composite != null ? Number(entry.composite).toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--dt-textDim)]">
                  {formatDate(entry.submittedAt, "displayDate")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
