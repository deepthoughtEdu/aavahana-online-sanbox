// Hand-off between the "Plan Your Week" input screen and the "Weekly Plan"
// screen. On "Generate plan", the input screen stashes the user's intent here
// and navigates to /aavahana/weekly-plan, which consumes it, runs the AI
// generation (showing a "creating your plan" state), and populates the editable
// plan. Stored in sessionStorage so a refresh on the plan screen doesn't
// silently re-trigger generation (it's consumed once).

export const WEEKLY_PLAN_GENERATE_KEY = "weeklyPlanGenerateRequest";

export interface WeeklyPlanGenerateRequest {
  intent: string;
  weekStart?: string;
}

export function stashWeeklyPlanGenerate(req: WeeklyPlanGenerateRequest): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(WEEKLY_PLAN_GENERATE_KEY, JSON.stringify(req));
}

/** Read and clear the pending request (one-shot). */
export function consumeWeeklyPlanGenerate(): WeeklyPlanGenerateRequest | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(WEEKLY_PLAN_GENERATE_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(WEEKLY_PLAN_GENERATE_KEY);
  try {
    return JSON.parse(raw) as WeeklyPlanGenerateRequest;
  } catch {
    return null;
  }
}
