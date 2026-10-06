"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { PageHeader } from "@/components/shared/PageHeader";
import { WeeklyKPICards } from "./WeeklyKPICards";
import { DailyBreakdownChart } from "./DailyBreakdownChart";
import { DailyBreakdownTable } from "./DailyBreakdownTable";
import { UnplannedWorkCalendar } from "./UnplannedWorkCalendar";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
} from "@/components/shared/icons";
import { ReportService } from "@/lib/services/aavahana/report.service";
import { useApi } from "@/lib/hooks/shared/use-api";
import { formatDate, addTime, startOf, cn } from "@/utils";
import { borderRadius, gaps, transitions } from "@/utils/shared/design.utils";
import { WeeklyKPIs, DailyBreakdownItem, ReportTaskType } from "@/types";

export function WeeklyReportContainer() {
  // ============================================
  // STATE
  // ============================================

  const [currentWeekStart, setCurrentWeekStart] = useState<string>(
    formatDate(startOf(new Date(), "week"), "YYYY-MM-DD")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // ============================================
  // FETCH WEEKLY REPORT
  // ============================================

  const {
    data: weeklyReport,
    isLoading,
    error,
    refetch,
  } = useApi({
    queryKey: ["weekly-report", currentWeekStart],
    queryFn: () => ReportService.getWeeklyReport(currentWeekStart),
    retry: false,
  });

  // ============================================
  // WEEK NAVIGATION
  // ============================================

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeekStart = addTime(
      currentWeekStart,
      direction === "prev" ? -7 : 7,
      "day"
    );
    setCurrentWeekStart(formatDate(newWeekStart, "YYYY-MM-DD"));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const monday = startOf(date, "week");
      setCurrentWeekStart(formatDate(monday, "YYYY-MM-DD"));
      setShowCalendar(false);
    }
  };

  // ============================================
  // WEEK CALCULATION HELPERS
  // ============================================

  const getWeekNumber = (date: Date): number => {
    const currentMonday = startOf(new Date(), "week");
    const targetMonday = startOf(date, "week");
    const diffDays = Math.floor(
      (currentMonday.getTime() - targetMonday.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.floor(diffDays / 7);
  };

  const getWeekLabel = (date: Date): string => {
    const weeksAgo = getWeekNumber(date);
    if (weeksAgo === 0) return "This Week";
    if (weeksAgo > 0) return `W-${weeksAgo}`;
    return `W+${Math.abs(weeksAgo)}`;
  };

  const modifiers = {
    selected: (date: Date) => {
      const monday = startOf(date, "week");
      return formatDate(monday, "YYYY-MM-DD") === currentWeekStart;
    },
  };

  const modifiersClassNames = {
    selected: "bg-primary text-primary-content rounded-lg font-bold",
  };

  // ============================================
  // DATA CALCULATIONS
  // ============================================

  const calculateKPIs = (): WeeklyKPIs => {
    if (!weeklyReport) {
      return {
        completed: 0,
        planned: 0,
        backlog: 0,
        inProgress: 0,
        frameworksImplemented: 0,
        ipContributions: 0,
      };
    }

    let completed = 0;
    let planned = 0;
    let backlog = 0;
    let inProgress = 0;
    let frameworksImplemented = 0;

    weeklyReport.days.forEach((day) => {
      day.plan.forEach((task) => {
        if (task.status === "completed") completed++;
        if (task.type === ReportTaskType.PLANNED) planned++;
        if (task.type === ReportTaskType.BACKLOG) backlog++;
        if (task.status === "in_progress") inProgress++;
      });

      frameworksImplemented += day.frameworks.length;
    });

    // IP Contributions - TODO: Get from daily plan API
    const ipContributions = 6;

    return {
      completed,
      planned,
      backlog,
      inProgress,
      frameworksImplemented,
      ipContributions,
    };
  };

  const calculateDailyBreakdown = (): DailyBreakdownItem[] => {
    if (!weeklyReport) return [];

    return weeklyReport.days.map((day) => {
      const dayName = formatDate(day.date, "dddd");
      let planned = 0;
      let completed = 0;
      let backlog = 0;
      let unplanned = 0;

      day.plan.forEach((task) => {
        if (task.type === ReportTaskType.PLANNED) planned++;
        if (task.status === "completed") completed++;
        if (task.type === ReportTaskType.BACKLOG) backlog++;
        if (task.type === ReportTaskType.UNPLANNED) unplanned++;
      });

      return {
        day: dayName,
        date: day.date,
        planned,
        completed,
        backlog,
        unplanned,
      };
    });
  };

  const kpis = calculateKPIs();
  const dailyBreakdown = calculateDailyBreakdown();

  const weekEndDate = addTime(currentWeekStart, 6, "day");
  const weekRange = `${formatDate(currentWeekStart, "MMM DD")} - ${formatDate(
    weekEndDate,
    "MMM DD, YYYY"
  )}`;

  const currentMondayISO = formatDate(
    startOf(new Date(), "week"),
    "YYYY-MM-DD"
  );
  const isCurrentWeek = currentWeekStart === currentMondayISO;
  const isNextDisabled = currentWeekStart >= currentMondayISO;

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return <OverlayLoading title="Loading Weekly Report..." />;
  }

  return (
    <div className="weekly-report-container">
      {/* Page Header with Navigation */}
      <PageHeader
        title={isCurrentWeek ? "Weekly Report" : "Past Week Report"}
        subtitle={weekRange}
      >
        <div className={cn("flex items-center", gaps.sm, "relative")}>
          {/* Previous Week Button */}
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            onClick={() => navigateWeek("prev")}
            iconBefore={<ChevronLeftIcon size="sm" />}
            tooltip={{ text: "Previous", position: "bottom" }}
          />

          {/* Week Display / Calendar Button */}
          <div className="relative">
            <Button
              onClick={() => setShowCalendar(!showCalendar)}
              color="secondary"
              variant="soft"
              className={cn(borderRadius.lg, transitions.normal)}
              iconBefore={<CalendarIcon size="sm" />}
            >
              {isCurrentWeek
                ? "This Week"
                : formatDate(currentWeekStart, "MMM DD")}
            </Button>

            {showCalendar && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCalendar(false)}
                />

                {/* Calendar Dropdown */}
                <div
                  className={cn(
                    "absolute top-full -translate-x-1/2 mt-2",
                    "bg-base-100 border border-base-300 z-20",
                    "pl-14 pr-4 py-4 relative",
                    borderRadius.lg
                  )}
                >
                  <DayPicker
                    mode="single"
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={new Date(currentWeekStart + "T00:00:00")}
                    onSelect={handleDateSelect}
                    showOutsideDays
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                  />

                  {/* Week labels overlay */}
                  <div className="absolute left-0 top-[52px] flex flex-col pointer-events-none">
                    {Array.from({ length: 6 }).map((_, weekIndex) => {
                      const firstDayOfMonth = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        1
                      );
                      const firstMonday = startOf(firstDayOfMonth, "week");
                      const thisWeekMonday = addTime(
                        firstMonday,
                        weekIndex * 7,
                        "day"
                      );
                      const weekLabel = getWeekLabel(thisWeekMonday);

                      return (
                        <div
                          key={weekIndex}
                          className="h-10 flex items-center justify-end pr-2 text-xs font-semibold dt-text-dim"
                          style={{ width: "50px" }}
                        >
                          {weekLabel}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Next Week Button */}
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            onClick={() => navigateWeek("next")}
            disabled={isNextDisabled}
            iconBefore={<ChevronRightIcon size="sm" />}
            tooltip={{ text: "Next", position: "bottom" }}
          />
        </div>
      </PageHeader>

      {/* Error State */}
      {error && (
        <EmptyState
          variant="error"
          title="Failed to load weekly report"
          subtitle={error.message || "An error occurred"}
        >
          <Button size="sm" color="primary" onClick={() => refetch()}>
            Retry
          </Button>
        </EmptyState>
      )}

      {/* Empty State
      {!error && !hasData && (
        <EmptyState
          variant="empty"
          title="No data for this week"
          subtitle="There are no daily reports for this week yet."
          icon={<InboxIcon size="xl" />}
        >
          <Button
            size="sm"
            color="secondary"
            onClick={() => navigateWeek("prev")}
          >
            View Previous Week
          </Button>
        </EmptyState>
      )} */}

      {/* Content */}

      <div className={cn("mt-6", gaps["2xl"], "space-y-5")}>
        <WeeklyKPICards kpis={kpis} />

        <div className={cn("grid grid-cols-1 lg:grid-cols-2", gaps.xl)}>
          <DailyBreakdownChart data={dailyBreakdown} />
          <DailyBreakdownTable data={dailyBreakdown} />
        </div>

        <UnplannedWorkCalendar data={dailyBreakdown} />
      </div>
    </div>
  );
}
