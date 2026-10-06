// src/types/plan.types.ts

/**
 * ============================================
 * ENUMS & CONSTANTS
 * ============================================
 */

export enum TaskStatus {
  NOT_STARTED = "notStarted",
  IN_PROCESS = "in_progress",
  COMPLETED = "completed",
}

export enum TaskType {
  PLANNED = "planned",
  UNPLANNED = "unplanned",
  BACKLOG = "backlog",
}

export enum TaskSource {
  MANUAL = "manual",
  YESTERDAY = "yesterday",
  WEEKLY = "weekly",
  WEEKLY_BASKET = "weekly_basket",
  EVENT_LOOP = "event_loop",
  L2_ADDED = "l2_added",
}

/**
 * ============================================
 * DAILY PLAN TYPES
 * ============================================
 */

export interface IncompletePlanItem {
  _id: string;
  date: string;
  plan: DailyTask[];
}

export interface DailyTask {
  text: string;
  status: TaskStatus | string;
  type: TaskType | string;
  priority?: string;
  estimateMins?: number | string;
  doneDefinition?: string;
  source?: TaskSource | string;
  sourceId?: string;

  // v7 bridge fields
  isCriticalPath?: boolean;
  budgetMins?: number;

  // Cascade tracking
  basketItemId?: string;
  programId?: string;
  programName?: string;
}

export interface DailyPlanResponse {
  plan: DailyTask[];
}

export interface DailyPlanSubmitPayload {
  plan: DailyTask[];
}

export interface DailyPlanSubmitResponse {
  message: string;
  success?: boolean;
  /** Variable-reward insight (F2) — deterministic, rotating wording; null when no signal. */
  insight?: import("./insight.types").SubmitInsight | null;
}

/**
 * ============================================
 * WEEKLY PLAN TYPES
 * ============================================
 */

export enum WeeklyTaskPriority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export enum WeeklyTaskStatus {
  NOT_STARTED = "notStarted",
  IN_PROGRESS = "inProgress",
  COMPLETED = "Completed",
}

export interface WeeklyTask {
  _id?: string;
  day: string; // "Monday", "Tuesday", etc.
  taskTitle: string;
  priority?: WeeklyTaskPriority | string;
  estimateMins?: number;
  doneDefinition?: string;
  status?: WeeklyTaskStatus | string;
  isManual?: boolean; // Distinguish manual vs AI-generated
}

export interface WeeklyPlanEvaluation {
  goal?: string;
  plan?: WeeklyTask[];
  objectives?: string[];
  keyResults?: string[];
}

export interface WeeklyPlanResponse {
  weekStart: string;
  transcript: string | null;
  weeklyGoals: string | null;
  evaluation: WeeklyPlanEvaluation | null;
  submissionStatus: "ok" | "ai_error" | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanSubmitPayload {
  weekStart?: string; // Optional, defaults to current Monday
  transcript: string;
  weeklyGoals: string;
}

export interface WeeklyPlanSubmitResponse {
  submitted: boolean;
  message: string;
  weekStart: string;
  evaluation: WeeklyPlanEvaluation | null;
}

export interface WeeklyPlanUpdatePayload {
  weekStart?: string;
  updates: {
    [key: string]: unknown; // Flexible key-value updates
  };
}

export interface WeeklyPlanUpdateResponse {
  ok: boolean;
  weekStart: string;
  updatedAt: string;
}

export interface PlanStatistics {
  totalPlans: number;
  completedTasks: number;
  incompleteTasks: number;
  completionRate: number;
  averageTasksPerDay: number;
}

export interface PlanTemplate {
  id: string;
  name: string;
  tasks: DailyTask[];
  createdAt: string;
}

export interface SavePlanTemplateResponse {
  id: string;
  name: string;
  message: string;
}

/**
 * ============================================
 * WEEKLY PLAN UI STATE
 * ============================================
 */

export interface WeeklyPlanUIState {
  weekStart: string;
  weeklyGoals: string;
  transcript: string;
  tasks: WeeklyTask[];
  isSubmitted: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * ============================================
 * UI STATE TYPES
 * ============================================
 */

export interface DailyPlanState {
  currentDate: string; // ISO format YYYY-MM-DD
  todayTasks: DailyTask[];
  yesterdayTasks: DailyTask[];
  weeklyTasks: WeeklyTask[];
  isEditMode: boolean;
  isPlanSubmitted: boolean;
  isLoading: boolean;
}

export interface LoginStatusResponse {
  loginAt: string | null;
  logoutAt: string | null;
  hasLoggedIn: boolean;
  hasLoggedOut: boolean;
}

export interface InitiateChatResponse {
  status: string;
  loginAt: string;
  conversationId?: string;
  message?: string;
}
