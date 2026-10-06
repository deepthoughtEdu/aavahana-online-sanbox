import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ByokRateLimitStatus,
  ByokRateLimitConfig,
  RequestLimitChangePayload,
  RequestTempBoostPayload,
  OtpSentResponse,
  OtpConfirmResponse,
} from "@/types/admin";

const BASE = "/v3/pdgms/ai/byok/rate-limits";

export class ByokRateLimitsService {
  static async getStatus(): Promise<ApiResult<ByokRateLimitStatus>> {
    return api.get<ByokRateLimitStatus>(`${BASE}/status`);
  }

  static async getConfig(): Promise<ApiResult<ByokRateLimitConfig>> {
    return api.get<ByokRateLimitConfig>(`${BASE}/config`);
  }

  static async requestChange(payload: RequestLimitChangePayload): Promise<ApiResult<OtpSentResponse>> {
    return api.post<OtpSentResponse>(`${BASE}/change`, payload);
  }

  static async confirmChange(code: string): Promise<ApiResult<OtpConfirmResponse>> {
    return api.post<OtpConfirmResponse>(`${BASE}/change/confirm`, { code });
  }

  static async requestTempBoost(payload: RequestTempBoostPayload): Promise<ApiResult<OtpSentResponse>> {
    return api.post<OtpSentResponse>(`${BASE}/boost`, payload);
  }

  static async confirmTempBoost(code: string): Promise<ApiResult<OtpConfirmResponse>> {
    return api.post<OtpConfirmResponse>(`${BASE}/boost/confirm`, { code });
  }
}
