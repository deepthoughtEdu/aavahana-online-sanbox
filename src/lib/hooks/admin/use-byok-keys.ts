"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { ByokKeysService } from "@/lib/services/admin/byok-keys.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { StoreByokKeyPayload, SetByokKeyLimitsPayload } from "@/types/admin";

const KEY = ["admin", "byok-keys"] as const;
const HEADROOM_KEY = ["admin", "byok-keys", "headroom"] as const;

export function useByokKeys() {
  return useApi({ queryKey: KEY, queryFn: ByokKeysService.list });
}

/** Keys with today's consumption. Refetched on focus: a meter moves all day. */
export function useByokKeysWithHeadroom() {
  return useApi({ queryKey: HEADROOM_KEY, queryFn: ByokKeysService.listWithHeadroom });
}

export function useByokKeyMutations() {
  const inv = () => {
    queryClient.invalidateQueries({ queryKey: KEY });
    queryClient.invalidateQueries({ queryKey: HEADROOM_KEY });
  };

  const store = useApiMutation({
    mutationFn: (p: StoreByokKeyPayload) => ByokKeysService.store(p),
    onSuccess: () => { toast.success("API key stored"); inv(); },
  });

  const deactivate = useApiMutation({
    mutationFn: (id: number) => ByokKeysService.deactivate(id),
    onSuccess: () => { toast.success("API key deactivated"); inv(); },
  });

  const rotate = useApiMutation({
    mutationFn: ({ id, apiKey }: { id: number; apiKey: string }) => ByokKeysService.rotate(id, apiKey),
    onSuccess: () => { toast.success("API key rotated"); inv(); },
  });

  const setLimits = useApiMutation({
    mutationFn: ({ id, limits }: { id: number; limits: SetByokKeyLimitsPayload }) =>
      ByokKeysService.setLimits(id, limits),
    onSuccess: () => { toast.success("Limits saved"); inv(); },
  });

  return {
    setLimits: setLimits.mutateAsync,
    isSavingLimits: setLimits.isPending,
    store: store.mutateAsync,
    deactivate: deactivate.mutateAsync,
    rotate: rotate.mutateAsync,
    isStoring: store.isPending,
    isDeactivating: deactivate.isPending,
    isRotating: rotate.isPending,
  };
}
