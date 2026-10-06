'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { ListCheckIcon } from '@/components/shared/icons';
import type { UnplannedSummary } from '@/types';

interface UnplannedSummaryPanelProps {
  unplanned?: UnplannedSummary;
}

/** Why the work arrived, in the person's own words at the time they logged it. */
const SOURCE_LABEL: Record<string, string> = {
  interruption: 'Interruptions',
  opportunity: 'Opportunities',
  constraint_shift: 'Constraint shifts',
  helping_others: 'Helping others',
  unspecified: 'Unspecified',
};

/**
 * Spec A2 — Unplanned Work Summary.
 *
 * These rows were being written on every submit and never read back at month
 * scale, so nothing showed what actually displaced the plan. Grouped by source
 * because the hours alone do not distinguish an interruption from an
 * opportunity, and those call for opposite responses.
 */
export function UnplannedSummaryPanel({ unplanned }: UnplannedSummaryPanelProps) {
  // Nothing unplanned is a real and good result, but an empty panel reads as
  // missing data rather than a clean month. Say it in words instead.
  if (!unplanned || unplanned.totalItems === 0) {
    return (
      <Section>
        <Section.Header icon={<ListCheckIcon size="md" />} title="Unplanned work" />
        <Section.Body>
          <p className="text-sm text-base-content/60">
            Nothing logged as unplanned this month — the plan held.
          </p>
        </Section.Body>
      </Section>
    );
  }

  const entries = Object.entries(unplanned.bySource)
    .sort(([, a], [, b]) => b.minutes - a.minutes);

  return (
    <Section>
      <Section.Header
        icon={<ListCheckIcon size="md" />}
        title="Unplanned work"
        subtitle="What displaced the plan"
      >
        <Badge variant="warning" label={`${unplanned.totalHours}h`} size="sm" />
      </Section.Header>
      <Section.Body>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-32">
            <div className="stat-title text-xs">Items</div>
            <div className="stat-value text-lg">{unplanned.totalItems}</div>
          </div>
          <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-32">
            <div className="stat-title text-xs">Hours</div>
            <div className="stat-value text-lg">{unplanned.totalHours}</div>
          </div>
        </div>

        <div className="space-y-2">
          {entries.map(([source, v]) => (
            <div
              key={source}
              className="flex items-center justify-between bg-base-200 rounded-btn px-3 py-2"
            >
              <span className="text-sm">{SOURCE_LABEL[source] ?? source}</span>
              <span className="text-xs text-base-content/60">
                {v.items} item{v.items === 1 ? '' : 's'} ·{' '}
                {Math.round((v.minutes / 60) * 10) / 10}h
              </span>
            </div>
          ))}
        </div>
      </Section.Body>
    </Section>
  );
}
