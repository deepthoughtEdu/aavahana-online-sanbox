// src/lib/services/admin/leave-policy.service.ts
// Layer 3 client for the org-wide Leave Policy.
// Endpoints mounted at /api/v3/pdgms/people/leaves/balance/policy on the backend
// (routes/write/pdgms/leaves/balance.js -> api/pdgms/leaves/policy.js) — GET
// reads, PUT upserts (admin-only). NOTE the /balance segment: the /leaves
// router has no /policy route, so omitting it 404s.

import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  LeavePolicy,
  UpsertLeavePolicyPayload,
} from "@/types/admin";

const BASE = "/v3/pdgms/people/leaves/balance/policy";

export class LeavePolicyService {
  /** GET /leaves/policy?year=YYYY — the policy for a year (empty if unset). */
  static async getPolicy(year?: number): Promise<ApiResult<LeavePolicy>> {
    return api.get<LeavePolicy>(
      BASE,
      year ? { year: String(year) } : undefined,
      { label: "leave-policy:get", toast: false },
    );
  }

  /** PUT /leaves/policy — admin-only upsert of the year's leave types. */
  static async upsertPolicy(
    payload: UpsertLeavePolicyPayload,
  ): Promise<ApiResult<LeavePolicy>> {
    return api.put<LeavePolicy>(BASE, payload, { label: "leave-policy:upsert" });
  }
}
