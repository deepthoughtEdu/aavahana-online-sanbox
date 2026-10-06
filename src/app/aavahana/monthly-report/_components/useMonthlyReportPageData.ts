'use client';

import { useMonthlyReport } from '@/lib/hooks/aavahana/use-monthly-report';
import { useUBS } from '@/lib/hooks/aavahana/use-ubs';
import { useCareerRunrate } from '@/lib/hooks/aavahana/use-career-runrate';
import { useEventLoop } from '@/lib/hooks/shared/use-event-loop';

const DEFAULT_PROGRAM_ID = '1';

export function useMonthlyReportPageData(month: string) {
  const monthly = useMonthlyReport(month);
  const ubs = useUBS();
  const career = useCareerRunrate();
  const { data: eventLoop, isLoading: eventLoopLoading } = useEventLoop(DEFAULT_PROGRAM_ID);

  const isLoading = monthly.isLoading || ubs.isLoading || career.isLoading || eventLoopLoading;

  return {
    report: monthly.report,
    kpiCommits: monthly.kpiCommits,
    narrative: monthly.narrative,
    happiness: monthly.happiness,
    setHappiness: monthly.setHappiness,
    constraintPatterns: monthly.constraintPatterns,
    portfolio: monthly.portfolio,
    isSubmitting: monthly.isSubmitting,
    updateKPICommit: monthly.updateKPICommit,
    submitReport: monthly.submitReport,
    refresh: monthly.refresh,
    ubs,
    runrateData: career.data,
    snapshots: career.snapshots,
    eventLoop: eventLoop ?? null,
    isLoading,
    error: monthly.error,
  };
}
