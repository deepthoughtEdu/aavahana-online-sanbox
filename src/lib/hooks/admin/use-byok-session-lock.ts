"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { ByokSessionLockService } from "@/lib/services/admin/byok-session-lock.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";

const KEY = ["admin", "byok-session-lock"] as const;

export function useByokSessionLockStatus() {
  return useApi({ queryKey: KEY, queryFn: ByokSessionLockService.getStatus });
}

export function useByokSessionLockMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });

  const enable = useApiMutation({
    mutationFn: (passphrase: string) => ByokSessionLockService.enable(passphrase),
    onSuccess: () => { toast.success("Session lock enabled"); inv(); },
  });

  const disable = useApiMutation({
    mutationFn: (passphrase: string) => ByokSessionLockService.disable(passphrase),
    onSuccess: () => { toast.success("Session lock disabled"); inv(); },
  });

  const unlock = useApiMutation({
    mutationFn: (passphrase: string) => ByokSessionLockService.unlock(passphrase),
    onSuccess: () => { toast.success("Session unlocked"); inv(); },
  });

  const lock = useApiMutation({
    mutationFn: (_?: void) => ByokSessionLockService.lock(),
    onSuccess: () => { toast.success("Session locked"); inv(); },
  });

  return {
    enable: enable.mutateAsync,
    disable: disable.mutateAsync,
    unlock: unlock.mutateAsync,
    lock: lock.mutateAsync,
    isEnabling: enable.isPending,
    isDisabling: disable.isPending,
    isUnlocking: unlock.isPending,
    isLocking: lock.isPending,
  };
}
