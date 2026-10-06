"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { GroupPrivilegeService } from "@/lib/services/admin/group-privilege.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { GrantPrivilegePayload } from "@/types/admin";

const KEY = ["admin", "groups"] as const;

function privKey(groupId: number) {
  return [...KEY, groupId, "privileges"] as const;
}

export function useGroupPrivileges(groupId: number) {
  return useApi({
    queryKey: privKey(groupId),
    queryFn: () => GroupPrivilegeService.list(groupId),
    enabled: groupId > 0,
  });
}

export function useGroupPrivilegeMutations(groupId: number) {
  const inv = () => queryClient.invalidateQueries({ queryKey: privKey(groupId) });

  const grant = useApiMutation({
    mutationFn: (p: GrantPrivilegePayload) => GroupPrivilegeService.grant(groupId, p),
    onSuccess: () => { toast.success("Privilege granted"); inv(); },
  });

  const revoke = useApiMutation({
    mutationFn: (userId: string) => GroupPrivilegeService.revoke(groupId, userId),
    onSuccess: () => { toast.success("Privilege revoked"); inv(); },
  });

  return {
    grant: grant.mutateAsync,
    revoke: revoke.mutateAsync,
  };
}
