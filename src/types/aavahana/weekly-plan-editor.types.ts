// Types for the editable weekly plan (AI-generated → edit → save) shown in the
// Deliverables section of the Weekly Plan screen.

/** One editable task row on the Weekly Plan screen. `day` = mon..fri (or null). */
export interface PlanTask {
  id: string;
  label: string;
  day?: string | null;
  /**
   * The id this task actually has on the server, present only for rows loaded
   * from a saved plan. Kept separate from `id` because `toRows` invents a local
   * id for anything without one, and sending an invented id back would create a
   * task the server thinks it already knows. Round-tripping this is what lets a
   * RENAMED task keep its completion state and timetable blocks; without it the
   * server can only match on the label.
   */
  serverId?: string;
  /**
   * The monthly deliverable this task was pulled from, when it was pulled from
   * one. Travels back on save so the cascade can attribute the pick.
   */
  sourceItemId?: string;
}

/** A deliverable as stored on the weekly Plan row (free-form JSON). */
export interface SavedWeeklyPlanDeliverable {
  id?: string | number;
  label?: string;
  title?: string;
  quantity?: number;
  day?: string | null;
  priority?: string | null;
  estimateMins?: number | null;
  source?: string;
  programId?: string | null;
}

/** A risk/blocker as stored on the weekly Plan row. */
export interface SavedWeeklyPlanRisk {
  id?: string | number;
  title?: string;
  label?: string;
}

/** The current weekly Plan row (GET /weekly-plan). Null when none saved yet. */
export interface SavedWeeklyPlan {
  id: number;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  narrative?: string | null;
  deliverables?: SavedWeeklyPlanDeliverable[];
  risks?: SavedWeeklyPlanRisk[];
}

/** One task in the save payload. Tasks-only for now; other fields are optional. */
export interface SaveWeeklyPlanItem {
  /** Server id of an existing task; omit for a new one so the server mints it. */
  id?: string;
  /** Monthly deliverable this item came from, for the cascade ledger. */
  sourceItemId?: string;
  title: string;
  day?: string | null;
  priority?: string;
  estimateMins?: number;
  source?: string;
  programId?: string;
}

export interface SaveWeeklyPlanPayload {
  weekStart?: string;
  items: SaveWeeklyPlanItem[];
  risks?: { title: string }[];
  reflection?: string;
}

export interface SaveWeeklyPlanResult {
  planId: number;
  weekStart: string;
  weekEnd: string;
  status: string;
  itemCount: number;
  cascade: {
    weeklyPicks: number;
    dailyRows: number;
    /** The plan was saved, but its downstream basket could not be reconciled. */
    error?: string;
  };
  /** Variable-reward insight (F2) — deterministic, rotating wording; null when no signal. */
  insight?: import("./insight.types").SubmitInsight | null;
}

/** A pickable candidate from the planner context (carry-forward / monthly). */
export interface WeeklyPlannerCandidate {
  id: string;
  title: string;
  source: string;
  estimateMins?: number;
  programId?: string;
  programName?: string;
}

export interface WeeklyPlannerLastWeekItem {
  id: string;
  title: string;
  status: string;
}

/** GET /weekly-plan/context — the week + last-week recap + pick candidates. */
export interface WeeklyPlannerContext {
  week: { weekStart: string; weekEnd: string; label: string };
  hasPreviousWeek: boolean;
  lastWeekItems: WeeklyPlannerLastWeekItem[];
  recurringBlocker: string | null;
  carryForwardCandidates: WeeklyPlannerCandidate[];
  monthlyBasketCandidates: WeeklyPlannerCandidate[];
}
