import type { ReportStatus } from './pdgms.types';

// ── Recurring Event ──

export type RecurringEventType = 'meeting' | 'review' | 'learning' | 'wellness' | 'standup' | 'other';

/**
 * Spec Axis 4. `continue` carries the event into every weekly timetable as a
 * pre-blocked slot, `pause` drops it for this month only (resumable next month),
 * `start` is new this month. This replaces the old `isActive` boolean, which
 * could not distinguish "new" from "carried over" — kept optional for rows
 * written before the tri-state existed.
 */
export type RecurringEventStatus = 'continue' | 'pause' | 'start';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface RecurringEvent {
  id: string;
  title: string;
  type: RecurringEventType;
  daysOfWeek: number[];        // 1=Mon ... 7=Sun
  startTime: string;           // "HH:mm"
  endTime: string;             // "HH:mm"
  isActive: boolean;
  frequency?: RecurringFrequency;
  durationMins?: number;
  status?: RecurringEventStatus;
}

// ── Deliverable in the monthly plan ──

export type MonthlyDeliverableSource = 'micromap' | 'carryover' | 'self_created' | 'l2_created';
export type MonthlyDeliverableStatus = 'accepted' | 'deferred' | 'dropped' | 'completed';

/** Spec Axis 1: rough week allocation. The weekly plan refines it into a timetable. */
export type MonthlyTargetWeek = 'W1' | 'W2' | 'W3' | 'W4';
export type MonthlyPriority = 'high' | 'medium' | 'low';

export interface MonthlyPlanDeliverable {
  id: string;
  title: string;
  programId: string;
  programName: string;
  source: MonthlyDeliverableSource;
  sourceRefId: string | null;
  estimatedHours: number;
  deadline: string | null;
  gridCell: string | null;
  qaCriteria: string | null;
  status: MonthlyDeliverableStatus;
  deferredTo: string | null;
  isCarryover: boolean;
  originalDeadline: string | null;
  /**
   * Spec Axis 1. This is the monthly→weekly cascade key: a deliverable tagged W2
   * pre-populates the basket of the second week's plan. Optional because plans
   * written before the field existed have no allocation.
   */
  targetWeek?: MonthlyTargetWeek | null;
  priority?: MonthlyPriority | null;
}

// ── IP Goal ──

/**
 * Spec Axis 2 / report B4. Derived from verified commit count, never typed:
 * nascent 1-2, developing 3-5, mature 6-10, established 11+. `none` is an item
 * with no verified commits yet.
 */
export type IPMaturity = 'none' | 'nascent' | 'developing' | 'mature' | 'established';

/** One selectable IP item from the registry. */
export interface IpItemOption {
  id: number | string;
  title: string;
  zone: 'program' | 'myzone';
  programId?: number | string | null;
}

export interface MonthlyIPGoal {
  id: string;
  title: string;
  targetCommits: number;
  programId: string | null;
  zone: 'program' | 'myzone';
  /**
   * The IpItem this goal tracks. Required for maturity: the server derives
   * currentMaturity from that item's verified commit count, so a goal without
   * it can only ever report "none".
   */
  ipItemId?: number | string | null;
  /** Server-computed from verified commits. Read-only in the UI. */
  currentMaturity?: IPMaturity;
  commitCount?: number;
  /** The employee's input: where they intend to take this item this month. */
  targetMaturity?: IPMaturity | null;
  /** True when targetMaturity outranks currentMaturity. Drives the ambition flag. */
  isAdvancement?: boolean;
  description?: string;
}

// ── KPI Target ──

/**
 * Program KPIs are shared: several employees commit against the same KPI.
 * `targetValue` is the program-level definition; `myTarget` is this employee's
 * individual commit, which the monthly report reconciles actual against.
 */
export interface ProgramKPI {
  kpiId: string;
  kpiName: string;
  programId: string;
  targetValue: string;
  unit: string;
  /**
   * Owning-program context. Optional because it is not on the Kpi row — the list
   * endpoint resolves it, the single-KPI readers do not. Render it conditionally;
   * a required type here is what produced "shared with undefined members".
   */
  programName?: string;
  memberCount?: number;
  myTarget?: number | null;
}

// ── Post-submit feedback (spec: regex / physics, no LLM) ──

export type MonthlyFeedbackStatus = 'ok' | 'warn' | 'info';
export type MonthlyFeedbackId =
  | 'v3_coverage'
  | 'kpi_commitment'
  | 'ip_presence'
  | 'maturity_ambition'
  | 'timetable_load'
  | 'last_month_signal';

export interface MonthlyFeedbackFlag {
  id: MonthlyFeedbackId;
  status: MonthlyFeedbackStatus;
  title: string;
  detail: string;
}

// ── Read-only context from last month's report (awareness, not inputs) ──

export interface MonthlyPlanContext {
  prevMonthId: string;
  kpiMisses: { kpiId: string; kpiName: string; unit: string }[];
  systemicConstraints: { name: string; weeks: number }[];
  developingIp: { ipItemId: number; title: string }[];
  carryForwardCount: number;
  programKpis: ProgramKPI[];
  strategyItems: { id: string; title: string }[];
}

// ── The Plan record ──

export interface MonthlyPlanData {
  id: string;
  month: string;
  status: ReportStatus;
  deliverables: MonthlyPlanDeliverable[];
  ipGoals: MonthlyIPGoal[];
  recurringEvents: RecurringEvent[];
  kpiTargets: ProgramKPI[];
  totalPlannedHours: number;
  availableHours: number;
  workingDays: number;
  createdAt: string;
  updatedAt: string;
  /** Server-computed on every read. Absent on plans fetched by older callers. */
  feedback?: MonthlyFeedbackFlag[];
  context?: MonthlyPlanContext;
}

// ── Payloads ──

export interface CreateMonthlyPlanPayload {
  month: string;
  programId: string;
  deliverables: MonthlyPlanDeliverable[];
  ipGoals: MonthlyIPGoal[];
}

export interface UpdateMonthlyPlanPayload {
  deliverables?: MonthlyPlanDeliverable[];
  ipGoals?: MonthlyIPGoal[];
  recurringEvents?: RecurringEvent[];
  kpiTargets?: ProgramKPI[];
}
