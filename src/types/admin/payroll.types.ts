import type { AttendanceSummary } from "@/types/aavahana/attendance.types";

// ── Team Attendance (GET /v3/pdgms/attendance/team) ──

export interface TeamAttendanceMember {
  eid: number;
  displayName: string;
  userId: string;
  summary: AttendanceSummary;
}

export interface TeamAttendanceResponse {
  month: string;
  /**
   * The org's attendance basis, echoed with the rows because `/payroll/config`
   * is administrator-only. Under `daily_report` each member's `present` and
   * `absent` counts are reports filed and missed.
   */
  attendanceMode: AttendanceMode;
  members: TeamAttendanceMember[];
}

// ── Payroll Dashboard (GET /v3/pdgms/payroll/dashboard) ──

export interface PayrollEmployee {
  eid: number;
  name: string;
  daysPresent: number;
  daysOnLeave: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  daysAbsent: number;
  billableDays: number;
  workingDays: number;
  attendancePercent: number;
  monthlyCTC?: number;
  amountPayable?: number;
  upi?: string | null;
}

export interface PayrollDashboardResponse {
  month: string;
  employees: PayrollEmployee[];
}

export interface PayrollComputeResponse {
  month: string;
  computed: number;
}

export interface PayrollLockResponse {
  month: string;
  locked: boolean;
  count: number;
}

// ── Payroll Config (GET/PUT /v3/pdgms/payroll/config) ──

export type PayrollMethod = "calendar_day" | "working_day";

/** How a working day with no leave/holiday is counted for attendance. */
export type AttendanceMode = "present_by_default" | "daily_report";

export interface PayrollConfig {
  payrollMethod: PayrollMethod;
  payrollDay: number;
  payrollCurrency: string;
  attendanceWarningTime: string;
  attendanceEnabled: boolean;
  attendanceMode: AttendanceMode;
}

// ── Access Grants (CRUD /v3/pdgms/people/access-grants) ──

export type GrantModule = "attendance" | "payroll";
export type GrantScopeType = "direct_reports" | "group" | "department" | "org";

export interface AccessGrant {
  id: number;
  orgId: string;
  uid: string;
  module: GrantModule;
  scopeType: GrantScopeType;
  scopeId: string;
  grantedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrantPayload {
  uid: string;
  module: GrantModule;
  scopeType: GrantScopeType;
  scopeId?: string;
}

export interface BulkGrantPayload {
  uids: string[];
  module: GrantModule;
  scopeType: GrantScopeType;
  scopeId?: string;
}

export interface BulkGrantResult {
  uid: string;
  status: "created" | "already_exists";
  grantId?: number;
}
