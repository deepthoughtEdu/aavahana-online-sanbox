import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ByokApiKey,
  StoreByokKeyPayload,
  ByokKeyWithHeadroom,
  SetByokKeyLimitsPayload,
} from "@/types/admin";

const BASE = "/v3/pdgms/ai/byok/keys";

export class ByokKeysService {
  static async list(): Promise<ApiResult<ByokApiKey[]>> {
    return api.get<ByokApiKey[]>(BASE);
  }

  static async get(id: number): Promise<ApiResult<ByokApiKey>> {
    return api.get<ByokApiKey>(`${BASE}/${id}`);
  }

  static async store(payload: StoreByokKeyPayload): Promise<ApiResult<ByokApiKey>> {
    return api.post<ByokApiKey>(BASE, payload);
  }

  static async deactivate(id: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${id}`);
  }

  /** Every visible key with today's consumption and what it leaves. */
  static async listWithHeadroom(): Promise<ApiResult<ByokKeyWithHeadroom[]>> {
    return api.get<ByokKeyWithHeadroom[]>(`${BASE}/headroom`);
  }

  /**
   * Declare a key's free-tier allowance, read off the provider's own console.
   * No API returns these numbers, so they are typed in. Null clears one and
   * returns that meter to "unknown", which is better than a stale figure.
   */
  static async setLimits(id: number, payload: SetByokKeyLimitsPayload): Promise<ApiResult<ByokApiKey>> {
    return api.put<ByokApiKey>(`${BASE}/${id}/limits`, payload);
  }

  static async rotate(id: number, apiKey: string): Promise<ApiResult<ByokApiKey>> {
    return api.put<ByokApiKey>(`${BASE}/${id}/rotate`, { apiKey });
  }
}
