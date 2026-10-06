import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ProjectCharter,
  Backlog,
  LearningItem,
  Deliverable,
  Result,
  Workflow,
  Risk,
  CalendarEvent,
  UploadedNote,
  WeekInfo,
  WeeklyPlanData,
  TimetableBootstrap,
  HighPriorityCategory,
  GanttDataResponse,
  ValueInsightsResponse,
  TimeLogEntry,
  WeeklyReport,
  AiSuggestionsResponse,
  AiAnalysisResponse,
} from "@/types/aavahana/weekly-plan.types";
import type {
  MonthlyBasketItem,
  VoiceStructureWeeklyResponse,
} from "@/types/aavahana/pdgms.types";
import type { WeeklyPlanAiResponse } from "@/types/aavahana/weekly-plan-ai.types";
import type {
  SavedWeeklyPlan,
  SaveWeeklyPlanPayload,
  SaveWeeklyPlanResult,
  WeeklyPlannerContext,
} from "@/types/aavahana/weekly-plan-editor.types";

export class WeeklyPlanService {
  static async getAllData(params?: {
    weekStart?: string;
    includeCompleted?: boolean;
    includeMetrics?: boolean;
  }): Promise<ApiResult<WeeklyPlanData>> {
    return api.get<WeeklyPlanData>("/v3/pdgms/loops/weekly-cadence/data", {
      ...params,
    });
  }

  static async getCurrentWeek(): Promise<ApiResult<WeekInfo>> {
    return api.get<WeekInfo>("/v3/pdgms/loops/weekly-cadence/week", undefined, {
      toast: false,
    });
  }

  static async getActiveProjects(): Promise<ApiResult<ProjectCharter[]>> {
    return api.get<ProjectCharter[]>("/v3/pdgms/program/programs", {
      status: "active",
    });
  }

  static async getBacklogs(): Promise<ApiResult<Backlog[]>> {
    return api.get<Backlog[]>("/v3/pdgms/loops/weekly-cadence/backlogs");
  }

  static async getLearningAgenda(): Promise<ApiResult<LearningItem[]>> {
    return api.get<LearningItem[]>("/v3/pdgms/loops/weekly-cadence/learning");
  }

  static async getDeliverables(): Promise<ApiResult<Deliverable[]>> {
    return api.get<Deliverable[]>(
      "/v3/pdgms/loops/weekly-cadence/deliverables",
    );
  }

  static async updateDeliverable(payload: {
    id: string;
    title?: string;
    status?: Deliverable["status"];
    completionPercentage?: number;
    actualHours?: number;
  }): Promise<ApiResult<Deliverable>> {
    return api.put<Deliverable>(
      `/v3/pdgms/loops/weekly-cadence/deliverables/${payload.id}`,
      payload,
    );
  }

  static async getResults(): Promise<ApiResult<Result[]>> {
    return api.get<Result[]>("/v3/pdgms/loops/weekly-cadence/results");
  }

  static async getWorkflows(): Promise<ApiResult<Workflow[]>> {
    return api.get<Workflow[]>("/v3/pdgms/loops/weekly-cadence/workflows");
  }

  static async getRisks(): Promise<ApiResult<Risk[]>> {
    return api.get<Risk[]>("/v3/pdgms/loops/weekly-cadence/risks");
  }

  static async getCalendarEvents(params?: {
    deliverableId?: string;
    date?: string;
    type?: CalendarEvent["type"];
    status?: string;
  }): Promise<ApiResult<CalendarEvent[]>> {
    return api.get<CalendarEvent[]>(
      "/v3/pdgms/loops/weekly-cadence/events",
      params,
    );
  }

  static async createCalendarEvent(payload: {
    title: string;
    deliverableId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type?: CalendarEvent["type"];
    isHighPriority?: boolean;
    category?: HighPriorityCategory;
    sourceScreen?: string;
    description?: string;
    attendees?: string[];
    location?: string;
  }): Promise<ApiResult<CalendarEvent>> {
    return api.post<CalendarEvent>(
      "/v3/pdgms/loops/weekly-cadence/events",
      payload,
    );
  }

  /** Bootstrap data for the AI Timetable — loaded once per session */
  static async getTimetableBootstrap(): Promise<ApiResult<TimetableBootstrap>> {
    return api.get<TimetableBootstrap>(
      "/v3/pdgms/loops/weekly-cadence/timetable/bootstrap",
    );
  }

  static async deleteCalendarEvent(
    id: string,
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(
      `/v3/pdgms/loops/weekly-cadence/events/${id}`,
    );
  }

  static async uploadNote(payload: {
    fileName: string;
    fileData: string;
    relatedEntities?: {
      projects?: string[];
      deliverables?: string[];
      risks?: string[];
    };
    processWithAI?: boolean;
  }): Promise<ApiResult<UploadedNote & { downloadUrl?: string }>> {
    return api.post<UploadedNote & { downloadUrl?: string }>(
      "/v3/pdgms/loops/weekly-cadence/notes",
      payload,
    );
  }

  static async getTimeLog(params?: {
    deliverableId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<TimeLogEntry[]>> {
    return api.get<TimeLogEntry[]>(
      "/v3/pdgms/loops/weekly-cadence/time",
      params,
    );
  }

  static async logTime(payload: {
    deliverableId: string;
    hours: number;
    date?: string;
    description?: string;
  }): Promise<ApiResult<TimeLogEntry>> {
    return api.post<TimeLogEntry>(
      "/v3/pdgms/loops/weekly-cadence/time",
      payload,
    );
  }

  static async getWeeklyReport(params?: {
    weekStart?: string;
    includeDetails?: boolean;
    format?: "json" | "csv";
  }): Promise<ApiResult<WeeklyReport>> {
    return api.get<WeeklyReport>("/v3/pdgms/loops/weekly-report", {
      ...params,
    });
  }

  static async getAiSuggestions(payload: {
    type: "project" | "deliverable" | "risk" | "learning";
    context?: Record<string, unknown>;
    enhancementLevel?: "summary" | "detailed";
  }): Promise<ApiResult<AiSuggestionsResponse>> {
    return api.post<AiSuggestionsResponse>(
      "/v3/pdgms/loops/weekly-cadence/ai/suggestions",
      payload,
    );
  }

  /** BYOK: generate a draft weekly plan + critique from intent and last week. */
  static async generateAiPlan(payload: {
    weekStart?: string;
    intent?: string;
    apiKey: string;
    provider: string;
    model: string;
  }): Promise<ApiResult<WeeklyPlanAiResponse>> {
    return api.post<WeeklyPlanAiResponse>(
      "/v3/pdgms/loops/weekly-cadence/ai/plan",
      payload,
    );
  }

  static async getAiAnalysis(payload: {
    entityType: "project" | "deliverable" | "backlog" | "risk";
    entityId: string;
    analysisType: "progress" | "risk" | "timeline" | "optimization";
  }): Promise<ApiResult<AiAnalysisResponse>> {
    return api.post<AiAnalysisResponse>(
      "/v3/pdgms/loops/weekly-cadence/ai/analysis",
      payload,
    );
  }

  /** Fetch the Gantt / time-allocation summary for a specific week */
  static async getGanttData(params?: {
    weekStart?: string;
  }): Promise<ApiResult<GanttDataResponse>> {
    return api.get<GanttDataResponse>(
      "/v3/pdgms/loops/weekly-cadence/gantt",
      params,
    );
  }

  /** Fetch AI-powered value-insights for a specific week */
  static async getValueInsights(params?: {
    weekStart?: string;
  }): Promise<ApiResult<ValueInsightsResponse>> {
    return api.get<ValueInsightsResponse>(
      "/v3/pdgms/loops/weekly-cadence/analytics/value-insights",
      params,
    );
  }

  // ============================================================
  // PDGMS v4.0 ADDITIONS
  // ============================================================

  /** Monthly basket items not yet picked into a week (cascade: Monthly → Weekly) */
  static async getMonthlyBasket(): Promise<ApiResult<MonthlyBasketItem[]>> {
    return api.get<MonthlyBasketItem[]>(
      "/v3/pdgms/loops/weekly-plan/monthly-basket",
    );
  }

  /** The current weekly plan row (deliverables + status) for a week. Null when none saved. */
  static async getWeeklyPlan(weekStart?: string): Promise<ApiResult<SavedWeeklyPlan | null>> {
    return api.get<SavedWeeklyPlan | null>(
      "/v3/pdgms/loops/weekly-plan",
      weekStart ? { weekStart } : undefined,
      { toast: false },
    );
  }

  /** Planner context: week label, last-week recap, trailing blocker, carry-forward + monthly candidates. */
  static async getPlannerContext(weekStart?: string): Promise<ApiResult<WeeklyPlannerContext>> {
    return api.get<WeeklyPlannerContext>(
      "/v3/pdgms/loops/weekly-plan/context",
      weekStart ? { weekStart } : undefined,
      { toast: false },
    );
  }

  /** Save (create/overwrite) the week's plan tasks as an editable draft. Toasts handled by the caller. */
  static async saveWeeklyPlan(
    payload: SaveWeeklyPlanPayload,
  ): Promise<ApiResult<SaveWeeklyPlanResult>> {
    return api.post<SaveWeeklyPlanResult>(
      "/v3/pdgms/loops/weekly-plan/submit",
      payload,
      { label: "Save Weekly Plan", toast: false },
    );
  }

  /** Lay the weekly plan's day-assigned tasks into timetable time blocks (energy-aware). */
  static async autoScheduleWeek(
    weekStart?: string,
  ): Promise<ApiResult<{ scheduled: number; weekStart: string }>> {
    return api.post<{ scheduled: number; weekStart: string }>(
      "/v3/pdgms/loops/weekly-cadence/timetable/auto-schedule",
      weekStart ? { weekStart } : {},
      { label: "Auto-schedule week", toast: false },
    );
  }

  /** Mark a plan task done/undone from its timetable block (one-way: block → task). */
  static async setTaskDone(
    planTaskId: string,
    done: boolean,
    weekStart?: string,
  ): Promise<ApiResult<{ planTaskId: string; done: boolean }>> {
    return api.post<{ planTaskId: string; done: boolean }>(
      "/v3/pdgms/loops/weekly-plan/task-done",
      { planTaskId, done, ...(weekStart ? { weekStart } : {}) },
      { label: "Update task", toast: false },
    );
  }

  /** LLM: voice transcript → structured weekly plan */
  static async structureFromVoice(
    transcript: string,
  ): Promise<ApiResult<VoiceStructureWeeklyResponse>> {
    return api.post<VoiceStructureWeeklyResponse>(
      "/v3/pdgms/loops/weekly-plan/structure-from-voice",
      { transcript },
    );
  }

  /** Sync timetable to Google Calendar */
  static async syncGoogleCalendar(
    weekStart: string,
  ): Promise<ApiResult<{ synced: number; message: string }>> {
    return api.post("/v3/pdgms/loops/timetable/sync-google", { weekStart });
  }
}
