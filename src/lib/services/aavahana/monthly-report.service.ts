import { api, isError } from "@/lib/api/client";
import type {
  MonthlyReport,
  MonthlyReportSubmitPayload,
  MonthlyKPICommit,
  MonthlyConstraintSummary,
  LeadershipPortfolio,
} from "@/types";
import type { ApiResult } from "@/lib/api/client";
import {
  normalizeLeadershipPortfolio,
  normalizeMonthlyReport,
} from "@/lib/adapters/aavahana-route.adapters";

export class MonthlyReportService {
  /** Get aggregated monthly report (from weekly data) */
  static async getMonthlyReport(month: string): Promise<ApiResult<MonthlyReport | null>> {
    const result = await api.get<unknown>("/v3/pdgms/loops/monthly-report", { month });
    if (isError(result)) return result;
    return normalizeMonthlyReport(result);
  }

  /** Submit KPI actuals */
  static async submitKPICommits(
    payload: { month: string; kpiCommits: MonthlyKPICommit[] }
  ): Promise<ApiResult<{ success: boolean; message: string }>> {
    return api.post("/v3/pdgms/loops/monthly-report/kpi-commits/batch", payload);
  }

  /** Submit monthly report — triggers synthesize_monthly_report LLM */
  static async submitMonthlyReport(
    payload: MonthlyReportSubmitPayload
  ): Promise<ApiResult<{ success: boolean; narrative: string }>> {
    return api.post("/v3/pdgms/loops/monthly-report/submit", payload);
  }

  /** Fetch KPI commits for a month */
  static async getKPICommits(month: string): Promise<ApiResult<MonthlyKPICommit[]>> {
    const result = await api.get<unknown>("/v3/pdgms/loops/monthly-report/kpi-commits", { month });
    if (isError(result)) return result;
    return Array.isArray(result) ? result as MonthlyKPICommit[] : [];
  }

  /** Monthly constraint pattern analysis */
  static async getConstraintPatterns(month: string): Promise<ApiResult<MonthlyConstraintSummary>> {
    return api.get<MonthlyConstraintSummary>("/v3/pdgms/loops/monthly-report/constraint-patterns", { month });
  }

  /** Fetch Leadership Portfolio */
  static async getPortfolio(month: string): Promise<ApiResult<LeadershipPortfolio | null>> {
    const result = await api.get<unknown>("/v3/pdgms/loops/monthly-report/portfolio", { month });
    if (isError(result)) return result;
    return normalizeLeadershipPortfolio(result);
  }

}
