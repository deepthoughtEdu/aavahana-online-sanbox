// src/utils/plan.utils.ts
import moment, { MomentInput } from "moment";
import { ReportTaskStatus } from "@/types";

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Get today's date in ISO format
 */
export function getTodayISO(): string {
  return toISODate(new Date());
}

/**
 * Parse ISO date string to Date object
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Get previous day in ISO format
 */
export function getPrevDayISO(dateString: string): string {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() - 1);
  return toISODate(date);
}

/**
 * Get next day in ISO format
 */
export function getNextDayISO(dateString: string): string {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() + 1);
  return toISODate(date);
}

/**
 * Check if date is past or today
 */
export function isPastOrToday(dateString: string): boolean {
  const date = parseISODate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

/**
 * Get Monday of the current week
 */
export function getWeekStartMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

/**
 * 🔒 Calculate deadline: next day at 12 PM from a given date
 * @param planSubmissionDate - When the plan was submitted (or the date being reported on)
 * @returns Deadline (next day at 12:00 PM)
 */
export function getReportDeadline(planSubmissionDate: MomentInput): Date {
  return moment(planSubmissionDate)
    .add(1, "day")
    .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
    .toDate();
}

/**
 *  Check if report submission is still allowed
 * @param reportDate - The date being reported on (e.g., yesterday)
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if still within deadline, false if locked
 */
export function canSubmitReport(
  reportDate: MomentInput,
  currentTime: MomentInput = new Date()
): boolean {
  const deadline = getReportDeadline(reportDate);
  return moment(currentTime).isBefore(deadline);
}

/**
 * ⏰ Get time remaining until deadline
 * @param reportDate - The date being reported on
 * @returns Human-readable time remaining (e.g., "in 5 hours")
 */
export function getTimeUntilDeadline(reportDate: MomentInput): string {
  const deadline = getReportDeadline(reportDate);
  const now = moment();

  if (now.isAfter(deadline)) {
    return "Deadline passed";
  }

  return moment(deadline).fromNow();
}

type StatusMeta = {
  label: string;
  badgeVariant: "success" | "primary" | "neutral";
  isCompleted: boolean;
};

const STATUS_META: Record<ReportTaskStatus, StatusMeta> = {
  completed: {
    label: "Completed",
    badgeVariant: "success",
    isCompleted: true,
  },
  in_progress: {
    label: "In progress",
    badgeVariant: "primary",
    isCompleted: false,
  },
  notStarted: {
    label: "Not started",
    badgeVariant: "neutral",
    isCompleted: false,
  },
};

export function getTaskStatusMeta(status: ReportTaskStatus): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: "Unknown",
      badgeVariant: "neutral",
      isCompleted: false,
    }
  );
}
