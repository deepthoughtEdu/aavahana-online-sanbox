"use client";

import type { MyPayrollResponse } from "@/types/aavahana/attendance.types";
import { formatCurrency } from "@/utils/shared/format.utils";

interface PayrollSummaryCardProps {
  payroll: MyPayrollResponse;
}

const METHOD_NOTE: Record<MyPayrollResponse["calculationMethod"], string> = {
  working_day: "Pay is prorated over working days (present + paid leave).",
  calendar_day:
    "Pay is prorated over calendar days, minus unpaid leave and absences.",
};

/** One labelled stat in the breakdown grid. */
function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "info" | "error" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "info"
        ? "text-info"
        : tone === "error"
          ? "text-error"
          : "text-base-content";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-base-content/50">{label}</span>
      <span className={`text-sm font-medium ${toneClass}`}>{value}</span>
    </div>
  );
}

export function PayrollSummaryCard({ payroll }: PayrollSummaryCardProps) {
  return (
    <section className="rounded-2xl border border-base-200 p-4 sm:p-5 flex flex-col gap-4">
      {/* Header: payable amount + provisional / finalized badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-base-content/40">
            {payroll.provisional ? "Estimated stipend" : "Stipend"}
          </span>
          <span className="text-2xl font-semibold text-base-content">
            {formatCurrency(payroll.amountPayable, "INR")}
          </span>
        </div>
        <span
          className={
            payroll.provisional ? "badge badge-warning" : "badge badge-success"
          }
        >
          {payroll.provisional ? "Provisional" : "Finalized"}
        </span>
      </div>

      {payroll.provisional && (
        <p className="text-xs italic text-base-content/40">
          Estimated from attendance so far. Finalizes at month end — the amount
          changes as you submit reports and take leave.
        </p>
      )}

      {/* Breakdown grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        <Stat
          label="Monthly CTC"
          value={formatCurrency(payroll.monthlyCTC, "INR")}
        />
        <Stat label="Attendance" value={`${payroll.attendancePercent}%`} />
        <Stat
          label="Billable / working days"
          value={`${payroll.billableDays} / ${payroll.workingDays}`}
        />
        <Stat label="Present" value={payroll.daysPresent} tone="success" />
        <Stat label="On leave" value={payroll.daysOnLeave} tone="info" />
        <Stat label="Absent" value={payroll.daysAbsent} tone="error" />
        <Stat label="Paid leave" value={payroll.paidLeaveDays} />
        <Stat label="Unpaid leave" value={payroll.unpaidLeaveDays} />
      </div>

      <p className="text-xs text-base-content/40">
        {METHOD_NOTE[payroll.calculationMethod]}
      </p>
    </section>
  );
}
