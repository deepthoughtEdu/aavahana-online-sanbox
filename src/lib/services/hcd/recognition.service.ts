import { api, isError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import {
  buildDataset,
  type RawReflection,
  type TacitDataset,
} from "@/lib/services/hcd/tacit-clean";

export interface VerifiedInitiative {
  id: number;
  title: string;
  description: string;
  frameworkKey: string;
  gridCells: string[];
  actualOutcome: string | null;
  impactEvidence: unknown;
  impactMetrics: unknown;
  verifiedBy: string | null;
  verifiedAt: string | null;
  completedAt: string | null;
}

export interface PendingVerification {
  id: number;
  uid: number;
  title: string;
  description: string;
  frameworkKey: string;
  gridCells: string[];
  scope: string | null;
  expectedImpact: string | null;
  timeline: string | null;
  actualOutcome: string | null;
  submittedAt: string | null;
}

export interface ImpactSummary {
  totalInitiatives: number;
  verifiedCount: number;
  byFramework: Record<string, number>;
  cellsCovered: string[];
}

export interface CohortRow {
  uid: number;
  name: string;
  /** lnd-block attempts opened, finished or not. */
  assessmentsStarted: number;
  /** Completed lnd-block attempts. */
  assessments: number;
  /** Grid cells covered by the blocks this person completed. */
  insightsGenerated: number;
  drillsPrescribed: number;
  drillsDone: number;
  // W3.2 — native six-stage IO breakdown (one vocabulary everywhere, HG1).
  spotted: number;
  diagnosed: number;
  ideated: number;
  prototyped: number;
  piloted: number;
  scaled: number;
  dropped: number;
  submitted: number;
  verified: number;
  chats: number;
}

const BASE = "/v3/pdgms/hcd/recognition";

export class HcdRecognitionService {
  static async getMyRecognition(): Promise<ApiResult<VerifiedInitiative[]>> {
    return api.get<VerifiedInitiative[]>(`${BASE}/mine`);
  }

  static async getPendingVerifications(): Promise<ApiResult<PendingVerification[]>> {
    return api.get<PendingVerification[]>(`${BASE}/pending`);
  }

  static async getImpactSummary(): Promise<ApiResult<ImpactSummary>> {
    return api.get<ImpactSummary>(`${BASE}/summary`);
  }

  static async getCohort(): Promise<ApiResult<CohortRow[]>> {
    return api.get<CohortRow[]>(`${BASE}/cohort`);
  }

  // The server returns the raw reflections (managers and admins only). Cleaning
  // is deterministic and runs here, so the review table and the JSONL export
  // come from the same pass.
  static async getReflectionDataset(): Promise<ApiResult<TacitDataset>> {
    const res = await api.get<RawReflection[]>(`${BASE}/reflections`);
    if (isError(res)) return res;
    return buildDataset(res);
  }
}
