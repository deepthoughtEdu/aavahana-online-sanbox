import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { Ticket, CreateTicketPayload, TicketStatus } from "@/types/mimamsaka/ticket.types";
import type { BackendPaginatedResponse } from "@/types/shared/api.types";

export class TicketService {
  /** All tickets assigned to the current user */
  static async getMyTickets(filters?: { status?: TicketStatus; page?: number; perPage?: number }): Promise<ApiResult<BackendPaginatedResponse<Ticket>>> {
    return api.get<BackendPaginatedResponse<Ticket>>("/v3/pdgms/grammar/tickets/my-tickets", filters);
  }

  /** Transition ticket to next status in its lifecycle */
  static async transitionTicket(ticketId: string, status: TicketStatus, note?: string): Promise<ApiResult<Ticket>> {
    return api.patch<Ticket>(`/v3/pdgms/grammar/tickets/${ticketId}/transition`, { status, note });
  }

  /** Create a constraint or ad-hoc deliverable ticket */
  static async createTicket(payload: CreateTicketPayload): Promise<ApiResult<Ticket>> {
    return api.post<Ticket>("/v3/pdgms/grammar/tickets", payload);
  }
}
