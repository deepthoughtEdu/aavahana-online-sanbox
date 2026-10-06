import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { ByokCallLogList, ByokUsageSummary } from "@/types/admin";
import type { PaginationParams } from "@/types";

const BASE = "/v3/pdgms/ai/byok/audit";

export interface CallLogFilters extends PaginationParams {
  provider?: string;
  service?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export class ByokAuditService {
  static async listCallLogs(filters?: CallLogFilters): Promise<ApiResult<ByokCallLogList>> {
    return api.get<ByokCallLogList>(`${BASE}/logs`, filters);
  }

  static async getUsageSummary(): Promise<ApiResult<ByokUsageSummary>> {
    return api.get<ByokUsageSummary>(`${BASE}/usage`);
  }
}
