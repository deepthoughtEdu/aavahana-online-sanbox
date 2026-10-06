/**
 * Insight returned to the submitter on every plan/report submit
 * (F2 Week 2 Jul 2026 — variable reward; wording rotates server-side so two
 * submits never read the same). Shape owned by the backend
 * (intelligence/submit-insight.js). Present on the submit responses of:
 * daily report v7, daily plan, weekly plan (planner), weekly report (AI).
 */
export interface SubmitInsight {
  /** null for the no-signal reflection (there is no HcdInsight row behind it). */
  id: string | null;
  category: string;
  categoryLabel: string;
  severity: string;
  /** "reflection" is the rotating nudge returned when no signal was detected. */
  signalType: "constraint" | "positive" | "reflection";
  title: string;
  description: string;
  suggestedImprovement: string | null;
  /** "Why don't you come up with an idea for this?" — only on constraints. */
  ideaNudge: string | null;
  /** "Learn this, then ideate" line (F2 Week 3) — only on constraints. */
  learningRecommendation: string | null;
  occurrenceCount: number;
}
