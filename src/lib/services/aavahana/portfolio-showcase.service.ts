import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

/**
 * Leadership Portfolio showcase + PMS points (W4, Jul 2026).
 *
 * Showcase = what a person did for the company: ideas by status, recognitions,
 * constraints they addressed, cadence discipline, and their points. Shapes are
 * owned by the backend (src/pdgms/scoring/portfolios.js, src/pdgms/pms/).
 *
 * Authority is enforced server-side: you see yourself, anyone below you in the
 * org tree, or (as an admin) the whole org.
 */

const PORTFOLIO_BASE = "/v3/pdgms/scoring/portfolios";
const PMS_BASE = "/v3/pdgms/pms";

export type IdeaBucket = "proposed" | "experimented" | "implemented";

export interface IdeaTally {
  proposed: number;
  experimented: number;
  implemented: number;
  total: number;
}

export interface ShowcaseIdea {
  id: number;
  title: string;
  category: string;
  stage: string;
  bucket: IdeaBucket;
  reviewFeedback: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ShowcaseInsight {
  id: string;
  title: string;
  category: string;
  severity: string;
  signalType: string;
  status: string;
  lastSeenAt: string | null;
}

export interface ShowcaseRecognition {
  id: number;
  title: string;
  description: string;
  frameworkKey: string | null;
  actualOutcome: string | null;
  impactEvidence: unknown;
  impactMetrics: unknown;
  verifiedBy: string | null;
  verifiedAt: string | null;
  completedAt: string | null;
}

export interface CadenceMetric {
  filled: number;
  expected: number;
  rate: number;
}

export interface PointsBreakdownEntry {
  count: number;
  points: number;
}

export interface PointsLedgerEntry {
  id: number;
  eventKey: string;
  label: string;
  points: number;
  reason: string;
  periodId: string;
  sourceType: string;
  sourceRef: string;
  createdAt: string | null;
}

export interface PersonPoints {
  uid: string;
  periodId: string | null;
  total: number;
  allTimeTotal: number;
  byEvent: Record<string, PointsBreakdownEntry>;
  recent: PointsLedgerEntry[];
}

export interface PortfolioShowcase {
  person: { uid: string; eid: number | null; name: string; picture: string | null };
  ideas: { tally: IdeaTally; items: ShowcaseIdea[] };
  recognitions: {
    verifiedCount: number;
    totalInitiatives: number;
    byFramework: Record<string, number>;
    items: ShowcaseRecognition[];
  };
  constraints: {
    total: number;
    addressed: number;
    active: number;
    items: ShowcaseInsight[];
    positives: ShowcaseInsight[];
  };
  discipline: {
    weeks?: number;
    dailyPlan: CadenceMetric | null;
    dailyReport: CadenceMetric | null;
    weeklyPlan: CadenceMetric | null;
    weeklyReport: CadenceMetric | null;
    streak: number;
  };
  portfolio: {
    portfolioId: string;
    uid: string;
    monthId: string;
    period: { from: string | null; to: string | null };
    generatedAt: string | null;
    sections: { type: string; data: Record<string, unknown>; narrative: string }[];
  } | null;
  points: PersonPoints;
}

export interface TeamShowcaseRow {
  uid: string;
  eid: number | null;
  name: string;
  picture: string | null;
  ideas: IdeaTally;
  recognitions: number;
  constraints: { total: number; addressed: number };
  dailyReport: CadenceMetric | null;
  weeklyPlan: CadenceMetric | null;
  weeklyReport: CadenceMetric | null;
  points: number;
}

export interface TeamShowcaseResponse {
  scope: "org" | "team";
  callerEid: number | null;
  members: TeamShowcaseRow[];
}

export interface PmsSchemaEvent {
  eventKey: string;
  label: string;
  description: string;
  sourceType: string;
  points: number;
  isDefault: boolean;
  defaultPoints: number;
}

export interface PmsSummaryMember {
  uid: string;
  name: string;
  picture: string | null;
  total: number;
  byEvent: Record<string, PointsBreakdownEntry>;
}

export interface PmsSummaryResponse {
  periodId: string | null;
  participants: number;
  totals: { points: number; contribution: number; discipline: number };
  members: PmsSummaryMember[];
  schema: { events: PmsSchemaEvent[] };
}

export class PortfolioShowcaseService {
  /** One person's showcase. Omit uid for your own. */
  static async getShowcase(params?: {
    uid?: string;
    weeks?: number;
    periodId?: string;
  }): Promise<ApiResult<PortfolioShowcase>> {
    return api.get<PortfolioShowcase>(`${PORTFOLIO_BASE}/showcase`, params);
  }

  /** Everyone the caller may view (their org-tree subtree; whole org for admins). */
  static async getTeam(params?: {
    weeks?: number;
    periodId?: string;
  }): Promise<ApiResult<TeamShowcaseResponse>> {
    return api.get<TeamShowcaseResponse>(`${PORTFOLIO_BASE}/showcase/team`, params);
  }
}

export class PmsService {
  static async getMine(params?: { periodId?: string }): Promise<ApiResult<PersonPoints>> {
    return api.get<PersonPoints>(`${PMS_BASE}/me`, params);
  }

  static async getSummary(params?: {
    periodId?: string;
  }): Promise<ApiResult<PmsSummaryResponse>> {
    return api.get<PmsSummaryResponse>(`${PMS_BASE}/summary`, params);
  }

  static async getSchema(): Promise<ApiResult<{ events: PmsSchemaEvent[] }>> {
    return api.get<{ events: PmsSchemaEvent[] }>(`${PMS_BASE}/schema`);
  }

  /** Admin only. Weights are config: changing one never rewrites history. */
  static async setSchema(
    weights: Record<string, number>,
  ): Promise<ApiResult<{ events: PmsSchemaEvent[] }>> {
    return api.put<{ events: PmsSchemaEvent[] }>(`${PMS_BASE}/schema`, { weights });
  }

  static async getPeriods(): Promise<ApiResult<{ periodId: string; points: number }[]>> {
    return api.get<{ periodId: string; points: number }[]>(`${PMS_BASE}/periods`);
  }
}
