/**
 * use-event-loop.ts — Shared React Query hooks for the Event Loop module.
 * Used by Mimamsaka (L3), Aavahana (L1/L2), and Niyanta (L4).
 */

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { EventLoopService } from "@/lib/services/shared/event-loop.service";
import { queryClient } from "@/lib/query/client";
import type {
  RaiseTicketPayload,
  EscalateTicketPayload,
  NudgeTicketPayload,
  ActionTicketPayload,
  MarkTaskStatusPayload,
} from "@/types/shared/event-loop.types";

/* ── READ ──────────────────────────────────────────────────────────────────── */

/** Lightweight hook for the dashboard Today's Pulse badge — no programId required. */
export function useEventLoopBadge() {
  return useApi({
    queryKey: ["event-loop-badge"],
    queryFn: EventLoopService.getMyOpenTicketCount,
    staleTime: 1000 * 60 * 2, // 2 min — badge can be slightly stale
  });
}

export function useEventLoop(programId: string) {
  return useApi({
    queryKey: ["event-loop", programId],
    queryFn: () => EventLoopService.getEventLoop(programId),
    enabled: !!programId,
  });
}

/* ── WRITE ─────────────────────────────────────────────────────────────────── */

export function useMarkTaskStatus(programId: string) {
  return useApiMutation({
    mutationFn: (payload: MarkTaskStatusPayload) =>
      EventLoopService.markTaskStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-loop", programId] });
    },
  });
}

export function useRaiseTicket(programId: string) {
  return useApiMutation({
    mutationFn: (payload: RaiseTicketPayload) =>
      EventLoopService.raiseTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-loop", programId] });
    },
  });
}

export function useEscalateTicket(programId: string) {
  return useApiMutation({
    mutationFn: (payload: EscalateTicketPayload) =>
      EventLoopService.escalateTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-loop", programId] });
    },
  });
}

export function useNudgeTicket(programId: string) {
  return useApiMutation({
    mutationFn: (payload: NudgeTicketPayload) =>
      EventLoopService.nudgeTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-loop", programId] });
    },
  });
}

export function useActionTicket(programId: string) {
  return useApiMutation({
    mutationFn: (payload: ActionTicketPayload) =>
      EventLoopService.actionTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-loop", programId] });
    },
  });
}
