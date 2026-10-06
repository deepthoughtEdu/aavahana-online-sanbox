// src/lib/constants/leave.constants.ts
// Static constants for the Aavahana → Leaves Tracker module.

import type { LeaveStatus, LeaveType } from "@/types/aavahana/leave.types";
import type { ColorVariant } from "@/utils/shared/design.utils";

export const LEAVE_TYPES: LeaveType[] = [
  "casual",
  "sick",
  "earned",
  "comp_off",
];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual",
  sick: "Sick",
  earned: "Earned",
  comp_off: "Comp-off",
};

export const LEAVE_REASONS: string[] = [
  "Medical reasons",
  "Personal reasons",
  "Family event",
  "Vacation / travel",
  "Connectivity issues",
  "Other",
];

/**
 * Default reason auto-suggested when the user picks a leave type. Applied only
 * until the user manually selects a reason — after that we leave their choice
 * alone. Strings here MUST exist in `LEAVE_REASONS` above.
 */
export const DEFAULT_REASON_FOR_TYPE: Record<LeaveType, string> = {
  sick: "Medical reasons",
  casual: "Personal reasons",
  earned: "Vacation / travel",
  comp_off: "Personal reasons",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  modified: "Modified",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, ColorVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  modified: "info",
  cancelled: "neutral",
};

// Default leave-window times — aligned with the work-day window in
// _components/leave-calc.ts so a full-day leave produces a clean integer.
export const DEFAULT_WORKING_HOURS = {
  from: "11:30",
  to: "21:00",
};

/** Threshold above which a request requires business-admin (L3) approval. */
export const BUSINESS_ADMIN_APPROVAL_THRESHOLD_DAYS = 3;

/**
 * How many days a leave request may be back-dated. Employees sometimes have
 * emergencies and forget to apply before going on leave, so we let them pick a
 * start date up to this many calendar days in the past (e.g. on 19 Jun the
 * earliest selectable day is 04 Jun). Mirrored server-side in
 * `pdgmsnewdb` → `leaves.create` so it can't be bypassed via the API.
 */
export const MAX_BACKDATE_DAYS = 15;

export const LEAVE_DATE_FORMATS = {
  date: "DD MMM YYYY",
  dateTime: "DD MMM YYYY, hh:mm A",
  iso: "YYYY-MM-DD",
  time: "hh:mm A",
} as const;
