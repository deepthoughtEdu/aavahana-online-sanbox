"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { GroupService } from "@/lib/services/admin/group.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { CreateGroupPayload, UpdateGroupPayload } from "@/types/admin";

const KEY = ["admin", "groups"] as const;

export function useGroups() {
  return useApi({ queryKey: KEY, queryFn: GroupService.list });
}

export function useGroup(id: number) {
  return useApi({
    queryKey: [...KEY, id],
    queryFn: () => GroupService.get(id),
    enabled: id > 0,
  });
}

export function useGroupMembers(groupId: number) {
  return useApi({
    queryKey: [...KEY, groupId, "members"],
    queryFn: () => GroupService.getMembers(groupId),
    enabled: groupId > 0,
  });
}

export function useGroupMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });

  const create = useApiMutation({
    mutationFn: (p: CreateGroupPayload) => GroupService.create(p),
    onSuccess: () => { toast.success("Group created"); inv(); },
  });

  const update = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGroupPayload }) =>
      GroupService.update(id, payload),
    onSuccess: () => { toast.success("Group updated"); inv(); },
  });

  const deactivate = useApiMutation({
    mutationFn: (id: number) => GroupService.deactivate(id),
    onSuccess: () => { toast.success("Group deactivated"); inv(); },
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    deactivate: deactivate.mutateAsync,
    isCreating: create.isPending,
  };
}
