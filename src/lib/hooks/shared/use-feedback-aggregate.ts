/**
 * useFeedbackAggregate — hook for viewing anonymous received feedback.
 *
 * Used by L2 (viewing L1_TO_L2 aggregate) and L3 (viewing L1_TO_L3 aggregate).
 */
import { useApi } from "@/lib/hooks/shared/use-api";
import { FeedbackService } from "@/lib/services/shared/feedback.service";
import type {
  FeedbackDirectionKey,
} from "@/types/shared/feedback.types";

export function useFeedbackAggregate(
  directionKey: FeedbackDirectionKey,
  targetId: string,
  period?: string
) {
  return useApi({
    queryKey: ["feedback", "aggregate", directionKey, targetId, period],
    queryFn: () => FeedbackService.getAggregate(directionKey, targetId, period),
    enabled: !!directionKey && !!targetId,
  });
}
