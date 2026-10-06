"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { PageHeader } from "@/components/shared/PageHeader";
import { PreSubmissionView } from "./PreSubmissionView";
import { PostSubmissionView } from "./PostSubmissionView";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import { HighPriorityEventNudge } from "@/components/shared/HighPriorityEventNudge";

import {
  AlertCircleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/shared/icons";

import { PlanService } from "@/lib/services/aavahana/plan.service";
import { useApi } from "@/lib/hooks/shared/use-api";

import { formatDate, addTime, cn } from "@/utils";
import {
  getIsoWeekStart,
  getIsoWeekEnd,
  getIsoWeekLabel,
} from "@/utils/shared/date.utils";

import { borderRadius, gaps, transitions } from "@/utils/shared/design.utils";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";

export function WeeklyPlanContainer() {
  const router = useRouter();

  // ===============================
  // STATE
  // ===============================

  const [currentWeekStart, setCurrentWeekStart] = useState<string>(
    getIsoWeekStart(new Date())
  );
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // ===============================
  // DATA
  // ===============================

  const {
    data: weeklyPlan,
    isLoading,
    error,
    refetch,
  } = useApi({
    queryKey: ["weekly-plan", currentWeekStart],
    queryFn: () => PlanService.getWeeklyPlan(currentWeekStart),
    retry: false,
  });

  const isSubmitted = weeklyPlan?.evaluation != null;

  // ===============================
  // WEEK NAVIGATION
  // ===============================

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeekStart = addTime(
      currentWeekStart,
      direction === "prev" ? -7 : 7,
      "day"
    );
    setCurrentWeekStart(formatDate(newWeekStart, "YYYY-MM-DD"));
  };

  const handleDateSelect = (date?: Date) => {
    if (!date) return;
    setCurrentWeekStart(getIsoWeekStart(date));
    setShowCalendar(false);
  };

  // ===============================
  // CALENDAR MODIFIERS
  // ===============================

  const modifiers = {
    selected: (date: Date) => getIsoWeekStart(date) === currentWeekStart,
  };

  const modifiersClassNames = {
    selected: "bg-primary text-primary-content rounded-lg font-bold",
  };

  // ===============================
  // SUBMISSION HANDLER
  // ===============================

  const handlePlanSubmitted = () => {
    refetch();
  };

  // ===============================
  // WEEK DISPLAY
  // ===============================

  const weekEndDate = getIsoWeekEnd(currentWeekStart);

  const weekRangeDisplay = `${formatDate(
    currentWeekStart,
    "MMM DD"
  )} - ${formatDate(weekEndDate, "MMM DD, YYYY")}`;

  const currentMondayISO = getIsoWeekStart(new Date());
  const isCurrentWeek = currentWeekStart === currentMondayISO;
  const isNextDisabled = currentWeekStart >= currentMondayISO;

  // ===============================
  // RENDER
  // ===============================

  if (isLoading) {
    return <OverlayLoading title="Loading Weekly Plan..." />;
  }

  return (
    <div className="weekly-plan-container overflow-x-hidden">
      {/* Page Header */}
      <PageHeader
        title={isCurrentWeek ? "Weekly Plan" : "Past Week"}
        subtitle={weekRangeDisplay}
      >
        <div className={cn("flex items-center", gaps.sm, "relative")}>
          {/* Previous */}
          <Button
            size="sm"
            shape="circle"
            color="secondary"
            variant="soft"
            onClick={() => navigateWeek("prev")}
            iconBefore={<ChevronLeftIcon size="sm" />}
            tooltip={{ text: "Previous", position: "bottom" }}
          />

          {/* Calendar */}
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
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCalendar(false)}
                />

                <div
                  className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-2",
                    "bg-base-100 border border-base-300 shadow-xl z-20",
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
                    disabled={(date) =>
                      date > new Date(currentMondayISO + "T00:00:00")
                    }
                    showOutsideDays
                    ISOWeek
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    footer={
                      <div className="text-xs dt-text-muted text-center mt-2 pt-2 border-t border-base-300">
                        Click any week to select
                      </div>
                    }
                  />

                  {/* Week labels */}
                  <div className="absolute left-0 top-[52px] flex flex-col pointer-events-none">
                    {Array.from({ length: 6 }).map((_, weekIndex) => {
                      const firstDayOfMonth = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        1
                      );

                      const firstMonday = new Date(
                        getIsoWeekStart(firstDayOfMonth) + "T00:00:00"
                      );

                      const thisWeekMonday = addTime(
                        firstMonday,
                        weekIndex * 7,
                        "day"
                      );

                      return (
                        <div
                          key={weekIndex}
                          className="h-10 flex items-center justify-end pr-2 text-xs font-semibold dt-text-dim"
                          style={{ width: "50px" }}
                        >
                          {getIsoWeekLabel(thisWeekMonday)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Next */}
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

      {/* Content */}
      <div className="mt-6">
        <div className="mb-5 px-1">
          <HighPriorityEventNudge
            compact
            sourceScreen="/aavahana/weekly-plan"
            headline="Planning your week — what growth events need protection?"
            subtext="A blocked calendar beat is worth 10 good intentions. Add non-negotiables now."
          />
        </div>
        {!isSubmitted ? (
          <EmptyState
            variant="error"
            title="Failed to load weekly plan"
            subtitle={error?.message || "An error occurred"}
            icon={<AlertCircleIcon size="xl" />}
          >
            <Button
              size="sm"
              color="primary"
              onClick={() => router.push(ROUTES.aavahana.weeklyPlan._)}
            >
              Retry
            </Button>
          </EmptyState>
        ) : weeklyPlan ? (
          <PostSubmissionView
            weeklyPlan={weeklyPlan}
            weekStart={currentWeekStart}
            onUpdate={() => refetch()}
          />
        ) : (
          <PreSubmissionView
            weekStart={currentWeekStart}
            onSubmitSuccess={handlePlanSubmitted}
          />
        )}
      </div>
    </div>
  );
}
