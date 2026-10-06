/**
 * useFeedbackOverview — hook for the multi-member scoring overview table.
 *
 * Used by L2 (dept overview for L2_TO_L1) and L3 (program overview for L3_TO_L1).
 * scopeId = deptId for L2, programId for L3.
 */
import { useApi } from "@/lib/hooks/shared/use-api";
import { FeedbackService } from "@/lib/services/shared/feedback.service";
import type {
  FeedbackDirectionKey,
  MemberScoringStatus,
} from "@/types/shared/feedback.types";

export function useFeedbackOverview(
  directionKey: FeedbackDirectionKey,
  scopeId: string
) {
  const query = useApi({
    queryKey: ["feedback", "overview", directionKey, scopeId],
    queryFn: () => FeedbackService.getScoringOverview(directionKey, scopeId),
    enabled: !!directionKey && !!scopeId,
  });

  // After Fix 2.3, query.data is ProgramScoringOverview (not a plain array).
  // Extract the members array from it.
  const members = query.data?.members as MemberScoringStatus[] | undefined;

  return { ...query, data: members };
}
