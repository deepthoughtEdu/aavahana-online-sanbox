import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ConsentPolicy,
  ConsentStatusEntry,
  ConsentRecordResponse,
  GiveConsentPayload,
  WithdrawConsentPayload,
} from "@/types/shared/consent.types";

const BASE = "/v3/pdgms/privacy/consent";

export class ConsentService {
  // Active notice text, sourced from the DB (single source of truth — never hardcode on FE).
  static async policies(): Promise<ApiResult<ConsentPolicy[]>> {
    return api.get<ConsentPolicy[]>(`${BASE}/policies`);
  }

  // The current user's per-purpose consent state.
  static async status(): Promise<ApiResult<ConsentStatusEntry[]>> {
    return api.get<ConsentStatusEntry[]>(`${BASE}/status`);
  }

  static async give(payload: GiveConsentPayload): Promise<ApiResult<ConsentRecordResponse>> {
    return api.post<ConsentRecordResponse>(`${BASE}/give`, payload);
  }

  static async withdraw(payload: WithdrawConsentPayload): Promise<ApiResult<ConsentRecordResponse>> {
    return api.post<ConsentRecordResponse>(`${BASE}/withdraw`, payload);
  }
}
