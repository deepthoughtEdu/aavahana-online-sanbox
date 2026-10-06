export type SupportTicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "closed"
  | "reopened";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicketCategory =
  | "general"
  | "technical"
  | "hr"
  | "finance"
  | "access"
  | "other";

export interface SupportTicket {
  ticketId: string;
  subject: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  raisedBy: string;
  assignedTo: string | null;
  closedBy: string | null;
  closerRemarks: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  csatScore: number | null;
  csatComment: string | null;
  csatSubmittedAt: string | null;
  contextType: string | null;
  contextId: string | null;
  escalationLevel: number;
  slaHours: number | null;
  firstResponseAt: string | null;
  tags: string[] | null;
  stateTransitions: Record<string, string>[] | null;
  commentCount: number;
  comments?: SupportTicketComment[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketComment {
  commentId: string;
  ticketId: string;
  authorId: string;
  authorRole: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicketStats {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  csatAverage: number | null;
  csatCount: number;
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  perPage: number;
}

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  contextType?: string;
  contextId?: string;
  tags?: string[];
}

export interface UpdateSupportTicketPayload {
  assignedTo?: string;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
}

export interface ChangeStatusPayload {
  status: SupportTicketStatus;
  remarks?: string;
  assignedTo?: string;
}

export interface AddCommentPayload {
  body: string;
  isInternal?: boolean;
}

export interface SubmitCsatPayload {
  score: number;
  comment?: string;
}
