"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { AdminOrganizationService } from "@/lib/services/admin";
import type { CreateOrganizationPayload } from "@/lib/services/admin/organization.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";

const BASE_KEY = ["admin", "organizations"] as const;
const MEMBERS_KEY = ["admin", "org-members"] as const;
const DEPARTMENTS_KEY = ["admin", "org-departments"] as const;

export function useAdminOrganizations() {
  return useApi({ queryKey: [...BASE_KEY], queryFn: () => AdminOrganizationService.list() });
}

export function useAdminOrganization(orgId: string) {
  return useApi({ queryKey: [...BASE_KEY, orgId], queryFn: () => AdminOrganizationService.get(orgId), enabled: !!orgId });
}

export function useAdminOrganizationMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: BASE_KEY });
  const create = useApiMutation({
    mutationFn: (p: CreateOrganizationPayload) => AdminOrganizationService.create(p),
    onSuccess: () => { toast.success("Organisation created"); inv(); },
  });
  const update = useApiMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: Partial<CreateOrganizationPayload> }) => AdminOrganizationService.update(orgId, payload),
    onSuccess: () => { toast.success("Organisation updated"); inv(); },
  });
  const remove = useApiMutation({
    mutationFn: (orgId: string) => AdminOrganizationService.delete(orgId),
    onSuccess: () => { toast.success("Organisation deleted"); inv(); },
  });
  return {
    create: create.mutateAsync, update: update.mutateAsync, remove: remove.mutateAsync,
    isCreating: create.isPending,
  };
}

export function useOrgMembers(orgId: string, params?: { page?: number; limit?: number }) {
  return useApi({
    queryKey: [...MEMBERS_KEY, orgId, params],
    queryFn: () => AdminOrganizationService.getMembers(orgId, params),
    enabled: !!orgId,
  });
}

export function useOrgMemberMutations(orgId: string) {
  const inv = () => queryClient.invalidateQueries({ queryKey: [...MEMBERS_KEY, orgId] });
  const updateType = useApiMutation({
    mutationFn: ({ uid, type }: { uid: number; type: string }) => AdminOrganizationService.updateMember(orgId, uid, { type }),
    onSuccess: () => { toast.success("Member role updated"); inv(); },
  });
  const updateStatus = useApiMutation({
    mutationFn: ({ uid, status }: { uid: number; status: string }) => AdminOrganizationService.updateMember(orgId, uid, { status }),
    onSuccess: () => { toast.success("Member status updated"); inv(); },
  });
  const updateDepartment = useApiMutation({
    mutationFn: ({ uid, departmentId }: { uid: number; departmentId: string }) => AdminOrganizationService.updateMember(orgId, uid, { departmentId }),
    onSuccess: () => {
      toast.success("Member department updated");
      inv();
      queryClient.invalidateQueries({ queryKey: [...DEPARTMENTS_KEY, orgId] });
    },
  });
  const addMember = useApiMutation({
    mutationFn: ({ uid, type }: { uid: number; type?: string }) => AdminOrganizationService.addMember(orgId, uid, { type }),
    onSuccess: () => { toast.success("Member added"); inv(); },
  });
  const removeMember = useApiMutation({
    mutationFn: (uid: number) => AdminOrganizationService.removeMember(orgId, uid),
    onSuccess: () => { toast.success("Member removed"); inv(); },
  });
  // Only the member actually being mutated is pending, so callers can disable
  // that one row's controls instead of every row's.
  const pendingUid =
    (updateType.isPending ? updateType.variables?.uid : undefined) ??
    (updateStatus.isPending ? updateStatus.variables?.uid : undefined) ??
    (updateDepartment.isPending ? updateDepartment.variables?.uid : undefined) ??
    null;

  return {
    updateType: updateType.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    updateDepartment: updateDepartment.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    pendingUid,
  };
}

export function useOrgDepartments(orgId: string, params?: { page?: number; limit?: number }) {
  return useApi({
    queryKey: [...DEPARTMENTS_KEY, orgId, params],
    queryFn: () => AdminOrganizationService.getDepartments(orgId, params),
    enabled: !!orgId,
  });
}

export function useOrgDepartmentMembers(orgId: string, deptId: string, enabled: boolean) {
  return useApi({
    queryKey: [...DEPARTMENTS_KEY, orgId, deptId, "members"],
    queryFn: () => AdminOrganizationService.getDepartmentMembers(orgId, deptId, { limit: 100 }),
    enabled: !!orgId && !!deptId && enabled,
  });
}

export function useOrgDepartmentMutations(orgId: string) {
  const inv = () => queryClient.invalidateQueries({ queryKey: [...DEPARTMENTS_KEY, orgId] });
  const createDepartment = useApiMutation({
    mutationFn: (p: { name: string; description?: string; parentDepartmentId?: string }) => AdminOrganizationService.createDepartment(orgId, p),
    onSuccess: () => { toast.success("Department created"); inv(); },
  });
  const deleteDepartment = useApiMutation({
    mutationFn: (deptId: string) => AdminOrganizationService.deleteDepartment(orgId, deptId),
    onSuccess: () => { toast.success("Department deleted"); inv(); },
  });
  return {
    createDepartment: createDepartment.mutateAsync,
    deleteDepartment: deleteDepartment.mutateAsync,
    isCreating: createDepartment.isPending,
    isDeleting: deleteDepartment.isPending,
  };
}
