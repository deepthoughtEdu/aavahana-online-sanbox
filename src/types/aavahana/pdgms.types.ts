// src/types/pdgms.types.ts
// PDGMS v4.0 Shared Types — used across Daily, Weekly, Monthly, Career, Feedback, IP modules

/**
 * ============================================
 * SHARED ENUMS & CONSTANTS
 * ============================================
 */

export type ConstraintType =
  | "budget"
  | "talent"
  | "internal_support"
  | "assumptions"
  | "permissions";

export type TimesheetCategoryType =
  | "operational"
  | "research"
  | "deep_work"
  | "coordination"
  | "meetings"
  | "planning_strategy";

export type AxisType =
  | "deliverables"
  | "ip"
  | "kpis"
  | "frameworks"
  | "processes"
  | "rituals";

export type DailyTaskSource =
  | "event_loop"
  | "weekly_basket"
  | "self_created"
  | "yesterday";

export type DeliverableStatus = "open" | "in_progress" | "pending_qa" | "delivered" | "qa_failed" | "confirmed";

export type ReportStatus = "draft" | "submitted" | "locked";

export type IPZone = "program" | "myzone";

export type IPApprovalStatus = "pending" | "approved" | "withdrawn";


/**
 * ============================================
 * SHARED DATA STRUCTURES
 * ============================================
 */

/** Number + Label picker claim (reusable for frameworks & processes) */
export interface LabelClaim {
  labelId: string;
  labelName: string;
  quantity: number;
  /** Aggregated total when returned in monthly summaries */
  totalQuantity?: number;
}

/** Constraint entry for bottleneck tracking */
export interface ConstraintEntry {
  type: ConstraintType;
  description: string;
  ticketRef?: string;
}

/** Timesheet category with hours */
export interface TimesheetCategory {
  category: TimesheetCategoryType;
  hours: number;
  description?: string;
}

/** Auto-populated deliverable from ticket state changes */
export interface AutoDeliverable {
  ticketId: string;
  label: string;
  status: DeliverableStatus;
  programId: string;
  programName?: string;
  completedAt?: string | null;
}

/** Event loop ticket for daily plan basket */
export interface EventLoopTicket {
  ticketId: string;
  title: string;
  programId: string;
  programName: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedMins?: number;
}

/** Program label from registry */
export interface ProgramLabel {
  id: string;
  name: string;
  type: "framework" | "process";
  programId: string;
}

/** Org-configurable ritual */
export interface OrgRitual {
  ritualId: string;
  ritualName: string;
  description?: string;
  enabled: boolean;
}

/** Ritual response in daily report */
export interface RitualResponse {
  ritualId: string;
  ritualName: string;
  content: string;
}

/**
 * ============================================
 * DAILY PLAN v4 EXTENSIONS
 * ============================================
 */

export interface DailyTaskV4Extensions {
  programId?: string;
  parentCommitmentId?: string;
  source: DailyTaskSource;
  labels?: {
    frameworks: LabelClaim[];
    processes: LabelClaim[];
  };
}

/**
 * ============================================
 * DAILY REPORT v4 TYPES
 * ============================================
 */

export interface DailyReportV4Sections {
  deliverables: AutoDeliverable[];
  plan: string;
  actuals: string;
  bottleneck: ConstraintEntry[];
  courseCorrection: string;
  rituals: RitualResponse[];
  visionForTomorrow: string;
  frameworkClaims: LabelClaim[];
  processClaims: LabelClaim[];
  timesheetEstimates: TimesheetCategory[];
}

export interface DailyReportV4 {
  date: string;
  status: ReportStatus;
  sections: DailyReportV4Sections;
  voiceTranscript?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface ExtractFromVoicePayload {
  transcript: string;
  dailyPlanItems: Array<{ text: string; status: string }>;
  programLabels: ProgramLabel[];
}

/** Response from POST /loops/daily-report/extract-voice (Repo 2 AI or fallback) */
export interface VoiceExtractDailyResponse {
  reflection: string;
  frameworkClaims: LabelClaim[];
  processClaims: LabelClaim[];
  timesheetEntries: TimesheetCategory[];
  selfGratitude: string;
  visionForTomorrow: string;
  constraintsIdentified: ConstraintEntry[];
  llmUnavailable?: boolean;
}

/** Response from POST /loops/weekly-plan/structure-from-voice (Repo 2 AI or fallback) */
export interface VoiceStructureWeeklyResponse {
  goals: unknown[];
  timetable: unknown[];
  suggestedMissingElements: string[];
  calendarEvents: unknown[];
  llmUnavailable?: boolean;
}

/**
 * ============================================
 * WEEKLY PLAN v4 EXTENSIONS
 * ============================================
 */

export interface IPGoal {
  ipItemId?: string;
  title: string;
  targetCommitCount: number;
  zone: IPZone;
  programId?: string;
}

export interface WeeklyCapabilityGoals {
  frameworks: LabelClaim[];
  processes: LabelClaim[];
}

export interface MonthlyBasketItem {
  id: string;
  title: string;
  programId: string;
  programName: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedHours: number;
  outputSpec?: string;
  deadline?: string;
  parentCommitmentId?: string;
  pickedIntoWeek?: string | boolean | null;
  /** Monthly curator only: this ticket is already a deliverable on the month's plan. */
  alreadyPicked?: boolean;
  /** Spec Axis 1: rough week allocation set on the monthly plan. */
  targetWeek?: string | null;
  /** How far this deliverable has been carried down the cascade. */
  consumption?: {
    periods: string[];
    weeksWorked: number;
    picked: number;
    completed: number;
    exhausted: boolean;
  } | null;
}

/**
 * ============================================
 * WEEKLY REPORT v4 TYPES
 * ============================================
 */

export interface DeliverableSummary {
  total: number;
  completed: number;
  inProgress: number;
  items: Array<{ ticketId: string; label: string; status: DeliverableStatus; programId: string }>;
}

/** Spec B4: derived from the item's verified commit count, never typed. */
export type IPMaturityLevel = 'none' | 'nascent' | 'developing' | 'mature' | 'established';

export interface IPSummary {
  totalCommits: number;
  targetCommits: number;
  items: Array<{
    ipItemId: string;
    title: string;
    /** Commits by this person in THIS month. */
    commits: number;
    /** Spec B4. Cumulative across all contributors, so it can exceed `commits`. */
    maturityLevel?: IPMaturityLevel;
    maturityChange?: 'up' | 'down' | 'stable';
    totalCommits?: number;
    contributors?: number;
  }>;
}

/** Spec A2: work that displaced the plan, grouped by why it arrived. */
export interface UnplannedSummary {
  totalItems: number;
  totalMinutes: number;
  totalHours: number;
  bySource: Record<string, { items: number; minutes: number }>;
}

export interface ClaimSummary {
  claims: LabelClaim[];
  totalQuantity: number;
}

export interface RitualSummary {
  participated: number;
  total: number;
  events: Array<{ ritualId: string; ritualName: string; date: string }>;
}

export interface TimetableAdherenceSummary {
  plannedHours: number;
  actualHours: number;
  adherencePercent: number;
}

export interface AxisSummaries {
  deliverables: DeliverableSummary;
  ip: IPSummary;
  frameworks: ClaimSummary;
  processes: ClaimSummary;
  rituals: RitualSummary;
  timetableAdherence: TimetableAdherenceSummary;
}

export interface WeeklyReportV4 {
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  axisSummaries: AxisSummaries;
  happiness: number | null;
  narrative: string | null;
  missingDays: string[];
  analyticsSnapshot?: {
    totalHours: number;
    categories: TimesheetCategory[];
  };
  careerRunrateSnapshot?: CareerRunrateSnapshot;
  submittedAt?: string;
}

/**
 * ============================================
 * MONTHLY REPORT TYPES
 * ============================================
 */

export interface MonthlyKPICommit {
  kpiId: string;
  kpiName: string;
  programId: string;
  targetValue: string;
  actualValue: string;
  unit: string;
  /** `reported` = an actual was entered but the KPI has no usable target to judge it against. */
  status: "hit" | "miss" | "partial" | "pending" | "reported";
}

export interface MonthlyAxisSummary {
  deliverables: DeliverableSummary;
  ip: IPSummary;
  kpis: MonthlyKPICommit[];
  frameworks: ClaimSummary;
  processes: ClaimSummary;
  rituals: RitualSummary;
}

export interface WeeklySummaryCard {
  weekStart: string;
  weekEnd: string;
  happiness: number | null;
  deliverableCount: number;
  ipCommits: number;
  submitted: boolean;
}

export interface WeeklyBreakdownEntry {
  weekStart: string;
  weekEnd: string;
  delivered: number;
  total: number;
  ipCommits: number;
  happiness: number | null;
  submitted: boolean;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  status: ReportStatus;
  axisSummaries: MonthlyAxisSummary;
  /** Spec A2. Absent on responses from before it was aggregated. */
  unplanned?: UnplannedSummary;
  weeklySummaries: WeeklySummaryCard[];
  narrative: string | null;
  portfolioId?: string;
  submittedAt?: string;
  gapFlags?: string[];
  happiness?: number | null;
  weeklyBreakdown?: WeeklyBreakdownEntry[];
  missingWeeks?: string[];
  missingDays?: string[];
  carryoverTrend?: number[];
  weeklyHappiness?: (number | null)[];
  analyticsSnapshot?: { totalHours: number; categories: TimesheetCategory[] } | null;
}

export interface MonthlyConstraintPattern {
  type: string;
  occurrences: number;
  weeksAppeared: number;
  topMicro: string | null;
  topMicroCount: number;
}

export interface MonthlyConstraintSummary {
  raised: number;
  resolved: number;
  open: number;
  resolutionRate: number;
  avgResolutionDays: number;
  longestOpen: { description: string; ageDays: number } | null;
  recurringPatterns: MonthlyConstraintPattern[];
}

export interface MonthlyReportSubmitPayload {
  month: string;
  kpiCommits: MonthlyKPICommit[];
  additionalNotes?: string;
  happiness?: number;
}

/**
 * ============================================
 * CAREER RUNRATE TYPES
 * ============================================
 */

export interface AxisScores {
  deliverables: number;
  ip: number;
  kpis: number;
  frameworks: number;
  processes: number;
  rituals: number;
}

export interface CareerRunrateSnapshot {
  date: string;
  axisScores: AxisScores;
  compositeScore: number;
  level: string | null;
  ladder: string | null;
}

export interface PlannedTrajectory {
  points: Array<{ date: string; level: string; score: number }>;
}

export interface ProjectedTrajectory {
  points: Array<{ date: string; projectedScore: number }>;
  nextLevelEligibility: {
    level: string;
    estimatedDate: string | null;
    gapAreas: string[];
  } | null;
}

export interface LevelCriteria {
  axis: AxisType;
  minScore: number;
  weight: number;
  description: string;
}

export interface LadderLevel {
  id: string;
  name: string;
  order: number;
  criteria: LevelCriteria[];
  minCompositeScore: number;
}

export interface CareerLadder {
  id: string;
  name: string;
  orgId: string;
  levels: LadderLevel[];
}

export interface CareerRunrateData {
  planned: PlannedTrajectory;
  actual: CareerRunrateSnapshot[];
  projected: ProjectedTrajectory;
  currentLevel: LadderLevel | null;
  nextLevel: LadderLevel | null;
  ladder: CareerLadder;
}

/** Enriched snapshot with computed display fields — for MomentumStrip */
export interface CareerRunrateSnapshotEnriched extends CareerRunrateSnapshot {
  delta: number | null;
  deltaDirection: "up" | "down" | "flat" | "first";
  isLevelChange: boolean;
  monthLabel: string;
}

/** Single axis evaluated against next-level criteria — for AxisGapBoard */
export interface AxisGapItem {
  axis: string;
  label: string;
  current: number;
  required: number;
  gap: number;
  cleared: boolean;
  hasCriteria: boolean;
  fillPct: number;
}

/** Trajectory comparison result — for TrajectorySignal */
export interface TrajectoryDelta {
  monthsDelta: number;
  direction: "ahead" | "behind" | "on-track";
  concreteMilestone: {
    level: string;
    plannedDate: string;
    achievedDate: string;
  } | null;
}

/** Pre-computed timeline node — for RunwayTimeline */
export interface RunwayNode {
  id: string;
  label: string;
  date: string;
  type: "achieved" | "current" | "projected" | "future";
  compositeScore?: number;
  positionPct: number;
  confidenceBand?: {
    leftPct: number;
    widthPct: number;
    earliest: string;
    latest: string;
  };
}

/**
 * ============================================
 * LEADERSHIP PORTFOLIO TYPES
 * ============================================
 */

export type PortfolioSectionType =
  | "executive_summary"
  | "contribution_highlights"
  | "capability_growth"
  | "kpi_impact"
  | "constraint_patterns"
  | "career_trajectory";

/**
 * The shape returned by GET /v3/pdgms/loops/monthly-report/portfolio, which
 * pre-labels each section: { id, title, dataPoints, narrative }.
 *
 * Careful: GET /v3/pdgms/scoring/portfolios returns the SAME portfolio through a
 * different serializer, as { type, data, narrative } with no title. That shape is
 * typed separately in portfolio-showcase.service.ts. Reading one shape's field
 * names off the other endpoint yields undefined, which is what made
 * Object.entries throw on the old portfolio screen.
 */
export interface LeadershipPortfolioSection {
  id: PortfolioSectionType;
  title: string;
  dataPoints: Record<string, unknown>;
  narrative: string | null;
}

export interface LeadershipPortfolio {
  sections: LeadershipPortfolioSection[];
  generatedAt: string | null;
  uid: string;
  monthId?: string;
  portfolioId?: string;
  period?: { from: string | null; to: string | null };
}

/**
 * ============================================
 * UBS (USAGE-BASED SCORE) TYPES
 * ============================================
 */

export interface UBSEvent {
  eventType: string;
  eventLabel: string;
  weight: number;
  participated: boolean;
  timestamp?: string;
}

export interface UBSScore {
  weekStart: string;
  score: number;
  maxPossible: number;
  breakdown: UBSEvent[];
  configSource?: "miniGroup" | "org" | "dt";
  miniGroupId?: number;
  miniGroupName?: string;
}

export interface UBSTrend {
  weeks: Array<{ weekStart: string; score: number | null }>;
}

export interface UBSConfigItem {
  eventType: string;
  eventLabel: string;
  weight: number;
}

export interface LadderLevelDetail {
  level: string;
  title: string;
  criteria?: Record<string, { minScore: number }>;
}

export interface LadderDetails {
  levels: LadderLevelDetail[];
}

/**
 * ============================================
 * IP (INTELLECTUAL PROPERTY) TYPES
 * ============================================
 */

export type VLayer = "v1" | "v2" | "v3" | "v4" | "v5";
export type HLayer = "h1" | "h2" | "h3" | "h4" | "h5";

/** @deprecated Independent IP system replaced by cascade (MonthlyIPGoal + IPSummary). */
export interface IPCommit {
  commitId: string;
  authorId: string;
  date: string;
  description: string;
  labelClaims: LabelClaim[];
  sourceReport: string | null;
  verified: boolean;
  verifiedBy: string | null;
}

/** @deprecated Independent IP system replaced by cascade (MonthlyIPGoal + IPSummary). */
export interface IPMaturity {
  commitCount: number;
  contributorCount: number;
  lastCommitAt: string | null;
  level: "nascent" | "developing" | "mature" | "established";
}

/** @deprecated Independent IP system replaced by cascade (MonthlyIPGoal + IPSummary). */
export interface IPItem {
  id: string;
  title: string;
  description: string;
  programId: string | null;
  zone: IPZone;
  levelTag: string | null;
  horizontalTag: string | null;
  cellRef: string | null;
  status: string;
  createdBy: string;
  approvedBy: string | null;
  hrApproved: boolean;
  commits: IPCommit[];
  collaborators: string[];
  maturity: IPMaturity;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Independent IP system replaced by cascade (MonthlyIPGoal + IPSummary). */
export interface IPWeeklyTarget {
  weekStart: string;
  targetCommits: number;
  actualCommits: number;
}

/** @deprecated Independent IP system replaced by cascade (MonthlyIPGoal + IPSummary). */
export interface IPCreatePayload {
  title: string;
  description: string;
  programId: string;
  gridCell: { vertical: VLayer; horizontal: HLayer };
  zone: IPZone;
}
