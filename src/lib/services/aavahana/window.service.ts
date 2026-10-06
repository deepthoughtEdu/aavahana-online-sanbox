import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

// Communication window (W2.5).
export interface WindowDecision {
  id: number;
  title: string;
  status: "pending" | "decided" | "communicated";
  decision: string | null;
  decidedByUid: string | null;
  decidedAt: string | null;
  communicatedAt: string | null;
  createdAt: string;
  latencyDays: number;
}

export interface WindowStageChange {
  id: number;
  initiativeId: number;
  fromStage: string | null;
  toStage: string;
  at: string;
}

export interface WindowFeed {
  stageChanges: WindowStageChange[];
  decisions: WindowDecision[];
}

const BASE = "/v3/pdgms/loops/window";

export class WindowService {
  static async getFeed(): Promise<ApiResult<WindowFeed>> {
    return api.get<WindowFeed>(`${BASE}/feed`);
  }
  static async listDecisions(status?: string): Promise<ApiResult<WindowDecision[]>> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return api.get<WindowDecision[]>(`${BASE}/decisions${q}`);
  }
  static async decide(id: number, decision: string): Promise<ApiResult<WindowDecision>> {
    return api.post<WindowDecision>(`${BASE}/decisions/${id}/decide`, { decision });
  }
  static async communicate(id: number): Promise<ApiResult<WindowDecision>> {
    return api.post<WindowDecision>(`${BASE}/decisions/${id}/communicate`, {});
  }
}
