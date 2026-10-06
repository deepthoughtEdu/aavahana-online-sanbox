import { api } from "@/lib/api/client";
import type { UBSScore, UBSTrend, UBSConfigItem } from "@/types";
import type { ApiResult } from "@/lib/api/client";

export class UBSService {
  /** Get current week's UBS score + breakdown */
  static async getCurrentUBS(): Promise<ApiResult<UBSScore>> {
    return api.get<UBSScore>("/v3/pdgms/scoring/ubs/current");
  }

  /** Get historical weekly UBS scores */
  static async getUBSTrend(
    from?: string,
    to?: string
  ): Promise<ApiResult<UBSTrend>> {
    return api.get<UBSTrend>("/v3/pdgms/scoring/ubs/trend", { from, to });
  }

  /** Get UBS event config (what's tracked + weights) */
  static async getUBSConfig(): Promise<ApiResult<UBSConfigItem[]>> {
    return api.get("/v3/pdgms/scoring/ubs/config");
  }
}
