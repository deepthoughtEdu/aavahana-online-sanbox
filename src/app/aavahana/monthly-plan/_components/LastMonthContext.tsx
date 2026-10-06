'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { ChartLineIcon } from '@/components/shared/icons';
import type { MonthlyPlanContext } from '@/types/aavahana/monthly-plan.types';

interface LastMonthContextProps {
  context?: MonthlyPlanContext;
}

/**
 * Spec: "Read-Only Context (from Last Month's Report)". Awareness only, never
 * inputs, which is why nothing here is clickable. Renders nothing at all when
 * there is no prior month, rather than showing a row of zeroes that reads like
 * a bad result instead of an absent one.
 */
export function LastMonthContext({ context }: LastMonthContextProps) {
  if (!context) return null;

  const { kpiMisses, systemicConstraints, carryForwardCount, prevMonthId } = context;
  const hasSignal =
    kpiMisses.length > 0 || systemicConstraints.length > 0 || carryForwardCount > 0;
  if (!hasSignal) return null;

  return (
    <Section>
      <Section.Header
        icon={<ChartLineIcon size="md" />}
        title="Carried in from last month"
        subtitle={`Signals from ${prevMonthId} — context, not tasks`}
      />
      <Section.Body>
        <div className="space-y-3">
          {kpiMisses.length > 0 && (
            <div>
              <p className="text-xs font-medium text-base-content/70 mb-1.5">KPIs missed</p>
              <div className="flex flex-wrap gap-1.5">
                {kpiMisses.map(k => (
                  <Badge key={k.kpiId} variant="warning" label={k.kpiName} size="sm" />
                ))}
              </div>
            </div>
          )}

          {systemicConstraints.length > 0 && (
            <div>
              <p className="text-xs font-medium text-base-content/70 mb-1.5">
                Structural blockers
                <span className="font-normal text-base-content/50">
                  {' '}— named in 3+ weeks, so not just friction
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {systemicConstraints.map(c => (
                  <Badge
                    key={c.name}
                    variant="error"
                    label={`${c.name} · ${c.weeks} weeks`}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {carryForwardCount > 0 && (
            <div>
              <p className="text-xs font-medium text-base-content/70 mb-1.5">Capacity signal</p>
              <p className="text-sm text-base-content/70">
                {carryForwardCount} deliverable{carryForwardCount === 1 ? '' : 's'} did not finish
                last month. Worth checking this month is not planned the same way.
              </p>
            </div>
          )}
        </div>
      </Section.Body>
    </Section>
  );
}
