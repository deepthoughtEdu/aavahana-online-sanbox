// src/lib/services/aavahana/leave.service.ts
// Layer 3 client for the Aavahana → Leaves Tracker module.
// Endpoints are mounted at /api/v3/pdgms/people/leaves on the backend.

import { api, isError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  PaginatedResponseWrapper,
  PaginationParams,
} from "@/types";
import type {
  LeaveRecord,
  LeaveApprovalRow,
  CurrentLeavePerson,
  ApplyLeavePayload,
  DecideLeavePayload,
  ModifyLeavePayload,
  CancelLeaveResult,
  DecideLeaveResult,
  PaginatedLeaves,
  LeaveListParams,
  ApprovalsParams,
  LeaveBalanceResponse,
} from "@/types/aavahana/leave.types";

const BASE = "/v3/pdgms/people/leaves";

/**
 * Convert the backend's `{ items, total, page, perPage }` paginated envelope
 * into the `{ data, pagination }` shape `DataTable` expects so its `queryFn`
 * union type matches without `as any` at the call site.
 */
function asWrapper<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number
): PaginatedResponseWrapper<T> {
  const safePer = Math.max(1, perPage);
  const pageCount = Math.max(1, Math.ceil(total / safePer));
  return {
    data: items,
    pagination: {
      currentPage: page,
      pageCount,
      prev:  { page: Math.max(1, page - 1), active: page > 1 },
      next:  { page: page + 1,              active: page * safePer < total },
      first: { page: 1,                     active: page > 1 },
      last:  { page: pageCount,             active: page < pageCount },
      rel: [],
      pages: [],
    },
  };
}

async function wrap<T>(
  resPromise: Promise<ApiResult<PaginatedLeaves<T>>>
): Promise<ApiResult<PaginatedResponseWrapper<T>>> {
  const res = await resPromise;
  if (isError(res)) return res;
  return asWrapper(res.items, res.total, res.page, res.perPage);
}

export class LeaveService {
  /** GET /leaves?type=applied&page&perPage — my pending leaves. */
  static async listApplied(
    params?: Pick<LeaveListParams, "page" | "perPage">
  ): Promise<ApiResult<PaginatedLeaves<LeaveRecord>>> {
    return api.get<PaginatedLeaves<LeaveRecord>>(BASE, {
      ...params,
      type: "applied",
    });
  }

  /** GET /leaves?type=previous — my reviewed (history) leaves. */
  static async listPrevious(
    params?: Pick<LeaveListParams, "page" | "perPage">
  ): Promise<ApiResult<PaginatedLeaves<LeaveRecord>>> {
    return api.get<PaginatedLeaves<LeaveRecord>>(BASE, {
      ...params,
      type: "previous",
    });
  }

  /**
   * GET /leaves — all of my leaves, pending and reviewed, in one list.
   * Backend orders by `id desc` (latest applied first).
   * Omits `type` so the backend's `where` clause skips the `reviewed` filter.
   * Optional `status` narrows to exact LeaveStatus (powers the My Leaves chips).
   */
  static async listAllMine(
    params?: Pick<LeaveListParams, "page" | "perPage" | "status">
  ): Promise<ApiResult<PaginatedLeaves<LeaveRecord>>> {
    return api.get<PaginatedLeaves<LeaveRecord>>(BASE, params);
  }

  /** GET /leaves/approvals — leaves awaiting my decision (optionally ?type=all). */
  static async listApprovals(
    params?: ApprovalsParams
  ): Promise<ApiResult<PaginatedLeaves<LeaveApprovalRow>>> {
    return api.get<PaginatedLeaves<LeaveApprovalRow>>(`${BASE}/approvals`, params);
  }

  /** GET /leaves/approved — leaves I have previously decided. */
  static async listApproved(
    params?: Pick<LeaveListParams, "page" | "perPage">
  ): Promise<ApiResult<PaginatedLeaves<LeaveRecord>>> {
    return api.get<PaginatedLeaves<LeaveRecord>>(`${BASE}/approved`, params);
  }

  /** GET /leaves/current — teammates currently on approved leave. */
  static async listCurrent(): Promise<
    ApiResult<PaginatedLeaves<CurrentLeavePerson>>
  > {
    return api.get<PaginatedLeaves<CurrentLeavePerson>>(`${BASE}/current`);
  }

  /**
   * GET /leaves/balance — the org's configured leave types plus what the caller
   * has left of each this year. This is the source for the apply form's leave
   * types: they come from the Leave Policy screen, never from a hardcoded list.
   */
  static async getMyBalance(
    year?: number
  ): Promise<ApiResult<LeaveBalanceResponse>> {
    return api.get<LeaveBalanceResponse>(
      `${BASE}/balance`,
      year ? { year: String(year) } : undefined,
      { label: "leaves:balance", toast: false }
    );
  }

  /** POST /leaves — apply for a leave. */
  static async apply(
    payload: ApplyLeavePayload
  ): Promise<ApiResult<LeaveRecord>> {
    return api.post<LeaveRecord>(BASE, payload);
  }

  /**
   * GET /leaves/check-supervisor-availability — used by the Apply modal to
   * decide whether to surface the "why apply without supervisor" prompt.
   */
  static async checkSupervisorAvailability(
    startDate: string,
    endDate: string
  ): Promise<ApiResult<{
    supervisorUid: string | null;
    supervisor?: {
      uid: string;
      username?: string;
      fullname?: string | null;
      picture?: string | null;
    } | null;
    onLeave: boolean;
    leaveStart?: string | null;
    leaveEnd?: string | null;
    /** Who the request will actually reach: direct supervisor, escalated top
     *  supervisor, or the org-admins pool when there's no chain. */
    approver?: {
      type: "supervisor" | "top_supervisor" | "admins" | "none";
      user?: {
        uid: string;
        username?: string;
        fullname?: string | null;
        picture?: string | null;
      } | null;
      /** For type 'admins': the hydrated org-leader pool the leave routes to. */
      users?: Array<{
        uid: string;
        username?: string;
        fullname?: string | null;
        picture?: string | null;
      }>;
    };
  }>> {
    return api.get(
      `${BASE}/check-supervisor-availability`,
      { startDate, endDate },
      { label: "Check Supervisor Availability", toast: false }
    );
  }

  /** GET /leaves/viewable — read-only org-wide list for the Viewable tab. */
  static async listViewable(
    params?: Pick<LeaveListParams, "page" | "perPage">
  ): Promise<ApiResult<PaginatedLeaves<LeaveRecord>>> {
    return api.get<PaginatedLeaves<LeaveRecord>>(`${BASE}/viewable`, params);
  }

  /** POST /leaves/approve/:id — approver decision (approve/reject/modified/cancelled). */
  static async decide(
    id: number,
    payload: DecideLeavePayload
  ): Promise<ApiResult<DecideLeaveResult>> {
    return api.post<DecideLeaveResult>(`${BASE}/approve/${id}`, payload);
  }

  /** POST /leaves/modify/:id — adjust an existing decision. */
  static async modify(
    id: number,
    payload: ModifyLeavePayload
  ): Promise<ApiResult<DecideLeaveResult>> {
    return api.post<DecideLeaveResult>(`${BASE}/modify/${id}`, payload);
  }

  /** DELETE /leaves/:id — soft-cancel (owner-only, unreviewed). */
  static async cancel(id: number): Promise<ApiResult<CancelLeaveResult>> {
    return api.delete<CancelLeaveResult>(`${BASE}/${id}`);
  }

  /**
   * GET /leaves/:id/verify-link?token=... — validates an email CTA deep link.
   * Returns the approval row (decorated with `canReview`) on success; on
   * failure the api client surfaces the `[[error:invalid-token]]` /
   * `[[error:no-privileges]]` string.
   */
  static async verifyLink(
    id: number,
    token: string
  ): Promise<ApiResult<LeaveApprovalRow>> {
    return api.get<LeaveApprovalRow>(
      `${BASE}/${id}/verify-link`,
      { token },
      { label: "Verify Leave Link", toast: false }
    );
  }
}

// ─── DataTable adapters ─────────────────────────────────────────────────────
// Named functions so DataTable's internal queryKey (`[..., queryFn.name, ...]`)
// stays stable + readable, and the return type matches DataTable's signature.

export function listApplied(
  params: PaginationParams
): Promise<ApiResult<PaginatedResponseWrapper<LeaveRecord>>> {
  return wrap(LeaveService.listApplied(params as Pick<LeaveListParams, "page" | "perPage">));
}

export function listPrevious(
  params: PaginationParams
): Promise<ApiResult<PaginatedResponseWrapper<LeaveRecord>>> {
  return wrap(LeaveService.listPrevious(params as Pick<LeaveListParams, "page" | "perPage">));
}

export function listAllMine(
  params: PaginationParams & { status?: LeaveRecord["status"] }
): Promise<ApiResult<PaginatedResponseWrapper<LeaveRecord>>> {
  return wrap(
    LeaveService.listAllMine(
      params as Pick<LeaveListParams, "page" | "perPage" | "status">,
    ),
  );
}

export function listApprovals(
  params: PaginationParams & {
    type?: "me" | "all";
    status?: "pending" | "reviewed" | "all";
  },
): Promise<ApiResult<PaginatedResponseWrapper<LeaveApprovalRow>>> {
  return wrap(LeaveService.listApprovals(params as ApprovalsParams));
}

export function listViewable(
  params: PaginationParams
): Promise<ApiResult<PaginatedResponseWrapper<LeaveRecord>>> {
  return wrap(
    LeaveService.listViewable(params as Pick<LeaveListParams, "page" | "perPage">)
  );
}

export function listApproved(
  params: PaginationParams
): Promise<ApiResult<PaginatedResponseWrapper<LeaveRecord>>> {
  return wrap(LeaveService.listApproved(params as Pick<LeaveListParams, "page" | "perPage">));
}
