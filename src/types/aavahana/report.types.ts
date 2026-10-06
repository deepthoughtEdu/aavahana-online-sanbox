// lib/types/report.types.ts

/**
 * ============================================
 * REPORT ENUMS
 * ============================================
 */

export type ReportTaskStatus = "completed" | "in_progress" | "notStarted";

export interface ReportStatistics {
  totalReports: number;
  completionRate: number;
  averageTaskCompletion: number;
  streaks: { current: number; longest: number };
}

export enum ReportTaskType {
  PLANNED = "planned",
  UNPLANNED = "unplanned",
  BACKLOG = "backlog", // NEW based on your JSON
}

/**
 * ============================================
 * REFLECTION SECTIONS
 * ============================================
 */

export type ReflectionKey =
  | "planForToday"
  | "actualDone"
  | "proudOf"
  | "assetsOrProcesses"
  | "blockers"
  | "planForTomorrow";

export interface ReflectionSection {
  key: ReflectionKey;
  title: string;
  icon: string;
}

/**
 * ============================================
 * DAILY REFLECTION (USER INPUT)
 * ============================================
 */

export interface DailyReflection {
  planForToday: string;
  actualDone: string;
  proudOf: string;
  assetsOrProcesses: string;
  blockers: string;
  planForTomorrow: string;
}

/**
 * ============================================
 * DAILY REFLECTION (EVALUATED RESPONSE)
 * ============================================
 */

export interface ReflectionEvaluationItem {
  question: string;
  response: string;
}

export interface DailyReflectionEvaluated {
  proudOf: ReflectionEvaluationItem;
  assetsOrProcesses: ReflectionEvaluationItem;
  blockers: ReflectionEvaluationItem;
  planForTomorrow: ReflectionEvaluationItem;
}

/**
 * ============================================
 * FRAMEWORK
 * ============================================
 */

export interface Framework {
  text: string;
  key?: string;
  description?: string;
}

/**
 * ============================================
 * RUBRIC SCORE
 * ============================================
 */

export interface RubricScore {
  clarity: number;
  selfAwareness: number;
  learning: number;
  specificity: number;
  total: number; // sum of the above
}

/**
 * ============================================
 * SUGGESTION
 * ============================================
 */

export interface Suggestion {
  text: string; // UPDATED: you returned plain text, not { title, text }
}

/**
 * ============================================
 * NUDGE INFO
 * ============================================
 */

export interface NudgeInfo {
  nudgeMessages: string[];
}

/**
 * ============================================
 * EVALUATION (POST-SUBMISSION)
 * ============================================
 */

export interface Evaluation {
  submissionStatus: "submitted" | "needs_nudge" | null;
  dailyReflection?: DailyReflectionEvaluated;
  rubricScore?: RubricScore;
  suggestions?: Suggestion[];
  nudgeInfo?: NudgeInfo;
}

/**
 * ============================================
 * ACTIVITY TIMESTAMPS
 * ============================================
 */

export interface ActivityTimestamps {
  loginAt?: string;
  logoutAt?: string;
}

/**
 * ============================================
 * API RESPONSES
 * ============================================
 */

export interface ReportPlanItem {
  text: string;
  status: ReportTaskStatus;
  type?: ReportTaskType | string; // NEW
}

export interface GetReportResponse {
  date: string;
  plan: ReportPlanItem[];
  frameworks: Framework[];
  report?: string;
  evaluated?: Evaluation;
  loginAt?: string;
  logoutAt?: string;
}

export interface SubmitReportPayload {
  report: string;
  date: string;
  planUpdates: Array<{
    index: number;
    status: string;
  }>;
}

export interface SubmitReportResponse {
  message: string;
  success: boolean;
  submitted: boolean;
  evaluated?: Evaluation;
}

export interface SubmitFrameworksPayload {
  date: string;
  frameworks: Framework[];
}

export interface SubmitFrameworksResponse {
  message: string;
  success: boolean;
}

export interface FrameworkCommitmentPayload {
  date: string;
  frameworkMacroId: string;
  frameworkMacroLabel: string;
  context: "daily_report_probe";
}

export interface FrameworkCommitmentResponse {
  commitmentId: string;
  weekStart: string;
}

export interface UpdateReflectionPayload {
  date: string;
  dailyReflection: Partial<DailyReflection>;
}

export interface UpdateReflectionResponse {
  message: string;
  success: boolean;
  evaluated?: Evaluation;
}

/**
 * ============================================
 * UI STATE
 * ============================================
 */

export interface ReportUIState {
  currentDate: string;
  reflection: string;
  frameworks: string[];
  dailyReflection: Partial<DailyReflection>;
  isSubmitted: boolean;
  isLoading: boolean;
  submissionOpen: boolean;
  editingKey: ReflectionKey | null;
  error?: string | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string; // UTC ISO 8601
}

export interface ChatReflectionResponse {
  conversationId: string;
  userMessage: string;
  aiResponse: string;
}

export interface MessagesResponse {
  conversationId: string | null;
  messages: Message[];
}

export interface MessagePayload {
  message: string;
  conversationId: string | undefined;
  aiResponse?: string;
}
/**
 * ============================================
 * WEEKLY REPORT TYPES
 * ============================================
 */

export interface WeeklyReportDay {
  date: string;
  plan: ReportPlanItem[];
  report: string | null;
  evaluated: Evaluation | null;
  frameworks: Framework[];
}

export interface WeeklyReportResponse {
  startDate: string; // Monday
  endDate: string; // Sunday
  days: WeeklyReportDay[];
}

/**
 * ============================================
 * WEEKLY KPIs (Calculated from daily data)
 * ============================================
 */

export interface WeeklyKPIs {
  completed: number;
  planned: number;
  backlog: number;
  inProgress: number;
  frameworksImplemented: number;
  ipContributions: number; // From daily plan data
}

/**
 * ============================================
 * DAILY BREAKDOWN (For table/chart)
 * ============================================
 */

export interface DailyBreakdownItem {
  day: string; // "Monday", "Tuesday", etc.
  date: string; // "2025-01-06"
  planned: number;
  completed: number;
  backlog: number;
  unplanned: number;
}

/**
 * ============================================
 * UNPLANNED WORK TRACKING
 * ============================================
 */

export interface UnplannedWorkDay {
  date: string;
  count: number;
  highPriorityCount: number;
}
