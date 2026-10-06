/**
 * Attendance types — mirrors the backend `AttendanceRecord` row and the response
 * shape of `GET /v3/pdgms/attendance/summary`.
 *
 * Status values come from `src/pdgms/attendance/resolver.js` on the backend.
 */

export type AttendanceStatus =
  | "present"
  | "on_leave"
  | "absent"
  | "weekend"
  | "mandatory_holiday"
  | "optional_holiday";

export type AttendanceSubStatus =
  | "paid_leave"
  | "unpaid_leave"
  | "unapproved_leave"
  | null;

export type AttendanceResolvedBy =
  | "system"
  | "daily_report"
  | "approved_leave"
  | "pending_leave"
  | "retroactive";

/** One day's attendance record — only the caller's own rows. */
export interface AttendanceRecordPublic {
  /** YYYY-MM-DD */
  date: string;
  status: AttendanceStatus;
  subStatus: AttendanceSubStatus;
  resolvedBy: AttendanceResolvedBy;
}

/** Aggregated counts for the month. */
export interface AttendanceSummary {
  totalDays: number;
  workingDays: number;
  present: number;
  onLeave: number;
  paidLeave: number;
  unpaidLeave: number;
  absent: number;
  weekends: number;
  mandatoryHolidays: number;
  optionalHolidays: number;
}

/**
 * Response of `GET /v3/pdgms/attendance/day-status?date=YYYY-MM-DD` — whether a
 * daily report is owed from the caller on that date. Computed live from working
 * days, holidays and leave, so it is correct during the day, before the 21:30
 * sweep writes the day's `AttendanceRecord`.
 */
export interface AttendanceDayStatus {
  /** YYYY-MM-DD */
  date: string;
  eid: number;
  status: "working" | "weekend" | "mandatory_holiday" | "optional_holiday" | "on_leave";
  isWorkingDay: boolean;
  reportExpected: boolean;
  /** Human phrase for the day off ("a holiday", "a leave day"); null when working. */
  label: string | null;
}

/** Response of `GET /v3/pdgms/attendance/summary?month=YYYY-MM`. */
export interface AttendanceMonthResponse {
  /** YYYY-MM */
  month: string;
  eid: number;
  summary: AttendanceSummary;
  records: AttendanceRecordPublic[];
}

/** How attendance maps to billable days — set per-org in payroll config. */
export type PayrollMethod = "calendar_day" | "working_day";

/**
 * Response of `GET /v3/pdgms/payroll/me?month=YYYY-MM` — the caller's own
 * payroll for the month. `provisional: true` means it's a live estimate from
 * attendance-so-far (not yet finalized/locked on the 28th) and will change as
 * more days resolve.
 */
export interface MyPayrollResponse {
  /** YYYY-MM */
  month: string;
  eid: number;
  totalDays: number;
  workingDays: number;
  daysPresent: number;
  daysOnLeave: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  daysAbsent: number;
  billableDays: number;
  attendancePercent: number;
  monthlyCTC: number;
  amountPayable: number;
  calculationMethod: PayrollMethod;
  locked: boolean;
  provisional: boolean;
  computedAt: string | null;
}
