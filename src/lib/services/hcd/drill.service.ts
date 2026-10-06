import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

export interface GapDiagnosis {
  gridCell: string;
  gapType: "competent" | "intuitive" | "know_gap" | "default_gap" | "unverified";
  mcqScore: number;
  mcqNormalized: number;
  behaviorNormalized: number | null;
  behaviorEvidence: number;
  behaviorSource: string;
}

export interface GapAnalysisResult {
  instanceId: number;
  mcqScores: Record<string, { average: number; normalized: number; count: number }>;
  behaviorScores: Record<string, { normalized: number; source: string }>;
  gaps: GapDiagnosis[];
}

export interface DrillInfo {
  id: number;
  title: string;
  description: string;
  recordingMethods: string[];
  hasAutoDetect: boolean;
}

export interface PrescribedDrill {
  id: number;
  instanceId: number;
  gridCell: string;
  gapType: string;
  mcqScore: number;
  status: string;
  drill: DrillInfo;
  prescribedAt: string;
}

export interface GenerateDrillsResult {
  generated?: number;
  message?: string;
}

export interface PrescriptionResult {
  prescriptions: PrescribedDrill[];
  gaps: GapDiagnosis[];
}

export interface DrillCompletion {
  id: number;
  method: string;
  completedAt: string;
}

export interface AutoDetectResult {
  detected: boolean;
  completion?: DrillCompletion;
  evidence: Array<{ type: string; id: number; title?: string; date: string }>;
}

const BASE = "/v3/pdgms/hcd/drills";

export class HcdDrillService {
  static async getGapAnalysis(instanceId: number): Promise<ApiResult<GapAnalysisResult>> {
    return api.get<GapAnalysisResult>(`${BASE}/gap-analysis/${instanceId}`);
  }

  static async prescribe(instanceId: number): Promise<ApiResult<PrescriptionResult>> {
    return api.post<PrescriptionResult>(`${BASE}/prescribe`, { instanceId });
  }

  static async generate(
    instanceId: number,
    byok: { provider: string; apiKey: string; model: string }
  ): Promise<ApiResult<GenerateDrillsResult>> {
    return api.post<GenerateDrillsResult>(`${BASE}/generate`, { instanceId, ...byok });
  }

  static async getMyDrills(): Promise<ApiResult<PrescribedDrill[]>> {
    return api.get<PrescribedDrill[]>(`${BASE}/mine`);
  }

  static async complete(
    prescriptionId: number,
    data: { method: string; voiceNote?: string; voiceTranscript?: string }
  ): Promise<ApiResult<DrillCompletion>> {
    return api.post<DrillCompletion>(`${BASE}/${prescriptionId}/complete`, data);
  }

  static async skip(prescriptionId: number): Promise<ApiResult<unknown>> {
    return api.post<unknown>(`${BASE}/${prescriptionId}/skip`, {});
  }

  static async autoDetect(prescriptionId: number): Promise<ApiResult<AutoDetectResult>> {
    return api.post<AutoDetectResult>(`${BASE}/${prescriptionId}/detect`, {});
  }
}
