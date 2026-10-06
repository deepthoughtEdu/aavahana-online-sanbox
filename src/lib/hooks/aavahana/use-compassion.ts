import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { CompassionService } from "@/lib/services/aavahana/compassion.service";

// No retries that would silently resend a personal message. Release mutation
// variables when settled/unmounted; never persist this query/mutation family.
export function useSupportReply() {
  return useApiMutation({ mutationFn: CompassionService.respond, gcTime: 0, retry: false });
}

export function useSupportFollowUp(owner: string) {
  return useApi({
    queryKey: ["compassion-follow-up", owner], queryFn: CompassionService.followUp,
    enabled: !!owner, staleTime: 0, gcTime: 0, retry: false,
  });
}

export function useRememberSupport() {
  return useApiMutation({
    mutationFn: CompassionService.remember, gcTime: 0, retry: false,
    invalidateKeys: [["compassion-follow-up"]],
  });
}

export function useAnswerSupport() {
  return useApiMutation({
    mutationFn: CompassionService.answer, gcTime: 0, retry: false,
    invalidateKeys: [["compassion-follow-up"]],
  });
}
