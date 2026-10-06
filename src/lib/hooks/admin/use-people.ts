"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { PeopleService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { PeopleListParams } from "@/types/admin";

const KEY = ["admin", "people"] as const;

export function usePeople(params?: PeopleListParams, enabled = true) {
  return useApi({
    queryKey: [...KEY, params],
    queryFn: () => PeopleService.listAll(params),
    staleTime: 1000 * 60 * 2,
    enabled,
  });
}

export function usePeopleMutations() {
  const inv = () => {
    queryClient.invalidateQueries({ queryKey: KEY });
    queryClient.invalidateQueries({ queryKey: ["admin", "org-tree"] });
  };

  const offboard = useApiMutation({
    mutationFn: (eid: number) => PeopleService.offboard(eid),
    onSuccess: () => { toast.success("Employee offboarded"); inv(); },
  });

  const toggleSupervisor = useApiMutation({
    mutationFn: (eid: number) => PeopleService.toggleSupervisor(eid),
    onSuccess: () => { toast.success("Supervisor status updated"); inv(); },
  });

  return {
    offboard: offboard.mutateAsync,
    toggleSupervisor: toggleSupervisor.mutateAsync,
    isUpdating: offboard.isPending || toggleSupervisor.isPending,
  };
}
