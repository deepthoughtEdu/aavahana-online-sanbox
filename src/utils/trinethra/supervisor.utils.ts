// src/utils/trinethra/supervisor.utils.ts

import { PerformanceLevel } from "@/types/trinethra/supervisor.types";
import type { SupScoreTrendPoint } from "@/types/trinethra/supervisor.types";
import type { ColorVariant } from "@/utils";

export const calculateEngagePercent = (attendance: string | null): number => {
  return parseInt(attendance ?? "0") || 0;
};

export type TrendDirection = "up" | "down" | "flat" | "none";

export const getTrendDirection = (
  trend: SupScoreTrendPoint[] | null | undefined
): TrendDirection => {
  if (!trend || trend.length < 2) return "none";
  const last = trend[trend.length - 1].composite;
  const prev = trend[trend.length - 2].composite;
  if (last > prev) return "up";
  if (last < prev) return "down";
  return "flat";
};

export const getTrendArrow = (
  direction: TrendDirection
): { glyph: string; className: string } => {
  switch (direction) {
    case "up":
      return { glyph: "↑", className: "text-success" };
    case "down":
      return { glyph: "↓", className: "text-error" };
    case "flat":
      return { glyph: "→", className: "text-neutral" };
    default:
      return { glyph: "", className: "" };
  }
};

export const derivePerformanceLevel = (healthScore: number | null): PerformanceLevel => {
  if (healthScore == null) return PerformanceLevel.NEEDS_ATTENTION;
  if (healthScore >= 80) return PerformanceLevel.EXCELLENT;
  if (healthScore >= 60) return PerformanceLevel.GOOD;
  return PerformanceLevel.NEEDS_ATTENTION;
};

export const getHealthScoreBadgeColor = (score: number | null): ColorVariant => {
  if (score == null) return "error";
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "error";
};

export const getRowClassName = (level: PerformanceLevel): string => {
  const baseClasses = "cursor-pointer";

  switch (level) {
    case PerformanceLevel.EXCELLENT:
      return `${baseClasses} bg-success/10`;
    case PerformanceLevel.GOOD:
      return `${baseClasses} bg-success/5`;
    case PerformanceLevel.NEEDS_ATTENTION:
      return `${baseClasses} bg-error/5`;
    default:
      return `${baseClasses} bg-warning/5`;
  }
};

/**
 * Whole-row tint for the people table, driven directly by the health score:
 * ≥70 green · 40–69 yellow · <40 red · no score → neutral gray ("no data", not
 * a danger signal). Kept separate from PerformanceLevel (used elsewhere) so the
 * row colour can carry a distinct "no data" state.
 */
export const getHealthRowClassName = (score: number | null): string => {
  // rc-table paints `.rc-table tbody tr td { background:#fff }` over every cell,
  // which hides a tint set on the <tr>. So we colour the CELLS directly and use
  // `!important` (via Tailwind's `!` prefix) to beat rc-table's selector specificity.
  const base = "cursor-pointer";
  if (score == null) return `${base} [&>td]:!bg-base-200/70`;
  if (score >= 70) return `${base} [&>td]:!bg-success/20`;
  if (score >= 40) return `${base} [&>td]:!bg-warning/20`;
  return `${base} [&>td]:!bg-error/20`;
};

export const getCardClassName = (level: PerformanceLevel): string => {
  switch (level) {
    case PerformanceLevel.EXCELLENT:
      return "bg-success/10";
    case PerformanceLevel.GOOD:
      return "bg-success/5";
    case PerformanceLevel.NEEDS_ATTENTION:
      return "bg-error/5";
    default:
      return "bg-warning/5";
  }
};

export interface InsightConfig {
  iconType: "summary" | "highlights" | "escalations" | "suggestions";
  iconColor: ColorVariant;
  bgColor: string;
  textColor: string;
  borderColor: string;
  borderLeftColor: string;
}

export const getInsightConfig = (type: string): InsightConfig => {
  switch (type) {
    case "summary":
      return {
        iconType: "summary",
        iconColor: "primary",
        bgColor: "bg-base-200",
        textColor: "text-black",
        borderColor: "border-primary/20",
        borderLeftColor: "border-l-primary",
      };
    case "highlights":
      return {
        iconType: "highlights",
        iconColor: "warning",
        bgColor: "bg-warning/10",
        textColor: "text-warning-content",
        borderColor: "border-warning/20",
        borderLeftColor: "border-l-warning",
      };
    case "escalations":
      return {
        iconType: "escalations",
        iconColor: "error",
        bgColor: "bg-error/10",
        textColor: "text-error-content",
        borderColor: "border-error/20",
        borderLeftColor: "border-l-error",
      };
    case "suggestions":
      return {
        iconType: "suggestions",
        iconColor: "info",
        bgColor: "bg-info/10",
        textColor: "text-info",
        borderColor: "border-info/20",
        borderLeftColor: "border-l-info",
      };
    default:
      return {
        iconType: "summary",
        iconColor: "primary",
        bgColor: "bg-base-200",
        textColor: "text-black",
        borderColor: "border-base-300",
        borderLeftColor: "border-l-base-300",
      };
  }
};

export interface StatusBadgeConfig {
  variant: ColorVariant;
  label: string;
}

export const getStatusBadgeConfig = (
  status: "completed" | "inProgress" | "notStarted"
): StatusBadgeConfig => {
  const statusConfig = {
    completed: { variant: "success" as const, label: "Completed" },
    inProgress: { variant: "warning" as const, label: "In Progress" },
    notStarted: { variant: "error" as const, label: "Not Started" },
  };

  return statusConfig[status];
};

export const isCurrentWeek = (date: Date): boolean => {
  const today = new Date();
  const todayDay = today.getDay();
  const diff = todayDay === 0 ? -6 : 1 - todayDay; // Monday is 1

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() + diff);
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  return date >= currentWeekStart && date <= currentWeekEnd;
};

export const isTodayOrFuture = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
};

export const needsExpansion = (content: string, threshold: number = 150): boolean => {
  return content.length > threshold;
};
