/**
 * Frozen 6 activity categories (A88) — constants and structural problem detection.
 */

import type { TimesheetCategoryType, TimesheetCategory } from "@/types/aavahana/pdgms.types";

// ─── Category display labels ────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<TimesheetCategoryType, string> = {
  operational: "Operational",
  research: "Research",
  deep_work: "Deep Work",
  coordination: "Coordination",
  meetings: "Meetings",
  planning_strategy: "Planning / Strategy",
};

// ─── Semantic color tokens (no hex) ─────────────────────────────────────────

export const CATEGORY_BG: Record<TimesheetCategoryType, string> = {
  operational: "bg-warning",
  research: "bg-success",
  deep_work: "bg-primary",
  coordination: "bg-secondary",
  meetings: "bg-info",
  planning_strategy: "bg-accent",
};

export const CATEGORY_TEXT: Record<TimesheetCategoryType, string> = {
  operational: "text-warning",
  research: "text-success",
  deep_work: "text-primary",
  coordination: "text-secondary",
  meetings: "text-info",
  planning_strategy: "text-accent",
};

// ─── Structural problem detection (A9) ──────────────────────────────────────

export function detectStructuralProblems(
  categories: TimesheetCategory[]
): string[] {
  const total = categories.reduce((s, c) => s + c.hours, 0);
  if (total === 0) return [];

  const pct = (cat: TimesheetCategoryType): number => {
    const found = categories.find((c) => c.category === cat);
    return found ? (found.hours / total) * 100 : 0;
  };

  const problems: string[] = [];

  if (pct("coordination") > 50 && pct("deep_work") < 15) {
    problems.push(
      "More than half your week went to coordination while deep work got less than 15%. You're the bottleneck's messenger, not the bottleneck — escalate the coordination overhead as a constraint."
    );
  }
  if (pct("meetings") > 40) {
    problems.push(
      "Meetings took over 40% of your week. Each meeting that doesn't produce a decision or unblock a deliverable is throughput you can't recover. Name the ones that can be async."
    );
  }
  if (pct("deep_work") < 10) {
    problems.push(
      "Deep work dropped below 10%. This is where deliverables actually get done — everything else is overhead. Your plan next week needs protected time blocks, or this pattern repeats."
    );
  }

  return problems;
}
