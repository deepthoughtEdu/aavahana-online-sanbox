import { useApi } from "@/lib/hooks/shared/use-api";
import { AttendanceService } from "@/lib/services/aavahana/attendance.service";

/**
 * Fetch the caller's own attendance for a given month.
 * Pass undefined / omit to use the server-side current month.
 */
export function useMyAttendanceMonth(month?: string) {
  return useApi({
    queryKey: ["attendance-summary", month ?? "current"],
    queryFn: () => AttendanceService.getMySummary(month),
    // Paging month-by-month should slide, not blank the screen — hold the
    // previous month's grid until the new one lands.
    placeholderData: (prev) => prev,
  });
}

/**
 * Whether a daily report is owed from the caller on `date` (weekend, holiday
 * and leave days owe nothing). Used to keep the daily report from asking a
 * person to close a day they never worked.
 */
export function useDayStatus(date?: string) {
  return useApi({
    queryKey: ["attendance-day-status", date ?? "today"],
    queryFn: () => AttendanceService.getDayStatus(date),
  });
}

/**
 * Fetch the caller's own payroll for a given month (provisional until the
 * month is finalized on the 28th). Pass undefined to use the current month.
 */
export function useMyPayroll(month?: string) {
  return useApi({
    queryKey: ["payroll-me", month ?? "current"],
    queryFn: () => AttendanceService.getMyPayroll(month),
    placeholderData: (prev) => prev,
  });
}
