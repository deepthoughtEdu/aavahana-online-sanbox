'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, AlertCircleIcon } from '@/components/shared/icons';
import type { ReportStatus } from '@/types';

interface MonthOverviewProps {
  monthLabel: string;
  workingDays: number;
  availableHours: number;
  plannedHours: number;
  carryoverCount: number;
  carryoverHours: number;
  status: ReportStatus;
  onPrev: () => void;
  onNext: () => void;
}

const statusVariant: Record<ReportStatus, 'warning' | 'success' | 'info'> = {
  draft: 'warning',
  submitted: 'success',
  locked: 'info',
};

export function MonthOverview({
  monthLabel,
  workingDays,
  availableHours,
  plannedHours,
  carryoverCount,
  carryoverHours,
  status,
  onPrev,
  onNext,
}: MonthOverviewProps) {
  const allocationPct = availableHours > 0 ? Math.round((plannedHours / availableHours) * 100) : 0;
  const isOvercommitted = plannedHours > availableHours;

  return (
    <Section>
      <Section.Header
        icon={<CalendarIcon size="md" />}
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" shape="circle" iconBefore={<ChevronLeftIcon size="sm" />} onClick={onPrev} />
            <span>{monthLabel}</span>
            <Button variant="ghost" size="sm" shape="circle" iconBefore={<ChevronRightIcon size="sm" />} onClick={onNext} />
          </div>
        }
      >
        <Badge variant={statusVariant[status]} label={status} size="sm" />
      </Section.Header>
      <Section.Body>
        <div className="flex flex-wrap gap-6 text-sm">
          <span>{workingDays} working days</span>
          <span>~{availableHours}h available</span>
          <span>{plannedHours}h planned</span>
        </div>

        {carryoverCount > 0 && (
          <p className="text-sm text-base-content/60 mt-2">
            {carryoverCount} carryover{carryoverCount > 1 ? 's' : ''} from previous month ({carryoverHours}h)
          </p>
        )}

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <progress
              className={`progress w-full ${isOvercommitted ? 'progress-error' : 'progress-primary'}`}
              value={Math.min(allocationPct, 100)}
              max={100}
            />
            <span className="text-sm font-medium whitespace-nowrap">{allocationPct}% allocated</span>
          </div>
        </div>

        {isOvercommitted && (
          <div className="mt-2 flex items-center gap-2 text-error text-sm">
            <AlertCircleIcon size="sm" />
            <span>Overcommitted by {plannedHours - availableHours}h — consider deferring items</span>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
