import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  AttendanceDayStatus,
  AttendanceMonthResponse,
  MyPayrollResponse,
} from "@/types/aavahana/attendance.types";

/**
 * Frontend service for the People-Ops attendance surface.
 * Backend endpoints are mounted at `/api/v3/pdgms/attendance`.
 */
export class AttendanceService {
  /**
   * Fetch the caller's own month attendance (aggregates + per-day records).
   * @param month YYYY-MM. Defaults to the current month server-side when omitted.
   */
  static async getMySummary(
    month?: string,
  ): Promise<ApiResult<AttendanceMonthResponse>> {
    return api.get<AttendanceMonthResponse>(
      "/v3/pdgms/attendance/summary",
      month ? { month } : undefined,
      { label: "attendance:summary", toast: false },
    );
  }

  /**
   * Is a daily report owed from the caller on `date`? Weekends, holidays and
   * leave days owe nothing. Defaults to today server-side when omitted.
   */
  static async getDayStatus(
    date?: string,
  ): Promise<ApiResult<AttendanceDayStatus>> {
    return api.get<AttendanceDayStatus>(
      "/v3/pdgms/attendance/day-status",
      date ? { date } : undefined,
      { label: "attendance:day-status", toast: false },
    );
  }

  /**
   * Fetch the caller's own payroll for a month. Provisional (live estimate)
   * until the month is finalized server-side on the 28th.
   * @param month YYYY-MM. Defaults to the current month server-side when omitted.
   */
  static async getMyPayroll(
    month?: string,
  ): Promise<ApiResult<MyPayrollResponse>> {
    return api.get<MyPayrollResponse>(
      "/v3/pdgms/payroll/me",
      month ? { month } : undefined,
      { label: "payroll:me", toast: false },
    );
  }
}
