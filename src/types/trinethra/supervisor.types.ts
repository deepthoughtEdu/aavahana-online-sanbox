// src/types/trinethra/supervisor.types.ts

export interface SupervisorDepartment {
  id: string;
  name: string;
  description?: string;
}

export interface RitualScore {
  ritualLabelId: string;
  participation: number;
  weight: number;
  score: number;
}

export interface SupScoreTrendPoint {
  periodId: string; // weekId, e.g. "2026-W24"
  composite: number; // 1-10
}

export interface TeamMember {
  uid: string;
  eid?: number | null; // employment id — member-detail routes are keyed by eid (A35)
  name: string;
  username?: string;
  picture?: string | null;
  email?: string;
  healthScore: number | null; // weekly system composite, 0-100 (never the raw sup score)
  latestSupScore?: number | null; // latest L2→L1 score, 1-10
  supScoreTrend?: SupScoreTrendPoint[]; // last 5, oldest → newest
  attendance: string | null; // timetableAdherence %, e.g. "83%"
  lnd: number | null; // L&D v1: learning-agenda completion %, null when nothing planned (G3)
  ubs: number | null;
  happiness: number | null;
  ubsBreakdown?: RitualScore[] | null;
  ubsDetails?: null;
  happinessDetails?: {
    hasScorecard: boolean;
    responseCount: number;
  };
  alerts?: Array<{ type: string; message: string }>;
}

export interface TeamSummary {
  summary: string;
  highlights: string[];
  escalations: string[];
  suggestions: string[];
}

export interface DashboardResponse {
  department: SupervisorDepartment;
  weekStart: string; // YYYY-MM-DD
  members: TeamMember[];
  teamSummary: TeamSummary;
}

export interface DailyPlanItem {
  text: string;
  status: "notStarted" | "inProgress" | "completed";
  type?: string;
}

// One task's actual outcome in the evening report (DailyReportV7 deliverable).
export interface DailyReportTask {
  text: string;
  status: "notStarted" | "inProgress" | "completed";
  actualMins: number | null;
}

// The evening report half — null until the member files a V7 report for the day.
export interface DailyReportDetail {
  submitted: boolean;
  narrative: string | null;
  tasks: DailyReportTask[];
  doneCount: number;
  totalCount: number;
  totalActualMins: number;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  plan: DailyPlanItem[] | string[]; // morning plan (intended tasks)
  frameworks?: unknown[];
  report: DailyReportDetail | null; // evening outcome + reflection; null = not reported yet
  hasPlan: boolean;
  hasReport: boolean;
}

export interface WeeklyReport {
  submitted: boolean;
  submittedAt?: string | null;
  planVsActual: string | null;
  bottlenecksAndInsights: string | null;
  summary: string | null;
  highlights: string[];
  escalations: string[];
  suggestions: string[];
}

export interface UserInfo {
  username: string;
  fullname: string;
  picture?: string;
}

export interface DailyReportsResponse {
  uid?: string;
  weekStart: string;
  type: "daily";
  user?: UserInfo;
  dailyReports: DailyReport[];
}

export interface WeeklyReportsResponse {
  uid?: string;
  weekStart: string;
  type: "weekly";
  weeklyReport: WeeklyReport | null;
}

// G9: monthly reports share the weekly synthesis shape.
export interface MonthlyReportsResponse {
  uid?: string;
  weekStart: string;
  type: "monthly";
  monthlyReport: WeeklyReport | null;
}

export type ReportsResponse =
  | DailyReportsResponse
  | WeeklyReportsResponse
  | MonthlyReportsResponse;

// ─── Member detail (G8) ───────────────────────────────────────────────────────

export interface HealthBreakdown {
  composite: number;
  components: { capability?: number; contribution?: number; ubs?: number; supScore?: number; lifecycle?: number } | null;
  weights: Record<string, number> | null;
  weekId: string;
}

export interface MemberClaim {
  claimId: string;
  type: string;
  status: string;
  labelId?: string | number;
}

export interface MemberDetail {
  uid: string;
  eid: number | null;
  supScoreHistory: Array<{ weekId: string; score: number }>;
  supScoreTrend: Array<{ weekId: string; avg: number }>;
  health: HealthBreakdown | null;
  claims: MemberClaim[];
  latestReport: Record<string, unknown> | null;
}

// ─── Coaching (G10) ─────────────────────────────────────────────────────────--

export interface CoachingResponse {
  questions: string[];
  context: string;
  primaryDriver: string | null;
  llmUnavailable: boolean;
}

export enum PerformanceLevel {
  EXCELLENT = "excellent",
  GOOD = "good",
  NEEDS_ATTENTION = "needs_attention",
}

export interface TeamMemberWithLevel extends TeamMember {
  level: PerformanceLevel;
  engagePercent: number;
}
