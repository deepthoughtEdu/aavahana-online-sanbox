"use client";

import { useApi } from "@/lib/hooks/shared/use-api";
import { ByokAuditService } from "@/lib/services/admin/byok-audit.service";
import type { CallLogFilters } from "@/lib/services/admin/byok-audit.service";

const LOGS_KEY = ["admin", "byok-audit-logs"] as const;
const USAGE_KEY = ["admin", "byok-audit-usage"] as const;

export function useByokCallLogs(filters?: CallLogFilters) {
  return useApi({
    queryKey: [...LOGS_KEY, filters],
    queryFn: () => ByokAuditService.listCallLogs(filters),
  });
}

export function useByokUsageSummary() {
  return useApi({
    queryKey: USAGE_KEY,
    queryFn: ByokAuditService.getUsageSummary,
  });
}
