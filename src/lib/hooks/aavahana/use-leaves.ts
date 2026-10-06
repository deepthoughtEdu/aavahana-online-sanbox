"use client";

import { useCallback, useState } from "react";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { LeaveService } from "@/lib/services/aavahana/leave.service";
import { isError } from "@/lib/api/client";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type {
  ApplyLeavePayload,
  DecideLeavePayload,
  ModifyLeavePayload,
} from "@/types/aavahana/leave.types";

const LEAVES_KEY = ["aavahana", "leaves"] as const;
const DATATABLE_KEY = ["datatable"] as const;

/**
 * Invalidate every cached leaves query: the per-tab DataTable caches
 * (`["datatable", "listApplied", …]` etc.) AND any direct leaves hook caches.
 */
const invalidateLeaves = () => {
  queryClient.invalidateQueries({ queryKey: LEAVES_KEY });
  queryClient.invalidateQueries({ queryKey: DATATABLE_KEY });
};

/**
 * The org's leave types (from the Leave Policy) and the caller's remaining paid
 * days for the year. Drives the apply form's type list, so admins renaming or
 * adding a type in Leave Policy changes the form with no code change.
 */
export function useMyLeaveBalance(year?: number) {
  return useApi({
    queryKey: [...LEAVES_KEY, "balance", year ?? "current"],
    queryFn: () => LeaveService.getMyBalance(year),
  });
}

/** Outcome of one bulk run, so the caller can report partial failure honestly. */
export interface BulkDecisionResult {
  succeeded: number[];
  failed: { id: number; message: string }[];
}

/**
 * Approve or reject several leaves in one action.
 *
 * There is no bulk endpoint — the backend decides one leave at a time and
 * re-checks approver authority per row — so this fans out over POST
 * /leaves/approve/:id. It deliberately does NOT reuse `decide` from
 * useLeaveMutations: that fires a toast and a cache invalidation per call, so a
 * 12-row selection would stack 12 toasts and 12 refetches. Here the requests
 * settle first, then a single toast and a single invalidation.
 *
 * Requests run concurrently but failures are isolated, so one rejected row
 * (someone else decided it first, authority changed) never voids the rest.
 */
export function useBulkLeaveDecision() {
  const [isDeciding, setIsDeciding] = useState(false);

  const decideMany = useCallback(
    async (
      ids: number[],
      payload: DecideLeavePayload
    ): Promise<BulkDecisionResult> => {
      const result: BulkDecisionResult = { succeeded: [], failed: [] };
      if (!ids.length) return result;

      setIsDeciding(true);
      try {
        const settled = await Promise.allSettled(
          ids.map((id) => LeaveService.decide(id, payload))
        );

        settled.forEach((outcome, i) => {
          const id = ids[i];
          if (outcome.status === "rejected") {
            result.failed.push({
              id,
              message: outcome.reason?.message || "Request failed",
            });
            return;
          }
          if (isError(outcome.value)) {
            result.failed.push({
              id,
              message: outcome.value.error?.message || "Request failed",
            });
            return;
          }
          result.succeeded.push(id);
        });

        // Refetch once, after everything has settled, so the table repaints a
        // single time with the final state.
        invalidateLeaves();
      } finally {
        setIsDeciding(false);
      }

      return result;
    },
    []
  );

  return { decideMany, isDeciding };
}

export function useLeaveMutations() {
  const apply = useApiMutation({
    mutationFn: (payload: ApplyLeavePayload) => LeaveService.apply(payload),
    onSuccess: () => {
      toast.success("Leave request submitted");
      invalidateLeaves();
    },
  });

  const decide = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DecideLeavePayload }) =>
      LeaveService.decide(id, payload),
    onSuccess: () => {
      toast.success("Decision recorded");
      invalidateLeaves();
    },
  });

  const modify = useApiMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ModifyLeavePayload }) =>
      LeaveService.modify(id, payload),
    onSuccess: () => {
      toast.success("Decision updated");
      invalidateLeaves();
    },
  });

  const cancel = useApiMutation({
    mutationFn: (id: number) => LeaveService.cancel(id),
    onSuccess: () => {
      toast.success("Leave cancelled");
      invalidateLeaves();
    },
  });

  return {
    apply: apply.mutateAsync,
    decide: decide.mutateAsync,
    modify: modify.mutateAsync,
    cancel: cancel.mutateAsync,
    isApplying: apply.isPending,
    isDeciding: decide.isPending,
    isModifying: modify.isPending,
    isCancelling: cancel.isPending,
    isPending:
      apply.isPending ||
      decide.isPending ||
      modify.isPending ||
      cancel.isPending,
  };
}
