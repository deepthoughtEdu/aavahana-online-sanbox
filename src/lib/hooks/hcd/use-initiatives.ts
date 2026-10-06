import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HcdInitiativeService,
  type Initiative,
  type CreateInitiativeData,
  type PromoteData,
  type InitiativeStageLog,
  type InitiativeLink,
} from "@/lib/services/hcd/initiative.service";
import { isError } from "@/lib/api/client";

export function useInitiativeList() {
  return useQuery<Initiative[]>({
    queryKey: ["hcd", "initiatives"],
    queryFn: async () => {
      const res = await HcdInitiativeService.list();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useCreateInitiative() {
  const qc = useQueryClient();
  return useMutation<Initiative, Error, CreateInitiativeData>({
    mutationFn: async (data) => {
      const res = await HcdInitiativeService.create(data);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
      qc.invalidateQueries({ queryKey: ["hcd", "recognition", "cohort"] });
    },
  });
}

export function usePromoteInitiative() {
  const qc = useQueryClient();
  return useMutation<Initiative, Error, { id: number; data?: PromoteData }>({
    mutationFn: async ({ id, data }) => {
      const res = await HcdInitiativeService.promote(id, data);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
      qc.invalidateQueries({ queryKey: ["hcd", "recognition", "cohort"] });
    },
  });
}

export function useSubmitForVerification() {
  const qc = useQueryClient();
  return useMutation<Initiative, Error, number>({
    mutationFn: async (id) => {
      const res = await HcdInitiativeService.submitForVerification(id);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
      qc.invalidateQueries({ queryKey: ["hcd", "recognition", "cohort"] });
    },
  });
}

function useLifecycleMutation(
  fn: (id: number) => ReturnType<typeof HcdInitiativeService.drop>
) {
  const qc = useQueryClient();
  return useMutation<Initiative, Error, number>({
    mutationFn: async (id) => {
      const res = await fn(id);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
      qc.invalidateQueries({ queryKey: ["hcd", "history", updated.id] });
    },
  });
}

export function useDropInitiative() {
  return useLifecycleMutation((id) => HcdInitiativeService.drop(id));
}

export function useRestoreInitiative() {
  return useLifecycleMutation((id) => HcdInitiativeService.restore(id));
}

export function useInitiativeHistory(id: number, enabled = true) {
  return useQuery<InitiativeStageLog[]>({
    queryKey: ["hcd", "history", id],
    enabled,
    queryFn: async () => {
      const res = await HcdInitiativeService.stageHistory(id);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useInitiativeLinks(id: number, enabled = true) {
  return useQuery<InitiativeLink[]>({
    queryKey: ["hcd", "links", id],
    enabled,
    queryFn: async () => {
      const res = await HcdInitiativeService.listLinks(id);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useAddInitiativeLink() {
  const qc = useQueryClient();
  return useMutation<InitiativeLink, Error, { id: number; entityType: string; entityId: string }>({
    mutationFn: async ({ id, entityType, entityId }) => {
      const res = await HcdInitiativeService.addLink(id, { entityType, entityId });
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: (link) => {
      qc.invalidateQueries({ queryKey: ["hcd", "links", link.initiativeId] });
    },
  });
}
