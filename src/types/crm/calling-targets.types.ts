// What a caller owes today (or this week), how far along they are, and the pace they are being
// nudged against. Mirrors the payload of GET /v3/pdgms/crm/calling-targets/me.
//
// One shape for all three surfaces — the dialler pace bar, the notification and the home dashboard
// — so they cannot disagree about a number that gates somebody's bonus.

export type CallingMeasure = "dials" | "connects" | "consents" | "commitments";
export type CallingPeriodType = "day" | "week";
export type CallingEnforcement = "hard" | "visible";

export interface CallingLine {
  measure: CallingMeasure;
  /** "Connected", "Consents", "Meetings". Server-owned so the wording is identical everywhere. */
  label: string;
  current: number;
  target: number;
  /** true = this bar escalates and gates the bonus. false = progress only. */
  hard: boolean;
  met: boolean;
  /** "person" when an override applies (Rebecca, Teetus), "program" when it is the team default. */
  scope: "person" | "program";
}

/**
 * Present only while the caller is INSIDE their team's push window. null the rest of the day, on
 * purpose: BD's window ends at 18:00 even though the shift runs to 19:00, because that last hour is
 * reflection and training. Nudging into it would spend the hour finishing early is meant to buy.
 */
export interface CallingPace {
  inWindow: true;
  done: number;
  target: number;
  remaining: number;
  /** Minutes until the window closes — 18:00 for BD, not the 19:00 shift end. */
  minutesLeft: number;
  /** Rounded UP: needing 12.1 an hour means 13. */
  neededPerHour: number;
  /** Where an even run from the window's start would have them by now. */
  expectedByNow?: number;
  onPace: boolean;
  /** Bar already cleared — stop asking for a rate and say so. */
  done_early: boolean;
}

export interface CallingProgramProgress {
  programId: number;
  programName: string;
  periodType: CallingPeriodType;
  /** YYYY-MM-DD in the ORG's timezone. */
  periodStart: string;
  targets: { measure: CallingMeasure; targetValue: number; enforcement: CallingEnforcement; scope: string }[];
  actuals: Partial<Record<CallingMeasure, number>>;
  lines: CallingLine[];
  pace: CallingPace | null;
  /** null when this team has no bars set at all. */
  met: boolean | null;
  shortfall?: { measure: CallingMeasure; target: number; actual: number; short: number }[];
  nudgeIntervalMinutes: number;
  /** "no-targets-set" when the team exists but nobody has set its numbers. */
  note?: string;
}

export interface CallingProgress {
  agentEid: string;
  at: string;
  programs: CallingProgramProgress[];
}

export interface CallingPeriodRow {
  id: number;
  programId: number;
  agentEid: string;
  periodType: CallingPeriodType;
  periodStart: string;
  targets: { measure: CallingMeasure; targetValue: number; enforcement: CallingEnforcement }[];
  actuals: Partial<Record<CallingMeasure, number>>;
  met: boolean;
  shortfall: { measure: CallingMeasure; target: number; actual: number; short: number }[] | null;
  /** null while the 24h correction window is still open. Only a frozen row is bonus evidence. */
  frozenAt: string | null;
}

export interface CallingConsistency {
  agentEid: string;
  judged: number;
  met: number;
  missed: number;
  frozen: number;
  /** Percentage of judged periods met, or null when nothing has been judged yet. */
  rate: number | null;
  periods: CallingPeriodRow[];
}

export interface CallingProgramBoard {
  programId: number;
  timeZone: string;
  members: (CallingProgramProgress & { agentEid: string })[];
}
