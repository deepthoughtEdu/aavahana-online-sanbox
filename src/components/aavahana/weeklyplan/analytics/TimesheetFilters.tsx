'use client';

import { Button } from '@/components/shared/Button';
import { Section } from '@/components/shared/Section';
import { DownloadIcon } from '@/components/shared/icons';
import { Filter } from 'lucide-react';
import type { FilterPeriod, TimeAllocation } from './analytics.utils';

interface TimesheetFiltersProps {
  filterPeriod: FilterPeriod;
  timeAllocation: TimeAllocation;
  onPeriodChange: (p: FilterPeriod) => void;
}

export function TimesheetFilters({
  filterPeriod,
  timeAllocation,
  onPeriodChange,
}: TimesheetFiltersProps) {
  const totalTracked = Object.values(timeAllocation.allocation).reduce(
    (sum, h) => sum + h,
    0
  );

  return (
    <Section>
      <Section.Header icon={<Filter className="w-5 h-5" />} title="Time Period Filter">
        <div className="flex items-center gap-3">
          <div className="btn-group">
            {(['week', 'month', 'custom'] as FilterPeriod[]).map((p) => (
              <Button
                key={p}
                color={filterPeriod === p ? 'primary' : 'neutral'}
                variant={filterPeriod === p ? undefined : 'ghost'}
                size="sm"
                onClick={() => onPeriodChange(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
          <Button color="primary" variant="ghost" size="sm">
            <DownloadIcon size="sm" />
            Export CSV
          </Button>
        </div>
      </Section.Header>

      {filterPeriod !== 'week' && (
        <Section.Body>
          <p className="text-sm dt-text-muted italic">
            Showing {filterPeriod} view with {totalTracked} total hours tracked.
          </p>
        </Section.Body>
      )}
    </Section>
  );
}
