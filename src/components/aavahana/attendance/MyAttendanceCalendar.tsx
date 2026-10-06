"use client";

import type {
  AttendanceMonthResponse,
  AttendanceRecordPublic,
  AttendanceResolvedBy,
  AttendanceStatus,
  AttendanceSubStatus,
} from "@/types/aavahana/attendance.types";
import { cn } from "@/utils";
import { todayISO } from "@/utils/shared/date.utils";

interface MyAttendanceCalendarProps {
  response: AttendanceMonthResponse;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: "bg-success",
  on_leave: "bg-info",
  absent: "bg-error",
  weekend: "bg-base-300",
  mandatory_holiday: "bg-accent",
  optional_holiday: "bg-accent/50",
};

/**
 * A day off has to be legible at a glance, not inferred from a 8px dot — the
 * whole point of opening this screen is to see which days were leave and which
 * were holidays. Non-working days get a tinted cell and a short caption; plain
 * working days stay quiet so the exceptions carry the eye.
 */
const STATUS_CELL: Partial<Record<AttendanceStatus, string>> = {
  on_leave: "bg-info/10 border-info/40",
  absent: "bg-error/10 border-error/40",
  mandatory_holiday: "bg-accent/10 border-accent/40",
  optional_holiday: "bg-accent/5 border-accent/25",
  weekend: "bg-base-200/60 border-base-200",
};

/** Caption printed inside the cell. Kept to a few characters to fit the grid. */
const STATUS_CAPTION: Partial<Record<AttendanceStatus, string>> = {
  on_leave: "Leave",
  absent: "Absent",
  mandatory_holiday: "Holiday",
  optional_holiday: "Optional",
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  on_leave: "On leave",
  absent: "Absent",
  weekend: "Weekend",
  mandatory_holiday: "Holiday",
  optional_holiday: "Optional holiday",
};

const SUB_STATUS_LABEL: Record<NonNullable<AttendanceSubStatus>, string> = {
  paid_leave: "Paid leave",
  unpaid_leave: "Unpaid leave",
  // Legacy rows only — pending leaves now count as regular leave days.
  unapproved_leave: "Pending approval",
};

const RESOLVED_BY_LABEL: Record<AttendanceResolvedBy, string> = {
  system: "Marked by system",
  daily_report: "From your daily report",
  approved_leave: "Approved leave",
  pending_leave: "Leave pending approval",
  retroactive: "Retroactively updated",
};

/** Build a Mon-first month grid of YYYY-MM-DD strings (or null for padding). */
function buildMonthGrid(month: string): (string | null)[] {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const firstOfMonth = new Date(Date.UTC(year, monthIdx, 1));
  const lastOfMonth = new Date(Date.UTC(year, monthIdx + 1, 0));
  const daysInMonth = lastOfMonth.getUTCDate();

  // JS getUTCDay: Sun=0..Sat=6. Convert to Mon=0..Sun=6.
  const firstWeekdayMonFirst = (firstOfMonth.getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekdayMonFirst; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Compose a human tooltip from one day's record. */
function formatTooltip(record: AttendanceRecordPublic): string {
  const parts: string[] = [STATUS_LABEL[record.status] ?? record.status];
  if (record.subStatus) parts.push(SUB_STATUS_LABEL[record.subStatus]);
  parts.push(RESOLVED_BY_LABEL[record.resolvedBy] ?? record.resolvedBy);
  return parts.join(" · ");
}

/**
 * Today, on the reader's own calendar, keyed the way `recordByDate` is keyed.
 *
 * This used to be `new Date().toISOString().slice(0, 10)`, which is the UTC date. Between
 * midnight and 05:30 IST that is yesterday, so the calendar highlighted the wrong cell for
 * anyone opening it late at night.
 */
function todayCalendarKey(): string {
  return todayISO();
}

/**
 * Reason an empty cell is empty — drives the placeholder copy so users
 * can tell "no record yet" apart from "we never tracked this day."
 */
type EmptyReason = "future" | "today" | "untracked";

function emptyReasonFor(dateStr: string, todayKey: string): EmptyReason {
  if (dateStr === todayKey) return "today";
  if (dateStr > todayKey) return "future";
  return "untracked";
}

const EMPTY_TOOLTIP: Record<EmptyReason, string> = {
  today: "Not finalized yet — you'll be marked present tonight unless a leave or holiday applies.",
  future: "Hasn't happened yet.",
  untracked: "No attendance record for this day.",
};

export function MyAttendanceCalendar({ response }: MyAttendanceCalendarProps) {
  const { month, summary, records } = response;

  const recordByDate = new Map<string, AttendanceRecordPublic>();
  for (const r of records) recordByDate.set(r.date, r);

  const cells = buildMonthGrid(month);
  const todayKey = todayCalendarKey();

  return (
    <section className="flex flex-col gap-6">
      {/* Summary strip */}
      <p className="text-sm text-base-content/60">
        <span className="text-success font-medium">{summary.present} present</span>
        {" · "}
        <span className="text-info font-medium">
          {summary.onLeave} on leave
          {summary.onLeave > 0
            ? ` (${summary.paidLeave} paid · ${summary.unpaidLeave} unpaid)`
            : ""}
        </span>
        {" · "}
        <span className="text-error font-medium">{summary.absent} absent</span>
        {" · "}
        <span>
          {summary.mandatoryHolidays + summary.optionalHolidays} holidays
        </span>
        {" · "}
        <span>{summary.workingDays} working days</span>
      </p>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-base-200 p-4 sm:p-5">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_LABELS.map((w) => (
            <div
              key={w}
              className="text-center text-xs font-medium uppercase tracking-wide text-base-content/40"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`pad-${idx}`} className="aspect-square" />;
            }
            const dayNum = Number(dateStr.slice(8, 10));
            const record = recordByDate.get(dateStr);
            const isToday = dateStr === todayKey;
            const emptyReason = record ? null : emptyReasonFor(dateStr, todayKey);
            const tooltip = record
              ? formatTooltip(record)
              : emptyReason
                ? EMPTY_TOOLTIP[emptyReason]
                : undefined;
            const dotClass = record ? STATUS_DOT[record.status] : "bg-transparent";
            const caption = record ? STATUS_CAPTION[record.status] : undefined;
            return (
              <div
                key={dateStr}
                className="aspect-square tooltip"
                data-tip={tooltip}
              >
                <div
                  className={cn(
                    "h-full w-full rounded-lg border flex flex-col items-center justify-center gap-1 p-1 transition-colors",
                    record ? STATUS_CELL[record.status] ?? "" : "",
                    isToday
                      ? "border-primary border-2"
                      : record && STATUS_CELL[record.status]
                        ? ""
                        : "border-base-200",
                    record
                      ? "hover:brightness-95"
                      : emptyReason === "today"
                        ? "bg-base-100"
                        : "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm leading-none",
                      isToday
                        ? "text-primary font-semibold"
                        : "text-base-content/70",
                    )}
                  >
                    {dayNum}
                  </span>
                  {record ? (
                    caption ? (
                      <span className="text-[10px] font-medium leading-none text-base-content/60">
                        {caption}
                      </span>
                    ) : (
                      <span
                        className={cn("h-2 w-2 rounded-full", dotClass)}
                        aria-hidden
                      />
                    )
                  ) : (
                    <span
                      className="text-[10px] text-base-content/30 leading-none"
                      aria-hidden
                    >
                      {emptyReason === "untracked" ? "—" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-base-content/50">
        {(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])}
              aria-hidden
            />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Footnote — only show when there's at least one absent day */}
      {summary.absent > 0 && (
        <p className="text-xs italic text-base-content/40">
          See an absent day that&apos;s wrong? Contact your supervisor — we&apos;ll
          get it corrected.
        </p>
      )}
    </section>
  );
}
