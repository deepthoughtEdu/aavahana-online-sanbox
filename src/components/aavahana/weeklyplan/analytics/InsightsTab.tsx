'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { Section } from '@/components/shared/Section';
import { Button } from '@/components/shared/Button';
import { ChartLineIcon, CalendarIcon, DownloadIcon } from '@/components/shared/icons';
import { TrendingUp } from 'lucide-react';
import { TimeAllocationCard } from './TimeAllocationCard';
import { ValueCreationSection } from './ValueCreationSection';
import { ValueFeedbackPanel } from './ValueFeedbackPanel';
import {
  computeTimeAllocation,
  computeProgressStatus,
  toPercent,
  WEEKLY_HOUR_TARGET,
} from './analytics.utils';
import type { TimesheetEntry } from './analytics.utils';
import type { TimeCategory, ValueFeedbackSuggestion } from '@/types/aavahana/weekly-plan.types';

interface InsightsTabProps {
  timesheetEntries: TimesheetEntry[];
  categories: TimeCategory[];
  feedbackSuggestions: ValueFeedbackSuggestion[];
  valueSummary: string;
  insightsTotalHours: number;
}

export function InsightsTab({
  timesheetEntries,
  categories,
  feedbackSuggestions,
  valueSummary,
  insightsTotalHours,
}: InsightsTabProps) {
  const { timeAllocation, totalHours, progressPercent, progressStatus } = useMemo(() => {
    const allocation = computeTimeAllocation(timesheetEntries, 'week');
    const hours = Math.max(0, allocation.total);
    const pct = toPercent(hours, WEEKLY_HOUR_TARGET);
    return { timeAllocation: allocation, totalHours: hours, progressPercent: pct, progressStatus: computeProgressStatus(pct) };
  }, [timesheetEntries]);

  return (
    <motion.div
      key="insights"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex flex-col gap-4 md:gap-3 lg:gap-2')}
    >
      {/* Time Allocation Overview */}
      <Section className="!p-2 md:!p-3 lg:!p-4">
        <Section.Header
          icon={<TrendingUp className="w-5 h-5" />}
          title="Time Allocation This Week"
        />
        <Section.Body>
          <TimeAllocationCard
            totalHours={totalHours}
            targetHours={WEEKLY_HOUR_TARGET}
            progressPercent={progressPercent}
            progressStatus={progressStatus}
            progressValue={Math.min(totalHours, WEEKLY_HOUR_TARGET)}
            timeAllocation={timeAllocation}
          />
        </Section.Body>
      </Section>

      {/* Value + Feedback — side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Value Created by Category */}
        <Section className="!p-2 md:!p-3 lg:!p-4">
          <Section.Header icon={<ChartLineIcon size="md" />} title="Value Created by Category">
            <Button color="primary" variant="ghost" size="sm">
              <DownloadIcon size="sm" />
              Export
            </Button>
          </Section.Header>
          <Section.Body>
            <ValueCreationSection
              categories={categories}
              totalHours={insightsTotalHours}
              valueSummary={valueSummary}
            />
          </Section.Body>
        </Section>

        {/* Maximise Your Impact */}
        <Section className="!p-2 md:!p-3 lg:!p-4">
          <Section.Header icon={<CalendarIcon size="md" />} title="Maximise Your Impact" />
          <Section.Body>
            <ValueFeedbackPanel suggestions={feedbackSuggestions} />
          </Section.Body>
        </Section>
      </div>
    </motion.div>
  );
}
