import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

// Escalation read surface (growth-execution W4.1). The escalation engine is a
// backend concern (config-gated per org); the FE renders whatever escalation
// state the backend returns. Nothing here is dismissible — escalation items are
// read-only. Mounted at /api/v3/supervisor/escalations (NOT under /pdgms).

export interface EscalationHistoryItem {
  level: number;
  recipientEmail: string | null;
  status: string; // sent | failed | retrying | pending
  periodKey: string;
  sentAt: string | null;
  createdAt: string;
}

// One current-state row per (source, subject) with its send history — from
// Engine.getMatrix. Subject-scoped: only sources that name a subject (e.g. the
// daily-report ladder) appear here; recipient-only digests do not.
export interface EscalationMatrixEntry {
  source: string;
  subjectEid: number;
  currentLevel: number;
  lastEventAt: string;
  history: EscalationHistoryItem[];
}

export interface EscalationEvent {
  id: number;
  source: string;
  subjectEid: number | null;
  periodKey: string;
  level: number;
  recipientKind: string;
  recipientEid: number | null;
  recipientEmail: string | null;
  missedCount: number | null;
  channel: string;
  status: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface EscalationAudit {
  items: EscalationEvent[];
  total: number;
  page: number;
  perPage: number;
}

export interface EscalationStatByStatus {
  source: string;
  status: string;
  count: number;
}

export interface EscalationStats {
  byStatus: EscalationStatByStatus[];
  recentRuns: unknown[];
}

const BASE = "/v3/supervisor/escalations";

export class EscalationService {
  static async getMatrix(source?: string): Promise<ApiResult<EscalationMatrixEntry[]>> {
    const q = source ? `?source=${encodeURIComponent(source)}` : "";
    return api.get<EscalationMatrixEntry[]>(`${BASE}/matrix${q}`);
  }

  static async getAudit(params?: {
    source?: string;
    subjectEid?: number;
    page?: number;
    perPage?: number;
  }): Promise<ApiResult<EscalationAudit>> {
    const sp = new URLSearchParams();
    if (params?.source) sp.set("source", params.source);
    if (params?.subjectEid != null) sp.set("subjectEid", String(params.subjectEid));
    if (params?.page != null) sp.set("page", String(params.page));
    if (params?.perPage != null) sp.set("perPage", String(params.perPage));
    const q = sp.toString() ? `?${sp.toString()}` : "";
    return api.get<EscalationAudit>(`${BASE}/audit${q}`);
  }

  static async getStats(source?: string): Promise<ApiResult<EscalationStats>> {
    const q = source ? `?source=${encodeURIComponent(source)}` : "";
    return api.get<EscalationStats>(`${BASE}/stats${q}`);
  }
}
