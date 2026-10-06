/**
 * EventLoopService — API integration for the Event Loop module.
 *
 * Shared between Mimamsaka (L3), Aavahana (L1/L2), and Niyanta (L4).
 * Role-based middleware on backend controls tab visibility and write access.
 */

import { api, ApiResult } from "@/lib/api/client";
import type {
  EventLoopData,
  RaiseTicketPayload,
  EscalateTicketPayload,
  NudgeTicketPayload,
  ActionTicketPayload,
  MarkTaskStatusPayload,
} from "@/types/shared/event-loop.types";

export class EventLoopService {
  // ════════════════════════════════════════════════════════════════════════════
  // READ ENDPOINTS
  // ════════════════════════════════════════════════════════════════════════════

  /** Count of open constraint tickets assigned to current user (cross-program). Dashboard badge. */
  static async getMyOpenTicketCount(): Promise<ApiResult<{ count: number }>> {
    return api.get<{ count: number }>("/v3/pdgms/loops/event-loop/my-open-count");
  }

  /** Current sprint event loop data for a program */
  static async getEventLoop(programId: string): Promise<ApiResult<EventLoopData>> {
    return api.get<EventLoopData>(`/v3/pdgms/loops/event-loop`, { programId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WRITE ENDPOINTS
  // ════════════════════════════════════════════════════════════════════════════

  /** Mark a task done or not done (L3) */
  static async markTaskStatus(
    payload: MarkTaskStatusPayload
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>(`/v3/pdgms/grammar/tasks/${payload.taskId}/transition`, { status: payload.status, blockingNote: payload.note });
  }

  /** Raise a break / qa_failure / flag ticket (L3) */
  static async raiseTicket(
    payload: RaiseTicketPayload
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>("/v3/pdgms/grammar/tickets", payload);
  }

  /** Escalate to L4 (L3) */
  static async escalateTicket(
    payload: EscalateTicketPayload
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>(`/v3/pdgms/grammar/tickets/${payload.taskId}/escalate`, {
      decision: payload.escalateRequest,
      proposedResolution: payload.proposedResolution,
    });
  }

  /** Nudge an unanswered escalation (L3) */
  static async nudgeTicket(
    payload: NudgeTicketPayload
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>(`/v3/pdgms/loops/event-loop/tickets/${payload.ticketId}/nudge`, {});
  }

  /** Mark actioned ticket as resolved (L3) */
  static async actionTicket(
    payload: ActionTicketPayload
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>(`/v3/pdgms/grammar/tickets/${payload.ticketId}/resolve`, { note: payload.actionInstruction });
  }
}
