"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { HolidayService } from "@/lib/services/aavahana/holiday.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type {
  CreateHolidayPayload,
  UpdateHolidayPayload,
  PaginatedHolidays,
  HolidayRecord,
} from "@/types/aavahana/holiday.types";
import type { ApiResult } from "@/lib/api/client";
import type { SingleQueryResult } from "@/types";

const HOLIDAYS_KEY = ["aavahana", "holidays"] as const;
const DATATABLE_KEY = ["datatable"] as const;
const LEAVES_KEY = ["aavahana", "leaves"] as const;

/**
 * Invalidate every cached holiday-flavoured query: the DataTable cache (so
 * HolidaysTab refetches), the leaves caches (since the day-count for any
 * future apply depends on the holiday list), and direct-hook caches.
 */
const invalidateHolidays = () => {
  queryClient.invalidateQueries({ queryKey: HOLIDAYS_KEY });
  queryClient.invalidateQueries({ queryKey: DATATABLE_KEY });
  queryClient.invalidateQueries({ queryKey: LEAVES_KEY });
};

/**
 * Read-only hook used by ApplyModal / LeaveCalendar to highlight + exclude
 * holiday dates from the day count. Cached per-year.
 */
export function useHolidays(year?: number): SingleQueryResult<PaginatedHolidays> {
  const yr = year ?? new Date().getUTCFullYear();
  // useApi infers paginated vs single via overload resolution. Our backend
  // wraps the list in { items, total, page, perPage } — NOT the DataTable
  // `{ data, pagination }` envelope — so the third overload (single object)
  // matches. Annotating the return narrows it for the callers (ApplyModal,
  // EditModal, HolidayService consumers).
  const queryFn = (): Promise<ApiResult<PaginatedHolidays>> =>
    HolidayService.list({ year: yr, perPage: 200 });
  return useApi({
    queryKey: [...HOLIDAYS_KEY, yr],
    queryFn,
    staleTime: 5 * 60 * 1000,
  }) as SingleQueryResult<PaginatedHolidays>;
}

// Re-export HolidayRecord for callers that don't want a second import path.
export type { HolidayRecord };

export function useHolidayMutations() {
  const create = useApiMutation({
    mutationFn: (payload: CreateHolidayPayload) => HolidayService.create(payload),
    onSuccess: () => {
      toast.success("Holiday added");
      invalidateHolidays();
    },
  });

  const update = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateHolidayPayload }) =>
      HolidayService.update(id, payload),
    onSuccess: () => {
      toast.success("Holiday updated");
      invalidateHolidays();
    },
  });

  const remove = useApiMutation({
    mutationFn: (id: number) => HolidayService.cancel(id),
    onSuccess: () => {
      toast.success("Holiday removed");
      invalidateHolidays();
    },
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isRemoving: remove.isPending,
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}
