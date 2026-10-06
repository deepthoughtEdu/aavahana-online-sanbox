"use client";

import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { LeaveCalculation } from "@/types/aavahana/leave.types";
import { formatLeaveDate, leaveDaySpan } from "@/utils/aavahana/leave.utils";

interface CalculationDisplayProps {
  startDate?: string | null;
  endDate?: string | null;
  calculated?: LeaveCalculation | null;
}

/**
 * Read-only summary of the requested leave window — dates + breakdown.
 * Renders a placeholder until both dates are selected.
 */
export function CalculationDisplay({
  startDate,
  endDate,
  calculated,
}: CalculationDisplayProps) {
  if (!startDate || !endDate || !calculated) {
    return (
      <EmptyState
        variant="empty"
        title="Pick start and end dates"
        subtitle="Choose a date range to see the breakdown."
      />
    );
  }

  // Org-zone resolved: this component is fed a day-only string on the apply
  // path and a raw stored instant on the approval path, and both must read as
  // the same day.
  const start = formatLeaveDate(startDate);
  const end = formatLeaveDate(endDate);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Selected range</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/60">From</span>
            <span className="font-semibold">{start}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/60">To</span>
            <span className="font-semibold">{end}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h4 className="font-semibold text-sm">Leave breakdown</h4>
        <div className="space-y-2">
          <Row
            label="Calendar days"
            value={calculated.calendarDays}
            fallback={leaveDaySpan(startDate, endDate)}
          />
          <Row label="Working days" value={calculated.workingDays} highlight />
          <Row label="Sundays" value={calculated.sundays} variant="info" />
          <Row label="Holidays" value={calculated.holidays} variant="warning" />
        </div>
      </div>

      <div className="pt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-primary">Final leave count</span>
        <Badge
          label={String(calculated.finalLeaves)}
          variant="primary"
          size="lg"
          icon={null}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  fallback,
  variant = "neutral",
  highlight = false,
}: {
  label: string;
  value?: number;
  fallback?: number;
  variant?: "neutral" | "info" | "warning";
  highlight?: boolean;
}) {
  const display = value ?? fallback;
  if (display === undefined || display < 0) return null;

  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-base-200/50">
      <span
        className={`text-xs font-medium ${
          highlight ? "text-primary" : "text-base-content/70"
        }`}
      >
        {label}
      </span>
      <Badge label={String(display)} variant={variant} size="sm" icon={null} />
    </div>
  );
}
