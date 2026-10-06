// src/lib/services/trinethra/daily-reports.service.ts
// Layer 3 client for the Trinethra → Daily Reports Export screen.
// Endpoints are mounted at /api/v3/pdgms/loops/daily-reports on the backend
// (org manager or NodeBB admin only — members get 403).

import { api, isError } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  PaginatedResponseWrapper,
  PaginationParams,
} from "@/types";
import type {
  DailyReportPeopleResponse,
  DailyReportListResponse,
  DailyReportExportRow,
  DailyReportFilters,
  DailyReportQuery,
} from "@/types/trinethra/daily-reports.types";
import { ExportService } from "@/lib/services/shared/export.service";

const BASE = "/v3/pdgms/loops/daily-reports";

/** DataTable rows need an `id` for rowKey — alias the backend's reportId. */
export type DailyReportTableRow = DailyReportExportRow & { id: string };

/**
 * Convert the backend's `{ items, total, page, perPage }` paginated envelope
 * into the `{ data, pagination }` shape `DataTable` expects (same adapter
 * convention as leave.service.ts).
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

/** Build the filter query string shared by the list call and the CSV export. */
function toQuery(filters: DailyReportFilters): DailyReportQuery {
  return {
    month: filters.month,
    eids: filters.eids.length ? filters.eids.join(",") : undefined,
    search: filters.search.trim() || undefined,
    submittedOnly: filters.submittedOnly || undefined,
  };
}

export class DailyReportsService {
  /** GET /daily-reports/people?month= — org people with report counts. */
  static async listPeople(
    month: string
  ): Promise<ApiResult<DailyReportPeopleResponse>> {
    return api.get<DailyReportPeopleResponse>(`${BASE}/people`, { month });
  }

  /** GET /daily-reports — filtered, paginated report rows. */
  static async list(
    params: PaginationParams & DailyReportQuery
  ): Promise<ApiResult<DailyReportListResponse>> {
    return api.get<DailyReportListResponse>(BASE, params);
  }

  /**
   * GET /daily-reports?...&format=csv — browser download of the current
   * filter selection (ExportService appends the format param).
   */
  static async exportCsv(filters: DailyReportFilters): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(toQuery(filters)).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    await ExportService.downloadCsv(
      `${BASE}?${params.toString()}`,
      `daily-reports-${filters.month}.csv`
    );
  }
}

export { toQuery as buildDailyReportQuery };

/** DataTable queryFn adapter — stable name feeds the TanStack queryKey. */
export async function listDailyReports(
  params: PaginationParams & DailyReportQuery
): Promise<ApiResult<PaginatedResponseWrapper<DailyReportTableRow>>> {
  const res = await DailyReportsService.list(params);
  if (isError(res)) return res;
  const rows = res.items.map((r) => ({ ...r, id: r.reportId }));
  return asWrapper(rows, res.total, res.page, res.perPage);
}
