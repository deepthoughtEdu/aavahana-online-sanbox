import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ByokPreflight,
  ByokSwitchPayload,
  ByokFailureDetail,
} from "@/types/shared/byok-preflight.types";

const BASE = "/v3/pdgms/ai/byok/preflight";

export class ByokPreflightService {
  /**
   * What the pending call costs and what every usable key has left.
   * POST, not GET: the payload being sized can be large and must never land in
   * a URL or an access log. Costs nothing — no LLM call is made.
   */
  static async check(payload: {
    provider?: string;
    model?: string;
    payloadChars?: number;
  }): Promise<ApiResult<ByokPreflight>> {
    return api.post<ByokPreflight>(BASE, payload);
  }

  /** Records that a human agreed to move the session. Does not perform the move. */
  static async recordSwitch(
    payload: ByokSwitchPayload
  ): Promise<ApiResult<{ ok: boolean; auditId: number }>> {
    return api.post<{ ok: boolean; auditId: number }>(`${BASE}/switch`, payload);
  }
}

/**
 * Pull the structured half out of a failed LLM call.
 *
 * The backend keeps its human sentence in the error message and puts the class
 * on `response.detail` (riding the existing `detail` passthrough). Reading a
 * field is the whole point: pattern-matching the English breaks the day a
 * provider rewords itself.
 *
 * Returns null when the error is not an LLM provider failure.
 */
export function readFailureDetail(error: unknown): ByokFailureDetail | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as { data?: { response?: { detail?: unknown } } }).data;
  const detail = data?.response?.detail as ByokFailureDetail | undefined;
  if (!detail || typeof detail !== "object" || typeof detail.kind !== "string") return null;
  return detail;
}

/** True only for a real quota exhaustion. An overloaded provider is not out of quota. */
export function isQuotaFailure(error: unknown): boolean {
  return readFailureDetail(error)?.kind === "quota";
}
