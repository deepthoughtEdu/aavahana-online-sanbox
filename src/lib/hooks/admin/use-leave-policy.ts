"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { LeavePolicyService } from "@/lib/services/admin";
import { toast } from "@/utils";
import type { UpsertLeavePolicyPayload } from "@/types/admin";

const POLICY_KEY = ["leave-policy"] as const;

export function useLeavePolicy(year?: number) {
  return useApi({
    queryKey: [...POLICY_KEY, year ?? "current"],
    queryFn: () => LeavePolicyService.getPolicy(year),
  });
}

export function useLeavePolicyMutations() {
  const upsert = useApiMutation({
    mutationFn: (payload: UpsertLeavePolicyPayload) =>
      LeavePolicyService.upsertPolicy(payload),
    invalidateKeys: [[...POLICY_KEY]],
    onSuccess: () => {
      toast.success("Leave policy saved");
    },
  });

  return {
    upsertPolicy: upsert.mutateAsync,
    isSaving: upsert.isPending,
  };
}
