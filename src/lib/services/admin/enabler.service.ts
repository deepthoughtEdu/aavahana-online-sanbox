import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { Enabler, CreateEnablerPayload, UpdateEnablerPayload } from "@/types/admin";

const BASE = "/v3/pdgms";

export class EnablerService {
  static async list(): Promise<ApiResult<{ items: Enabler[]; total: number; page: number; perPage: number }>> {
    return api.get<{ items: Enabler[]; total: number; page: number; perPage: number }>(`${BASE}/context/enablers`);
  }
  static async toggle(id: number): Promise<ApiResult<Enabler>> {
    return api.patch<Enabler>(`${BASE}/context/enablers/${id}/toggle`, {});
  }
  static async create(payload: CreateEnablerPayload): Promise<ApiResult<Enabler>> {
    return api.post<Enabler>(`${BASE}/context/enablers`, payload);
  }
  static async update(id: number, payload: UpdateEnablerPayload): Promise<ApiResult<Enabler>> {
    return api.put<Enabler>(`${BASE}/context/enablers/${id}`, payload);
  }
}
