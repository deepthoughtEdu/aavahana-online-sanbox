import { toast } from "@/utils";
import type { SubmitInsight } from "@/types/aavahana/insight.types";

/**
 * Show the variable-reward submit insight (F2) as a single toast. Used by every
 * plan/report submit surface (daily plan, daily report, weekly plan, weekly
 * report) so the reward is consistent and unobtrusive. No-op when there is no
 * insight. Wording is composed server-side; we only present it.
 */
export function showInsightToast(insight?: SubmitInsight | null): void {
  if (!insight) return;
  const parts = [
    insight.description && insight.description.trim()
      ? `${insight.title}. ${insight.description}`
      : insight.title,
  ];
  // Constraints carry a "learn this, then ideate" line (F2 Week 3) — surface it
  // so the person knows what to learn to attack the constraint.
  if (insight.learningRecommendation && insight.learningRecommendation.trim()) {
    parts.push(insight.learningRecommendation.trim());
  }
  if (insight.ideaNudge && insight.ideaNudge.trim()) {
    parts.push(insight.ideaNudge.trim());
  }
  toast.success(parts.join(" "), { duration: parts.length > 1 ? 9000 : 6000 });
}
