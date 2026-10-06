/**
 * Unified ticket status enum serving two distinct lifecycle paths:
 *
 * DELIVERABLE path  (ticketType = "deliverable"):
 *   open → in_progress → pending_qa → qa_failed → pending_qa (retry) → delivered
 *   "delivered" is the only state that counts for career scoring.
 *
 * CONSTRAINT path   (ticketType = "constraint"):
 *   open → classified → routed → accepted → resolved → confirmed
 *   Constraint ticket closes when enabling action is taken.
 *   Internal Support tickets become Orders in the target Support Program.
 */
export type TicketStatus =
  | "open"
  | "classified"
  | "routed"
  | "accepted"
  | "in_progress"
  | "pending_qa"
  | "qa_failed"
  | "delivered"
  | "resolved"
  | "confirmed";

/** 5 PDGMS constraint dimensions — deterministic, universal */
export type ConstraintType =
  | "budget"
  | "talent"
  | "internal_support"
  | "assumptions"
  | "permissions";

export type TicketSource =
  | "micromap"
  | "l2_created"
  | "l1_created"
  | "ad_hoc"
  | "constraint";

export interface StateTransition {
  from:  TicketStatus;
  to:    TicketStatus;
  at:    string;       // ISO datetime
  by:    string;       // userId
  note?: string;
}

export interface Ticket {
  ticketId:            string;      // "tkt_T1.1"
  programId:           string;
  sprintId:            string;
  /** Determines which status path applies. deliverable = in_progress→pending_qa→delivered. constraint = classified→routed→accepted→resolved→confirmed. */
  ticketType:          "deliverable" | "constraint";
  micromapRef?:        string;      // MicroMap task key — null for ad-hoc
  cell:                string;      // "V1×H5"
  constraintType?:     ConstraintType;  // null for deliverable tickets
  label:               string;      // Number + Label: "SSOT Document"
  quantity:            number;
  description:         string;
  assignedTo:          string;      // userId
  assignedBy:          string;      // userId
  targetDate:          string;      // YYYY-MM-DD
  estimatedMinutes?:   number;
  actualMinutes?:      number;
  dependencies:        string[];    // ticketId[]
  fallbackPlan?:       string;
  qaCriteria?:         string;
  qaAssignedTo?:       string;      // userId
  status:              TicketStatus;
  source:              TicketSource;
  routedTo?:           string;      // programId or vLayer — for constraint tickets
  gapDescription?:     string;
  resolutionDescription?: string;
  constraintsPlanned:  Record<string, string> | null;  // A57: {budget|talent|internal_support|assumptions|permissions: description}
  constraintsActual:   Record<string, string> | null;  // A57: actual constraints encountered
  completedAt?:        string;      // when employee marks complete → pendingQa
  deliveredAt?:        string;      // when QA passes → delivered (counts for scoring)
  stateTransitions:    StateTransition[];
  createdAt:           string;
  updatedAt:           string;
}

export interface CreateTicketPayload {
  programId:        string;
  sprintId:         string;
  ticketType:       "deliverable" | "constraint";
  micromapRef?:     string;
  cell:             string;
  constraintType?:  ConstraintType;
  label:            string;
  quantity:         number;
  description:      string;
  assignedTo:       string;
  targetDate:       string;
  estimatedMinutes?: number;
  dependencies?:    string[];
  fallbackPlan?:    string;
  qaCriteria?:      string;
  qaAssignedTo?:    string;
  source:           TicketSource;
  constraintsPlanned?: Partial<Record<ConstraintType, string>>;
}

export interface UpdateTicketStatusPayload {
  ticketId:  string;
  status:    TicketStatus;
  note?:     string;
  routedTo?: string;
  resolutionDescription?: string;
}
