'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, AlertCircleIcon } from '@/components/shared/icons';
import { MissingDaysAlert } from '@/app/aavahana/weekly-report/_components/MissingDaysAlert';
import type { ReportStatus } from '@/types';

interface MonthOverviewProps {
  monthLabel: string;
  weeklySubmitted: number;
  weeklyTotal: number;
  dailySubmitted: number;
  dailyTotal: number;
  status: ReportStatus;
  missingDays: string[];
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
  weeklySubmitted,
  weeklyTotal,
  dailySubmitted,
  dailyTotal,
  status,
  missingDays,
  onPrev,
  onNext,
}: MonthOverviewProps) {
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
          <span>{weeklySubmitted}/{weeklyTotal} weekly reports</span>
          <span>{dailySubmitted}/{dailyTotal} daily reports</span>
        </div>
        {missingDays.length > 0 && (
          <div className="mt-3">
            <MissingDaysAlert days={missingDays} />
          </div>
        )}
        {weeklySubmitted < weeklyTotal && (
          <div className="mt-3 flex items-center gap-2 text-warning text-sm">
            <AlertCircleIcon size="sm" />
            <span>{weeklyTotal - weeklySubmitted} weekly report(s) not yet submitted</span>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
