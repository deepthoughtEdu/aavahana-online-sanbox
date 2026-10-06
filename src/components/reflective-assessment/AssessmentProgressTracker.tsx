"use client";

import type { ActivityRegistration } from "./types";

interface AssessmentProgressTrackerProps {
  activities: ActivityRegistration[];
  currentId: number;
  completedIds: Set<number>;
  onNavigate: (id: number) => void;
  showConsolidated?: boolean;
  onShowConsolidated?: () => void;
}

export default function AssessmentProgressTracker({
  activities,
  currentId,
  completedIds,
  onNavigate,
  showConsolidated,
  onShowConsolidated,
}: AssessmentProgressTrackerProps) {
  const hasAnyCompleted = completedIds.size > 0;
  const total = activities.length;

  let highestCompletedIndex = -1;
  for (const id of completedIds) {
    const idx = activities.findIndex((a) => a.meta.id === id);
    if (idx > highestCompletedIndex) highestCompletedIndex = idx;
  }
  const progressPct = total > 1 ? ((highestCompletedIndex + 1) / (total - 1)) * 100 : 0;

  const currentMeta = activities.find((a) => a.meta.id === currentId)?.meta;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center justify-between relative">
            <div className="absolute top-1/2 left-4 right-4 h-px bg-slate-700 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-4 h-px bg-blue-500 -translate-y-1/2 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />

            {activities.map((reg) => {
              const isCompleted = completedIds.has(reg.meta.id);
              const isCurrent = reg.meta.id === currentId && !showConsolidated;

              return (
                <button
                  key={reg.meta.id}
                  onClick={() => onNavigate(reg.meta.id)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                    isCompleted
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : isCurrent
                        ? "bg-slate-950 text-blue-400 ring-2 ring-blue-500 animate-pulse"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                  title={reg.meta.name}
                >
                  {isCompleted ? "✓" : reg.meta.id}
                </button>
              );
            })}
          </div>

          <button
            onClick={onShowConsolidated}
            disabled={!hasAnyCompleted}
            className={`relative z-10 shrink-0 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
              showConsolidated
                ? "bg-blue-600 text-white"
                : hasAnyCompleted
                  ? "border border-slate-600 text-slate-300 cursor-pointer hover:border-blue-500 hover:text-blue-300"
                  : "border border-slate-800 text-slate-600 cursor-not-allowed"
            }`}
          >
            My Scores
          </button>
        </div>

        <div className="text-center mt-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono">
            {showConsolidated ? "Full Report" : currentMeta?.name ?? ""}
          </span>
        </div>
      </div>
    </div>
  );
}
