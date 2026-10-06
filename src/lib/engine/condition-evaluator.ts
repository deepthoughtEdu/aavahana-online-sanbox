/**
 * Condition Evaluator for decision tree nodes.
 *
 * Evaluates the `condition` column from TSV against the current conversation context.
 * Conditions are human-readable strings — this evaluator pattern-matches them,
 * NOT eval(). Each condition maps to a typed check against ConversationContext.
 */

import type {
  PlannedDeliverable,
  UnplannedDeliverable,
  MacroMicroSelection,
} from "@/types/aavahana/report-engine.types";

// ── Conversation context the evaluator reads from ──

export interface ConversationContext {
  // Act 1 — deliverables
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];

  // Computed from deliverables
  totalPlanned: number;
  totalActual: number;
  doneCount: number;
  partialCount: number;
  notDoneCount: number;

  // Critical path
  cpItem: PlannedDeliverable | null;
  hasCpItem: boolean;

  // Time analysis
  timeGap: number;
  timeGapPercent: number;

  // Program data (from backend, null if unavailable)
  programCpData: { area: string } | null;
  programSampleSize: number;
  programMajorityConstraint: string | null;

  // History (from backend, null if unavailable)
  unplannedHistoryDays: number;
  historyHasFasterInstance: boolean;
  recurringDependency: { type: string; count: number; days: number } | null;
  recurringConstraint: { micro: string; count: number; days: number } | null;
  isNewNavigation: boolean;

  // Act 2 — selections
  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  hasUnplanned: boolean;

  // Current conversation
  lastAnswer: string | null;
  lastMacroPick: string | null;

  // ── Section C context ──

  // Entry path — how user arrived at Section C
  entryPath: "normal" | "smooth" | null;

  // Smooth-day streak (consecutive smooth days including today)
  smoothStreakDays: number;

  // Narrative char count
  charCount: number;

  // Feeling valence — derived from feeling macro selection
  valence: "positive" | "neutral" | "negative" | null;

  // Team mood signal (from backend, 0 if unavailable)
  teamSampleSize: number;

  // Framework selection (for Section C interpolation)
  framework: MacroMicroSelection | null;
  feeling: MacroMicroSelection | null;

  // Fallback flag — set when no other condition in a decision group matched
  isFallback: boolean;
}

/**
 * Build a ConversationContext from the current report state.
 */
export function buildContext(params: {
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  cpItem: PlannedDeliverable | null;
  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  lastAnswer: string | null;
  lastMacroPick: string | null;
  programCpData?: { area: string } | null;
  programSampleSize?: number;
  programMajorityConstraint?: string | null;
  unplannedHistoryDays?: number;
  historyHasFasterInstance?: boolean;
  recurringDependency?: { type: string; count: number; days: number } | null;
  recurringConstraint?: { micro: string; count: number; days: number } | null;
  isNewNavigation?: boolean;
  entryPath?: "normal" | "smooth" | null;
  smoothStreakDays?: number;
  charCount?: number;
  valence?: "positive" | "neutral" | "negative" | null;
  teamSampleSize?: number;
  framework?: MacroMicroSelection | null;
  feeling?: MacroMicroSelection | null;
}): ConversationContext {
  const { deliverables, unplanned } = params;

  const totalPlanned = deliverables.reduce((s, d) => s + d.estimateMins, 0);
  const deliverableActual = deliverables.reduce((s, d) => s + d.actualMins, 0);
  const unplannedMins = unplanned.reduce((s, u) => s + u.minutesTaken, 0);
  const totalActual = deliverableActual + unplannedMins;
  const timeGap = totalActual - totalPlanned;

  return {
    deliverables,
    unplanned,
    totalPlanned,
    totalActual,
    doneCount: deliverables.filter((d) => d.status === "done").length,
    partialCount: deliverables.filter((d) => d.status === "partial").length,
    notDoneCount: deliverables.filter((d) => d.status === "not_done" || d.status === null).length,
    cpItem: params.cpItem,
    hasCpItem: params.cpItem !== null,
    timeGap,
    timeGapPercent: totalPlanned > 0 ? (timeGap / totalPlanned) * 100 : 0,
    programCpData: params.programCpData ?? null,
    programSampleSize: params.programSampleSize ?? 0,
    programMajorityConstraint: params.programMajorityConstraint ?? null,
    unplannedHistoryDays: params.unplannedHistoryDays ?? 0,
    historyHasFasterInstance: params.historyHasFasterInstance ?? false,
    recurringDependency: params.recurringDependency ?? null,
    recurringConstraint: params.recurringConstraint ?? null,
    isNewNavigation: params.isNewNavigation ?? false,
    constraint: params.constraint,
    navigation: params.navigation,
    hasUnplanned: unplanned.length > 0,
    lastAnswer: params.lastAnswer,
    lastMacroPick: params.lastMacroPick,
    entryPath: params.entryPath ?? null,
    smoothStreakDays: params.smoothStreakDays ?? 0,
    charCount: params.charCount ?? 0,
    valence: params.valence ?? null,
    teamSampleSize: params.teamSampleSize ?? 0,
    framework: params.framework ?? null,
    feeling: params.feeling ?? null,
    isFallback: false,
  };
}

// ── Condition evaluation ──

/**
 * Evaluate a single condition string against the conversation context.
 * Returns true if the condition is met.
 *
 * Conditions are human-readable strings from TSV — NOT code.
 * We pattern-match known conditions. Unknown conditions return false.
 */
export function evaluateCondition(
  condition: string | null,
  ctx: ConversationContext,
): boolean {
  // No condition or "-" means always true
  if (!condition || condition === "-") return true;

  const c = condition.trim();

  // ── Answer checks ──
  if (c.startsWith("answer === ")) {
    const expected = c.slice("answer === ".length).trim();
    if (expected === "{deliverable}") {
      return ctx.lastAnswer !== null &&
        ctx.deliverables.some((d) => d.label === ctx.lastAnswer);
    }
    return ctx.lastAnswer === expected;
  }

  // ── Picks macro/micro ──
  if (c === "picks macro") return ctx.lastMacroPick !== null;
  if (c === "picks micro") return ctx.lastAnswer !== null;

  // ── Unplanned checks ──
  if (c === "unplanned.length > 0") return ctx.unplanned.length > 0;
  if (c === "unplanned.length === 0") return ctx.unplanned.length === 0;
  if (c === "hasUnplanned") return ctx.hasUnplanned;
  if (c === "!hasUnplanned and high actualMins") {
    return !ctx.hasUnplanned && ctx.totalActual > ctx.totalPlanned;
  }

  // ── Critical path checks ──
  if (c === "isCriticalPath === true") return ctx.hasCpItem;
  if (c === "isCriticalPath === false") return !ctx.hasCpItem;
  if (c === "hasCpItem === true") return ctx.hasCpItem;
  if (c === "hasCpItem === false") return !ctx.hasCpItem;

  // ── Completion checks ──
  if (c === "partial or not_done exist") {
    return ctx.partialCount > 0 || ctx.notDoneCount > 0;
  }
  if (c === "notDone > 0") return ctx.notDoneCount > 0;
  if (c === "notDone === 0") return ctx.notDoneCount === 0;
  if (c === "all items done") {
    return ctx.notDoneCount === 0 && ctx.partialCount === 0 && ctx.doneCount > 0;
  }
  if (c === "cpItem exists") {
    return ctx.cpItem !== null;
  }

  // ── Time checks ──
  if (c === "totalActual > totalPlanned * 1.15") {
    return ctx.totalActual > ctx.totalPlanned * 1.15;
  }
  if (c === "timeGap > 0") return ctx.timeGap > 0;
  if (c === "timeGap <= 0") return ctx.timeGap <= 0;
  if (c === "timeGap > 20%") return ctx.timeGapPercent > 20;
  if (c === "large timeGap") return ctx.timeGapPercent > 20;
  if (c === "low actualMins") return ctx.totalActual < ctx.totalPlanned * 0.5;
  if (c === "actual < planned") return ctx.totalActual < ctx.totalPlanned;
  if (c === "one deliverable has 2x+ estimate") {
    if (ctx.deliverables.length < 2) return false;
    const maxEst = Math.max(...ctx.deliverables.map((d) => d.estimateMins));
    const secondMax = ctx.deliverables
      .map((d) => d.estimateMins)
      .sort((a, b) => b - a)[1];
    return maxEst >= secondMax * 2;
  }

  // ── Program data checks ──
  if (c === "programCpData exists") return ctx.programCpData !== null;
  if (c === "programSampleSize >= 5 and majority") {
    return ctx.programSampleSize >= 5 && ctx.programMajorityConstraint !== null;
  }
  if (c === "programSampleSize >= 5 and outlier") {
    return ctx.programSampleSize >= 5 && ctx.programMajorityConstraint === null;
  }
  if (c === "programSampleSize >= 5") return ctx.programSampleSize >= 5;
  if (c === "programSampleSize < 5") return ctx.programSampleSize < 5;

  // ── History checks ──
  if (c === "unplanned in 3+ of last 5 reports") {
    return ctx.unplannedHistoryDays >= 3;
  }
  if (c === "history has faster instance") return ctx.historyHasFasterInstance;
  if (c === "recurring dependency in history") {
    return ctx.recurringDependency !== null;
  }
  if (c === "no dependency history") return ctx.recurringDependency === null;
  if (c === "recurring constraint in history") {
    return ctx.recurringConstraint !== null;
  }
  if (c === "recurring constraint (3+ in 7d)") {
    return (ctx.recurringConstraint?.count ?? 0) >= 3;
  }
  if (c === "new navigation (first use)") return ctx.isNewNavigation;
  // ── QA status checks (read from cpItem deliverable) ──
  const qaStatus = ctx.cpItem?.qaStatus ?? null;
  if (c === "qaStatus === qa_not_met") return qaStatus === "not met";
  if (c === "qaStatus === qa_met") return qaStatus === "met";
  if (c === "qaStatus === qa_unknown") return qaStatus === "unknown";
  if (c === "qaStatus === qa_to_verify or qa_unsure") {
    return qaStatus === "to verify" || qaStatus === "unsure";
  }

  // ── Composite / narrative conditions ──
  if (c === "no programData, no asymmetry, no incomplete") {
    return (
      ctx.programCpData === null &&
      !(ctx.totalActual > ctx.totalPlanned * 1.15) &&
      ctx.partialCount === 0 &&
      ctx.notDoneCount === 0
    );
  }

  // ── Section C: Entry path ──
  if (c === "entryPath === normal") return ctx.entryPath === "normal";
  if (c === "entryPath === smooth") return ctx.entryPath === "smooth";

  // ── Section C: Smooth streak ──
  if (c === "smooth 2+ consecutive days") return ctx.smoothStreakDays >= 2;

  // ── Section C: Narrative char count ──
  if (c === "charCount < 180") return ctx.charCount < 180;
  if (c === "charCount >= 180") return ctx.charCount >= 180;

  // ── Section C: Feeling valence ──
  if (c === "valence === positive") return ctx.valence === "positive";
  if (c === "valence === neutral") return ctx.valence === "neutral";
  if (c === "valence === negative") return ctx.valence === "negative";

  // ── Section C: Team sample size ──
  if (c === "teamSampleSize >= 5") return ctx.teamSampleSize >= 5;
  if (c === "teamSampleSize < 5") return ctx.teamSampleSize < 5;

  // ── Section C: Constraint + navigation existence ──
  if (c === "constraint + navigation captured" || c === "constraint and navigation exist") {
    return ctx.constraint !== null && ctx.navigation !== null;
  }
  if (c === "constraint + navigation captured AND framework is null") {
    return ctx.constraint !== null && ctx.navigation !== null && ctx.framework === null;
  }
  if (c === "no constraint/navigation context") {
    return ctx.constraint === null || ctx.navigation === null;
  }

  // ── Section C: UI-trigger conditions ──
  // These fire when the user provides free-form input (not a fixed option).
  // Treated same as "answer is not a known fixed option".
  if (c === "employee types answer" || c === "employee types habit") {
    return ctx.lastAnswer !== null && ctx.lastAnswer !== "skip" && ctx.lastAnswer !== "";
  }
  if (c === "employee selects deliverable" || c === "employee selects framework") {
    return ctx.lastAnswer !== null && ctx.lastAnswer !== "skip" && ctx.lastAnswer !== "";
  }

  // ── Sequence markers (not real conditions — always true in context) ──
  if (c === "after unplanned resolves") return true;
  if (c === "always — next step after CP resolves") return true;
  if (c === "always — next step after unplanned resolves") return true;
  if (c === "always") return true;

  // ── Fallback conditions ──
  if (c === "nothing else applies" || c === "nothing in context" || c === "no signal") {
    return ctx.isFallback;
  }

  // Unknown condition — log and return false
  console.warn(`[condition-evaluator] Unknown condition: "${c}"`);
  return false;
}

/**
 * Given a decision node's children, find the first child whose condition matches.
 * Evaluates children in order. If none match, tries with isFallback=true for
 * "nothing else applies" / "nothing in context" conditions.
 */
export function findMatchingChild(
  children: { condition: string | null }[],
  ctx: ConversationContext,
): number {
  // First pass: try all conditions normally
  for (let i = 0; i < children.length; i++) {
    if (evaluateCondition(children[i].condition, ctx)) {
      return i;
    }
  }

  // Second pass: try with fallback flag for "nothing else applies" conditions
  const fallbackCtx = { ...ctx, isFallback: true };
  for (let i = 0; i < children.length; i++) {
    if (evaluateCondition(children[i].condition, fallbackCtx)) {
      return i;
    }
  }

  return -1;
}
