import { useApi } from '@/lib/hooks/shared/use-api';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { useWeeklyReportV4 } from '@/lib/hooks/aavahana/use-weekly-report-v4';
import { useUBS } from '@/lib/hooks/aavahana/use-ubs';
import { useCareerRunrate } from '@/lib/hooks/aavahana/use-career-runrate';
import { useEventLoop } from '@/lib/hooks/shared/use-event-loop';

// TODO: replace with real programId from auth/route context
const DEFAULT_PROGRAM_ID = '1';

export function useWeeklyReportPageData() {
  // Current week info (for weekStart derivation)
  const { data: weekInfo } = useApi({
    queryKey: ['weekly-report-week'],
    queryFn: () => WeeklyPlanService.getCurrentWeek(),
  });

  const weekStart = weekInfo?.startDate ?? '';

  // V4 report: 6-axis, analytics snapshot, happiness, narrative, status
  const v4 = useWeeklyReportV4(weekStart);

  // UBS engagement score
  const ubs = useUBS();

  // Career Runrate
  const career = useCareerRunrate();

  // Event loop (for constraint log)
  const { data: eventLoop, isLoading: eventLoopLoading } = useEventLoop(DEFAULT_PROGRAM_ID);

  const isLoading = !weekInfo || v4.isLoading || ubs.isLoading || career.isLoading || eventLoopLoading;

  return {
    weekStart,
    weekLabel: weekInfo
      ? `Week ${weekInfo.weekNumber}`
      : '',
    report: v4.report,
    happiness: v4.happiness,
    setHappiness: v4.setHappiness,
    narrative: v4.narrative,
    submitReport: v4.submitReport,
    isSubmitting: v4.isSubmitting,
    ubs,
    runrateData: career.data,
    eventLoop,
    isLoading,
  };
}
