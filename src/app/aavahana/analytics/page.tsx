'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Section } from '@/components/shared/Section';
import { ClockIcon } from '@/components/shared/icons';
import { useApi } from '@/lib/hooks/shared/use-api';
import { isError } from '@/lib/api/client';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { ReportService } from '@/lib/services/aavahana/report.service';
import { AnalyticsSection } from '@/components/aavahana/analytics/AnalyticsSection';

export default function AnalyticsPage() {
  const { data: weekInfo } = useApi({
    queryKey: ['analytics-week'],
    queryFn: () => WeeklyPlanService.getCurrentWeek(),
  });

  // Compute last 4 week starts (oldest → newest) from current week start
  const weekStarts = useMemo(() => {
    if (!weekInfo?.startDate) return [];
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(weekInfo.startDate + 'T12:00:00');
      d.setDate(d.getDate() - (3 - i) * 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    });
  }, [weekInfo?.startDate]);

  // Fetch all 4 weeks in parallel
  const trendResults = useQueries({
    queries: weekStarts.map((ws) => ({
      queryKey: ['analytics-trend', ws],
      queryFn: async () => {
        const result = await ReportService.getWeeklyReportV4(ws);
        if (isError(result)) return null;
        return result;
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const trendWeeks = weekStarts.map((ws, i) => ({
    weekStart: ws,
    snapshot: trendResults[i]?.data?.analyticsSnapshot ?? null,
  }));
  const trendLoading = trendResults.some((r) => r.isLoading);

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Time Patterns"
        subtitle="Your time is finite. How it splits across work types determines what you can actually deliver — not what you planned to deliver."
      />

      <div className="w-full px-4 sm:px-6 mt-4 space-y-4">
        <Section>
          <Section.Header
            icon={<ClockIcon size="sm" />}
            title="This Week's Allocation"
            subtitle="Every hour in coordination is an hour not in deep work. Every meeting without a decision is throughput lost. Look for the category that grew without you choosing it — that's your system's constraint speaking."
            size="sm"
          />
          <Section.Body>
            <AnalyticsSection
              weekStart={weekInfo?.startDate}
              mode="standalone"
            />
          </Section.Body>
        </Section>

        <Section>
          <Section.Header
            icon={<ClockIcon size="sm" />}
            title="4-Week Trend"
            subtitle="Time distribution patterns across the last 4 weeks"
            size="sm"
          />
          <Section.Body>
            <AnalyticsSection
              mode="trend"
              trendWeeks={trendWeeks}
              trendLoading={trendLoading}
            />
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
