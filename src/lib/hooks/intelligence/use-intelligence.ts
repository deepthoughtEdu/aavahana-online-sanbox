/**
 * HCD Intelligence hooks — TanStack Query wrappers over IntelligenceService.
 * Query keys are prefixed ["intel", ...]; mutations invalidate that prefix.
 */

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { IntelligenceService } from "@/lib/services/intelligence/intelligence.service";
import { notify } from "@/utils/shared/toast.utils";
import type {
  InsightFilters,
  DetectPayload,
  UpdateInsightStatusPayload,
  ReportParams,
} from "@/types/intelligence/intelligence.types";

// ── Module 1 ──
export function useInsights(filters?: InsightFilters) {
  return useApi({
    queryKey: ["intel", "insights", filters],
    queryFn: () => IntelligenceService.getInsights(filters),
  });
}

export function useMyInsights(filters?: InsightFilters) {
  return useApi({
    queryKey: ["intel", "my-insights", filters],
    queryFn: () => IntelligenceService.getMyInsights(filters),
  });
}

export function useInsight(id: string) {
  return useApi({
    queryKey: ["intel", "insight", id],
    queryFn: () => IntelligenceService.getInsight(id),
    enabled: !!id,
  });
}

export function useInsightSummary(filters?: { periodKey?: string }) {
  return useApi({
    queryKey: ["intel", "summary", filters],
    queryFn: () => IntelligenceService.getSummary(filters),
  });
}

export function useUpdateInsightStatus() {
  return useApiMutation({
    mutationFn: (payload: UpdateInsightStatusPayload) => IntelligenceService.updateStatus(payload),
    invalidateKeys: [["intel"]],
    onSuccess: () => notify.success("Constraint updated"),
  });
}

export function useDetectInsights() {
  return useApiMutation({
    mutationFn: (payload: DetectPayload) => IntelligenceService.detect(payload),
    invalidateKeys: [["intel"]],
    onSuccess: (data) => notify.success(`Detection complete — ${data.count} signal(s)`),
  });
}

// ── Module 2 ──
export function useSupervisorReport(params?: ReportParams) {
  return useApi({
    queryKey: ["intel", "report", "supervisor", params],
    queryFn: () => IntelligenceService.getSupervisorReport(params),
  });
}

export function useOrgReport(params?: ReportParams, enabled = true) {
  return useApi({
    queryKey: ["intel", "report", "org", params],
    queryFn: () => IntelligenceService.getOrgReport(params),
    enabled,
  });
}

export function useReport(id: string) {
  return useApi({
    queryKey: ["intel", "report", id],
    queryFn: () => IntelligenceService.getReport(id),
    enabled: !!id,
  });
}

export function useReports(filters?: { page?: number; perPage?: number; scope?: string; audience?: string }) {
  return useApi({
    queryKey: ["intel", "reports", filters],
    queryFn: () => IntelligenceService.listReports(filters),
  });
}

export function useGenerateReport() {
  return useApiMutation({
    mutationFn: (payload: { scope?: "team" | "org" } & ReportParams) => IntelligenceService.generateReport(payload),
    invalidateKeys: [["intel", "report"]],
    onSuccess: () => notify.success("Report generated"),
  });
}
