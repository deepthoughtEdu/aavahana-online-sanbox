// src/utils/date.utils.ts
//
// UTC CONTRACT (law):
//   - Backend emits UTC ISO 8601 strings (e.g. "2026-03-23T14:30:00.000Z")
//   - moment() parses them correctly as UTC and displays in browser-local timezone
//   - NEVER use: new Date().toISOString().split('T')[0]  → gives UTC date, not local
//   - NEVER use: .toLocaleDateString()                   → bypasses format contract
//   - ALWAYS use: todayISO() for today's date string; formatDate() for display
//
import { DATE_FORMATS } from "@/config/constants";
import moment, { MomentInput, unitOfTime } from "moment";

interface MonthOption {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

/**
 * 📅 Universal date formatter
 */
export function formatDate(
  date: MomentInput,
  format: keyof typeof DATE_FORMATS | string = "displayDate"
): string {
  const fmt = DATE_FORMATS[format as keyof typeof DATE_FORMATS] || format;
  return moment(date).format(fmt);
}

/**
 * Today's date as "YYYY-MM-DD" in the browser's local timezone.
 * Use this everywhere instead of new Date().toISOString().split('T')[0]
 * which gives the UTC date and is wrong at night in UTC+ timezones.
 */
export function todayISO(): string {
  return moment().format("YYYY-MM-DD");
}

/**
 * ⏳ Compare two dates by day
 */
export function isSameDate(d1: MomentInput, d2: MomentInput): boolean {
  return moment(d1).isSame(d2, "day");
}

/**
 * 🧩 Parse "YYYY-MM-DD HH:mm" → Date
 */
export function parseDateTime(str: string): Date {
  return moment(str, [
    DATE_FORMATS.dateTime,
    DATE_FORMATS.date,
    moment.ISO_8601,
  ]).toDate();
}

/**
 * ⌛ "3 hours ago" style relative time
 */
export function fromNow(date: MomentInput): string {
  return moment(date).fromNow();
}

/**
 * ➕ Add/subtract time easily
 */
export function addTime(
  date: MomentInput,
  amount: number,
  unit: moment.unitOfTime.DurationConstructor
): Date {
  return moment(date).add(amount, unit).toDate();
}

export type StartOf = unitOfTime.StartOf;

export type FormatType =
  | "date" // Full Date object
  | "number" // Day/hour/minute number
  | "name" // Day/month name
  | "iso" // ISO string
  | "timestamp" // Unix timestamp
  | "format"; // Custom format string

export type StartOfReturn<T extends FormatType> = T extends "date"
  ? Date
  : T extends "number"
  ? number
  : T extends "name"
  ? string
  : T extends "iso"
  ? string
  : T extends "timestamp"
  ? number
  : T extends "format"
  ? string
  : Date;

/**
 * 🔧 Internal helper to format moment based on type
 */
function formatMoment<T extends FormatType>(
  m: moment.Moment,
  type: StartOf,
  format?: T,
  customFormat?: string
): StartOfReturn<T> {
  if (!format || format === "date") {
    return m.toDate() as StartOfReturn<T>;
  }

  switch (format) {
    case "number":
      // Return appropriate number based on type
      if (type === "day" || type === "date")
        return m.date() as StartOfReturn<T>;
      if (type === "month") return (m.month() + 1) as StartOfReturn<T>; // 1-based
      if (type === "year") return m.year() as StartOfReturn<T>;
      if (type === "hour") return m.hour() as StartOfReturn<T>;
      if (type === "minute") return m.minute() as StartOfReturn<T>;
      if (type === "second") return m.second() as StartOfReturn<T>;
      if (type === "week") return m.week() as StartOfReturn<T>;
      return m.date() as StartOfReturn<T>;

    case "name":
      // Return appropriate name based on type
      if (type === "day" || type === "date" || type === "week") {
        return m.format("dddd") as StartOfReturn<T>; // "Monday"
      }
      if (type === "month") {
        return m.format("MMMM") as StartOfReturn<T>; // "January"
      }
      return m.format("dddd") as StartOfReturn<T>;

    case "iso":
      return m.toISOString() as StartOfReturn<T>;

    case "timestamp":
      return m.valueOf() as StartOfReturn<T>;

    case "format":
      return m.format(customFormat || "YYYY-MM-DD") as StartOfReturn<T>;

    default:
      return m.toDate() as StartOfReturn<T>;
  }
}

/**
 * 🌅 Get start of time unit with flexible output
 * @param date - Date input
 * @param type - Time unit ('year', 'month', 'week', 'day', 'hour', etc.)
 * @param format - Output format ('date', 'number', 'name', 'iso', 'timestamp')
 * @param customFormat - Optional custom format string (for 'format' type)
 * @example
 * startOf(new Date(), 'day')              // Date object
 * startOf(new Date(), 'day', 'number')    // 15 (day of month)
 * startOf(new Date(), 'day', 'name')      // "Monday"
 * startOf(new Date(), 'month', 'name')    // "January"
 * startOf(new Date(), 'day', 'iso')       // "2024-01-15T00:00:00.000Z"
 * startOf(new Date(), 'day', 'timestamp') // 1705276800000
 * startOf(new Date(), 'day', 'format', 'YYYY-MM-DD') // "2024-01-15"
 */
export function startOf<T extends FormatType = "date">(
  date: MomentInput,
  type: StartOf,
  format?: T,
  customFormat?: string
): StartOfReturn<T> {
  const m = moment(date).startOf(type);
  return formatMoment(m, type, format, customFormat);
}

/**
 * 🌆 Get end of time unit with flexible output
 * @param date - Date input
 * @param type - Time unit ('year', 'month', 'week', 'day', 'hour', etc.)
 * @param format - Output format ('date', 'number', 'name', 'iso', 'timestamp')
 * @param customFormat - Optional custom format string (for 'format' type)
 * @example
 * endOf(new Date(), 'day')              // Date object at 23:59:59.999
 * endOf(new Date(), 'day', 'number')    // 15 (day of month)
 * endOf(new Date(), 'day', 'name')      // "Monday"
 * endOf(new Date(), 'month', 'number')  // 31 (last day)
 * endOf(new Date(), 'day', 'iso')       // "2024-01-15T23:59:59.999Z"
 */
export function endOf<T extends FormatType = "date">(
  date: MomentInput,
  type: StartOf,
  format?: T,
  customFormat?: string
): StartOfReturn<T> {
  const m = moment(date).endOf(type);
  return formatMoment(m, type, format, customFormat);
}

/* -------------------------------------------------------------------------- */
/* 🕰️ Convenience Helpers (built on formatDate)                               */
/* -------------------------------------------------------------------------- */

/**
 * Apply "HH:mm" to a given date (returns new Date)
 */
export function applyTimeToDate(date: MomentInput, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return moment(date)
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
    .toDate();
}

/**
 * Generate last N months with proper date formatting
 */
export const getLastNMonths = (months: number): MonthOption[] => {
  const options: MonthOption[] = [];

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    // Use date utils to get month boundaries
    const monthStart = startOf(date, "month", "format", "YYYY-MM-DD");
    const monthEnd = endOf(date, "month", "format", "YYYY-MM-DD");
    const monthLabel = formatDate(date, "MMMM YYYY");

    options.push({
      label: monthLabel,
      value: `${monthStart}|${monthEnd}`,
      startDate: monthStart,
      endDate: monthEnd,
    });
  }

  return options;
};

/**
 * 🌅 Check if time is morning (6:00 AM - 11:59 AM)
 */
export function isMorning(date: MomentInput = new Date()): boolean {
  const hour = moment(date).hour();
  return hour >= 6 && hour < 12;
}

/**
 * ☀️ Check if time is afternoon (12:00 PM - 4:59 PM)
 */
export function isAfternoon(date: MomentInput = new Date()): boolean {
  const hour = moment(date).hour();
  return hour >= 12 && hour < 17;
}

/**
 * 🌆 Check if time is evening (5:00 PM - 8:59 PM)
 */
export function isEvening(date: MomentInput = new Date()): boolean {
  const hour = moment(date).hour();
  return hour >= 17 && hour < 21;
}

/**
 * 🌙 Check if time is night (9:00 PM - 5:59 AM)
 */
export function isNight(date: MomentInput = new Date()): boolean {
  const hour = moment(date).hour();
  return hour >= 21 || hour < 6;
}

/**
 * 🏷️ Get time of day label
 * @param date - Date input (defaults to current time)
 * @returns "Morning" | "Afternoon" | "Evening" | "Night"
 * @example
 * getTimeOfDayLabel()                      // "Morning" (if current time is 8 AM)
 * getTimeOfDayLabel('2024-01-15 14:30')    // "Afternoon"
 * getTimeOfDayLabel(new Date())            // Current time label
 */
export function getTimeOfDayLabel(date: MomentInput = new Date()): string {
  if (isMorning(date)) return "Morning";
  if (isAfternoon(date)) return "Afternoon";
  if (isEvening(date)) return "Evening";
  return "Night";
}

/**
 * Always returns Monday (ISO week)
 */
export function getIsoWeekStart(
  date: Date | string,
  format: string = "YYYY-MM-DD"
): string {
  return moment(date).startOf("isoWeek").format(format);
}

/**
 * ISO week id, e.g. "2026-W24" — matches the backend's weekId format
 * (WEEK_ID_REGEX `^\d{4}-W\d{2}$`). Used as the period for weekly sup scores.
 */
export function getIsoWeekId(date: Date | string): string {
  return moment(date).format("GGGG-[W]WW");
}

/**
 * Returns end of ISO week (Sunday)
 */
export function getIsoWeekEnd(
  weekStart: string,
  format: string = "YYYY-MM-DD"
): string {
  return moment(weekStart).add(6, "day").format(format);
}

/**
 * Difference in weeks from current ISO week
 */
export function getIsoWeekDiff(date: Date): number {
  const currentMonday = moment().startOf("isoWeek");
  const targetMonday = moment(date).startOf("isoWeek");
  return currentMonday.diff(targetMonday, "weeks");
}

/**
 * Week label helper
 */
export function getIsoWeekLabel(date: Date): string {
  const diff = getIsoWeekDiff(date);
  if (diff === 0) return "This Week";
  if (diff > 0) return `W-${diff}`;
  return `W+${Math.abs(diff)}`;
}

/**
 * Format date range to human-readable format
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Formatted string like "4–11 Jan, 2026" or "31 Mar – 4 Apr, 2026"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = moment(startDate);
  const end = moment(endDate);
  
  // Check if same day
  if (start.isSame(end, 'day')) {
    return start.format('D MMM, YYYY');
  }
  
  // Check if same month and year
  if (start.isSame(end, 'month') && start.isSame(end, 'year')) {
    return `${start.format('D')}–${end.format('D MMM, YYYY')}`;
  }
  
  // Check if same year but different month
  if (start.isSame(end, 'year')) {
    return `${start.format('D MMM')} – ${end.format('D MMM, YYYY')}`;
  }
  
  // Different years
  return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`;
}

/**
 * Format date range with "Week of" prefix for weekly reports
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Formatted string like "Week of 4–11 Jan, 2026"
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  return `Week of ${formatDateRange(startDate, endDate)}`;
}

// ─── Instants: a moment on a clock, always labelled with whose clock ─────────
//
// ⚠️ A BARE TIME IS AMBIGUOUS THE MOMENT TWO PEOPLE IN TWO COUNTRIES READ THE SAME SCREEN,
// and this product already has that. Tarun locked the rule on 2026-08-29: every rendered time
// carries its zone — "17:32 IST", "7:02 AM EDT" — and the zone is DERIVED from the viewer's
// browser, never typed as a literal.
//
// ⚠️ NEVER PASS A `timeZone` TO THESE. The browser default IS the viewer's location. Passing
// one is how three screens in this repo ended up showing UTC to everybody, including the
// Indian users it was presumably meant to help. Pass one only when the content genuinely
// belongs somewhere else, and then say so in a comment.
//
// ⚠️ A DATE-ONLY VALUE IS NOT AN INSTANT. A leave date, a policy date, a quota period is a
// calendar day; putting it through a Date and a timezone shifts it. Keep those as strings and
// render them as strings — `formatDate` is for those. These functions are for real moments:
// when a call happened, when a message was sent, when a recording was made.
//
// ⚠️ SSR RENDERS IN THE SERVER'S ZONE. Next.js renders on the droplet, which runs UTC, then
// hydrates in the browser, which does not. The two disagree and React logs a hydration
// mismatch. Use the `<Instant>` component (components/shared/Instant.tsx) inside anything that
// server-renders; it marks the node so React accepts the correction instead of warning.

/** The IANA zone the viewer's browser reports, e.g. "Asia/Kolkata". Empty if unavailable. */
export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

/**
 * The zone label, and the reason this is not a one-liner.
 *
 * ⚠️ NO SINGLE LOCALE PRODUCES BOTH "IST" AND "EDT". Measured in Chrome on 2026-08-29 against
 * the same instant:
 *
 *   locale   Asia/Kolkata    America/New_York
 *   en-IN    IST             GMT-4
 *   en-US    GMT+5:30        EDT
 *   en-GB    GMT+5:30        GMT-4
 *
 * A zone gets a short abbreviation only when the READER's locale has one for it, and CLDR gives
 * each locale abbreviations mostly for its own region. That is usually fine, because this prints
 * the VIEWER's own zone in the VIEWER's own locale, and your own zone in your own locale nearly
 * always has one. It breaks for the Indian user whose browser is set to en-GB — which is this
 * office — who would read "16:59 GMT+5:30".
 *
 * That is unambiguous but it is not what was asked for, and an offset reads like a machine
 * talking. So: take `short`, and if it comes back a bare GMT offset, ask again for the generic
 * name and get "India Time". Never blank, never a bare hour, never a literal we typed.
 */
const BARE_OFFSET = /^(?:GMT|UTC)[+-]?\d*(?::\d+)?$/i;

function withZoneLabel(d: Date, base: Intl.DateTimeFormatOptions): string {
  const short = d.toLocaleString([], { ...base, timeZoneName: "short" });
  const label = short.split(" ").pop() ?? "";
  if (!BARE_OFFSET.test(label)) return short;
  return d.toLocaleString([], { ...base, timeZoneName: "shortGeneric" });
}

function toDate(value: MomentInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A moment with its date, its time and its zone, in the viewer's own clock.
 * "25 Aug, 17:32 IST" for a reader in India; "25 Aug, 08:02 EDT" for one in New York.
 *
 * `fallback` is what an absent or unparseable value renders as — an em dash by default,
 * because a blank cell in a table reads as a bug.
 */
export function formatInstant(value: MomentInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return withZoneLabel(d, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Just the time and its zone: "17:32 IST". For a column where the day is already the row. */
export function formatInstantShort(value: MomentInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return withZoneLabel(d, { hour: "2-digit", minute: "2-digit" });
}

/** With the year, for anything that can be more than a few months old. */
export function formatInstantLong(value: MomentInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return withZoneLabel(d, {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Now, formatted for an `<input type="datetime-local">`.
 *
 * ⚠️ THAT INPUT READS A LOCAL WALL CLOCK, NOT UTC. `new Date().toISOString().slice(0, 16)`
 * is the obvious-looking thing to write and it is wrong by the viewer's whole offset: used as a
 * `min`, it sits 5h30 in the past in India and lets someone pick a moment that has already gone.
 *
 * The value it produces is deliberately zone-less, because that is what the element expects.
 * `new Date(value)` parses it back in the viewer's zone, which is what makes the round trip
 * correct.
 */
export function nowForDateTimeLocal(at: MomentInput = new Date()): string {
  return moment(at).format("YYYY-MM-DDTHH:mm");
}

/**
 * The name of a calendar month, from a 'YYYY-MM' key. "August 2026", or "Aug" when short.
 *
 * ⚠️ A MONTH IS NOT AN INSTANT, AND THIS IS THE TRAP IN THIS FILE. The key already names the
 * month; the Date below exists only to turn 8 into "August" in the reader's language. There is
 * no moment to locate, so there is no zone to print — `formatInstant` would attach a time that
 * means nothing.
 *
 * ⚠️ THE `timeZone: "UTC"` PIN IS LOAD-BEARING. The date is built at UTC midnight on the 1st,
 * so rendering it in the viewer's zone would show a New York reader the PREVIOUS month:
 * 2026-08 would read as July. Three screens in Aavahana carried that pin with no explanation,
 * it looked like exactly the bug this whole timezone effort was removing, and it was
 * recommended for deletion twice before someone read it. It stays, and it lives here once
 * instead of in five copies.
 */
export function formatMonthLabel(
  monthKey: string,
  opts?: { short?: boolean; yearless?: boolean }
): string {
  const [y, m] = String(monthKey).split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return String(monthKey);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString([], {
    month: opts?.short ? "short" : "long",
    ...(opts?.yearless ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}
