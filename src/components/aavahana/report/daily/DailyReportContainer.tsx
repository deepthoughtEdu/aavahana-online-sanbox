// components/daily-report/DailyReportContainer.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useDailyReport } from "@/lib/hooks/aavahana/use-daily-report";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { PreSubmissionView } from "./PreSubmissionView";
import { PostSubmissionView } from "./PostSubmissionView";
import { NudgeAlert } from "./NudgeAlert";
import { DailyReportV4Section } from "./DailyReportV4Section";
import { PastDateLockScreen } from "./PastDateLockScreen";
import { toast } from "@/utils";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/shared/icons";
import { logger } from "@/lib/managers/logger";

import {
  borderRadius,
  gaps,
  transitions,
  formatDate,
  startOf,
  canSubmitReport,
  getTimeUntilDeadline,
  cn,
  spacing,
} from "@/utils";
import { useApi } from "@/lib/hooks/shared/use-api";
import { PlanService } from "@/lib/services/aavahana/plan.service";
import type { DailyTask } from "@/types";

export function DailyReportContainer() {
  const {
    currentDate,
    isToday,
    reflection,
    activeFrameworks,
    isLoading,
    isSubmitting,
    isReportSubmitted,
    needsNudge,
    nudgeMessages,
    frameworkDescriptions,
    reportData,
    planTasks,
    submissionAttempt,
    setReflection,
    submitReport,
    submitFramework,
    updateReflection,
    goToPrevDay,
    goToNextDay,
    jumpToDate,
    isLoggingOut,
    hasLoggedOut,
    submitLogout,
  } = useDailyReport();
  // Targeted single-query fetches — avoids loading all 5 useDailyPlan sub-queries
  const { data: _todayPlan = [] as DailyTask[], error: todayPlanError } = useApi({
    queryFn: () => PlanService.getDailyPlan(currentDate),
    queryKey: ["daily-plan", currentDate],
  });
  const isPlanSubmitted = _todayPlan.length > 0;

  const { data: _loginStatus, error: loginStatusError } = useApi({
    queryFn: () => PlanService.checkLoginStatus(currentDate),
    queryKey: ["login-status", currentDate],
  });
  const hasLoggedIn = Boolean(_loginStatus?.loginAt);

  // Program labels — cached query replaces the raw Promise.then() call
  const { data: _labelsRaw, error: labelsError } = useApi({
    queryFn: () => PlanService.getProgramLabels(undefined, "framework"),
    queryKey: ["program-labels", "framework"],
  });
  const frameworks = useMemo(
    () =>
      (Array.isArray(_labelsRaw) ? _labelsRaw : []).map(
        (l) => l.name
      ),
    [_labelsRaw]
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState<Record<number, string>>({});
  const [selectedFramework, setSelectedFramework] = useState<string | null>(
    null
  );
  const [frameworkDesc, setFrameworkDesc] = useState("");
  const [isSubmittingFramework, setIsSubmittingFramework] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showNudge, setShowNudge] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  // Re-edit toggle for an already-submitted report. Lets the user revise task
  // statuses, add frameworks, or amend reflection without losing the submitted
  // state on the backend — resubmit overwrites planUpdates/reflection.
  const [isEditingReport, setIsEditingReport] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const todayISO = startOf(new Date(), "day", "format", "YYYY-MM-DD");
  const isPastDate = currentDate < todayISO;

  const isDeadlinePassed = isPastDate && !canSubmitReport(currentDate);
  const isSubmissionLocked = isPastDate && isDeadlinePassed;

  // Update time remaining every minute for past dates not yet past deadline
  useEffect(() => {
    if (isPastDate && !isDeadlinePassed) {
      const updateTimer = () => {
        setTimeRemaining(getTimeUntilDeadline(currentDate));
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);

      return () => clearInterval(interval);
    }
  }, [currentDate, isPastDate, isDeadlinePassed]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }

    // Attach listener only when calendar is shown
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `task-statuses-${currentDate}`;
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        try {
          const parsedStatuses = JSON.parse(saved);
          setTaskStatuses(parsedStatuses);
        } catch (e) {
          logger.error("Failed to parse saved task statuses", e);
        }
      } else {
        setTaskStatuses({});
      }
    }
  }, [currentDate]);

  // Exit edit mode whenever the user navigates to a different day so a stale
  // edit toggle doesn't leak across dates.
  useEffect(() => {
    setIsEditingReport(false);
  }, [currentDate]);

  // Seed task statuses from the submitted plan when the user opens the editor
  // for an already-submitted report. Without this the status pickers would
  // start blank and a resubmit could overwrite real statuses with "not started".
  useEffect(() => {
    if (isEditingReport && planTasks.length > 0) {
      setTaskStatuses((prev) => {
        const next: Record<number, string> = { ...prev };
        planTasks.forEach((task, idx) => {
          if (next[idx] === undefined && task.status) next[idx] = task.status;
        });
        return next;
      });
    }
  }, [isEditingReport, planTasks]);

  //show nudge for few seconds
  useEffect(() => {
    if (needsNudge && submissionAttempt > 0) {
      setShowNudge(true);
    }
    const timer = setTimeout(() => {
      setShowNudge(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [submissionAttempt, needsNudge]);

  //show timeline for few seconds
  useEffect(() => {
    if (!isDeadlinePassed && !isReportSubmitted) {
      setShowTimeline(true);
    }
    const timer = setTimeout(() => {
      setShowTimeline(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isDeadlinePassed, isReportSubmitted]);

  // FIXED: Memoized callback handlers
  const handleReflectionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setReflection(e.target.value);
    },
    [setReflection]
  );

  const handleTaskStatusChange = useCallback((idx: number, status: string) => {
    setTaskStatuses((p) => ({ ...p, [idx]: status }));
  }, []);

  const handleFrameworkDescChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFrameworkDesc(e.target.value);
    },
    []
  );

  const handleFrameworkClose = useCallback(() => {
    setSelectedFramework(null);
    setFrameworkDesc("");
  }, []);

  const handleFrameworkSelect = useCallback(
    (framework: string) => {
      setSelectedFramework(framework);

      if (frameworkDescriptions[framework]) {
        setFrameworkDesc(frameworkDescriptions[framework]);
      } else {
        setFrameworkDesc("");
      }
    },
    [frameworkDescriptions]
  );

  const handleSubmit = useCallback(async () => {
    const planUpdates = planTasks.map((task, idx) => ({
      index: idx,
      status: taskStatuses[idx] || task.status,
    }));
    await submitReport(planUpdates);
    // After a successful re-submit during edit, collapse back to read-only.
    if (isEditingReport) setIsEditingReport(false);
  }, [planTasks, taskStatuses, submitReport, isEditingReport]);

  const handleFrameworkSubmit = useCallback(async () => {
    if (!selectedFramework || !frameworkDesc.trim()) return;
    setIsSubmittingFramework(true);
    try {
      await submitFramework(selectedFramework, frameworkDesc);
      setSelectedFramework(null);
      setFrameworkDesc("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save framework"
      );
    } finally {
      setIsSubmittingFramework(false);
    }
  }, [selectedFramework, frameworkDesc, submitFramework]);

  const jumpToToday = useCallback(() => {
    jumpToDate(todayISO);
  }, [jumpToDate, todayISO]);

  const handleDateSelect = useCallback(
    (day: Date | undefined) => {
      if (day) {
        const isoDate = formatDate(day, "YYYY-MM-DD");
        jumpToDate(isoDate);
        setShowCalendar(false);
      }
    },
    [jumpToDate]
  );

  const { day, date, shortDate } = (() => {
    const dayName = formatDate(currentDate, "dddd");
    const fullDate = formatDate(currentDate, "MMMM DD, YYYY");
    const short = formatDate(currentDate, "MMM DD");
    return { day: dayName, date: fullDate, shortDate: short };
  })();

  const isNextDisabled = currentDate >= todayISO;

  if (isLoading) {
    return <OverlayLoading title="Loading daily report..." />;
  }

  return (
    <div className="daily-report-container">
      {(todayPlanError || loginStatusError || labelsError) && (
        <div className="alert alert-warning text-sm mb-2 mx-4 mt-2">
          <span>Some data failed to load. Please refresh if information looks incomplete.</span>
        </div>
      )}
      <PageHeader
        title={isToday ? "Daily Report" : "Past Report"}
        subtitle={`${day}, ${date}`}
      >
        <div className={cn("flex items-center ml-auto", gaps.md, "relative")}>
          {/* Previous Day Button */}
          <Button
            size="sm"
            color="primary"
            shape="circle"
            variant="soft"
            onClick={goToPrevDay}
            iconBefore={<ChevronLeftIcon size="sm" />}
            tooltip={{ text: "Previous day", position: "bottom" }}
          />

          {/* Date Display / Calendar Button */}
          <div className="relative">
            <Button
              onClick={() => setShowCalendar(!showCalendar)}
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
                  "absolute top-full -translate-x-1/2 mt-2",
                  "bg-base-100 border border-base-300 shadow-lg p-4 z-10",
                  borderRadius.lg
                )}
              >
                <DayPicker
                  mode="single"
                  selected={new Date(currentDate + "T00:00:00")}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date(todayISO + "T00:00:00")}
                />
              </div>
            )}
          </div>

          {/* Next Day Button */}
          <Button
            size="sm"
            shape="circle"
            color="primary"
            variant="soft"
            onClick={goToNextDay}
            disabled={isNextDisabled}
            iconBefore={<ChevronRightIcon size="sm" />}
            tooltip={{ text: "Next day", position: "bottom" }}
          />
        </div>
      </PageHeader>

      {needsNudge && showNudge && <NudgeAlert messages={nudgeMessages} />}

      {showTimeline && !isReportSubmitted && (
        <div
          className={cn(
            spacing.md,
            borderRadius.md,
            "border-none mb-4 ",
            "bg-primary/6"
          )}
        >
          <p className="text-warning font-medium">
            Time remaining to submit this report: {timeRemaining}
          </p>
          <p className="text-warning/80 text-sm mt-1">
            Reports must be submitted by 12:00 PM the next day
          </p>
        </div>
      )}

      {isSubmissionLocked && !isReportSubmitted ? (
        <PastDateLockScreen date={currentDate} onGoToToday={jumpToToday} />
      ) : isReportSubmitted && !isEditingReport ? (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              color="primary"
              variant="soft"
              onClick={() => setIsEditingReport(true)}
            >
              Edit report
            </Button>
          </div>
          <PostSubmissionView
            planTasks={planTasks}
            reportData={reportData}
            onUpdateReflection={updateReflection}
          />
          {/* PDGMS v4.0 structured sections (read-only after submission) */}
          <DailyReportV4Section date={currentDate} />
        </div>
      ) : (
        <div>
          {isEditingReport && (
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm dt-text-muted">
                Editing submitted report — update statuses, add frameworks, or
                amend your reflection, then re-submit.
              </p>
              <Button
                size="sm"
                variant="ghost"
                color="secondary"
                onClick={() => setIsEditingReport(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          <PreSubmissionView
            reflection={reflection}
            isSubmitting={isSubmitting}
            planTasks={planTasks}
            activeFrameworks={activeFrameworks}
            taskStatuses={taskStatuses}
            selectedFramework={selectedFramework}
            frameworkDesc={frameworkDesc}
            isSubmittingFramework={isSubmittingFramework}
            FRAMEWORKS={frameworks}
            isLoggingOut={isLoggingOut}
            hasLoggedOut={hasLoggedOut}
            hasLoggedIn={hasLoggedIn}
            isPlanSubmitted={isPlanSubmitted}
            onReflectionChange={handleReflectionChange}
            onSubmit={handleSubmit}
            onTaskStatusChange={handleTaskStatusChange}
            onFrameworkSelect={handleFrameworkSelect}
            onFrameworkDescChange={handleFrameworkDescChange}
            onFrameworkClose={handleFrameworkClose}
            onFrameworkSubmit={handleFrameworkSubmit}
            onLogout={submitLogout}
            isEditingSubmitted={isEditingReport}
          />
          {/* PDGMS v4.0 structured sections (voice → LLM → edit → submit) */}
          <DailyReportV4Section date={currentDate} />
        </div>
      )}
    </div>
  );
}
