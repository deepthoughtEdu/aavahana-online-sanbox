"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { PayrollAdminService, AccessGrantService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { CreateGrantPayload, BulkGrantPayload, PayrollConfig } from "@/types/admin";

const TEAM_KEY = ["payroll", "team-attendance"] as const;
const DASH_KEY = ["payroll", "dashboard"] as const;
const CONFIG_KEY = ["payroll", "config"] as const;
const GRANTS_KEY = ["payroll", "access-grants"] as const;

export function useTeamAttendance(month?: string) {
  return useApi({
    queryKey: [...TEAM_KEY, month ?? "current"],
    queryFn: () => PayrollAdminService.teamAttendance(month),
  });
}

export function usePayrollDashboard(month?: string, includePayroll = true) {
  return useApi({
    queryKey: [...DASH_KEY, month ?? "current", includePayroll],
    queryFn: () => PayrollAdminService.dashboard(month, includePayroll),
  });
}

export function usePayrollConfig() {
  return useApi({
    queryKey: [...CONFIG_KEY],
    queryFn: PayrollAdminService.getConfig,
  });
}

export function usePayrollMutations() {
  const invDash = () => queryClient.invalidateQueries({ queryKey: [...DASH_KEY] });
  const invConfig = () => queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY] });

  const compute = useApiMutation({
    mutationFn: (month: string) => PayrollAdminService.compute(month),
    onSuccess: () => { toast.success("Payroll computed"); invDash(); },
  });

  const lock = useApiMutation({
    mutationFn: (month: string) => PayrollAdminService.lock(month),
    onSuccess: () => { toast.success("Payroll locked"); invDash(); },
  });

  const updateConfig = useApiMutation({
    mutationFn: (payload: Partial<PayrollConfig>) => PayrollAdminService.updateConfig(payload),
    onSuccess: () => { toast.success("Config saved"); invConfig(); },
  });

  return {
    compute: compute.mutateAsync,
    lock: lock.mutateAsync,
    updateConfig: updateConfig.mutateAsync,
    isComputing: compute.isPending,
    isLocking: lock.isPending,
    isSavingConfig: updateConfig.isPending,
  };
}

export function useAccessGrants(filters?: { uid?: string; module?: string }) {
  return useApi({
    queryKey: [...GRANTS_KEY, filters],
    queryFn: () => AccessGrantService.list(filters),
  });
}

export function useAccessGrantMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: [...GRANTS_KEY] });

  const create = useApiMutation({
    mutationFn: (p: CreateGrantPayload) => AccessGrantService.create(p),
    onSuccess: () => { toast.success("Grant created"); inv(); },
  });

  const bulkGrant = useApiMutation({
    mutationFn: (p: BulkGrantPayload) => AccessGrantService.bulkGrant(p),
    onSuccess: () => { toast.success("Grants created"); inv(); },
  });

  const revoke = useApiMutation({
    mutationFn: (id: number) => AccessGrantService.revoke(id),
    onSuccess: () => { toast.success("Grant revoked"); inv(); },
  });

  return {
    create: create.mutateAsync,
    bulkGrant: bulkGrant.mutateAsync,
    revoke: revoke.mutateAsync,
    isCreating: create.isPending,
    isRevoking: revoke.isPending,
  };
}
