'use client';

import { Badge } from '@/components/shared/Badge';
import { FileAsImprovementObject } from '@/components/hcd/FileAsImprovementObject';
import type { MonthlyConstraintSummary } from '@/types';

interface ConstraintPatternsProps {
  data: MonthlyConstraintSummary | null;
}

export function ConstraintPatterns({ data }: ConstraintPatternsProps) {
  if (!data) {
    return (
      <p className="text-sm text-base-content/50 text-center py-4">
        Constraint pattern analysis not yet available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Raised" value={data.raised} />
        <StatCard label="Resolved" value={data.resolved} />
        <StatCard label="Open" value={data.open} variant={data.open > 0 ? 'error' : undefined} />
        <StatCard label="Resolution" value={`${data.resolutionRate}%`} />
      </div>

      {/* Resolution time */}
      {data.avgResolutionDays > 0 && (
        <p className="text-xs text-base-content/60">
          Avg resolution: {data.avgResolutionDays} days
        </p>
      )}

      {/* Longest open */}
      {data.longestOpen && (
        <div className="flex items-center gap-2 text-xs text-error">
          <span className="font-medium">Longest open:</span>
          <span>{data.longestOpen.description} ({data.longestOpen.ageDays} days)</span>
        </div>
      )}

      {/* Recurring patterns */}
      {(data.recurringPatterns ?? []).length > 0 && (
        <div>
          <p className="text-xs text-base-content/50 uppercase tracking-wide mb-2">Recurring Patterns</p>
          <ul className="space-y-2">
            {(data.recurringPatterns ?? []).map((p) => (
              <li key={p.type} className="bg-base-200 rounded-lg px-3 py-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium">{p.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-base-content/50 ml-2">
                      {p.occurrences}x across {p.weeksAppeared} week{p.weeksAppeared !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {p.topMicro && (
                    <Badge variant="ghost" size="sm" label={p.topMicro.replace(/_/g, ' ')} />
                  )}
                </div>
                {/* A recurring pattern can be filed as a Spotted Improvement Object. */}
                <FileAsImprovementObject
                  sourceType="monthly_report"
                  defaultTitle={p.type.replace(/_/g, ' ')}
                  cta="File as improvement"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: string | number; variant?: 'error' }) {
  return (
    <div className="bg-base-200 rounded-lg px-3 py-2 text-center">
      <p className={`text-lg font-bold ${variant === 'error' ? 'text-error' : ''}`}>{value}</p>
      <p className="text-xs text-base-content/50">{label}</p>
    </div>
  );
}
