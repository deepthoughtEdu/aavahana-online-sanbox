/**
 * HCD Intelligence — Module 1 (Constraint Intelligence) + Module 2 (Management
 * Insights) types. Enum values are snake_case to match the backend taxonomy
 * (src/pdgms/intelligence/taxonomy.js). Import by direct path, not the barrel.
 */

export type InsightCategory =
  | "bottleneck"
  | "repeated_blocker"
  | "missed_commitment"
  | "dependency"
  | "productivity"
  | "communication"
  | "learning_gap"
  | "process_inefficiency"
  // positive-signal categories (signalType: "positive")
  | "high_delivery"
  | "deep_focus"
  | "collaboration"
  | "well_being";

export type InsightSeverity = "info" | "low" | "medium" | "high" | "critical";
export type InsightSignalType = "constraint" | "positive" | "watch";
export type InsightStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "dismissed"
  | "superseded";
export type InsightDetectionMethod = "deterministic" | "llm" | "hybrid";

export interface HcdInsight {
  id: string;
  orgId: string;
  eid: number | null;
  teamEid: number | null;
  deptId: string | null;
  category: InsightCategory;
  subCategory: string | null;
  severity: InsightSeverity;
  signalType: InsightSignalType;
  title: string;
  description: string;
  suggestedImprovement: string | null;
  source: string;
  detectionMethod: InsightDetectionMethod;
  confidenceScore: number | null;
  occurrenceCount: number;
  status: InsightStatus;
  resolutionNote: string | null;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsightSummary {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface InsightFilters {
  page?: number;
  perPage?: number;
  category?: InsightCategory;
  severity?: InsightSeverity;
  status?: InsightStatus;
  signalType?: InsightSignalType;
  periodKey?: string;
}

export interface DetectPayload {
  eid?: number;
  date?: string;
  byok?: { provider: string; apiKey: string; model: string };
}

export interface DetectResponse {
  periodKey: string;
  count: number;
  insights: HcdInsight[];
}

export interface UpdateInsightStatusPayload {
  id: string;
  status: InsightStatus;
  resolutionNote?: string;
}

// ── Module 2 — Management Reports ──────────────────────────────────────────

export type ReportScope = "employee" | "team" | "department" | "org";
export type ReportAudience = "supervisor" | "business_owner" | "org_admin";

export interface ReportSections {
  constraintsFound?: string;
  positiveAchievements?: string;
  employeesNeedingAttention?: string;
  teamsPerformingWell?: string;
  trends?: string;
  suggestedActions?: string;
}

export interface ReportMetrics {
  constraintCount: number;
  positiveCount: number;
  attentionCount: number;
  strongTeamCount: number;
  trendDelta: number;
  avgDeliveryRate: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  attentionEids: number[];
}

export interface HcdInsightReport {
  id: string;
  orgId: string;
  scope: ReportScope;
  scopeRef: string;
  audience: ReportAudience;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  sections: ReportSections;
  narrative: string;
  metrics: ReportMetrics;
  insightIds: string[];
  generatedBy: string;
  createdAt: string;
}

export interface ReportParams {
  date?: string;
  cadence?: "day" | "week" | "month";
}
