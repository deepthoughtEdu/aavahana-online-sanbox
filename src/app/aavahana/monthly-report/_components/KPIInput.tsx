'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { ChartLineIcon } from '@/components/shared/icons';
import type { MonthlyKPICommit } from '@/types';

interface KPIInputProps {
  kpiCommits?: MonthlyKPICommit[];
  onUpdate: (kpiId: string, actualValue: string, status: MonthlyKPICommit['status']) => void;
  disabled: boolean;
}

// `reported` is server-computed and not offered as a manual choice: it means an
// actual was entered but the KPI has no usable target to judge it against, which
// is a property of the KPI's configuration, not something to pick from a list.
const statusOptions: MonthlyKPICommit['status'][] = ['hit', 'miss', 'partial', 'pending'];

const statusVariant: Record<MonthlyKPICommit['status'], 'success' | 'error' | 'warning' | 'info'> = {
  hit: 'success',
  miss: 'error',
  partial: 'warning',
  pending: 'info',
  reported: 'info',
};

export function KPIInput({ kpiCommits, onUpdate, disabled }: KPIInputProps) {
  const commits = kpiCommits ?? [];
  if (commits.length === 0) {
    return (
      <Section>
        <Section.Header icon={<ChartLineIcon size="md" />} title="KPIs" />
        <Section.Body>
          <p className="text-sm text-base-content/60">No KPIs configured for this month.</p>
        </Section.Body>
      </Section>
    );
  }

  return (
    <Section>
      <Section.Header icon={<ChartLineIcon size="md" />} title="KPIs" subtitle="Enter your actuals for this month" />
      <Section.Body>
        <div className="space-y-4">
          {commits.map((kpi) => {
            const target = parseFloat(kpi.targetValue) || 0;
            const actual = parseFloat(kpi.actualValue) || 0;
            const pct = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;

            return (
              <div key={kpi.kpiId} className="bg-base-200 rounded-btn p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{kpi.kpiName}</span>
                  <span className="text-xs text-base-content/60">Target: {kpi.targetValue} {kpi.unit}</span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-base-content/60">Actual:</span>
                    <input
                      type="number"
                      className="input input-bordered input-sm w-24"
                      value={kpi.actualValue}
                      onChange={(e) => onUpdate(kpi.kpiId, e.target.value, kpi.status)}
                      disabled={disabled}
                    />
                    <span className="text-xs text-base-content/60">{kpi.unit}</span>
                  </label>

                  <select
                    className="select select-bordered select-sm"
                    value={kpi.status}
                    onChange={(e) => onUpdate(kpi.kpiId, kpi.actualValue, e.target.value as MonthlyKPICommit['status'])}
                    disabled={disabled}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <progress className="progress progress-primary w-full" value={actual} max={target} />
                  <span className="text-xs font-medium whitespace-nowrap">{pct}%</span>
                  <Badge variant={statusVariant[kpi.status]} label={kpi.status} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </Section.Body>
    </Section>
  );
}
