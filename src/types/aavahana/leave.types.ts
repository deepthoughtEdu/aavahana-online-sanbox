// src/types/aavahana/leave.types.ts
// Types for the Aavahana → Leaves Tracker module.
// Mirrors the Prisma LeaveRequest model in pdgmsnewdb/prisma/schema.prisma.

export type LeaveStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "modified"
  | "cancelled";

/**
 * The legacy hardcoded vocabulary. Still the shape of older `LeaveRequest.type`
 * values, but it is NOT the list to offer when applying — the org's leave
 * policy is (see `LeaveBalanceEntry`), so an admin adding or renaming a type in
 * Leave Policy is reflected in the apply form without a code change.
 */
export type LeaveType = "casual" | "sick" | "earned" | "comp_off";

/**
 * One row of `GET /v3/pdgms/people/leaves/balance?year=YYYY` — a leave type from
 * the org's policy plus what the caller has left of it this year.
 *
 * `accrued` is the allowance earned so far (monthly grant × months elapsed,
 * capped by the annual quota), and `remaining` is what is still spendable as
 * PAID leave. Because the monthly allowance is pooled across paid types, the
 * same figure appears on each of them — one allowance shown against each way of
 * spending it.
 *
 * `chargesTo` is the type this one is actually billed against: every
 * non-medical category collapses onto casual server-side, so picking "Earned"
 * spends the casual allowance. Show the balance of `chargesTo`, not of the
 * type itself, or the number on screen is not the number that decides pay.
 */
export interface LeaveBalanceEntry {
  type: string;
  label: string;
  total: number;
  accrued: number;
  used: number;
  paidUsed: number;
  unpaidUsed: number;
  remaining: number;
  isPaid: boolean;
  chargesTo: string | null;
  chargesToLabel: string | null;
}

/**
 * This month's paid-leave allowance — the figure a person can actually act on.
 *
 * It is ONE pooled allowance across all paid types (the largest accrual rate,
 * not the sum), spent per calendar month, and an unspent month does not carry
 * forward. A year-to-date "remaining" therefore describes days nobody can
 * take, which is why this leads the balance screen and the yearly numbers are
 * shown as context behind it.
 *
 * `pool` / `remaining` are null when the policy sets no monthly limit at all
 * (only annual quotas). The whole block is null for a past or future year.
 */
export interface LeaveMonthlyAllowance {
  /** YYYY-MM */
  month: string;
  /** Paid days granted per month for this person's employment type. */
  pool: number | null;
  /** Paid days already spent in this month. */
  paidUsed: number;
  /**
   * Spendable right now. Without carry-forward that is this month's grant less
   * this month's spend; with it, everything earned since joining less
   * everything spent this year.
   */
  remaining: number | null;
  /** Whether an unspent month stays available instead of expiring. */
  carryForward: boolean;
  /** 'Internship' | 'Contract' | 'Full-Time Employee', or null if unset. */
  employmentType: string | null;
  /** Cap on paid days in one continuous absence; null for no cap. */
  maxPaidDaysPerRequest: number | null;
}

export interface LeaveBalanceResponse {
  year: number;
  monthly: LeaveMonthlyAllowance | null;
  balances: LeaveBalanceEntry[];
}

export interface WorkingHours {
  from: string; // "HH:mm"
  to: string;   // "HH:mm"
}

/**
 * Calculation breakdown of the requested leave window.
 * Backend persists the same shape; the optional fields are populated by the
 * client-side calendar component for UI display.
 */
export interface LeaveCalculation {
  type?: "day" | "hour";
  duration?: number;
  finalLeaves: number;
  startRaw?: number | string;
  endRaw?: number | string;
  // Optional UI-only breakdown
  workingDays?: number;
  sundays?: number;
  holidays?: number;
  calendarDays?: number;
}

/** Compact user record returned alongside leave rows. */
export interface LeaveUserRef {
  uid: number;
  username: string;
  userslug?: string;
  fullname?: string | null;
  picture?: string | null;
}

/** Canonical row returned by the backend. */
export interface LeaveRecord {
  id: number;
  orgId: string;
  eid: number;
  appliedByUid: string;
  supervisorId: string;
  requestedTo: string | null;
  managers: string[];
  type: LeaveType | string;
  startDate: string;        // ISO datetime
  endDate: string;          // ISO datetime
  days: number;
  calculated: LeaveCalculation | null;
  workingHours: WorkingHours | null;
  teamName: string | null;
  description: string | null;
  deliverables: string | null;
  assignee: string | null;
  reason: string;
  status: LeaveStatus;
  note: string | null;
  approvalToken: string | null;
  /** Urgent flag captured at apply time — pulls admins into the approver pool. */
  isUrgent?: boolean;
  urgentReason?: string | null;
  noSupervisorReason?: string | null;
  requiresBusinessAdminApproval: boolean;
  reviewed: boolean;
  approvedBy: string | null;
  split: boolean;
  parentLeaveId: number | null;
  appliedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Backend-joined applicant user record (matches appliedByUid). */
  user?: LeaveUserRef | null;
  /** Backend-joined approver user record (matches requestedTo). */
  requestedToUser?: LeaveUserRef | null;
  /** Every reviewer in `managers[]`, joined to user records. */
  managerUsers?: LeaveUserRef[];
}

/** Row returned by GET /approvals — adds the `canReview` flag. */
export interface LeaveApprovalRow extends LeaveRecord {
  canReview: boolean;
}

/** Compact projection used by the "Currently away" section. */
export interface CurrentLeavePerson {
  id: number;
  appliedByUid: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  user?: LeaveUserRef | null;
}

/** Payload accepted by POST /leaves. */
export interface ApplyLeavePayload {
  type: LeaveType | string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  /** Optional — backend falls back to the caller's onboarding manager. */
  requestedTo?: string;
  supervisorId?: string;
  managers?: string[];
  /** Urgent flag — backend routes admins into the approver pool when true. */
  isUrgent?: boolean;
  urgentReason?: string;
  noSupervisorReason?: string;
  calculated: LeaveCalculation;
  workingHours: WorkingHours;
  teamName?: string;
  description?: string;
  deliverables?: string;
  assignee?: string;
}

/** Payload accepted by POST /approve/:id. */
export interface DecideLeavePayload {
  status: Exclude<LeaveStatus, "pending">;
  note?: string;
  calculated?: LeaveCalculation;
}

/** Payload accepted by POST /modify/:id. */
export interface ModifyLeavePayload {
  status: Exclude<LeaveStatus, "pending">;
  calculated: LeaveCalculation;
  note?: string;
  /**
   * The approver's adjusted window, as "YYYY-MM-DD" calendar days. Send both
   * bounds or neither — the backend rejects a half-supplied range rather than
   * silently keeping one of the applicant's dates. Omit to decide the leave
   * exactly as it was applied for.
   */
  startDate?: string;
  endDate?: string;
}

export interface CancelLeaveResult {
  cancelled: boolean;
  id: number;
}

export interface DecideLeaveResult {
  id: number;
  status: LeaveStatus;
  reviewed: boolean;
  split: boolean;
  chunkIds: number[];
}

/** Backend pagination envelope: { items, total, page, perPage }. */
export interface PaginatedLeaves<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

/** Chip filter for the My Leaves view — "all" means no status filter. */
export type MyLeavesStatusFilter = "all" | "pending" | "approved";

export interface LeaveListParams {
  type?: "applied" | "previous";
  /** Exact LeaveStatus filter — omit for all. */
  status?: LeaveStatus;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export type ApprovalsStatusFilter = "pending" | "reviewed" | "all";

export interface ApprovalsParams {
  type?: "me" | "all";
  /** Which slice of approvals to fetch — defaults to "pending" server-side. */
  status?: ApprovalsStatusFilter;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}
