"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { ByokGroupsService } from "@/lib/services/admin/byok-groups.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { CreateByokGroupPayload, UpdateByokGroupPayload, AddGroupMemberPayload } from "@/types/admin";

const KEY = ["admin", "byok-groups"] as const;

export function useByokGroups() {
  return useApi({ queryKey: KEY, queryFn: ByokGroupsService.list });
}

export function useByokGroup(id: number) {
  return useApi({
    queryKey: [...KEY, id],
    queryFn: () => ByokGroupsService.get(id),
    enabled: id > 0,
  });
}

export function useByokGroupMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });

  const create = useApiMutation({
    mutationFn: (p: CreateByokGroupPayload) => ByokGroupsService.create(p),
    onSuccess: () => { toast.success("Group created"); inv(); },
  });

  const update = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateByokGroupPayload }) =>
      ByokGroupsService.update(id, payload),
    onSuccess: () => { toast.success("Group updated"); inv(); },
  });

  const deactivate = useApiMutation({
    mutationFn: (id: number) => ByokGroupsService.deactivate(id),
    onSuccess: () => { toast.success("Group deactivated"); inv(); },
  });

  const addMember = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AddGroupMemberPayload }) =>
      ByokGroupsService.addMember(id, payload),
    onSuccess: () => { toast.success("Member added"); inv(); },
  });

  const removeMember = useApiMutation({
    mutationFn: ({ id, userId }: { id: number; userId: string }) =>
      ByokGroupsService.removeMember(id, userId),
    onSuccess: () => { toast.success("Member removed"); inv(); },
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    deactivate: deactivate.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    isCreating: create.isPending,
  };
}
