import { api, ApiResult } from "@/lib/api/client";
import type {
  GetReportResponse,
  SubmitReportPayload,
  SubmitReportResponse,
  SubmitFrameworksPayload,
  SubmitFrameworksResponse,
  FrameworkCommitmentPayload,
  FrameworkCommitmentResponse,
  UpdateReflectionPayload,
  WeeklyReportResponse,
  UpdateReflectionResponse,
  MessagesResponse,
  MessagePayload,
  ChatReflectionResponse,
  ActivityTimestamps,
  ReportStatistics,
} from "@/types";
import type {
  AutoDeliverable,
  OrgRitual,
  DailyReportV4,
  ExtractFromVoicePayload,
  VoiceExtractDailyResponse,
  WeeklyReportV4,
} from "@/types/aavahana/pdgms.types";
import type { SectionAContext } from "@/types/aavahana/report-v5.types";
import type {
  WeeklyReportAi,
  WeeklyReportAiGenerateResult,
  WeeklyReportAiGeneratePayload,
  WeeklyReportAiSubmitResult,
  WeeklyReportAiSection,
  WeekDailiesResponse,
} from "@/types/aavahana/weekly-report-ai.types";

export class ReportService {
  // ── AI-generated (BYOK) weekly report ──

  /** Load the persisted (draft/submitted) AI weekly report. weekStart "" = current week. */
  static async getWeeklyReportAi(weekStart = ""): Promise<ApiResult<WeeklyReportAi>> {
    return api.get<WeeklyReportAi>("/v3/pdgms/loops/weekly-report-ai", { weekStart }, { label: "Get AI Weekly Report", toast: false });
  }

  /** Generate (or regenerate) the weekly report from the week's V7 data via the user's BYOK LLM. */
  static async generateWeeklyReportAi(payload: WeeklyReportAiGeneratePayload): Promise<ApiResult<WeeklyReportAiGenerateResult>> {
    return api.post<WeeklyReportAiGenerateResult>("/v3/pdgms/loops/weekly-report-ai/generate", payload, { label: "Generate AI Weekly Report" });
  }

  /** Persist the edited sections and mark the week submitted. `narrative` is sent too for older backend builds. */
  static async submitWeeklyReportAi(payload: { weekStart: string; sections: WeeklyReportAiSection[]; narrative?: string }): Promise<ApiResult<WeeklyReportAiSubmitResult>> {
    return api.post<WeeklyReportAiSubmitResult>("/v3/pdgms/loops/weekly-report-ai/submit", payload, { label: "Submit AI Weekly Report", successMessage: "Weekly report submitted!" });
  }

  /** The week's submitted daily reports, per weekday — the source data the weekly report is built from. */
  static async getWeekDailies(weekStart = ""): Promise<ApiResult<WeekDailiesResponse>> {
    return api.get<WeekDailiesResponse>("/v3/pdgms/loops/weekly-report/dailies", { weekStart }, { label: "Get Week Dailies", toast: false });
  }

  /** Get report for a specific date */
  static async getReportForDate(
    date: string
  ): Promise<ApiResult<GetReportResponse>> {
    return await api.get<GetReportResponse>(`/v3/pdgms/loops/daily-plan/${date}`, {}, { label: "Get Daily Report", toast: false });
  }

  /** Submit daily report with reflection and plan updates */
  static async submitReport(
    payload: SubmitReportPayload
  ): Promise<ApiResult<SubmitReportResponse>> {
    return await api.post<SubmitReportResponse>("/v3/pdgms/loops/daily-report/submit", payload, { label: "Submit Daily Report", successMessage: "Report submitted successfully!" });
  }

  /** Submit frameworks implementation notes */
  static async submitFrameworks(
    payload: SubmitFrameworksPayload
  ): Promise<ApiResult<SubmitFrameworksResponse>> {
    return await api.post<SubmitFrameworksResponse>("/v3/pdgms/grammar/reflections", payload, { label: "Submit Frameworks" });
  }

  /** Submit framework commitment from daily report probe */
  static async submitFrameworkCommitment(
    payload: FrameworkCommitmentPayload
  ): Promise<ApiResult<FrameworkCommitmentResponse>> {
    return await api.post<FrameworkCommitmentResponse>("/v3/pdgms/grammar/framework-commitments", payload, { label: "Framework Commitment" });
  }

  /** Update a specific reflection section */
  static async updateReflection(
    payload: UpdateReflectionPayload
  ): Promise<ApiResult<UpdateReflectionResponse>> {
    return await api.post<UpdateReflectionResponse>("/v3/pdgms/grammar/reflections", payload, { label: "Update Reflection", successMessage: "Reflection updated successfully!", toast: false });
  }

  /** Post a message in reflection chat */
  static async postReflection(
    payload: MessagePayload
  ): Promise<ApiResult<ChatReflectionResponse>> {
    return await api.post<ChatReflectionResponse>("/v3/pdgms/loops/daily-report/chat", payload, { label: "Post Reflection Message", toast: false, log: false });
  }

  /** Get all messages from reflection chat */
  static async getMessages(): Promise<ApiResult<MessagesResponse>> {
    return await api.get<MessagesResponse>("/v3/pdgms/loops/daily-report/chat", undefined, { label: "Get Chat Messages", toast: false });
  }

  /** Post logout session — records logout timestamp */
  static async postLogout(): Promise<ApiResult<ActivityTimestamps>> {
    return await api.post<ActivityTimestamps>("/v3/pdgms/loops/session/logout", {}, { label: "Record Logout", toast: false, log: false });
  }

  /** Get report history for a date range */
  static async getReportHistory(
    startDate: string,
    endDate: string
  ): Promise<ApiResult<GetReportResponse[]>> {
    return await api.get<GetReportResponse[]>("/v3/pdgms/loops/reports", { startDate, endDate }, { label: "Get Report History", toast: false });
  }

  /** Get report statistics */
  static async getStatistics(userId?: string): Promise<ApiResult<ReportStatistics>> {
    return await api.get("/v3/pdgms/loops/reports/statistics", userId ? { userId } : undefined, { label: "Get Report Statistics", toast: false });
  }

  /** Get weekly report (7-day aggregation of daily reports) */
  static async getWeeklyReport(
    date?: string
  ): Promise<ApiResult<WeeklyReportResponse>> {
    return await api.get<WeeklyReportResponse>("/v3/pdgms/loops/weekly-report", date ? { date } : undefined, { label: "Get Weekly Report", toast: false });
  }

  // ============================================================
  // PDGMS v4.0 ADDITIONS
  // ============================================================

  /** Get auto-populated deliverables from ticket state changes for a date */
  static async getAutoDeliverables(
    date: string
  ): Promise<ApiResult<AutoDeliverable[]>> {
    return api.get<AutoDeliverable[]>("/v3/pdgms/loops/daily-report/auto-deliverables", { date });
  }

  /** Get org-enabled ritual sections for the daily report */
  static async getOrgRituals(): Promise<ApiResult<OrgRitual[]>> {
    return api.get<OrgRitual[]>("/v3/pdgms/infra/org-config/rituals");
  }

  /** Extract structured sections from voice via generate_daily_report LLM */
  static async extractFromVoice(
    payload: ExtractFromVoicePayload
  ): Promise<ApiResult<VoiceExtractDailyResponse>> {
    return api.post<VoiceExtractDailyResponse>("/v3/pdgms/loops/daily-report/extract-voice", payload);
  }

  /** Submit v4 daily report */
  static async submitDailyReportV4(
    report: DailyReportV4
  ): Promise<ApiResult<{ success: boolean; message: string }>> {
    return api.post("/v3/pdgms/loops/daily-report/submit", report);
  }

  /** Create a draft report (daily / weekly / monthly) */
  static async createReport(payload: Record<string, unknown>): Promise<ApiResult<unknown>> {
    return api.post("/v3/pdgms/loops/reports", payload);
  }

  /** Auto-populate delivery/constraint/timesheet summaries from ticket transitions */
  static async computeSummaries(reportId: string): Promise<ApiResult<unknown>> {
    return api.post(`/v3/pdgms/loops/reports/${reportId}/compute-summaries`, {});
  }

  /** Current active report for the given cadence */
  static async getCurrentReport(cadence: "daily" | "weekly" | "monthly"): Promise<ApiResult<unknown>> {
    return api.get("/v3/pdgms/loops/reports/current", { cadence });
  }

  /** Update a draft report */
  static async updateReport(reportId: string, updates: Record<string, unknown>): Promise<ApiResult<unknown>> {
    return api.put(`/v3/pdgms/loops/reports/${reportId}`, updates);
  }

  /** Submit a draft report (draft → submitted) */
  static async submitReportById(reportId: string): Promise<ApiResult<unknown>> {
    return api.patch(`/v3/pdgms/loops/reports/${reportId}/submit`, {});
  }

  /** Get weekly report v4 (6-axis summary: deliverables, ip, frameworks, processes, rituals, timetable) */
  static async getWeeklyReportV4(weekStart: string): Promise<ApiResult<WeeklyReportV4>> {
    return api.get<WeeklyReportV4>("/v3/pdgms/loops/weekly-report", { weekStart });
  }

  /** Submit weekly report v4 (triggers synthesize_weekly_report LLM) */
  static async submitWeeklyReportV4(payload: {
    weekStart: string;
    happiness: number;
    additionalNotes?: string;
  }): Promise<ApiResult<{ success: boolean; narrative: string }>> {
    return api.post("/v3/pdgms/loops/weekly-report/submit", payload);
  }

  // ============================================================
  // PDGMS v5.0 ADDITIONS — Section A
  // ============================================================

  /** Get Section A context: planned items with time budgets + plan status */
  static async getSectionAContext(date: string): Promise<ApiResult<SectionAContext>> {
    return api.get<SectionAContext>("/v3/pdgms/loops/daily-report/section-a-context", { date });
  }
}
