// src/lib/services/trinethra/supervisor.service.ts
import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  DashboardResponse,
  ReportsResponse,
  MemberDetail,
  CoachingResponse,
} from "@/types/trinethra/supervisor.types";

export class SupervisorService {
  /** Get department dashboard with team metrics and AI-generated summary */
  static async getDepartmentDashboard(deptId: string, weekStart: string): Promise<ApiResult<DashboardResponse>> {
    return api.get<DashboardResponse>(`/v3/supervisor/dashboard/${deptId}`, { weekStart });
  }

  /** Get supervisor reports (daily, weekly, or monthly) for department or individual member */
  static async getReports(deptId: string, weekStart: string, type: "daily" | "weekly" | "monthly", uid?: string, page = 1, perPage = 20): Promise<ApiResult<ReportsResponse>> {
    const params: Record<string, string> = { deptId, weekStart, type, page: String(page), perPage: String(perPage) };
    if (uid && uid !== "all") params.uid = uid;
    return api.get<ReportsResponse>(`/v3/supervisor/reports`, params);
  }

  /** Full member detail — score trend/history, health breakdown, claims, latest report. Keyed by eid (G8). */
  static async getMemberDetail(eid: string | number): Promise<ApiResult<MemberDetail>> {
    return api.get<MemberDetail>(`/v3/supervisor/member/${eid}`);
  }

  /** Coaching questions generated from health-component deltas (G10). */
  static async getCoaching(eid: string | number, weekId?: string): Promise<ApiResult<CoachingResponse>> {
    return api.post<CoachingResponse>(`/v3/pdgms/scoring/health-score/${eid}/coaching`, { weekId });
  }
}
