// src/lib/services/aavahana/holiday.service.ts
// Client for the org-wide holiday calendar.
// Backend mount: /api/v3/pdgms/people/leaves/holidays
// (FE strips the /api prefix — see api client.)

import { api, isError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  PaginatedResponseWrapper,
  PaginationParams,
} from "@/types";
import type {
  HolidayRecord,
  CreateHolidayPayload,
  UpdateHolidayPayload,
  ListHolidaysParams,
  PaginatedHolidays,
} from "@/types/aavahana/holiday.types";

const BASE = "/v3/pdgms/people/leaves/holidays";

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

async function wrap(
  resPromise: Promise<ApiResult<PaginatedHolidays>>
): Promise<ApiResult<PaginatedResponseWrapper<HolidayRecord>>> {
  const res = await resPromise;
  if (isError(res)) return res;
  return asWrapper(res.items, res.total, res.page, res.perPage);
}

export class HolidayService {
  /** GET /holidays?year=2026 — open to any logged-in org member. */
  static async list(
    params?: ListHolidaysParams
  ): Promise<ApiResult<PaginatedHolidays>> {
    return api.get<PaginatedHolidays>(BASE, params);
  }

  /** POST /holidays — manager / admin only (enforced backend-side). */
  static async create(
    payload: CreateHolidayPayload
  ): Promise<ApiResult<HolidayRecord>> {
    return api.post<HolidayRecord>(BASE, payload);
  }

  /** PUT /holidays/:id — manager / admin only. */
  static async update(
    id: number,
    payload: UpdateHolidayPayload
  ): Promise<ApiResult<HolidayRecord>> {
    return api.put<HolidayRecord>(`${BASE}/${id}`, payload);
  }

  /** DELETE /holidays/:id — soft-delete (A41). Manager / admin only. */
  static async cancel(id: number): Promise<ApiResult<HolidayRecord>> {
    return api.delete<HolidayRecord>(`${BASE}/${id}`);
  }
}

// ─── DataTable adapter ──────────────────────────────────────────────────────
// Wraps `{ items, total, page, perPage }` into the `{ data, pagination }`
// envelope DataTable expects. Named so DataTable's queryKey stays readable.

export function listHolidays(
  params: PaginationParams & { year?: number }
): Promise<ApiResult<PaginatedResponseWrapper<HolidayRecord>>> {
  return wrap(HolidayService.list(params));
}
