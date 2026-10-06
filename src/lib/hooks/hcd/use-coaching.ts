import { useMutation } from "@tanstack/react-query";
import {
  HcdCoachingService,
  type CoachingRequest,
  type CoachingFeedback,
  type FrameworkSuggestion,
} from "@/lib/services/hcd/coaching.service";
import { isError } from "@/lib/api/client";
import type { HcdByokConfig } from "@/lib/store/hcd/hcd-byok.store";

export function useCoaching() {
  return useMutation<CoachingFeedback, Error, CoachingRequest>({
    mutationFn: async (data) => {
      const res = await HcdCoachingService.getForResponse(data);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

// Writes nothing — it analyses the latest weekly report on demand, so there is
// no query key to invalidate. Pass null to use the key saved on the account.
export function useSuggestFramework() {
  return useMutation<FrameworkSuggestion, Error, HcdByokConfig | null>({
    mutationFn: async (byok) => {
      const res = await HcdCoachingService.suggestFramework(byok);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
