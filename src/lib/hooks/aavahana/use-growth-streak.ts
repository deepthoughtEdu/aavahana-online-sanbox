import { useApi } from "@/lib/hooks/shared/use-api";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";

/**
 * The seed-to-plant growth streak, shared by the daily plan and daily report
 * headers. Cached briefly so switching between the two screens does not refetch.
 */
export function useGrowthStreak() {
  return useApi({
    queryKey: ["v7-growth-streak"],
    queryFn: () => ReportV7Service.getStreak(),
    staleTime: 60_000,
  });
}
