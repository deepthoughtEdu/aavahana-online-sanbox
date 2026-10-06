"use client";

import Link from "next/link";
import { useEmployeeMe } from "@/lib/hooks/aavahana/use-profile";
import { resolveWorkDay } from "@/utils/aavahana/leave.utils";
import type { EmployeeMeResponse } from "@/lib/services/shared/employee.service";

/**
 * Tell someone their profile is incomplete, before they try to apply.
 *
 * Nothing in the system asked anyone to do this. There was no prompt, no
 * notification, and the profile-review flow has never been used once. People
 * found out their profile was empty by hitting a crash on the Apply Leave
 * screen — one fellow worked it out unprompted and fixed it himself; six others
 * still have not.
 *
 * The crash is fixed, but an unset work day still means the leave maths falls
 * back to an org default that is not this person's day, so a half-day comes out
 * wrong. Hence: name the missing fields, link straight to them, and say what it
 * costs to leave them blank.
 */

interface MissingField {
  key: string;
  label: string;
}

/** Which fields the leave calculation actually needs from this person. */
function missingFields(me: EmployeeMeResponse | undefined): MissingField[] {
  if (!me) return [];
  const missing: MissingField[] = [];

  // resolveWorkDay returns null when it cannot read a real window out of the
  // stored value — which is the question here. Free text the parser understands
  // ("3pm-7pm IST") is NOT missing: the hours are known and the maths is right.
  // Only an absent or unreadable value counts.
  if (!resolveWorkDay(me.workingHours)) {
    missing.push({ key: "workingHours", label: "your working hours" });
  }
  if (!me.workingDays || me.workingDays.from == null || me.workingDays.to == null) {
    missing.push({ key: "workingDays", label: "your working days" });
  }
  if (!me.commitedHours) {
    missing.push({ key: "commitedHours", label: "your committed hours a week" });
  }
  return missing;
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function ProfileCompletionPrompt() {
  const { data, isLoading } = useEmployeeMe();
  const me = data as EmployeeMeResponse | undefined;
  const missing = missingFields(me);

  if (isLoading || !me || missing.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-base-content">
            Your profile is missing {joinWithAnd(missing.map((m) => m.label))}
          </p>
          <p className="text-xs text-base-content/70 mt-0.5">
            Leave is counted against your work day. Until this is filled in we use
            the org default, so a half day may not come out as half of{" "}
            <em>your</em> day.
          </p>
        </div>
        <Link
          href="/aavahana/leaves/profile"
          className="btn btn-sm btn-warning shrink-0"
        >
          Complete profile
        </Link>
      </div>
    </div>
  );
}
