"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { CareerService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { SetCareerPlanPayload } from "@/types/admin";

export function useCareerPlan(userId: string) {
  return useApi({
    queryKey: ["admin", "career", userId],
    queryFn: () => CareerService.getPlan(userId),
    enabled: !!userId,
  });
}

export function useCareerMutations(userId: string) {
  const setPlan = useApiMutation({
    mutationFn: (payload: SetCareerPlanPayload) => CareerService.setPlan(userId, payload),
    onSuccess: () => { toast.success("Career plan saved"); queryClient.invalidateQueries({ queryKey: ["admin", "career", userId] }); },
  });
  return { setPlan: setPlan.mutateAsync, isSettingPlan: setPlan.isPending };
}
