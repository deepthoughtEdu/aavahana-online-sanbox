"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { OrgTreeService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { UpsertNodePayload, MoveNodePayload, BulkUpsertPayload } from "@/types/admin";

const KEY = ["admin", "org-tree"] as const;

export function useOrgTree() {
  return useApi({
    queryKey: KEY,
    queryFn: OrgTreeService.getTree,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOrgTreeMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });

  const upsertNode = useApiMutation({
    mutationFn: (p: UpsertNodePayload) => OrgTreeService.upsertNode(p),
    onSuccess: () => { toast.success("Node saved"); inv(); },
  });

  const moveNode = useApiMutation({
    mutationFn: (p: { eid: number } & MoveNodePayload) =>
      OrgTreeService.moveNode(p.eid, { supervisorEid: p.supervisorEid }),
    onSuccess: () => { toast.success("Node moved"); inv(); },
  });

  const archiveNode = useApiMutation({
    mutationFn: (eid: number) => OrgTreeService.archiveNode(eid),
    onSuccess: () => { toast.success("Node archived"); inv(); },
  });

  const bulkUpsert = useApiMutation({
    mutationFn: (p: BulkUpsertPayload) => OrgTreeService.bulkUpsert(p),
    onSuccess: () => { toast.success("Tree updated"); inv(); },
  });

  return {
    upsertNode: upsertNode.mutateAsync,
    moveNode: moveNode.mutateAsync,
    archiveNode: archiveNode.mutateAsync,
    bulkUpsert: bulkUpsert.mutateAsync,
    isUpdating: upsertNode.isPending || moveNode.isPending || archiveNode.isPending || bulkUpsert.isPending,
  };
}
