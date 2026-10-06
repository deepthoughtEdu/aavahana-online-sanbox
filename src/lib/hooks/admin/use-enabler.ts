"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { EnablerService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { CreateEnablerPayload, UpdateEnablerPayload } from "@/types/admin";

const KEY = ["admin", "enablers"] as const;

export function useEnablers() {
  return useApi({ queryKey: KEY, queryFn: EnablerService.list });
}

export function useEnablerMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });
  const create = useApiMutation({
    mutationFn: (p: CreateEnablerPayload) => EnablerService.create(p),
    onSuccess: () => { toast.success("Enabler created"); inv(); },
  });
  const update = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEnablerPayload }) => EnablerService.update(id, payload),
    onSuccess: () => { toast.success("Enabler updated"); inv(); },
  });
  const toggle = useApiMutation({
    mutationFn: (id: number) => EnablerService.toggle(id),
    onSuccess: () => { inv(); },
  });
  return { create: create.mutateAsync, update: update.mutateAsync, toggle: toggle.mutateAsync, isCreating: create.isPending };
}
