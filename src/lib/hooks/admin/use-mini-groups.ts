"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { MiniGroupService } from "@/lib/services/admin/mini-group.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { CreateMiniGroupPayload, UpdateMiniGroupPayload, AddMiniGroupMemberPayload } from "@/types/admin";

const KEY = ["admin", "groups"] as const;

function miniGroupKey(groupId: number) {
  return [...KEY, groupId, "mini-groups"] as const;
}

export function useMiniGroups(groupId: number) {
  return useApi({
    queryKey: miniGroupKey(groupId),
    queryFn: () => MiniGroupService.list(groupId),
    enabled: groupId > 0,
  });
}

export function useMiniGroupMutations(groupId: number) {
  const inv = () => {
    queryClient.invalidateQueries({ queryKey: miniGroupKey(groupId) });
    queryClient.invalidateQueries({ queryKey: KEY });
  };

  const create = useApiMutation({
    mutationFn: (p: CreateMiniGroupPayload) => MiniGroupService.create(groupId, p),
    onSuccess: () => { toast.success("Mini-group created"); inv(); },
  });

  const update = useApiMutation({
    mutationFn: ({ miniGroupId, payload }: { miniGroupId: number; payload: UpdateMiniGroupPayload }) =>
      MiniGroupService.update(groupId, miniGroupId, payload),
    onSuccess: () => { toast.success("Mini-group updated"); inv(); },
  });

  const deactivate = useApiMutation({
    mutationFn: (miniGroupId: number) => MiniGroupService.deactivate(groupId, miniGroupId),
    onSuccess: () => { toast.success("Mini-group deactivated"); inv(); },
  });

  const addMember = useApiMutation({
    mutationFn: ({ miniGroupId, payload }: { miniGroupId: number; payload: AddMiniGroupMemberPayload }) =>
      MiniGroupService.addMember(groupId, miniGroupId, payload),
    onSuccess: () => { toast.success("Member added"); inv(); },
  });

  const removeMember = useApiMutation({
    mutationFn: ({ miniGroupId, userId }: { miniGroupId: number; userId: string }) =>
      MiniGroupService.removeMember(groupId, miniGroupId, userId),
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
