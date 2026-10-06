import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { UbsMiniGroupConfig, UpsertUbsConfigPayload, HygieneScanResult } from "@/types/admin";

const BASE = "/v3/pdgms/scoring/ubs";

export class UbsConfigService {
  static async getMiniGroupConfig(miniGroupId: number): Promise<ApiResult<UbsMiniGroupConfig>> {
    return api.get<UbsMiniGroupConfig>(`${BASE}/config/mini-group/${miniGroupId}`);
  }

  static async upsertMiniGroupConfig(
    miniGroupId: number,
    payload: UpsertUbsConfigPayload
  ): Promise<ApiResult<UbsMiniGroupConfig>> {
    return api.put<UbsMiniGroupConfig>(`${BASE}/config/mini-group/${miniGroupId}`, payload);
  }

  static async deactivateMiniGroupConfig(miniGroupId: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/config/mini-group/${miniGroupId}`);
  }

  static async getHygieneScan(): Promise<ApiResult<HygieneScanResult>> {
    return api.get<HygieneScanResult>(`${BASE}/hygiene`);
  }
}
