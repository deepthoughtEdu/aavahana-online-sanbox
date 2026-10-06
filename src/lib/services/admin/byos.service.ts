import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { ByosStatus, ByosConnectResponse, ByosDisconnectResponse } from "@/types/admin";

const BASE = "/v3/pdgms/ai/byos";

/**
 * BYOS (Bring Your Own Storage) — per-user Google Drive connection. `connect`
 * returns a Google consent URL the caller redirects the browser to; Google then
 * bounces back through the backend callback, which redirects to the account
 * screen with `?byos=connected|error`.
 */
export class ByosService {
  static async getStatus(): Promise<ApiResult<ByosStatus>> {
    return api.get<ByosStatus>(`${BASE}/status`);
  }

  static async connect(): Promise<ApiResult<ByosConnectResponse>> {
    return api.post<ByosConnectResponse>(`${BASE}/connect`);
  }

  static async disconnect(): Promise<ApiResult<ByosDisconnectResponse>> {
    return api.delete<ByosDisconnectResponse>(`${BASE}/disconnect`);
  }
}
