"use client";

import { useState } from "react";
import { useMyAttendanceMonth, useMyPayroll } from "@/lib/hooks/aavahana/use-attendance";
import { MyAttendanceCalendar } from "./MyAttendanceCalendar";
import { PayrollSummaryCard } from "./PayrollSummaryCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/shared/icons";
import { cn, gaps } from "@/utils";
import { formatMonthLabel } from "@/utils/shared/date.utils";

/** Current month as YYYY-MM in UTC — matches the server's month keys. */
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Shift a YYYY-MM key by ±1 month. */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// A month name from a 'YYYY-MM' key. One shared implementation; the UTC pin, and why it
// must not be removed, live in date.utils.
function monthLabel(month: string, opts?: { short?: boolean }): string {
  return formatMonthLabel(month, opts);
}

/**
 * Attendance surface. Owns the selected-month state so the calendar and the
 * payroll card stay in sync, and carries the `< month >` navigation in the page
 * header the way the daily and weekly reports do — so it stays reachable while
 * a month is loading, and while an error or empty month is on screen.
 *
 * You can page back through history; you can't page into the future.
 */
export function AttendanceManager() {
  const [month, setMonth] = useState<string>(currentMonthKey());
  const isCurrentMonth = month === currentMonthKey();

  const { data: attendance, isLoading, isError } = useMyAttendanceMonth(month);
  const { data: payroll } = useMyPayroll(month);

  return (
    <>
      <PageHeader
        title={isCurrentMonth ? "My Attendance" : "Past Attendance"}
        subtitle="Your month-by-month attendance record."
      >
        <div className={cn("flex items-center ml-auto", gaps.sm)}>
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            iconBefore={<ChevronLeftIcon size="sm" />}
            tooltip={{ text: "Previous month", position: "bottom" }}
          />
          <span className="min-w-36 text-center text-sm font-semibold text-base-content">
            {monthLabel(month)}
          </span>
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            disabled={isCurrentMonth}
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            iconBefore={<ChevronRightIcon size="sm" />}
            tooltip={{ text: "Next month", position: "bottom" }}
          />
        </div>
      </PageHeader>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
        {isLoading ? (
          <OverlayLoading />
        ) : isError || !attendance ? (
          <EmptyState
            variant="info"
            title="Couldn't load attendance"
            subtitle="Try again in a moment. If this persists, contact your supervisor."
          />
        ) : (
          <>
            <MyAttendanceCalendar response={attendance} />
            {payroll && <PayrollSummaryCard payroll={payroll} />}
          </>
        )}
      </div>
    </>
  );
}
