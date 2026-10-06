"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/shared/Button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/shared/icons";
import { cn, formatDate, borderRadius, transitions, gaps } from "@/utils";

interface DayNavigatorProps {
  /** Currently viewed date in YYYY-MM-DD. */
  currentDate: string;
  /** Today in YYYY-MM-DD — caps forward navigation and the calendar. */
  todayISO: string;
  onPrev: () => void;
  onNext: () => void;
  onJump: (isoDate: string) => void;
  /** Optional ids so existing product tours can keep targeting the buttons. */
  prevId?: string;
  nextId?: string;
}

/**
 * Prev / calendar / next day navigator. Mirrors the legacy daily-report header
 * controls so the daily plan and daily report screens share one consistent way
 * to step back through previous days. Forward navigation is capped at today.
 */
export function DayNavigator({
  currentDate,
  todayISO,
  onPrev,
  onNext,
  onJump,
  prevId,
  nextId,
}: DayNavigatorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const isToday = currentDate === todayISO;
  const isNextDisabled = currentDate >= todayISO;
  const shortDate = formatDate(currentDate, "MMM DD");

  // Close the calendar popover on outside click.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  return (
    <div className={cn("flex items-center", gaps.md, "relative")}>
      {/* Previous day */}
      <Button
        id={prevId}
        size="sm"
        color="primary"
        shape="circle"
        variant="soft"
        onClick={onPrev}
        iconBefore={<ChevronLeftIcon size="sm" />}
        tooltip={{ text: "Previous day", position: "bottom" }}
      />

      {/* Date display / calendar picker */}
      <div className="relative">
        <Button
          onClick={() => setShowCalendar((s) => !s)}
          color="primary"
          variant="soft"
          className={cn(borderRadius.lg, transitions.normal)}
          iconBefore={<CalendarIcon size="sm" />}
        >
          {isToday ? "Today" : shortDate}
        </Button>

        {showCalendar && (
          <div
            ref={calendarRef}
            className={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20",
              "bg-base-100 border border-base-300 shadow-lg p-4",
              borderRadius.lg
            )}
          >
            <DayPicker
              mode="single"
              selected={new Date(currentDate + "T00:00:00")}
              onSelect={(day) => {
                if (day) {
                  onJump(formatDate(day, "YYYY-MM-DD"));
                  setShowCalendar(false);
                }
              }}
              disabled={(date) => date > new Date(todayISO + "T00:00:00")}
            />
          </div>
        )}
      </div>

      {/* Next day */}
      <Button
        id={nextId}
        size="sm"
        shape="circle"
        color="primary"
        variant="soft"
        onClick={onNext}
        disabled={isNextDisabled}
        iconBefore={<ChevronRightIcon size="sm" />}
        tooltip={{ text: "Next day", position: "bottom" }}
      />
    </div>
  );
}
