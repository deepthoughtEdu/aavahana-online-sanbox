"use client";

import { useMemo } from "react";
import moment from "moment";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

interface LeaveCalendarProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  readOnly?: boolean;
  minDate?: Date;
  /**
   * Latest selectable day. Used by the review modal to pin the approver inside
   * the window the applicant asked for — an approver may shorten a request but
   * never extend it, so days after the requested end are not offered at all.
   */
  maxDate?: Date;
  /**
   * Org-wide holiday dates as "YYYY-MM-DD" strings. When provided, matching
   * days are visually marked with the `holiday` modifier (see calendar.css) so
   * the applicant sees they won't be charged for that day.
   */
  holidayDates?: Set<string>;
}

/**
 * Thin wrapper around react-day-picker (mode=range) so the leaves UI uses the
 * same calendar primitive as the rest of the app.
 */
export function LeaveCalendar({
  value,
  onChange,
  readOnly = false,
  minDate,
  maxDate,
  holidayDates,
}: LeaveCalendarProps) {
  // Disable rules — composed so multiple conditions stack:
  //  • readOnly → every day blocked
  //  • Sundays → off (calc treats them as non-working)
  //  • Org holidays → off (calc treats them as non-working)
  //  • Days before minDate / after maxDate
  //
  // Bounds are compared on the calendar DAY, not the instant: minDate/maxDate
  // arrive as midnight, so a raw `date > maxDate` would rule out the boundary
  // day itself the moment either side carried a time component.
  const isSunday = (date: Date) => date.getDay() === 0;
  const isHoliday = (date: Date) =>
    !!holidayDates && holidayDates.has(moment(date).format("YYYY-MM-DD"));
  const disabled = readOnly
    ? () => true
    : (date: Date) =>
        isSunday(date) ||
        isHoliday(date) ||
        (minDate ? moment(date).isBefore(moment(minDate), "day") : false) ||
        (maxDate ? moment(date).isAfter(moment(maxDate), "day") : false);

  // Modifiers paint the icon + tint via calendar.css.
  const modifiers = useMemo(() => {
    const m: Record<string, (date: Date) => boolean> = {
      sunday: isSunday,
    };
    if (holidayDates && holidayDates.size > 0) {
      m.holiday = isHoliday;
    }
    return m;
    // isSunday / isHoliday are stable per-render; only the Set identity matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holidayDates]);

  return (
    <DayPicker
      mode="range"
      selected={value}
      onSelect={onChange}
      disabled={disabled}
      numberOfMonths={1}
      showOutsideDays
      captionLayout="dropdown"
      className="rdp-leaves px-4 py-3"
      modifiers={modifiers}
      modifiersClassNames={{
        holiday: "rdp-day_holiday",
        sunday: "rdp-day_sunday",
      }}
    />
  );
}
