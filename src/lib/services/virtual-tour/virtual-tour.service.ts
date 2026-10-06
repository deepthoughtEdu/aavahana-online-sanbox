import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { BackendPaginatedResponse } from "@/types/shared/api.types";
import type {
  DayViewResponse,
  ThreadBuilderSession,
  GratitudeDay,
  RigorEntry,
  SimulatedWork,
  TourContent,
  FeedbackPromptResponse,
  FeedbackPromptTemplate,
  FeedbackTakeaway,
  CohortDashboardResponse,
  ObserverDeepView,
  ObserverComparisonResponse,
  AssessmentNote,
  ObserverTour,
  ObserverCohortRecord,
  LeaderboardEntry,
  GratitudeEntry,
  ObserverLogEntry,
  CARRProgress,
  SelfAssessmentResult,
  GrowthMirrorResponse,
  PersonalizedSignal,
  PreTourProfile,
  SelfGratitudeActivity,
  SubmitSelfGratitudePayload,
  ChallengeListItem,
  ChallengeDetail,
} from "@/types/virtual-tour/virtual-tour.types";

const BASE = "/v3/pdgms/observers";

export class VirtualTourService {
  // ── Day ──────────────────────────────────────────────────────────────

  static async getToday(): Promise<ApiResult<DayViewResponse>> {
    return api.get<DayViewResponse>(`${BASE}/day/today`);
  }

  static async getDay(dayNumber: number): Promise<ApiResult<DayViewResponse>> {
    return api.get<DayViewResponse>(`${BASE}/day/${dayNumber}`);
  }

  // ── Thread Builder ───────────────────────────────────────────────────

  static async createSession(payload: {
    dayNumber: number;
    sessionName?: string;
    content: string;
  }): Promise<ApiResult<ThreadBuilderSession>> {
    return api.post<ThreadBuilderSession>(`${BASE}/thread-builder`, payload);
  }

  static async listSessions(filters?: {
    page?: number;
    perPage?: number;
  }): Promise<ApiResult<BackendPaginatedResponse<ThreadBuilderSession>>> {
    return api.get<BackendPaginatedResponse<ThreadBuilderSession>>(`${BASE}/thread-builder`, filters);
  }

  static async getSession(id: number): Promise<ApiResult<ThreadBuilderSession>> {
    return api.get<ThreadBuilderSession>(`${BASE}/thread-builder/${id}`);
  }

  static async getLeaderboard(): Promise<ApiResult<LeaderboardEntry[]>> {
    return api.get<LeaderboardEntry[]>(`${BASE}/thread-builder/leaderboard`);
  }

  // ── Gratitudes ───────────────────────────────────────────────────────

  static async createGratitude(payload: {
    dayNumber: number;
    entries: GratitudeEntry[];
  }): Promise<ApiResult<GratitudeDay>> {
    return api.post<GratitudeDay>(`${BASE}/gratitudes`, payload);
  }

  static async updateGratitude(id: number, payload: {
    entries: GratitudeEntry[];
  }): Promise<ApiResult<GratitudeDay>> {
    return api.put<GratitudeDay>(`${BASE}/gratitudes/${id}`, payload);
  }

  static async listGratitudes(): Promise<ApiResult<GratitudeDay[]>> {
    return api.get<GratitudeDay[]>(`${BASE}/gratitudes`);
  }

  static async getGratitudeByDay(dayNumber: number): Promise<ApiResult<GratitudeDay>> {
    return api.get<GratitudeDay>(`${BASE}/gratitudes/${dayNumber}`);
  }

  // ── Journal ──────────────────────────────────────────────────────────

  static async saveJournal(payload: { dayNumber: number; sheetData: Record<string, unknown> }): Promise<ApiResult<{ sheetData: Record<string, unknown> }>> {
    return api.put<{ sheetData: Record<string, unknown> }>(`${BASE}/journal`, payload);
  }

  static async loadJournal(dayNumber?: number): Promise<ApiResult<{ sheetData: Record<string, unknown> }>> {
    const url = dayNumber ? `${BASE}/journal/${dayNumber}` : `${BASE}/journal`;
    return api.get<{ sheetData: Record<string, unknown> }>(url);
  }

  // ── Rigor ────────────────────────────────────────────────────────────

  static async createRigorBatch(payload: {
    dayNumber: number;
    contentId?: number;
    entries: { statement: string; reason: string; rigor: string }[];
  }): Promise<ApiResult<RigorEntry[]>> {
    return api.post<RigorEntry[]>(`${BASE}/rigor`, payload);
  }

  static async updateRigorEntry(id: number, payload: {
    statement?: string;
    reason?: string;
    rigor?: string;
  }): Promise<ApiResult<RigorEntry>> {
    return api.put<RigorEntry>(`${BASE}/rigor/${id}`, payload);
  }

  static async listRigorEntries(): Promise<ApiResult<RigorEntry[]>> {
    return api.get<RigorEntry[]>(`${BASE}/rigor`);
  }

  static async getRigorByDay(dayNumber: number): Promise<ApiResult<RigorEntry[]>> {
    return api.get<RigorEntry[]>(`${BASE}/rigor/day/${dayNumber}`);
  }

  // ── Simulated Work ──────────────────────────────────────────────────

  static async createSimulatedWork(payload: {
    dayNumber: number;
    workType: string;
    data: Record<string, unknown>;
  }): Promise<ApiResult<SimulatedWork>> {
    return api.post<SimulatedWork>(`${BASE}/simulated-work`, payload);
  }

  static async updateSimulatedWork(id: number, payload: {
    data: Record<string, unknown>;
  }): Promise<ApiResult<SimulatedWork>> {
    return api.put<SimulatedWork>(`${BASE}/simulated-work/${id}`, payload);
  }

  static async listSimulatedWork(): Promise<ApiResult<SimulatedWork[]>> {
    return api.get<SimulatedWork[]>(`${BASE}/simulated-work`);
  }

  static async getSimulatedWorkByDay(dayNumber: number): Promise<ApiResult<SimulatedWork[]>> {
    return api.get<SimulatedWork[]>(`${BASE}/simulated-work/day/${dayNumber}`);
  }

  // ── Feedback Prompts ─────────────────────────────────────────────────

  static async getFeedbackPrompt(drill: string, day: number): Promise<ApiResult<FeedbackPromptResponse>> {
    return api.get<FeedbackPromptResponse>(`${BASE}/feedback-prompts/${drill}/${day}`);
  }

  static async saveTakeaway(payload: {
    drill: string;
    dayNumber: number;
    takeaway: string;
  }): Promise<ApiResult<FeedbackTakeaway>> {
    return api.post<FeedbackTakeaway>(`${BASE}/feedback-prompts/takeaway`, payload);
  }

  static async createTemplate(payload: {
    drill: string;
    dayNumber: number;
    template: string;
  }): Promise<ApiResult<FeedbackPromptTemplate>> {
    return api.post<FeedbackPromptTemplate>(`${BASE}/feedback-prompts/templates`, payload);
  }

  static async listTemplates(filters?: {
    page?: number;
    perPage?: number;
  }): Promise<ApiResult<BackendPaginatedResponse<FeedbackPromptTemplate>>> {
    return api.get<BackendPaginatedResponse<FeedbackPromptTemplate>>(`${BASE}/feedback-prompts/templates`, filters);
  }

  static async updateTemplate(id: number, payload: { template: string }): Promise<ApiResult<FeedbackPromptTemplate>> {
    return api.put<FeedbackPromptTemplate>(`${BASE}/feedback-prompts/templates/${id}`, payload);
  }

  // ── Content Library ──────────────────────────────────────────────────

  static async createContent(payload: Record<string, unknown>): Promise<ApiResult<TourContent>> {
    return api.post<TourContent>(`${BASE}/content`, payload);
  }

  static async updateContent(id: number, payload: Record<string, unknown>): Promise<ApiResult<TourContent>> {
    return api.put<TourContent>(`${BASE}/content/${id}`, payload);
  }

  static async listContent(filters?: {
    page?: number;
    perPage?: number;
  }): Promise<ApiResult<BackendPaginatedResponse<TourContent>>> {
    return api.get<BackendPaginatedResponse<TourContent>>(`${BASE}/content`, filters);
  }

  static async getContent(id: number): Promise<ApiResult<TourContent>> {
    return api.get<TourContent>(`${BASE}/content/${id}`);
  }

  // ── Cohort Management ────────────────────────────────────────────────

  static async listCohorts(): Promise<ApiResult<ObserverCohortRecord[]>> {
    return api.get<ObserverCohortRecord[]>(`${BASE}/cohorts`);
  }

  static async getNextCohort(): Promise<ApiResult<ObserverCohortRecord | null>> {
    return api.get<ObserverCohortRecord | null>(`${BASE}/cohorts/next`);
  }

  static async createCohort(payload: { name: string; startDate: string; totalDays?: number }): Promise<ApiResult<ObserverCohortRecord>> {
    return api.post<ObserverCohortRecord>(`${BASE}/cohorts`, payload);
  }

  static async updateCohort(id: number, payload: { name?: string; startDate?: string; totalDays?: number; status?: string }): Promise<ApiResult<ObserverCohortRecord>> {
    return api.put<ObserverCohortRecord>(`${BASE}/cohorts/${id}`, payload);
  }

  static async archiveCohort(id: number): Promise<ApiResult<ObserverCohortRecord>> {
    return api.put<ObserverCohortRecord>(`${BASE}/cohorts/${id}/archive`);
  }

  // ── Cohort (Admin) ──────────────────────────────────────────────────

  static async getCohortDashboard(cohortId?: number): Promise<ApiResult<CohortDashboardResponse[]>> {
    return api.get<CohortDashboardResponse[]>(`${BASE}/cohort`, cohortId ? { cohortId } : {});
  }

  static async getObserverDeepView(eid: number): Promise<ApiResult<ObserverDeepView>> {
    return api.get<ObserverDeepView>(`${BASE}/cohort/${eid}`);
  }

  static async getObserverComparison(eid: number): Promise<ApiResult<ObserverComparisonResponse>> {
    return api.get<ObserverComparisonResponse>(`${BASE}/cohort/${eid}/compare`);
  }

  static async saveAssessment(eid: number, payload: {
    content: string;
    decision?: string;
  }): Promise<ApiResult<AssessmentNote>> {
    return api.post<AssessmentNote>(`${BASE}/cohort/${eid}/assessment`, payload);
  }

  static async extendTour(eid: number, payload: { additionalDays: number }): Promise<ApiResult<ObserverTour>> {
    return api.put<ObserverTour>(`${BASE}/cohort/${eid}/extend`, payload);
  }

  // ── Observer Log (6th drill) ─────────────────────────────────────────

  static async createObserverLog(payload: {
    dayNumber: number;
    mentalModel: string;
    surprise: string;
    steal: string;
  }): Promise<ApiResult<ObserverLogEntry>> {
    return api.post<ObserverLogEntry>(`${BASE}/observer-log`, payload);
  }

  static async getObserverLogByDay(dayNumber: number): Promise<ApiResult<ObserverLogEntry | null>> {
    return api.get<ObserverLogEntry | null>(`${BASE}/observer-log/day/${dayNumber}`);
  }

  static async updateObserverLog(payload: {
    dayNumber: number;
    mentalModel: string;
    surprise: string;
    steal: string;
  }): Promise<ApiResult<ObserverLogEntry>> {
    return api.put<ObserverLogEntry>(`${BASE}/observer-log`, payload);
  }

  static async listObserverLogs(): Promise<ApiResult<ObserverLogEntry[]>> {
    return api.get<ObserverLogEntry[]>(`${BASE}/observer-log`);
  }

  // ── CARR Progress ───────────────────────────────────────────────────

  static async getCARRProgress(): Promise<ApiResult<CARRProgress>> {
    return api.get<CARRProgress>(`${BASE}/carr/progress`);
  }

  // ── Self-Assessment ─────────────────────────────────────────────────

  static async submitSelfAssessment(payload: {
    drill: string;
    dayNumber: number;
    level: number;
    reasoning: string;
  }): Promise<ApiResult<SelfAssessmentResult>> {
    return api.post<SelfAssessmentResult>(`${BASE}/self-assessment`, payload);
  }

  static async listSelfAssessments(): Promise<ApiResult<SelfAssessmentResult[]>> {
    return api.get<SelfAssessmentResult[]>(`${BASE}/self-assessment`);
  }

  // ── Pre-tour Profile ────────────────────────────────────────────────

  static async getPreTourProfile(): Promise<ApiResult<PreTourProfile | null>> {
    return api.get<PreTourProfile | null>(`${BASE}/pre-tour-profile`);
  }

  static async savePreTourProfile(payload: {
    whyDT: string;
    assignmentNotes?: string;
    carrSelfAssessment?: Record<string, number>;
  }): Promise<ApiResult<PreTourProfile>> {
    return api.post<PreTourProfile>(`${BASE}/pre-tour-profile`, payload);
  }

  // ── Growth Mirror (Day 1 vs Day 6) ─────────────────────────────────

  static async getGrowthMirror(): Promise<ApiResult<GrowthMirrorResponse>> {
    return api.get<GrowthMirrorResponse>(`${BASE}/growth-mirror`);
  }

  static async submitDay6Reflection(payload: {
    reflection: string;
  }): Promise<ApiResult<{ saved: boolean }>> {
    return api.post<{ saved: boolean }>(`${BASE}/growth-mirror/reflection`, payload);
  }

  // ── Personalized Mission Signal ─────────────────────────────────────

  static async getPersonalizedSignal(dayNumber: number): Promise<ApiResult<PersonalizedSignal>> {
    return api.get<PersonalizedSignal>(`${BASE}/day/${dayNumber}/signal`);
  }

  // ── Self Gratitude Activities ────────────────────────────────────────

  static async getMyTour(): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").MyTourStatus>> {
    return api.get<import("@/types/virtual-tour/virtual-tour.types").MyTourStatus>(`${BASE}/self-gratitude/tour`);
  }

  static async submitSelfGratitude(payload: SubmitSelfGratitudePayload): Promise<ApiResult<SelfGratitudeActivity>> {
    return api.post<SelfGratitudeActivity>(`${BASE}/self-gratitude`, payload);
  }

  static async listSelfGratitude(): Promise<ApiResult<SelfGratitudeActivity[]>> {
    return api.get<SelfGratitudeActivity[]>(`${BASE}/self-gratitude`);
  }

  static async getSelfGratitude(activityId: number): Promise<ApiResult<SelfGratitudeActivity>> {
    return api.get<SelfGratitudeActivity>(`${BASE}/self-gratitude/${activityId}`);
  }

  // ── Why DT ──────────────────────────────────────────────────────────────

  static async getWhyDt(): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").WhyDtResponse | null>> {
    return api.get(`${BASE}/why-dt`);
  }

  static async saveWhyDt(responses: Record<string, string>, sendEmail = false): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").WhyDtResponse>> {
    return api.post(`${BASE}/why-dt`, { responses, sendEmail });
  }

  // ── AdTech Prep ─────────────────────────────────────────────────────────

  static async getAdtechPrep(): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").AdtechPrepResponse | null>> {
    return api.get(`${BASE}/adtech-prep`);
  }

  static async saveAdtechPrep(responses: Record<string, string>): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").AdtechPrepResponse>> {
    return api.put(`${BASE}/adtech-prep`, { responses });
  }

  // ── Practice Modules (generic) ────────────────────────────────────────

  static async getPracticeModule(slug: string): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").PracticeModuleResponse | null>> {
    return api.get(`${BASE}/practice-modules/${slug}`);
  }

  static async savePracticeModule(slug: string, responses: Record<string, string>): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").PracticeModuleResponse>> {
    return api.put(`${BASE}/practice-modules/${slug}`, { responses });
  }

  // ── Challenges ──────────────────────────────────────────────────────────

  static async getChallenges(): Promise<ApiResult<ChallengeListItem[]>> {
    return api.get<ChallengeListItem[]>(`${BASE}/challenges`);
  }

  static async getChallenge(id: number): Promise<ApiResult<ChallengeDetail>> {
    return api.get<ChallengeDetail>(`${BASE}/challenges/${id}`);
  }

  static async pickChallenge(id: number): Promise<ApiResult<unknown>> {
    return api.post(`${BASE}/challenges/${id}/pick`, {});
  }

  static async submitChallenge(id: number, response: string): Promise<ApiResult<unknown>> {
    return api.put(`${BASE}/challenges/${id}/submit`, { response });
  }

  static async getDashboard(): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").DashboardResponse>> {
    return api.get(`${BASE}/day/dashboard`);
  }

  static async submitPasskey(payload: { passkey: string }): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").TourAttendanceRecord>> {
    return api.post(`${BASE}/attendance/submit`, payload);
  }

  static async getMyAttendance(): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").TourAttendanceRecord[]>> {
    return api.get(`${BASE}/attendance/my`);
  }

  static async saveFeedbackPasteback(payload: { drill: string; dayNumber: number; content: string }): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").FeedbackPastebackRecord>> {
    return api.put(`${BASE}/feedback-pasteback`, payload);
  }

  static async getFeedbackPasteback(drill: string, dayNumber: number): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").FeedbackPastebackRecord>> {
    return api.get(`${BASE}/feedback-pasteback/${drill}/${dayNumber}`);
  }

  static async listFeedbackPastebackByDay(dayNumber: number): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").FeedbackPastebackRecord[]>> {
    return api.get(`${BASE}/feedback-pasteback/day/${dayNumber}`);
  }

  static async saveJournalReflection(payload: { dayNumber: number; content: string }): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").JournalReflectionRecord>> {
    return api.put(`${BASE}/journal/reflection`, payload);
  }

  static async getJournalReflection(dayNumber: number): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").JournalReflectionRecord>> {
    return api.get(`${BASE}/journal/reflection/${dayNumber}`);
  }

  static async listJournalReflections(): Promise<ApiResult<import("@/types/virtual-tour/virtual-tour.types").JournalReflectionRecord[]>> {
    return api.get(`${BASE}/journal/reflections`);
  }

  // ── Admin: Passkey Management ──────────────────────────────────

  static async createPasskey(payload: { date: string; passkey: string }): Promise<ApiResult<unknown>> {
    return api.post(`${BASE}/attendance/passkey`, payload);
  }

  static async listPasskeys(): Promise<ApiResult<unknown[]>> {
    return api.get(`${BASE}/attendance/passkeys`);
  }

  static async deletePasskey(date: string): Promise<ApiResult<unknown>> {
    return api.delete(`${BASE}/attendance/passkey/${date}`);
  }

  // ── Admin: Attendance ──────────────────────────────────────────

  static async adminOverride(observerEid: number, payload: { date: string }): Promise<ApiResult<unknown>> {
    return api.post(`${BASE}/attendance/override/${observerEid}`, payload);
  }

  static async adminSetDay(observerEid: number, payload: { dayNumber: number }): Promise<ApiResult<unknown>> {
    return api.put(`${BASE}/attendance/set-day/${observerEid}`, payload);
  }
}
