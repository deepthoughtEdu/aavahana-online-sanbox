import { api, ApiResult } from "@/lib/api/client";
import type {
  CallingProgress,
  CallingConsistency,
  CallingProgramBoard,
} from "@/types/crm/calling-targets.types";

const BASE = "/v3/pdgms/crm/calling-targets";
/**
 * The caller's own bars and pace. No eid parameter, deliberately: the server resolves it from the
 * session, because these numbers gate a bonus and an id on the wire could be swapped.
 */
export class CallingTargetsService {
  static async getMyProgress(): Promise<ApiResult<CallingProgress>> {
    return api.get(`${BASE}/me`);
  }

  /** Frozen closed periods over a window. Defaults to the current quarter server-side. */
  static async getMyConsistency(range?: { from?: string; to?: string }): Promise<ApiResult<CallingConsistency>> {
    return api.get(`${BASE}/me/consistency`, (range || {}) as Record<string, unknown>);
  }

  /** A whole team. Server restricts this to the program's TPM or an org admin. */
  static async getProgramBoard(programId: number): Promise<ApiResult<CallingProgramBoard>> {
    return api.get(`${BASE}/programs/${programId}/board`);
  }
}
