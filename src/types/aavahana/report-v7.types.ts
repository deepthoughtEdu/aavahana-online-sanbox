/**
 * v7 Daily Report — API types for backend integration.
 * Engine/flow types live in report-engine.types.ts (shared with v6).
 */

import type {
  PlannedDeliverable,
  UnplannedDeliverable,
  Dictionary,
  NestedDictionary,
  DeliverableStatus,
} from "./report-engine.types";

// ── API response shapes ──

/** GET /v3/pdgms/ontology/feelings */
export interface FeelingsResponse {
  feelingTypes: {
    id: string;
    label: string;
    micros: { id: string; label: string; dimension: string; narrativeLabel: string }[];
  }[];
}

/** GET /v3/pdgms/ontology/navigations */
export interface NavigationsResponse {
  navigations: Record<string, {
    macro: { id: string; label: string }[];
    micro: Record<string, { id: string; label: string }[]>;
  }>;
}

/** GET /v3/pdgms/ontology/constraints */
export interface ConstraintsResponse {
  constraintTypes: {
    key: string;
    label: string;
    subConstraints: {
      key: string;
      label: string;
      navigations: { key: string; label: string; prompt: string }[];
    }[];
  }[];
}

/** GET /v3/pdgms/ontology/framework-assignments/my — partial shape used by adapter */
export interface FrameworksResponse {
  domains: {
    domain: string;
    horizontalTag: string;
    verticals: {
      verticalTag: string;
      verticalLevel: string;
      cells: {
        position: number;
        subcategory: string;
        frameworks: { id: number; name: string; creator: string; description: string }[];
      }[];
    }[];
  }[];
  totalEntries: number;
}

/** GET /v3/pdgms/loops/daily-report/v7/signals */
export interface V7Signals {
  programCpData: { area: string } | null;
  programSampleSize: number;
  programMajorityConstraint: string | null;
  unplannedHistoryDays: number;
  historyHasFasterInstance: Record<string, boolean>;
  recurringDependency: { type: string; count: number; days: number } | null;
  recurringConstraint: { micro: string; count: number; days: number } | null;
  isNewNavigation: Record<string, boolean>;
  smoothStreakDays: number;
  teamSampleSize: number;
}

/** POST /v3/pdgms/loops/daily-report/v7/submit — request body */
export interface V7SubmitPayload {
  date: string;
  payload: {
    constraintMacroId: string | null;
    constraintMicroId: string | null;
    navigationMacroId: string | null;
    navigationMicroId: string | null;
    frameworkMacroId: string | null;
    frameworkMicroId: string | null;
    frameworkQuantity: number | null;
    feelingMacroId: string | null;
    feelingMicroId: string | null;
    narrative: string | null;
    constraintDetail: string | null;
    smoothDayNote: string | null;
    /**
     * "What went well today?" — chip ids, never required (PRD §12). More than
     * one can be picked. Empty means unanswered; ["nothing"] means answered and
     * nothing stood out. The two must stay distinguishable or a weekly summary
     * cannot tell a quiet week from an unasked one.
     */
    wentWell?: string[];
    deliverables: PlannedDeliverable[];
    unplanned: UnplannedDeliverable[];
    frameworkHelpedConstraint: string | null;
    frameworkCommitment: Record<string, unknown> | null;
    skippedAct2: boolean;
    history: Record<string, unknown>[];
    durationSecs: number | null;
    engineState: Record<string, unknown> | null;
  };
  // BYOK LLM creds — optional. When present, advisory AI reflection feedback is
  // generated on submit. When absent, the report submits normally with no AI.
  apiKey?: string;
  provider?: string;
  model?: string;
}

/**
 * GET /v3/pdgms/loops/daily-report/v7/streak — the seed-to-plant growth data.
 * growthScore (submitted reports minus missed weekdays) drives the plant stage:
 * a missed weekday pulls it back a step, weekends never count. submittedDays is
 * the raw report count; currentStreak is a bonus label.
 */
export interface GrowthStreak {
  submittedDays: number;
  /** Plant-stage driver: submitted reports minus missed weekdays, floored at 0. */
  growthScore: number;
  /** Missed weekdays (Mon-Fri) since the first submitted report; weekends never count. */
  missedWeekdays: number;
  currentStreak: number;
  longestStreak: number;
}

/** POST /v3/pdgms/loops/daily-report/v7/submit — response */
export interface V7SubmitResponse {
  reportId: string;
  feedback: {
    streak: number;
    constraintPersistence: number;
    navigationVariety: number;
    points: number;
  };
  /** Advisory AI reflection feedback — present when BYOK creds were supplied. */
  aiFeedback?: AiFeedback;
  /** Variable-reward insight (F2) — deterministic, rotating wording; null when no signal. */
  insight?: import("./insight.types").SubmitInsight | null;
}

// ── Recognition highlight ─────────────────────────────────────────────────────

/**
 * POST /v3/pdgms/loops/daily-report/v7/highlight — the optional "tell me more"
 * volunteered on the recognition screen AFTER submitting. Never part of the
 * submit payload: the report is already saved when this is asked, so answering
 * can't be a precondition for closing the day.
 */
export interface V7HighlightPayload {
  date: string;
  /** Empty string clears a previously saved highlight. */
  highlight: string;
  /** The rotating question they were answering — stored so the text reads later. */
  prompt?: string;
}

export interface V7HighlightResponse {
  saved: boolean;
  highlight: string | null;
  highlightAt: string | null;
}

// ── AI reflection feedback (exit doorway) ──────────────────────────────────────

export type AiFeedbackStatus =
  | "complete"
  | "needs_nudge"
  | "partial"
  | "errored"
  | "skipped";

/** One extracted reflection answer. */
export interface AiReflectionQA {
  question: string;
  response: string;
}

/** The 4 (+2) extracted reflection answers. */
export interface AiDailyReflection {
  planForToday?: AiReflectionQA;
  actualDone?: AiReflectionQA;
  proudOf?: AiReflectionQA;
  assetsOrProcesses?: AiReflectionQA;
  blockers?: AiReflectionQA;
  planForTomorrow?: AiReflectionQA;
}

/** Reflection-quality rubric (0–5 each). Advisory only — NOT career scoring. */
export interface AiRubricScore {
  clarity: number;
  selfAwareness: number;
  learning: number;
  specificity: number;
  total: number;
}

/** Prompt A — Reflection Evaluator output. */
export interface AiReflection {
  dailyReflection: AiDailyReflection | null;
  rubricScore: AiRubricScore | null;
  suggestions: string[];
  appreciation: string | null;
}

/** Returned instead of a full reflection when a required answer is missing. */
export interface AiNudge {
  missingQuestions: string[];
  nudgeMessages: string[];
}

export interface AiScoringEntry {
  level: number;
  feedback: string;
}

/** Prompt B — P1–P4 scoring engine output. Advisory only — NOT career scoring. */
export interface AiScoring {
  date?: string | null;
  scores?: {
    P1_effort_estimation?: AiScoringEntry;
    P2_bottleneck_identification?: AiScoringEntry;
    P3_course_correction?: AiScoringEntry;
    P4_self_transformation?: AiScoringEntry;
  };
  evidence?: Record<string, string[]>;
}

export interface AiQuotaWarning {
  message: string;
  userTokensUsed: number;
  userTokenLimit: number;
  orgTokensUsed: number;
  orgTokenLimit: number;
}

/**
 * Prompt C — Framework suggestions (constrained to the org's framework catalog).
 * `id` always references a real `FrameworkRegistryEntry` so the UI can deep-link.
 */
export interface AiFrameworkSuggestion {
  id: number;
  name: string;
  fit: "strong" | "worth_trying";
  reason: string;
}

/** Skill / topic the user should learn next. */
export interface AiSkillSuggestion {
  topic: string;
  reason: string | null;
}

/** Habit / ritual to build. */
export interface AiHabitSuggestion {
  name: string;
  cadence: "daily" | "weekly";
  reason: string | null;
}

/**
 * Reading / Viewing item. `searchUrl` is pre-built by the backend (HBR or
 * YouTube search URL) so the UI just renders an <a>.
 */
export interface AiResourceSuggestion {
  title: string;
  searchQuery: string | null;
  searchUrl: string | null;
  reason: string | null;
}

/** Growth Coach output — skills + habits + reading + viewing. */
export interface AiGrowthRecommendations {
  skills: AiSkillSuggestion[];
  habits: AiHabitSuggestion[];
  reading: AiResourceSuggestion[];
  viewing: AiResourceSuggestion[];
}

/**
 * Advisory AI reflection feedback returned by the v7 submit endpoint.
 * Render purely by switching on `status` — every other field may be absent.
 */
export interface AiFeedback {
  status: AiFeedbackStatus;
  reason?: string; // when status === "skipped"
  error?: string; // when status === "errored" (whole step threw)
  provider?: string;
  model?: string;
  reflection?: AiReflection | null;
  nudge?: AiNudge | null;
  scoring?: AiScoring | null;
  frameworkSuggestions?: AiFrameworkSuggestion[];
  growthRecommendations?: AiGrowthRecommendations;
  quotaWarning?: AiQuotaWarning | null;
  errors?: {
    reflection: string | null;
    scoring: string | null;
    frameworkSuggestions?: string | null;
  };
  /** Retries consumed so far via the "Try again" button (initial submit doesn't count). */
  regenerateCount?: number;
  /** Retries still available — capped at MAX_REGENERATIONS (2) on the backend. */
  regenerateRemaining?: number;
  /** Grounding sources the feedback is anchored to (W2.1) — shown as chips, never invented. */
  grounding?: AiGroundingCitation[];
  /** Heroics-to-constraint prompt (W2.3) — present when the report reads as firefighting. */
  heroics?: { prompt: string; categories: string[] } | null;
}

/** A structured-layer source the feedback cites (linked constraint / peer experiment / L&D module). */
export interface AiGroundingCitation {
  kind: "linked_constraint" | "peer_experiment" | "lnd_module";
  label: string;
  ref: string;
  detail?: string | null;
}

/** POST /v3/pdgms/loops/daily-report/v7/regenerate-ai — request body */
export interface V7RegenerateAiPayload {
  date: string;
  apiKey?: string;
  provider?: string;
  model?: string;
}

// ── In-flow Socratic Coach (chat) ──────────────────────────────────────────────

export type V7CoachMessageRole = "user" | "assistant";

export interface V7CoachMessage {
  id: string;
  role: V7CoachMessageRole;
  text: string;
  timestamp: string;
}

/** GET /v3/pdgms/loops/daily-report/v7/coach?date=YYYY-MM-DD */
export interface V7CoachConversation {
  conversationId: string | null;
  messages: V7CoachMessage[];
}

/** POST /v3/pdgms/loops/daily-report/v7/coach — request body */
export interface V7CoachSendPayload {
  date: string;
  message: string;
  /**
   * Optional engine-state snapshot — sent so the AI coach can ground replies
   * in today's in-flight draft (tasks, statuses, constraint, etc.). Sent on
   * every turn so the LLM has fresh context (no server-side caching).
   */
  draft?: Record<string, unknown> | null;
  currentNodeId?: string | null;
  currentNodeText?: string | null;
  apiKey: string;
  provider: string;
  model: string;
}

/** POST response — just the new assistant message + the conversation id. */
export interface V7CoachSendResponse {
  conversationId: string;
  aiMessage: V7CoachMessage;
}

// ── "Help me with my report": a draft from a short exchange ──────────────────

/** One turn of the report helper: the app's question, or the person's answer. */
export interface V7SynthesizeMessage {
  role: "user" | "assistant";
  text: string;
}

/** POST /v3/pdgms/loops/daily-report/v7/synthesize: request body (report helper) */
export interface V7SynthesizePayload {
  date: string;
  /** The helper's exchange only. The private support chat is never sent. */
  messages: V7SynthesizeMessage[];
  /** The planned tasks, so the model can say which ones the answers covered. */
  deliverables: { id: number; label: string; status: DeliverableStatus }[];
  apiKey?: string;
  provider?: string;
  model?: string;
}

/**
 * A proposed report. The backend has checked every id against its own lists
 * and nulled anything the model made up. Nothing is saved until the person
 * submits.
 */
export interface V7SynthesizeResponse {
  proposed: {
    constraintMacroId: string | null;
    constraintMicroId: string | null;
    navigationMacroId: string | null;
    navigationMicroId: string | null;
    frameworkMacroId: string | null;
    frameworkMicroId: string | null;
    feelingMacroId: string | null;
    feelingMicroId: string | null;
    /** Their own words, quoted rather than rewritten. */
    narrative: string | null;
    smoothDayNote: string | null;
    frameworkCommitment: { macroId: string; macroLabel: string } | null;
    /** Only the tasks the answers covered. */
    taskStatuses: { id: number; status: "done" | "partial" | "not_done" }[];
    wentWell: string[];
  };
  dropped: string[];
  missing: string[];
}

/** PUT /v3/pdgms/loops/daily-report/v7/draft — request body */
export interface V7DraftPayload {
  date: string;
  engineState: Record<string, unknown>;
}

/**
 * GET /v3/pdgms/loops/daily-report/v7/draft — response.
 *
 * Returns today's report row whether it's a draft or already submitted.
 * - `status: "draft"`    → resume the conversation from `engineState`.
 * - `status: "submitted"`→ skip the conversation, render completion view +
 *                          `aiFeedback` (rebuilt from the persisted feedback row).
 */
export type V7DraftResponse = {
  status: "draft" | "submitted";
  engineState: Record<string, unknown> | null;
  savedAt: string;
  submittedAt: string | null;
  aiFeedback: AiFeedback | null;
} | null;

/** Bundled dictionaries for the resolver context */
export interface V7Dictionaries {
  constraints: Dictionary;
  navigations: NestedDictionary;
  frameworks: Dictionary;
  feelings: Dictionary;
}
