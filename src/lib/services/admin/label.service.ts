import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { AdminLabel, CreateLabelPayload, LabelType } from "@/types/admin";

const BASE = "/v3/pdgms";

export class LabelService {
  static async create(payload: CreateLabelPayload): Promise<ApiResult<AdminLabel>> {
    return api.post<AdminLabel>(`${BASE}/loops/labels`, payload);
  }
  static async list(params?: { type?: LabelType; status?: string; page?: number; perPage?: number }): Promise<ApiResult<{ items: AdminLabel[]; total: number }>> {
    return api.get<{ items: AdminLabel[]; total: number }>(`${BASE}/loops/labels`, params);
  }
  static async approve(id: number): Promise<ApiResult<AdminLabel>> {
    return api.patch<AdminLabel>(`${BASE}/loops/labels/${id}/approve`, {});
  }
  static async retire(id: number): Promise<ApiResult<AdminLabel>> {
    return api.patch<AdminLabel>(`${BASE}/loops/labels/${id}/retire`, {});
  }
}
