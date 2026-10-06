"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { ByosService } from "@/lib/services/admin/byos.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";

const KEY = ["admin", "byos-status"] as const;

export function useByosStatus() {
  return useApi({ queryKey: KEY, queryFn: ByosService.getStatus });
}

export function useByosMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });

  // No success toast: the caller redirects the browser to the returned authUrl,
  // so the page navigates away. The "connected" toast fires on the OAuth return.
  const connect = useApiMutation({
    mutationFn: (_?: void) => ByosService.connect(),
  });

  const disconnect = useApiMutation({
    mutationFn: (_?: void) => ByosService.disconnect(),
    onSuccess: () => { toast.success("Google Drive disconnected"); inv(); },
  });

  return {
    connect: connect.mutateAsync,
    disconnect: disconnect.mutateAsync,
    isConnecting: connect.isPending,
    isDisconnecting: disconnect.isPending,
  };
}
