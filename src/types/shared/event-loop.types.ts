/**
 * event-loop.types.ts — Shared TypeScript types for the Event Loop module.
 * Used by Mimamsaka (L3), Aavahana (L1/L2), and Niyanta (L4).
 */

export type DaySignal      = "green" | "amber" | "red" | "pending";
export type OwnerSignal    = "clean" | "flagged" | "escalation";
export type TicketStatus   = "open" | "pending" | "awaiting_action" | "resolved";
export type ELTaskStatus   = "done" | "not_done" | "pending";
export type QAResult       = "met" | "not_met" | "pending";
export type Layer4Decision = "approved" | "rejected" | "modified";
export type ActionDecision = "resolve" | "reassign" | "escalate";

export interface QAState {
  specId:   string;
  reviewer: string;
  result:   QAResult;
  feedback: string | null;
}

export interface ELTask {
  taskId:       string;
  task:         string;
  day:          string;
  status:       ELTaskStatus;
  blockingNote: string | null;
  qa:           QAState;
}

export interface IncomingTicket {
  ticketId:       string;
  type:           "qa_failure" | "break" | "flag";
  raisedBy:       string;
  taskId:         string;
  context:        string;
  downstreamRisk: string[];
  timestamp:      string;
  status:         "open";
  estimatedMins?: number;
}

export interface PendingTicket {
  ticketId:           string;
  type:               "escalation";
  taskId:             string;
  escalateRequest:    string;
  sentTo:             string;
  sentAt:             string;
  nudgeCount:         number;
  lastNudge:          string | null;
  status:             "pending";
  proposedResolution?: string;
  slaHours?:           number;
  createdAt?:          string;
}

export interface ActionedTicket {
  ticketId:          string;
  layer4Decision:    Layer4Decision;
  layer4Note:        string;
  decidedBy:         string;
  decidedAt:         string;
  actionInstruction: string;
  actionedByLayer3:  boolean;
  status:            "awaiting_action" | "resolved";
}

export interface OwnerHealth {
  owner:   string;
  signal:  OwnerSignal;
  tasks:   { done: number; total: number };
  qa:      { met: number; total: number };
  tickets: { open: number };
}

export interface DayBreakdown {
  day:     string;
  signal:  DaySignal;
  tasks:   { done?: number; total?: number; scheduled?: number };
  qa:      { met?: number; total?: number; specsLocked?: number };
  tickets: { open?: number; pending?: number; resolved?: number };
}

export interface PersonalHealth {
  owner:        string;
  currentDay:   string;
  sprintDays:   number;
  tasksDone:    number;
  tasksPending: number;
  qaMet:        number;
  qaPending:    number;
  ticketsOpen:  number;
  streak:       number;
}

export interface ActionQueueItem {
  ticketId:  string;
  type:      "break" | "return";
  summary:   string;
  raisedBy?: string;
  time?:     string;
}

export interface EventLoopData {
  sprintId:       string;
  sprintLabel:    string;
  ownerId:        string;
  personalHealth: PersonalHealth;
  sprintHealth: {
    dayBreakdown:   DayBreakdown[];
    ownerBreakdown: OwnerHealth[];
  };
  actionQueue: ActionQueueItem[];
  myTasks:     ELTask[];
  tickets: {
    incoming: IncomingTicket[];
    pending:  PendingTicket[];
    actioned: ActionedTicket[];
  };
}

/* ── Mutation payloads ─────────────────────────────────────────────────────── */

export interface RaiseTicketPayload {
  sprintId:       string;
  taskId:         string;
  type:           "qa_failure" | "break" | "flag";
  context:        string;
  downstreamRisk?: string[];
}

export interface EscalateTicketPayload {
  sprintId:           string;
  taskId:             string;
  escalateRequest:    string;
  proposedResolution: string;
  sentTo:             string;
  slaHours?:          number;
}

export interface NudgeTicketPayload {
  ticketId: string;
}

export interface ActionTicketPayload {
  ticketId:          string;
  actionInstruction: string;
}

export interface MarkTaskStatusPayload {
  sprintId: string;
  taskId:   string;
  status:   "done" | "not_done";
  note?:    string;
}
