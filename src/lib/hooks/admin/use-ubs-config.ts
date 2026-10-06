"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { UbsConfigService } from "@/lib/services/admin/ubs-config.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { UpsertUbsConfigPayload } from "@/types/admin";

const KEY = ["admin", "ubs-config"] as const;

export function useUbsMiniGroupConfig(miniGroupId: number) {
  return useApi({
    queryKey: [...KEY, "mini-group", miniGroupId],
    queryFn: () => UbsConfigService.getMiniGroupConfig(miniGroupId),
    enabled: miniGroupId > 0,
  });
}

export function useUbsConfigMutations() {
  const inv = (miniGroupId?: number) => {
    queryClient.invalidateQueries({ queryKey: KEY });
    if (miniGroupId) {
      queryClient.invalidateQueries({ queryKey: [...KEY, "mini-group", miniGroupId] });
    }
  };

  const upsert = useApiMutation({
    mutationFn: ({ miniGroupId, payload }: { miniGroupId: number; payload: UpsertUbsConfigPayload }) =>
      UbsConfigService.upsertMiniGroupConfig(miniGroupId, payload),
    onSuccess: (_data, vars) => {
      toast.success("UBS config saved");
      inv(vars.miniGroupId);
    },
  });

  const deactivate = useApiMutation({
    mutationFn: (miniGroupId: number) => UbsConfigService.deactivateMiniGroupConfig(miniGroupId),
    onSuccess: (_data, miniGroupId) => {
      toast.success("UBS config deactivated");
      inv(miniGroupId);
    },
  });

  return {
    upsert: upsert.mutateAsync,
    deactivate: deactivate.mutateAsync,
    isUpserting: upsert.isPending,
    isDeactivating: deactivate.isPending,
  };
}

export function useUbsHygieneScan() {
  return useApi({
    queryKey: [...KEY, "hygiene"],
    queryFn: UbsConfigService.getHygieneScan,
  });
}
