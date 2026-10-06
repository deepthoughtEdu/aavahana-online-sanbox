// Shared leave-day calculation, ported from
// leaves-module-export/src/utils/leave.utils.ts::calculateLeave.
//
// In the legacy module the user selects a date *plus* a time of day. The
// fraction of a working day a partial-day leave consumes is then
//   (effective minutes in window) / (work-day length in minutes)
// where the work-day window comes from the user's profile (or, if no
// profile exists yet, a configured default — currently 11:00→21:00).
//
// Inputs match our modal's split UI: a date range (start/end calendar
// dates only) plus the leave-window times the user picked on each side.

import moment from "moment";
import type { DateRange } from "react-day-picker";
import type { LeaveCalculation } from "@/types/aavahana/leave.types";
import {
  DEFAULT_WORKING_HOURS,
  LEAVE_DATE_FORMATS,
} from "@/lib/constants/leave.constants";

export interface WorkDay {
  from: string; // "HH:mm"
  to: string;   // "HH:mm"
}

/**
 * Default work-day window used as the fraction denominator when the applicant
 * has no profile yet. Kept in sync with DEFAULT_WORKING_HOURS so the leave-
 * time pickers and the calculation always agree on what "a full day" means.
 */
export const DEFAULT_WORK_DAY: WorkDay = {
  from: DEFAULT_WORKING_HOURS.from,
  to: DEFAULT_WORKING_HOURS.to,
};

function toMinutes(hhmm: unknown): number {
  if (typeof hhmm !== "string") return 0;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;
const CLOCK = /(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?/i;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseClock(part: string, fallbackMeridiem?: string): string | null {
  const m = CLOCK.exec(part);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const meridiem = (m[3] || fallbackMeridiem || "").toLowerCase();
  if (h > 23) return null;
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  return `${pad(h)}:${pad(min)}`;
}

/**
 * Coerce whatever `/employees/me` returns for `workingHours` into a usable
 * `{ from, to }` window.
 *
 * The field has been written in two shapes by two different forms: the leave
 * profile stores `{ from: "15:00", to: "19:00" }`, while the fellow-invite and
 * employment-details screens store free text ("3pm-7pm IST"). The TypeScript
 * type claimed the object shape for both, so a fellow onboarded through the
 * invite flow hit `undefined.split(":")` here the moment they picked leave
 * dates, which took down the whole page. Anything unreadable falls back to the
 * org default rather than throwing.
 */
export function resolveWorkDay(value: unknown): WorkDay | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { from, to } = value as { from?: unknown; to?: unknown };
    if (typeof from === "string" && typeof to === "string" && HHMM.test(from) && HHMM.test(to)) {
      return { from, to };
    }
    return null;
  }

  if (typeof value === "string") {
    // Drop a trailing timezone label so it can't be read as the range end.
    const text = value.replace(/\b(ist|utc|gmt|est|pst)\b.*$/i, "").trim();
    const halves = text.split(/\s*(?:-|–|—|to)\s*/i).filter(Boolean);
    if (halves.length >= 2) {
      // "3-7pm": the meridiem is written once, on the right, and governs both.
      const trailing = /(am|pm)/i.exec(halves[1]);
      const from = parseClock(halves[0], trailing?.[1]);
      const to = parseClock(halves[1]);
      if (from && to) return { from, to };
    }
  }

  return null;
}

/**
 * The same resolution, but never null — an unreadable value becomes the org
 * default so the leave maths always has a denominator. Use this for anything
 * that computes; use `resolveWorkDay` when you need to know whether the person
 * actually has a work day on record.
 */
export function normalizeWorkDay(value: unknown): WorkDay {
  return resolveWorkDay(value) ?? DEFAULT_WORK_DAY;
}

/**
 * The org's timezone. Leave bounds are calendar days that were chosen in this
 * zone, so this is what decides which day a stored instant means. Mirrors
 * `OrgConfig.DEFAULT_TIMEZONE` on the backend.
 */
const ORG_TIMEZONE = "Asia/Kolkata";

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Which calendar day does a leave bound mean? Frontend twin of the backend's
 * `DateUtils.leaveDayKey` — the two must agree or a leave shows one day in the
 * app and another in the approval email.
 *
 * A bound is a DAY, not an instant, but it arrives over the wire as a
 * timestamp, and the column has accumulated three shapes:
 *   - "2026-07-29"                 day-only (what we now send on apply)
 *   - "2026-07-28T18:30:00.000Z"   legacy IST local midnight = 29 Jul
 *   - "2026-07-29T23:59:59.999Z"   legacy end-of-UTC-day marker = 29 Jul
 *
 * Handing any of those to bare `moment()` renders them in the BROWSER's zone,
 * so the same leave read 29 Jul on an IST laptop and 28 Jul under UTC (which is
 * also what Next.js server rendering runs as). Resolving in the org zone gives
 * the same day everywhere.
 */
export function leaveDayKey(value?: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string" && DAY_ONLY.test(value)) return value;

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  // End-of-UTC-day marker: shifting it into the org zone would push it forward
  // a day, so take its UTC date as written.
  if (
    d.getUTCHours() === 23 &&
    d.getUTCMinutes() === 59 &&
    d.getUTCSeconds() === 59
  ) {
    return d.toISOString().slice(0, 10);
  }

  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: ORG_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Display a leave bound. Use this for `startDate` / `endDate` everywhere —
 * never bare `moment(d).format(...)`, which is browser-timezone dependent.
 *
 * `appliedAt` / `decidedAt` are genuine instants and should keep using plain
 * moment / `fromNow()`; only the leave range is a calendar day.
 */
export function formatLeaveDate(
  value?: string | Date | null,
  format: string = LEAVE_DATE_FORMATS.date,
): string {
  const key = leaveDayKey(value);
  return key ? moment(key, "YYYY-MM-DD").format(format) : "—";
}

/**
 * How much leave a row actually consumes, as a decimal.
 *
 * Never read the `days` column for this. It is an `Int`, and the backend fills
 * it with `parseInt(days) || parseInt(finalLeaves) || 1` — `parseInt(0.42)` is
 * 0, which is falsy, so a 2-hour leave lands on a stored `1`. That is why short
 * leaves showed as a whole day in the tables while the modal showed the real
 * fraction. `calculated.finalLeaves` is the true figure and is what the balance
 * ledger deducts, so it is the one number worth showing.
 *
 * Rendered to at most 2dp with trailing zeros trimmed: 0.21, 1, 1.2.
 */
export function formatLeaveDays(leave?: {
  days?: number | null;
  calculated?: LeaveCalculation | null;
} | null): string {
  const exact = Number(leave?.calculated?.finalLeaves);
  const value =
    Number.isFinite(exact) && exact > 0 ? exact : Number(leave?.days);
  if (!Number.isFinite(value)) return "—";
  return String(parseFloat(value.toFixed(2)));
}

/** Inclusive calendar-day span between two leave bounds, org-zone resolved. */
export function leaveDaySpan(
  start?: string | Date | null,
  end?: string | Date | null,
): number | undefined {
  const s = leaveDayKey(start);
  const e = leaveDayKey(end);
  if (!s || !e) return undefined;
  return moment(e, "YYYY-MM-DD").diff(moment(s, "YYYY-MM-DD"), "days") + 1;
}

/**
 * Serialize a day the applicant picked in the calendar for the leave API.
 *
 * A leave bound is a CALENDAR DAY, not an instant, so it must go to the backend
 * as "YYYY-MM-DD". `react-day-picker` hands back a local-midnight `Date`, and
 * `.toISOString()` on that shifts it into the previous UTC day for any UTC+
 * timezone (29 Jul 00:00 IST → "2026-07-28T18:30:00.000Z"). The row then read
 * back as the 28th anywhere it was resolved in UTC — the approval email being
 * the surface where reviewers actually saw the wrong day.
 *
 * The backend's `helpers.toDateTime` promotes a bare "YYYY-MM-DD" to UTC
 * midnight, so sending the day itself keeps the stored bound unambiguous.
 */
export function toLeaveDayParam(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  const m = moment(date);
  return m.isValid() ? m.format("YYYY-MM-DD") : undefined;
}

export interface BuildCalculationInput {
  range: DateRange | undefined;
  /** time of day on the FIRST day when leave starts, "HH:mm" */
  leaveFromTime: string;
  /** time of day on the LAST day when leave ends, "HH:mm" */
  leaveToTime: string;
  /**
   * Work-day window used as the fraction denominator. Typed loosely because
   * the API has emitted both `{ from, to }` and free text ("3pm-7pm IST") for
   * this field — normalizeWorkDay resolves either, or falls back to the org
   * default.
   */
  workDay?: WorkDay | string | null;
  /**
   * Set of org-wide holidays as "YYYY-MM-DD" strings. Any day inside the range
   * that matches a holiday is skipped — it contributes to `holidays` but not to
   * `workingDays` / `finalLeaves`. Keep this in sync with the backend so the
   * applicant's preview matches what `LeaveService.apply` will compute.
   */
  holidayDates?: Set<string>;
}

/**
 * Compute the fractional leave count for a date range + leave-window times.
 * Returns null until the user has both a valid range and times.
 */
export function buildCalculation({
  range,
  leaveFromTime,
  leaveToTime,
  workDay,
  holidayDates,
}: BuildCalculationInput): LeaveCalculation | null {
  if (!range?.from) return null;

  // Never trust the caller's shape here — see normalizeWorkDay.
  const day = normalizeWorkDay(workDay);

  const start = moment(range.from).startOf("day");
  const end = moment(range.to ?? range.from).startOf("day");
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return null;

  const workStart = toMinutes(day.from);
  const workEnd = toMinutes(day.to);
  const workWindow = workEnd - workStart;
  if (workWindow <= 0) return null;

  const leaveStartMin = toMinutes(leaveFromTime);
  const leaveEndMin = toMinutes(leaveToTime);

  const calendarDays = end.diff(start, "days") + 1;
  let workingDays = 0;
  let sundays = 0;
  let holidays = 0;
  let fractionalLeaves = 0;

  for (let i = 0; i < calendarDays; i++) {
    const d = start.clone().add(i, "day");
    const isSunday = d.day() === 0;
    const dayKey = d.format("YYYY-MM-DD");
    const isHoliday = holidayDates?.has(dayKey) ?? false;

    if (isSunday) {
      sundays += 1;
      continue;
    }
    if (isHoliday) {
      // Holidays are paid days off — they don't consume a leave but we still
      // surface the count in the breakdown so the applicant can see why their
      // total dropped.
      holidays += 1;
      continue;
    }

    workingDays += 1;
    const isFirstDay = i === 0;
    const isLastDay = i === calendarDays - 1;

    if (calendarDays === 1) {
      // Single-day partial: clip both ends to work window.
      const effStart = Math.max(leaveStartMin, workStart);
      const effEnd = Math.min(leaveEndMin, workEnd);
      fractionalLeaves += Math.min(1, Math.max(0, (effEnd - effStart) / workWindow));
    } else if (isFirstDay) {
      // From leave-start time → end of work day.
      const effStart = Math.max(leaveStartMin, workStart);
      fractionalLeaves += Math.min(1, Math.max(0, (workEnd - effStart) / workWindow));
    } else if (isLastDay) {
      // Start of work day → leave-end time.
      const effEnd = Math.min(leaveEndMin, workEnd);
      fractionalLeaves += Math.min(1, Math.max(0, (effEnd - workStart) / workWindow));
    } else {
      fractionalLeaves += 1;
    }
  }

  const finalLeaves = Math.max(0, parseFloat(fractionalLeaves.toFixed(2)));

  const startInstant = start.clone()
    .hour(Math.floor(leaveStartMin / 60))
    .minute(leaveStartMin % 60);
  const endInstant = end.clone()
    .hour(Math.floor(leaveEndMin / 60))
    .minute(leaveEndMin % 60);

  return {
    type: "day",
    duration: finalLeaves,
    finalLeaves,
    startRaw: startInstant.valueOf(),
    endRaw: endInstant.valueOf(),
    workingDays,
    sundays,
    holidays,
    calendarDays,
  };
}
