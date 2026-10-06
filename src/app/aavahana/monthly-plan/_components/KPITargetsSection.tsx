'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { ChartLineIcon } from '@/components/shared/icons';
import type { ProgramKPI } from '@/types/aavahana/monthly-plan.types';

interface KPITargetsSectionProps {
  kpis: ProgramKPI[];
  /** kpiId -> this employee's individual commit for the month. */
  targets: Record<string, number | null>;
  onSetTarget: (kpiId: string, value: number | null) => void;
  disabled?: boolean;
}

/**
 * Spec Axis 3. Program KPIs are shared: several people commit against the same
 * one. The program target is org config and stays read-only; what the employee
 * enters here is their own contribution, which the monthly report reconciles
 * actual against.
 */
export function KPITargetsSection({ kpis, targets, onSetTarget, disabled }: KPITargetsSectionProps) {
  if (kpis.length === 0) {
    return (
      <Section>
        <Section.Header icon={<ChartLineIcon size="md" />} title="KPI Targets" />
        <Section.Body>
          <p className="text-sm text-base-content/60">No program KPIs configured.</p>
        </Section.Body>
      </Section>
    );
  }

  // Only a KPI with a real id can carry a commitment, so an unidentified row is
  // not counted as outstanding either — it would make the badge unreachable.
  const identified = kpis.filter(k => !!k.kpiId);
  const committed = identified.filter(k => targets[String(k.kpiId)] != null).length;

  return (
    <Section>
      <Section.Header
        icon={<ChartLineIcon size="md" />}
        title="KPI Targets"
        subtitle="Your individual commit against each shared program KPI"
      >
        <Badge
          variant={committed === identified.length ? 'success' : 'warning'}
          label={`${committed}/${identified.length} committed`}
          size="sm"
        />
      </Section.Header>
      <Section.Body>
        <div className="space-y-2">
          {kpis.map((kpi, index) => {
            // `key` doubles as the identity React lists on AND the lookup into
            // `targets`, so it must never collapse to "undefined" for more than
            // one row. A caller handing over an unmapped payload once made every
            // row share that string; fall back to the index so the list stays
            // renderable, and keep the target lookup on the real id only.
            const kpiId = kpi.kpiId ? String(kpi.kpiId) : '';
            const key = kpiId || `kpi-${index}`;
            const value = kpiId ? targets[kpiId] : null;
            return (
              <div
                key={key}
                className="flex flex-wrap items-center gap-3 bg-base-200 rounded-btn px-3 py-3"
              >
                <div className="flex-1 min-w-48">
                  <p className="text-sm font-medium">{kpi.kpiName}</p>
                  <p className="text-xs text-base-content/60">
                    Program target {kpi.targetValue || '—'} {kpi.unit}
                    {kpi.memberCount != null && (
                      <>
                        {' · '}shared with {kpi.memberCount} member
                        {kpi.memberCount === 1 ? '' : 's'}
                      </>
                    )}
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-base-content/70 whitespace-nowrap">My target</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input input-sm input-bordered w-24"
                    value={value ?? ''}
                    // Without an id there is nowhere to file the commitment —
                    // writing under the index fallback would persist a target
                    // keyed to a position, which the report cannot reconcile.
                    disabled={disabled || !kpiId}
                    placeholder="—"
                    aria-label={`My target for ${kpi.kpiName}`}
                    onChange={(e) => {
                      if (!kpiId) return;
                      const raw = e.target.value;
                      // Empty clears the commitment. Storing 0 instead would read
                      // as "committed to zero", which is a different statement.
                      if (raw === '') {
                        onSetTarget(kpiId, null);
                        return;
                      }
                      const n = Number(raw);
                      if (Number.isFinite(n)) onSetTarget(kpiId, n);
                    }}
                  />
                  <span className="text-xs text-base-content/60 w-10">{kpi.unit}</span>
                </label>
              </div>
            );
          })}
        </div>
      </Section.Body>
    </Section>
  );
}
