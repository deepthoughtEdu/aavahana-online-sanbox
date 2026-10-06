"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { LabelService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { LabelType, CreateLabelPayload } from "@/types/admin";

const BASE_KEY = ["admin", "labels"] as const;

export function useAdminLabels(params?: { type?: LabelType }) {
  return useApi({
    queryKey: [...BASE_KEY, params],
    queryFn: () => LabelService.list(params),
  });
}

export function useLabelMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: BASE_KEY });
  const create = useApiMutation({
    mutationFn: (p: CreateLabelPayload) => LabelService.create(p),
    onSuccess: () => { toast.success("Label created"); inv(); },
  });
  const approve = useApiMutation({
    mutationFn: (id: number) => LabelService.approve(id),
    onSuccess: () => { toast.success("Label approved"); inv(); },
  });
  const retire = useApiMutation({
    mutationFn: (id: number) => LabelService.retire(id),
    onSuccess: () => { toast.success("Label retired"); inv(); },
  });
  return { create: create.mutateAsync, approve: approve.mutateAsync, retire: retire.mutateAsync, isCreating: create.isPending };
}
