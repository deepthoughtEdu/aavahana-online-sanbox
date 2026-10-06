/**
 * Intelligence Service — HCD Constraint Intelligence (Module 1) + Management
 * Insights (Module 2). Calls the backend at /v3/pdgms/intelligence/*.
 */

import { api, ApiResult } from "@/lib/api/client";
import type { PaginatedResponseWrapper } from "@/types/shared/api.types";
import type {
  HcdInsight,
  InsightSummary,
  InsightFilters,
  DetectPayload,
  DetectResponse,
  UpdateInsightStatusPayload,
  HcdInsightReport,
  ReportParams,
} from "@/types/intelligence/intelligence.types";

const BASE = "/v3/pdgms/intelligence";

export class IntelligenceService {
  // ── Module 1 — Constraint Intelligence ──
  // Backend returns { items, total, page, perPage }; typing as PaginatedResponseWrapper
  // makes useApi expose `data` (array) + typed `pagination` (it normalizes both shapes).
  static getInsights(filters?: InsightFilters): Promise<ApiResult<PaginatedResponseWrapper<HcdInsight>>> {
    return api.get<PaginatedResponseWrapper<HcdInsight>>(`${BASE}/insights`, filters as Record<string, unknown> | undefined);
  }

  static getMyInsights(filters?: InsightFilters): Promise<ApiResult<PaginatedResponseWrapper<HcdInsight>>> {
    return api.get<PaginatedResponseWrapper<HcdInsight>>(`${BASE}/insights/mine`, filters as Record<string, unknown> | undefined);
  }

  static getInsight(id: string): Promise<ApiResult<HcdInsight>> {
    return api.get<HcdInsight>(`${BASE}/insights/${id}`);
  }

  static getSummary(filters?: { periodKey?: string }): Promise<ApiResult<InsightSummary>> {
    return api.get<InsightSummary>(`${BASE}/insights/summary`, filters as Record<string, unknown> | undefined);
  }

  static detect(payload: DetectPayload): Promise<ApiResult<DetectResponse>> {
    return api.post<DetectResponse>(`${BASE}/insights/detect`, payload);
  }

  static updateStatus(payload: UpdateInsightStatusPayload): Promise<ApiResult<HcdInsight>> {
    return api.patch<HcdInsight>(`${BASE}/insights/${payload.id}/status`, {
      status: payload.status,
      resolutionNote: payload.resolutionNote,
    });
  }

  // ── Module 2 — Management Insights & Reports ──
  static getSupervisorReport(params?: ReportParams): Promise<ApiResult<HcdInsightReport>> {
    return api.get<HcdInsightReport>(`${BASE}/reports/supervisor`, params as Record<string, unknown> | undefined);
  }

  static getOrgReport(params?: ReportParams): Promise<ApiResult<HcdInsightReport>> {
    return api.get<HcdInsightReport>(`${BASE}/reports/org`, params as Record<string, unknown> | undefined);
  }

  static getTeamReport(supervisorEid: number, params?: ReportParams): Promise<ApiResult<HcdInsightReport>> {
    return api.get<HcdInsightReport>(`${BASE}/reports/team/${supervisorEid}`, params as Record<string, unknown> | undefined);
  }

  static generateReport(payload: { scope?: "team" | "org" } & ReportParams): Promise<ApiResult<HcdInsightReport>> {
    return api.post<HcdInsightReport>(`${BASE}/reports/generate`, payload);
  }

  static getReport(id: string): Promise<ApiResult<HcdInsightReport>> {
    return api.get<HcdInsightReport>(`${BASE}/reports/${id}`);
  }

  static listReports(filters?: {
    page?: number;
    perPage?: number;
    scope?: string;
    audience?: string;
    scopeRef?: string;
  }): Promise<ApiResult<PaginatedResponseWrapper<HcdInsightReport>>> {
    return api.get<PaginatedResponseWrapper<HcdInsightReport>>(`${BASE}/reports`, filters as Record<string, unknown> | undefined);
  }
}
