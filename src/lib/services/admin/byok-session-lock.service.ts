import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ByokSessionLockStatus,
  ByokSessionLockEnableResult,
  ByokSessionLockDisableResult,
  ByokSessionLockUnlockResult,
} from "@/types/admin";

const BASE = "/v3/pdgms/ai/byok/session-lock";

export class ByokSessionLockService {
  static async getStatus(): Promise<ApiResult<ByokSessionLockStatus>> {
    return api.get<ByokSessionLockStatus>(`${BASE}/status`);
  }

  static async enable(passphrase: string): Promise<ApiResult<ByokSessionLockEnableResult>> {
    return api.post<ByokSessionLockEnableResult>(`${BASE}/enable`, { passphrase });
  }

  static async disable(passphrase: string): Promise<ApiResult<ByokSessionLockDisableResult>> {
    return api.post<ByokSessionLockDisableResult>(`${BASE}/disable`, { passphrase });
  }

  static async unlock(passphrase: string): Promise<ApiResult<ByokSessionLockUnlockResult>> {
    return api.post<ByokSessionLockUnlockResult>(`${BASE}/unlock`, { passphrase });
  }

  static async lock(): Promise<ApiResult<{ unlocked: boolean }>> {
    return api.post<{ unlocked: boolean }>(`${BASE}/lock`, {});
  }
}
