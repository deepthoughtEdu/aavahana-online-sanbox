import { api, ApiResult } from "@/lib/api/client";
import type {
  DailyTask,
  DailyPlanResponse,
  DailyPlanSubmitResponse,
  WeeklyPlanSubmitPayload,
  WeeklyPlanSubmitResponse,
  WeeklyPlanResponse,
  WeeklyPlanUpdatePayload,
  WeeklyPlanUpdateResponse,
  LoginStatusResponse,
  InitiateChatResponse,
  IncompletePlanItem,
  PlanStatistics,
  PlanTemplate,
  SavePlanTemplateResponse,
} from "@/types/aavahana/plan.types";
import type { ProgramLabel } from "@/types/aavahana/pdgms.types";
import { todayISO } from "@/utils/shared/date.utils";

export class PlanService {
  /** Get daily plan for a specific date */
  static async getDailyPlan(date: string): Promise<ApiResult<DailyTask[]>> {
    const result = await api.get<DailyPlanResponse>(`/v3/pdgms/loops/daily-plan/${date}`, {}, { label: "Get Daily Plan", toast: false });
    if ("error" in result) return result;
    return (result as any).plan || [];
  }

  /** Submit daily plan */
  static async submitDailyPlan(payload: {
    plan: DailyTask[];
  }): Promise<ApiResult<DailyPlanSubmitResponse>> {
    // Sandbox deviation: identify the viewer's day explicitly for the local in-memory store.
    return await api.post<DailyPlanSubmitResponse>(`/v3/pdgms/loops/daily-plan/submit?date=${todayISO()}`, payload, { label: "Submit Daily Plan", successMessage: "Daily plan submitted successfully!" });
  }

  /** Submit weekly plan with goals and transcript */
  static async submitWeeklyPlan(
    payload: WeeklyPlanSubmitPayload
  ): Promise<ApiResult<WeeklyPlanSubmitResponse>> {
    return await api.post<WeeklyPlanSubmitResponse>("/v3/pdgms/loops/plans", { ...payload, cadence: "weekly" }, { label: "Submit Weekly Plan", successMessage: "Weekly plan submitted successfully!" });
  }

  /** Get weekly plan for a specific week */
  static async getWeeklyPlan(
    weekStart?: string
  ): Promise<ApiResult<WeeklyPlanResponse>> {
    return await api.get<WeeklyPlanResponse>("/v3/pdgms/loops/plans/current", { cadence: "weekly", ...(weekStart ? { weekStart } : {}) }, { label: "Get Weekly Plan", toast: false });
  }

  /** Update weekly plan fields */
  static async updateWeeklyPlan(
    payload: WeeklyPlanUpdatePayload
  ): Promise<ApiResult<WeeklyPlanUpdateResponse>> {
    // Resolves current weekly plan ID then PUTs to the generic plans endpoint
    return await api.put<WeeklyPlanUpdateResponse>("/v3/pdgms/loops/weekly-plan", payload, { label: "Update Weekly Plan", successMessage: "Weekly plan updated successfully!" });
  }

  /** Get yesterday's incomplete plan items */
  static async yesterdayPlan(): Promise<ApiResult<DailyTask[]>> {
    const result = await api.get<IncompletePlanItem[]>("/v3/pdgms/loops/daily-plan/incomplete", {}, { label: "Get Yesterday's Incomplete Plans", toast: false });
    if ("error" in result) return result;
    return result.flatMap((item) => item.plan);
  }

  /** Check if plan is submitted for a date */
  static async isPlanSubmitted(date: string): Promise<ApiResult<boolean>> {
    const planResult = await this.getDailyPlan(date);

    if ("error" in planResult) {
      return planResult;
    }

    return planResult.length > 0;
  }

  /** Check if user has logged in for a specific date */
  static async checkLoginStatus(
    date: string
  ): Promise<ApiResult<LoginStatusResponse>> {
    return await api.get<LoginStatusResponse>("/v3/pdgms/loops/daily-plan/session/status", { date }, { label: "Check Login Status", toast: false });
  }

  /** Initiate chat session and log user's login time */
  static async initiateChat(): Promise<ApiResult<InitiateChatResponse>> {
    return await api.post<InitiateChatResponse>("/v3/pdgms/loops/daily-plan/session/login", {}, { label: "Initiate Chat Session", toast: false, log: false });
  }

  /** Get plan completion statistics */
  static async getPlanStatistics(startDate: string, endDate: string): Promise<ApiResult<PlanStatistics>> {
    return await api.get<PlanStatistics>("/v3/pdgms/loops/plan/statistics", { startDate, endDate }, { label: "Get Plan Statistics", toast: false });
  }

  /** Get user's saved plan templates */
  static async getPlanTemplates(): Promise<ApiResult<PlanTemplate[]>> {
    return await api.get<PlanTemplate[]>("/v3/pdgms/loops/plan/templates", undefined, { label: "Get Plan Templates", toast: false });
  }

  /** Save plan as template */
  static async savePlanTemplate(name: string, tasks: DailyTask[]): Promise<ApiResult<SavePlanTemplateResponse>> {
    return await api.post<SavePlanTemplateResponse>("/v3/pdgms/loops/plan/templates", { name, tasks }, { label: "Save Plan Template", successMessage: "Template saved successfully!" });
  }

  /** Delete plan template */
  static async deletePlanTemplate(templateId: string): Promise<ApiResult<{ success: boolean; message: string }>> {
    return await api.delete(`/v3/pdgms/loops/plan/templates/${templateId}`, { label: "Delete Plan Template", successMessage: "Template deleted successfully" });
  }

  // ============================================================
  // PDGMS v4.0 ADDITIONS
  // ============================================================

  /** Basket: weekly deliverables + open event-loop tickets for daily plan pick */
  static async getEventLoopBasket(): Promise<ApiResult<unknown>> {
    return api.get("/v3/pdgms/loops/plans/basket");
  }

  /** Framework + process labels — pass claimable: true for claim dropdowns */
  static async getProgramLabels(programId?: string, type?: "framework" | "process"): Promise<ApiResult<ProgramLabel[]>> {
    return api.get<ProgramLabel[]>("/v3/pdgms/loops/labels", { type, programId, claimable: true });
  }

  /** Active plan for the given cadence */
  static async getCurrentPlan(cadence: "daily" | "weekly" | "monthly"): Promise<ApiResult<unknown>> {
    return api.get("/v3/pdgms/loops/plans/current", { cadence });
  }

  /** Create a plan from basket picks */
  static async createPlan(payload: Record<string, unknown>): Promise<ApiResult<unknown>> {
    return api.post("/v3/pdgms/loops/plans", payload);
  }

  /** Submit a draft plan (draft → submitted) */
  static async submitPlan(planId: string): Promise<ApiResult<unknown>> {
    return api.patch(`/v3/pdgms/loops/plans/${planId}/submit`, {});
  }
}
