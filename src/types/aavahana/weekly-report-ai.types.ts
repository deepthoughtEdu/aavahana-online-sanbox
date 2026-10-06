// Types for the AI-generated (BYOK) weekly report.
import type { ReportStatus } from "@/types/aavahana/pdgms.types";

/** One generated section, rendered as a Section header (heading) + editable body. */
export interface WeeklyReportAiSection {
  key: string;
  heading: string;
  body: string;
}

/** Persisted draft/submitted AI weekly report for a week (GET + generate). */
export interface WeeklyReportAi {
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  /** True once the week has fully ended — only then can it be generated. */
  weekEnded: boolean;
  sections: WeeklyReportAiSection[];
  /**
   * Legacy markdown shape — present when an older backend build is deployed
   * that returns a single narrative instead of structured `sections`. The FE
   * parses this into sections as a fallback.
   */
  narrative?: string | null;
  submittedAt: string | null;
  generatedAt: string | null;
  weekdayCount: number;
  missingDays: string[];
}

/** Result of a generate call (carries the same shape + provider/model). */
export interface WeeklyReportAiGenerateResult extends WeeklyReportAi {
  daysIncluded: number;
  provider: string;
  model: string;
}

export interface WeeklyReportAiGeneratePayload {
  weekStart: string;
  apiKey?: string;
  provider?: string;
  model?: string;
}

export interface WeeklyReportAiSubmitResult {
  success: boolean;
  weekStart: string;
  status: ReportStatus;
  submittedAt: string | null;
  /** Variable-reward insight (F2) — deterministic, rotating wording; null when no signal. */
  insight?: import("./insight.types").SubmitInsight | null;
}

/** A single deliverable line inside a daily report (source-data view). */
export interface WeekDailyDeliverable {
  title: string;
  status: string;
}

/** One weekday's daily report — the source data the weekly report is built from. */
export interface WeekDailyEntry {
  date: string;
  weekday: string;
  status: "submitted" | "missing" | "upcoming";
  smoothDay: boolean;
  deliverables: WeekDailyDeliverable[];
  unplannedCount: number;
  constraint: string | null;
  feeling: string | null;
  narrative: string | null;
}

/** GET /weekly-report/dailies — the week's submitted dailies, per weekday. */
export interface WeekDailiesResponse {
  weekStart: string;
  weekEnd: string;
  weekEnded: boolean;
  submittedCount: number;
  days: WeekDailyEntry[];
}

/** A single deliverable line inside a daily report (source-data view). */
export interface WeekDailyDeliverable {
  title: string;
  status: string;
}

/** One weekday's daily report — the source data the weekly report is built from. */
export interface WeekDailyEntry {
  date: string;
  weekday: string;
  status: "submitted" | "missing" | "upcoming";
  smoothDay: boolean;
  deliverables: WeekDailyDeliverable[];
  unplannedCount: number;
  constraint: string | null;
  feeling: string | null;
  narrative: string | null;
}

/** GET /weekly-report/dailies — the week's submitted dailies, per weekday. */
export interface WeekDailiesResponse {
  weekStart: string;
  weekEnd: string;
  weekEnded: boolean;
  submittedCount: number;
  days: WeekDailyEntry[];
}
