import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  TeamAttendanceResponse,
  PayrollDashboardResponse,
  PayrollComputeResponse,
  PayrollLockResponse,
  PayrollConfig,
  AccessGrant,
  CreateGrantPayload,
  BulkGrantPayload,
  BulkGrantResult,
} from "@/types/admin";

const BASE = "/v3/pdgms";

export class PayrollAdminService {
  static async teamAttendance(month?: string): Promise<ApiResult<TeamAttendanceResponse>> {
    return api.get<TeamAttendanceResponse>(
      `${BASE}/attendance/team`,
      month ? { month } : undefined,
      { label: "payroll:team-attendance", toast: false },
    );
  }

  static async dashboard(month?: string, includePayroll = true): Promise<ApiResult<PayrollDashboardResponse>> {
    const params: Record<string, string> = {};
    if (month) params.month = month;
    if (includePayroll) params.includePayroll = "true";
    return api.get<PayrollDashboardResponse>(
      `${BASE}/payroll/dashboard`,
      Object.keys(params).length ? params : undefined,
      { label: "payroll:dashboard", toast: false },
    );
  }

  static async compute(month: string): Promise<ApiResult<PayrollComputeResponse>> {
    return api.post<PayrollComputeResponse>(`${BASE}/payroll/compute`, { month }, { label: "payroll:compute" });
  }

  static async lock(month: string): Promise<ApiResult<PayrollLockResponse>> {
    return api.post<PayrollLockResponse>(`${BASE}/payroll/lock`, { month }, { label: "payroll:lock" });
  }

  /**
   * Streams the CSV and triggers a browser download. The BE returns a raw
   * text/csv body (not the JSON envelope), so this uses api.download (Blob +
   * Content-Disposition) rather than api.get, which would try to JSON-parse the
   * CSV and silently fail. Resolves to the saved filename; throws on non-OK.
   *
   * `eids` limits the export to those employees. Omit (or pass null) for
   * everyone the caller may view — the BE intersects the list with that set, so
   * this only ever narrows the result.
   */
  static async exportCsv(month: string, eids?: number[] | null): Promise<string> {
    const params = new URLSearchParams({ month });
    if (eids?.length) params.set("eids", eids.join(","));
    return api.download(
      `${BASE}/payroll/export?${params.toString()}`,
      `payroll-${month}.csv`,
    );
  }

  static async getConfig(): Promise<ApiResult<PayrollConfig>> {
    return api.get<PayrollConfig>(`${BASE}/payroll/config`, undefined, { label: "payroll:config", toast: false });
  }

  static async updateConfig(payload: Partial<PayrollConfig>): Promise<ApiResult<PayrollConfig>> {
    return api.put<PayrollConfig>(`${BASE}/payroll/config`, payload, { label: "payroll:config-update" });
  }
}

export class AccessGrantService {
  static async list(filters?: { uid?: string; module?: string }): Promise<ApiResult<AccessGrant[]>> {
    return api.get<AccessGrant[]>(
      `${BASE}/people/access-grants`,
      filters as Record<string, string> | undefined,
      { label: "access-grants:list", toast: false },
    );
  }

  static async getForUser(uid: string): Promise<ApiResult<AccessGrant[]>> {
    return api.get<AccessGrant[]>(
      `${BASE}/people/access-grants/${uid}`,
      undefined,
      { label: "access-grants:user", toast: false },
    );
  }

  static async create(payload: CreateGrantPayload): Promise<ApiResult<AccessGrant>> {
    return api.post<AccessGrant>(`${BASE}/people/access-grants`, payload, { label: "access-grants:create" });
  }

  static async bulkGrant(payload: BulkGrantPayload): Promise<ApiResult<BulkGrantResult[]>> {
    return api.post<BulkGrantResult[]>(`${BASE}/people/access-grants/bulk`, payload, { label: "access-grants:bulk" });
  }

  static async revoke(grantId: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/people/access-grants/${grantId}`, { label: "access-grants:revoke" });
  }
}
