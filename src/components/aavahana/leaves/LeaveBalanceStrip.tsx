"use client";

import { useMyLeaveBalance } from "@/lib/hooks/aavahana/use-leaves";
import { cn } from "@/utils";
import type { LeaveBalanceResponse } from "@/types/aavahana/leave.types";
import { formatMonthLabel } from "@/utils/shared/date.utils";

// A month name from a 'YYYY-MM' key. One shared implementation; the UTC pin, and why it
// must not be removed, live in date.utils.
function monthName(monthKey: string): string {
  return formatMonthLabel(monthKey, { yearless: true });
}

/**
 * What the person can actually take, before they apply.
 *
 * Leads with THIS MONTH's allowance, because that is the unit the entitlement
 * engine spends in: one pooled paid day (or whatever the accrual rate is) per
 * calendar month, shared across every paid type, and an unspent month never
 * carries forward. Showing the year's figure as the headline promised days
 * nobody could take — "7 paid days left" when the most anyone can take this
 * month is one.
 *
 * The per-type cards stay, demoted to what they honestly are: how much of each
 * type's annual ceiling has been used so far.
 */
export function LeaveBalanceStrip() {
  const { data, isLoading } = useMyLeaveBalance();
  const resp = data as LeaveBalanceResponse | undefined;
  const balances = resp?.balances ?? [];
  const monthly = resp?.monthly ?? null;

  // No policy configured for the year — nothing honest to show, so show
  // nothing rather than a row of zeroes that reads as "you have none left".
  if (isLoading || !balances.length) return null;

  const hasMonthlyLimit = monthly && monthly.pool != null;
  const left = monthly?.remaining ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {hasMonthlyLimit && monthly ? (
        <div
          className={cn(
            "flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl border px-4 py-3",
            left > 0
              ? "border-success/30 bg-success/5"
              : "border-base-200 bg-base-100"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wide text-base-content/50">
            {monthName(monthly.month)}
          </span>
          <span
            className={cn(
              "text-xl font-semibold",
              left > 0 ? "text-success" : "text-base-content/40"
            )}
          >
            {left}
          </span>
          <span className="text-sm text-base-content/70">
            paid leave {left === 1 ? "day" : "days"} available
          </span>
          {/* Carry-forward changes what the number means, so it changes the
              sentence: a balance that accumulates vs one that expires. */}
          <span className="text-xs text-base-content/50">
            {monthly.pool} per month
            {monthly.carryForward
              ? ", unused days carry forward"
              : ", unused days don't carry over"}
            {monthly.paidUsed > 0 ? ` · ${monthly.paidUsed} used this month` : ""}.
            {left === 0
              ? monthly.carryForward
                ? " Leave taken now is unpaid until more accrues."
                : " Leave taken now is unpaid until next month."
              : ""}
            {monthly.maxPaidDaysPerRequest
              ? ` At most ${monthly.maxPaidDaysPerRequest} paid days in one stretch.`
              : ""}
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {balances.map((b) => {
          const chargedElsewhere = !!b.chargesTo && b.chargesTo !== b.type;
          const charged = chargedElsewhere
            ? balances.find((x) => x.type === b.chargesTo)
            : b;
          return (
            <div
              key={b.type}
              className="flex min-w-44 flex-1 flex-col gap-0.5 rounded-xl border border-base-200 bg-base-100 px-4 py-3"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                {b.label}
              </span>
              {b.isPaid ? (
                <>
                  <span className="text-sm text-base-content">
                    {b.paidUsed} used
                    {b.total > 0 ? ` of ${b.total} this year` : " this year"}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {chargedElsewhere && charged
                      ? `Charged to ${charged.label}`
                      : b.unpaidUsed > 0
                        ? `${b.unpaidUsed} taken unpaid`
                        : "Annual ceiling"}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm text-base-content/60">Unpaid</span>
                  <span className="text-xs text-base-content/50">
                    {b.used} taken this year
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
