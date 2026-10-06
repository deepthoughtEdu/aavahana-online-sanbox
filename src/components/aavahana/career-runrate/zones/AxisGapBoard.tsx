'use client';

import { Badge } from '@/components/shared/Badge';
import type { AxisGapItem } from '@/types';

interface AxisGapBoardProps {
  gaps: AxisGapItem[];
  nextLevelName: string;
}

export function AxisGapBoard({ gaps, nextLevelName }: AxisGapBoardProps) {
  const blocked = gaps.filter((g) => g.hasCriteria && !g.cleared);
  const cleared = gaps.filter((g) => g.hasCriteria && g.cleared);
  const untracked = gaps.filter((g) => !g.hasCriteria);
  const priorityGap = [...blocked].sort((a, b) => b.gap - a.gap)[0];
  const nextAction = priorityGap ? actionForAxis(priorityGap.axis) : null;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">
          Path to {nextLevelName}
        </p>

        {priorityGap && nextAction && (
          <div className="mb-4 border-l-2 border-warning pl-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">Next action</p>
            <p className="mt-1 text-sm font-medium">{nextAction}</p>
            <p className="mt-1 text-xs opacity-60">
              Closes the largest gap: {priorityGap.label} needs {priorityGap.gap} more points.
            </p>
          </div>
        )}

        <div className="space-y-2.5">

          {/* Blocked axes */}
          {blocked.map((gap) => (
            <div
              key={gap.axis}
              className="rounded-xl border-2 border-warning/60 bg-warning/5 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                  <span className="font-semibold text-sm">{gap.label}</span>
                </div>
                <Badge variant="warning" size="sm" icon={null} label={`+${gap.gap} needed`} />
              </div>

              <div className="flex items-center gap-3 text-xs mb-2 opacity-60">
                <span>Current: <strong className="text-base-content">{gap.current}</strong></span>
                <span className="opacity-40">→</span>
                <span>{nextLevelName} needs: <strong className="text-base-content">{gap.required}</strong></span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-base-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full"
                  style={{ width: `${gap.fillPct}%` }}
                />
              </div>
            </div>
          ))}

          {/* Cleared axes */}
          {cleared.map((gap) => (
            <div
              key={gap.axis}
              className="rounded-xl border border-base-300 bg-base-200/40 p-3 opacity-55"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-success text-sm">✓</span>
                  <span className="text-sm">{gap.label}</span>
                  <span className="text-xs opacity-50">{gap.current}</span>
                </div>
                <Badge variant="success" size="sm" icon={null} label="Cleared" />
              </div>
            </div>
          ))}

          {/* Untracked axes */}
          {untracked.map((gap) => (
            <div
              key={gap.axis}
              className="rounded-xl border border-base-300 p-3 opacity-30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-base-300 flex-shrink-0" />
                  <span className="text-sm">{gap.label}</span>
                  <span className="text-xs opacity-50">{gap.current}</span>
                </div>
                <span className="text-xs opacity-60">No {nextLevelName} criteria set</span>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

function actionForAxis(axis: string): string {
  const actions: Record<string, string> = {
    deliverables: 'Complete and submit the highest-impact committed deliverable.',
    ip: 'Publish one verifiable IP contribution against this month\'s target.',
    kpis: 'Update the most at-risk KPI commitment with current evidence.',
    frameworks: 'Apply one framework and submit the usage claim for verification.',
    processes: 'Document one repeatable process improvement and its measured result.',
    rituals: 'Complete the next due operating ritual and record the outcome.',
  };
  return actions[axis] || 'Add verified evidence to the highest-gap career axis.';
}
