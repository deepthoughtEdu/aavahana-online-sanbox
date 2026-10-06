"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { AdminProgramService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { CreateProgramPayload, AddMemberPayload } from "@/types/admin";

const BASE_KEY = ["admin", "programs"] as const;

export function useAdminPrograms(params?: { status?: string }) {
  return useApi({ queryKey: [...BASE_KEY, params], queryFn: () => AdminProgramService.list(params) });
}

export function useAdminProgram(id: string) {
  return useApi({ queryKey: [...BASE_KEY, id], queryFn: () => AdminProgramService.get(id), enabled: !!id });
}

export function useAdminProgramMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: BASE_KEY });
  const create = useApiMutation({
    mutationFn: (p: CreateProgramPayload) => AdminProgramService.create(p),
    onSuccess: () => { toast.success("Program created"); inv(); },
  });
  const update = useApiMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateProgramPayload> }) => AdminProgramService.update(id, payload),
    onSuccess: () => { toast.success("Program updated"); inv(); },
  });
  const transitionStatus = useApiMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => AdminProgramService.transitionStatus(id, status),
    onSuccess: () => { inv(); },
  });
  const addMember = useApiMutation({
    mutationFn: ({ programId, payload }: { programId: string; payload: AddMemberPayload }) => AdminProgramService.addMember(programId, payload),
    onSuccess: () => { toast.success("Member added"); inv(); },
  });
  return {
    create: create.mutateAsync, update: update.mutateAsync,
    transitionStatus: transitionStatus.mutateAsync, addMember: addMember.mutateAsync,
    isCreating: create.isPending,
  };
}
