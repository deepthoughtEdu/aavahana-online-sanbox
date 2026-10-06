/**
 * Counted in characters, spaces included (changed from 250 words on
 * 2026-09-11: words asked for half a page). A run of spaces or line breaks
 * counts as one, so padding cannot reach the minimum. The backend counts the
 * same way in loops/report-explanation.js; the two must agree, or a person who
 * sees "Minimum reached" is rejected on submit.
 */
export const MIN_REPORT_EXPLANATION_CHARS = 250;

export interface ReportExplanation {
  constraintMacroId?: string | null;
  frameworkMacroId?: string | null;
  frameworkMicroId?: string | null;
  narrative?: string | null;
  smoothDayNote?: string | null;
  constraintDetail?: string | null;
}

export function countExplanationChars(text: string): number {
  return Array.from(text.replace(/\s+/g, " ").trim()).length;
}

export function explanationLength(report: ReportExplanation): number {
  const texts = report.frameworkMacroId || report.frameworkMicroId
    ? [report.narrative]
    : [report.narrative, report.smoothDayNote, report.constraintDetail];
  return countExplanationChars(texts
    .filter((value) => typeof value === "string").join(" "));
}

export function needsReportExplanation(report: ReportExplanation): boolean {
  const needsContext = !report.constraintMacroId || Boolean(report.frameworkMacroId || report.frameworkMicroId);
  return needsContext && explanationLength(report) < MIN_REPORT_EXPLANATION_CHARS;
}
