// src/types/admin/leave-policy.types.ts
// Types for the org-wide Leave Policy admin screen.
// Mirrors the Prisma LeavePolicy model (leaveTypes JSON) in
// pdgmsnewdb/prisma/schema.prisma and the GET/PUT
// /v3/pdgms/people/leaves/policy contract (api/pdgms/leaves/policy.js).

/**
 * One configured leave type within a year's policy. `quota` is the number of
 * PAID leaves of this type an employee gets for the year — once an employee's
 * LeaveBalance.used reaches it, further leaves of this type resolve to
 * `unpaid_leave` (see backend classifyPaidUnpaid).
 */
export interface LeaveTypeConfig {
  /** Stable key matched against LeaveRequest.leaveCategory — snake_case. */
  type: string;
  /** Human label shown in the apply UI (e.g. "Casual Leave"). */
  label: string;
  /** Paid leaves granted per year. 0 = none. */
  quota: number;
  /** Whether days of this type are paid (counted as billable). */
  isPaid: boolean;
  /** Optional per-month accrual rate (days credited each month). */
  accrualRate?: number;
}

/**
 * The three kinds of employment, matching `EmployeeProfile.internshipType` and
 * the backend's VALID_INTERNSHIP_TYPES. These strings are the keys of
 * `employmentRules` — they are data, not display labels, so don't reword them.
 */
export const EMPLOYMENT_TYPES = [
  "Internship",
  "Contract",
  "Full-Time Employee",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/**
 * How the paid-leave allowance behaves for one kind of employment.
 *
 * `carryForward: false` means the month's grant expires with the month.
 * `true` means unspent days stay available, so the balance accumulates —
 * still bounded by the leave type's paid days/year.
 *
 * `maxPaidDaysPerRequest` caps how much of ONE continuous absence can be paid
 * (counted per stretch, not per request, so splitting a fortnight in two
 * doesn't double the paid part). Omit for no cap.
 */
export interface EmploymentRule {
  /** Paid days granted per month. 0 = this employment type gets no paid leave. */
  monthlyAccrual: number;
  carryForward: boolean;
  maxPaidDaysPerRequest?: number;
}

export type EmploymentRules = Partial<Record<EmploymentType, EmploymentRule>>;

/** Canonical row returned by GET /leaves/policy. */
export interface LeavePolicy {
  /** Present only once a policy row exists; absent on the empty default. */
  id?: number;
  orgId?: string;
  year: number;
  leaveTypes: LeaveTypeConfig[];
  /** Always populated on read — the backend merges its defaults in. */
  employmentRules?: EmploymentRules;
  /**
   * Month (1-12) this year's accrual clock starts; 1 = January. Lets a leave
   * year begin mid-stream — an org that switched leave on in August credits
   * August through December, not the whole calendar year.
   */
  accrualStartMonth?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload accepted by PUT /leaves/policy (admin-only upsert). */
export interface UpsertLeavePolicyPayload {
  year: number;
  leaveTypes: LeaveTypeConfig[];
  employmentRules?: EmploymentRules;
  accrualStartMonth?: number;
}
