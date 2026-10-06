import type {
  CareerRunrateData,
  LeadershipPortfolio,
  LeadershipPortfolioSection,
  MonthlyReport,
  PortfolioSectionType,
} from "@/types";
import type { MonthlyPlanData, ProgramKPI } from "@/types/aavahana/monthly-plan.types";
import type { PlannedDeliverable } from "@/types/aavahana/report-engine.types";

type UnknownRecord = Record<string, unknown>;

const PORTFOLIO_TITLES: Record<PortfolioSectionType, string> = {
  executive_summary: "Executive Summary",
  contribution_highlights: "Contribution Highlights",
  capability_growth: "Capability Growth",
  kpi_impact: "KPI Impact",
  constraint_patterns: "Constraint Patterns",
  career_trajectory: "Career Trajectory",
};

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function array<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Runtime compatibility for plans saved before all monthly axes were added.
 * TypeScript types do not protect a page from an older JSON response.
 */
export function normalizeMonthlyPlan(input: unknown): MonthlyPlanData | null {
  const value = record(input);
  if (!value) return null;

  return {
    ...value,
    deliverables: array(value.deliverables),
    ipGoals: array(value.ipGoals),
    recurringEvents: array(value.recurringEvents),
    kpiTargets: array(value.kpiTargets),
    feedback: array(value.feedback),
  } as unknown as MonthlyPlanData;
}

/** Build a complete render contract from old or partially populated reports. */
export function normalizeMonthlyReport(input: unknown): MonthlyReport | null {
  const value = record(input);
  if (!value) return null;
  const axes = record(value.axisSummaries) ?? {};
  const deliverables = record(axes.deliverables) ?? {};
  const ip = record(axes.ip) ?? {};
  const frameworks = record(axes.frameworks) ?? {};
  const processes = record(axes.processes) ?? {};
  const rituals = record(axes.rituals) ?? {};

  return {
    ...value,
    axisSummaries: {
      ...axes,
      deliverables: {
        ...deliverables,
        total: Number(deliverables.total) || 0,
        completed: Number(deliverables.completed) || 0,
        inProgress: Number(deliverables.inProgress) || 0,
        items: array(deliverables.items),
      },
      ip: {
        ...ip,
        totalCommits: Number(ip.totalCommits) || 0,
        targetCommits: Number(ip.targetCommits) || 0,
        items: array(ip.items),
      },
      kpis: array(axes.kpis),
      frameworks: {
        ...frameworks,
        claims: array(frameworks.claims),
        totalQuantity: Number(frameworks.totalQuantity) || 0,
      },
      processes: {
        ...processes,
        claims: array(processes.claims),
        totalQuantity: Number(processes.totalQuantity) || 0,
      },
      rituals: {
        ...rituals,
        participated: Number(rituals.participated) || 0,
        total: Number(rituals.total) || 0,
        events: array(rituals.events),
      },
    },
    weeklySummaries: array(value.weeklySummaries),
    weeklyBreakdown: array(value.weeklyBreakdown),
    missingWeeks: array(value.missingWeeks),
    missingDays: array(value.missingDays),
    carryoverTrend: array(value.carryoverTrend),
    weeklyHappiness: array(value.weeklyHappiness),
  } as unknown as MonthlyReport;
}

function normalizePortfolioSection(input: unknown): LeadershipPortfolioSection | null {
  const value = record(input);
  if (!value) return null;
  const rawId = value.id ?? value.type;
  if (typeof rawId !== "string" || !(rawId in PORTFOLIO_TITLES)) return null;
  const id = rawId as PortfolioSectionType;

  return {
    id,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title
        : PORTFOLIO_TITLES[id],
    dataPoints: record(value.dataPoints) ?? record(value.data) ?? {},
    narrative: typeof value.narrative === "string" ? value.narrative : null,
  };
}

/** Supports both current {id,dataPoints} and legacy {type,data} sections. */
export function normalizeLeadershipPortfolio(
  input: unknown,
): LeadershipPortfolio | null {
  const root = record(input);
  if (!root) return null;
  const paginatedItem = array<unknown>(root.items)[0];
  const value = record(paginatedItem) ?? root;

  let rawSections = array<unknown>(value.sections);
  if (rawSections.length === 0) {
    const flatKeys: Array<[PortfolioSectionType, string]> = [
      ["executive_summary", "executiveSummary"],
      ["contribution_highlights", "contributionHighlights"],
      ["capability_growth", "capabilityGrowth"],
      ["kpi_impact", "kpiImpact"],
      ["constraint_patterns", "constraintPatterns"],
      ["career_trajectory", "careerTrajectory"],
    ];
    rawSections = flatKeys.flatMap(([id, key]) => {
      const blob = record(value[key]);
      if (!blob) return [];
      const data = record(blob.data) ?? Object.fromEntries(
        Object.entries(blob).filter(([field]) => field !== "narrative"),
      );
      return [{ id, data, narrative: blob.narrative }];
    });
  }

  const sections = rawSections
    .map(normalizePortfolioSection)
    .filter((section): section is LeadershipPortfolioSection => section !== null);

  return {
    ...value,
    uid: String(value.uid ?? value.userId ?? ""),
    generatedAt:
      typeof value.generatedAt === "string" ? value.generatedAt : null,
    sections,
  } as LeadershipPortfolio;
}

/** Defensive defaults for runrate rows created before the trajectory contract. */
export function normalizeCareerRunrate(input: unknown): CareerRunrateData | null {
  const value = record(input);
  if (!value) return null;
  const planned = record(value.planned) ?? {};
  const projected = record(value.projected) ?? {};
  const ladder = record(value.ladder) ?? {};

  return {
    ...value,
    planned: { ...planned, points: array(planned.points) },
    actual: array(value.actual),
    projected: {
      ...projected,
      points: array(projected.points),
      nextLevelEligibility: record(projected.nextLevelEligibility) as
        | CareerRunrateData["projected"]["nextLevelEligibility"]
        | null,
    },
    currentLevel: record(value.currentLevel) as CareerRunrateData["currentLevel"],
    nextLevel: record(value.nextLevel) as CareerRunrateData["nextLevel"],
    ladder: {
      ...ladder,
      id: String(ladder.id ?? ""),
      name: String(ladder.name ?? ""),
      orgId: String(ladder.orgId ?? ""),
      levels: array(ladder.levels),
    },
  } as CareerRunrateData;
}

/**
 * `GET /programs/:id/kpis` serves the canonical A67 KPI shape
 * (`{ id, name, currentTarget, ... }`), which is shared with every other KPI
 * reader and cannot be renamed for one screen. `ProgramKPI` is the planner's
 * contract (`{ kpiId, kpiName, targetValue, ... }`). Nothing bridged the two, so
 * every field the planner reads came back undefined — `kpiId` most visibly, which
 * made React see a list of children all keyed `undefined`, and made the monthly
 * plan file every KPI target under the single key "undefined".
 *
 * The pagination envelope is preserved when present: `useApi` unwraps
 * `{ items, total, page, perPage }` itself, after the service returns.
 */
export function normalizeProgramKpis(input: unknown): unknown {
  const value = record(input);
  if (value && Array.isArray(value.items)) {
    return { ...value, items: value.items.map(toProgramKpi) };
  }
  if (Array.isArray(input)) return input.map(toProgramKpi);
  return [];
}

function toProgramKpi(input: unknown): ProgramKPI {
  const k = record(input) ?? {};
  // Accept either vocabulary, so a backend that later adopts the planner's names
  // does not silently blank the screen again.
  const id = k.kpiId ?? k.id;
  const name = k.kpiName ?? k.name;
  const target = k.targetValue ?? k.currentTarget;

  return {
    kpiId: id != null ? String(id) : "",
    kpiName: name != null ? String(name) : "",
    programId: k.programId != null ? String(k.programId) : "",
    // Absent rather than "" — the UI omits the clause instead of printing a gap.
    programName: k.programName != null ? String(k.programName) : undefined,
    targetValue: target != null ? String(target) : "",
    unit: k.unit != null ? String(k.unit) : "",
    memberCount: Number.isFinite(Number(k.memberCount))
      ? Number(k.memberCount)
      : undefined,
    myTarget: typeof k.myTarget === "number" ? k.myTarget : null,
  };
}

function deliverableKey(item: PlannedDeliverable): string {
  if (item.basketItemId) return `basket:${item.basketItemId}`;
  if (item.planTaskId) return `task:${item.planTaskId}`;
  return `label:${item.label.trim().toLocaleLowerCase()}`;
}

/**
 * The saved report draft owns answers; the latest daily plan owns membership,
 * order, labels and estimates. This prevents an old two-task draft from hiding
 * a third task added later to the plan.
 */
export function reconcilePlanDeliverables(
  latestPlan: PlannedDeliverable[],
  savedDraft: PlannedDeliverable[],
): PlannedDeliverable[] {
  const savedByKey = new Map(savedDraft.map((item) => [deliverableKey(item), item]));
  return latestPlan.map((item) => {
    const saved = savedByKey.get(deliverableKey(item));
    if (!saved) return item;
    return {
      ...item,
      status: saved.status,
      actualMins: saved.actualMins,
      isCriticalPath: saved.isCriticalPath,
      qaStatus: saved.qaStatus,
    };
  });
}
