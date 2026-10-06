import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { IoStage } from "@/components/hcd/lifecycle";

export interface Initiative {
  id: number;
  title: string;
  description: string;
  frameworkKey: string;
  gridCells: string[];
  status: IoStage;
  scope: string | null;
  expectedImpact: string | null;
  timeline: string | null;
  actualOutcome: string | null;
  scaleScope: string | null;
  verificationStatus: string | null;
  // Improvement Object provenance (conjecture fields; null on legacy rows).
  sourceType: string | null;
  originatorRole: string | null;
  independenceFlag: string | null;
  programId: number | null;
  // One idea store: My Ideas reads this list too, so it carries the category it
  // captured and the reviewer's note when a verification was turned down.
  category: string | null;
  rejectionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoteData {
  scope?: string;
  expectedImpact?: string;
  timeline?: string;
  resources?: string;
  actualOutcome?: string;
  impactMetrics?: unknown;
  scaleScope?: string;
}

export interface InitiativeDetail extends Initiative {
  resources: string | null;
  impactEvidence: unknown;
  impactMetrics: unknown;
  completedAt: string | null;
  submittedAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionNote: string | null;
  sourceId: string | null;
}

export interface CreateInitiativeData {
  title: string;
  description: string;
  frameworkKey?: string;
  gridCells?: string[];
  category?: string;
  // Optional Improvement Object provenance (constraint sources start at 'spotted').
  status?: IoStage;
  sourceType?: string;
  sourceId?: string;
  originatorRole?: string;
  independenceFlag?: string;
  programId?: number;
}

export interface InitiativeStageLog {
  id: number;
  initiativeId: number;
  fromStage: IoStage | null;
  toStage: IoStage;
  byUid: string | null;
  byRole: string | null;
  at: string;
}

export interface InitiativeLink {
  id: number;
  initiativeId: number;
  entityType: string;
  entityId: string;
  createdBy: string;
  createdAt: string;
}

export interface PortfolioCase {
  id: number;
  title: string;
  constraint: string;
  tried: string | null;
  impact: string | null;
  scaleScope: string | null;
  status: IoStage;
  verifiedBy: string | null;
  independent: boolean;
  originatorRole: string | null;
  programId: number | null;
}

export interface Portfolio {
  cases: PortfolioCase[];
  groups: Record<string, PortfolioCase[]>;
  independentCount: number;
  total: number;
}

const BASE = "/v3/pdgms/hcd/initiatives";

export class HcdInitiativeService {
  static async list(): Promise<ApiResult<Initiative[]>> {
    return api.get<Initiative[]>(BASE);
  }

  static async get(id: number): Promise<ApiResult<InitiativeDetail>> {
    return api.get<InitiativeDetail>(`${BASE}/${id}`);
  }

  static async create(data: CreateInitiativeData): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(BASE, data);
  }

  static async update(
    id: number,
    data: Partial<CreateInitiativeData & { scope: string; expectedImpact: string; timeline: string; resources: string }>
  ): Promise<ApiResult<Initiative>> {
    return api.put<Initiative>(`${BASE}/${id}`, data);
  }

  static async promote(id: number, data: PromoteData = {}): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/promote`, data);
  }

  static async demote(id: number): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/demote`, {});
  }

  static async drop(id: number): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/drop`, {});
  }

  static async restore(id: number): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/restore`, {});
  }

  static async submitForVerification(id: number): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/submit`, {});
  }

  static async verify(
    id: number,
    data: { actualOutcome?: string; impactEvidence?: unknown; impactMetrics?: unknown }
  ): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/verify`, data);
  }

  static async reject(id: number, note: string): Promise<ApiResult<Initiative>> {
    return api.post<Initiative>(`${BASE}/${id}/reject`, { note });
  }

  static async stageHistory(id: number): Promise<ApiResult<InitiativeStageLog[]>> {
    return api.get<InitiativeStageLog[]>(`${BASE}/${id}/history`);
  }

  static async listLinks(id: number): Promise<ApiResult<InitiativeLink[]>> {
    return api.get<InitiativeLink[]>(`${BASE}/${id}/links`);
  }

  static async addLink(
    id: number,
    data: { entityType: string; entityId: string }
  ): Promise<ApiResult<InitiativeLink>> {
    return api.post<InitiativeLink>(`${BASE}/${id}/links`, data);
  }
}
